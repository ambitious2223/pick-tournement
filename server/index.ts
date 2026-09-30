import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { SERVER_PORT } from "../shared/config.ts";
import type { CommandMap } from "../shared/types.ts";
import { Session } from "./session.ts";
import { ensureSeeded, seedCategories } from "./seed.ts";
import { fetchPhotos, photoCoverage } from "./photos.ts";
import { DIST_DIR, UPLOADS_DIR, SOUNDS_DIR, ensureDirs, clearUploads, countUploads } from "./store.ts";
import { AVATARS_DIR } from "./avatars.ts";
import { loadLiveConfig } from "./liveConfig.ts";
import { LiveClient } from "./live.ts";

const IMAGE_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const MAX_UPLOAD = 8 * 1024 * 1024;
const MAX_JSON = 2 * 1024 * 1024;

process.title = "Pick League";

function json(res: http.ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(text),
  });
  res.end(text);
}

async function readBody(req: http.IncomingMessage, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    size += buf.length;
    if (size > limit) throw new Error("payload too large");
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

async function serveStatic(res: http.ServerResponse, urlPath: string, root: string, spaFallback: boolean): Promise<void> {
  const decoded = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  const relative = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  let file = path.join(root, relative);

  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  let stat = await fs.stat(file).catch(() => null);
  if (stat?.isDirectory()) {
    file = path.join(file, "index.html");
    stat = await fs.stat(file).catch(() => null);
  }
  if (!stat && spaFallback) {
    file = path.join(root, "index.html");
    stat = await fs.stat(file).catch(() => null);
  }
  if (!stat) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = path.extname(file).toLowerCase();
  const cacheControl = ext === ".html" ? "no-store" : "public, max-age=3600";
  res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream", "Cache-Control": cacheControl });
  res.end(await fs.readFile(file));
}

async function main(): Promise<void> {
  await ensureDirs();
  await ensureSeeded();
  const session = await Session.create();

  const liveConfig = await loadLiveConfig();
  const live = new LiveClient({
    config: liveConfig,
    onEvent: (event) => session.handleLiveEvent(event),
    onEffect: (effect, payload) => session.handleLiveEffect(effect, payload),
    onStatus: (connected) => session.setLiveStatus(connected),
    onLog: (line) => console.log(`[live] ${line}`),
  });
  session.attachLive(live, liveConfig);
  live.start();

  const clients = new Set<http.ServerResponse>();

  session.subscribe((event) => {
    if (event.type !== "state") return;
    const data = `data: ${JSON.stringify(event.state)}\n\n`;
    for (const client of clients) client.write(data);
  });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
    const { pathname } = url;
    const method = req.method ?? "GET";

    try {
      if (pathname === "/events" && method === "GET") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        });
        res.write(`data: ${JSON.stringify(session.state)}\n\n`);
        clients.add(res);
        const heartbeat = setInterval(() => res.write(": ping\n\n"), 15000);
        req.on("close", () => {
          clearInterval(heartbeat);
          clients.delete(res);
        });
        return;
      }

      if (pathname === "/api/state" && method === "GET") return json(res, 200, session.state);

      if (pathname === "/api/categories" && method === "GET") return json(res, 200, session.state.categories);

      if (pathname === "/api/stats" && method === "GET") {
        return json(res, 200, { uploads: await countUploads() });
      }

      if (pathname === "/api/command" && method === "POST") {
        const raw = await readBody(req, MAX_JSON);
        const body = JSON.parse(raw.toString("utf8")) as { command: keyof CommandMap; payload?: unknown };
        await session.dispatch(body.command, body.payload as never);
        return json(res, 200, { ok: true });
      }

      if (pathname === "/api/upload" && method === "POST") {
        const contentType = (req.headers["content-type"] ?? "").toString().split(";")[0]?.trim() ?? "";
        const ext = IMAGE_TYPES[contentType];
        if (!ext) return json(res, 415, { error: "Only PNG, JPEG, WebP, GIF or AVIF images are allowed." });
        const raw = await readBody(req, MAX_UPLOAD);
        if (raw.length === 0) return json(res, 400, { error: "Empty file." });
        const name = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}${ext}`;
        await fs.writeFile(path.join(UPLOADS_DIR, name), raw);
        return json(res, 200, { url: `/uploads/${name}`, bytes: raw.length });
      }

      if (pathname === "/api/uploads/clear" && method === "POST") {
        await clearUploads();
        return json(res, 200, { ok: true });
      }

      if (pathname === "/api/seed" && method === "POST") {
        const written = await seedCategories(url.searchParams.get("force") === "1");
        session.refreshCategories();
        return json(res, 200, { ok: true, written });
      }

      if (pathname === "/api/photos/coverage" && method === "GET") {
        return json(res, 200, await photoCoverage());
      }

      if (pathname === "/api/photos/fetch" && method === "POST") {
        const category = url.searchParams.get("category") ?? undefined;
        const force = url.searchParams.get("force") === "1";
        console.log(`[photos] fetching${category ? ` for ${category}` : ""}…`);
        const summary = await fetchPhotos({ category, force, log: (line) => console.log(line) });
        session.refreshCategories();
        console.log(`[photos] done: +${summary.changed}, ${summary.skipped} skipped`);
        return json(res, 200, summary);
      }

      if (pathname.startsWith("/uploads/")) {
        return serveStatic(res, pathname.replace("/uploads", ""), UPLOADS_DIR, false);
      }

      if (pathname.startsWith("/avatars/")) {
        return serveStatic(res, pathname.replace("/avatars", ""), AVATARS_DIR, false);
      }

      if (pathname === "/api/sounds" && method === "GET") {
        const names = await fs
          .readdir(SOUNDS_DIR)
          .then((files) => files.filter((f) => /\.(mp3|ogg|wav|webm)$/i.test(f)))
          .catch(() => [] as string[]);
        return json(res, 200, names);
      }

      if (pathname.startsWith("/sounds/")) {
        return serveStatic(res, pathname.replace("/sounds", ""), SOUNDS_DIR, false);
      }

      return serveStatic(res, pathname, DIST_DIR, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "server error";
      json(res, 500, { error: message });
    }
  });

  server.listen(SERVER_PORT, "127.0.0.1", () => {
    console.log(`[pick-league] server listening on http://127.0.0.1:${SERVER_PORT}`);
    console.log(`[pick-league] overlay:  http://127.0.0.1:${SERVER_PORT}/overlay`);
    console.log(`[pick-league] control:  http://127.0.0.1:${SERVER_PORT}/control`);
    console.log(`[pick-league] debug:    http://127.0.0.1:${SERVER_PORT}/debug`);
  });
}

main().catch((error) => {
  console.error("[pick-league] failed to start:", error);
  process.exit(1);
});
