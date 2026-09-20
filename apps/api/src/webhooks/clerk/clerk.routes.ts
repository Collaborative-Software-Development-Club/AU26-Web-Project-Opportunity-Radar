import { Router, raw } from 'express';
import { createClerkWebhookHandler } from './clerk.handler';

export const clerkWebhookRouter = Router();
clerkWebhookRouter.post('/', raw({ type: 'application/json', limit: '256kb' }), createClerkWebhookHandler({
  signingSecret: () => process.env.CLERK_WEBHOOK_SIGNING_SECRET,
  insertUser: async user => {
    const { insertClerkUser } = await import('../../modules/users/users.repository');
    await insertClerkUser(user);
  },
}));
