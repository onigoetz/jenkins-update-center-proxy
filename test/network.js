import test from 'ava';
import Koa from "koa";
import http from "http";
import proxyMiddleware from "../lib/middlewares/proxy.js";

const UPDATE_CENTER_PORT = 65432

async function startLocalServer(t) {
  return new Promise((resolve) => {
    const app = new Koa();
    app.use(proxyMiddleware);
    const server = app.listen(() => {
      const { port } = server.address();

      t.teardown(() => {
        console.log("Stopping local server")
        server.close();
      })

      resolve(port);
    });
  })
}

async function startRemoteServer(t, handler) {
  return new Promise((resolve) => {
    const server = http
      .createServer(handler)
      .listen(UPDATE_CENTER_PORT, function() {
        resolve(server);
        t.teardown(() => {
          console.log("Stopping remote server")
          server.close();
        })
      })
  })
}

test.serial('replies with 404 on unmatched urls', async t => {
  const port = await startLocalServer(t);

  const result = await fetch(`http://localhost:${port}/nonexistent`)
  t.is(result.status, 404)
});

test.serial('replies with 500 on remote connection error (json)', async t => {
  const port = await startLocalServer(t);
  const result = await fetch(`http://localhost:${port}/update-center.json`)
  t.is(result.status, 500)
});

test.serial('replies with 500 on remote connection error (hpi)', async t => {
  const port = await startLocalServer(t);
  const result = await fetch(`http://localhost:${port}/download/plugins/antisamy-markup-formatter/155.v795fb_8702324/antisamy-markup-formatter.hpi`)
  t.is(result.status, 500)
});

test.serial('replies with 500 on remote connection hanging (json)', async t => {
  t.timeout(10000);

  const port = await startLocalServer(t);

  await startRemoteServer(t, (req, res) => {
    console.log("got remote request, ignoring it", req.url)
  })

  const result = await fetch(`http://localhost:${port}/update-center.json`)
  t.is(result.status, 500)
});

test.serial('replies with 500 on remote connection hanging (hpi)', async t => {
  t.timeout(10000);

  const port = await startLocalServer(t);

  await startRemoteServer(t, (req, res) => {
    console.log("got remote request, ignoring it", req.url)
  })

  const result = await fetch(`http://localhost:${port}/download/plugins/antisamy-markup-formatter/155.v795fb_8702324/antisamy-markup-formatter.hpi`)
  t.is(result.status, 500)
});
