import { describe, expect, it } from 'vitest';
import {
  csp,
  EARLY_INIT_HASH,
  escapeHtml,
  formatDirectives,
  generateNonce,
  hashScript,
} from '../../src/csp';

describe('formatDirectives', () => {
  it('formats a single directive', () => {
    expect(formatDirectives({ 'default-src': "'self'" })).toBe("default-src 'self'");
  });

  it('joins multiple directives with semicolons', () => {
    const result = formatDirectives({ 'default-src': "'self'", 'script-src': "'none'" });
    expect(result).toBe("default-src 'self'; script-src 'none'");
  });

  it('returns empty string for empty input', () => {
    expect(formatDirectives({})).toBe('');
  });
});

describe('csp', () => {
  it('base policy is exactly frame-ancestors none', () => {
    expect(csp()).toBe("frame-ancestors 'none'");
  });

  it('merges overrides into base policy', () => {
    const result = csp({ 'script-src': "'self'" });
    expect(result).toContain("frame-ancestors 'none'");
    expect(result).toContain("script-src 'self'");
  });

  it('override can replace frame-ancestors', () => {
    const result = csp({ 'frame-ancestors': "'self'" });
    expect(result).toContain("frame-ancestors 'self'");
    expect(result).not.toContain("frame-ancestors 'none'");
  });
});

describe('generateNonce', () => {
  it('returns a non-empty string', () => {
    const nonce = generateNonce();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(0);
  });

  it('returns a different value on each call', () => {
    const n1 = generateNonce();
    const n2 = generateNonce();
    expect(n1).not.toBe(n2);
  });

  it('is valid base64', () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

describe('hashScript', () => {
  it('returns a sha256- prefixed hash', () => {
    const hash = hashScript('markScriptRan();');
    expect(hash).toMatch(/^sha256-/);
  });

  it('produces consistent hashes for the same content', () => {
    const content = 'window.test=1;';
    expect(hashScript(content)).toBe(hashScript(content));
  });

  it('produces different hashes for different content', () => {
    expect(hashScript('a')).not.toBe(hashScript('b'));
  });
});

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"value"')).toBe('&quot;value&quot;');
  });

  it('leaves safe characters unchanged', () => {
    expect(escapeHtml('hello world 123')).toBe('hello world 123');
  });
});

describe('early-init hashes', () => {
  it('EARLY_INIT_HASH is a sha256 hash', () => {
    expect(EARLY_INIT_HASH).toMatch(/^sha256-/);
  });
});
