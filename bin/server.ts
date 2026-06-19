import http from 'http';
import app from '../src/app';

const port = parseInt(process.env.PORT || '3000', 10);
app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') throw error;
  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${String(port)} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${String(port)} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});
server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${String(addr?.port)}`;
  console.log(`Listening on ${bind}`);
});
