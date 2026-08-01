import { csp, EARLY_INIT_HASH, formatDirectives } from '../../csp';
import { type DemoMarkup, defineDemoMarkup } from '../../ui/demo-surface/demo-markup';

export type DirectiveInheritanceMode = 'default-src' | 'script-src' | 'script-src-attr';

interface ModeConfig {
  explanation: DemoMarkup;
  highlight: string[];
  notice: DemoMarkup;
  scriptDirectives: (nonce: string) => Record<string, string>;
  displayDirectives: Record<string, string>;
}

export const MODE_CONFIG: Record<DirectiveInheritanceMode, ModeConfig> = {
  'default-src': {
    explanation: defineDemoMarkup(
      `The policy only contains <code>default-src 'self'</code>. The inline script fires a violation. Watch which directive the browser reports.`,
    ),
    highlight: ['effectiveDirective', 'originalPolicy'],
    notice: defineDemoMarkup(
      `<strong>effectiveDirective</strong> is <strong>"script-src-elem"</strong> but <strong>originalPolicy</strong> only contains <strong>"default-src"</strong>. The browser infers the specific directive that applied.`,
    ),
    scriptDirectives: (nonce) => ({
      'default-src': `'self'`,
      'script-src': `'nonce-${nonce}' '${EARLY_INIT_HASH}'`,
      // Firefox only fires ReportingObserver on Report-Only policies when report-to is present
      'report-to': 'csp-endpoint',
    }),
    displayDirectives: { 'default-src': `'self'` },
  },
  'script-src': {
    explanation: defineDemoMarkup(
      `The policy explicitly names <code>script-src 'self'</code> alongside <code>default-src</code>. Compare <code>effectiveDirective</code> and <code>originalPolicy</code> with the previous mode.`,
    ),
    highlight: ['effectiveDirective', 'originalPolicy'],
    notice: defineDemoMarkup(
      `<strong>originalPolicy</strong> now shows <strong>"script-src 'self'"</strong> explicitly. <strong>effectiveDirective</strong> is still <strong>"script-src-elem"</strong> — the browser always reports the most specific subtype.`,
    ),
    scriptDirectives: (nonce) => ({
      'default-src': `'self'`,
      'script-src': `'self' 'nonce-${nonce}' '${EARLY_INIT_HASH}'`,
      // Firefox only fires ReportingObserver on Report-Only policies when report-to is present
      'report-to': 'csp-endpoint',
    }),
    displayDirectives: { 'default-src': `'self'`, 'script-src': `'self'` },
  },
  'script-src-attr': {
    explanation: defineDemoMarkup(
      `The policy adds <code>script-src-attr 'none'</code>. The violation trigger is an inline event handler (<code>onclick</code>). Watch how <code>effectiveDirective</code> changes.`,
    ),
    highlight: ['effectiveDirective', 'originalPolicy'],
    notice: defineDemoMarkup(
      `<strong>effectiveDirective</strong> is now <strong>"script-src-attr"</strong> — different from <strong>"script-src-elem"</strong>. <strong>blockedURL</strong> is still <strong>"inline"</strong>, but the violation category is different: this is an event handler attribute, not a <code>&lt;script&gt;</code> block.`,
    ),
    scriptDirectives: (nonce) => ({
      'default-src': `'self'`,
      'script-src': `'self' 'nonce-${nonce}' '${EARLY_INIT_HASH}'`,
      'script-src-attr': `'none'`,
      // Firefox only fires ReportingObserver on Report-Only policies when report-to is present
      'report-to': 'csp-endpoint',
    }),
    displayDirectives: {
      'default-src': `'self'`,
      'script-src': `'self'`,
      'script-src-attr': `'none'`,
    },
  },
};

export function buildDirectiveInheritancePolicy(mode: DirectiveInheritanceMode, nonce: string) {
  const { scriptDirectives, displayDirectives } = MODE_CONFIG[mode];
  return {
    cspHeader: csp(scriptDirectives(nonce)),
    cspDisplay: formatDirectives(displayDirectives),
  };
}
