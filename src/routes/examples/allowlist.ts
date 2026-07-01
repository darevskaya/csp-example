import type { Response } from 'express';
import express from 'express';
import { csp, formatDirectives } from '../../csp';
import { render } from '../../render';

const router = express.Router();

const ALLOWLIST_SCRIPT_TAG = '&lt;script src="/javascripts/sdk.js"&gt;&lt;/script&gt;';

type Mode = 'no-allowlist' | 'allowlist';

const MODE_CONFIG: Record<Mode, {
  statusClass: string;
  statusText: string;
  explanation: string;
  loaderDisplay: string;
  scriptDirectives: () => Record<string, string>;
}> = {
  'allowlist': {
    statusClass: 'safe',
    statusText: 'Origin allowlist — SDK origin trusted',
    explanation: `The SDK's origin (<code>'self'</code> here, normally a CDN URL) is listed directly in <code>script-src</code>. Any script loaded from that origin is trusted — no nonce or hash needed on the tag itself.`,
    loaderDisplay: ALLOWLIST_SCRIPT_TAG,
    scriptDirectives: () => ({ 'script-src': `'self'` }),
  },
  'no-allowlist': {
    statusClass: 'unsafe',
    statusText: 'No allowlist — SDK origin not trusted',
    explanation: `The policy allows <code>'self'</code> scripts so the page loads normally, but the SDK's origin is not listed. Without its origin in <code>script-src</code>, the browser blocks any script from that domain — there's no nonce or hash on a plain <code>&lt;script src="..."&gt;</code> tag, so the origin itself must be explicitly trusted.`,
    loaderDisplay: ALLOWLIST_SCRIPT_TAG,
    scriptDirectives: () => ({ 'script-src': `'self'` }),
  },
};

function handler(mode: Mode) {
  const { statusClass, statusText, explanation, loaderDisplay, scriptDirectives } = MODE_CONFIG[mode];
  const directives = scriptDirectives();

  return (_req: unknown, res: Response) => {
    res.setHeader('Content-Security-Policy', csp(directives));
    render(res, 'examples/allowlist', {
      title: 'script-src origin',
      mode,
      cspDisplay: formatDirectives(directives),
      statusClass,
      statusText,
      explanation,
      loaderDisplay,
    });
  };
}

router.get('/no-allowlist', handler('no-allowlist'));
router.get('/allowlist',    handler('allowlist'));

export default router;
