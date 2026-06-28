# frame-ancestors: Replacing X-Frame-Options

## Clickjacking in one paragraph
Attacker embeds your page in a transparent iframe, overlays a fake UI, tricks a user into clicking something on your page. The defense is preventing your page from being framed at all — or controlling who can frame it.

## X-Frame-Options: the legacy approach
`DENY` and `SAMEORIGIN` — what they do and how widely supported they are. The limitation: you can't allowlist specific origins other than same-origin. No wildcard, no multiple origins.

## frame-ancestors: the CSP replacement
`Content-Security-Policy: frame-ancestors 'none'` — equivalent to `X-Frame-Options: DENY`. `frame-ancestors 'self'` — same origin only. `frame-ancestors https://trusted-partner.com` — specific origin allowlisting, which X-Frame-Options can't do.

## Why frame-ancestors wins
More expressive: multiple origins, wildcards, schemes. Part of the CSP spec so it's in the same header. `X-Frame-Options` behavior is inconsistent across browsers in edge cases; `frame-ancestors` is well-specified.

## Do you still need X-Frame-Options?
For very old browser support. If you're setting `frame-ancestors`, set `X-Frame-Options` too as a fallback — they don't conflict, and it costs nothing.

## Legitimate iframing and how to handle it
Embedding your own app in a dashboard, allowing a specific partner to frame a widget. `frame-ancestors` makes this precise without opening the door broadly.

## The CSP reporting connection
`frame-ancestors` violations can be reported via `report-uri`/`report-to`. How to use this to discover unexpected framing attempts.
