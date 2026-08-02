import { csp, EARLY_INIT_HASH, formatDirectives } from '../../csp';
import type { ExpectedViolation } from '../../ui/components/report-panel/report-panel.element';
import { type DemoMarkup, defineDemoMarkup } from '../../ui/demo-surface/demo-markup';
import { REPORTING_BASE_DIRECTIVES } from '../reporting-blocked-resource/policy';

export type EffectiveDirectiveMode = 'default-src' | 'script-src' | 'script-src-attr';

interface ModeConfig {
  explanation: DemoMarkup;
  highlight: string[];
  scriptDirectives: (nonce: string) => Record<string, string>;
  displayDirectives: Record<string, string>;
  codeDisplay: string;
  expected: ExpectedViolation[];
}

export const MODE_CONFIG: Record<EffectiveDirectiveMode, ModeConfig> = {
  'default-src': {
    explanation: defineDemoMarkup(
      `The policy only contains <code>default-src 'self'</code>. The inline script fires a violation. <strong>effectiveDirective</strong> is <strong>"script-src-elem"</strong> but <strong>originalPolicy</strong> only contains <strong>"default-src"</strong> — the browser infers the specific directive that applied.`,
    ),
    highlight: ['effectiveDirective', 'originalPolicy'],
    scriptDirectives: (nonce) => ({
      ...REPORTING_BASE_DIRECTIVES,
      'script-src': `'nonce-${nonce}' '${EARLY_INIT_HASH}'`,
    }),
    displayDirectives: { 'default-src': `'self'` },
    codeDisplay: '<script>void 0;</script>',
    expected: [{ blockedURL: 'inline', effectiveDirective: 'script-src-elem' }],
  },
  'script-src': {
    explanation: defineDemoMarkup(
      `The policy explicitly names <code>script-src 'self'</code> alongside <code>default-src</code>. <strong>originalPolicy</strong> now shows <strong>"script-src 'self'"</strong> explicitly. <strong>effectiveDirective</strong> is still <strong>"script-src-elem"</strong> — the browser always reports the most specific subtype.`,
    ),
    highlight: ['effectiveDirective', 'originalPolicy'],
    scriptDirectives: (nonce) => ({
      ...REPORTING_BASE_DIRECTIVES,
      'script-src': `'self' 'nonce-${nonce}' '${EARLY_INIT_HASH}'`,
    }),
    displayDirectives: { 'default-src': `'self'`, 'script-src': `'self'` },
    codeDisplay: '<script>void 0;</script>',
    expected: [{ blockedURL: 'inline', effectiveDirective: 'script-src-elem' }],
  },
  'script-src-attr': {
    explanation: defineDemoMarkup(
      `The policy adds <code>script-src-attr 'none'</code>. The violation trigger is an inline event handler (<code>onclick</code>). <strong>effectiveDirective</strong> is <strong>"script-src-attr"</strong> — different from <strong>"script-src-elem"</strong>. This is an event handler attribute, not a <code>&lt;script&gt;</code> block.`,
    ),
    highlight: ['effectiveDirective', 'originalPolicy'],
    scriptDirectives: (nonce) => ({
      ...REPORTING_BASE_DIRECTIVES,
      'script-src': `'self' 'nonce-${nonce}' '${EARLY_INIT_HASH}'`,
      'script-src-attr': `'none'`,
    }),
    displayDirectives: {
      'default-src': `'self'`,
      'script-src': `'self'`,
      'script-src-attr': `'none'`,
    },
    codeDisplay: '<button onclick="void 0">Click me</button>',
    expected: [{ blockedURL: 'inline', effectiveDirective: 'script-src-attr' }],
  },
};

export function buildEffectiveDirectivePolicy(mode: EffectiveDirectiveMode, nonce: string) {
  const { scriptDirectives, displayDirectives } = MODE_CONFIG[mode];
  return {
    cspHeader: csp(scriptDirectives(nonce)),
    cspDisplay: formatDirectives(displayDirectives),
  };
}
