import http from 'http';
import app from '../src/app';

const port = parseInt(process.env['PORT'] || '3000', 10);
app.set('port', port);

const server = http.createServer(app);

const ERROR_MESSAGES: Partial<Record<string, string>> = {
  EACCES:    `Port ${port} requires elevated privileges`,
  EADDRINUSE: `Port ${port} is already in use`,
};

server.listen(port);
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') throw error;
  const message = error.code !== undefined ? ERROR_MESSAGES[error.code] : undefined;
  if (message !== undefined) {
    console.error(message);
    process.exit(1);
  }
  throw error;
});
server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
  console.log(`Listening on ${bind}`);
});
