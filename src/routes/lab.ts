import type { Request, Response } from 'express';
import express from 'express';
import { labCsp as csp, generateNonce, hashScript, LAB_EARLY_INIT_HASH } from '../csp';
import {
  CDN_SCRIPT_URL,
  DIFFERENT_SCRIPT_CONTENT,
  HASH_SCRIPT_CONTENT,
  LOADER_SCRIPT,
} from '../examples/fixtures';
import { render } from '../render';

const router = express.Router();

// reflected-xss lab
router.get('/reflected-xss/:mode', (req: Request, res: Response) => {
  const cspOn = req.params['mode'] === 'safe';
  const raw = req.query['term'];
  const query = typeof raw === 'string' ? raw : '';
  const directives = cspOn ? { 'default-src': "'self'" } : {};
  res.setHeader('Content-Security-Policy', csp(directives));
  render(res, 'labs/reflected-xss', { cspOn, query });
});

// nonce lab
router.get('/nonce/:mode', (_req: Request, res: Response) => {
  const withNonce = _req.params['mode'] === 'nonce';
  const nonce = generateNonce();
  const directives = { 'script-src': `'self' 'nonce-${nonce}'` };
  res.setHeader('Content-Security-Policy', csp(directives));
  render(res, 'labs/nonce', { withNonce, nonce });
});

// hash lab
const SCRIPT_HASH = hashScript(HASH_SCRIPT_CONTENT);
const HASH_DIRECTIVES = { 'script-src': `'self' '${SCRIPT_HASH}' '${LAB_EARLY_INIT_HASH}'` };
const HASH_CSP = csp(HASH_DIRECTIVES);

router.get('/hash/:mode', (req: Request, res: Response) => {
  const withHash = req.params['mode'] === 'hash';
  res.setHeader('Content-Security-Policy', HASH_CSP);
  render(res, 'labs/hash', {
    withHash,
    activeScript: withHash ? HASH_SCRIPT_CONTENT : DIFFERENT_SCRIPT_CONTENT,
  });
});

// allowlist lab
router.get('/allowlist/:mode', (req: Request, res: Response) => {
  const mode = req.params['mode'] as 'allowlist' | 'no-allowlist';
  const directives = { 'script-src': `'self'` };
  res.setHeader('Content-Security-Policy', csp(directives));
  render(res, 'labs/allowlist', { mode, cdnScriptUrl: CDN_SCRIPT_URL });
});

// strict-dynamic lab
router.get('/strict-dynamic/:mode', (req: Request, res: Response) => {
  const withStrictDynamic = req.params['mode'] === 'strict-dynamic';
  const nonce = generateNonce();
  const directives = withStrictDynamic
    ? { 'script-src': `'nonce-${nonce}' 'strict-dynamic'` }
    : { 'script-src': `'nonce-${nonce}'` };
  res.setHeader('Content-Security-Policy', csp(directives));
  render(res, 'labs/strict-dynamic', {
    mode: req.params['mode'],
    nonce,
    loaderScript: LOADER_SCRIPT,
  });
});

// event-handler lab
router.get('/event-handler/:mode', (req: Request, res: Response) => {
  const mode = req.params['mode'] as 'script-src-only' | 'split-unsafe-inline' | 'split-none';
  const nonce = generateNonce();
  const directivesMap: Record<
    'script-src-only' | 'split-unsafe-inline' | 'split-none',
    Record<string, string>
  > = {
    'script-src-only': { 'script-src': `'self' 'nonce-${nonce}'` },
    'split-unsafe-inline': {
      'script-src-elem': `'self' 'nonce-${nonce}'`,
      'script-src-attr': `'unsafe-inline'`,
    },
    'split-none': { 'script-src-elem': `'self' 'nonce-${nonce}'`, 'script-src-attr': `'none'` },
  };
  const directives = directivesMap[mode];
  const handlerAllowed = mode === 'split-unsafe-inline';
  res.setHeader('Content-Security-Policy', csp(directives));
  render(res, 'labs/event-handler', { mode, nonce, handlerAllowed });
});

export default router;
