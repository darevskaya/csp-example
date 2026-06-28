import crypto from 'crypto';

const BASE: Record<string, string> = {
  'frame-ancestors': "'none'",
};

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
