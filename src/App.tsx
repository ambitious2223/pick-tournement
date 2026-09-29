import type { ReactNode } from "react";
import { useLiveState } from "./lib/live.ts";
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
  const state = useLiveState();
  const route = routeFor(window.location.pathname);

  if (route === "/overlay") {
    return <Overlay state={state} />;
  }

  return (
    <div className="min-h-full">
      <TopNav route={route} />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {route === "/control" ? <Control state={state} /> : null}
        {route === "/studio" ? <Studio state={state} /> : null}
        {route === "/debug" ? <Debug state={state} /> : null}
        {route === "/" ? <Home /> : null}
      </main>
    </div>
  );
}

function TopNav({ route }: { route: string }): ReactNode {
  const links = [
    { href: "/control", label: "Control" },
    { href: "/studio", label: "Studio" },
    { href: "/debug", label: "Debug" },
    { href: "/overlay", label: "Overlay", blank: true },
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <a href="/" className="flex items-center gap-2 font-black tracking-tight">
          <span className="text-brand">PICK</span>
          <span>LEAGUE</span>
        </a>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.blank ? "_blank" : undefined}
              className={`rounded-lg px-3 py-1.5 transition hover:bg-surface ${
                route === link.href ? "bg-surface text-brand" : "text-white/70"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
