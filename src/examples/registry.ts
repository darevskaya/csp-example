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
  description: DemoMarkup;
  defaultHref: string;
  modes: ExampleMode[];
}

export const examples: Example[] = [
  {
    id: 'reflected-xss',
    title: 'default-src',
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
    title: 'script-src origin',
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
    title: 'script-src nonce',
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
    title: 'script-src hash',
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
    title: 'script-src strict-dynamic',
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
    title: 'script-src-elem / script-src-attr',
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
];

export function getExample(id: string): Example | undefined {
  return examples.find((e) => e.id === id);
}
