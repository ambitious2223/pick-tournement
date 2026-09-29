# Pick League

A local web app for **TikTok Live** bracket tournaments. Sixteen items enter a category,
viewers vote, and one champion comes out — then the next category in the queue begins
automatically.

Designed to be added to **OBS as a Browser Source**. No TikTok connection is required to
run or rehearse: a built-in simulator drives the whole thing.

## What it does

- **16-item single elimination** per category: Round of 16 → Quarterfinals → Semifinals → Grand Final.
- **Two ways to vote**
  - **Chat:** a viewer types the on-screen name (or an alias) — it must match one of the two options.
  - **Gifts:** each side shows a gift; sending that gift counts for that side (weighted).
- **Configurable round timer** per match, with pause, extend, and sudden-death ties.
- **Category queue ("combinations")** — chain tournaments back-to-back so the show never loops back.
- **Content Studio** — create categories, edit 16 items, add aliases, and upload photos.
- **Debug console** — inject votes, simulate a crowd, force outcomes, jump rounds, inspect raw state.
- **Ten Middle East categories seeded** out of the box, each with English **and Arabic** aliases:
  Arab football stars, Arab singers, Arab actors, Quran reciters, Middle Eastern foods, cities,
  landmarks, Arabic desserts & drinks, historical scholars & leaders, and Middle Eastern countries.

## Quick start

**Easiest (Windows):** double-click **`Tournament.bat`**. It installs dependencies on the first
run, seeds the categories, downloads free photos once, builds the app, starts **one server on one
port** (`127.0.0.1:8787`) and opens the Control Room in a new tab (your other tabs are never
touched). Skip the browser with `PL_NO_BROWSER=1`, or the one-time photo fetch with `PL_NO_PHOTOS=1`.

The Control page shows the live round (photos, names, vote bars, timer) **floating over the
animated bracket**, with compact collapsible controls on the right. The Debug console is tucked
behind a small "debug" link.

**Watch the whole game flow fast:** click **Demo 1 bracket** (one photo-rich category, 2s rounds,
simulated votes) or **Demo all** (every category back-to-back) in the Control sidebar, and
**Stop / reset** to end. For an instant run with no timers, use `npm run demo` in a terminal.

Or run the steps manually:

```bash
npm install
npm run seed          # writes the ten built-in categories (auto-runs on first serve too)
npm run seed:photos   # optional: fetch free Wikimedia photos for the items
npm run build         # build the app
npm run serve         # one server on http://127.0.0.1:8787
```

Open:

- Control room → http://127.0.0.1:8787/control
- Content studio → http://127.0.0.1:8787/studio
- Debug console → http://127.0.0.1:8787/debug
- Overlay → http://127.0.0.1:8787/overlay

### Development

`npm run dev` runs the server (`:8787`) and Vite (`:5173`) together with hot reload. Use this only
while editing code; the launcher uses the single-port production server above.

In OBS: **Add → Browser Source**, URL `http://127.0.0.1:8787/overlay`, size it to your canvas.
Make sure **transparent background** is enabled.

## How voting resolves

1. A chat message is normalized (case, accents, punctuation) and matched against the two
   on-screen items' names and aliases. No match → ignored.
2. A gift is matched to the item whose gift id (or the category's gift pair) it is. Gifts are
   weighted heavier than chat votes.
3. When the round timer ends, the higher total advances. Ties follow the configured tie rule
   (default: sudden death). With auto-advance on, the next match starts immediately.

## Photos & safety

- The app makes **no external network calls at runtime**. All images are local files.
- `npm run seed:photos` (or the Studio **Fetch photos** button) is the only thing that downloads.
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
shared/   domain types + defaults
engine/   pure tournament logic (shared by server and UI)
server/   authoritative session + HTTP/SSE + seed data + photos.ts (the only downloader)
scripts/  serve.mjs (single-port launcher), dev.mjs, fetch-photos.ts CLI
src/      React UI: control, studio, debug, overlay, bracket, stage, ui primitives
data/     categories (tracked), uploads + session (ignored)
```

See `AGENTS.md` for contributor conventions and the safety rules.
