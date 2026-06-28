# Building a Real CSP for a Real App

## The gap between theory and practice
The previous posts cover individual mechanisms. This post is about putting them together for an actual production app — starting from zero, iterating, and ending with a policy that's strict without being brittle.

## Starting point: what breaks when you add CSP
Take a real app and add `default-src 'self'`. Document everything that breaks: inline scripts, inline styles, external fonts, analytics, error trackers, A/B testing tools. This is the inventory.

## Frameworks and their CSP challenges
React, Vue, Next.js inject their own scripts (hydration, hot reload). How frameworks handle nonces (Next.js has first-class nonce support; others vary). The `__webpack_nonce__` pattern. What to do when you don't control the script generation.

## Third-party scripts: the real cost of your tag manager
Google Tag Manager, Intercom, Segment, Hotjar — each one brings multiple origins and often injects more scripts. Audit what you're actually loading, what origins those scripts touch, and whether `'strict-dynamic'` is viable vs an allowlist.

## The iterative approach
Report-only → fix violations → tighten → enforce → monitor. Concrete steps, not just theory. What "tighten" actually means: removing `'unsafe-inline'`, removing broad origins, replacing allowlists with nonces.

## A realistic end state
What a production CSP looks like for a server-rendered app vs a SPA vs a static site. Sample policies, explained directive by directive.

## Maintenance
CSP rots. New third-party scripts, new CDN origins, framework upgrades. How to keep it from silently becoming permissive over time.
