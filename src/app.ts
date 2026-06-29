import express from 'express';
import path from 'path';
import indexRouter from './routes/index';
import examplesRouter from './routes/examples/index';
import { csp } from './csp';
import { isReload } from './env';
import { setupDevReload } from './dev-reload';

const app = express();

app.disable('x-powered-by');

const cspHeader = csp();

app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', cspHeader);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

if (isReload) setupDevReload(app);

app.use('/', indexRouter);
app.use('/examples', examplesRouter);

export default app;
