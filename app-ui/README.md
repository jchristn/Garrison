# Garrison app UI

The chat page end users see for a Garrison [agentic app](../docs/APPS.md): sign-in, conversations with streamed answers, and a panel for the files the agent writes. It is a React 19 and Vite 6 single-page app, separate from the operator dashboard in code, sign-in, and URL.

Apps are usually built in Garrison Agent Studio and applied from a studio draft; the sign-in screen carries a small "Built with Garrison Agent Studio" link to [usegarrison.ai](https://usegarrison.ai).

One build serves every app at `/apps/{slug}/`. The page reads the slug from the address bar and loads the app's branding from `GET /v1.0/apps/{slug}` each time it opens, so branding changes need no rebuild. It talks only to the app gateway, `/v1.0/apps/{slug}/...`, through the JavaScript SDK's browser entry point `@garrison/sdk/gateway` (`sdk/js/src/gateway.ts`), a `file:../sdk/js` dependency.

The dashboard image ships it: `dashboard/Dockerfile` builds this directory (with `sdk/js` beside it) into `/apps/` and nginx serves it there with an SPA fallback. Build that image from the repository root:

```bash
docker build -f dashboard/Dockerfile -t jchristn77/garrison-dashboard:v0.2.0 .
```

## Commands

```bash
npm install        # postinstall builds ../sdk/js (installing its TypeScript compiler on first use)
npm run build:sdk  # rebuild the SDK after changing sdk/js; npm run build does this first on its own
npm run dev        # http://127.0.0.1:3100/apps/{slug}/ ; proxies /v1.0 to GARRISON_API_URL (default http://127.0.0.1:8700)
npm run lint       # ESLint, zero warnings allowed
npm test           # unit tests (vitest, jsdom)
npm run build      # dist/, laid out for /apps/ (bundles under /apps/_ui/)
npm run test:e2e   # Playwright against vite preview and a mock gateway (tests/e2e/mockGateway.mjs)
```

`npx playwright test --config playwright.image.config.js` runs the browser tests against a running dashboard image instead; the config file's header has the commands.

## Layout

| Path | Contents |
| --- | --- |
| `src/api/` | `gateway.js`: creates the SDK's `AppGatewayClient` with the app UI's settings (API origin from `/apps/config.js`, session in `sessionStorage` under `garrison.app.session.{slug}`, `onUnauthorized`) and re-exports the SDK's `openTurnStream` and `openFileStream` (`EventSource` streams that reconnect without limit and resume). The client code itself lives in `sdk/js` |
| `src/hooks/` | `useConversation.js` (turns and streaming) and `useFiles.js` (file listing with live refresh) |
| `src/components/` | Sign-in, chat, conversation list, file panel, versions dialog, tooltips |
| `src/utils/` | Branding colors, theme, URL parsing, turn folding, Markdown, downloads, storage |
| `src/i18n/` | Locale registry and catalogs for the dashboard's nine locales plus the `zz` pseudo-locale |
| `src/tests/` | Unit tests |
| `tests/e2e/` | Browser tests and the mock gateway; `studioApp.spec.js` is the app UI half of the studio end-to-end flow (a two-turn conversation that writes a file, then its download) |
| `scripts/build-sdk.mjs` | Builds `../sdk/js` (postinstall and prebuild), so a fresh checkout, CI, and the dashboard image build have the SDK's `dist/` |
| `public/config.js` | Runtime configuration; the image rewrites it from `GARRISON_API_URL` |

[docs/APP_UI.md](../docs/APP_UI.md) covers routing, serving, sessions, stream recovery, theming, languages, and accessibility in detail.
