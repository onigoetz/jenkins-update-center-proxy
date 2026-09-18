import { test, expect, onTestFinished } from '@rstest/core';
import fs from "fs";

import { cache } from "../lib/file.js";
import { CACHE_DIR } from "../lib/config.js";

const KEY = "/download/plugins/half-written/1.0/half-written.hpi";
const ENTRY_DIR = `${CACHE_DIR}/plugins/half-written`;

// Large enough that the write needs several flushes, which is what opens the window
const VALUE = `{"statusCode":200,"body":"${"x".repeat(2 * 1024 * 1024)}"}`;

function expectUsable(entry) {
  expect(entry.length).toBe(VALUE.length);
  expect(() => JSON.parse(entry)).not.toThrow();
}

test('a concurrent read never sees a half-written entry', async () => {
  onTestFinished(() => fs.rmSync(ENTRY_DIR, { recursive: true, force: true }));

  for (let attempt = 0; attempt < 20; attempt++) {
    fs.rmSync(ENTRY_DIR, { recursive: true, force: true });

    const writing = cache.set(KEY, VALUE);
    const duringWrite = await cache.get(KEY);
    await writing;

    // A miss is always a legal answer. A truncated hit is not: the cache
    // JSON.parses whatever get returns, and a prefix fails the whole request.
    if (duringWrite !== undefined) {
      expectUsable(duringWrite);
    }

    expectUsable(await cache.get(KEY));
  }
}, 30000);
