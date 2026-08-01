import type { Request, Response } from 'express';
import express from 'express';
import { generateNonce } from '../../csp';
import { render } from '../../render';
import {
  buildDirectiveInheritancePolicy,
  type DirectiveInheritanceMode,
  MODE_CONFIG,
} from './policy';

const router = express.Router();

function handler(mode: DirectiveInheritanceMode) {
  const { explanation, highlight, notice } = MODE_CONFIG[mode];

  return (_req: Request, res: Response) => {
    const nonce = generateNonce();
    const { cspHeader, cspDisplay } = buildDirectiveInheritancePolicy(mode, nonce);
    res.setHeader('Content-Security-Policy-Report-Only', cspHeader);
    render(res, 'examples/reporting-directive-inheritance/view', {
      title: 'effectiveDirective vs originalPolicy',
      mode,
      nonce,
      cspDisplay,
      explanation,
      highlight,
      notice,
    });
  };
}

router.get('/default-src', handler('default-src'));
router.get('/script-src', handler('script-src'));
router.get('/script-src-attr', handler('script-src-attr'));

export default router;
