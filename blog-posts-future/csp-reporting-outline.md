# CSP Reporting: Deploying Without Breaking Things

## The deployment problem
Strict CSP breaks things. Real apps have inline scripts, third-party tags, and CDN dependencies that were never accounted for. Rolling out enforcement cold means an incident. Reporting mode is how you avoid that.

## Content-Security-Policy-Report-Only
Set the header with `-Report-Only` suffix: the policy is evaluated but not enforced. Violations are reported, nothing is blocked. You can run it in parallel with your enforced policy, or alone while building one from scratch.

## report-uri vs report-to
`report-uri` is the old mechanism — a URL that receives violation POST requests as JSON. `report-to` is the newer Reporting API with batching and endpoint groups. Browser support differences and which to use.

## What a violation report contains
The blocked URI, the violated directive, the document URI, the referrer, the original policy. What's useful for diagnosis and what's noise.

## Building a feedback loop
Where to send reports (self-hosted endpoint, third-party like Report URI). How to aggregate and filter. The volume problem: real apps generate thousands of reports; how to triage signal from noise (extensions, crawlers, old cached pages).

## The rollout workflow
Start with `Report-Only` + a permissive policy. Tighten the policy based on violations. Move to enforcement when the violation rate is near zero. Keep `Report-Only` running alongside enforcement to catch regressions.

## CSP in CI
Automated violation checking: run the app in a test environment with a strict CSP and fail the build if violations are reported. Keeps the policy from regressing as the app changes.
