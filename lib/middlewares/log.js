import util from "util";

// ip, date, method, path, status and length
const format = '%s [%s] "%s %s HTTP/1.X" %d %s %sms';
const formatPending = '%s [%s] "%s %s HTTP/1.X" IN_PROGRESS %sms';

function printLog(type, start, ctx) {
  const ms = Date.now() - start;
  const date = new Date();

  console.log(
    util.format(
      type == 'log' ? format : formatPending,
      ctx.ip,
      date.toISOString(),
      ctx.method,
      ctx.request.url,
      ...(type == 'log' ? [
        ctx.status,
        ctx.length ? ctx.length.toString() : "-"
      ] : []),
      ms
    )
  );
}

export default async function accesslog(ctx, next) {
  const start = Date.now();
  let interval;
  try {
    interval = setInterval(() => {
      printLog('pending', start, ctx)
    }, 30 * 1000);

    await next();
  } catch (e) {
    // Rethrow the error to make sure a
    // response is sent if it wasn't already
    throw e;
  } finally {

    clearInterval(interval);

    printLog('log', start, ctx)
  }
}
