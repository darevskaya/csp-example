import type { Request, Response } from 'express';
import express from 'express';
import { render } from '../../render';
import { buildEffectiveDirectivePolicy, type EffectiveDirectiveMode, MODE_CONFIG } from './policy';

const router = express.Router();

function handler(mode: EffectiveDirectiveMode) {
  const { explanation, highlight, codeDisplay, expected } = MODE_CONFIG[mode];

  return (_req: Request, res: Response) => {
    const { cspHeader, cspDisplay } = buildEffectiveDirectivePolicy(mode);
    res.setHeader('Content-Security-Policy-Report-Only', cspHeader);
    render(res, 'examples/reporting-effective-directive/view', {
      title: 'effectiveDirective vs originalPolicy',
      mode,
      cspDisplay,
      codeDisplay,
      expected,
      explanation,
      highlight,
    });
  };
}

router.get('/default-src', handler('default-src'));
router.get('/script-src', handler('script-src'));
router.get('/script-src-attr', handler('script-src-attr'));

export default router;
