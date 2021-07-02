import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";

import { PROXY_TARGET, CACHE_DIR, gotInstance } from "./config.js";
import { setHeaders } from "./proxy.js";

const pluginUrlRegex = /\/plugins\/([-_A-Za-z0-9]+)\/([-0-9A-Z\.]+)\/[^.]+\.hpi$/;

const cache = {
  async get(key) {
    if (isCacheable(key) && fileExists(key)) {
      return fsPromises.readFile(getDestination(key), {
        encoding: "UTF-8",
      });
    }

    return undefined;
  },
  async set(key, value, ttl) {
    // Only cache on statusCode 200
    if (!/"statusCode":200/.test(value)) {
      return true;
    }

    if (isCacheable(key)) {
      const destination = getDestination(key);

      // We have to create the dir synchronously,
      // otherwise the stream will start sending data before we even registered to it
      fs.mkdirSync(path.dirname(destination), { recursive: true });

      await fsPromises.writeFile(destination, value);
    }

    return true;
  },
  async delete(key) {
    const destination = getDestination(key);
    await fsPromises.unlink(destination)

    return true;
  },
  async clear() {
    return true;
  },
};

function getDestination(filePath) {
  const [, plugin, version] = pluginUrlRegex.exec(filePath);

  return path.join(CACHE_DIR, "plugins", plugin, `${version}.json`);
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

async function storeFile(ctx, targetOrigin) {
  const proxyRes = await getFile(ctx, targetOrigin);

  return new Promise((resolve, reject) => {
    proxyRes.on("error", reject);

    proxyRes.on("response", (response) => {
      setHeaders(ctx.req, ctx.res, response);
      proxyRes.on("end", resolve);
      proxyRes.pipe(ctx.res);
    });
  });
}

async function getFile(ctx, targetOrigin) {
  try {
    return gotInstance(new URL(ctx.url, targetOrigin), {
      cache,
      cacheOptions: {
        cacheHeuristic: 10000 // Used as a fraction of the file age, a default heuristic of 0.1 means that a 100 days old file will be cached 10 days. On the contrary we want to increase that time since we only cache immutable versions
      },
      throwHttpErrors: false,
      isStream: true,
    });
  } catch (error) {
    console.error({ error });
    return error.response;
  }
}

export default function createFileProxy() {
  const targetOrigin = new URL(PROXY_TARGET).origin;

  return (ctx) => {
    return storeFile(ctx, targetOrigin);
  };
}
