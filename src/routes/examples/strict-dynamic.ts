import express, { Response } from 'express';
import { csp, formatDirectives, generateNonce } from '../../csp';
import { isDev } from '../../env';

const router = express.Router();

const LOADER_SCRIPT = `var s = document.createElement('script');
s.src = '/javascripts/sdk.js';
document.head.appendChild(s);`;

const LOADER_DISPLAY = LOADER_SCRIPT
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

type Mode = 'no-strict-dynamic' | 'strict-dynamic' | 'allowlist';

function handler(mode: Mode) {
  return (_req: unknown, res: Response) => {
    const nonce = generateNonce();

    let cspHeader: string;
    let cspDisplay: string;
    if (mode === 'strict-dynamic') {
      cspHeader = csp({ 'script-src': `'nonce-${nonce}' 'strict-dynamic'` });
      cspDisplay = formatDirectives({ 'script-src': `'nonce-${nonce}' 'strict-dynamic'` });
    } else if (mode === 'allowlist') {
      cspHeader = csp({ 'script-src': `'self'` });
      cspDisplay = formatDirectives({ 'script-src': `'self'` });
    } else {
      cspHeader = csp({ 'script-src': `'nonce-${nonce}'` });
      cspDisplay = formatDirectives({ 'script-src': `'nonce-${nonce}'` });
    }

    const { statusClass, statusText } = (() => {
      if (mode === 'strict-dynamic') return { statusClass: 'safe',   statusText: 'strict-dynamic — injected script allowed' };
      if (mode === 'allowlist')      return { statusClass: 'safe',   statusText: 'Origin allowlist — SDK origin trusted' };
      return                                { statusClass: 'unsafe', statusText: 'No strict-dynamic — injected script blocked' };
    })();

    const explanation = (() => {
      if (mode === 'strict-dynamic') return `The loader has a nonce so the browser trusts it. <code>'strict-dynamic'</code> extends that trust to any script the loader injects — even though the injected script has no nonce of its own.`;
      if (mode === 'allowlist')      return `The SDK's origin (<code>'self'</code> here, normally the CDN URL) is listed directly in <code>script-src</code>. No nonce needed — any script from that origin is trusted.`;
      return `The loader has a nonce and runs. But the <code>&lt;script&gt;</code> it creates dynamically has no nonce — the browser blocks it. Without <code>'strict-dynamic'</code>, trust doesn't pass from a trusted script to the scripts it injects.`;
    })();

    const loaderDisplay = mode === 'allowlist'
      ? '&lt;script src="/javascripts/sdk.js"&gt;&lt;/script&gt;'
      : LOADER_DISPLAY;

    res.setHeader('Content-Security-Policy', cspHeader);
    res.render('examples/strict-dynamic.njk', {
      title: 'strict-dynamic',
      isDev,
      mode,
      nonce,
      cspDisplay,
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
