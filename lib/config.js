import got from "got";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

export const PORT = process.env.PORT || 3000;
export const PROXY = process.env.HTTP_PROXY || process.env.http_proxy || null;
export const PROXY_TARGET =
  process.env.REMOTE_UPDATE_CENTER || "https://updates.jenkins.io/";
export const RETURN =
  process.env.LOCAL_UPDATE_CENTER || "http://localhost:3000";
export const CACHE_DIR = process.env.CACHE_DIR || "cache";
export const GLOBAL_TIMEOUT = +process.env.GLOBAL_TIMEOUT || 25000;

const gotOptions = PROXY
  ? {
    agent: {
      http: new HttpProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 10000,
        maxSockets: 256,
        maxFreeSockets: 256,
        proxy: PROXY,
      }),
      https: new HttpsProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 10000,
        maxSockets: 256,
        maxFreeSockets: 256,
        proxy: PROXY,
        rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0"
      }),
    },
    retry: {
      limit: 4,
      statusCodes: [407, 408, 413, 429, 500, 502, 503, 504, 521, 522, 524] // Also retry on 407
    }
  }
  : {
    https: {
      rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0"
    }
  };

// https://github.com/sindresorhus/got/blob/HEAD/documentation/6-timeout.md
gotOptions.timeout = {
  // Set a high global timeout as
  // some files can take time to download
  request: GLOBAL_TIMEOUT,

  // Set specific timeouts to fail
  // early in case other things go wrong
  lookup: 200,
  connect: 200,
  secureConnect: 200,
  socket: 1000,
  send: 10000,
  response: 1000
}

export const gotInstance = got.extend(gotOptions);
