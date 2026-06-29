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

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

export function hashScript(content: string): string {
  return `sha256-${crypto.createHash('sha256').update(content).digest('base64')}`;
}
