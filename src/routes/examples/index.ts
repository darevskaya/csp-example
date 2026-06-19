import express, { Request, Response } from 'express';
import { layout } from '../../layout';
import { csp, formatDirectives } from '../../csp';

const router = express.Router();

const DEMO_DIRECTIVES: Record<string, string> = { 'default-src': "'self'" };
const DEMO_CSP = csp(DEMO_DIRECTIVES);
const DEMO_CSP_DISPLAY = formatDirectives(DEMO_DIRECTIVES);

function page(query: string, cspOn: boolean): string {
  const action = cspOn ? '/examples/reflected-xss/safe' : '/examples/reflected-xss/unsafe';

  const body = `
    <a class="back" href="/">← back to examples</a>

    <div class="example-header">
      <h1>Reflected XSS</h1>
      <p>User input is reflected directly into the page without sanitization.</p>
    </div>

    <div class="row">
      <div class="csp-toggle">
        <a href="/examples/reflected-xss/unsafe" class="${!cspOn ? 'active-unsafe' : ''}">CSP off</a>
        <a href="/examples/reflected-xss/safe" class="${cspOn ? 'active-safe' : ''}">CSP on</a>
      </div>
      <div class="status-badge ${cspOn ? 'safe' : 'unsafe'}">
        ${cspOn ? 'CSP blocking inline scripts' : 'Vulnerable — no CSP'}
      </div>
    </div>

    <div class="info-box card ${cspOn ? '' : 'muted'}">
      <div class="info-label label">Response header</div>
      <code>${cspOn ? `Content-Security-Policy: ${DEMO_CSP_DISPLAY}` : `Content-Security-Policy: <em>(not set)</em>`}</code>
      ${cspOn && query ? `<div class="console-note"><span>⚠</span> Script blocked — check the browser console.</div>` : ''}
    </div>

    <div class="demo-box card">
      <label>Search query</label>
      <form method="get" action="${action}">
        <div class="input-row">
          <input type="text" name="term" value='<script>alert(1)</script>'>
          <button type="submit">Search</button>
        </div>
      </form>
    </div>

    ${query ? `
    <div class="output card">
      <div class="output-label label">Output</div>
      Reflected input: ${query}
    </div>` : ''}
  `;

  return layout('Reflected XSS', body);
}

function reflectedXssHandler(cspOn: boolean) {
  return (req: Request, res: Response) => {
    const raw = req.query.term;
    const query = typeof raw === 'string' ? raw : '';
    if (cspOn) res.setHeader('Content-Security-Policy', DEMO_CSP);
    res.send(page(query, cspOn));
  };
}

router.get('/reflected-xss/safe', reflectedXssHandler(true));
router.get('/reflected-xss/unsafe', reflectedXssHandler(false));

export default router;
