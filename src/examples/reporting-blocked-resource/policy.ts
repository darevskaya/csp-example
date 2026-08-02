import { csp, EARLY_INIT_HASH, formatDirectives } from '../../csp';
import type { ExpectedViolation } from '../../ui/components/report-panel/report-panel.element';
import { type DemoMarkup, defineDemoMarkup } from '../../ui/demo-surface/demo-markup';

export type BlockedResourceMode = 'inline-script' | 'external-script' | 'image-style';

interface ModeConfig {
  explanation: DemoMarkup;
  highlight: string[];
  codeDisplay: string;
  expected: ExpectedViolation[];
}

export const EXTERNAL_SCRIPT_URL = 'https://cdn.example.com/lib.js';
export const EXTERNAL_IMAGE_URL = 'https://images.example.com/photo.jpg';
export const EXTERNAL_STYLE_URL = 'https://static.example.com/style.css';

// Base directives shared across all reporting example pages.
// report-to is required for Firefox to fire ReportingObserver on Report-Only policies.
export const REPORTING_BASE_DIRECTIVES = {
  'default-src': `'self'`,
  'report-to': 'csp-endpoint',
} as const;

export const MODE_CONFIG: Record<BlockedResourceMode, ModeConfig> = {
  'inline-script': {
    explanation: defineDemoMarkup(
      `The page contains an inline <code>&lt;script&gt;</code> tag without a nonce. Under <code>Content-Security-Policy-Report-Only</code>, the browser does not block it — but it sends a violation report. <strong>effectiveDirective</strong> is <strong>"script-src-elem"</strong> even though the policy only contains <strong>"default-src"</strong>. <strong>blockedURL</strong> is <strong>"inline"</strong> — a special keyword, not a URL.`,
    ),
    highlight: ['effectiveDirective', 'originalPolicy', 'blockedURL'],
    codeDisplay: '<script>void 0;</script>',
    expected: [{ blockedURL: 'inline', effectiveDirective: 'script-src-elem' }],
  },
  'external-script': {
    explanation: defineDemoMarkup(
      `The page loads a <code>&lt;script src="https://…"&gt;</code> from an external origin not in the policy. The browser reports the violation but does not block the request. <strong>blockedURL</strong> is a real URL. <strong>sourceFile</strong>, <strong>lineNumber</strong>, and <strong>columnNumber</strong> are empty or zero — the violation is a network fetch, not a line in the page source.`,
    ),
    highlight: ['blockedURL', 'sourceFile', 'lineNumber', 'columnNumber'],
    codeDisplay: `<script src="${EXTERNAL_SCRIPT_URL}"></script>`,
    expected: [{ blockedURL: EXTERNAL_SCRIPT_URL }],
  },
  'image-style': {
    explanation: defineDemoMarkup(
      `The page loads an image and a stylesheet from external origins. Both are reported as separate violations with different <code>effectiveDirective</code> values — <strong>"img-src"</strong> and <strong>"style-src-elem"</strong> — both derived from the single <strong>"default-src"</strong> in <strong>originalPolicy</strong>.`,
    ),
    highlight: ['effectiveDirective', 'blockedURL'],
    codeDisplay: `<img src="${EXTERNAL_IMAGE_URL}" alt="">\n<link rel="stylesheet" href="${EXTERNAL_STYLE_URL}">`,
    expected: [{ blockedURL: EXTERNAL_IMAGE_URL }, { blockedURL: EXTERNAL_STYLE_URL }],
  },
};

export function buildBlockedResourcePolicy(nonce: string) {
  return {
    cspHeader: csp({
      ...REPORTING_BASE_DIRECTIVES,
      'script-src': `'nonce-${nonce}' '${EARLY_INIT_HASH}'`,
    }),
    cspDisplay: formatDirectives({ 'default-src': `'self'` }),
  };
}
