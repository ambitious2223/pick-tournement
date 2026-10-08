import { spawn, exec } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDefaultBrowser, waitForServer } from "./browser.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8787;
const BASE = `http://127.0.0.1:${PORT}`;
const OPEN_URL = `${BASE}/control`;
const wantsBrowser = process.argv.includes("--open") || process.env.PL_OPEN_BROWSER === "1";

process.title = "Pick League";
setInterval(() => {
  process.title = "Pick League";
}, 2000).unref();

function isPortFree(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.on("connect", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(true));
  });
}

/** Ask the thing on the port if it is a Pick League server. */
async function isPickLeague() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${BASE}/api/state`, { signal: controller.signal });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data && Array.isArray(data.categories) && data.settings && data.show);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** The PID listening on a TCP port (Windows only; null elsewhere). */
function pidOnPort(port) {
  return new Promise((resolve) => {
    if (process.platform !== "win32") return resolve(null);
    exec("netstat -ano -p tcp", { windowsHide: true }, (err, stdout) => {
      if (err) return resolve(null);
      for (const line of stdout.split(/\r?\n/)) {
        const cols = line.trim().split(/\s+/);
        if (cols[0] === "TCP" && cols[1]?.endsWith(`:${port}`) && cols[3] === "LISTENING") {
          const pid = Number(cols[4]);
          if (Number.isInteger(pid) && pid > 0) return resolve(pid);
        }
      }
      resolve(null);
    });
  });
}

async function waitForFree(port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortFree(port)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return isPortFree(port);
}

if (!(await isPortFree(PORT))) {
  if (!(await isPickLeague())) {
    console.error(`[serve] Port ${PORT} is already in use by another app.`);
    console.error("[serve] Close that app (or restart your PC) and run this again.");
    process.exit(1);
  }

  console.log(`[serve] Pick League is already running on :${PORT}. Restarting it with the latest build...`);
  const pid = await pidOnPort(PORT);
  if (pid) {
    try {
      process.kill(pid);
    } catch {
      /* fall through to the wait below */
    }
  }

  if (!(await waitForFree(PORT, 8000))) {
    // We couldn't stop the old one; just reuse it so the host is never blocked.
    console.log(`[serve] Could not restart the previous server automatically; it is still running.`);
    if (wantsBrowser) openDefaultBrowser(OPEN_URL);
    process.exit(0);
  }
}

const server = spawn(process.execPath, ["server/index.ts"], { stdio: "inherit", cwd: root, env: process.env });
server.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => server.kill());
process.on("SIGTERM", () => server.kill());

if (wantsBrowser) {
  waitForServer(OPEN_URL).then((ready) => {
    if (ready) {
      openDefaultBrowser(OPEN_URL);
      console.log(`[serve] opened ${OPEN_URL} in your default browser (new tab)`);
    } else {
      console.log(`[serve] server was not ready in time - open ${OPEN_URL} manually`);
    }
  });
}
