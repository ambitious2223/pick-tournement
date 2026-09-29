import { spawn } from "node:child_process";

// Opens the page in a NEW TAB of the default browser. It never closes or reloads
// existing tabs; it only asks the OS to open a URL.
export function openDefaultBrowser(target) {
  const options = { detached: true, stdio: "ignore", windowsHide: true };
  if (process.platform === "win32") spawn("cmd", ["/c", "start", "", target], options).unref();
  else if (process.platform === "darwin") spawn("open", [target], options).unref();
  else spawn("xdg-open", [target], options).unref();
}

export async function waitForServer(url, timeoutMs = 30000) {
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
