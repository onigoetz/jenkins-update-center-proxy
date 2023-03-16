import util from "util";

// ip, date, method, path, status and length
const format = '%s - - [%s] "%s %s HTTP/1.X" %d %s %sms';

export default async function accesslog(ctx, next) {
  const start = Date.now();
  try {
    await next();
  } catch (e) {
    // Rethrow the error to make sure a
    // response is sent if it wasn't already
    throw e;
  } finally {
    const ms = Date.now() - start;
    const length = ctx.length ? ctx.length.toString() : "-";
    const date = new Date();

    console.log(
      util.format(
        format,
        ctx.ip,
        date.toISOString(),
        ctx.method,
        ctx.request.url,
        ctx.status,
        length,
        ms
      )
    );
  }
}
