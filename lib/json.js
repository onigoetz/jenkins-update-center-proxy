import { URL } from "url";

import createProxy from "./proxy.js";

function transformJson(proxyRes, req, res, oldTarget, newTarget) {
  // Rewrite target within JSON
  const body = [];
  proxyRes.on("data", function (chunk) {
    body.push(chunk);
  });
  proxyRes.on("end", function () {
    res.end(Buffer.concat(body).toString().replace(oldTarget, newTarget));
  });
}

export default (PROXY_TARGET, RETURN) => {
  const incoming = new URL(RETURN);

  const targetRegex = new RegExp(
    new URL(PROXY_TARGET).origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "g"
  );

  return createProxy(
    PROXY_TARGET,
    {
      hostRewrite: incoming.host, // Rewrite location on redirects
      protocolRewrite: incoming.protocol, // Rewrite location on redirects
    },
    (proxyRes, req, res, options) => {
      return transformJson(proxyRes, req, res, targetRegex, incoming.origin);
    }
  );
};
