import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDefaultBrowser, waitForServer } from "./browser.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const children = [];

// Name the console window after the project, and keep the name even if a child
// process (npm, vite, node) tries to set its own title.
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

for (const [port, name] of [
  [8787, "the game server"],
  [5173, "the web app"],
]) {
  if (!(await isPortFree(port))) {
    console.error(`[dev] Port ${port} (${name}) is already in use.`);
    console.error("[dev] Another Pick League window is probably still running.");
    console.error("[dev] Close that window (or restart your PC) and run this again.");
    process.exit(1);
  }
}

const OPEN_URL = "http://127.0.0.1:5173/control";
const wantsBrowser = process.argv.includes("--open") || process.env.PL_OPEN_BROWSER === "1";

function run(name, args) {
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });
  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[dev] ${name} exited with code ${code}`);
      shutdown(code);
    }
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("server", ["server/index.ts"]);
run("vite", ["node_modules/vite/bin/vite.js"]);

console.log("[dev] server on http://127.0.0.1:8787  |  web on http://127.0.0.1:5173");

if (wantsBrowser) {
  waitForServer(OPEN_URL).then((ready) => {
    if (ready) {
      openDefaultBrowser(OPEN_URL);
      console.log(`[dev] opened ${OPEN_URL} in your default browser (new tab)`);
    } else {
      console.log(`[dev] server was not ready in time - open ${OPEN_URL} manually`);
    }
  });
}
