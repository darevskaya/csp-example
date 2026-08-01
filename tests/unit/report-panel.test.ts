import { describe, expect, it } from 'vitest';
import {
  buildReportHtml,
  classifyValue,
  isDevNoise,
} from '../../src/ui/components/report-panel/report-panel.element';

describe('classifyValue', () => {
  it('classifies "inline" as keyword', () => {
    expect(classifyValue('blockedURL', 'inline')).toBe('j-keyword');
  });

  it('classifies "eval" as keyword', () => {
    expect(classifyValue('blockedURL', 'eval')).toBe('j-keyword');
  });

  it('classifies "data:" as keyword', () => {
    expect(classifyValue('blockedURL', 'data:')).toBe('j-keyword');
  });

  it('classifies "blob:" as keyword', () => {
    expect(classifyValue('blockedURL', 'blob:')).toBe('j-keyword');
  });

  it('classifies a URL string as j-url for documentURL', () => {
    expect(classifyValue('documentURL', 'http://localhost:3000/foo')).toBe('j-url');
  });

  it('classifies a URL string as j-url for blockedURL with http', () => {
    expect(classifyValue('blockedURL', 'https://example.com/lib.js')).toBe('j-url');
  });

  it('classifies a plain string as j-string', () => {
    expect(classifyValue('disposition', 'report')).toBe('j-string');
  });

  it('classifies a number as j-number', () => {
    expect(classifyValue('statusCode', 200)).toBe('j-number');
  });

  it('classifies an empty string as j-string', () => {
    expect(classifyValue('sample', '')).toBe('j-string');
  });
});

describe('isDevNoise', () => {
  const base = {
    effectiveDirective: 'script-src-elem',
    originalPolicy:
      "frame-ancestors 'none'; default-src 'self'; report-to csp-endpoint; script-src 'nonce-abc' 'sha256-xyz'",
    blockedURL: '',
    disposition: 'report',
    documentURL: 'http://localhost:3000/examples/reporting/blocked-resource/inline-script',
    statusCode: 200,
    referrer: '',
    sample: '',
    sourceFile: '',
    lineNumber: 0,
    columnNumber: 0,
  };

  it('returns true when blockedURL is a Vite script URL', () => {
    expect(isDevNoise({ ...base, blockedURL: 'http://localhost:5173/@vite/client' })).toBe(true);
  });

  it('returns true when blockedURL is the Vite websocket URL', () => {
    expect(isDevNoise({ ...base, blockedURL: 'ws://localhost:5173/?token=abc' })).toBe(true);
  });

  it('returns true when sourceFile points to Vite client', () => {
    expect(
      isDevNoise({
        ...base,
        blockedURL: 'inline',
        sourceFile: 'http://localhost:5173/@vite/client',
      }),
    ).toBe(true);
  });

  it('returns false for the intended inline script violation', () => {
    expect(
      isDevNoise({
        ...base,
        blockedURL: 'inline',
        sourceFile: 'http://localhost:3000/examples/reporting/blocked-resource/inline-script',
      }),
    ).toBe(false);
  });

  it('returns true for Vite inline-style violation (sourceFile is localhost:5173)', () => {
    expect(
      isDevNoise({
        ...base,
        blockedURL: 'inline',
        sourceFile: 'http://localhost:5173/@vite/client',
      }),
    ).toBe(true);
  });

  it('returns false for a production external script violation', () => {
    expect(
      isDevNoise({ ...base, blockedURL: 'https://cdn.example.com/lib.js', sourceFile: '' }),
    ).toBe(false);
  });
});

describe('buildReportHtml', () => {
  const report = {
    effectiveDirective: 'script-src-elem',
    originalPolicy: "default-src 'self'",
    blockedURL: 'inline',
    disposition: 'report',
    documentURL: 'http://localhost:3000/foo',
    statusCode: 200,
    referrer: '',
    sample: '',
    sourceFile: 'http://localhost:3000/foo',
    lineNumber: 5,
    columnNumber: 1,
  };

  it('wraps highlighted fields in j-line-focus', () => {
    const html = buildReportHtml(report, ['effectiveDirective']);
    expect(html).toContain('j-line-focus');
    expect(html).toContain('script-src-elem');
  });

  it('does not wrap non-highlighted fields in j-line-focus', () => {
    const html = buildReportHtml(report, ['effectiveDirective']);
    const lines = html.split('\n');
    const dispositionLine = lines.find((l) => l.includes('disposition'));
    expect(dispositionLine).toBeDefined();
    expect(dispositionLine).not.toContain('j-line-focus');
  });

  it('outputs fields in the canonical order', () => {
    const html = buildReportHtml(report, []);
    const effIdx = html.indexOf('effectiveDirective');
    const origIdx = html.indexOf('originalPolicy');
    const blockedIdx = html.indexOf('blockedURL');
    expect(effIdx).toBeLessThan(origIdx);
    expect(origIdx).toBeLessThan(blockedIdx);
  });

  it('uses j-keyword for "inline" blockedURL', () => {
    const html = buildReportHtml(report, []);
    expect(html).toContain('j-keyword');
  });

  it('uses j-number for statusCode', () => {
    const html = buildReportHtml(report, []);
    expect(html).toContain('j-number');
  });
});
