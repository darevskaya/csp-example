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
    statusText: 'Origin allowlist — third-party origin trusted',
    explanation: `The third-party script's origin is listed directly in <code>script-src</code> (shown as <code>'self'</code> here; in production this would be a CDN URL). Any script loaded from that origin is trusted — no nonce or hash needed on the tag itself.`,
    loaderDisplay: ALLOWLIST_SCRIPT_TAG,
    scriptDirectives: () => ({ 'script-src': `'self'` }),
  },
  'no-allowlist': {
    statusClass: 'unsafe',
    statusText: 'No allowlist — third-party origin not trusted',
    explanation: `The third-party script's origin is not listed in <code>script-src</code>. In production, that means the browser would block it — a plain <code>&lt;script src="..."&gt;</code> tag has no nonce or hash, so the origin must be explicitly trusted. This demo simulates the blocked result by not loading the script at all.`,
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
