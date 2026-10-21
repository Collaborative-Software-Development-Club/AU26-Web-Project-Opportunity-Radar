# Mobile opportunity detail sheet

The mobile discovery screen now opens the detail sheet through a card callback. It still uses the existing fictional feed; search and live discovery integration are separate work.

## Boundaries

- `job-card.tsx` receives `onViewDetails`, `saved`, and `onToggleSaved`. It does not fetch, navigate, or understand API identifiers.
- `OpportunityDetailSheet` owns modal presentation, related selection/back navigation, scrolling, and rendering. It consumes a `DetailSource` and externally owned saved actions.
- `DetailSource` loads `OpportunityView` records and related records. It receives an `AbortSignal`; late results are ignored after selection changes, retry, or dismissal.
- `createApiDetailSource` uses the shared typed API client. It never imports preview fixtures or substitutes them on errors.
- `discoveryPreviewSource` adapts the legacy card data into explicit `preview:<category>:<number>` identities. It never calls the API. Preview saves are held by discovery, so cards and sheet agree for the lifetime of that screen.
- `ApiOpportunityDetailSheet` is the live entry point, with Clerk-aware saved IDs and server-confirmed mutations. Its saved state clears on account changes and ignores stale results. Saved load failures offer retry; mutations serialize while pending.

To integrate the eventual live feed, pass the real UUID to `ApiOpportunityDetailSheet`, or hoist its saved actions to a common provider and pass `createApiDetailSource(api)` to `OpportunityDetailSheet`. Do not map a numeric preview ID to a guessed UUID. No sheet layout changes are required. A live detail route also exists at `/opportunities/:id` (`opportunityradar://opportunities/<uuid>`).

## Backend assumptions

All paths are relative to `EXPO_PUBLIC_API_URL`:

| Purpose | Request |
| --- | --- |
| Detail | `GET /api/opportunities/:id` |
| More from organization | `GET /api/opportunities?organizationId=…&status=active&limit=20` |
| Similar | `GET /api/opportunities?category=…&status=active&limit=20` |
| Saved IDs | `GET /api/saved/ids` |
| Save / unsave | `POST /api/saved/:id` / `DELETE /api/saved/:id` |

Related results exclude the current item; similar results also exclude the current organization. They show one initial card, with “See more” expanding the fetched batch (up to 20 API results, not a complete recommendation feed). Related failures do not prevent viewing the main record.

At inspection, `origin/prod` was `8beb892` (September 30, 2026). Detail reads exist there, but category filtering and `/api/saved` are missing. Use the current main API for the complete feature. This is a branch assessment, not verification of the deployed server.

Application links require an active status, a non-passed deadline, and HTTP(S). Source links remain available for closed opportunities. Currency comes from the compensation contract. Missing event dates, attendance, admission price, and organization subtitles are not invented; those extra Figma fields exist only in the explicit visual fixture.

## Design and verification

Reference: https://www.figma.com/design/j6O1sWIBGCbvaDWFYkk6CV/Mobile-UI?node-id=85-18

The sheet uses the existing Lora font package and teal palette, cream sections, rounded buttons/cards, and the six downloaded Figma SVGs under `apps/mobile/assets/opportunity-detail`. Expo Image renders the original local SVGs. The handle is an accessible close button and supports downward dismissal; backdrop, accessibility escape, and Android back also dismiss. Body scrolling accommodates long text and large font sizes.

`/detail-preview` is development-only and renders the supplied Figma content without API requests. It retains a preview notice and local-only save behavior. Start with `npm run dev -w @radar/mobile -- --web` for a browser check; production redirects this preview route to `/`. NativeWind uses class-based dark mode so its web stylesheet observer can initialize without throwing a color-scheme error.

Checks: `npm run typecheck -w @radar/mobile` and `npm test -w @radar/mobile`. Tests cover API routing/auth/signal propagation, error isolation, related filters, preview identity separation, application availability, and compensation formatting. Native simulator/device interaction and authenticated live save checks should also be completed before release.
