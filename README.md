# Pick League

A local web app for **TikTok Live** bracket tournaments. Competitors enter a category, viewers
vote, one champion comes out — then the next category in the queue begins automatically.

Arabic-first interface (right-to-left) with an English toggle, designed to be added to **OBS as a
Browser Source**. It runs with a built-in simulator, or with **real TikTok events** through your
local **Tikora** hub — no TikTok login inside this app.

## What it does

- **Single-elimination brackets**, up to 16 competitors per category
  (Round of 16 → Quarterfinals → Semifinals → Grand Final). Fewer than 16 is fine — empty slots are
  byes.
- **Two ways to vote:** chat (type the on-screen name in Arabic or English) and gifts (each side
  shows a gift; sending it counts for that side).
- **Automatic broadcast flow** with per-round colours escalating cyan → blue → purple → gold, and a
  golden final showing the top supporters.
- **Content Studio and a Content tab** to create categories, add or remove competitors, and upload
  photos; a **Debug console** for injecting votes, simulating a crowd, the Live connection and the
  Sound & Music mixer.
- Categories live in `data/categories/`, each with English **and** Arabic names and aliases.

## Quick start

**Easiest (Windows):** double-click **`Tournament.bat`**. It installs dependencies on the first run,
seeds the categories, downloads free photos once, builds the app, starts **one server on one port**
(`127.0.0.1:8787`) and opens the Control room in a new tab. Skip the browser with `PL_NO_BROWSER=1`,
or the one-time photo fetch with `PL_NO_PHOTOS=1`.

**First time?** Open the in-app guide at `http://127.0.0.1:8787/setup`.

Or by hand:

```bash
npm install
npm run seed          # write the built-in categories (also runs on first serve)
npm run seed:photos   # optional: free Wikimedia photos
npm run build
npm run serve         # one server on http://127.0.0.1:8787
```

- Setup guide → `/setup` · Control room → `/control` · Broadcast for OBS → `/overlay` (alias `/show`)
- Content Studio → `/studio` · Debug console → `/debug`

## The broadcast page

`/overlay` (also `/show`) runs the whole show and is the only page that plays sound, so the Control
room never doubles the audio. Transparent by default so it sits over your camera — switch to a dark
scene in Settings; safe-area margins let it fit the middle band of a vertical canvas.

In OBS: **Add → Browser Source**, URL `http://127.0.0.1:8787/overlay`, size it to the middle band,
keep the **transparent background**, then **Control → Show → Start**.

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

No Tikora? Use the **Simulator** or the Debug vote injector to rehearse.

## Sound & music

Web Audio mixer with **Master / Music / SFX / Voice** buses, a reverb send, procedural cues and a
**10-track music library**.

- Tune it in **Debug → Sound & Music** (bus sliders, per-cue on/off, per-track volume, Preview) or
  pick the background track in **Control → Sound**. Settings apply live and persist.
- Replace any built-in cue with **`data/sounds/<cue>.mp3|ogg|wav|webm`** (gitignored, served at
  `/sounds/…`).
- Broadcast page only — press **🔊 Tap to enable sound** once (OBS does this automatically).

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
