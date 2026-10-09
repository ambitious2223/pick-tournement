# AGENTS.md — Pick League

Pick League is a local, **Arabic-first (RTL)** web app for TikTok Live creators. It runs 16-item
single-elimination tournament brackets (one category at a time, with a queue of categories) and is
meant to be added to OBS as a **Browser Source**. It runs with a built-in simulator, or with real
TikTok events relayed by the local **Tikora** hub. It has an automatic broadcast flow, per-round
visual themes, a Web Audio sound system, and cached viewer avatars.

The project owner does not read or write code — every report must be in plain language: what
changed, what it looks like now, whether it works.

## Safety & downloads (read first — this outranks everything below)

A previous project tripped a Windows Defender false-positive ("Trojan:Win32/ClickFix") from a
command line that downloaded and wrote a file. That must never happen again.

1. **Never use download-and-write/execute one-liners.** No `Invoke-WebRequest`/`iwr`/`curl`/`wget`
   in the same command as a URL and an output file. No `| iex`, no `-EncodedCommand`, no base64, no
   pipe-to-shell.
2. **No network downloads without explicit permission.** The only sanctioned downloader is
   `scripts/fetch-photos.ts` (`npm run seed:photos`), which talks **only** to an allowlist of
   Wikimedia hosts, validates every response is a real image type, caps size, and logs every URL to
   `data/photos.log`. Run it on demand only — never at app runtime.
3. **Prefer package managers.** Dependencies come from `npm install`, never from a raw URL.
   - One approved exception to the "no downloads" rule: `server/imageCache.ts` (`cacheImage`) fetches
     **one image at a time** from a URL delivered by the local Tikora hub — a viewer avatar or a gift
     picture — checks the bytes really are an image, caps the size, and caches it under `data/`
     (gitignored) so the overlay stays local. `server/avatars.ts` and `server/giftArt.ts` are the thin
     wrappers over it. It is the only extra fetch path besides `scripts/fetch-photos.ts`.
4. **Never commit non-free media.** The fetcher rejects `/wikipedia/en/` (fair-use) images. Uploaded
   photos live in `data/uploads/`, cached avatars in `data/avatars/`, cached gift artwork in
   `data/gifts/`, and host-provided sounds in `data/sounds/` — all **gitignored** to stay
   copyright-safe.
5. **Never touch antivirus.** If Defender flags anything, stop and report it — do not retry.

## Non-negotiable: never claim something works without proving it

Before reporting a feature complete you MUST run the gates below and, for UI work, actually load
the page and look at it. Report format: what you built, what you verified (specifically), what is
untested.

## Tech stack & conventions

- **Node 24 runs the server + engine TypeScript directly** (native type stripping). Imports use
  explicit `.ts`/`.tsx` extensions; **no enums, no namespaces, no parameter properties** (not
  erasable). Server build step is intentionally absent.
- React 19 function components + hooks only. Tailwind v4 utility classes; no inline styles except
  where a dynamic value is required.
- **One shared engine, two consumers.** `engine/*` is pure and imported by both the Node server and
  the React UI. Never duplicate bracket/vote logic in a component.
- The **server is authoritative** and holds the live session; the browser renders state received via
  SSE. Control commands go through `POST /api/command`.
- Keep files small and single-purpose (`shared/`, `engine/`, `server/`, `src/{broadcast,control,studio,debug,setup,sound,i18n}`).
- Categories are plain JSON in `data/categories/`, editable at runtime through the Studio (no rebuild).
- **Arabic-first with an English toggle**, RTL-safe (use logical Tailwind utilities like `ms-`/`me-`/
  `ps-`/`pe-`/`start-`/`end-`). All user-facing strings live in `src/i18n/`.
- **Sound** is client-side Web Audio (`src/sound/`); only the broadcast page plays audio.
- **Live events** come from the Tikora hub relay via `server/live.ts`; no TikTok credentials live here.
- All runtime asset handling is **local**; the only external fetch paths are `scripts/fetch-photos.ts`
  and `server/imageCache.ts` (one avatar or one gift picture at a time, verified and cached).

## Architecture map

- `shared/types.ts` — domain types (`Item`, `Category`, `Match`, `Tournament`, `SessionState`).
- `shared/config.ts` — bracket sizes, round labels, default settings.
- `engine/bracket.ts` — build the 16-slot tree, advance winners.
- `engine/matcher.ts` — normalize + match chat text to a name/alias.
- `engine/match.ts` — vote tallying, dedupe, gift weight, tie rules.
- `engine/tournament.ts` — round/match state machine.
- `server/index.ts` — HTTP: SSE `/events`, `/api/*`, `/uploads`, `/avatars`, `/sounds`, static `dist`.
- `server/session.ts` — authoritative live session (commands, timers, show flow, simulator, queue, live vote routing, supporters).
- `server/live.ts` — Tikora hub WebSocket client (events + effects + manifest capabilities); `server/liveConfig.ts` — its saved config.
- `server/manifest.ts` — loads `tikora.manifest.json` (the declared effect list) for the hub connection.
- `server/tikoraKey.ts` — resolves the Tikora game key with **no manual step**: environment Tikora
  injects → saved `data/live.json` → Tikora's own database (registering the game + key if missing).
- `server/imageCache.ts` — the one shared external fetch (a single image, verified, size-capped,
  cached under `data/`); `server/avatars.ts` and `server/giftArt.ts` wrap it for viewer avatars and
  gift artwork. `server/giftArt.ts` also serves `/gifts/`.
- `server/seed.ts` — the ten built-in Middle East categories; runs on first boot.
- `server/photos.ts` — the sanctioned photo downloader (English + Arabic Wikipedia, then Commons).
- `scripts/serve.mjs` — single-port launcher (build + serve on `:8787`); `scripts/dev.mjs` — dev.
- `scripts/manifest.ts` — builds the hub manifest; `scripts/gen-manifest.ts` writes it (`npm run manifest`);
  `scripts/smoke-hub.ts` — drives every declared hub effect end-to-end and restores `data/session.json`;
  `scripts/smoke-key.ts` — proves the game key resolves with no manual step.
- `src/broadcast` — the one OBS page (automatic show flow, themes, animations).
- `src/sound` — Web Audio engine, cue catalog, manager, `useSound` hook.
- `src/i18n` — Arabic/English strings + RTL provider.
- `src/bracket` — bracket board + `MatchStage` (used by Control); `src/stage` — the round view.
- `src/overlay` — round widgets (ItemCard, VoteBar, RoundTimer, WinnerReveal).
- `src/control` — host controls. `src/studio` — content editing. `src/debug` — vote injection,
  live connection, sound mixer, raw state. `src/pages` — Home + Setup.
- `tikora.manifest.json` — effects/events declared to the Tikora hub. Generated from
  `scripts/manifest.ts`; edit that file and run `npm run manifest`, never the JSON by hand.

## Run model

- The launcher (`Tournament.bat` → `scripts/serve.mjs`) serves the **built** app from **one port**
  (`127.0.0.1:8787`) so there is no second URL to get wrong. It binds loopback only — never LAN.
- `npm run dev` (server `:8787` + Vite `:5173`) is for development only.
- The single broadcast page lives at `/overlay` (alias `/show`); the in-app guide is `/setup`.
- Control and Debug lock the shell to the viewport so only the content area scrolls.
- Every page is wrapped in an ErrorBoundary and shows a "server not reachable" banner when offline.

## Gates (must pass before saying "done")

```
npm run typecheck   # tsc --noEmit, 0 errors
npm run lint        # oxlint, 0 errors / 0 warnings
npm run test        # node --test engine + scripts, all pass
npm run build       # vite build, succeeds
```

`npm run smoke` additionally proves the hub wiring end to end (auto game key + every declared
effect); it temporarily rewrites `data/live.json` and `data/session.json`, restoring both.

## Workflow

- Work in small verified steps; commit only code that passes the gates.
- Write commit messages a non-coder understands.
- Never force-push or rewrite history on `main`.
