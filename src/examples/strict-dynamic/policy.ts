import { csp, escapeHtml, formatDirectives } from '../../csp';
import { type DemoMarkup, defineDemoMarkup } from '../../ui/demo-surface/demo-markup';
import { LOADER_SCRIPT } from '../fixtures';

export type StrictDynamicMode = 'no-strict-dynamic' | 'strict-dynamic';

export const LOADER_DISPLAY = `${escapeHtml(LOADER_SCRIPT.trimEnd()).replace(/^/gm, '  ')}\n`;

interface StrictDynamicModeConfig {
  explanation: DemoMarkup;
  scriptDirectives: (nonce: string) => Record<string, string>;
}

export const MODE_CONFIG: Record<StrictDynamicMode, StrictDynamicModeConfig> = {
  'strict-dynamic': {
    explanation: defineDemoMarkup(
      `The loader has a nonce so the browser trusts it. <code>'strict-dynamic'</code> extends that trust to any script the loader injects — even though the injected script has no nonce of its own.`,
    ),
    scriptDirectives: (nonce) => ({ 'script-src': `'nonce-${nonce}' 'strict-dynamic'` }),
  },
  'no-strict-dynamic': {
    explanation: defineDemoMarkup(
      `The loader has a nonce and runs. But the <code>&lt;script&gt;</code> it creates dynamically has no nonce — the browser blocks it. Without <code>'strict-dynamic'</code>, trust doesn't pass from a trusted script to the scripts it injects.`,
    ),
    scriptDirectives: (nonce) => ({ 'script-src': `'nonce-${nonce}'` }),
  },
};

export function buildStrictDynamicPolicy(mode: StrictDynamicMode, nonce: string) {
  const { scriptDirectives } = MODE_CONFIG[mode];
  const directives = scriptDirectives(nonce);
  return {
    cspHeader: csp(directives),
    cspDisplay: formatDirectives(directives),
  };
}
