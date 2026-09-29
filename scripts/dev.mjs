import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const children = [];

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

// Opens the page in a NEW TAB of the default browser. It never closes or reloads
// existing tabs; it only asks the OS to open a URL.
function openDefaultBrowser(target) {
  const options = { detached: true, stdio: "ignore" };
  if (process.platform === "win32") spawn("cmd", ["/c", "start", "", target], options).unref();
  else if (process.platform === "darwin") spawn("open", [target], options).unref();
  else spawn("xdg-open", [target], options).unref();
}

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

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
