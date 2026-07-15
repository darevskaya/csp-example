import { csp, formatDirectives } from '../../csp';
import { type DemoMarkup, defineDemoMarkup } from '../../ui/demo-surface/demo-markup';

export type EventHandlerMode = 'script-src-only' | 'split-unsafe-inline' | 'split-none';

interface EventHandlerModeConfig {
  explanation: DemoMarkup;
  handlerAllowed: boolean;
  scriptDirectives: (nonce: string) => Record<string, string>;
}

export const MODE_CONFIG: Record<EventHandlerMode, EventHandlerModeConfig> = {
  'script-src-only': {
    explanation: defineDemoMarkup(
      `<code>script-src</code> covers all script execution — including inline event handlers. The <code>onclick</code> attribute has no nonce, so the browser blocks it. The only way to allow it under a plain <code>script-src</code> policy would be <code>'unsafe-inline'</code>, which defeats the nonce.`,
    ),
    handlerAllowed: false,
    scriptDirectives: (nonce) => ({ 'script-src': `'self' 'nonce-${nonce}'` }),
  },
  'split-unsafe-inline': {
    explanation: defineDemoMarkup(
      `<code>script-src-elem</code> governs <code>&lt;script&gt;</code> elements and requires a nonce. <code>script-src-attr 'unsafe-inline'</code> governs event handler attributes separately, allowing them without affecting script blocks. This lets you adopt nonces incrementally.`,
    ),
    handlerAllowed: true,
    scriptDirectives: (nonce) => ({
      'script-src-elem': `'self' 'nonce-${nonce}'`,
      'script-src-attr': `'unsafe-inline'`,
    }),
  },
  'split-none': {
    explanation: defineDemoMarkup(
      `Once event handlers have been migrated to <code>addEventListener</code>, <code>script-src-attr 'none'</code> locks them down completely. Any remaining inline handler — including ones injected by third-party scripts — is blocked.`,
    ),
    handlerAllowed: false,
    scriptDirectives: (nonce) => ({
      'script-src-elem': `'self' 'nonce-${nonce}'`,
      'script-src-attr': `'none'`,
    }),
  },
};

export function buildEventHandlerPolicy(mode: EventHandlerMode, nonce: string) {
  const { scriptDirectives } = MODE_CONFIG[mode];
  const directives = scriptDirectives(nonce);
  return {
    cspHeader: csp(directives),
    cspDisplay: formatDirectives(directives),
  };
}
