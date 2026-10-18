# Pick League

A local web app for **TikTok Live** bracket tournaments. Competitors enter a category, viewers
vote, one champion comes out — then the next category in the queue begins automatically.

Arabic-first interface (right-to-left) with an English toggle, shown as a standalone **show window**
you capture as-is. It runs with a built-in simulator, or with **real TikTok events** through your
local **Tikora** hub — no TikTok login inside this app.

## What it does

- **Single-elimination brackets**, up to 16 competitors per category
  (Round of 16 → Quarterfinals → Semifinals → Grand Final). Fewer than 16 is fine — empty slots are
  byes.
- **Two ways to vote:** chat (type the on-screen name in Arabic or English) and gifts (each side
  shows a gift; sending it counts for that side).
- **Automatic broadcast flow** with per-round colours escalating cyan → blue → purple → gold, and a
  golden final showing the top supporters. Between matches the show window plays a **bracket
  cinematic** (a zoom-in before each match, a zoom-out after) and then cuts back to the voting
  screen.
- **Two content libraries, one per language.** Switching the interface language switches the whole
  content set — its own categories and its own play queue. Arabic is the default library; the
  English library starts empty. Switching language stops a running show first, so a bracket never
  points at the other library's competitors.
- **Content Studio and a Queue tab** — create and edit categories as visual cards (a photo tile per
  competitor) in Studio, then line up the next categories in Control → Queue. A **Debug console**
  covers injecting votes, the Live connection, photos, timings, the event log and raw state.
- **A plain-language Setup guide** at `/setup`, linked from the top bar, walks through the one-time
  setup and the everyday controls.
- Categories live in `data/categories/`, each tagged with its language (`lang`) and its own chat
  aliases.

## Quick start

**Easiest (Windows):** double-click **`Tournament.bat`**. It installs dependencies on the first run,
seeds the categories, downloads free photos once, builds the app, starts **one server on one port**
(`127.0.0.1:8787`) and opens the Control room in a new tab. Skip the browser with `PL_NO_BROWSER=1`,
or the one-time photo fetch with `PL_NO_PHOTOS=1`.

**First time?** Open the Control room, put categories in the queue, then press **Start show** on the
**Run** tab and watch the show window at `/overlay`. The in-app **Guide** at `/setup` lists the same
steps with the current buttons.

Or by hand:

```bash
npm install
npm run seed          # write the built-in categories (also runs on first serve)
npm run seed:photos   # optional: free Wikimedia photos
npm run build
npm run serve         # one server on http://127.0.0.1:8787
```

- Control room → `/control` · Show window → `/overlay` (alias `/show`)
- Setup guide → `/setup` · Content Studio → `/studio` · Debug console → `/debug`

## The show window

`/overlay` (also `/show`) runs the whole show and is the only page that plays sound, so the Control
room never doubles the audio. It has a solid background whose color you pick live from the hue
wheel in **Control → Settings → Appearance** (default near-black).

Open `http://127.0.0.1:8787/overlay` in the window you capture, then press **Control → Run → Start
show**.

Between matches the overlay alternates with a **bracket cinematic** — it zooms into the live match,
then pulls back out after the result — paced from **Control → Settings → Advanced → Show look &
pacing** (intro / outro / recap length and the overall speed). The on-screen voting instructions are
**off by default**; turn them back on under **Control → Settings → Show voting instructions**.

## Connecting to TikTok Live (via Tikora)

Pick League does **not** log into TikTok — it reads events from your local **Tikora** hub, which
owns the TikTok connection (and can bridge TikFinity). It connects to `ws://127.0.0.1:27016/` and
reconnects on its own.

1. Start **Tikora**.
2. Start Pick League. It finds Tikora and picks up the **game key automatically** — on a brand-new
   machine it registers the game in Tikora's Game Hub and generates the key itself. Nothing to copy
   and paste. The dot in **Debug → Live connection** turns green when the link is up.
3. Chat votes, gifts vote by gift name, and likes/follows/shares build the **top supporters** shown
   in the final. Avatars are cached locally.

`tikora.manifest.json` is the single source of truth for the effects the hub can trigger here.
Tikora reads it from this folder — so the list appears in **Stream Deck → Game Hub** before Pick
League connects — and Pick League re-sends it as its `capabilities` on every connect.

Map **any** viewer interaction (gift, tier, coin amount, comment keyword, like every N, follow,
share, subscribe, member — with a who-filter, cooldown and delay) to the **ten viewer power-ups**:

- **Votes** — add to a side · steal from the leader (capped so the lead can never flip) · boost one
  side ×N for N seconds · block a side from scoring.
- **The clock** — buy seconds · rush the countdown · freeze it (the number stops, the match runs on).
- **The board** — bind a gift to the left/right side · swap the two competitors · vote for the next
  category.

Amounts accept `{coins}` and `{count}`, so a mapping can award votes equal to the gift's value.
Nothing cosmetic, sound or host-side is declared — gameplay only. Build the list in
`scripts/manifest.ts` and run **`npm run manifest`**; tests fail if the file, the effect list and
the handlers disagree, and `npm run smoke` proves each effect changes the match as claimed.

No Tikora? Open **Control → Simulator**. It has the simulated crowd, how many votes per tick and how
fast, the gift chance, and one-tap **Demo 1 / Demo all / Rehearsal** (which run the whole show,
cinematic included) so you can preview everything offline. The show itself starts from **Run**;
stage size and bracket pacing live in **Settings → Advanced**.

## Sound effects (upload only)

Pick League has **no built-in tones any more**. Every cue stays silent until you upload a file for
it; **Settings → Advanced → Sound files** shows each one as **Missing** or **Uploaded**. Cues are
short effects — mp3, ogg, wav, webm or m4a (≤ 8 MB) — uploaded there, landing in gitignored
`data/sounds/<id>.<ext>` and served at `/sounds/…`. Each cue plays through the SFX bus with a gentle
fade in/out, is rate-limited where noted, and can be muted per cue or previewed.

After the one-time setup, everyday sound lives on the **Run** tab: mute and the master volume
slider. The other buses (**SFX / Voice**) stay in Settings → Advanced. The broadcast page is the
only page that plays audio — press **🔊 Tap to enable sound** once.

| Cue id | When it plays | What it should be |
| --- | --- | --- |
| `category.start` | the show opens the “vote for the next category” screen | rising, welcoming sting (~1.2s) |
| `category.vote` | each chat message that votes for a category | quick, soft tick |
| `category.winner` | the category vote closes and a category is chosen | short uplifting 3-note flourish |
| `round.intro` | a new round is announced (Round of 16 → Final) | tension riser that grows each round |
| `bracket.intro` | the bracket cinematic starts (zoom-in) | energetic whoosh |
| `bracket.focus` | the camera settles on the live match | small tick |
| `bracket.zoom.in` | during the bracket zoom into the live match | rising sweep |
| `bracket.reveal` | the cinematic reveals the next match / outcome | bright 4-note hit |
| `bracket.loser` | a competitor is eliminated in the bracket | soft descending thud |
| `bracket.tension` | later rounds only (semis/final) during the bracket | heartbeat pulse |
| `bracket.outro` | the bracket cinematic winds down (zoom-out) | smooth wind-down |
| `bracket.winner` | the bracket advances a winner | warm 2-note confirmation |
| `match.countdown` | the 3-2-1 just before a match goes live | short countdown beep |
| `match.start` | a match goes live | bright triple chirp with a kick |
| `match.tick` | each of the last 10 seconds | short clock tick |
| `match.suddenDeath` | a tie triggers sudden death | low dramatic stab |
| `match.end` | the match clock ends | closing impact |
| `vote.chat` | every chat vote during a match (rate-limited) | tiny blip |
| `vote.gift.small` | a small gift (under 10 coins) | cheerful 2-note sparkle |
| `vote.gift.medium` | a medium gift (10–49 coins) | 3-note riff |
| `vote.gift.large` | a big gift (50+ coins) | big 4-note fanfare |
| `vote.lead` | the vote lead changes sides | rising 2-note alert |
| `result.win` | the result screen appears | uplifting 4-note run |
| `result.lose` | the losing side is shown | soft descending tone |
| `champion.win` | a champion is crowned (also the “test sound” cue) | full victory fanfare |
| `champion.reveal` | 0.8s after a champion is crowned | shimmer / sparkle |
| `champion.supporter` | each top supporter is revealed on the final | bright ping |
| `live.like` | viewers are liking (rate-limited) | soft marimba tick |
| `live.follow` | a new follower | 2-note chime |
| `live.share` | a viewer shares the stream | 2-note blip |
| `live.subscribe` | a new subscriber | 4-note rise |
| `live.member` | a new member joins (rate-limited) | single warm tone |

The same list, with Arabic and English descriptions, is shown in the app next to every upload.

## How voting resolves

Chat text is normalized (case, accents, punctuation, Arabic spelling variants) and matched against
the two on-screen names/aliases: whole name → first word → three-letter prefix → then close
misspellings. No match is ignored, and two equally close matches are ignored rather than guessed.
A gift matches the item whose gift **name** it is (or the category's gift pair) and counts heavier
than a chat vote. When the timer ends the higher total advances; ties follow the tie rule (default:
sudden death). Picking a category in the dropdown only **selects** it — **Start / restart** launches
it.

## Photos, avatars & safety

No external network calls at runtime, with two approved exceptions: `server/imageCache.ts` fetches a
single viewer avatar or gift picture from a URL the local hub delivered (verified, size-capped,
cached under `data/`), and `npm run seed:photos` queries English and Arabic Wikipedia then Commons —
allowlisted hosts only, real image types only, fair-use rejected, every URL logged to
`data/photos.log`. Everything lands in gitignored `data/uploads/`, `data/avatars/` and `data/gifts/`.
Items without a photo fall back to their emoji or an initial tile.

## Scripts

| Script | Purpose |
| --- | --- |
| `Tournament.bat` | Build + serve on one port and open the Control room |
| `npm run serve` | Serve the built app on `:8787` (`-- --open` opens a browser; restarts a running instance) |
| `npm run dev` | Dev: server `:8787` + Vite `:5173` with hot reload |
| `npm run build` | Build to `dist/` |
| `npm start` | Serve without rebuilding |
| `npm run demo` | Play every category's bracket in the terminal (`-- --category=ID`) |
| `npm run seed` | Write the built-in categories (`--force` to overwrite) |
| `npm run seed:photos` | Fetch free photos (`--category=id`, `--limit=N`, `--force`) |
| `npm run manifest` | Regenerate `tikora.manifest.json` from `scripts/manifest.ts` |
| `npm run smoke` | Prove the auto game key and every declared effect end to end |
| `npm run typecheck` / `lint` / `test` | Quality gates |

See `AGENTS.md` for contributor conventions, the project layout and the safety rules.
