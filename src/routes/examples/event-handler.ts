import type { Response } from 'express';
import express from 'express';
import { csp, formatDirectives, generateNonce } from '../../csp';
import { render } from '../../render';

const router = express.Router();

type Mode = 'script-src-only' | 'split-unsafe-inline' | 'split-none';

const MODE_CONFIG: Record<
  Mode,
  {
    explanation: string;
    handlerAllowed: boolean;
    scriptDirectives: (nonce: string) => Record<string, string>;
  }
> = {
  'script-src-only': {
    explanation: `<code>script-src</code> covers all script execution — including inline event handlers. The <code>onclick</code> attribute has no nonce, so the browser blocks it. The only way to allow it under a plain <code>script-src</code> policy would be <code>'unsafe-inline'</code>, which defeats the nonce.`,
    handlerAllowed: false,
    scriptDirectives: (nonce) => ({ 'script-src': `'self' 'nonce-${nonce}'` }),
  },
  'split-unsafe-inline': {
    explanation: `<code>script-src-elem</code> governs <code>&lt;script&gt;</code> elements and requires a nonce. <code>script-src-attr 'unsafe-inline'</code> governs event handler attributes separately, allowing them without affecting script blocks. This lets you adopt nonces incrementally.`,
    handlerAllowed: true,
    scriptDirectives: (nonce) => ({
      'script-src-elem': `'self' 'nonce-${nonce}'`,
      'script-src-attr': `'unsafe-inline'`,
    }),
  },
  'split-none': {
    explanation: `Once event handlers have been migrated to <code>addEventListener</code>, <code>script-src-attr 'none'</code> locks them down completely. Any remaining inline handler — including ones injected by third-party scripts — is blocked.`,
    handlerAllowed: false,
    scriptDirectives: (nonce) => ({
      'script-src-elem': `'self' 'nonce-${nonce}'`,
      'script-src-attr': `'none'`,
    }),
  },
};

function handler(mode: Mode) {
  const { explanation, handlerAllowed, scriptDirectives } = MODE_CONFIG[mode];

  return (_req: unknown, res: Response) => {
    const nonce = generateNonce();
    const directives = scriptDirectives(nonce);
    res.setHeader('Content-Security-Policy', csp(directives));
    render(res, 'examples/event-handler', {
      title: 'script-src-elem / script-src-attr',
      mode,
      nonce,
      cspDisplay: formatDirectives(directives),
      explanation,
      handlerAllowed,
    });
  };
}

router.get('/script-src-only', handler('script-src-only'));
router.get('/split-unsafe-inline', handler('split-unsafe-inline'));
router.get('/split-none', handler('split-none'));

export default router;
