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

const CSS = {
  PANEL: 'report-panel-skeleton',
  FIELD: 'skeleton-field',
  KEY: 'skeleton-key',
  BAR: 'skeleton-bar',
  REPORT_JSON: 'report-json',
  ROW_LABEL: 'demo-row-label',
  LINE_FOCUS: 'j-line-focus',
  J_KEY: 'j-key',
  J_PUNCT: 'j-punct',
} as const;

const SKELETON_BAR_WIDTHS: Record<FieldKey, string> = {
  effectiveDirective: 'skeleton-bar--md',
  originalPolicy: 'skeleton-bar--xl',
  blockedURL: 'skeleton-bar--sm',
  disposition: 'skeleton-bar--sm',
  documentURL: 'skeleton-bar--xl',
  statusCode: 'skeleton-bar--xs',
  referrer: 'skeleton-bar--lg',
  sample: 'skeleton-bar--xs',
  sourceFile: 'skeleton-bar--xl',
  lineNumber: 'skeleton-bar--xs',
  columnNumber: 'skeleton-bar--xs',
};

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
  if (typeof value === 'number') return `<span class="${cls}">${value}</span>`;
  return `<span class="${cls}">"${esc(String(value))}"</span>`;
}

function renderLine(key: FieldKey, value: unknown, comma: string, focused: boolean): string {
  const keySpan = `<span class="${CSS.J_KEY}">"${key}"</span>`;
  const colon = `<span class="${CSS.J_PUNCT}">:</span>`;
  const padding = ' '.repeat(Math.max(1, 22 - key.length));
  const content = `  ${keySpan}${colon}${padding}${renderValue(key, value)}<span class="${CSS.J_PUNCT}">${comma}</span>`;
  return focused ? `<span class="${CSS.LINE_FOCUS}">${content}</span>` : content;
}

export function buildReportHtml(report: ReportFields, highlight: string[]): string {
  const highlightSet = new Set(highlight);
  const lines: string[] = ['{'];
  FIELD_ORDER.forEach((key, i) => {
    const comma = i < FIELD_ORDER.length - 1 ? ',' : '';
    lines.push(renderLine(key, report[key as FieldKey], comma, highlightSet.has(key)));
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

export function isDevNoise(fields: ReportFields): boolean {
  return fields.originalPolicy.includes('localhost:');
}

function extractFieldsFromEvent(e: SecurityPolicyViolationEvent): ReportFields {
  return {
    effectiveDirective: e.effectiveDirective,
    originalPolicy: e.originalPolicy,
    blockedURL: e.blockedURI,
    disposition: e.disposition,
    documentURL: e.documentURI,
    statusCode: e.statusCode,
    referrer: e.referrer,
    sample: e.sample,
    sourceFile: e.sourceFile,
    lineNumber: e.lineNumber,
    columnNumber: e.columnNumber,
  };
}

function buildSkeleton(): HTMLElement {
  const container = document.createElement('div');
  container.className = CSS.PANEL;
  for (const key of FIELD_ORDER) {
    const field = document.createElement('div');
    field.className = CSS.FIELD;
    const keyEl = document.createElement('span');
    keyEl.className = CSS.KEY;
    keyEl.textContent = key;
    const bar = document.createElement('span');
    bar.className = `${CSS.BAR} ${SKELETON_BAR_WIDTHS[key]}`;
    field.appendChild(keyEl);
    field.appendChild(bar);
    container.appendChild(field);
  }
  return container;
}

function renderSingleReport(fields: ReportFields, highlight: string[]): HTMLElement {
  const div = document.createElement('div');
  div.className = CSS.REPORT_JSON;
  div.innerHTML = buildReportHtml(fields, highlight);
  return div;
}

const Base = typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as typeof HTMLElement);

// Capture securitypolicyviolation events at module load time so nothing is missed
// before connectedCallback runs (Safari fallback — no ReportingObserver).
const spvBuffer: ReportFields[] = [];
let spvListening = false;

function ensureSpvListener(): void {
  if (spvListening || typeof document === 'undefined') return;
  spvListening = true;
  document.addEventListener('securitypolicyviolation', (e: SecurityPolicyViolationEvent) => {
    spvBuffer.push(extractFieldsFromEvent(e));
  });
}

export class CspReportPanelElement extends Base {
  connectedCallback(): void {
    this.appendChild(buildSkeleton());
    const highlight: string[] = JSON.parse(this.dataset['highlight'] ?? '[]');

    if ('ReportingObserver' in window) {
      const observer = new ReportingObserver(
        (reports) => {
          const cspReports = reports
            .filter((r) => r.type === 'csp-violation')
            .map((r) => extractFields(r.body as Record<string, unknown>))
            .filter((f) => !isDevNoise(f));
          if (cspReports.length === 0) return;
          observer.disconnect();
          this.show(cspReports, highlight);
        },
        { types: ['csp-violation'], buffered: true },
      );
      observer.observe();
    } else {
      // Safari fallback: drain the module-level buffer (populated before connectedCallback ran)
      queueMicrotask(() => {
        const filtered = spvBuffer.filter((f) => !isDevNoise(f));
        if (filtered.length > 0) this.show([...filtered], highlight);
      });
    }
  }

  private show(reports: ReportFields[], highlight: string[]): void {
    const skeleton = this.querySelector(`.${CSS.PANEL}`);
    if (!skeleton) return;
    skeleton.replaceWith(this.buildReportContainer(reports, highlight));
  }

  private buildReportContainer(reports: ReportFields[], highlight: string[]): HTMLElement {
    if (reports.length === 1) return renderSingleReport(reports[0] as ReportFields, highlight);
    const container = document.createElement('div');
    reports.forEach((fields, i) => {
      const label = document.createElement('div');
      label.className = CSS.ROW_LABEL;
      label.textContent = `Violation report ${i + 1} of ${reports.length}`;
      container.appendChild(label);
      container.appendChild(renderSingleReport(fields, highlight));
    });
    return container;
  }
}

if (typeof customElements !== 'undefined') {
  ensureSpvListener();
  customElements.define('csp-report-panel', CspReportPanelElement);
}
