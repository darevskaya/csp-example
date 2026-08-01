import { csp, EARLY_INIT_HASH, formatDirectives } from '../../csp';
import { type DemoMarkup, defineDemoMarkup } from '../../ui/demo-surface/demo-markup';

export type BlockedResourceMode = 'inline-script' | 'external-script' | 'image-style';

interface ModeConfig {
  explanation: DemoMarkup;
  highlight: string[];
  notice: DemoMarkup;
}

export const EXTERNAL_SCRIPT_URL = 'https://cdn.example.com/lib.js';
export const EXTERNAL_IMAGE_URL = 'https://images.example.com/photo.jpg';
export const EXTERNAL_STYLE_URL = 'https://fonts.googleapis.com/css2?family=Inter';

export const MODE_CONFIG: Record<BlockedResourceMode, ModeConfig> = {
  'inline-script': {
    explanation: defineDemoMarkup(
      `The page contains an inline <code>&lt;script&gt;</code> tag without a nonce. Under <code>Content-Security-Policy-Report-Only</code>, the browser does not block it — but it sends a violation report. Watch the panel populate.`,
    ),
    highlight: ['effectiveDirective', 'originalPolicy', 'blockedURL'],
    notice: defineDemoMarkup(
      `<strong>effectiveDirective</strong> is <strong>"script-src-elem"</strong> even though the policy only contains <strong>"default-src"</strong>. <strong>blockedURL</strong> is <strong>"inline"</strong> — a special keyword, not a URL.`,
    ),
  },
  'external-script': {
    explanation: defineDemoMarkup(
      `The page loads a <code>&lt;script src="https://…"&gt;</code> from an external origin not in the policy. The browser reports the violation but does not block the request.`,
    ),
    highlight: ['blockedURL', 'sourceFile', 'lineNumber', 'columnNumber'],
    notice: defineDemoMarkup(
      `<strong>blockedURL</strong> is now a real URL. <strong>sourceFile</strong>, <strong>lineNumber</strong>, and <strong>columnNumber</strong> are empty or zero — the violation is a network fetch, not a line in the page source.`,
    ),
  },
  'image-style': {
    explanation: defineDemoMarkup(
      `The page loads an image and a stylesheet from external origins. Both are reported as separate violations with different <code>effectiveDirective</code> values.`,
    ),
    highlight: ['effectiveDirective'],
    notice: defineDemoMarkup(
      `One page load produces two reports with two different <strong>effectiveDirective</strong> values — <strong>"img-src"</strong> and <strong>"style-src-elem"</strong> — both derived from the single <strong>"default-src"</strong> in <strong>originalPolicy</strong>.`,
    ),
  },
};

export function buildBlockedResourcePolicy(nonce: string) {
  const directives = {
    'script-src': `'nonce-${nonce}' '${EARLY_INIT_HASH}'`,
    'default-src': `'self'`,
    // Firefox only fires ReportingObserver on Report-Only policies when report-to is present
    'report-to': 'csp-endpoint',
  };
  return {
    cspHeader: csp(directives),
    cspDisplay: formatDirectives({ 'default-src': `'self'` }),
  };
}
