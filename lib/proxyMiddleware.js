import createJsonProxy from "./json.js";
import createFileProxy from "./file.js";

const jsonProxy = createJsonProxy();
const fileProxy = createFileProxy();

export default async function proxyMiddleware(ctx) {
    if (/\.json(?:$|\?.*)/.test(ctx.req.url)) {
        return jsonProxy(ctx);
    }

    if (/\.hpi$/.test(ctx.req.url)) {
        ctx.cacheHit = false;
        return fileProxy(ctx);
    }
}