import express, { Request, Response } from 'express';
import { csp, formatDirectives, generateNonce } from '../../csp';
import { isDev } from '../../env';

const router = express.Router();

const SCRIPT_CONTENT = `document.getElementById('nonce-output').className = 'ran'; document.getElementById('nonce-output').textContent = 'Script executed successfully — nonce matched.'`;
const BLOCKED_SCRIPT_CONTENT = `document.getElementById('nonce-output').textContent = 'This line never runs.'`;

router.get('/nonce', (_req: Request, res: Response) => {
  const nonce = generateNonce();
  res.setHeader('Content-Security-Policy', csp({ 'default-src': `'self' 'nonce-${nonce}'` }));
  res.render('examples/nonce.njk', {
    title: 'Nonce',
    isDev,
    withNonce: true,
    nonce,
    cspDisplay: formatDirectives({ 'default-src': `'self' 'nonce-${nonce}'` }),
    scriptContent: SCRIPT_CONTENT,
    blockedScriptContent: BLOCKED_SCRIPT_CONTENT,
  });
});

router.get('/no-nonce', (_req: Request, res: Response) => {
  const nonce = generateNonce();
  res.setHeader('Content-Security-Policy', csp({ 'default-src': `'self' 'nonce-${nonce}'` }));
  res.render('examples/nonce.njk', {
    title: 'Nonce',
    isDev,
    withNonce: false,
    nonce,
    cspDisplay: formatDirectives({ 'default-src': `'self' 'nonce-${nonce}'` }),
    scriptContent: SCRIPT_CONTENT,
    blockedScriptContent: BLOCKED_SCRIPT_CONTENT,
  });
});

export default router;
