import express, { Response } from 'express';
import crypto from 'crypto';
import { csp, formatDirectives } from '../../csp';
import { render } from '../../render';

const router = express.Router();

const HASH_SCRIPT_CONTENT = `document.getElementById('hash-output').className = 'ran'; document.getElementById('hash-output').textContent = 'Script executed successfully — hash matched.'`;
const SCRIPT_HASH = `sha256-${crypto.createHash('sha256').update(HASH_SCRIPT_CONTENT).digest('base64')}`;
const DIFFERENT_SCRIPT_CONTENT = `document.getElementById('hash-output').textContent = 'This line never runs.'`;
const DIFFERENT_SCRIPT_HASH = `sha256-${crypto.createHash('sha256').update(DIFFERENT_SCRIPT_CONTENT).digest('base64')}`;

const CSP_HEADER = csp({ 'default-src': `'self' '${SCRIPT_HASH}'` });
const CSP_DISPLAY = formatDirectives({ 'default-src': `'self' '${SCRIPT_HASH}'` });

function hashHandler(withHash: boolean) {
  return (_req: unknown, res: Response) => {
    res.setHeader('Content-Security-Policy', CSP_HEADER);
    render(res, 'examples/hash', {
      title: 'Hash',
      withHash,
      scriptHash: SCRIPT_HASH,
      differentScriptHash: DIFFERENT_SCRIPT_HASH,
      activeScript: withHash ? HASH_SCRIPT_CONTENT : DIFFERENT_SCRIPT_CONTENT,
      cspDisplay: CSP_DISPLAY,
    });
  };
}

router.get('/hash', hashHandler(true));
router.get('/no-hash', hashHandler(false));

export default router;
