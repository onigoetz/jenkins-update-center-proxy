import got from "got";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

export const PORT = process.env.PORT || 3000;
export const PROXY = process.env.HTTP_PROXY || process.env.http_proxy || null;
export const PROXY_TARGET =
  process.env.REMOTE_UPDATE_CENTER || "https://updates.jenkins.io/";
export const REPLACE_TARGET =
  process.env.REMOTE_UPDATE_CENTER_SEARCH || "https://updates.jenkins.io/";
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
      errorCodes: [
        //'ETIMEDOUT', // Don't retry on timeouts as they might be caused by proxy issues
        'ECONNRESET',
        'EADDRINUSE',
        'ECONNREFUSED',
        'EPIPE',
        'ENOTFOUND',
        'ENETUNREACH',
        'EAI_AGAIN'
      ],
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
  request: GLOBAL_TIMEOUT
}

export const gotInstance = got.extend(gotOptions);

export function buildRemoteUrl(remotePath) {

  // to extract search and pathname
  const remote = new URL(remotePath, 'http://random.com')

  const final = new URL(PROXY_TARGET);

  final.pathname = final.pathname.replace(/\/$/, "") + remote.pathname;
  final.search = remote.search

  return final;
}
