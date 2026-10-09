import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { cacheImage } from "../server/imageCache.ts";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function listen(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") resolve(address.port);
      else reject(new Error("no port"));
    });
  });
}

test("cacheImage keeps a real image and rejects everything else", async () => {
  const server = createServer((req, res) => {
    if (req.url === "/ok.png") {
      res.writeHead(200, { "content-type": "image/png" });
      res.end(PNG);
      return;
    }
    if (req.url === "/fake.png") {
      res.writeHead(200, { "content-type": "image/png" });
      res.end("<html>not an image</html>");
      return;
    }
    if (req.url === "/big.png") {
      res.writeHead(200, { "content-type": "image/png" });
      res.end(Buffer.concat([PNG, Buffer.alloc(4096)]));
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("nope");
  });

  const dir = mkdtempSync(path.join(tmpdir(), "pl-img-"));
  const port = await listen(server);
  const base = `http://127.0.0.1:${port}`;
  const opts = { dir, urlPath: "/test" };

  try {
    const ok = await cacheImage(`${base}/ok.png`, opts);
    assert.match(ok, /^\/test\/[0-9a-f]{20}\.png$/, "a real image becomes a local URL");
    const cached = path.join(dir, path.basename(ok));
    assert.equal((await fs.stat(cached)).size, PNG.length, "the file is stored byte for byte");
    assert.equal(await cacheImage(`${base}/ok.png`, opts), ok, "a second call reuses the cache");

    assert.equal(await cacheImage(`${base}/fake.png`, opts), "", "a content-type lie is rejected");
    assert.equal(
      await cacheImage(`${base}/big.png`, { ...opts, maxBytes: 64 }),
      "",
      "an oversized body is rejected",
    );
    assert.equal(await cacheImage(`${base}/missing.png`, opts), "", "a 404 is rejected");
    assert.equal(await cacheImage("ftp://example.com/x.png", opts), "", "non-http sources are refused");
    assert.equal(await cacheImage("", opts), "", "an empty source is refused");

    assert.deepEqual(readdirSync(dir), [path.basename(ok)], "only the valid image was written");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  }
});
