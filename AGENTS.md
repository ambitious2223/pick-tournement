# AGENTS.md — Pick League

Pick League is a local web app for TikTok Live creators. It runs 16-item single-elimination
tournament brackets (one category at a time, with a queue of categories) and is meant to be added
to OBS as a **Browser Source**. The project owner does not read or write code — every report must
be in plain language: what changed, what it looks like now, whether it works.

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
4. **Never commit non-free media.** The fetcher rejects `/wikipedia/en/` (fair-use) images. Uploaded
   photos live in `data/uploads/` and are **gitignored** to stay copyright-safe.
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
- Keep files small and single-purpose (`shared/`, `engine/`, `server/`, `src/{control,studio,debug,overlay}`).
- Categories are plain JSON in `data/categories/`, editable at runtime through the Studio (no rebuild).
- All runtime asset handling is **local**; the overlay makes no external network calls.

## Architecture map

- `shared/types.ts` — domain types (`Item`, `Category`, `Match`, `Tournament`, `SessionState`).
- `shared/config.ts` — bracket sizes, round labels, default settings.
- `engine/bracket.ts` — build the 16-slot tree, advance winners.
- `engine/matcher.ts` — normalize + match chat text to a name/alias.
- `engine/match.ts` — vote tallying, dedupe, gift weight, tie rules.
- `engine/tournament.ts` — round/match state machine.
- `server/index.ts` — HTTP: SSE `/events`, `/api/*`, `/uploads`, static `dist`.
- `server/session.ts` — authoritative live session (commands, timer, simulator, queue).
- `server/seed.ts` — the ten built-in categories; runs on first boot.
- `scripts/fetch-photos.ts` — the only sanctioned downloader.
- `src/overlay` — OBS view. `src/control` — host controls. `src/studio` — content editing.
  `src/debug` — vote injection, force outcomes, raw state.

## Gates (must pass before saying "done")

```
npm run typecheck   # tsc --noEmit, 0 errors
npm run lint        # oxlint, 0 errors / 0 warnings
npm run test        # node --test engine, all pass
npm run build       # vite build, succeeds
```

## Workflow

- Work in small verified steps; commit only code that passes the gates.
- Write commit messages a non-coder understands.
- Never force-push or rewrite history on `main`.
