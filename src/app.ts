import path from 'node:path';
import express from 'express';
import { csp } from './csp';
import { isDev } from './env';
import examplesRouter from './routes/examples/index';
import indexRouter from './routes/index';
import labRouter from './routes/lab';
import { viteDevMiddleware } from './server/vite';

const app = express();

app.disable('x-powered-by');

const cspHeader = csp();

app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', cspHeader);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
  );
  res.setHeader('X-XSS-Protection', '0');
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/lab-assets', express.static(path.join(process.cwd(), 'src', 'lab-assets')));

if (isDev) viteDevMiddleware(app);

app.use('/', indexRouter);
app.use('/examples', examplesRouter);
app.use('/lab', labRouter);

export default app;
