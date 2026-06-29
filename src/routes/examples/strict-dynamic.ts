import express, { Response } from 'express';
import { csp, formatDirectives, generateNonce } from '../../csp';
import { render } from '../../render';

const router = express.Router();

const LOADER_SCRIPT = `var s = document.createElement('script');
s.src = '/javascripts/sdk.js';
document.head.appendChild(s);`;

const LOADER_DISPLAY = LOADER_SCRIPT
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

type Mode = 'no-strict-dynamic' | 'strict-dynamic';

const MODE_CONFIG: Record<Mode, {
  statusClass: string;
  statusText: string;
  explanation: string;
  scriptDirectives: (nonce: string) => Record<string, string>;
}> = {
  'strict-dynamic': {
    statusClass: 'safe',
    statusText: 'strict-dynamic — injected script allowed',
    explanation: `The loader has a nonce so the browser trusts it. <code>'strict-dynamic'</code> extends that trust to any script the loader injects — even though the injected script has no nonce of its own.`,
    scriptDirectives: (nonce) => ({ 'script-src': `'nonce-${nonce}' 'strict-dynamic'` }),
  },
  'no-strict-dynamic': {
    statusClass: 'unsafe',
    statusText: 'No strict-dynamic — injected script blocked',
    explanation: `The loader has a nonce and runs. But the <code>&lt;script&gt;</code> it creates dynamically has no nonce — the browser blocks it. Without <code>'strict-dynamic'</code>, trust doesn't pass from a trusted script to the scripts it injects.`,
    scriptDirectives: (nonce) => ({ 'script-src': `'nonce-${nonce}'` }),
  },
};

function handler(mode: Mode) {
  const { statusClass, statusText, explanation, scriptDirectives } = MODE_CONFIG[mode];

  return (_req: unknown, res: Response) => {
    const nonce = generateNonce();
    const directives = scriptDirectives(nonce);
    res.setHeader('Content-Security-Policy', csp(directives));
    render(res, 'examples/strict-dynamic', {
      title: 'strict-dynamic',
      mode,
      nonce,
      cspDisplay: formatDirectives(directives),
      statusClass,
      statusText,
      explanation,
      loaderScript: LOADER_SCRIPT,
      loaderDisplay: LOADER_DISPLAY,
    });
  };
}

router.get('/no-strict-dynamic', handler('no-strict-dynamic'));
router.get('/strict-dynamic',    handler('strict-dynamic'));

export default router;
