const redirectRegex = /^201|30(1|2|7|8)$/;

export function setHeaders(req, res, proxyRes, options = {}) {
  // Set the content type
  res.setHeader("content-type", proxyRes.headers["content-type"]);

  // Set the status code from proxy response
  if (proxyRes.statusMessage) {
    res.statusCode = proxyRes.statusCode;
    res.statusMessage = proxyRes.statusMessage;
  } else {
    res.statusCode = proxyRes.statusCode;
  }

  // Rewrite redirect
  if (
    (options.hostRewrite || options.autoRewrite || options.protocolRewrite) &&
    proxyRes.headers["location"] &&
    redirectRegex.test(proxyRes.statusCode)
  ) {
    const target = new URL(options.target);
    const u = new URL(proxyRes.headers["location"]);

    // make sure the redirected host matches the target host before rewriting
    if (target.host != u.host) {
      return {
        requested: proxyRes.url,
        redirectTo: proxyRes.headers["location"]
      };
    }

    if (options.hostRewrite) {
      u.host = options.hostRewrite;
    } else if (options.autoRewrite) {
      u.host = req.headers["host"];
    }
    if (options.protocolRewrite) {
      u.protocol = options.protocolRewrite;
    }

    res.setHeader("location", u.toString());
  }
}
