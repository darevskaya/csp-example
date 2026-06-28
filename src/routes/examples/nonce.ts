import express, { Request, Response } from 'express';
import { csp, formatDirectives, generateNonce } from '../../csp';
import { render } from '../../render';

const router = express.Router();

const SCRIPT_CONTENT = `document.getElementById('nonce-output').className = 'ran'; document.getElementById('nonce-output').textContent = 'Script executed successfully — nonce matched.'`;
const BLOCKED_SCRIPT_CONTENT = `document.getElementById('nonce-output').textContent = 'This line never runs.'`;

router.get('/nonce', (_req: Request, res: Response) => {
  const nonce = generateNonce();
  res.setHeader('Content-Security-Policy', csp({ 'default-src': `'self' 'nonce-${nonce}'` }));
  render(res, 'examples/nonce', {
    title: 'Nonce',
    withNonce: true,
    nonce,
    cspDisplay: formatDirectives({ 'default-src': `'self' 'nonce-${nonce}'` }),
    scriptContent: SCRIPT_CONTENT,
    blockedScriptContent: BLOCKED_SCRIPT_CONTENT,
    head: `<meta name="csp-nonce" content="${nonce}">`,
  });
});

router.get('/no-nonce', (_req: Request, res: Response) => {
  const nonce = generateNonce();
  res.setHeader('Content-Security-Policy', csp({ 'default-src': `'self' 'nonce-${nonce}'` }));
  render(res, 'examples/nonce', {
    title: 'Nonce',
    withNonce: false,
    nonce,
    cspDisplay: formatDirectives({ 'default-src': `'self' 'nonce-${nonce}'` }),
    scriptContent: SCRIPT_CONTENT,
    blockedScriptContent: BLOCKED_SCRIPT_CONTENT,
    head: `<meta name="csp-nonce" content="${nonce}">`,
  });
});

export default router;
