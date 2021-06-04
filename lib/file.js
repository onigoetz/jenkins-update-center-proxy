import path from "path";
import fs from "fs";
import send from "koa-send";
import { PassThrough } from "stream";
import { RequestError } from "got";

import { PROXY_TARGET, CACHE_DIR, gotInstance } from "./config.js";
import { setHeaders } from "./proxy.js";

const pluginUrlRegex = /\/plugins\/([-_A-Za-z0-9]+)\/([-0-9A-Z\.]+)\/[^.]+\.hpi$/;

function getDestination(filePath) {
  const [, plugin, version] = pluginUrlRegex.exec(filePath);

  return path.join(CACHE_DIR, "plugins", plugin, `${version}.hpi`);
}

function isCacheable(url) {
  return pluginUrlRegex.test(url);
}

function fileExists(file) {
  try {
    return fs.statSync(getDestination(file)).isFile();
  } catch (e) {
    return false;
  }
}

async function writeFile(destination, fileStream) {
  // We have to create the dir synchronously, 
  // otherwise the stream will start sending data before we even registered to it
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  
  const writeStream = fs.createWriteStream(destination);
  fileStream.pipe(writeStream);
}

async function storeFile(ctx, targetOrigin) {
  const proxyRes = await getFile(ctx, targetOrigin);

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
          const destination = getDestination(finalDestination);
          writeFile(destination, streaming);
        }
      }

      setHeaders(ctx.req, ctx.res, response);
      streaming.pipe(ctx.res);
      streaming.on("end", () => {
        resolve();
      });

      // Piping proxyRes to streaming
      // if we were to read from "proxyRes" directly,
      // the first to read from it would start streaming
      // and stop the second one from reading
      proxyRes.pipe(streaming);
    });
  });
}

async function getFile(ctx, targetOrigin) {
  try {
    ctx.externalRequests += 1;

    return gotInstance(new URL(ctx.url, targetOrigin), {
      isStream: true,
      hooks: {
        beforeRedirect: [
          (options, typedResponse) => {
            // If it can't be cached or isn't there
            // we follow on the redirect
            if (!isCacheable(options.url.pathname) || !fileExists(options.url.pathname)) {
              ctx.externalRequests += 1;
              return;
            }

            ctx.cacheHit = true;

            const destination = getDestination(options.url.pathname);
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
    console.error({ error });
    return error.response;
  }
}

export default function createFileProxy() {
  const targetOrigin = new URL(PROXY_TARGET).origin;

  return (ctx) => {
    // If the file already exists, serve it from local cache
    if (isCacheable(ctx.req.url) && fileExists(ctx.req.url)) {
      const destination = getDestination(ctx.req.url);
      return send(ctx, destination, { immutable: true });
    }

    return storeFile(ctx, targetOrigin);
  };
}
