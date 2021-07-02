import util from "util";

// ip, date, method, path, status and length
const format = '%s - - [%s] "%s %s HTTP/1.X" %d %s %s %sms';

export default async function acceslog(ctx, next) {
  const start = Date.now();
  try {
    await next();
  } catch (e) {
    // Rethrow the error to make sure a
    // response is sent if it wasn't already
    throw e;
  } finally {
    const ms = Date.now() - start;

    let details = ` (${ctx.externalRequests} external requests)`;
    if (ctx.hasOwnProperty("cacheHit")) {
      details = ctx.cacheHit ? " (Cache HIT)" : " (Cache MISS)";
    }

    const length = ctx.length ? ctx.length.toString() : "-";
    const date = new Date();

    console.log(
      util.format(
        format,
        ctx.ip,
        date.toISOString(),
        ctx.method,
        ctx.path,
        ctx.status,
        length,
        details,
        ms
      )
    );
  }
}
