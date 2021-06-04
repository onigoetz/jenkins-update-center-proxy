import Koa from "koa";

import createJsonProxy from "./lib/json.js";
import createFileProxy from "./lib/file.js";
import { PORT } from "./lib/config.js";

const jsonProxy = createJsonProxy();
const fileProxy = createFileProxy();

const app = new Koa();

app.use(async (ctx, next) => {
  const start = Date.now();
  try {
    await next();
  } catch(e) {
    console.log("Failed request", e.message);

    // Rethrow the error to make sure a 
    // response is sent if it wasn't already
    throw e;
  } finally {
    const ms = Date.now() - start;

    let cacheInfo = '';
    if (ctx.hasOwnProperty("cacheHit")) {
      cacheInfo = ctx.cacheHit ? " (Cache HIT)" : " (Cache MISS)"
    }

    const externalRequests = ` (${ctx.externalRequests} external requests)`

    console.log(`${ctx.method} ${ctx.response.status} ${ctx.url}${externalRequests}${cacheInfo} - ${ms}ms`);
  }
});

app.use(async (ctx) => {
  ctx.externalRequests = 0;
  if (/\.json(?:$|\?.*)/.test(ctx.req.url)) {
    return jsonProxy(ctx);
  }

  if (/\.hpi$/.test(ctx.req.url)) {
    ctx.cacheHit = false;
    return fileProxy(ctx);
  }
});

app.listen(PORT);

console.log("Listening on port", PORT);
