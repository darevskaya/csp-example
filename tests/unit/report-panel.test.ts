import { describe, expect, it } from 'vitest';
import {
  buildReportHtml,
  classifyValue,
  isExpected,
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

describe('isExpected', () => {
  const base = {
    effectiveDirective: 'script-src-elem',
    originalPolicy:
      "frame-ancestors 'none'; default-src 'self'; report-to csp-endpoint; script-src 'nonce-abc' 'sha256-xyz'",
    blockedURL: 'inline',
    disposition: 'report',
    documentURL: 'http://localhost:3000/examples/reporting/blocked-resource/inline-script',
    statusCode: 200,
    referrer: '',
    sample: '',
    sourceFile: 'http://localhost:3000/examples/reporting/blocked-resource/inline-script',
    lineNumber: 66,
    columnNumber: 0,
  };

  it('matches when blockedURL and effectiveDirective both match', () => {
    expect(
      isExpected(base, [{ blockedURL: 'inline', effectiveDirective: 'script-src-elem' }]),
    ).toBe(true);
  });

  it('does not match when effectiveDirective differs', () => {
    expect(
      isExpected(base, [{ blockedURL: 'inline', effectiveDirective: 'script-src-attr' }]),
    ).toBe(false);
  });

  it('matches on blockedURL alone when effectiveDirective is omitted', () => {
    expect(
      isExpected({ ...base, blockedURL: 'https://cdn.example.com/lib.js' }, [
        { blockedURL: 'https://cdn.example.com/lib.js' },
      ]),
    ).toBe(true);
  });

  it('does not match a browser extension or Vite violation not in the expected list', () => {
    expect(
      isExpected(
        {
          ...base,
          blockedURL: 'chrome-extension://abc/script.js',
          effectiveDirective: 'script-src-elem',
        },
        [{ blockedURL: 'inline', effectiveDirective: 'script-src-elem' }],
      ),
    ).toBe(false);
  });

  it('matches any entry in a multi-entry expected list', () => {
    const fields = {
      ...base,
      blockedURL: 'https://images.example.com/photo.jpg',
      effectiveDirective: 'img-src',
    };
    expect(
      isExpected(fields, [
        { blockedURL: 'https://images.example.com/photo.jpg' },
        { blockedURL: 'https://static.example.com/style.css' },
      ]),
    ).toBe(true);
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
    // Extract the j-line span containing "disposition" and verify it has no j-line-focus
    const match = html.match(/<span class="j-line">([^<]|<(?!\/span>))*"disposition".*?<\/span>/);
    expect(match).not.toBeNull();
    expect(match![0]).not.toContain('j-line-focus');
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
