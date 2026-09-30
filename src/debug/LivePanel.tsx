import { useEffect, useState, type ReactNode } from "react";
import type { LiveEvent, SessionState } from "../../shared/types.ts";
import { Button, Field, TextInput } from "../ui/primitives.tsx";
import { Avatar } from "../ui/Avatar.tsx";
import { send } from "../lib/live.ts";
import { useI18n } from "../i18n/index.tsx";

const SM = "px-2 py-1 text-xs";

function eventLabel(event: LiveEvent): string {
  if (event.type === "chat") return event.message ?? "";
  if (event.type === "gift") return `${event.giftName ?? "gift"}${event.count && event.count > 1 ? ` ×${event.count}` : ""}${event.coins ? ` · ${event.coins}` : ""}`;
  if (event.type === "like") return `♥ ${event.likeCount ?? 1}`;
  return event.type;
}

export function LivePanel({ state }: { state: SessionState }): ReactNode {
  const { t } = useI18n();
  const live = state.live;
  const [url, setUrl] = useState(live.url);
  const [slug, setSlug] = useState(live.game);
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState("test_viewer");
  const [chat, setChat] = useState("");
  const [gift, setGift] = useState("Rose");

  useEffect(() => {
    setUrl(live.url);
    setSlug(live.game);
  }, [live.url, live.game]);

  const save = () => {
    void send("live:update", { url, slug, key });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const inject = (event: Partial<LiveEvent>) => {
    void send("live:inject", {
      type: "chat",
      userId: user,
      username: user,
      name: user,
      avatar: "",
      at: Date.now(),
      ...event,
    } as LiveEvent);
  };

  const other = live.counts.like + live.counts.follow + live.counts.share;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${live.connected ? "bg-lime" : "bg-hot"}`} />
        <span className="text-xs font-bold">{live.connected ? t("live.connected") : t("live.disconnected")}</span>
        <span className="text-[0.65rem] text-white/40">{live.url}</span>
      </div>

      <Field label={t("live.url")}>
        <TextInput className={SM} value={url} onChange={(e) => setUrl(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("live.slug")}>
          <TextInput className={SM} value={slug} onChange={(e) => setSlug(e.target.value)} />
        </Field>
        <Field label={t("live.key")}>
          <TextInput className={SM} type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder={live.keySet ? "••••••" : ""} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="primary" className={SM} onClick={save}>
          {t("live.save")}
        </Button>
        <Button variant="ghost" className={SM} disabled={live.connected} onClick={() => void send("live:connect", undefined)}>
          {t("live.connect")}
        </Button>
        <Button variant="ghost" className={SM} disabled={!live.connected} onClick={() => void send("live:disconnect", undefined)}>
          {t("live.disconnect")}
        </Button>
      </div>
      {saved ? <span className="text-xs text-lime">{t("live.saved")}</span> : null}
      <p className="text-[0.7rem] leading-relaxed text-white/45">{t("live.hint")}</p>

      <div className="text-[0.65rem] text-white/40">
        {t("live.counts", { chat: live.counts.chat, gift: live.counts.gift, other })}
        {live.lastEventAt ? ` · ${t("live.lastEvent")}: ${new Date(live.lastEventAt).toLocaleTimeString()}` : ""}
      </div>

      <div>
        <div className="mb-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("live.eventFeed")}</div>
        {live.lastEvents.length === 0 ? (
          <p className="text-xs text-white/40">{t("live.noEvents")}</p>
        ) : (
          <ul className="scroll-thin flex max-h-48 flex-col gap-1 overflow-auto">
            {live.lastEvents.map((event, i) => (
              <li key={i} className="flex items-center gap-2 rounded-md border border-line bg-ink-2 px-2 py-1 text-xs">
                <Avatar src={event.avatar} name={event.name} />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-bold">{event.name}</span>{" "}
                  <span className="text-white/50">{eventLabel(event)}</span>
                </span>
                <span className="shrink-0 text-[0.6rem] uppercase text-white/30">{event.type}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("live.supporters")}</div>
        {live.supporters.length === 0 ? (
          <p className="text-xs text-white/40">{t("live.noSupporters")}</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {live.supporters.map((s, i) => (
              <li key={s.id} className="flex items-center gap-2 rounded-md border border-line bg-ink-2 px-2 py-1 text-xs">
                <span className="w-4 text-white/40">{i + 1}</span>
                <Avatar src={s.avatar} name={s.name} />
                <span className="min-w-0 flex-1 truncate font-bold">{s.name}</span>
                <span className="text-brand">{t("live.points", { n: s.points })}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <div className="mb-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("live.inject")}</div>
        <div className="flex flex-col gap-2">
          <Field label={t("debug.viewer")}>
            <TextInput className={SM} value={user} onChange={(e) => setUser(e.target.value)} />
          </Field>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <TextInput className={SM} value={chat} onChange={(e) => setChat(e.target.value)} placeholder={t("debug.chatMessage")} />
            <Button variant="primary" className={SM} onClick={() => inject({ type: "chat", message: chat })}>
              {t("live.injectChat")}
            </Button>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <TextInput className={SM} value={gift} onChange={(e) => setGift(e.target.value)} placeholder={t("debug.giftId")} />
            <Button variant="hot" className={SM} onClick={() => inject({ type: "gift", giftName: gift, coins: 10, count: 1 })}>
              {t("live.injectGift")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
