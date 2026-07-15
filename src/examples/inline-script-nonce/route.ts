import type { Request, Response } from 'express';
import express from 'express';
import { generateNonce } from '../../csp';
import { render } from '../../render';
import { defineDemoMarkup } from '../../ui/demo-surface/demo-markup';
import { buildNoncePolicy } from './policy';

const router = express.Router();

function nonceHandler(withNonce: boolean) {
  return (_req: Request, res: Response) => {
    const nonce = generateNonce();
    const { cspHeader, cspDisplay } = buildNoncePolicy(nonce);
    res.setHeader('Content-Security-Policy', cspHeader);
    render(res, 'examples/inline-script-nonce/view', {
      title: 'script-src nonce',
      withNonce,
      nonce,
      cspDisplay,
      head: defineDemoMarkup(`<meta name="csp-nonce" content="${nonce}">`),
    });
  };
}

router.get('/nonce', nonceHandler(true));
router.get('/no-nonce', nonceHandler(false));

export default router;
