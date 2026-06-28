import express, { Request, Response } from 'express';
import { layout } from '../../layout';
import { csp, formatDirectives, generateNonce } from '../../csp';

const router = express.Router();

const SCRIPT_CONTENT = `document.getElementById('nonce-output').className = 'ran'; document.getElementById('nonce-output').textContent = 'Script executed successfully — nonce matched.'`;
const BLOCKED_SCRIPT_CONTENT = `document.getElementById('nonce-output').textContent = 'This line never runs.'`;

function noncePage(withNonce: boolean, nonce: string): string {
  const cspDisplay = formatDirectives({ 'default-src': `'self' 'nonce-${nonce}'` });

  const body = `
    <a class="back" href="/">← back to examples</a>

    <div class="example-header">
      <h1>Nonce</h1>
      <p>CSP is active on both pages. The difference is whether the script carries a matching nonce.</p>
    </div>

    <div class="row">
      <div class="csp-toggle">
        <a href="/examples/inline-script/no-nonce" class="${!withNonce ? 'active-unsafe' : ''}">Script without nonce</a>
        <a href="/examples/inline-script/nonce" class="${withNonce ? 'active-safe' : ''}">Script with nonce</a>
      </div>
      <div class="status-badge ${withNonce ? 'safe' : 'unsafe'}">
        ${withNonce ? 'Nonce matched — script allowed' : 'No nonce — script blocked'}
      </div>
    </div>

    <div class="info-box card">
      <div class="info-label label">Response header (same on both pages)</div>
      <code>Content-Security-Policy: ${cspDisplay}</code>
    </div>

    <div class="script-box card">
      <div class="info-label label">Inline script in page source</div>
      <pre><code>&lt;script${withNonce ? ` nonce="<span class="nonce-token">${nonce}</span>"` : ' <span class="nonce-missing">← no nonce attribute</span>'}&gt;${withNonce ? SCRIPT_CONTENT : BLOCKED_SCRIPT_CONTENT}&lt;/script&gt;</code></pre>
    </div>

    <div class="output card">
      <div class="info-label label">Result</div>
      <p id="nonce-output" class="blocked">Script blocked by CSP.</p>
    </div>

    <script${withNonce ? ` nonce="${nonce}"` : ''}>${withNonce ? SCRIPT_CONTENT : BLOCKED_SCRIPT_CONTENT}</script>
  `;

  return layout('Nonce', body, `<meta name="csp-nonce" content="${nonce}">`);
}

router.get('/nonce', (_req: Request, res: Response) => {
  const nonce = generateNonce();
  res.setHeader('Content-Security-Policy', csp({ 'default-src': `'self' 'nonce-${nonce}'` }));
  res.send(noncePage(true, nonce));
});

router.get('/no-nonce', (_req: Request, res: Response) => {
  const nonce = generateNonce();
  res.setHeader('Content-Security-Policy', csp({ 'default-src': `'self' 'nonce-${nonce}'` }));
  res.send(noncePage(false, nonce));
});

export default router;
