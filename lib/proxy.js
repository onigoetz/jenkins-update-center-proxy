import webOutgoing from "http-proxy/lib/http-proxy/passes/web-outgoing.js";

const outgoingPasses = [
  webOutgoing.removeChunked,
  webOutgoing.setConnection,
  //webOutgoing.setRedirectHostRewrite,
  webOutgoing.writeHeaders,
  webOutgoing.writeStatusCode,
];

const proxyOptions = {
  cookieDomainRewrite: false,
  cookiePathRewrite: false,
  preserveHeaderKeyCase: true
}

export function setHeaders(req, res, proxyRes) {
  // Properly set headers
  for (var i = 0; i < outgoingPasses.length; i++) {
    if (outgoingPasses[i](req, res, proxyRes, proxyOptions)) {
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
}
