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

`-n` preserves any existing local files. The placeholder apps run without Clerk or Neon credentials; populate them when implementing those integrations. Use one `NAME=value` entry per line, with plain URLs and no Markdown formatting. See the complete variable map below.

### 3. Start the web app and API

```bash
npm run dev
```

- Web: [http://localhost:5174](http://localhost:5174) — React placeholder screen.
- API: [http://localhost:3001](http://localhost:3001) — scaffold status response.
- Health: [http://localhost:3001/health](http://localhost:3001/health) — process health only; it does not check Clerk or Neon.

Keep this terminal open. Press `Ctrl+C` to stop both servers. You can also start them in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

The API reads `PORT` and `WEB_ORIGINS` from the root `.env`, defaulting to `3001` and `http://localhost:5174`. The web server uses port `5174` and fails if that port is occupied.

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

This type-checks the runnable applications and builds the web app. It does not exercise Clerk, Neon, or product features.

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

Ingestion, migrations, and seeding remain placeholders and do not have runnable commands yet.
