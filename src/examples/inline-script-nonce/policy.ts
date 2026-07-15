import { csp, formatDirectives } from '../../csp';

export function buildNoncePolicy(nonce: string) {
  const directives = { 'script-src': `'self' 'nonce-${nonce}'` };
  return {
    cspHeader: csp(directives),
    cspDisplay: formatDirectives(directives),
  };
}
