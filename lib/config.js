import got from "got";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

export const PORT = process.env.PORT || 3000;
export const PROXY = process.env.HTTP_PROXY || process.env.htp_proxy || null;
export const PROXY_TARGET =
  process.env.REMOTE_UPDATE_CENTER || "https://updates.jenkins.io/";
export const RETURN =
  process.env.LOCAL_UPDATE_CENTER || "http://localhost:3000";
export const CACHE_DIR = process.env.CACHE_DIR || "cache";

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
        }),
      },
      retry: {
        limit: 4,
        statusCodes: [407, 408, 413, 429, 500, 502, 503, 504, 521, 522, 524] // Also retry on 407
      }
    }
  : {};

export const gotInstance = got.extend(gotOptions);
