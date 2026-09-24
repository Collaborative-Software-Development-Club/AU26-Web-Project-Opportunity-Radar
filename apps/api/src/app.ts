import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { clerkMiddleware } from '@clerk/express';
import { usersRouter } from './modules/users/users.routes';
import { opportunitiesRouter } from './modules/opportunities/opportunities.routes';
import { errorHandler } from './middleware/error-handler';
import { clerkWebhookRouter } from './webhooks/clerk/clerk.routes';

export const app = express();

app.disable('x-powered-by');
// Handle browser preflight before authentication, including Authorization headers.
app.use(cors({ origin: env.webOrigins }));
app.get('/', (_req, res) => res.json({ service: 'opportunity-radar-api', status: 'ok' }));
app.get('/health', (_req, res) => res.json({ status: 'ok', scope: 'process-only' }));
// Signature-authenticated server-to-server route; keep before session/JSON middleware.
app.use('/webhooks/clerk', clerkWebhookRouter);
app.use('/api', clerkMiddleware({ authorizedParties: env.clerkAuthorizedParties }));
app.use('/api/users', usersRouter);
app.use('/api/opportunities', opportunitiesRouter);  
app.use((_req, res) => { res.status(404).json({ error: 'Route not implemented.' }); });
app.use(errorHandler);
