import { useEffect, useState } from "react";
import type { CommandMap, SessionState } from "../../shared/types.ts";

export async function send<K extends keyof CommandMap>(command: K, payload?: CommandMap[K]): Promise<void> {
  try {
    const res = await fetch("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, payload }),
    });
    if (!res.ok) console.error(`[pick-league] command "${command}" failed: ${res.status}`);
  } catch (error) {
    console.error(`[pick-league] command "${command}" could not reach the server`, error);
  }
}

export async function uploadImage(file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Upload failed");
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

export function useLiveState(): { state: SessionState | null; connected: boolean } {
  const [state, setState] = useState<SessionState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/state")
      .then((r) => r.json())
      .then((s: SessionState) => {
        if (cancelled) return;
        setState(s);
        setConnected(true);
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });

    const source = new EventSource("/events");
    source.addEventListener("open", () => setConnected(true));
    source.addEventListener("error", () => setConnected(false));
    source.addEventListener("message", (event) => {
      try {
        setState(JSON.parse((event as MessageEvent).data) as SessionState);
        setConnected(true);
      } catch {
        /* ignore malformed frame */
      }
    });

    return () => {
      cancelled = true;
      source.close();
    };
  }, []);

  return { state, connected };
}

export function useNow(active: boolean, intervalMs = 100): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return now;
}
