import { csp, EARLY_INIT_HASH, formatDirectives, hashScript } from '../../csp';
import { type DemoMarkup, defineDemoMarkup } from '../../ui/demo-surface/demo-markup';
import { DIFFERENT_SCRIPT_CONTENT, HASH_SCRIPT_CONTENT } from '../fixtures';

export const SCRIPT_HASH = hashScript(HASH_SCRIPT_CONTENT);
export const DIFFERENT_SCRIPT_HASH = hashScript(DIFFERENT_SCRIPT_CONTENT);

const DISPLAY_DIRECTIVES = { 'script-src': `'self' '${SCRIPT_HASH}'` };
const HASH_DIRECTIVES = {
  'script-src': `${DISPLAY_DIRECTIVES['script-src']} '${EARLY_INIT_HASH}'`,
};
export const CSP_HEADER = csp(HASH_DIRECTIVES);
export const CSP_DISPLAY = formatDirectives(DISPLAY_DIRECTIVES);

export const EXPLANATION: DemoMarkup = defineDemoMarkup(
  `CSP is active on both pages. The script only runs if its content hashes to the value in the policy — any change, even a single character, produces a different hash and gets blocked. The policy allows <code>${HASH_SCRIPT_CONTENT}</code> (hash: <code>${SCRIPT_HASH}</code>).`,
);
