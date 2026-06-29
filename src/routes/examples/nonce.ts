import express, { Request, Response } from 'express';
import { csp, formatDirectives, generateNonce } from '../../csp';
import { render } from '../../render';

const router = express.Router();

const SCRIPT_CONTENT = `document.getElementById('nonce-output').className = 'ran'; document.getElementById('nonce-output').textContent = 'Script executed successfully — nonce matched.'`;
const BLOCKED_SCRIPT_CONTENT = `document.getElementById('nonce-output').textContent = 'This line never runs.'`;

function nonceHandler(withNonce: boolean) {
  return (_req: Request, res: Response) => {
    const nonce = generateNonce();
    const directives = { 'default-src': `'self' 'nonce-${nonce}'` };
    res.setHeader('Content-Security-Policy', csp(directives));
    render(res, 'examples/nonce', {
      title: 'Nonce',
      withNonce,
      nonce,
      cspDisplay: formatDirectives(directives),
      scriptContent: SCRIPT_CONTENT,
      blockedScriptContent: BLOCKED_SCRIPT_CONTENT,
      head: `<meta name="csp-nonce" content="${nonce}">`,
    });
  };
}

router.get('/nonce', nonceHandler(true));
router.get('/no-nonce', nonceHandler(false));

export default router;
