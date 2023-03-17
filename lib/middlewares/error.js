function response(ctx, message) {
    ctx.status = 500;
    ctx.body = {
      message: message
    };
}

export default async function errorHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
      if (err.timings) {
        // Probably a remote request error
        const message = `Error while handling remote request '${ctx.method} ${ctx.path}':\n ${err.name} ${err.message}`;

        response(ctx, message);
        console.log(message)
      } else {
        const message = `Error while handling '${ctx.method} ${ctx.path}':\n`;

        response(ctx, `${message}${err.message}`)
        console.log(message, err);
      }
    }
}