# Trusted Types: Controlling What Scripts Do With the DOM

## The gap CSP leaves open
CSP controls which scripts run. It says nothing about what those scripts do. A nonced script that passes `location.search` to `innerHTML` is authorized — and still vulnerable to XSS. This is the problem Trusted Types solves.

## What Trusted Types is
A browser API that restricts which values can be passed to dangerous DOM sinks (`innerHTML`, `eval`, `document.write`, `src` on script elements). Instead of accepting raw strings, these sinks require a `TrustedHTML`, `TrustedScript`, or `TrustedScriptURL` object — which can only be created by a policy you define.

## How it works
Enable via CSP header: `require-trusted-types-for 'script'`. Define a policy that sanitizes or validates before creating trusted values. Any code that tries to assign a raw string to a sink throws — even if the script has a valid nonce.

## Defining policies
`trustedTypes.createPolicy()` — the only way to produce trusted values. You control the sanitization logic. Multiple policies are possible; you can restrict which policy names are allowed via the header.

## What it catches that CSP misses
DOM XSS: attacker-controlled data flowing into `innerHTML`, `eval`, or `src`. CSP allows the script; Trusted Types blocks the unsafe DOM operation inside it.

## Where it fits alongside CSP
CSP + Trusted Types as layers: CSP keeps unauthorized scripts from running at all; Trusted Types keeps authorized scripts from doing unsafe things. Neither replaces the other.

## Browser support and rollout
`report-only` mode for Trusted Types (same as CSP). Use it to find violations before enforcing. Current browser support and what to do about gaps.

## What it doesn't solve
Server-side injection, reflected XSS that doesn't touch these sinks, CSS injection. Trusted Types is specifically about DOM sink safety.
