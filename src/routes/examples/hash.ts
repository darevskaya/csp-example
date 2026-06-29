import express, { Response } from 'express';
import { csp, formatDirectives, hashScript } from '../../csp';
import { render } from '../../render';

const router = express.Router();

const HASH_SCRIPT_CONTENT = `markScriptRan();`;
const DIFFERENT_SCRIPT_CONTENT = `/* different script — hash won't match */`;
const SCRIPT_HASH = hashScript(HASH_SCRIPT_CONTENT);
const DIFFERENT_SCRIPT_HASH = hashScript(DIFFERENT_SCRIPT_CONTENT);

const HASH_DIRECTIVES = { 'script-src': `'self' '${SCRIPT_HASH}'` };
const CSP_HEADER = csp(HASH_DIRECTIVES);
const CSP_DISPLAY = formatDirectives(HASH_DIRECTIVES);

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
    });
  };
}

router.get('/hash', hashHandler(true));
router.get('/no-hash', hashHandler(false));

export default router;
