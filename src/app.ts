import express, { Request, Response } from 'express';
import path from 'path';
import indexRouter from './routes/index';
import examplesRouter from './routes/examples/index';
import { csp } from './csp';

const app = express();
const isDev = process.env.NODE_ENV !== 'production';

app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', csp());
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

if (isDev) {
  const clients = new Set<Response>();

  app.get('/__reload', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    clients.add(res);
    req.on('close', () => { clients.delete(res); });
  });

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { watch } = require('chokidar') as typeof import('chokidar');
  watch(path.join(__dirname, '..', 'public'), { ignoreInitial: true })
    .on('change', () => {
      for (const res of clients) res.write('data: reload\n\n');
    });
}

app.use('/', indexRouter);
app.use('/examples', examplesRouter);

export default app;
