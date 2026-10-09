import { readFile, readdir, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { Session } from "../server/session.ts";
import { LiveClient } from "../server/live.ts";
import { buildManifest } from "./manifest.ts";

const SESSION_FILE = new URL("../data/session.json", import.meta.url);
const CATEGORY_DIR = new URL("../data/categories/", import.meta.url);
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const results: { what: string; ok: boolean; expected: boolean; note: string }[] = [];
function check(what: string, ok: boolean, expected = true, note = ""): void {
  results.push({ what, ok, expected, note });
}
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const sign = (n: number): number => (n > 0 ? 1 : n < 0 ? -1 : 0);

const original = await readFile(SESSION_FILE, "utf8").catch(() => null);
const categoryFiles = (await readdir(CATEGORY_DIR)).filter((name) => name.endsWith(".json"));
const categoryBackup = new Map<string, string>();
for (const name of categoryFiles) categoryBackup.set(name, await readFile(new URL(name, CATEGORY_DIR), "utf8"));

let imageServer: Server | null = null;

try {
  const image = createServer((req, res) => {
    if (req.url === "/rose.png") {
      res.writeHead(200, { "content-type": "image/png" });
      res.end(PNG);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  imageServer = image;
  await new Promise<void>((resolve) => image.listen(0, "127.0.0.1", () => resolve()));
  const address = image.address();
  const imageBase = address && typeof address === "object" ? `http://127.0.0.1:${address.port}` : "";

  const session = await Session.create();
  const declared = buildManifest().effects.map((e) => e.key);
  check("manifest declares exactly 10 effects", declared.length === 10, true, declared.join(","));

  session.startTournament();
  session.startMatch();

  const match = () => {
    const t = session.state.tournament;
    if (!t) return null;
    return t.bracket.rounds[t.currentRound][t.currentMatchIndex] ?? null;
  };
  const category = () => session.state.categories.find((c) => c.id === session.state.tournament?.categoryId) ?? null;
  const nameOf = (id: string | null): string => category()?.items.find((i) => i.id === id)?.name ?? "";
  const settings = session.state.settings;

  const m = match();
  check("match is live", Boolean(m && m.status === "live"), true, `status=${m?.status}`);
  const nameA = nameOf(m?.a ?? null);
  const nameB = nameOf(m?.b ?? null);
  check("both competitors have names", Boolean(nameA && nameB), true, `${nameA} vs ${nameB}`);

  // --- add_vote -------------------------------------------------------------
  const beforeVote = { a: m?.votesA ?? 0, b: m?.votesB ?? 0 };
  check(
    "add_vote adds exactly N to the chosen side",
    session.handleLiveEffect("add_vote", { side: "left", amount: "7", viewer: "luna" }),
    true,
  );
  check(
    "  only that side moved",
    (m?.votesA ?? 0) === beforeVote.a + 7 && (m?.votesB ?? 0) === beforeVote.b,
    true,
    `a=${m?.votesA} b=${m?.votesB}`,
  );

  const beforeFallback = m?.votesB ?? 0;
  check(
    "add_vote falls back to the gift weight when the amount is not a number",
    session.handleLiveEffect("add_vote", { side: "right", amount: "{coins}" }),
    true,
  );
  check(
    "  fallback equals giftWeight",
    (m?.votesB ?? 0) === beforeFallback + settings.giftWeight,
    true,
    `+${(m?.votesB ?? 0) - beforeFallback} vs giftWeight ${settings.giftWeight}`,
  );

  // Widen the gap so a steal has room to move votes without flipping the lead.
  session.handleLiveEffect("add_vote", { side: "left", amount: "40" });

  // --- steal_votes ----------------------------------------------------------
  const beforeSteal = { a: m?.votesA ?? 0, b: m?.votesB ?? 0 };
  const diff = beforeSteal.a - beforeSteal.b;
  const expectedMove = Math.min(5, Math.floor(Math.abs(diff) / 2));
  check("steal_votes runs", session.handleLiveEffect("steal_votes", { amount: "5" }), true);
  const afterSteal = { a: m?.votesA ?? 0, b: m?.votesB ?? 0 };
  const moved = diff > 0 ? beforeSteal.a - afterSteal.a : afterSteal.b - beforeSteal.b;
  check(
    "  moved exactly the safe amount",
    moved === expectedMove,
    true,
    `${beforeSteal.a}-${beforeSteal.b} -> ${afterSteal.a}-${afterSteal.b} (expected ${expectedMove})`,
  );
  check(
    "  the lead was never flipped",
    sign(afterSteal.a - afterSteal.b) === 0 || sign(afterSteal.a - afterSteal.b) === sign(diff),
    true,
    `gap ${diff} -> ${afterSteal.a - afterSteal.b}`,
  );
  check("  no votes were created", afterSteal.a + afterSteal.b === beforeSteal.a + beforeSteal.b, true);

  // --- clock ----------------------------------------------------------------
  const beforeTime = m?.endsAt ?? 0;
  check("add_time extends the deadline", session.handleLiveEffect("add_time", { seconds: "20" }), true);
  check("  deadline moved by 20s", (m?.endsAt ?? 0) >= beforeTime + 19_000, true, `+${(m?.endsAt ?? 0) - beforeTime}ms`);

  check("rush_timer shortens the clock", session.handleLiveEffect("rush_timer", { seconds: "15" }), true);
  const rushed = m?.endsAt ?? 0;
  check(
    "  new deadline is ~15s out",
    rushed > Date.now() + 14_000 && rushed < Date.now() + 17_000,
    true,
    `${Math.round((rushed - Date.now()) / 1000)}s`,
  );
  check("rush_timer refuses to add time", session.handleLiveEffect("rush_timer", { seconds: "600" }), false);

  const beforeFreeze = m?.endsAt ?? 0;
  check("freeze_timer runs", session.handleLiveEffect("freeze_timer", { seconds: "1" }), true);
  const hold = session.state.matchHold;
  check("  clock is held, match still running", session.state.status === "running" && Boolean(hold), true, session.state.status);
  check("  hold carries the real remaining value", Boolean(hold && hold.remainingMs > 0 && hold.remainingMs < 60_000), true, `held=${hold?.remainingMs}`);
  check("  deadline pushed out by the freeze", (m?.endsAt ?? 0) >= beforeFreeze + 900, true, `+${(m?.endsAt ?? 0) - beforeFreeze}ms`);
  await sleep(1300);
  check("  hold released when the freeze ends", session.state.matchHold === null, true, JSON.stringify(session.state.matchHold));

  // --- gift binding ---------------------------------------------------------
  const hub = new LiveClient({
    config: { url: "", slug: "pick-league", key: "" },
    onEvent: () => undefined,
    onEffect: () => false,
    onStatus: () => undefined,
  });
  hub.setCatalogue([
    { id: 1, name: "Rose", coins: 1, tier: "small", img: `${imageBase}/rose.png` },
    { id: 2, name: "TikTok", coins: 1, tier: "small" },
    { id: 3, name: "Heart", coins: 10, tier: "medium" },
  ]);
  session.attachLive(hub, { url: "", slug: "pick-league", key: "" });

  const beforeBindVote = m?.votesA ?? 0;
  check(
    "set_side_gift takes only a gift name — no icon to type",
    session.handleLiveEffect("set_side_gift", { side: "left", gift: "Rose", amount: "4" }),
    true,
  );
  await sleep(600);
  const leftItem = category()?.items.find((i) => i.id === (m?.a ?? ""));
  const rightItem = category()?.items.find((i) => i.id === (m?.b ?? ""));
  check("  gift id resolved from the hub catalogue", leftItem?.gift?.id === "1", true, leftItem?.gift?.id ?? "none");
  check(
    "  real artwork cached locally",
    (leftItem?.gift?.img ?? "").startsWith("/gifts/"),
    true,
    leftItem?.gift?.img ?? "none",
  );
  check("  name kept exactly so vote routing still matches", leftItem?.gift?.name === "Rose", true, leftItem?.gift?.name);
  check("  the other side is untouched", rightItem?.gift?.name !== "Rose", true, rightItem?.gift?.name ?? "none");
  check("  binding also cast its votes", (m?.votesA ?? 0) === beforeBindVote + 4, true, `${beforeBindVote} -> ${m?.votesA}`);

  // --- swap -----------------------------------------------------------------
  const beforeSwap = {
    a: m?.a ?? null,
    b: m?.b ?? null,
    votesA: m?.votesA ?? 0,
    votesB: m?.votesB ?? 0,
    pair: (category()?.giftPair ?? []).map((g) => g.name).join("/"),
  };
  session.handleLiveEffect("boost_side", { side: "right", multiplier: "3", seconds: "5" });
  check("swap_sides runs", session.handleLiveEffect("swap_sides", {}), true);
  check(
    "  competitors exchanged",
    m?.a === beforeSwap.b && m?.b === beforeSwap.a,
    true,
    `${m?.a} / ${m?.b}`,
  );
  check(
    "  votes followed their competitor",
    m?.votesA === beforeSwap.votesB && m?.votesB === beforeSwap.votesA,
    true,
    `${m?.votesA}-${m?.votesB}`,
  );
  const afterPair = (category()?.giftPair ?? []).map((g) => g.name).join("/");
  check("  gift bindings swapped with them", afterPair !== beforeSwap.pair && afterPair !== "", true, `${beforeSwap.pair} -> ${afterPair}`);
  const activeSideEffect = session.state.sideEffects.find((e) => e.kind === "boost");
  check("  active power-ups follow their competitor", activeSideEffect?.side === "a", true, activeSideEffect?.side ?? "none");

  // --- boost (exact multiplier) --------------------------------------------
  session.startMatch();
  const fresh = match();
  const beforeBoost = fresh?.votesA ?? 0;
  check("boost_side arms a power-up", session.handleLiveEffect("boost_side", { side: "left", multiplier: "3", seconds: "2" }), true);
  check("  badge state published", session.state.sideEffects.some((e) => e.kind === "boost" && e.side === "a"), true, JSON.stringify(session.state.sideEffects));
  session.chatVote(nameOf(fresh?.a ?? null), "boosted-voter");
  const boostedGain = (fresh?.votesA ?? 0) - beforeBoost;
  check(
    "  a chat vote is worth 3x while boosted",
    boostedGain === settings.chatWeight * 3,
    true,
    `+${boostedGain} vs chatWeight ${settings.chatWeight}`,
  );

  // --- block ----------------------------------------------------------------
  session.startMatch();
  const blocked = match();
  check("block_side arms a power-up", session.handleLiveEffect("block_side", { side: "left", seconds: "2" }), true);
  const beforeBlock = blocked?.votesA ?? 0;
  session.chatVote(nameOf(blocked?.a ?? null), "blocked-voter-1");
  session.giftVote("whatever", "blocked-voter-2");
  check("  blocked side scores nothing", (blocked?.votesA ?? 0) === beforeBlock, true, `a=${blocked?.votesA}`);
  const beforeOther = blocked?.votesB ?? 0;
  session.chatVote(nameOf(blocked?.b ?? null), "free-voter");
  check("  the other side still scores", (blocked?.votesB ?? 0) > beforeOther, true, `b=${blocked?.votesB}`);
  await sleep(2300);
  check("  block expires on its own", !session.state.sideEffects.some((e) => e.kind === "block"), true, JSON.stringify(session.state.sideEffects));
  const afterBlock = blocked?.votesA ?? 0;
  session.chatVote(nameOf(blocked?.a ?? null), "blocked-voter-3");
  check("  scoring resumes once it expires", (blocked?.votesA ?? 0) > afterBlock, true, `a=${blocked?.votesA}`);

  // --- category vote --------------------------------------------------------
  session.startShow();
  check("show is in the category phase", session.state.show.active && session.state.show.phase === "category", true, session.state.show.phase);
  check("add_vote with no live match is refused", session.handleLiveEffect("add_vote", { side: "left", amount: "5" }), false);
  const target = "Arab Football Stars";
  const targetId = session.state.categories.find((c) => c.name === target)?.id ?? "";
  check("category_vote runs", session.handleLiveEffect("category_vote", { category: target, viewer: "voter-x" }), true);
  check(
    "  the category gained a vote",
    (session.state.show.categoryVotes[targetId] ?? 0) > 0,
    true,
    JSON.stringify(session.state.show.categoryVotes),
  );
  session.stopShow();

  // --- binding before any tournament exists --------------------------------
  const pairsBefore = session.state.categories.map((c) => c.giftPair?.[1]?.name ?? "");
  check(
    "set_side_gift works before a tournament exists",
    session.handleLiveEffect("set_side_gift", { side: "right", gift: "Heart" }),
    true,
  );
  const pairsAfter = session.state.categories.map((c) => c.giftPair?.[1]?.name ?? "");
  check(
    "  it bound the queued/first category",
    pairsAfter.filter((name) => name === "Heart").length === 1 && !pairsBefore.includes("Heart"),
    true,
    pairsAfter.join(","),
  );

  // --- only declared effects get through ------------------------------------
  check("a host/ops effect is no longer declared", session.handleLiveEffect("show_start", {}), false);
  check("a sound effect is no longer declared", session.handleLiveEffect("cue.match.start", {}), false);
  check("a music effect is no longer declared", session.handleLiveEffect("track.arena-pump", {}), false);
  check("a cosmetic effect is no longer declared", session.handleLiveEffect("confetti", {}), false);
  check("an unknown effect is refused", session.handleLiveEffect("spawn_dragon", {}), false);
} finally {
  // Category bindings are persisted fire-and-forget; let those writes land
  // before putting the originals back, or they would clobber the restore.
  await sleep(600);
  if (original !== null) await writeFile(SESSION_FILE, original, "utf8");
  for (const [name, text] of categoryBackup) await writeFile(new URL(name, CATEGORY_DIR), text);
  if (imageServer) {
    await new Promise<void>((resolve) => imageServer?.close(() => resolve()));
    imageServer = null;
  }
}

let failed = 0;
for (const row of results) {
  const pass = row.ok === row.expected;
  if (!pass) failed += 1;
  console.log(`${pass ? "PASS" : "FAIL"}  ${row.what}${row.note ? `  (${row.note})` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
