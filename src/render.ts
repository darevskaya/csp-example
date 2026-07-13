import type { Response } from 'express';
import { isDev } from './env';
import { eta } from './eta';
import { assetUrl, cssUrls, viteHmrScript } from './server/vite';

const MAIN_ENTRY = 'main.ts';

export function render(res: Response, view: string, data: Record<string, unknown> = {}): void {
  const mainJs = assetUrl(MAIN_ENTRY);
  const mainCss = cssUrls(MAIN_ENTRY);
  const html = eta.render(view, { isDev, mainJs, mainCss, viteHmrScript, ...data });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
