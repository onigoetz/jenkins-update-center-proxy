import path from "path";
import fs from "fs";
import send from "koa-send";
import { PassThrough } from "stream";
import got, { RequestError } from "got";

import { setHeaders } from "./proxy.js";

const pluginUrlRegex =
  /\/plugins\/([-_A-Za-z0-9]+)\/([-0-9A-Z\.]+)\/[^.]+\.hpi$/;

function getDestination(cacheDir, filePath) {
  const [, plugin, version] = pluginUrlRegex.exec(filePath);

  return path.join(cacheDir, "plugins", plugin, `${version}.hpi`);
}

function isCacheable(url) {
  return pluginUrlRegex.test(url);
}

function fileExists(cacheDir, file) {
  try {
    return fs.statSync(getDestination(cacheDir, file)).isFile();
  } catch (e) {
    return false;
  }
}

async function writeFile(destination, fileStream) {
  // FIXME: Cache writing is broken at the moment
  return;

  console.log("Writing file to", destination);
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  const writeStream = fs.createWriteStream(destination, {
    highWaterMark: 128 * 1024 * 2000,
  });
  writeStream.on("error", function (err) {
    console.log("Could not write to cache", err);
  });
  writeStream.on("close", function () {
    console.log("file: close", writeStream.bytesWritten);
  });
  writeStream.on("finish", function () {
    console.log("file: finish", writeStream.bytesWritten);
  });
  writeStream.on("drain", function () {
    console.log("file: drain", writeStream.bytesWritten);
  });
  fileStream.pipe(writeStream);
  fileStream.on("end", () => {
    console.log("Finished streaming to file", writeStream.bytesWritten);
    //writeStream.end();
  });
}

async function storeFile(ctx, cacheDir, targetOrigin) {
  const proxyRes = await getFile(ctx, cacheDir, targetOrigin);

  return new Promise((resolve, reject) => {
    // There is a weird control flow
    // If we already have the file, we're sending it.
    // But for Koa to be happy, we have to wait on the promise before closing the stream
    // This stream is bubbled up using the Exception we've thrown to stop the original request.
    proxyRes.on("error", (error) => {
      if (error.promise) {
        resolve(error.promise);
      } else {
        reject(error);
      }
    });

    proxyRes.on("response", (response) => {
      // Create a PassThrough stream to read it twice
      // without getting the data to flow too soon
      const streaming = new PassThrough();

      // Store the file if after all the redirects it ends with a cacheable URL
      if (response.redirectUrls) {
        const finalDestination =
          response.redirectUrls[response.redirectUrls.length - 1];
        if (isCacheable(finalDestination)) {
          const destination = getDestination(cacheDir, finalDestination);
          writeFile(destination, streaming);
        }
      }

      setHeaders(ctx.req, ctx.res, response);
      streaming.pipe(ctx.res);
      streaming.on("end", () => {
        console.log("Finished streaming to network");
        resolve();
      });

      // Piping proxyRes to streaming
      // if we were to read from "proxyRes" directly,
      // the first to read from it would start streaming
      // and stop the second one from reading
      proxyRes.pipe(streaming);

      proxyRes.on("end", () => {
        console.log("Finished streaming from source");
      });
    });
  });
}

async function getFile(ctx, cacheDir, targetOrigin) {
  try {
    return got(new URL(ctx.url, targetOrigin), {
      isStream: true,
      hooks: {
        beforeRedirect: [
          (options, typedResponse) => {
            if (!isCacheable(options.url.pathname)) {
              return;
            }

            if (!fileExists(cacheDir, options.url.pathname)) {
              return;
            }

            const destination = getDestination(cacheDir, options.url.pathname);
            const sendPromise = send(ctx, destination, { immutable: true });

            // To stop the got request, we throw an error
            // We use that error to bubble up the promise so that we can wait on the file send to finish
            const requestError = new RequestError(
              "We already have this, sending it",
              {}
            );
            requestError.promise = sendPromise;

            throw requestError;
          },
        ],
      },
    });
  } catch (error) {
    console.log({ error });
    return error.response;
  }
}

export default function createFileProxy(PROXY_TARGET, CACHE) {
  const targetOrigin = new URL(PROXY_TARGET).origin;

  return (ctx) => {
    // If the file already exists, serve it from local cache
    if (isCacheable(ctx.req.url) && fileExists(CACHE, ctx.req.url)) {
      const destination = getDestination(CACHE, ctx.req.url);
      return send(ctx, destination, { immutable: true });
    }

    return storeFile(ctx, CACHE, targetOrigin);
  };
}
