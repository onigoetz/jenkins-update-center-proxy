import httpProxy from "http-proxy";
import web_o from "http-proxy/lib/http-proxy/passes/web-outgoing.js";

const outgoing_passes = Object.values(web_o);

function createProxy(target, options, onResponse) {
  const proxy = httpProxy.createProxyServer({
    selfHandleResponse: true, // Allows to rewrite responses
    changeOrigin: true, // Fix origin for HTTPS socket
    target,
    ...options,
  });

  // Called when the proxy has a Request
  proxy.on("proxyReq", function (proxyReq, req, res, options) {
    // Store options to use them in `proxyRes`
    req.options = options;
  });

  proxy.on("proxyRes", function (proxyRes, req, res) {
    // Properly set headers
    for (var i = 0; i < outgoing_passes.length; i++) {
      if (outgoing_passes[i](req, res, proxyRes, req.options)) {
        break;
      }
    }

    // Due to the pretty simple nature of this proxy
    // we remove the caching tags and other common tags
    // versioned files should have an infinite lifespan anyway
    res.removeHeader("accept-ranges");
    res.removeHeader("content-length");
    res.removeHeader("etag");
    res.removeHeader("last-modified");
    res.removeHeader("server");

    onResponse(proxyRes, req, res, req.options);

    proxyRes.on("end", function () {
      req.resolver();
    });
  });

  return function (ctx) {
    return new Promise((resolve, reject) => {
      // Store the resolve on the context so we can resolve it when the response is done
      ctx.req.resolver = resolve;

      proxy.web(ctx.req, ctx.res, {}, (e) => reject(e));
    });
  };
}

export default createProxy;
