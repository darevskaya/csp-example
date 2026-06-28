import { Response } from 'express';
import { eta } from './eta';
import { isDev, isReload } from './env';

export function render(res: Response, view: string, data: Record<string, unknown> = {}): void {
  const html = eta.render(view, { isDev, isReload, ...data });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
