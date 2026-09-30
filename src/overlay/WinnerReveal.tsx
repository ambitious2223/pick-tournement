import type { ReactNode } from "react";
import type { Item } from "../../shared/types.ts";
import { useI18n } from "../i18n/index.tsx";
import { itemName } from "../lib/selectors.ts";
import { ItemVisual } from "./ItemVisual.tsx";

export function WinnerReveal({ item, categoryName }: { item: Item | null; categoryName: string }): ReactNode {
  const { t, lang } = useI18n();
  return (
    <div className="animate-slam flex flex-col items-center gap-5 text-center">
      <div className="chip border-lime text-lime">{t("stage.championOf", { category: categoryName })}</div>
      <div className="h-[clamp(11rem,28vh,18rem)] w-[clamp(11rem,28vh,18rem)] overflow-hidden rounded-3xl shadow-[0_0_80px_-10px_rgba(163,230,53,0.8)] ring-4 ring-lime">
        <ItemVisual item={item} className="h-full w-full" emojiClassName="text-[clamp(4rem,13vh,9rem)]" />
      </div>
      <h1 className="text-[clamp(2.5rem,8vh,5rem)] font-black tracking-tight text-lime">
        {item ? itemName(item, lang) : t("common.tbd")}
      </h1>
      <p className="text-white/60">{t("stage.wins")}</p>
    </div>
  );
}
