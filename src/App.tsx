import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLiveState } from "./lib/live.ts";
import { useAudioUnlock } from "./sound/useAudioUnlock.ts";
import { ErrorBoundary } from "./ui/ErrorBoundary.tsx";
import { Control, type PanelTab } from "./control/Control.tsx";
import { Studio } from "./studio/Studio.tsx";
import { Debug } from "./debug/Debug.tsx";
import { Broadcast } from "./broadcast/Broadcast.tsx";
import { SetupTour } from "./components/SetupTour.tsx";
import { useI18n, type Lang } from "./i18n/index.tsx";

const ROUTES = ["/control", "/studio", "/debug", "/overlay", "/show"] as const;

const TAB_KEY = "pl.control.tab";
const TOUR_SEEN_KEY = "pl.setupTour.seen.v1";
const PANEL_TABS: readonly PanelTab[] = ["run", "settings", "queue", "sim"];

function routeFor(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return "/control";
  const match = ROUTES.find((r) => clean === r || clean.startsWith(`${r}/`));
  return match ?? "/control";
}

function readStoredTab(): PanelTab {
  const fromUrl = new URLSearchParams(window.location.search).get("tab");
  if (fromUrl && (PANEL_TABS as readonly string[]).includes(fromUrl)) return fromUrl as PanelTab;
  try {
    const saved = window.localStorage.getItem(TAB_KEY);
    if (saved && (PANEL_TABS as readonly string[]).includes(saved)) return saved as PanelTab;
  } catch {
    // ignore storage errors (private mode, etc.)
  }
  return "run";
}

export function App(): ReactNode {
  const { state } = useLiveState();
  useAudioUnlock();
  const { lang, setLang } = useI18n();
  const [path, setPath] = useState(() => window.location.pathname);
  const route = routeFor(path);
  const [tab, setTab] = useState<PanelTab>(readStoredTab);
  const [tourOpen, setTourOpen] = useState(false);

  const navigate = useCallback((next: string) => {
    const target = new URL(next, window.location.origin);
    if (target.pathname === window.location.pathname && target.search === window.location.search) return;
    window.history.pushState({}, "", `${target.pathname}${target.search}`);
    setPath(target.pathname);
  }, []);

  useEffect(() => {
    const onPop = (): void => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // The server owns the active content language. Adopt it once on first load so
  // a reloaded window never shows one language's UI with the other's content.
  const langSynced = useRef(false);
  useEffect(() => {
    if (langSynced.current || !state?.lang) return;
    langSynced.current = true;
    if (state.lang !== lang) setLang(state.lang);
  }, [state?.lang, lang, setLang]);

  useEffect(() => {
    try {
      window.localStorage.setItem(TAB_KEY, tab);
    } catch {
      // ignore storage errors
    }
  }, [tab]);

  // Auto-open the coach tour once per browser; `?tour=1` always replays it.
  useEffect(() => {
    if (route !== "/control") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "1") {
      setTourOpen(true);
      params.delete("tour");
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
      return;
    }
    try {
      if (!window.localStorage.getItem(TOUR_SEEN_KEY)) setTourOpen(true);
    } catch {
      // ignore storage errors
    }
  }, [route]);

  const closeTour = useCallback(() => {
    setTourOpen(false);
    try {
      window.localStorage.setItem(TOUR_SEEN_KEY, "1");
    } catch {
      // ignore storage errors
    }
  }, []);

  const startTour = useCallback(() => {
    if (route !== "/control") navigate("/control");
    setTourOpen(true);
  }, [route, navigate]);

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
      <TopNav route={route} onStartTour={startTour} onNavigate={navigate} />
      <main className={mainClass}>
        <ErrorBoundary>
          {route === "/control" ? <Control state={state} activeTab={tab} onTabChange={setTab} /> : null}
          {route === "/studio" ? <Studio state={state} /> : null}
          {route === "/debug" ? <Debug state={state} /> : null}
        </ErrorBoundary>
      </main>
      {route === "/control" || route === "/studio" ? (
        <SetupTour open={tourOpen} onClose={closeTour} onTabChange={setTab} onNavigate={navigate} />
      ) : null}
    </div>
  );
}

function TopNav({
  route,
  onStartTour,
  onNavigate,
}: {
  route: string;
  onStartTour: () => void;
  onNavigate: (path: string) => void;
}): ReactNode {
  const { t, lang, setLang } = useI18n();
  const links = [
    { href: "/control", label: t("nav.control"), tour: "nav-control" },
    { href: "/studio", label: t("nav.studio"), tour: "studio-nav" },
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2">
        <a
          href="/control"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("/control");
          }}
          className="flex items-center gap-1.5 text-sm font-black tracking-tight"
        >
          <span className="text-brand">PICK</span>
          <span>LEAGUE</span>
        </a>
        <nav className="ms-auto flex items-center gap-1 text-sm">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-tour={link.tour}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(link.href);
              }}
              className={`rounded-md px-2.5 py-1 transition hover:bg-surface ${
                route === link.href ? "bg-surface text-brand" : "text-white/70"
              }`}
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={onStartTour}
            className="rounded-md border border-brand/50 bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand transition hover:bg-brand hover:text-ink"
          >
            {t("nav.getStarted")}
          </button>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            aria-label={t("lang.label")}
            className="ms-1 rounded-md border border-line bg-ink px-2 py-1 text-xs text-white/70 outline-none transition hover:border-brand hover:text-brand"
          >
            <option value="ar">{t("lang.ar")}</option>
            <option value="en">{t("lang.en")}</option>
            <option value="tr">{t("lang.tr")}</option>
          </select>
        </nav>
      </div>
    </header>
  );
}
