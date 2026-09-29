import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDefaultBrowser, waitForServer } from "./browser.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8787;
const OPEN_URL = `http://127.0.0.1:${PORT}/control`;
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

if (!(await isPortFree(PORT))) {
  console.error(`[serve] Port ${PORT} is already in use.`);
  console.error("[serve] Another Pick League window is probably still running.");
  console.error("[serve] Close that window (or restart your PC) and run this again.");
  process.exit(1);
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
