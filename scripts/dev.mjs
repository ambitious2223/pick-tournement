import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const children = [];

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
