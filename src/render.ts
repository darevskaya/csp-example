import type { Response } from 'express';
import { EARLY_INIT_SCRIPT, generateNonce } from './csp';
import { isDev } from './env';
import { eta } from './eta';
import { assetUrl, cssUrls, viteHmrScript } from './server/vite';

const MAIN_ENTRY = 'main.ts';
const DEV_NONCE_RE = /((?:default-src|script-src-elem|script-src(?!-attr|-elem))\b[^;]*)/g;

export function render(res: Response, view: string, data: Record<string, unknown> = {}): void {
  const mainJs = assetUrl(MAIN_ENTRY);
  const mainCss = cssUrls(MAIN_ENTRY);

  const viteNonce = isDev ? generateNonce() : '';
  if (isDev) {
    const existing = res.getHeader('Content-Security-Policy');
    if (typeof existing === 'string') {
      res.setHeader(
        'Content-Security-Policy',
        existing.replace(DEV_NONCE_RE, `$1 'nonce-${viteNonce}'`),
      );
    }
  }

  const html = eta.render(view, {
    isDev,
    mainJs,
    mainCss,
    viteHmrScript: viteHmrScript(viteNonce),
    earlyInitScript: EARLY_INIT_SCRIPT,
    viteNonce,
    ...data,
  });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
