# CSP Examples — Claude Code Instructions

## Project

An educational site demonstrating Content Security Policy concepts.
Core mechanic: the **server sets the CSP header per route** — the client never controls policy.
Stack: Express 5 · TypeScript · Eta SSR · Vite (client assets) · Playwright (E2E) · Vitest (unit)

## Architecture rules

- Keep Express 5, TypeScript, and Eta SSR. Do not convert to a SPA or React app.
- The server always controls which CSP header each route sends.
- Lab-asset scripts (`src/lab-assets/`) are intentional CSP fixtures — plain, unoptimised JS served statically. Never bundle them through Vite or evaluate user-supplied templates or JavaScript.
- The Vite pipeline is for site UI assets only (CSS, client controllers, fonts). Keep it separate from demonstration code.
- Stimulus (or any client-side controller framework) is **optional**. Small typed controller classes with event delegation are acceptable and often preferable.

## Tooling versions

- **Node**: 24.18.0 or newer (Node 24 LTS line)
- **Vite**: 8.1.4 or newer
- **Vitest**: 4.1.10 or newer — Node mode only; never add `@vitest/browser`
- **Playwright**: keep Playwright and its browser binaries updated together

## Security requirements

- Pin all dependencies via `package-lock.json`; use `npm ci` in CI — never `npm install`.
- Bind the Vite dev server to `localhost` only; never expose Vite or Vitest dev APIs to a shared network.
- Run `npm audit` and dependency update checks in CI.
- Enable Dependabot or Renovate for automated security updates.
- `frame-ancestors 'none'` must remain in the base CSP for all non-lab routes.
- Lab fixtures are isolated from application source. Never trust or evaluate user-supplied content server-side.

## Testing

- **Playwright** is the source of truth for CSP behaviour — it runs in real browsers.
- **Vitest** (Node mode) covers unit logic: registry validation, policy generation, nonce generation, report parsing.
- Do not use Vitest Browser Mode.
- Multi-browser Playwright coverage (Chromium, Firefox, WebKit) is required for all example × mode combinations.

## Code style

- No comments unless the *why* is non-obvious (hidden constraint, subtle invariant, browser quirk).
- No docstrings or multi-line comment blocks.
- Prefer editing existing files over creating new ones.
- Do not add error handling for scenarios that cannot happen.