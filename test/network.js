import { test, expect, onTestFinished } from '@rstest/core';
import Koa from "koa";
import http from "http";
import proxyMiddleware from "../lib/middlewares/proxy.js";

const UPDATE_CENTER_PORT = 65432

async function startLocalServer() {
  return new Promise((resolve) => {
    const app = new Koa();
    app.use(proxyMiddleware);
    const server = app.listen(() => {
      const { port } = server.address();

      onTestFinished(() => {
        console.log("Stopping local server")
        server.close();
      })

      resolve(port);
    });
  })
}

async function startRemoteServer(handler) {
  return new Promise((resolve) => {
    const server = http
      .createServer(handler)
      .listen(UPDATE_CENTER_PORT, function() {
        resolve(server);
        onTestFinished(() => {
          console.log("Stopping remote server")
          server.close();
        })
      })
  })
}

test('replies with 404 on unmatched urls', async () => {
  const port = await startLocalServer();

  const result = await fetch(`http://localhost:${port}/nonexistent`)
  expect(result.status).toBe(404)
});

test('replies with 500 on remote connection error (json)', async () => {
  const port = await startLocalServer();
  const result = await fetch(`http://localhost:${port}/update-center.json`)
  expect(result.status).toBe(500)
});

test('replies with 500 on remote connection error (hpi)', async () => {
  const port = await startLocalServer();
  const result = await fetch(`http://localhost:${port}/download/plugins/antisamy-markup-formatter/155.v795fb_8702324/antisamy-markup-formatter.hpi`)
  expect(result.status).toBe(500)
});

test('replies with 500 on remote connection hanging (json)', async () => {
  const port = await startLocalServer();

  await startRemoteServer((req, res) => {
    console.log("got remote request, ignoring it", req.url)
  })

  const result = await fetch(`http://localhost:${port}/update-center.json`)
  expect(result.status).toBe(500)
}, 10000);

test('replies with 500 on remote connection hanging (hpi)', async () => {
  const port = await startLocalServer();

  await startRemoteServer((req, res) => {
    console.log("got remote request, ignoring it", req.url)
  })

  const result = await fetch(`http://localhost:${port}/download/plugins/antisamy-markup-formatter/155.v795fb_8702324/antisamy-markup-formatter.hpi`)
  expect(result.status).toBe(500)
}, 10000);
