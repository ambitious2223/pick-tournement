import type { ReactNode } from "react";
import { useI18n, type TKey } from "../i18n/index.tsx";

const CARDS: { href: string; title: TKey; body: TKey }[] = [
  { href: "/setup", title: "home.setup.title", body: "home.setup.body" },
  { href: "/control", title: "home.control.title", body: "home.control.body" },
  { href: "/studio", title: "home.studio.title", body: "home.studio.body" },
  { href: "/debug", title: "home.debug.title", body: "home.debug.body" },
  { href: "/overlay", title: "home.overlay.title", body: "home.overlay.body" },
];

export function Home(): ReactNode {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-8">
      <section className="panel animate-rise overflow-hidden p-8">
        <p className="chip inline-block text-brand">{t("home.badge")}</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">
          {t("home.title1")} <span className="text-brand">{t("home.title2")}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-white/60">{t("home.body")}</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <a key={card.href} href={card.href} className="panel p-5 transition hover:border-brand">
            <h2 className="text-lg font-bold">{t(card.title)}</h2>
            <p className="mt-1 text-sm text-white/60">{t(card.body)}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
