# Subresource Integrity: Pinning External Scripts to Exact Content

## The allowlist problem, revisited
Origin allowlisting trusts a domain. If the CDN serves a different file — malicious update, compromise, cache poisoning — your app loads it. SRI pins to exact file content, not origin.

## What SRI is
A `<script>` or `<link>` attribute containing a hash of the expected file content. The browser fetches the file, hashes it, and refuses to execute it if the hash doesn't match — regardless of what origin it came from.

```html
<script src="https://cdn.example.com/lib.js"
        integrity="sha256-abc123..."
        crossorigin="anonymous"></script>
```

## Computing the hash
`openssl` one-liner. Build tooling that generates SRI hashes automatically. The `crossorigin` attribute requirement (CORS).

## SRI vs CSP allowlists
Allowlist: trust the origin, any content. SRI: trust the content, any origin (but you'd combine with an allowlist anyway). Together: you know both where the file comes from and exactly what it contains.

## SRI vs `'strict-dynamic'`
SRI pins external scripts to exact content. `'strict-dynamic'` trusts the loader to inject whatever it needs. They solve different things and can be combined: use SRI on the loader itself, `'strict-dynamic'` for what the loader injects.

## The maintenance problem
SRI hashes break on every version update. Automated hash regeneration in CI. Dependency update workflows. The tradeoff between security (pinning exact content) and maintainability (hashes rot).

## When SRI is the right tool
Third-party scripts with infrequent updates (libraries, polyfills). When you want defense-in-depth alongside an allowlist. When `'strict-dynamic'` isn't viable (no server, static site).
