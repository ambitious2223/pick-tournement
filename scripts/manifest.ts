import type { GameManifest, ManifestEffect, ManifestParam } from "../shared/types.ts";

const str = (key: string, label: string): ManifestParam => ({ key, label, type: "string" });
const choice = (key: string, label: string, type: string): ManifestParam => ({ key, label, type });

/**
 * The whole declared surface: ten viewer power-ups. Nothing cosmetic, nothing
 * that a host could already do from the Control room.
 *
 * Params whose values are a small, guessable set declare a preset type instead
 * of `string`/`number` — Tikora's Trigger → Effect mapper renders those as a
 * chip row above the input, so nobody has to know what to type:
 *
 *   `side`   → left / right
 *   `secs`   → 3 · 5 · 10 · 15 · 30 · 60 · 120 · 300
 *   `mult`   → 2 · 3 · 4 · 5
 *   `votes`  → 1 · 5 · 10 · 25 · 50 · 100 · {coins} · {count}
 *
 * These types deliberately stay out of Tikora's `number` branch: that branch
 * runs `Number()` on the value, which turns `{coins}` into null before it ever
 * reaches us. Preset types travel as strings and are parsed on this side.
 */
const CORE: ManifestEffect[] = [
  {
    key: "add_vote",
    label: "Votes · add to a side",
    kind: "powerup",
    params: [choice("side", "Side", "side"), choice("amount", "Votes", "votes"), str("viewer", "Voter name (optional)")],
  },
  {
    key: "boost_side",
    label: "Votes · boost a side",
    kind: "powerup",
    params: [
      choice("side", "Side", "side"),
      choice("multiplier", "Multiplier", "mult"),
      choice("seconds", "Seconds", "secs"),
    ],
  },
  {
    key: "steal_votes",
    label: "Votes · steal from the leader",
    kind: "powerup",
    params: [choice("amount", "Votes to move", "votes")],
  },
  {
    key: "block_side",
    label: "Votes · block a side from scoring",
    kind: "powerup",
    params: [choice("side", "Side to block", "side"), choice("seconds", "Seconds", "secs")],
  },
  {
    key: "add_time",
    label: "Time · buy extra seconds",
    kind: "powerup",
    params: [choice("seconds", "Seconds to add", "secs")],
  },
  {
    key: "rush_timer",
    label: "Time · rush the clock",
    kind: "powerup",
    params: [choice("seconds", "New time left", "secs")],
  },
  {
    key: "freeze_timer",
    label: "Time · freeze the clock",
    kind: "powerup",
    params: [choice("seconds", "Seconds to hold", "secs")],
  },
  {
    key: "set_side_gift",
    label: "Gifts · bind a gift to a side",
    kind: "powerup",
    params: [
      choice("side", "Side", "side"),
      str("gift", "Gift name"),
      str("icon", "Gift icon (emoji)"),
      choice("amount", "Votes now (leave blank for none)", "votes"),
    ],
  },
  { key: "swap_sides", label: "Match · swap the two competitors", kind: "powerup" },
  {
    key: "category_vote",
    label: "Next · vote for the next category",
    kind: "powerup",
    params: [str("category", "Category name"), str("viewer", "Voter name (optional)")],
  },
];

export function buildManifest(): GameManifest {
  return {
    slug: "pick-league",
    effects: [...CORE],
    events: [
      { key: "chat", label: "Chat comment" },
      { key: "gift", label: "Gift" },
      { key: "like", label: "Like" },
      { key: "follow", label: "Follow" },
      { key: "share", label: "Share" },
      { key: "subscribe", label: "Subscribe" },
      { key: "member", label: "New member" },
    ],
  };
}
