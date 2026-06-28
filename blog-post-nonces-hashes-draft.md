# Nonces and Hashes: Allowing Specific Inline Scripts With CSP

## Table of Contents

### The problem with blocking all inline scripts
`default-src 'self'` blocks every inline script — injected ones and legitimate ones alike. Many real applications have inline scripts they actually need: runtime configuration, analytics snippets, framework bootstrapping. This section shows what breaks when you add CSP and why `'unsafe-inline'` is not the answer.

### Option 1: Nonces
A nonce is a random token the server generates per request. It goes in the CSP header and as an attribute on the script tag. The browser allows that specific inline script and blocks everything else — including injected scripts that don't have the token. This section shows how nonces work, what the server needs to do, and where they break down.

### Option 2: Hashes
A hash is a cryptographic fingerprint of the script's content, computed at build time and placed in the policy. The browser hashes every inline script it finds and checks if it matches. This section shows how hashes work, how to compute them, and when they're the right tool over nonces.

### Nonces vs hashes: when to use which
Nonces require a server that generates a fresh value per request — they don't work on static sites or cached responses. Hashes require knowing the script content at policy-definition time — they don't work if the script changes at runtime. This section maps the two approaches to the scenarios where each one fits.

### The third-party / SDK problem
Both nonces and hashes require coordination between whoever controls the script and whoever controls the CSP header. With a third-party SDK injected into a customer's site, that coordination breaks down: the SDK author doesn't know the customer's nonce, and the customer can't hash a script they don't own. Two escape hatches exist, each with tradeoffs:

**Origin allowlisting** — add the SDK's CDN to `script-src`: `script-src 'self' https://cdn.example-sdk.com`. No nonce or hash needed. The risk: you're trusting the entire origin. A compromised CDN or a vulnerable SDK version bypasses CSP entirely.

**`strict-dynamic`** — lets a trusted (nonced or hashed) script dynamically load and inject further scripts, which inherit the trust transitively. The customer nonces the SDK loader; the loader can then inject whatever it needs without the customer knowing the content upfront. Older browsers that don't understand `strict-dynamic` fall back to the origin allowlist, so you typically combine both. The risk: you're delegating trust to the loader — if it loads something malicious, CSP won't stop it.

### strict-dynamic vs allowlist: which is more secure?
Both approaches solve the SDK injection problem, but they don't provide equal security. An origin allowlist trusts an entire domain permanently — if the CDN is compromised, serves a malicious file, or has a subdomain takeover, CSP won't stop it. A nonce + `strict-dynamic` trusts a specific script instance per request — the nonce is random, changes every request, and an attacker can't predict or reuse it. Even if the CDN is compromised, an injected `<script src="...">` tag with no nonce gets blocked. `strict-dynamic` is the modern recommendation; allowlists are a legacy fallback for older browsers.

### What neither one fully solves
A nonce or hash allows a specific inline script, but if that script itself handles untrusted data unsafely, CSP won't save you. This section covers the remaining risk and points to Trusted Types as the next layer.
