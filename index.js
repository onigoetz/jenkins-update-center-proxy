import Koa from "koa";
import * as createError from "http-errors";

import accesslog from "./lib/middlewares/log.js";
import proxy from "./lib/middlewares/proxy.js";
import health from "./lib/middlewares/health.js";

import { PORT } from "./lib/config.js";

const app = new Koa();

app.use(accesslog);

app.use(health);

app.use(proxy);

app.listen(PORT);

app.on("error", (err, ctx) => {
  if (createError.isHttpError(err) && err.status < 500) {
    // Ignore 40* errors, they aren't unexpected behaviour
    return;
  }

  // Probably a remote request error
  if (err.timings) {
    console.log(`Error while handling remote request '${ctx.method} ${ctx.path}':\n`, err.name, err.message);
    return;
  }

  console.log(`Error while handling '${ctx.method} ${ctx.path}':\n`, err);
});

console.log("Listening on port", PORT);
