import express, { Response } from 'express';
import crypto from 'crypto';
import { layout } from '../../layout';
import { csp, formatDirectives } from '../../csp';

const router = express.Router();

const HASH_SCRIPT_CONTENT = `document.getElementById('hash-output').className = 'ran'; document.getElementById('hash-output').textContent = 'Script executed successfully — hash matched.'`;
const SCRIPT_HASH = `sha256-${crypto.createHash('sha256').update(HASH_SCRIPT_CONTENT).digest('base64')}`;

const DIFFERENT_SCRIPT_CONTENT = `document.getElementById('hash-output').textContent = 'This line never runs.'`;

function hashPage(withHash: boolean): string {
  const cspDisplay = formatDirectives({ 'default-src': `'self' '${SCRIPT_HASH}'` });
  const activeScript = withHash ? HASH_SCRIPT_CONTENT : DIFFERENT_SCRIPT_CONTENT;

  const body = `
    <a class="back" href="/">← back to examples</a>

    <div class="example-header">
      <h1>Hash</h1>
      <p>CSP is active on both pages. The difference is whether the script's content matches the hash in the header.</p>
    </div>

    <div class="row">
      <div class="csp-toggle">
        <a href="/examples/inline-script/no-hash" class="${!withHash ? 'active-unsafe' : ''}">Script without matching hash</a>
        <a href="/examples/inline-script/hash" class="${withHash ? 'active-safe' : ''}">Script with matching hash</a>
      </div>
      <div class="status-badge ${withHash ? 'safe' : 'unsafe'}">
        ${withHash ? 'Hash matched — script allowed' : 'Hash mismatch — script blocked'}
      </div>
    </div>

    <div class="info-box card">
      <div class="info-label label">Response header (same on both pages)</div>
      <code>Content-Security-Policy: ${cspDisplay}</code>
    </div>

    <div class="script-box card">
      <div class="info-label label">Inline script in page source</div>
      <pre><code>&lt;script&gt;${activeScript}&lt;/script&gt;</code></pre>
      <div class="hash-note">
        Header allows hash: <span class="nonce-token">${SCRIPT_HASH}</span>
        ${!withHash ? `<br>Script hash: <span class="nonce-missing">${`sha256-${crypto.createHash('sha256').update(DIFFERENT_SCRIPT_CONTENT).digest('base64')}`} ← does not match</span>` : ''}
      </div>
    </div>

    <div class="output card">
      <div class="info-label label">Result</div>
      <p id="hash-output" class="blocked">Script blocked by CSP.</p>
    </div>

    <script>${activeScript}</script>
  `;

  return layout('Hash', body);
}

function hashHandler(withHash: boolean) {
  return (_req: unknown, res: Response) => {
    res.setHeader('Content-Security-Policy', csp({ 'default-src': `'self' '${SCRIPT_HASH}'` }));
    res.send(hashPage(withHash));
  };
}

router.get('/hash', hashHandler(true));
router.get('/no-hash', hashHandler(false));

export default router;
