import express, { Response } from 'express';
import { layout } from '../../layout';
import { csp, formatDirectives, generateNonce } from '../../csp';

const router = express.Router();

const LOADER_SCRIPT = `
var s = document.createElement('script');
s.src = '/javascripts/sdk.js';
document.head.appendChild(s);
`.trim();

type Mode = 'no-strict-dynamic' | 'strict-dynamic' | 'allowlist';

function strictDynamicPage(mode: Mode, nonce: string): string {
  const loaderScriptDisplay = LOADER_SCRIPT.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const cspDisplay = (() => {
    if (mode === 'strict-dynamic') return formatDirectives({ 'script-src': `'nonce-${nonce}' 'strict-dynamic'` });
    if (mode === 'allowlist')      return formatDirectives({ 'script-src': `'self'` });
    return formatDirectives({ 'script-src': `'nonce-${nonce}'` });
  })();

  const statusLabel = (() => {
    if (mode === 'strict-dynamic') return { cls: 'safe',   text: 'strict-dynamic — injected script allowed' };
    if (mode === 'allowlist')      return { cls: 'safe',   text: 'Origin allowlist — SDK origin trusted' };
    return                                { cls: 'unsafe', text: 'No strict-dynamic — injected script blocked' };
  })();

  const explanation = (() => {
    if (mode === 'strict-dynamic') return `The loader has a nonce so the browser trusts it. <code>'strict-dynamic'</code> extends that trust to any script the loader injects — even though the injected script has no nonce of its own.`;
    if (mode === 'allowlist')      return `The SDK's origin (<code>'self'</code> here, normally the CDN URL) is listed directly in <code>script-src</code>. No nonce needed — any script from that origin is trusted.`;
    return `The loader has a nonce and runs. But the <code>&lt;script&gt;</code> it creates dynamically has no nonce — the browser blocks it. Without <code>'strict-dynamic'</code>, trust doesn't pass from a trusted script to the scripts it injects.`;
  })();

  const body = `
    <a class="back" href="/">← back to examples</a>

    <div class="example-header">
      <h1>strict-dynamic &amp; Origin Allowlist</h1>
      <p>When a third-party SDK injects scripts dynamically, neither nonce nor hash alone is enough. These are the two approaches that work.</p>
    </div>

    <div class="row">
      <div class="csp-toggle">
        <a href="/examples/third-party/no-strict-dynamic" class="${mode === 'no-strict-dynamic' ? 'active-unsafe' : ''}">No strict-dynamic</a>
        <a href="/examples/third-party/strict-dynamic"    class="${mode === 'strict-dynamic'    ? 'active-safe'   : ''}">strict-dynamic</a>
        <a href="/examples/third-party/allowlist"         class="${mode === 'allowlist'         ? 'active-safe'   : ''}">Origin allowlist</a>
      </div>
      <div class="status-badge ${statusLabel.cls}">${statusLabel.text}</div>
    </div>

    <div class="info-box card">
      <div class="info-label label">Response header</div>
      <code>Content-Security-Policy: ${cspDisplay}</code>
    </div>

    <div class="script-box card">
      <div class="info-label label">${mode === 'allowlist' ? 'SDK script loaded directly (no loader needed)' : `Loader script (runs on this page${mode !== 'allowlist' ? `, nonce="<span class="nonce-token">${nonce}</span>"` : ''})`}</div>
      <pre><code>${mode === 'allowlist' ? `&lt;script src="/javascripts/sdk.js"&gt;&lt;/script&gt;` : loaderScriptDisplay}</code></pre>
      ${mode !== 'allowlist' ? `<div class="hash-note">↳ dynamically injects <code>/javascripts/sdk.js</code></div>` : ''}
    </div>

    <div class="output card">
      <div class="info-label label">Result</div>
      <p id="sdk-output" class="blocked">SDK script blocked by CSP.</p>
    </div>

    <div class="explanation card">${explanation}</div>

    ${mode !== 'allowlist'
      ? `<script nonce="${nonce}">${LOADER_SCRIPT}</script>`
      : `<script src="/javascripts/sdk.js"></script>`
    }
  `;

  return layout('strict-dynamic', body);
}

function handler(mode: Mode) {
  return (_req: unknown, res: Response) => {
    const nonce = generateNonce();
    if (mode === 'strict-dynamic') {
      res.setHeader('Content-Security-Policy', csp({ 'script-src': `'nonce-${nonce}' 'strict-dynamic'` }));
    } else if (mode === 'allowlist') {
      res.setHeader('Content-Security-Policy', csp({ 'script-src': `'self'` }));
    } else {
      // Only the nonce is trusted — dynamically injected scripts have no nonce, so they're blocked
      res.setHeader('Content-Security-Policy', csp({ 'script-src': `'nonce-${nonce}'` }));
    }
    res.send(strictDynamicPage(mode, nonce));
  };
}

router.get('/no-strict-dynamic', handler('no-strict-dynamic'));
router.get('/strict-dynamic',    handler('strict-dynamic'));
router.get('/allowlist',         handler('allowlist'));

export default router;
