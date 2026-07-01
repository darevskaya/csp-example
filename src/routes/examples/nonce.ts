import type { Request, Response } from 'express';
import express from 'express';
import { csp, formatDirectives, generateNonce } from '../../csp';
import { render } from '../../render';

const router = express.Router();

function nonceHandler(withNonce: boolean) {
  return (_req: Request, res: Response) => {
    const nonce = generateNonce();
    const directives = { 'script-src': `'self' 'nonce-${nonce}'` };
    res.setHeader('Content-Security-Policy', csp(directives));
    render(res, 'examples/nonce', {
      title: 'script-src nonce',
      withNonce,
      nonce,
      cspDisplay: formatDirectives(directives),
      head: `<meta name="csp-nonce" content="${nonce}">`,
    });
  };
}

router.get('/nonce', nonceHandler(true));
router.get('/no-nonce', nonceHandler(false));

export default router;
