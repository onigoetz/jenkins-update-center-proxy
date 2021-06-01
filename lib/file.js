import path from "path";
import fs from "fs";
import send from "koa-send";
import got from "got";

import { setHeaders } from "./proxy.js";

const latestRegex = /\/latest\//;

function getDestination(cacheDir, filePath) {
  return path.join(cacheDir, filePath);
}

async function writeFile(destination, fileStream) {
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  const writeStream = fs.createWriteStream(destination);
  fileStream.pipe(writeStream)
  fileStream.on("end", () => {
    writeStream.end();
  });
}

async function storeFile(ctx, cacheDir, targetOrigin) {
  const proxyRes = await getFile(targetOrigin, ctx);

  // Write the file to cache
  // Skip urls containing /latest/
  if (!latestRegex.test(ctx.req.url)) {
    const destination = getDestination(cacheDir, ctx.req.url);
    writeFile(destination, proxyRes);
  }

  /*proxyRes.on("redirect", (typedResponse, options) => {
    console.log("Redirect", typedResponse.requestUrl, options.url.href);
  });*/

  return new Promise((resolve) => {
    proxyRes.on("response", (response) => {
      setHeaders(ctx.req, ctx.res, response);
      proxyRes.pipe(ctx.res);
      proxyRes.on("end", () => {
        resolve();
      });
    });
  });
}

function fileExists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch (e) {
    return false;
  }
}

async function getFile(targetOrigin, ctx) {
  try {
    return got(new URL(ctx.url, targetOrigin), {
      isStream: true,
      hooks: {
        /*beforeRedirect: [
          (options, typedResponse) => {
            console.log("beforeRedirect", options, typedResponse);
          }
        ]*/
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
    const destination = getDestination(CACHE, ctx.req.url);

    // If the file already exists, serve it from local cache
    if (fileExists(destination)) {
      return send(ctx, destination, { immutable: true });
    }

    return storeFile(ctx, CACHE, targetOrigin);
  };
}
