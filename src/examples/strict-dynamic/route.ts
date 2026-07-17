import type { Request, Response } from 'express';
import express from 'express';
import { generateNonce } from '../../csp';
import { render } from '../../render';
import { LOADER_SCRIPT } from '../fixtures';
import {
  buildStrictDynamicPolicy,
  LOADER_DISPLAY,
  MODE_CONFIG,
  type StrictDynamicMode,
} from './policy';

const router = express.Router();

function handler(mode: StrictDynamicMode) {
  const { explanation } = MODE_CONFIG[mode];

  return (_req: Request, res: Response) => {
    const nonce = generateNonce();
    const { cspHeader, cspDisplay } = buildStrictDynamicPolicy(mode, nonce);
    res.setHeader('Content-Security-Policy', cspHeader);
    render(res, 'examples/strict-dynamic/view', {
      title: 'script-src strict-dynamic',
      mode,
      nonce,
      cspDisplay,
      explanation,
      loaderScript: LOADER_SCRIPT,
      loaderDisplay: LOADER_DISPLAY,
    });
  };
}

router.get('/no-strict-dynamic', handler('no-strict-dynamic'));
router.get('/strict-dynamic', handler('strict-dynamic'));

export default router;
