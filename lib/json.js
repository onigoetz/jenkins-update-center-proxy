import { URL } from "url";

import { setHeaders } from "./proxy.js";
import { PROXY_TARGET, RETURN, gotInstance } from "./config.js";

async function getJson(targetOrigin, ctx) {
  try {
    ctx.externalRequests += 1;
    // We need to send the redirects back to the client
    // Jenkins' install-plugins.sh script needs them to infer the install URL base correctly
    return gotInstance(new URL(ctx.url, targetOrigin), { followRedirect: false });
  } catch (error) {
    console.log("Failed with error", error);
    return error.response;
  }
}

export default () => {
  const incoming = new URL(RETURN);

  const targetRegex = new RegExp(
    new URL(PROXY_TARGET).origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "g"
  );

  const targetOrigin = new URL(PROXY_TARGET).origin;

  const headersOptions = {
    // Needed to rewrite location on redirects
    target: PROXY_TARGET,
    hostRewrite: incoming.host,
    protocolRewrite: incoming.protocol,
  };

  return async (ctx) => {
    const proxyRes = await getJson(targetOrigin, ctx);

    setHeaders(ctx.req, ctx.res, proxyRes, headersOptions);

    ctx.res.end(proxyRes.body.replace(targetRegex, incoming.origin));
  };
};
