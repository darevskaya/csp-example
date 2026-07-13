# CSP Examples — Claude Code Instructions

## Project

An educational site demonstrating Content Security Policy concepts.
Core mechanic: the **server sets the CSP header per route** — the client never controls policy.
Stack: Express 5 · TypeScript · Eta SSR · Vite (client assets) · Playwright (E2E) · Vitest (unit)

## Architecture

### Two-tier page structure

Every example splits into two layers:

- **Parent page** (`/examples/:group/:mode`) — serves the chrome: mode toggle, CSP header card, code cards. Sets a stable, strict CSP (`frame-ancestors 'none'`). Rendered by `src/routes/examples/`.
- **Lab iframe** (`/lab/:example/:mode`) — serves just the creature panel and demo scripts inside an `<iframe class="lab-frame">`. Sets the **demonstration CSP** for that mode. Rendered by `src/routes/lab.ts`.

This separation ensures the parent page is never affected by the demo CSP while the iframe is.

### CSP helpers (`src/csp.ts`)

- `csp(overrides?)` — base policy with `frame-ancestors 'none'`. Use for parent/example pages.
- `labCsp(overrides?)` — same base but overrides `frame-ancestors` to `'self'` so the iframe can be embedded. **Always use `labCsp()` in `src/routes/lab.ts`**, never `csp()`.
- `EARLY_INIT_HASH` — SHA-256 hash of the inline early-init script in `src/views/layout.eta` (main layout).
- `LAB_EARLY_INIT_HASH` — SHA-256 hash of the inline early-init script in `src/views/lab-layout.eta` (lab layout, which adds `window.parent.postMessage`). **These two hashes are different.** Use `LAB_EARLY_INIT_HASH` in any lab route that restricts `script-src` by hash.

### Route layout

```
src/routes/
  index.ts              — home page
  examples/
    index.ts            — mounts all example sub-routers under /examples
    reflected-xss.ts    — /examples/reflected-xss/:mode
    nonce.ts            — /examples/inline-script/:mode
    hash.ts             — /examples/inline-script/:mode
    allowlist.ts        — /examples/third-party/:mode
    strict-dynamic.ts   — /examples/third-party/:mode
    event-handler.ts    — /examples/event-handler/:mode
  lab.ts                — /lab/:example/:mode  (all lab iframes)
```

### Views layout

```
src/views/
  layout.eta            — main site layout (includes EARLY_INIT_HASH script)
  lab-layout.eta        — minimal iframe layout (includes LAB_EARLY_INIT_HASH script)
  index.eta             — home page (driven by src/examples/registry.ts)
  examples/             — parent example pages (one per example)
  labs/                 — lab iframe pages (one per example)
  components/           — shared partials (creature, mode-toggle, csp-header-card, etc.)
```

### Lab-asset scripts

`src/lab-assets/scripts/` contains intentional CSP fixture scripts (`sdk.js`, `config-panel.js`, `analytics-panel.js`, `xss-panel.js`). Served statically under `/lab-assets/`. **Never bundle through Vite.** These are demonstration code, not application code.

### Client controllers

`src/client/controllers/` contains small typed TS classes (no framework):
- `creature.ts` — drives creature state (idle → ran / blocked / xss) by reading `window.__creatureRan` / `window.__creatureBlocked` flags set by early-init scripts
- `copy.ts` — copy-to-clipboard for code cards
- `violation-log.ts` — displays CSP violation reports

### Example registry

`src/examples/registry.ts` provides typed metadata for all 6 examples. Currently used to drive the home page index. Routes still use individual per-example files.

## Tooling versions

- **Node**: 24 LTS
- **Vite**: 8.x — client assets only (CSS, controllers, fonts)
- **Vitest**: 4.x — Node mode only; never add `@vitest/browser`
- **Playwright**: keep Playwright and its browser binaries updated together
- **Biome**: linter and formatter (replaces ESLint + Prettier)

## Commands

```
npm run dev            — start Express dev server (tsx watch)
npm run dev:vite       — start Vite dev server (run alongside dev)
npm run build          — vite build + tsc
npm run typecheck      — type-check server + client separately
npm run lint           — biome check
npm run lint:fix       — biome check --write
npm run test:unit      — vitest (unit tests only)
npm run test:e2e       — playwright (chromium + firefox + webkit)
npm run test:e2e:fast  — playwright (chromium only, for quick local runs)
npm test               — test:unit && test:e2e
```

## Security requirements

- Pin all dependencies via `package-lock.json`; use `npm ci` in CI — never `npm install`.
- Bind the Vite dev server to `localhost` only.
- `frame-ancestors 'none'` must remain in the base CSP for all non-lab routes.
- `labCsp()` sets `frame-ancestors 'self'` — only use it for lab iframe routes.
- Lab fixtures are isolated from application source. Never evaluate user-supplied content server-side.

## Testing

- **Playwright** is the source of truth for CSP behaviour — it runs in real browsers.
- **Vitest** (Node mode) covers unit logic: CSP helpers, registry validation, nonce generation.
- Multi-browser coverage (Chromium, Firefox, WebKit) is required. CI runs all three.
- Playwright tests use `page.frameLocator('.lab-frame').locator(...)` to reach elements inside the lab iframe.
- Do not use Vitest Browser Mode.

## Code style

- No comments unless the *why* is non-obvious (hidden constraint, subtle invariant, browser quirk).
- No docstrings or multi-line comment blocks.
- Prefer editing existing files over creating new ones.
- Do not add error handling for scenarios that cannot happen.
