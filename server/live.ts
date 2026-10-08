import type { LiveEvent, LiveEventType } from "../shared/types.ts";
import { loadManifest } from "./manifest.ts";
import type { LiveConfig } from "./liveConfig.ts";

interface LiveClientOptions {
  config: LiveConfig;
  onEvent: (event: LiveEvent) => void;
  onEffect: (effect: string, payload: unknown) => boolean;
  onStatus: (connected: boolean) => void;
  onLog?: (line: string) => void;
  /** The hub rejected our key — re-read it from Tikora and reconnect. */
  onAuthError?: () => void;
}

function toType(raw: string): LiveEventType | null {
  switch (raw) {
    case "chat":
    case "comment":
      return "chat";
    case "gift":
      return "gift";
    case "like":
    case "likes":
      return "like";
    case "follow":
      return "follow";
    case "share":
      return "share";
    case "member":
    case "join":
      return "member";
    case "subscribe":
      return "subscribe";
    case "roomUser":
    case "room_user":
    case "roomuser":
      return "roomUser";
    default:
      return null;
  }
}

function normalizeEvent(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const type = toType(String(data.type ?? data.event ?? ""));
  if (!type) return null;

  const userId = String(data.userId ?? data.uniqueId ?? data.username ?? data.name ?? "");
  const name = String(data.name ?? data.nickname ?? data.username ?? userId ?? "Viewer");
  const username = String(data.username ?? data.uniqueId ?? name);

  const event: LiveEvent = {
    type,
    userId,
    username,
    name,
    avatar: String(data.avatar ?? data.profilePictureUrl ?? ""),
    at: Number(data.timestamp) || Date.now(),
  };

  const message = data.message ?? data.comment;
  if (typeof message === "string") event.message = message;
  if (typeof data.giftName === "string") event.giftName = data.giftName;
  if (data.giftId != null) event.giftId = data.giftId as string | number;
  if (data.coins != null) event.coins = Number(data.coins) || 0;
  const count = Number(data.count ?? data.giftCount);
  if (Number.isFinite(count) && count > 0) event.count = count;
  if (data.likeCount != null) event.likeCount = Number(data.likeCount) || 1;

  return event;
}

/**
 * Connects to the Tikora hub relay (ws://127.0.0.1:27016/ by default), which
 * already aggregates TikTok (and optionally TikFinity). Receives the broadcast
 * normalized event feed, and — once a game slug + key are set — registers for
 * routed effects. No TikTok credentials live here.
 */
export class LiveClient {
  private ws: WebSocket | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private retry = 0;
  private stopped = true;
  private cfg: LiveConfig;
  private readonly opts: LiveClientOptions;

  constructor(opts: LiveClientOptions) {
    this.opts = opts;
    this.cfg = opts.config;
  }

  get config(): LiveConfig {
    return this.cfg;
  }

  start(): void {
    this.stopped = false;
    this.open();
  }

  stop(): void {
    this.stopped = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    }
    this.opts.onStatus(false);
  }

  setConfig(config: LiveConfig): void {
    this.cfg = config;
    if (this.stopped) return;
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    }
    this.open();
  }

  private url(): string {
    const base = this.cfg.url || "ws://127.0.0.1:27016/";
    if (this.cfg.slug && this.cfg.key) {
      const sep = base.includes("?") ? "&" : "?";
      return `${base}${sep}game=${encodeURIComponent(this.cfg.slug)}&key=${encodeURIComponent(this.cfg.key)}`;
    }
    return base;
  }

  private send(message: unknown): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== 1) return;
    try {
      ws.send(JSON.stringify(message));
    } catch {
      /* ignore */
    }
  }

  private open(): void {
    if (this.stopped) return;
    const url = this.url();
    this.opts.onLog?.(`connecting ${url.replace(/key=[^&]*/, "key=…")}`);
    try {
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.addEventListener("open", () => this.onOpen());
      ws.addEventListener("message", (event) => this.onMessage(event));
      ws.addEventListener("error", () => {
        /* a close event follows */
      });
      ws.addEventListener("close", () => this.onClose());
    } catch (error) {
      this.opts.onLog?.(`connection error: ${(error as Error).message}`);
      this.scheduleRetry();
    }
  }

  private onOpen(): void {
    this.retry = 0;
    this.opts.onStatus(true);
    this.opts.onLog?.("connected to Tikora hub");
    this.sendCapabilities();
  }

  /** Declare the manifest's effects/events so the hub can list them for mapping. */
  private sendCapabilities(): void {
    const manifest = loadManifest();
    this.send({ type: "capabilities", data: { effects: manifest.effects, events: manifest.events } });
  }

  /** Forward a sound/music cue to the hub so Tikora can map a real sound to it. */
  emitCue(id: string): void {
    this.send({ type: "emit", data: { kind: "cue", id: `pl.cue.${id}`, at: Date.now() } });
  }

  private onMessage(event: MessageEvent): void {
    let msg: { type?: string; data?: unknown };
    try {
      msg = JSON.parse(String(event.data)) as { type?: string; data?: unknown };
    } catch {
      return;
    }
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "welcome") {
      this.sendCapabilities();
      return;
    }
    if (msg.type === "error") {
      const data = (msg.data ?? {}) as { error?: string; message?: string };
      const detail = `${data.error ?? ""} ${data.message ?? ""}`.trim();
      this.opts.onLog?.(detail ? `hub error: ${detail}` : "hub error");
      if (data.error === "unauthorized") this.opts.onAuthError?.();
      return;
    }
    if (msg.type === "event") {
      const live = normalizeEvent(msg.data);
      if (live) this.opts.onEvent(live);
      return;
    }
    if (msg.type === "effect") {
      const data = (msg.data ?? {}) as { id?: string; effect?: string; payload?: unknown };
      const effect = String(data.effect ?? "");
      const handled = effect ? this.opts.onEffect(effect, data.payload) : false;
      this.send({ type: "effect:ack", data: { id: data.id, ok: handled } });
    }
  }

  private onClose(): void {
    this.ws = null;
    this.opts.onStatus(false);
    this.scheduleRetry();
  }

  private scheduleRetry(): void {
    if (this.stopped || this.retryTimer) return;
    const delay = Math.min(30000, 1000 * 2 ** Math.min(this.retry, 5));
    this.retry += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.open();
    }, delay);
  }
}
