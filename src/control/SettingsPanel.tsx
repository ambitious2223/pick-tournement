import type { ReactNode } from "react";
import type { Settings } from "../../shared/types.ts";
import { Field, TextInput, Select, Toggle } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";

const patch = (p: Partial<Settings>): void => void send("settings:update", p);

export function SettingsPanel({ settings }: { settings: Settings }): ReactNode {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Round (s)">
          <TextInput type="number" min={5} value={settings.roundSeconds} onChange={(e) => patch({ roundSeconds: Number(e.target.value) })} className="px-2 py-1 text-xs" />
        </Field>
        <Field label="Sudden death (s)">
          <TextInput type="number" min={1} value={settings.suddenDeathSeconds} onChange={(e) => patch({ suddenDeathSeconds: Number(e.target.value) })} className="px-2 py-1 text-xs" />
        </Field>
        <Field label="Chat weight">
          <TextInput type="number" min={1} value={settings.chatWeight} onChange={(e) => patch({ chatWeight: Number(e.target.value) })} className="px-2 py-1 text-xs" />
        </Field>
        <Field label="Gift weight">
          <TextInput type="number" min={1} value={settings.giftWeight} onChange={(e) => patch({ giftWeight: Number(e.target.value) })} className="px-2 py-1 text-xs" />
        </Field>
      </div>
      <Field label="Tie rule">
        <Select value={settings.tieRule} onChange={(e) => patch({ tieRule: e.target.value as Settings["tieRule"] })} className="px-2 py-1 text-xs">
          <option value="sudden-death">Sudden death</option>
          <option value="random">Random</option>
          <option value="higher-seed">Higher seed</option>
        </Select>
      </Field>
      <Toggle label="One chat vote per viewer" checked={settings.dedupeChat} onChange={(v) => patch({ dedupeChat: v })} />
      <Toggle label="Auto-start next match" checked={settings.autoNextMatch} onChange={(v) => patch({ autoNextMatch: v })} />
      <Toggle label="Auto-chain next tournament" checked={settings.autoNextTournament} onChange={(v) => patch({ autoNextTournament: v })} />
    </div>
  );
}
