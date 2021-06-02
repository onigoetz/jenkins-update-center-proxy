import Koa from "koa";

import createJsonProxy from "./lib/json.js";
import createFileProxy from "./lib/file.js";
import { PORT } from "./lib/config.js";

const jsonProxy = createJsonProxy();
const fileProxy = createFileProxy();

const app = new Koa();

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.response.status} ${ctx.url} - ${ms}ms`);
});

app.use(async (ctx) => {
  if (/\.json(?:$|\?.*)/.test(ctx.req.url)) {
    return jsonProxy(ctx);
  }

  if (/\.hpi$/.test(ctx.req.url)) {
    return fileProxy(ctx);
  }
});

app.listen(PORT);

console.log("Listening on port", PORT);
