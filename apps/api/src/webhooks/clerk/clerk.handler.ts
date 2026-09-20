import { verifyWebhook } from '@clerk/express/webhooks';
import type { RequestHandler } from 'express';
import type { ClerkUserInsert } from '../../modules/users/users.repository';

type Dependencies = {
  signingSecret: () => string | undefined;
  insertUser: (user: ClerkUserInsert) => Promise<void>;
};

export function createClerkWebhookHandler({ signingSecret, insertUser }: Dependencies): RequestHandler {
  return async (req, res) => {
    const secret = signingSecret()?.trim();
    if (!secret) {
      res.status(503).json({ error: 'Clerk webhook is not configured.' });
      return;
    }

    let event;
    try {
      event = await verifyWebhook(req, { signingSecret: secret });
    } catch {
      res.status(400).json({ error: 'Invalid webhook signature or payload.' });
      return;
    }

    if (event.type !== 'user.created') {
      res.status(200).json({ status: 'ignored' });
      return;
    }

    const user = event.data;
    const email = user.email_addresses?.find(address => address.id === user.primary_email_address_id)?.email_address;
    const firstName = user.first_name ?? '';
    const lastName = user.last_name ?? '';
    if (typeof user.id !== 'string' || !user.id || user.id.length > 255 ||
        typeof email !== 'string' || !email.trim() || email.length > 255 ||
        typeof firstName !== 'string' || firstName.length > 100 ||
        typeof lastName !== 'string' || lastName.length > 100) {
      res.status(422).json({ error: 'User profile does not meet database requirements.' });
      return;
    }

    try {
      await insertUser({ clerkUserId: user.id, email, firstName, lastName });
    } catch {
      // A non-2xx response lets Clerk retry; never acknowledge a failed write.
      res.status(500).json({ error: 'Unable to persist Clerk user.' });
      return;
    }
    res.status(200).json({ status: 'ok' });
  };
}
