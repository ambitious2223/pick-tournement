import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Button } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { useI18n, type TKey } from "../i18n/index.tsx";

const SM = "px-2 py-1 text-xs";

export function ShowControls({ state }: { state: SessionState }): ReactNode {
  const { t } = useI18n();
  const show = state.show;

  return (
    <section className="panel flex flex-col gap-2 p-3">
      <div className="text-[0.7rem] font-bold uppercase tracking-widest text-brand">{t("control.show")}</div>

      <div className="grid grid-cols-2 gap-2">
        {show.active ? (
          <Button
            variant="danger"
            className={SM}
            onClick={() => {
              if (window.confirm(t("show.confirmStop"))) void send("show:stop", undefined);
            }}
          >
            {t("show.stop")}
          </Button>
        ) : (
          <Button variant="primary" className={SM} onClick={() => void send("show:start", undefined)}>
            {t("show.start")}
          </Button>
        )}
        <Button
          variant="ghost"
          className={SM}
          disabled={!show.active}
          onClick={() => void send(show.paused ? "show:resume" : "show:pause", undefined)}
        >
          {show.paused ? t("show.resume") : t("show.pause")}
        </Button>
      </div>

      <Button variant="hot" className={SM} disabled={!show.active} onClick={() => void send("show:skipPhase", undefined)}>
        {t("show.skip")}
      </Button>

      {show.active ? (
        <div className="text-[0.7rem] text-white/50">
          {t(`show.phase.${show.phase}` as TKey)}
          {show.paused ? ` · ${t("show.paused")}` : ""}
        </div>
      ) : (
        <p className="text-xs text-white/50">{t("show.autoHint")}</p>
      )}
    </section>
  );
}
