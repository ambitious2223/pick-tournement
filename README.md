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
- **Ten categories seeded** out of the box (football, basketball, movies, TV, cartoons, anime,
  game characters, game titles, music artists, TikTok creators).

## Quick start

```bash
npm install
npm run seed          # writes the ten built-in categories (auto-runs on first serve too)
npm run seed:photos   # optional: fetch free Wikimedia photos for the items
npm run dev           # server on :8787, web on :5173
```

Open:

- Control room → http://127.0.0.1:5173/control
- Content studio → http://127.0.0.1:5173/studio
- Debug console → http://127.0.0.1:5173/debug
- Overlay → http://127.0.0.1:5173/overlay

### Production / OBS

```bash
npm run build
npm start    # serves the built app + API from http://127.0.0.1:8787
```

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
- `npm run seed:photos` is the only thing that downloads. It talks **only** to an allowlist of
  Wikimedia hosts, accepts only real image types, caps file size, rejects non-free (fair-use)
  images, and logs every URL to `data/photos.log`.
- Downloaded/uploaded photos live in `data/uploads/` and are gitignored, keeping the repo
  copyright-safe. Items without a photo fall back to a styled emoji/initial tile.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Server + Vite dev together |
| `npm run build` | Build the overlay/control web app to `dist/` |
| `npm start` | Serve `dist/` + API on `:8787` |
| `npm run seed` | Write the ten built-in categories (`--force` to overwrite) |
| `npm run seed:photos` | Fetch free photos (options: `--category=id`, `--limit=N`, `--force`) |
| `npm run typecheck` / `lint` / `test` | Quality gates |

## Project layout

```
shared/   domain types + defaults
engine/   pure tournament logic (shared by server and UI)
server/   authoritative session + HTTP/SSE + seed data
scripts/  fetch-photos.ts (the only downloader)
src/      React UI: control, studio, debug, overlay, ui primitives
data/     categories (tracked), uploads + session (ignored)
```

See `AGENTS.md` for contributor conventions and the safety rules.
