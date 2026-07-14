# CSP Examples — Claude Code Instructions

## Project

An educational site demonstrating Content Security Policy concepts.
Core mechanic: the **server sets the CSP header per route** — the client never controls policy.
Stack: Express 5 · TypeScript · Eta SSR · Vite (client assets) · Playwright (E2E) · Vitest (unit)

## Architecture

### Page structure

Each example is a single page at `/examples/:group/:mode`. The example page renders the mode toggle, CSP header card, code cards, creature panel, and demo scripts all together. The server sets the demonstration CSP for that mode directly on the example page response.

In **dev mode** the `res.setHeader` middleware in `src/app.ts` appends `http://localhost:5173` to any `script/style/default-src` directive so Vite HMR assets are not blocked. This does not change the CSP value shown in the UI (that is read from the header before the middleware runs).

### CSP helpers (`src/csp.ts`)

- `csp(overrides?)` — base policy with `frame-ancestors 'none'`. Use on all routes.
- `EARLY_INIT_HASH` — SHA-256 hash of the inline early-init script in `src/views/layout.eta`. Use in any route that restricts `script-src` by hash.

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
```

### Views layout

```
src/views/
  layout.eta            — main site layout (includes EARLY_INIT_HASH script)
  index.eta             — home page (driven by src/examples/registry.ts)
  examples/             — example pages (one per example)
  components/           — shared partials (creature, mode-toggle, csp-header-card, etc.)
```

### Lab-asset scripts

`src/lab-assets/scripts/` contains intentional CSP fixture scripts (`sdk.js`, `config-panel.js`, `analytics-panel.js`, `xss-panel.js`). Served statically under `/lab-assets/`. **Never bundle through Vite.** These are demonstration code, not application code.

### Client controllers

`src/client/controllers/` contains small typed TS classes (no framework):
- `creature.ts` — drives creature state (idle → ran / blocked / xss) by reading `window.__creatureRan` / `window.__creatureBlocked` flags set by the early-init script in `layout.eta`
- `copy.ts` — copy-to-clipboard for code cards

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
- `frame-ancestors 'none'` must remain in the base CSP for all routes.
- Lab fixtures are isolated from application source. Never evaluate user-supplied content server-side.

## Testing

- **Playwright** is the source of truth for CSP behaviour — it runs in real browsers.
- **Vitest** (Node mode) covers unit logic: CSP helpers, registry validation, nonce generation.
- Multi-browser coverage (Chromium, Firefox, WebKit) is required. CI runs all three.
- Do not use Vitest Browser Mode.

## Code style

- No comments unless the *why* is non-obvious (hidden constraint, subtle invariant, browser quirk).
- No docstrings or multi-line comment blocks.
- Prefer editing existing files over creating new ones.
- Do not add error handling for scenarios that cannot happen.
