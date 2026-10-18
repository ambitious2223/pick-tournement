import { useEffect, useRef, type ReactNode } from "react";
import { useLiveState } from "./lib/live.ts";
import { useAudioUnlock } from "./sound/useAudioUnlock.ts";
import { ErrorBoundary } from "./ui/ErrorBoundary.tsx";
import { Control } from "./control/Control.tsx";
import { Studio } from "./studio/Studio.tsx";
import { Debug } from "./debug/Debug.tsx";
import { Setup } from "./pages/Setup.tsx";
import { Broadcast } from "./broadcast/Broadcast.tsx";
import { useI18n } from "./i18n/index.tsx";

const ROUTES = ["/control", "/studio", "/debug", "/setup", "/overlay", "/show"] as const;

function routeFor(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return "/control";
  const match = ROUTES.find((r) => clean === r || clean.startsWith(`${r}/`));
  return match ?? "/control";
}

export function App(): ReactNode {
  const { state, connected } = useLiveState();
  useAudioUnlock();
  const { t, lang, setLang } = useI18n();
  const route = routeFor(window.location.pathname);

  // The server owns the active content language. Adopt it once on first load so
  // a reloaded window never shows one language's UI with the other's content.
  const langSynced = useRef(false);
  useEffect(() => {
    if (langSynced.current || !state?.lang) return;
    langSynced.current = true;
    if (state.lang !== lang) setLang(state.lang);
  }, [state?.lang, lang, setLang]);

  if (route === "/overlay" || route === "/show") {
    return (
      <ErrorBoundary>
        <Broadcast state={state} />
      </ErrorBoundary>
    );
  }

  const fill = route === "/control";
  const debug = route === "/debug";

  // Control + Debug lock the shell to the viewport so only the content area
  // scrolls (never the whole page). Other pages scroll normally.
  const wrapperClass = fill || debug ? "flex h-screen flex-col overflow-hidden" : "min-h-full";
  const mainClass = fill
    ? "scroll-thin mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 xl:overflow-hidden"
    : debug
      ? "scroll-thin mx-auto w-full max-w-[1600px] min-h-0 flex-1 overflow-y-auto px-4 py-4"
      : "mx-auto max-w-[1600px] px-4 py-4";

  return (
    <div className={wrapperClass}>
      <TopNav route={route} />
      {!connected ? (
        <div className="border-b border-hot/40 bg-hot/10 px-4 py-2 text-center text-sm text-hot">{t("nav.offline")}</div>
      ) : null}
      <main className={mainClass}>
        <ErrorBoundary>
          {route === "/control" ? <Control state={state} /> : null}
          {route === "/studio" ? <Studio state={state} /> : null}
          {route === "/debug" ? <Debug state={state} /> : null}
          {route === "/setup" ? <Setup state={state} connected={connected} /> : null}
        </ErrorBoundary>
      </main>
    </div>
  );
}

function TopNav({ route }: { route: string }): ReactNode {
  const { t, lang, setLang } = useI18n();
  const links = [
    { href: "/control", label: t("nav.control") },
    { href: "/studio", label: t("nav.studio") },
    { href: "/setup", label: t("nav.setup") },
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2">
        <a href="/" className="flex items-center gap-1.5 text-sm font-black tracking-tight">
          <span className="text-brand">PICK</span>
          <span>LEAGUE</span>
        </a>
        <nav className="ms-auto flex items-center gap-1 text-sm">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`rounded-md px-2.5 py-1 transition hover:bg-surface ${
                route === link.href ? "bg-surface text-brand" : "text-white/70"
              }`}
            >
              {link.label}
            </a>
          )          )}
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            aria-label={t("lang.label")}
            className="ms-1 rounded-md border border-line px-2.5 py-1 text-xs text-white/70 transition hover:border-brand hover:text-brand"
          >
            {t("lang.switch")}
          </button>
        </nav>
      </div>
    </header>
  );
}
