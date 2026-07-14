import crypto from 'node:crypto';

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

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function hashScript(content: string): string {
  return `sha256-${crypto.createHash('sha256').update(content).digest('base64')}`;
}

function makeEarlyInitScript(): string {
  return (
    `window.__creatureRan=false;window.__creatureBlocked=false;` +
    `window.markScriptRan=function(){window.__creatureRan=true;};` +
    `window.markHandlerBlocked=function(){window.__creatureBlocked=true;};`
  );
}

export const EARLY_INIT_SCRIPT = makeEarlyInitScript();
export const EARLY_INIT_HASH = hashScript(EARLY_INIT_SCRIPT);
