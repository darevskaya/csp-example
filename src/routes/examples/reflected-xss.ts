import type { Request, Response } from 'express';
import express from 'express';
import { csp, formatDirectives } from '../../csp';
import { render } from '../../render';

const router = express.Router();

const DEMO_DIRECTIVES = { 'default-src': "'self'" };
const DEMO_CSP = csp(DEMO_DIRECTIVES);
const DEMO_CSP_DISPLAY = formatDirectives(DEMO_DIRECTIVES);

function reflectedXssHandler(cspOn: boolean) {
  return (req: Request, res: Response) => {
    const raw = req.query['term'];
    const query = typeof raw === 'string' ? raw : '';
    if (cspOn) res.setHeader('Content-Security-Policy', DEMO_CSP);
    render(res, 'examples/reflected-xss', {
      title: 'Reflected XSS',
      cspOn,
      query,
      cspDisplay: DEMO_CSP_DISPLAY,
      action: cspOn ? '/examples/reflected-xss/safe' : '/examples/reflected-xss/unsafe',
    });
  };
}

router.get('/safe', reflectedXssHandler(true));
router.get('/unsafe', reflectedXssHandler(false));

export default router;
