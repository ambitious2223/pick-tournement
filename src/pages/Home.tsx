import type { ReactNode } from "react";

const CARDS = [
  {
    href: "/control",
    title: "Control Room",
    body: "Run the tournament: start, pause, extend, force winners, manage the category queue and the simulator.",
  },
  {
    href: "/studio",
    title: "Content Studio",
    body: "Create categories and 16 items, add aliases and gifts, upload item photos.",
  },
  {
    href: "/debug",
    title: "Debug Console",
    body: "Inject votes, force outcomes, simulate crowds, inspect raw state and the event log.",
  },
  {
    href: "/overlay",
    title: "OBS Overlay",
    body: "The transparent browser source. Add http://127.0.0.1:8787/overlay to OBS.",
  },
];

export function Home(): ReactNode {
  return (
    <div className="flex flex-col gap-8">
      <section className="panel animate-rise overflow-hidden p-8">
        <p className="chip inline-block text-brand">TikTok Live Bracket</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">
          16 fighters. <span className="text-brand">One champion.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Viewers vote by typing the on-screen name or sending the gift shown beside a side. Every match runs on a
          configurable timer, and categories chain automatically — no looping back.
        </p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <a key={card.href} href={card.href} className="panel p-5 transition hover:border-brand">
            <h2 className="text-lg font-bold">{card.title}</h2>
            <p className="mt-1 text-sm text-white/60">{card.body}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
