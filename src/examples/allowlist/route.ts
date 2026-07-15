import type { Request, Response } from 'express';
import express from 'express';
import { render } from '../../render';
import { CDN_SCRIPT_URL } from '../fixtures';
import { type AllowlistMode, buildAllowlistPolicy, MODE_CONFIG } from './policy';

const router = express.Router();

function handler(mode: AllowlistMode) {
  const { explanation, loaderDisplay } = MODE_CONFIG[mode];
  const { cspHeader, cspDisplay } = buildAllowlistPolicy(mode);

  return (_req: Request, res: Response) => {
    res.setHeader('Content-Security-Policy', cspHeader);
    render(res, 'examples/allowlist/view', {
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
