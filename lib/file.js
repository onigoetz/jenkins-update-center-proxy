import path from "path";
import fs from "fs";
import send from "koa-send";

import createProxy from "./proxy.js";

const latestRegex = /\/latest\//;

function getDestination(cacheDir, filePath) {
  return path.join(cacheDir, filePath);
}

async function storeFile(proxyRes, req, res, cacheDir) {
  // Write the file to cache
  // Skip urls containing /latest/
  if (!latestRegex.test(req.url)) {
    const destination = getDestination(cacheDir, req.url);
    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    const writeStream = fs.createWriteStream(destination);
    proxyRes.pipe(writeStream);
    proxyRes.on("end", function () {
      writeStream.end();
    });
  }

  // Write file to output
  proxyRes.pipe(res);
}

function fileExists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch (e) {
    return false;
  }
}

export default function createFileProxy(PROXY_TARGET, CACHE) {
  const fileProxy = createProxy(
    PROXY_TARGET,
    {
      followRedirects: true,
    },
    (proxyRes, req, res, options) => {
      return storeFile(proxyRes, req, res, CACHE);
    }
  );

  return (ctx) => {
    const destination = getDestination(CACHE, ctx.req.url);

    // If the file already exists, serve it from local cache
    if (fileExists(destination)) {
      return send(ctx, destination, { immutable: true });
    }

    return fileProxy(ctx);
  };
}
