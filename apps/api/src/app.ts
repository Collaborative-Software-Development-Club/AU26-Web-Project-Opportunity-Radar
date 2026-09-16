import express from 'express';
import cors from 'cors';
import { env } from './config/env';
export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.webOrigins }));
app.get('/', (_req, res) => res.json({ service: 'opportunity-radar-api', status: 'scaffold', message: 'Product endpoints are not implemented yet.' }));
app.get('/health', (_req, res) => res.json({ status: 'ok', scope: 'process-only' }));
app.use((_req, res) => { res.status(404).json({ error: 'Route not implemented.' }); });
