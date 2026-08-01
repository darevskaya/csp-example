import type { Request, Response } from 'express';
import express from 'express';
import { generateNonce } from '../../csp';
import { render } from '../../render';
import { type BlockedResourceMode, buildBlockedResourcePolicy, MODE_CONFIG } from './policy';

const router = express.Router();

function handler(mode: BlockedResourceMode) {
  const { explanation, highlight, notice, codeDisplay, expected } = MODE_CONFIG[mode];

  return (_req: Request, res: Response) => {
    const nonce = generateNonce();
    const { cspHeader, cspDisplay } = buildBlockedResourcePolicy(nonce);
    res.setHeader('Content-Security-Policy-Report-Only', cspHeader);
    render(res, 'examples/reporting-blocked-resource/view', {
      title: 'Violation report fields',
      mode,
      nonce,
      cspDisplay,
      codeDisplay,
      expected,
      explanation,
      highlight,
      notice,
    });
  };
}

router.get('/inline-script', handler('inline-script'));
router.get('/external-script', handler('external-script'));
router.get('/image-style', handler('image-style'));

export default router;
