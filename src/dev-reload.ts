import path from 'path';
import chokidar from 'chokidar';
import type { Express, Request, Response } from 'express';

export function setupDevReload(app: Express): void {
  const clients = new Set<Response>();

  app.get('/__reload', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    clients.add(res);
    req.on('close', () => { clients.delete(res); });
  });

  const watcher = chokidar
    .watch(path.join(__dirname, '..', 'public'), { ignoreInitial: true })
    .on('change', () => {
      for (const res of clients) res.write('data: reload\n\n');
    });

  const shutdown = () => { void watcher.close(); };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
