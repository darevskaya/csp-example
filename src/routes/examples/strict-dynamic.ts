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

const ALLOWLIST_DIRECTIVES = { 'script-src': `'self'` };
const ALLOWLIST_CSP_HEADER = csp(ALLOWLIST_DIRECTIVES);
const ALLOWLIST_CSP_DISPLAY = formatDirectives(ALLOWLIST_DIRECTIVES);

type Mode = 'no-strict-dynamic' | 'strict-dynamic' | 'allowlist';

function handler(mode: Mode) {
  let statusClass: string;
  let statusText: string;
  let explanation: string;

  if (mode === 'strict-dynamic') {
    statusClass = 'safe';
    statusText = 'strict-dynamic — injected script allowed';
    explanation = `The loader has a nonce so the browser trusts it. <code>'strict-dynamic'</code> extends that trust to any script the loader injects — even though the injected script has no nonce of its own.`;
  } else if (mode === 'allowlist') {
    statusClass = 'safe';
    statusText = 'Origin allowlist — SDK origin trusted';
    explanation = `The SDK's origin (<code>'self'</code> here, normally the CDN URL) is listed directly in <code>script-src</code>. No nonce needed — any script from that origin is trusted.`;
  } else {
    statusClass = 'unsafe';
    statusText = 'No strict-dynamic — injected script blocked';
    explanation = `The loader has a nonce and runs. But the <code>&lt;script&gt;</code> it creates dynamically has no nonce — the browser blocks it. Without <code>'strict-dynamic'</code>, trust doesn't pass from a trusted script to the scripts it injects.`;
  }

  return (_req: unknown, res: Response) => {
    const nonce = generateNonce();

    let cspHeader: string;
    let cspDisplay: string;
    if (mode === 'strict-dynamic') {
      const directives = { 'script-src': `'nonce-${nonce}' 'strict-dynamic'` };
      cspHeader = csp(directives);
      cspDisplay = formatDirectives(directives);
    } else if (mode === 'allowlist') {
      cspHeader = ALLOWLIST_CSP_HEADER;
      cspDisplay = ALLOWLIST_CSP_DISPLAY;
    } else {
      const directives = { 'script-src': `'nonce-${nonce}'` };
      cspHeader = csp(directives);
      cspDisplay = formatDirectives(directives);
    }

    res.setHeader('Content-Security-Policy', cspHeader);
    render(res, 'examples/strict-dynamic', {
      title: 'strict-dynamic',
      mode,
      nonce,
      cspDisplay,
      statusClass,
      statusText,
      explanation,
      loaderScript: LOADER_SCRIPT,
      loaderDisplay: mode === 'allowlist' ? '&lt;script src="/javascripts/sdk.js"&gt;&lt;/script&gt;' : LOADER_DISPLAY,
    });
  };
}

router.get('/no-strict-dynamic', handler('no-strict-dynamic'));
router.get('/strict-dynamic',    handler('strict-dynamic'));
router.get('/allowlist',         handler('allowlist'));

export default router;
