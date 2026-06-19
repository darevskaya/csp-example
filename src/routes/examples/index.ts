import express, { Request, Response } from 'express';
import { layout } from '../../layout';

const router = express.Router();

const CSP_HEADER = "default-src 'self'";

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

    <div class="info-box ${cspOn ? '' : 'muted'}">
      <div class="info-label">Response header</div>
      <code>${cspOn ? `Content-Security-Policy: ${CSP_HEADER}` : `Content-Security-Policy: <em>(not set)</em>`}</code>
      ${cspOn && query ? `<div class="console-note"><span>⚠</span> Script blocked — check the browser console.</div>` : ''}
    </div>

    <div class="demo-box">
      <label>Search query</label>
      <form method="get" action="${action}">
        <div class="input-row">
          <input type="text" name="q" value='<script>alert(1)</script>'>
          <button type="submit">Search</button>
        </div>
      </form>
    </div>

    ${query ? `
    <div class="output">
      <div class="output-label">Output</div>
      Reflected input: ${query}
    </div>` : ''}
  `;

  return layout('Reflected XSS', body, cspOn ? `<meta http-equiv="Content-Security-Policy" content="${CSP_HEADER}">` : '');
}

router.get('/reflected-xss/safe', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  res.setHeader('Content-Security-Policy', CSP_HEADER);
  res.send(page(query, true));
});

router.get('/reflected-xss/unsafe', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  res.send(page(query, false));
});

export default router;
