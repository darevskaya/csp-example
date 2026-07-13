import crypto from 'crypto';

const BASE = {
  'frame-ancestors': "'none'",
} as const satisfies Record<string, string>;

export function formatDirectives(directives: Record<string, string>): string {
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v}`)
    .join('; ');
}

const DEFAULT_CSP = formatDirectives(BASE);

export function csp(overrides?: Record<string, string>): string {
  if (!overrides) return DEFAULT_CSP;
  return formatDirectives({ ...BASE, ...overrides });
}

export function labCsp(overrides?: Record<string, string>): string {
  return formatDirectives({ ...BASE, 'frame-ancestors': "'self'", ...overrides });
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function hashScript(content: string): string {
  return `sha256-${crypto.createHash('sha256').update(content).digest('base64')}`;
}

function makeEarlyInitScript(postMessage: boolean): string {
  const notify = (event: string) =>
    postMessage ? `window.parent.postMessage({type:'lab',event:'${event}'},'*');` : '';
  return (
    `window.__creatureRan=false;window.__creatureBlocked=false;` +
    `window.markScriptRan=function(){window.__creatureRan=true;${notify('ran')}};` +
    `window.markHandlerBlocked=function(){window.__creatureBlocked=true;${notify('blocked')}};`
  );
}

// Kept here so routes that need the hash in their CSP can compute it consistently.
export const EARLY_INIT_SCRIPT = makeEarlyInitScript(false);
export const EARLY_INIT_HASH = hashScript(EARLY_INIT_SCRIPT);

export const LAB_EARLY_INIT_SCRIPT = makeEarlyInitScript(true);
export const LAB_EARLY_INIT_HASH = hashScript(LAB_EARLY_INIT_SCRIPT);
