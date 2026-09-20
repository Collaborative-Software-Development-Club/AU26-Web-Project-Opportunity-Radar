import '@radar/database';
import { app } from './app';
import { env } from './config/env';
const server = app.listen(env.port, '0.0.0.0', () => console.log(`API scaffold running at http://localhost:${env.port}`));
server.on('error', error => { console.error(`Unable to start API: ${error.message}`); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close());
