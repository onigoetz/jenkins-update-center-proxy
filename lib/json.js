import { URL } from "url";
import got from "got";
import { setHeaders } from "./proxy.js";

async function getJson(targetOrigin, ctx) {
  try {
    // We need to send the redirects back to the client
    // Jenkins' install-plugins.sh script needs them to infer the install URL base correctly
    return await got(new URL(ctx.url, targetOrigin), { followRedirect: false });
  } catch (error) {
    return error.response;
  }
}

export default (PROXY_TARGET, RETURN) => {
  const incoming = new URL(RETURN);

  const targetRegex = new RegExp(
    new URL(PROXY_TARGET).origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "g"
  );

  const targetOrigin = new URL(PROXY_TARGET).origin;

  return async (ctx) => {
    const proxyRes = await getJson(targetOrigin, ctx);

    setHeaders(ctx.req, ctx.res, proxyRes, {
      // Needed to rewrite location on redirects
      target: PROXY_TARGET,
      hostRewrite: incoming.host,
      protocolRewrite: incoming.protocol,
    });

    ctx.res.end(proxyRes.body.replace(targetRegex, incoming.origin));
  };
};
