import type { Request, Response } from 'express';
import express from 'express';
import { csp, escapeHtml, formatDirectives } from '../../csp';
import { CDN_ORIGIN, CDN_SCRIPT_URL } from '../../examples/fixtures';
import { render } from '../../render';

const router = express.Router();

const CDN_SCRIPT_TAG = escapeHtml(`<script src="${CDN_SCRIPT_URL}"></script>`);
const SELF_SCRIPT_TAG = escapeHtml(`<script src="/lab-assets/scripts/sdk.js"></script>`);

type Mode = 'no-allowlist' | 'allowlist';

const MODE_CONFIG: Record<
  Mode,
  {
    explanation: string;
    loaderDisplay: string;
    scriptDirectives: Record<string, string>;
  }
> = {
  allowlist: {
    explanation: `The script's origin (<code>'self'</code>) is listed in <code>script-src</code>. The browser fetches and runs it — no nonce or hash needed on the tag itself, just the origin. In production, a CDN URL like <code>${CDN_ORIGIN}</code> would be listed instead.`,
    loaderDisplay: SELF_SCRIPT_TAG,
    scriptDirectives: { 'script-src': `'self'` },
  },
  'no-allowlist': {
    explanation: `The third-party script's origin (<code>${CDN_ORIGIN}</code>) is not listed in <code>script-src</code>. A plain <code>&lt;script src="..."&gt;</code> tag has no nonce or hash, so the origin must be explicitly trusted — the browser blocks the load.`,
    loaderDisplay: CDN_SCRIPT_TAG,
    scriptDirectives: { 'script-src': `'self'` },
  },
};

function handler(mode: Mode) {
  const { explanation, loaderDisplay, scriptDirectives } = MODE_CONFIG[mode];
  const cspHeader = csp(scriptDirectives);
  const cspDisplay = formatDirectives(scriptDirectives);

  return (_req: Request, res: Response) => {
    res.setHeader('Content-Security-Policy', cspHeader);
    render(res, 'examples/allowlist', {
      title: 'script-src origin',
      mode,
      cspDisplay,
      explanation,
      loaderDisplay,
      cdnScriptUrl: CDN_SCRIPT_URL,
    });
  };
}

router.get('/no-allowlist', handler('no-allowlist'));
router.get('/allowlist', handler('allowlist'));

export default router;
