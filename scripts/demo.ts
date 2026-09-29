import { loadCategories } from "../server/store.ts";
import { createTournament, currentMatch, completeMatch } from "../engine/tournament.ts";
import { castChatVote, castGiftVote, resolveWinner } from "../engine/match.ts";
import { fakeViewer, pickSide } from "../engine/simulate.ts";
import { DEFAULT_SETTINGS, ROUND_LABELS } from "../shared/config.ts";
import type { Category, Match } from "../shared/types.ts";

const only = process.argv.find((a) => a.startsWith("--category="))?.split("=")[1];

function nameOf(category: Category, id: string | null): string {
  if (!id) return "TBD";
  return category.items.find((i) => i.id === id)?.name ?? id;
}

function playMatch(match: Match): string {
  match.status = "live";
  const voters = 6 + Math.floor(Math.random() * 25);
  for (let i = 0; i < voters; i++) {
    const side = pickSide(Math.random);
    const item = side === "a" ? match.a : match.b;
    if (!item) continue;
    if (Math.random() < 0.15) castGiftVote(match, item, fakeViewer(Math.random), DEFAULT_SETTINGS);
    else castChatVote(match, item, fakeViewer(Math.random), DEFAULT_SETTINGS);
  }
  return resolveWinner(match, DEFAULT_SETTINGS, Math.random) ?? match.a ?? "TBD";
}

async function main(): Promise<void> {
  const categories = await loadCategories();
  const list = only ? categories.filter((c) => c.id === only) : categories;

  console.log(`Pick League demo — ${list.length} categor${list.length === 1 ? "y" : "ies"}\n`);

  const champions: string[] = [];

  for (const category of list) {
    const photos = category.items.filter((i) => i.image).length;
    console.log(`=== ${category.name}  (photos ${photos}/${category.items.length}) ===`);

    const tournament = createTournament(category, "demo");
    let guard = 0;
    while (tournament.status !== "done" && guard < 40) {
      const match = currentMatch(tournament);
      if (!match) break;
      const winner = playMatch(match);
      completeMatch(tournament, winner);
      const a = nameOf(category, match.a);
      const b = nameOf(category, match.b);
      console.log(
        `  ${ROUND_LABELS[match.round].padEnd(13)} ${a} ${match.votesA} - ${match.votesB} ${b}  ->  ${nameOf(category, winner)}`,
      );
      guard++;
    }
    const champion = nameOf(category, tournament.champion);
    champions.push(`${category.name}: ${champion}`);
    console.log(`  CHAMPION: ${champion}\n`);
  }

  console.log("Winners:");
  for (const line of champions) console.log(`  ${line}`);
}

main().catch((error) => {
  console.error("[demo] failed:", error);
  process.exit(1);
});
