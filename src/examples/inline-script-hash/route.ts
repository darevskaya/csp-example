import type { Request, Response } from 'express';
import express from 'express';
import { render } from '../../render';
import { DIFFERENT_SCRIPT_CONTENT, HASH_SCRIPT_CONTENT } from '../fixtures';
import { CSP_DISPLAY, CSP_HEADER, DIFFERENT_SCRIPT_HASH, EXPLANATION, SCRIPT_HASH } from './policy';

const router = express.Router();

function hashHandler(withHash: boolean) {
  return (_req: Request, res: Response) => {
    res.setHeader('Content-Security-Policy', CSP_HEADER);
    render(res, 'examples/inline-script-hash/view', {
      title: 'script-src hash',
      withHash,
      scriptHash: SCRIPT_HASH,
      differentScriptHash: DIFFERENT_SCRIPT_HASH,
      activeScript: withHash ? HASH_SCRIPT_CONTENT : DIFFERENT_SCRIPT_CONTENT,
      cspDisplay: CSP_DISPLAY,
      explanation: EXPLANATION,
    });
  };
}

router.get('/hash', hashHandler(true));
router.get('/no-hash', hashHandler(false));

export default router;
