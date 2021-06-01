import { URL } from "url";
import got from "got";
import { setHeaders } from "./proxy.js";

async function getJson(targetOrigin, ctx) {
  try {
    return await got(new URL(ctx.url, targetOrigin));
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

    setHeaders(ctx.req, ctx.res, proxyRes);

    ctx.res.end(proxyRes.body.replace(targetRegex, incoming.origin));
  };
};
