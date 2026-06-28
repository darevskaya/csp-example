# Allowing Specific Scripts With CSP: Allowlists, Hashes, Nonces, and strict-dynamic

The [first post](https://hackernoon.com/csp-is-not-just-a-header-its-a-contract-with-the-browser) covered the basics: what CSP is, how `default-src 'self'` works, and how it blocks reflected XSS. This post goes deeper — into inline scripts, why blocking them by default is the right call, and the four mechanisms for selectively allowing the ones you actually need.

If [`script-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src) is not specified, [`default-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/default-src) acts as the fallback for scripts. In real policies, teams usually add `script-src` once they need script-specific rules like hashes, nonces, or `'strict-dynamic'` — so the examples below use `script-src` directly.

---

## The problem with blocking all inline scripts

When you add `default-src 'self'` to your CSP, the most noticeable thing that breaks isn't XSS — it's your own code. Inline `<script>` tags are everywhere: framework bootstrapping, runtime configuration passed from server to client, analytics snippets copied from third-party dashboards.

```html
<!-- All of these get blocked -->
<script>window.__CONFIG__ = { apiUrl: "https://api.example.com" };</script>
<script>gtag('config', 'G-XXXXXXXX');</script>
```

The naive fix is [`'unsafe-inline'`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_inline_script) in `script-src`. This unblocks every inline script — including the ones injected by XSS. You've added a CSP header that still restricts some resource loading, but no longer gives you meaningful protection against injected inline scripts. This is the trap most teams fall into: they add CSP, things break, they add `'unsafe-inline'`, and now they have a header that looks stricter than it really is.

The correct answer is to keep inline scripts blocked by default and grant exceptions selectively. There are four approaches, roughly moving from broad trust to more explicit trust. You can try each one interactively in the [CSP examples project](https://csp-example.onrender.com).

---

## Option 1: Origin allowlisting

The most straightforward approach: list the origins you trust in `script-src`.

```
Content-Security-Policy: script-src 'self' https://cdn.vendor.com
```

Any script loaded from `'self'` or `https://cdn.vendor.com` runs. Everything else — including injected inline scripts — is blocked.

This works and it's simple. It is also the broadest form of trust.

**The problem: you're trusting a domain, not a file.**

`https://cdn.vendor.com` means every file on that domain, forever. If the CDN is compromised, if the vendor ships a malicious update, if there's a path on that domain that serves attacker-controlled content — your CSP won't stop any of it. You can't distinguish `sdk.js` from `evil.js` if they're on the same origin.

Allowlists also don't help with inline scripts at all. `script-src 'self'` allows external scripts from your own origin; it says nothing about `<script>` blocks in your HTML.

**When it's appropriate:** legacy browser support (combined with `'strict-dynamic'`, covered below), or genuinely static external scripts where supply chain risk is acceptable and the alternative is too complex.

→ [See the allowlist example](https://csp-example.onrender.com/examples/third-party/allowlist) — the "Origin allowlist" tab shows this approach in action.

---

## Option 2: Hashes

A **hash** is a cryptographic fingerprint of a script's exact content. You compute a SHA-256 hash of the script text at build time and put it in the CSP header. When the browser finds an inline script, it hashes the content and checks if that hash is in the policy. ([MDN: hash source expression](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_inline_script))

```
Script:   console.log('hello');
Hash:     sha256-uYeF7eHzVgKpiBg5fikv2NTctmJnxCfX1UhhlrizvNE=

Header:   Content-Security-Policy: script-src 'sha256-uYeF7eHzVgKpiBg5fikv2NTctmJnxCfX1UhhlrizvNE='
HTML:     <script>console.log('hello');</script>

Browser:  hash matches → script runs
Attacker: <script>steal(document.cookie)</script> → hash doesn't match → blocked
```

The `<script>` tag has no attribute — the browser computes the hash itself from the content. The content must match exactly: same whitespace, same newlines, same everything.

### Computing the hash

```bash
echo -n "console.log('hello');" | openssl dgst -sha256 -binary | openssl base64
# sha256-uYeF7eHzVgKpiBg5fikv2NTctmJnxCfX1UhhlrizvNE=
```

Or in Node.js at build time:

```ts
import crypto from 'crypto';

function hashScript(content: string): string {
  return `'sha256-${crypto.createHash('sha256').update(content).digest('base64')}'`;
}
```

### Where hashes shine

Hashes work with no server involvement at request time. Compute once at build, embed in the deployed header. Perfect for static sites, CDN-hosted apps, and any scenario where HTML is cached.

### Where hashes break down

**Runtime-generated content.** If the script changes per request — user config, locale, CSRF token — the hash won't match. Every variation would need its own hash in the policy, which is unmanageable.

**External scripts.** For `<script src="...">` external scripts, the primary mechanism is [Subresource Integrity (SRI)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity), which pins a file to an expected hash. CSP can also participate when the `<script>` tag includes matching `integrity` metadata. In practice this works best for static external files you control or pin to a known version — not for vendor SDKs that update dynamically.

→ [Try the hash example](https://csp-example.onrender.com/examples/inline-script/no-hash) — toggle between "Script without matching hash" and "Script with matching hash" to see the browser check fingerprints.

---

## Option 3: Nonces

A **nonce** (number used once) is a random token the server generates fresh for every HTTP request. ([MDN: nonce source expression](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_inline_script)) It appears in two places:

1. The CSP header: `script-src 'nonce-abc123'`
2. As an attribute on the inline script: `<script nonce="abc123">`

The browser checks that the attribute matches the header. Match → script runs. No match → blocked. An attacker injecting `<script>steal()</script>` has no nonce — blocked.

```
Server generates: "r4nd0m-t0k3n-xyz"

Header:  Content-Security-Policy: script-src 'nonce-r4nd0m-t0k3n-xyz'
HTML:    <script nonce="r4nd0m-t0k3n-xyz">window.__CONFIG__ = {…}</script>

Attacker injects: <script>steal(document.cookie)</script>  →  no nonce → blocked
```

The nonce must be cryptographically random and generated per request — not per deploy, not per session. A static or predictable nonce defeats the mechanism.

```ts
import crypto from 'crypto';

app.get('/page', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);
  res.send(`<script nonce="${nonce}">window.__CONFIG__ = {…}</script>`);
});
```

### Where nonces are more flexible than hashes

The difference is not secrecy — CSP hashes are allowed to be visible. The difference is what they authorize. A hash authorizes one exact script body. A nonce authorizes script elements generated for this specific response. That makes nonces a better fit for server-rendered pages where inline data changes per request.

### Where nonces break down

Nonces require a server rendering fresh HTML per request. They don't work on static sites or any response that gets cached — if two requests get the same HTML, they share the same nonce, which weakens the guarantee.

→ [Try the nonce example](https://csp-example.onrender.com/examples/inline-script/no-nonce) — toggle between "Script without nonce" and "Script with nonce" to see CSP block and allow the same script.

---

## Option 4: `'strict-dynamic'` — solving the SDK problem

Hashes and nonces solve the inline script problem. They don't solve a different, common scenario: third-party SDKs that inject scripts dynamically.

The typical pattern — an analytics, chat, or monitoring SDK tells you to add a loader snippet:

```js
var s = document.createElement('script');
s.src = 'https://cdn.vendor.com/sdk.js';
document.head.appendChild(s);
```

With a strict nonce-based CSP, this breaks. You can give the loader a nonce. But the `<script>` element the loader creates has no nonce — the server didn't know about it. CSP blocks the injected script.

You can't solve this with an inline-script hash either — the problem is the external script element created at runtime.

The origin allowlist approach (`script-src 'self' https://cdn.vendor.com`) solves the loading problem but at the cost described above: you're trusting the entire domain permanently.

### `'strict-dynamic'`

`'strict-dynamic'` changes how trust propagates. The rule: any script explicitly trusted by nonce or hash can load further scripts programmatically — such as via `document.createElement('script')` — and those inherit the trust transitively. This applies to scripts added programmatically, not to arbitrary `<script>` tags injected into parsed HTML. ([MDN: strict-dynamic](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#strict-dynamic))

```
Content-Security-Policy: script-src 'nonce-xyz' 'strict-dynamic'
```

```html
<script nonce="xyz">
  var s = document.createElement('script');
  s.src = 'https://cdn.vendor.com/sdk.js';
  document.head.appendChild(s);
</script>
```

The loader has a nonce — trusted. It creates a `<script>` element. With `'strict-dynamic'`, that injected script inherits the loader's trust. The SDK loads.

An attacker who directly injects `<script src="https://cdn.vendor.com/evil.js">` into the HTML gets blocked — that tag wasn't created by a trusted script, it has no nonce.

### strict-dynamic vs allowlist: the security difference

| | Origin allowlist | `'strict-dynamic'` + nonce |
|---|---|---|
| Trust scope | Entire domain, forever | Specific script instance, per request |
| Nonce required | No | Yes (server needed) |
| Loader fetches script from allowlisted CDN | Allowed | Allowed if loaded by trusted script |
| Loader fetches script from non-allowlisted origin | Blocked | Allowed if loaded by trusted script |
| Direct injected tag from allowlisted CDN | Allowed | Blocked in CSP3 browsers |
| Subdomain takeover → bypass | Yes | No |

The allowlist trusts a domain. `'strict-dynamic'` trusts a specific script instance per request. The nonce changes every request and can't be predicted — even a compromised CDN can't manufacture a valid nonce for a new injected tag.

The caveat: `'strict-dynamic'` extends trust transitively. If the loader fetches a compromised SDK, that SDK runs. You haven't eliminated supply chain risk — but you've removed the allowlist as an additional attack surface.

→ [Try the strict-dynamic example](https://csp-example.onrender.com/examples/third-party/no-strict-dynamic) — all three modes (blocked, strict-dynamic, allowlist) are live and show the CSP header and result for each.

### Combining both for browser compatibility

`'strict-dynamic'` is well-supported but not universal. The safe pattern is to include both:

```
Content-Security-Policy: script-src 'nonce-xyz' 'strict-dynamic' https://cdn.vendor.com
```

Modern browsers get the stricter nonce-based behavior; older browsers get the compatibility fallback.

---

## When to use what

The pattern is simple: allowlists trust locations, hashes trust exact content, nonces trust this response, and `'strict-dynamic'` lets that trust propagate through programmatic script loading.

| Scenario | Best approach |
|---|---|
| Static site, fixed inline scripts | Hash |
| Server-rendered app, dynamic inline scripts | Nonce |
| Third-party SDK injects scripts | `'strict-dynamic'` + nonce |
| Legacy browser support needed | Add allowlist as fallback alongside `'strict-dynamic'` |
| Simple external scripts, no inline scripts | Allowlist (with SRI for the files) |

---

## What CSP doesn't solve here

All four approaches control *which scripts execute*. They don't automatically make trusted scripts safe.

CSP controls which scripts are allowed to run, but it does not sanitize what those scripts do. If an authorized script takes untrusted data and writes it into dangerous DOM sinks like `innerHTML`, CSP is not a sanitizer — it won't intervene. Some dangerous APIs like `eval` can be blocked by CSP (unless `'unsafe-eval'` is explicitly allowed), but DOM-based XSS through sinks like `innerHTML` needs another layer of protection.

```html
<script nonce="xyz">
  // CSP allowed this script — but this is still DOM XSS
  document.getElementById('output').innerHTML = location.search;
</script>
```

Trusted Types addresses that layer, by controlling what values can be passed into DOM injection sinks. ([MDN: Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)) That's the subject of a future post.
