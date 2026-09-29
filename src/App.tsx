import type { ReactNode } from "react";
import { useLiveState } from "./lib/live.ts";
import { ErrorBoundary } from "./ui/ErrorBoundary.tsx";
import { Home } from "./pages/Home.tsx";
import { Overlay } from "./overlay/Overlay.tsx";
import { Control } from "./control/Control.tsx";
import { Studio } from "./studio/Studio.tsx";
import { Debug } from "./debug/Debug.tsx";

const ROUTES = ["/control", "/studio", "/debug", "/overlay"] as const;

function routeFor(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const match = ROUTES.find((r) => clean === r || clean.startsWith(`${r}/`));
  return match ?? "/";
}

export function App(): ReactNode {
  const { state, connected } = useLiveState();
  const route = routeFor(window.location.pathname);

  if (route === "/overlay") {
    return (
      <ErrorBoundary>
        <Overlay state={state} />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-full">
      <TopNav route={route} />
      {!connected ? (
        <div className="border-b border-hot/40 bg-hot/10 px-4 py-2 text-center text-sm text-hot">
          Server not reachable — close this window and run Tournament.bat again.
        </div>
      ) : null}
      <main className="mx-auto max-w-[1600px] px-4 py-4">
        <ErrorBoundary>
          {route === "/control" ? <Control state={state} /> : null}
          {route === "/studio" ? <Studio state={state} /> : null}
          {route === "/debug" ? <Debug state={state} /> : null}
          {route === "/" ? <Home /> : null}
        </ErrorBoundary>
      </main>
    </div>
  );
}

function TopNav({ route }: { route: string }): ReactNode {
  const links = [
    { href: "/control", label: "Control" },
    { href: "/studio", label: "Studio" },
    { href: "/overlay", label: "Overlay", blank: true },
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2">
        <a href="/" className="flex items-center gap-1.5 text-sm font-black tracking-tight">
          <span className="text-brand">PICK</span>
          <span>LEAGUE</span>
        </a>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.blank ? "_blank" : undefined}
              className={`rounded-md px-2.5 py-1 transition hover:bg-surface ${
                route === link.href ? "bg-surface text-brand" : "text-white/70"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/debug"
            className={`ml-2 rounded-md px-2 py-1 text-[0.7rem] uppercase tracking-widest transition hover:bg-surface ${
              route === "/debug" ? "bg-surface text-brand" : "text-white/35"
            }`}
          >
            debug
          </a>
        </nav>
      </div>
    </header>
  );
}
