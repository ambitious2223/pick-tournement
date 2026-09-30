# Pick League

A local web app for **TikTok Live** bracket tournaments. Sixteen items enter a category,
viewers vote, and one champion comes out — then the next category in the queue begins
automatically.

Arabic-first interface (right-to-left) with an English toggle. Designed to be added to **OBS as a
Browser Source**. It runs with a built-in simulator, or with **real TikTok events** through your
local **Tikora** hub — no TikTok login inside this app.

## What it does

- **16-item single elimination** per category: Round of 16 → Quarterfinals → Semifinals → Grand Final.
- **Arabic-first UI (RTL)** with an English toggle; the built-in categories carry **Arabic and
  English** names and aliases.
- **Two ways to vote**
  - **Chat:** a viewer types the on-screen name (or an alias) — it must match one of the two options.
    Names can be typed in **Arabic or English**.
  - **Gifts:** each side shows a gift; sending that gift counts for that side (weighted).
- **Automatic broadcast flow:** category vote → round intro → bracket → match → bracket → result →
  next match → … → champion, then chains to the next category. Start / Pause / Resume / Skip from
  the Control Room, with manual overrides.
- **Per-round color themes** escalating **cyan → blue → purple → gold**; the Grand Final gets golden
  framing with the **top supporters** (avatar, nickname, points).
- **Detailed sound system** (Web Audio): cues for every phase and animation, gift tiers, sudden
  death, countdown and last-10 ticks, a champion / top-pickers reveal, and per-round **music beds** —
  all tunable.
- **Live TikTok via Tikora:** chat votes, gifts vote by gift name, and likes/follows/shares build the
  supporter leaderboard (with cached avatars).
- **Configurable round timer**, a category queue, auto-advance, and tie rules.
- **Content Studio** — create categories, edit 16 items, add aliases, and upload photos.
- **Debug console** — inject votes, simulate a crowd, force outcomes, jump rounds, the **Live
  connection** panel, the **Sound & Music** mixer, and raw state.
- **Ten Middle East categories seeded**, each with English **and Arabic** aliases.

## Quick start

**Easiest (Windows):** double-click **`Tournament.bat`**. It installs dependencies on the first
run, seeds the categories, downloads free photos once, builds the app, starts **one server on one
port** (`127.0.0.1:8787`) and opens the Control Room in a new tab (your other tabs are never
touched). Skip the browser with `PL_NO_BROWSER=1`, or the one-time photo fetch with `PL_NO_PHOTOS=1`.

**First time?** Open the in-app **Setup guide** at `http://127.0.0.1:8787/setup` — it walks through
connecting TikTok and adding the OBS source.

Or run the steps manually:

```bash
npm install
npm run seed          # writes the ten built-in categories (auto-runs on first serve too)
npm run seed:photos   # optional: fetch free Wikimedia photos for the items
npm run build         # build the app
npm run serve         # one server on http://127.0.0.1:8787
```

Open:

- Setup guide → http://127.0.0.1:8787/setup
- Control room → http://127.0.0.1:8787/control
- Broadcast (for OBS) → http://127.0.0.1:8787/overlay (alias: `/show`)
- Content studio → http://127.0.0.1:8787/studio
- Debug console → http://127.0.0.1:8787/debug

## The broadcast page

`/overlay` is the single broadcast page (also at `/show`). It runs the whole show automatically and
is the only page that plays sound, so the host can work in Control with no double audio.

- **Transparent by default** so it sits over your camera in OBS; switch to a dark scene in Settings.
- **Safe-area margins** (top/bottom %) plus responsive sizing so it fits the middle band of a
  vertical canvas between your camera and the comments.
- Per-round colors escalate **cyan → blue → purple → gold**; the final shows the top supporters.

In OBS: **Add → Browser Source**, URL `http://127.0.0.1:8787/overlay`, size it to the middle band,
keep the **transparent background**. Then **Control → Show → Start**.

## Connecting to TikTok Live (via Tikora)

Pick League does **not** log into TikTok itself — it reads events from your local **Tikora** hub,
which owns the TikTok connection (and can optionally bridge TikFinity). Pick League connects to the
hub at `ws://127.0.0.1:27016/` automatically and reconnects on its own.

1. Start **Tikora** (it connects to TikTok / TikFinity).
2. In Tikora, create/find the **Pick League** game and copy its **slug + key**.
3. In Pick League open **Debug → Live connection**, paste the **Relay URL**, **slug** and **key**,
   then **Save** (it connects automatically). The status dot turns green.
4. Chat messages vote, gifts vote by gift name, and likes/follows/shares build the **top
   supporters** shown in the final. Avatars are fetched once and cached locally.

Pick League also ships a **`tikora.manifest.json`** and declares every sound cue / music track as
events (e.g. `pl.cue.champion.win`), forwarding each cue to Tikora so you can map high-quality sounds
and voice lines there.

No Tikora? Use the built-in **Simulator** or the Debug vote injector to rehearse.

## Sound & music

The sound system is a Web Audio mixer with **Master / Music / SFX / Voice** buses, a reverb send, and
procedurally generated cues (cinematic, not chiptune).

- Cues for every phase and animation: category, round intro (escalating per round), bracket
  zoom/focus, match start, last-10-second ticks, sudden death, gift tiers, lead change, result,
  champion and top-pickers reveal.
- **Music beds per phase** that shift with the round theme.
- Tune it all in **Debug → Sound & Music**: bus sliders, mute, per-cue on/off, per-track volume, and
  **Preview**. Settings apply live to the broadcast and persist across restarts.
- Drop files in **`data/sounds/<cue>.mp3|ogg|wav|webm`** (gitignored, served at `/sounds/…`) to
  replace the built-in synth for any cue — turn the synth cue off per-cue to avoid doubles.
- Broadcast-only audio; enable it on the broadcast page with the **🔊 Tap to enable sound** button
  the first time (OBS does this automatically).

## How voting resolves

1. A chat message is normalized (case, accents, punctuation; **Arabic is preserved**) and matched
   against the two on-screen items' names and aliases. No match → ignored.
2. A gift is matched to the item whose gift **name** (or the category's gift pair) it is. Gifts are
   weighted heavier than chat votes.
3. When the round timer ends, the higher total advances. Ties follow the configured tie rule
   (default: sudden death). With auto-advance on, the next match starts immediately.

Picking a category in the Control dropdown only **selects** it; pressing **Start / restart** launches
the selected category.

## Photos, avatars & safety

- The app makes **no external network calls at runtime**, with one approved exception: viewer
  avatars. `server/avatars.ts` fetches each TikTok avatar from a URL delivered by the local Tikora
  hub, verifies it is a real image type, caps the size, and caches it under `data/avatars/`
  (gitignored) so the overlay still loads images locally.
- `npm run seed:photos` (or the Studio **Fetch photos** button) is the only other downloader.
  It queries **English and Arabic Wikipedia**, then Wikimedia Commons. It talks **only** to an
  allowlist of Wikimedia hosts, accepts only real image types, caps file size, retries on
  rate-limits, rejects non-free (fair-use) images, and logs every URL to `data/photos.log`.
- Downloaded/uploaded photos live in `data/uploads/` and are gitignored, keeping the repo
  copyright-safe. Items without a photo fall back to a styled emoji/initial tile.

## Scripts

| Script | Purpose |
| --- | --- |
| `Tournament.bat` | Build + serve on one port and open the Control Room |
| `npm run serve` | Serve the built app on `:8787` (add `-- --open` to open a browser) |
| `npm run dev` | Dev: server `:8787` + Vite `:5173` with hot reload |
| `npm run build` | Build the app to `dist/` |
| `npm start` | Serve `server/index.ts` only (no browser) |
| `npm run demo` | Play every category's full bracket instantly in the terminal (add `-- --category=ID`) |
| `npm run seed` | Write the ten built-in categories (`--force` to overwrite) |
| `npm run seed:photos` | Fetch free photos (options: `--category=id`, `--limit=N`, `--force`) |
| `npm run typecheck` / `lint` / `test` | Quality gates |

## Project layout

```
shared/   domain types + defaults (settings incl. sound)
engine/   pure tournament logic (shared by server and UI)
server/   authoritative session + HTTP/SSE, seed data, photos.ts, avatars.ts, live.ts (Tikora hub)
scripts/  serve.mjs (single-port launcher), dev.mjs, browser.mjs, fetch-photos.ts CLI
src/      React UI: broadcast (OBS), control, studio, debug, setup, page shells
src/sound Web Audio engine, cue catalog, manager, hook
src/i18n  Arabic/English strings + RTL
data/     categories (tracked); uploads, avatars, sounds, session, live.json (ignored)
tikora.manifest.json  declared effects/events for the Tikora hub
```

See `AGENTS.md` for contributor conventions and the safety rules.
