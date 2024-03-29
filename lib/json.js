import { URL } from "url";
import { KeyvLruManagedTtl } from "keyv-lru";

import { setHeaders } from "./proxy.js";
import { REPLACE_TARGET, PROXY_TARGET, RETURN, gotInstance, buildRemoteUrl } from "./config.js";

const options = {
  max: 100,
  notify: false,
  ttl: 1000 * 60 * 5, // 5 minutes cache
};
const cache = new KeyvLruManagedTtl(options);

async function getJson(ctx) {
  try {
    // We need to send the redirects back to the client
    // Jenkins' install-plugins.sh script needs them to infer the install URL base correctly
    return gotInstance(buildRemoteUrl(ctx.url), {
      cache,
      // https://github.com/kornelski/http-cache-semantics#constructor-options
      cacheOptions: {
        // Usually JSON files served by the update center aren't old
        // This means we should keep them for 10 times longer than their age
        // Anyway the cache itself will evict the files after a few minutes
        cacheHeuristic: 10
      },
      followRedirect: false
    });
  } catch (error) {
    console.log("Failed with error", error);
    return error.response;
  }
}

export default () => {
  const incoming = new URL(RETURN);

  const targetRegex = new RegExp(
    new URL(REPLACE_TARGET).origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "g"
  );

  const headersOptions = {
    // Needed to rewrite location on redirects
    target: PROXY_TARGET,
    hostRewrite: incoming.host,
    protocolRewrite: incoming.protocol,
  };

  return async (ctx) => {
    const proxyRes = await getJson(ctx);

    setHeaders(ctx.req, ctx.res, proxyRes, headersOptions);

    ctx.res.end(proxyRes.body.replace(targetRegex, incoming.origin));
  };
};
