const FIELD_ORDER = [
  'effectiveDirective',
  'originalPolicy',
  'blockedURL',
  'disposition',
  'documentURL',
  'statusCode',
  'referrer',
  'sample',
  'sourceFile',
  'lineNumber',
  'columnNumber',
] as const;

type FieldKey = (typeof FIELD_ORDER)[number];

export interface ReportFields {
  effectiveDirective: string;
  originalPolicy: string;
  blockedURL: string;
  disposition: string;
  documentURL: string;
  statusCode: number;
  referrer: string;
  sample: string;
  sourceFile: string;
  lineNumber: number;
  columnNumber: number;
}

const KEYWORD_BLOCKED_URLS = new Set([
  'inline',
  'eval',
  'blob:',
  'data:',
  'wasm-eval',
  'unsafe-hashes',
]);

export function classifyValue(key: string, value: unknown): string {
  if (typeof value === 'number') return 'j-number';
  if (typeof value === 'string') {
    if (key === 'blockedURL' && KEYWORD_BLOCKED_URLS.has(value)) return 'j-keyword';
    if (key === 'blockedURL' && (value.startsWith('http') || value.startsWith('/'))) return 'j-url';
    if (
      (key === 'documentURL' || key === 'sourceFile' || key === 'referrer') &&
      (value.startsWith('http') || value.startsWith('/'))
    )
      return 'j-url';
  }
  return 'j-string';
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderValue(key: string, value: unknown): string {
  const cls = classifyValue(key, value);
  if (typeof value === 'number') {
    return `<span class="${cls}">${value}</span>`;
  }
  return `<span class="${cls}">"${esc(String(value))}"</span>`;
}

export function buildReportHtml(report: ReportFields, highlight: string[]): string {
  const highlightSet = new Set(highlight);
  const lines: string[] = ['{'];

  FIELD_ORDER.forEach((key, i) => {
    const value = report[key as FieldKey];
    const comma = i < FIELD_ORDER.length - 1 ? ',' : '';
    const keySpan = `<span class="j-key">"${key}"</span>`;
    const colon = `<span class="j-punct">:</span>`;
    const padding = ' '.repeat(Math.max(1, 22 - key.length));
    const valueHtml = renderValue(key, value);
    const lineContent = `  ${keySpan}${colon}${padding}${valueHtml}<span class="j-punct">${comma}</span>`;

    if (highlightSet.has(key)) {
      lines.push(`<span class="j-line-focus">${lineContent}</span>`);
    } else {
      lines.push(lineContent);
    }
  });

  lines.push('}');
  return lines.join('\n');
}

function extractFields(body: Record<string, unknown>): ReportFields {
  return {
    effectiveDirective: String(body['effectiveDirective'] ?? ''),
    originalPolicy: String(body['originalPolicy'] ?? ''),
    blockedURL: String(body['blockedURL'] ?? ''),
    disposition: String(body['disposition'] ?? ''),
    documentURL: String(body['documentURL'] ?? ''),
    statusCode: Number(body['statusCode'] ?? 0),
    referrer: String(body['referrer'] ?? ''),
    sample: String(body['sample'] ?? ''),
    sourceFile: String(body['sourceFile'] ?? ''),
    lineNumber: Number(body['lineNumber'] ?? 0),
    columnNumber: Number(body['columnNumber'] ?? 0),
  };
}

if (typeof HTMLElement !== 'undefined') {
  class CspReportPanelElement extends HTMLElement {
    connectedCallback(): void {
      const highlight: string[] = JSON.parse(this.dataset['highlight'] ?? '[]');

      if (!('ReportingObserver' in window)) return;

      const observer = new ReportingObserver(
        (reports) => {
          const cspReports = reports.filter((r) => r.type === 'csp-violation');
          if (cspReports.length === 0) return;
          observer.disconnect();
          this.populate(cspReports, highlight);
        },
        { types: ['csp-violation'], buffered: true },
      );

      observer.observe();
    }

    private populate(reports: Report[], highlight: string[]): void {
      const skeleton = this.querySelector('.report-panel-skeleton');
      if (!skeleton) return;

      if (reports.length === 1) {
        const [first] = reports;
        const fields = extractFields((first as Report).body as Record<string, unknown>);
        const div = document.createElement('div');
        div.className = 'report-json';
        div.innerHTML = buildReportHtml(fields, highlight);
        skeleton.replaceWith(div);
      } else {
        const container = document.createElement('div');
        reports.forEach((report, i) => {
          const label = document.createElement('div');
          label.className = 'demo-row-label';
          label.textContent = `Violation report ${i + 1} of ${reports.length}`;
          const div = document.createElement('div');
          div.className = 'report-json';
          const fields = extractFields(report.body as Record<string, unknown>);
          div.innerHTML = buildReportHtml(fields, highlight);
          container.appendChild(label);
          container.appendChild(div);
        });
        skeleton.replaceWith(container);
      }
    }
  }

  customElements.define('csp-report-panel', CspReportPanelElement);
}
