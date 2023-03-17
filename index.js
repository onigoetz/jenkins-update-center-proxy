import Koa from "koa";

import accesslog from "./lib/middlewares/log.js";
import proxy from "./lib/middlewares/proxy.js";
import health from "./lib/middlewares/health.js";
import error from "./lib/middlewares/error.js";

import { PORT } from "./lib/config.js";

const app = new Koa();

app.use(accesslog);
app.use(error);
app.use(health);
app.use(proxy);

app.listen(PORT);

console.log("Listening on port", PORT);
