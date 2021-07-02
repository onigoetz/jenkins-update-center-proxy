import Koa from "koa";
import * as createError from "http-errors";

import accesslog from "./lib/log.js";
import createJsonProxy from "./lib/json.js";
import createFileProxy from "./lib/file.js";
import { PORT } from "./lib/config.js";

const jsonProxy = createJsonProxy();
const fileProxy = createFileProxy();

const app = new Koa();

app.use(accesslog);

app.use(async (ctx) => {
  if (/\.json(?:$|\?.*)/.test(ctx.req.url)) {
    return jsonProxy(ctx);
  }

  if (/\.hpi$/.test(ctx.req.url)) {
    ctx.cacheHit = false;
    return fileProxy(ctx);
  }
});

app.listen(PORT);

app.on("error", (err, ctx) => {
  if (createError.isHttpError(err) && err.status < 500) {
    // Ignore 40* errors, they aren't unexpected behaviour
    return;
  }

  console.log(`Error while handling '${ctx.method} ${ctx.path}':\n`, err);
});

console.log("Listening on port", PORT);
