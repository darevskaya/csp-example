import type { Response } from 'express';
import express from 'express';
import { csp, formatDirectives, generateNonce, escapeHtml } from '../../csp';
import { render } from '../../render';

const router = express.Router();

const LOADER_SCRIPT = `var s = document.createElement('script');
s.src = '/javascripts/sdk.js';
document.head.appendChild(s);
`;

const LOADER_DISPLAY = escapeHtml(LOADER_SCRIPT.trimEnd()).replace(/^/gm, '  ');

type Mode = 'no-strict-dynamic' | 'strict-dynamic';

const MODE_CONFIG: Record<Mode, {
  explanation: string;
  scriptDirectives: (nonce: string) => Record<string, string>;
}> = {
  'strict-dynamic': {
    explanation: `The loader has a nonce so the browser trusts it. <code>'strict-dynamic'</code> extends that trust to any script the loader injects — even though the injected script has no nonce of its own.`,
    scriptDirectives: (nonce) => ({ 'script-src': `'nonce-${nonce}' 'strict-dynamic'` }),
  },
  'no-strict-dynamic': {
    explanation: `The loader has a nonce and runs. But the <code>&lt;script&gt;</code> it creates dynamically has no nonce — the browser blocks it. Without <code>'strict-dynamic'</code>, trust doesn't pass from a trusted script to the scripts it injects.`,
    scriptDirectives: (nonce) => ({ 'script-src': `'nonce-${nonce}'` }),
  },
};

function handler(mode: Mode) {
  const { explanation, scriptDirectives } = MODE_CONFIG[mode];

  return (_req: unknown, res: Response) => {
    const nonce = generateNonce();
    const directives = scriptDirectives(nonce);
    res.setHeader('Content-Security-Policy', csp(directives));
    render(res, 'examples/strict-dynamic', {
      title: 'script-src strict-dynamic',
      mode,
      nonce,
      cspDisplay: formatDirectives(directives),
      explanation,
      loaderScript: LOADER_SCRIPT,
      loaderDisplay: LOADER_DISPLAY,
    });
  };
}

router.get('/no-strict-dynamic', handler('no-strict-dynamic'));
router.get('/strict-dynamic',    handler('strict-dynamic'));

export default router;
