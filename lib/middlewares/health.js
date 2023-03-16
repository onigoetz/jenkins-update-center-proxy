
export default async function healthcheck(ctx, next) {
  if (ctx.req.url == '/health/ping') {
    ctx.body = 'OK';
    return;
  }
  await next();
}
