import { type DemoMarkup, defineDemoMarkup } from '../ui/demo-surface/demo-markup';

export interface ExampleMode {
  id: string;
  label: string;
  href: string;
  state: 'safe' | 'unsafe';
}

export interface Example {
  id: string;
  title: string;
  shortTitle: string;
  topic: 'csp';
  description: DemoMarkup;
  defaultHref: string;
  modes: ExampleMode[];
}

export const examples: Example[] = [
  {
    id: 'reflected-xss',
    title: 'Blocking injected scripts',
    shortTitle: 'default-src',
    topic: 'csp',
    description: defineDemoMarkup(
      'The simplest CSP policy. See how <code class="example-card-desc-code">default-src \'self\'</code> blocks injected inline scripts.',
    ),
    defaultHref: '/examples/reflected-xss/unsafe',
    modes: [
      { id: 'unsafe', label: 'CSP off', href: '/examples/reflected-xss/unsafe', state: 'unsafe' },
      { id: 'safe', label: 'CSP on', href: '/examples/reflected-xss/safe', state: 'safe' },
    ],
  },
  {
    id: 'allowlist',
    title: 'Origin allowlist',
    shortTitle: 'script-src origin',
    topic: 'csp',
    description: defineDemoMarkup(
      'Trust scripts by origin URL. Any script loaded from a listed domain runs without a nonce or hash.',
    ),
    defaultHref: '/examples/third-party/no-allowlist',
    modes: [
      {
        id: 'no-allowlist',
        label: 'No allowlist',
        href: '/examples/third-party/no-allowlist',
        state: 'unsafe',
      },
      {
        id: 'allowlist',
        label: 'Origin allowlist',
        href: '/examples/third-party/allowlist',
        state: 'safe',
      },
    ],
  },
  {
    id: 'nonce',
    title: 'Per-request nonce',
    shortTitle: 'script-src nonce',
    topic: 'csp',
    description: defineDemoMarkup(
      'A per-request random token in the header and script tag lets one specific inline script run.',
    ),
    defaultHref: '/examples/inline-script/no-nonce',
    modes: [
      {
        id: 'no-nonce',
        label: 'Script without nonce',
        href: '/examples/inline-script/no-nonce',
        state: 'unsafe',
      },
      {
        id: 'nonce',
        label: 'Script with nonce',
        href: '/examples/inline-script/nonce',
        state: 'safe',
      },
    ],
  },
  {
    id: 'hash',
    title: 'Content hash',
    shortTitle: 'script-src hash',
    topic: 'csp',
    description: defineDemoMarkup(
      'A cryptographic hash of the script content. Only scripts whose content matches the hash are allowed.',
    ),
    defaultHref: '/examples/inline-script/no-hash',
    modes: [
      {
        id: 'no-hash',
        label: 'Script without matching hash',
        href: '/examples/inline-script/no-hash',
        state: 'unsafe',
      },
      {
        id: 'hash',
        label: 'Script with matching hash',
        href: '/examples/inline-script/hash',
        state: 'safe',
      },
    ],
  },
  {
    id: 'strict-dynamic',
    title: 'Trusted script injection',
    shortTitle: "script-src 'strict-dynamic'",
    topic: 'csp',
    description: defineDemoMarkup(
      'Lets a trusted script inject further scripts, so third-party scripts work without allowlisting domains.',
    ),
    defaultHref: '/examples/third-party/no-strict-dynamic',
    modes: [
      {
        id: 'no-strict-dynamic',
        label: 'No strict-dynamic',
        href: '/examples/third-party/no-strict-dynamic',
        state: 'unsafe',
      },
      {
        id: 'strict-dynamic',
        label: 'strict-dynamic',
        href: '/examples/third-party/strict-dynamic',
        state: 'safe',
      },
    ],
  },
  {
    id: 'event-handler',
    title: 'Split script directives',
    shortTitle: 'script-src-elem / attr',
    topic: 'csp',
    description: defineDemoMarkup(
      'Split script rules by category. Allow inline event handlers while keeping <code class="example-card-desc-code">&lt;script&gt;</code> blocks protected by nonces.',
    ),
    defaultHref: '/examples/event-handler/script-src-only',
    modes: [
      {
        id: 'script-src-only',
        label: 'script-src only',
        href: '/examples/event-handler/script-src-only',
        state: 'unsafe',
      },
      {
        id: 'split-unsafe-inline',
        label: 'split — attr allowed',
        href: '/examples/event-handler/split-unsafe-inline',
        state: 'safe',
      },
      {
        id: 'split-none',
        label: 'split — attr blocked',
        href: '/examples/event-handler/split-none',
        state: 'unsafe',
      },
    ],
  },
  {
    id: 'reporting-blocked-resource',
    title: 'Violation report fields',
    shortTitle: 'ReportingObserver',
    topic: 'csp',
    description: defineDemoMarkup(
      'See what a CSP violation report contains. Each mode triggers a different resource type and shows how <code class="example-card-desc-code">blockedURL</code> and <code class="example-card-desc-code">effectiveDirective</code> change.',
    ),
    defaultHref: '/examples/reporting/blocked-resource/inline-script',
    modes: [
      {
        id: 'inline-script',
        label: 'inline script',
        href: '/examples/reporting/blocked-resource/inline-script',
        state: 'unsafe',
      },
      {
        id: 'external-script',
        label: 'external script',
        href: '/examples/reporting/blocked-resource/external-script',
        state: 'unsafe',
      },
      {
        id: 'image-style',
        label: 'image + style',
        href: '/examples/reporting/blocked-resource/image-style',
        state: 'unsafe',
      },
    ],
  },
  {
    id: 'reporting-effective-directive',
    title: 'effectiveDirective vs originalPolicy',
    shortTitle: 'effectiveDirective',
    topic: 'csp',
    description: defineDemoMarkup(
      'See how <code class="example-card-desc-code">effectiveDirective</code> always names the specific subtype that matched, even when the policy only contains <code class="example-card-desc-code">default-src</code>.',
    ),
    defaultHref: '/examples/reporting/effective-directive/default-src',
    modes: [
      {
        id: 'default-src',
        label: 'default-src only',
        href: '/examples/reporting/effective-directive/default-src',
        state: 'unsafe',
      },
      {
        id: 'script-src',
        label: 'explicit script-src',
        href: '/examples/reporting/effective-directive/script-src',
        state: 'unsafe',
      },
      {
        id: 'script-src-attr',
        label: 'script-src-attr',
        href: '/examples/reporting/effective-directive/script-src-attr',
        state: 'unsafe',
      },
    ],
  },
];

export function getExample(id: string): Example | undefined {
  return examples.find((e) => e.id === id);
}
