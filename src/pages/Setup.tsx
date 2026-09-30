import type { ReactNode } from "react";
import { useI18n, type TKey } from "../i18n/index.tsx";

const STEPS: { title: TKey; body: TKey }[] = [
  { title: "setup.s1.title", body: "setup.s1.body" },
  { title: "setup.s2.title", body: "setup.s2.body" },
  { title: "setup.s3.title", body: "setup.s3.body" },
  { title: "setup.s4.title", body: "setup.s4.body" },
  { title: "setup.s5.title", body: "setup.s5.body" },
  { title: "setup.s6.title", body: "setup.s6.body" },
];

export function Setup(): ReactNode {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-6">
      <section className="panel animate-rise p-8">
        <p className="chip inline-block text-brand">{t("setup.badge")}</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight">{t("setup.title")}</h1>
        <p className="mt-3 max-w-2xl text-white/60">{t("setup.intro")}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="/control" className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-ink">
            {t("setup.openControl")}
          </a>
          <a href="/debug" className="rounded-lg border border-line px-3 py-2 text-sm">
            {t("setup.openDebug")}
          </a>
          <a href="/overlay" target="_blank" className="rounded-lg border border-line px-3 py-2 text-sm">
            {t("setup.openBroadcast")}
          </a>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((step) => (
          <section key={step.title} className="panel p-5">
            <h2 className="text-lg font-bold text-brand">{t(step.title)}</h2>
            <p className="mt-1 text-sm leading-relaxed text-white/60">{t(step.body)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
