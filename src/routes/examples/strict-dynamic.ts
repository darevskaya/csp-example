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

type Mode = 'no-strict-dynamic' | 'strict-dynamic' | 'allowlist';

const ALLOWLIST_SCRIPT_TAG = '&lt;script src="/javascripts/sdk.js"&gt;&lt;/script&gt;';

const MODE_CONFIG: Record<Mode, {
  statusClass: string;
  statusText: string;
  explanation: string;
  loaderDisplay: string;
  scriptDirectives: (nonce: string) => Record<string, string>;
}> = {
  'strict-dynamic': {
    statusClass: 'safe',
    statusText: 'strict-dynamic — injected script allowed',
    explanation: `The loader has a nonce so the browser trusts it. <code>'strict-dynamic'</code> extends that trust to any script the loader injects — even though the injected script has no nonce of its own.`,
    loaderDisplay: LOADER_DISPLAY,
    scriptDirectives: (nonce) => ({ 'script-src': `'nonce-${nonce}' 'strict-dynamic'` }),
  },
  'allowlist': {
    statusClass: 'safe',
    statusText: 'Origin allowlist — SDK origin trusted',
    explanation: `The SDK's origin (<code>'self'</code> here, normally the CDN URL) is listed directly in <code>script-src</code>. No nonce needed — any script from that origin is trusted.`,
    loaderDisplay: ALLOWLIST_SCRIPT_TAG,
    scriptDirectives: () => ({ 'script-src': `'self'` }),
  },
  'no-strict-dynamic': {
    statusClass: 'unsafe',
    statusText: 'No strict-dynamic — injected script blocked',
    explanation: `The loader has a nonce and runs. But the <code>&lt;script&gt;</code> it creates dynamically has no nonce — the browser blocks it. Without <code>'strict-dynamic'</code>, trust doesn't pass from a trusted script to the scripts it injects.`,
    loaderDisplay: LOADER_DISPLAY,
    scriptDirectives: (nonce) => ({ 'script-src': `'nonce-${nonce}'` }),
  },
};

function handler(mode: Mode) {
  const { statusClass, statusText, explanation, loaderDisplay, scriptDirectives } = MODE_CONFIG[mode];

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
      loaderDisplay,
    });
  };
}

router.get('/no-strict-dynamic', handler('no-strict-dynamic'));
router.get('/strict-dynamic',    handler('strict-dynamic'));
router.get('/allowlist',         handler('allowlist'));

export default router;
