import Koa from "koa";

import createJsonProxy from "./lib/json.js";
import createFileProxy from "./lib/file.js";

const PORT = process.env.PORT || 3000;
const PROXY_TARGET = process.env.REMOTE_UPDATE_CENTER || "https://updates.jenkins.io/";
const RETURN = process.env.LOCAL_UPDATE_CENTER || "http://localhost:3000";
const CACHE_DIR = process.env.CACHE_DIR || "cache";

const jsonProxy = createJsonProxy(PROXY_TARGET, RETURN);
const fileProxy = createFileProxy(PROXY_TARGET, CACHE_DIR);

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
