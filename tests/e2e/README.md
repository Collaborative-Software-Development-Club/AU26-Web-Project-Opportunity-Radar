# End-to-end tests

Product-flow tests remain placeholders until authentication, discovery, and saves are implemented.

Startup smoke checks:
1. Run `npm run check` from the root to type-check the applications and build the web app.
2. Run `npm run dev`; verify the web placeholder screen and GET `/health` on the API.
3. Run `npm run dev:mobile`; verify the mobile placeholder screen on a compatible Expo client.

The API health endpoint checks process availability only. No Clerk or Neon integration is exercised.
