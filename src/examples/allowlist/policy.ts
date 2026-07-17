import { csp, escapeHtml, formatDirectives } from '../../csp';
import { type DemoMarkup, defineDemoMarkup } from '../../ui/demo-surface/demo-markup';
import { CDN_ORIGIN, CDN_SCRIPT_URL } from '../fixtures';

export type AllowlistMode = 'no-allowlist' | 'allowlist';

const CDN_SCRIPT_TAG = escapeHtml(`<script src="${CDN_SCRIPT_URL}"></script>`);
const SELF_SCRIPT_TAG = escapeHtml(`<script src="/lab-assets/scripts/sdk.js"></script>`);
const SCRIPT_DIRECTIVES = { 'script-src': `'self'` };

interface AllowlistModeConfig {
  explanation: DemoMarkup;
  loaderDisplay: string;
  scriptDirectives: Record<string, string>;
}

export const MODE_CONFIG: Record<AllowlistMode, AllowlistModeConfig> = {
  allowlist: {
    explanation: defineDemoMarkup(
      `The script's origin (<code>'self'</code>) is listed in <code>script-src</code>. The browser fetches and runs it — no nonce or hash needed on the tag itself, just the origin. In production, a CDN URL like <code>${CDN_ORIGIN}</code> would be listed instead.`,
    ),
    loaderDisplay: SELF_SCRIPT_TAG,
    scriptDirectives: SCRIPT_DIRECTIVES,
  },
  'no-allowlist': {
    explanation: defineDemoMarkup(
      `The third-party script's origin (<code>${CDN_ORIGIN}</code>) is not listed in <code>script-src</code>. A plain <code>&lt;script src="..."&gt;</code> tag has no nonce or hash, so the origin must be explicitly trusted — the browser blocks the load.`,
    ),
    loaderDisplay: CDN_SCRIPT_TAG,
    scriptDirectives: SCRIPT_DIRECTIVES,
  },
};

export function buildAllowlistPolicy(mode: AllowlistMode) {
  const { scriptDirectives } = MODE_CONFIG[mode];
  return {
    cspHeader: csp(scriptDirectives),
    cspDisplay: formatDirectives(scriptDirectives),
  };
}
