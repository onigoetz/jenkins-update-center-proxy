import { test, expect, onTestFinished } from '@rstest/core';
import Koa from "koa";
import http from "http";
import fs from "fs";
import proxyMiddleware from "../lib/middlewares/proxy.js";
import { CACHE_DIR } from "../lib/config.js";

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

test('serves a plugin that the mirror sends without a content-type (hpi)', async () => {
  // A 200 is cached, and test.sh expects exactly the e2e entries in the cache
  onTestFinished(() => fs.rmSync(`${CACHE_DIR}/plugins/no-content-type`, { recursive: true, force: true }));
  const port = await startLocalServer();

  await startRemoteServer((req, res) => {
    res.end("hpi!");
  })

  const result = await fetch(`http://localhost:${port}/download/plugins/no-content-type/1.0/no-content-type.hpi`)
  expect(result.status).toBe(200)
  expect(await result.text()).toBe("hpi!")
});
