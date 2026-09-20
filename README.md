# Opportunity Radar

A personalized opportunity discovery platform for students.

## Stack

- Web: React + TypeScript (Vite)
- Mobile: React Native + TypeScript (Expo)
- API: Express.js
- Authentication: Clerk
- Database: Neon Postgres
- ORM and migrations: Drizzle
- Repository: npm workspaces

## Structure

```text
.env.example           Shared backend configuration template
apps/
  web/                 React routes, providers, features, and shared web components
  mobile/              Expo routes, features, native components, and secure token cache
  api/                 Express feature modules, middleware, and optional Clerk webhooks
  ingestion/           Source adapters, normalization, persistence, and scheduled jobs
packages/
  database/            Neon client, Drizzle schema, migrations, and seeds
  contracts/           Shared public API schemas and types
  api-client/          Shared typed API requests
  config/              Shared TypeScript configuration
docs/                  Architecture, data model, and source notes
tests/e2e/             Future integration tests
.github/workflows/     Future CI workflows
```

## Running locally

Run all commands below from the repository root.

### 1. Install dependencies

Use Node.js 22 (`.nvmrc` is included) and npm. If you use nvm:

```bash
nvm install
nvm use
npm install
```

If Node.js 22 is already installed without nvm, run only `npm install`. Once a lockfile is available, use `npm ci` for a reproducible clean installation.

### 2. Prepare environment files

```bash
cp -n .env.example .env
cp -n apps/web/.env.example apps/web/.env
cp -n apps/mobile/.env.example apps/mobile/.env
```

`-n` preserves any existing local files. The API requires a valid `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY` in the root `.env`. The web app requires `VITE_CLERK_PUBLISHABLE_KEY` in `apps/web/.env` for Clerk authentication; without it, the page displays setup instructions. Mobile remains a placeholder and does not require service credentials. Use one `NAME=value` entry per line, with plain URLs and no Markdown formatting. See the complete variable map below.

### 3. Start the web app and API

```bash
npm run dev
```

- Web: [http://localhost:5174](http://localhost:5174) — React web UI with Clerk sign-in, sign-up, and account controls.
- API: [http://localhost:3001](http://localhost:3001) — API status response.
- Health: [http://localhost:3001/health](http://localhost:3001/health) — process health only; it does not check Clerk or Neon.

Keep this terminal open. Press `Ctrl+C` to stop both servers. You can also start them in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

The API reads `PORT` and `WEB_ORIGINS` from the root `.env`, defaulting to `3001` and `http://localhost:5174`. The web server uses port `5174` and fails if that port is occupied.

### Web authentication (Clerk)

Set `VITE_CLERK_PUBLISHABLE_KEY` in `apps/web/.env` to your application's publishable key from the [Clerk Dashboard](https://dashboard.clerk.com/), then restart Vite. Only the publishable key belongs in the browser; keep Clerk secret keys on the server.

The header opens Clerk sign-in and sign-up dialogs. After signing in, it displays the user menu for profile management and sign-out. Clerk manages the session across page reloads. Available login methods follow your Clerk application settings.

To verify locally, open the web app, create a test account or sign in, confirm the welcome message and profile menu, reload, then sign out through the profile menu. Also check the dialogs at mobile screen widths.

The API verifies Clerk session tokens as described below. Signup synchronization is implemented through the webhook below; mobile authentication remains unimplemented; frontend visibility controls do not authorize API access.

Reference: [Clerk React quickstart](https://clerk.com/docs/react/getting-started/quickstart).

### Backend authentication (Clerk)

Use `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the same Clerk application as the web publishable key. Keep them in the repository-root `.env`. Set `CLERK_AUTHORIZED_PARTIES` to comma-separated frontend origins (default: `WEB_ORIGINS`, or `http://localhost:5174`). Origins must not include paths or trailing slashes. Empty keys or origin lists fail at startup. Existing environment values are preserved.

- `GET /` and `GET /health` are public.
- `GET /api/users/me` requires a verified Clerk user session and returns `{ "clerkUserId": "user_..." }`. This ID is not the database user UUID.
- Missing, expired, forged, or disallowed-origin session tokens receive JSON `401` responses. The endpoint does not redirect to a login page or return token contents.
- Clerk middleware processes `/api` routes. Add `requireSession` from `apps/api/src/middleware/auth.ts` to each future protected route; the middleware alone does not restrict access.

For requests from the web app (a different origin), obtain a fresh token through Clerk's `useAuth()` and send it as a bearer token:

```tsx
const { getToken } = useAuth(); // import from '@clerk/react'; call inside a component

async function loadCurrentUser() {
  const token = await getToken();
  if (!token) throw new Error('Sign in first.');
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}
```

The web API client is still a placeholder; this example shows how future features should call protected routes. No users are created in Postgres by this endpoint. Signup webhooks create the database mapping as described below; ownership/role checks and automatic first-request provisioning remain separate work.

Run `npm run test -w @radar/api` for authentication regression tests. They use generated signing keys with the real Clerk verifier and a temporary local HTTP server, without real accounts or database access. Real Clerk login and key matching still need an end-to-end check.

Reference: [Clerk Express quickstart](https://clerk.com/docs/expressjs/getting-started/quickstart) and [Clerk middleware options](https://clerk.com/docs/reference/express/clerk-middleware).

### Clerk signup webhook

`POST /webhooks/clerk` verifies Clerk/Svix signatures against the raw request body and inserts a row for `user.created`. This route does not require a user session. It is implemented in `apps/api/src/webhooks/clerk/` and `apps/api/src/modules/users/users.repository.ts`.

Activation:

1. Ensure the initial database migration has been applied to your intended development database. Run `npm run db:migrate` only after confirming that target.
2. Start the API with `npm run dev:api`. For local development, expose port 3001 through a public HTTPS tunnel such as ngrok (`ngrok http 3001`, after installing/configuring ngrok).
3. In Clerk Dashboard → Webhooks, add `https://YOUR-PUBLIC-API-HOST/webhooks/clerk` and subscribe to **user.created** only.
4. Copy that endpoint's signing secret into the repository-root `.env` as `CLERK_WEBHOOK_SIGNING_SECRET=whsec_...`, then restart the API. This is a different value from `CLERK_SECRET_KEY`. Without it the endpoint returns `503`; the rest of the API can still run.
5. Send a `user.created` test event from Clerk, check delivery status, and verify the inserted row. Dashboard test events can create fixture users in the configured database, so use the development instance/database. For a real signup, compare Clerk's user ID to `users.clerk_user_id`.

Primary email is selected by `primary_email_address_id`; configure Clerk signup to require an email. Missing first/last names become empty strings, since the current schema does not allow nulls. Missing primary emails or values exceeding column lengths return `422`; fix the profile/event and replay delivery rather than silently dropping the user.

UUIDs and timestamps use database defaults. Inserts use `ON CONFLICT (clerk_user_id) DO NOTHING`, so repeated/concurrent deliveries do not create duplicate users or overwrite an existing profile. An email conflict with a different Clerk user is an error requiring review; identities are never merged by email.

Valid writes and duplicates return `200`; invalid signatures return `400`; database failures return `500` so delivery can retry. Other signed event types return `200` with `status: ignored`. User profile updates and deletions are not synchronized. Webhook delivery can lag behind signup; existing users are not automatically backfilled.

`npm run test -w @radar/api` includes signed webhook tests using generated secrets and an in-memory persistence substitute. These verify signature handling, field mapping, repeated delivery, and failed-write responses; they do not perform live Postgres writes or configure Clerk delivery.

Reference: [Clerk webhook setup](https://clerk.com/docs/guides/development/webhooks/syncing).

### 4. Start the mobile app (optional)

In another terminal:

```bash
npm run dev:mobile
```

Use Expo's terminal instructions to open a compatible Expo Go client or a configured simulator. Press `i` for an installed iOS Simulator or `a` for a configured Android emulator. This scaffold targets Expo SDK 55; use a client compatible with that SDK. Native simulators require their platform development tools.

For a physical device, keep it on the same network as the development computer. When API integration is implemented, set `EXPO_PUBLIC_API_URL` to `http://YOUR_COMPUTER_LAN_IP:3001` instead of `localhost`. Mobile currently displays a placeholder screen and makes no API calls.

### iPhone QR troubleshooting

Install Expo Go, then scan the terminal QR code with the regular iPhone **Camera** app and tap the Expo Go banner. If the QR scanner says “No usable data found,” use the Camera app rather than Control Center's Code Scanner and ensure Expo Go is installed.

To explicitly generate an Expo Go link, stop the mobile server with `Ctrl+C` and restart from the repository root:

```bash
npm run dev -w @radar/mobile -- --go
```

A normal Expo Go LAN link starts with `exp://`. A development-build link requires a matching installed development app. Keep the phone and computer on the same Wi-Fi network. If Expo Go opens but cannot connect, investigate network access; a scan-recognition error alone does not establish a network problem.

This project uses SDK 55. If Expo Go reports an incompatible SDK, record its exact message before selecting an SDK upgrade or a compatible development build; changing the QR connection mode does not fix SDK compatibility.

Reference: [Expo startup instructions](https://docs.expo.dev/get-started/start-developing/) and [Expo CLI launch targets](https://docs.expo.dev/more/expo-cli/).

### 5. Check and build

```bash
npm run check
```

This type-checks the runnable applications and shared database package (including Drizzle configuration), and builds the web app. It does not exercise Clerk, Neon, or product features.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start API and web with development watchers |
| `npm run dev:web` | Start Vite only |
| `npm run dev:api` | Start Express with restart-on-change |
| `npm run dev:mobile` | Start Expo / Metro |
| `npm run start:api` | Start Express without a watcher using tsx |
| `npm run typecheck` | Type-check workspaces with a typecheck script |
| `npm run build` | Build the web app into `apps/web/dist` |
| `npm run preview -w @radar/web` | Preview the built web app locally |

Ingestion remains a placeholder without a runnable command. Database seeding is available below.


## Database setup and usage

The backend uses PostgreSQL hosted on Neon, Drizzle ORM with the Neon HTTP driver,
and Drizzle Kit for versioned SQL migrations. The server-only `@radar/database`
workspace is shared infrastructure for the API and future ingestion service.

### Environment

Set `DATABASE_URL` in the repository-root `.env` or inject it through your hosting
platform. Existing environment values take precedence over `.env` values. For example:

```dotenv
DATABASE_URL="postgresql://..."
```

The actual `.env` is ignored by Git and must not be committed. Never put the database
URL in `VITE_` or `EXPO_PUBLIC_` variables. API startup and Drizzle commands fail with
a clear error if `DATABASE_URL` is missing. Initializing the HTTP client does not
execute a query; `/health` remains process-only and does not verify Neon connectivity.

### Files

```text
packages/database/
  src/index.ts           Public db and schema exports
  src/client.ts          Reusable Neon HTTP + Drizzle db instance
  src/env.ts             Root .env loading and DATABASE_URL validation
  src/schema/index.ts    Schema and relation exports
  src/schema/*.ts        V1 tables, inferred types, and relations.ts
  drizzle.config.ts      PostgreSQL schema and migration configuration
  drizzle/               Generated SQL migrations and Drizzle metadata
```

Use the shared instance from backend code:

```ts
import { db, opportunities } from '@radar/database';

const rows = await db.select().from(opportunities).limit(20);
// Relations are registered, including optional compensation and junction rows.
const results = await db.query.opportunities.findMany({
  with: { compensation: true, categories: { with: { category: true } } },
  limit: 20,
});
```

The schema can also be imported without initializing a connection via
`@radar/database/schema`. Runtime TypeScript is loaded with the project's existing
`tsx` setup. Numeric amounts and coordinates retain Drizzle's default string
representation to preserve decimal precision. `updated_at` defaults on insert;
callers must explicitly set it when updating records.

### Commands and migration workflow

Run from the repository root; scripts delegate to the database workspace:

| Command | Purpose |
| --- | --- |
| `npm run db:generate` | Generate SQL migrations from the Drizzle schema; does not change Neon |
| `npm run db:migrate` | Apply pending migrations to the database identified by `DATABASE_URL` |
| `npm run db:studio` | Open Drizzle Studio to inspect database data |
| `npm run db:seed` | Insert reference data and labeled development fixtures |
| `npm run db:seed -- --reference-only` | Insert only categories, fields, and education levels |

1. Modify the tables under `packages/database/src/schema/`.
2. Run `npm run db:generate`.
3. Review the generated SQL, including constraints and deletion behavior.
4. Commit the schema and generated migration files, including metadata.
5. Verify that `DATABASE_URL` targets the intended development database, then run
   `npm run db:migrate`.

Use reviewed migrations for normal application changes rather than manually editing
the Neon schema. The initial migration is included; generating it does not apply it.
Production migrations require a separate deployment decision.

### Seed data

After migrating, run `npm run db:seed` against your intended development `DATABASE_URL`.
It loads the root `.env`, preserving shell environment overrides, and inserts 6 categories,
5 fields, 3 education levels, 3 demo organizations, 1 Columbus location and 6 fictional
opportunities with category/field/education links, 3 location links and 5 compensation rows.
Fixtures cover remote/hybrid/onsite work, paid/unpaid/unknown compensation, future/past/no
deadline, and active/closed status. Titles use `[DEMO]`, slugs use `demo-`, source name is
`development-seed`, and application URLs use the non-resolving `example.invalid` domain.

The inserts run in one transaction and preserve existing rows on conflict. Reruns do not
duplicate fixtures or refresh existing deadlines; initial deadlines are relative to the
first seed run. Users and bookmarks are not seeded: create users through Clerk.
`npm run db:seed -- --reference-only` excludes all demo fixtures. The default seed refuses
to run with `NODE_ENV=production`; always check the target URL because that flag alone
cannot identify a production database.

### V1 schema

- `users`: internal UUIDs with unique Clerk IDs and emails.
- `organizations`: sponsors with unique slugs; one organization can have many
  `opportunities`. Deleting a referenced organization is blocked, not cascaded.
- `opportunities`: discovery content, URLs, deadlines, status, and provenance.
  The `(source_name, external_id)` pair is unique only when both values are non-null.
- `opportunity_compensation`: optional compensation details, with at most one row
  per opportunity. Compensation is not duplicated on `opportunities`.
- `categories`, `locations`, `fields`, `education_levels`: lookup data. Education
  levels have a display sort order and no slug.
- `opportunity_categories`, `opportunity_locations`, `opportunity_fields`,
  `opportunity_education_levels`: many-to-many links with composite primary keys.
- `saved_opportunities`: user bookmarks, with a composite user/opportunity key
  preventing duplicate saves.

Deleting an opportunity cascades to its compensation, classification links, and
bookmarks. Deleting a user cascades to their bookmarks. Lookup deletion is blocked
while referenced. Foreign keys enforce relationships; Drizzle relations support
nested queries. UUIDs and required creation timestamps have database defaults;
lookup IDs use `smallserial`. Flexible classifications use varchar rather than enums.
