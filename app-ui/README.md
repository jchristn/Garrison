# Garrison app UI

The chat page end users see for a Garrison [agentic app](../docs/APPS.md): sign-in, conversations with streamed answers, and a panel for the files the agent writes. It is a React 19 and Vite 6 single-page app, separate from the operator dashboard in code, sign-in, and URL.

One build serves every app at `/apps/{slug}/`. The page reads the slug from the address bar and loads the app's branding from `GET /v1.0/apps/{slug}` each time it opens, so branding changes need no rebuild. It talks only to the app gateway, `/v1.0/apps/{slug}/...`.

The dashboard image ships it: `dashboard/Dockerfile` builds this directory into `/apps/` and nginx serves it there with an SPA fallback. Build that image from the repository root:

```bash
docker build -f dashboard/Dockerfile -t jchristn77/garrison-dashboard:v0.2.0 .
```

## Commands

```bash
npm install
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
| `src/api/` | `client.js` (every gateway route, the session, errors) and `stream.js` (server-sent events that reconnect and resume) |
| `src/hooks/` | `useConversation.js` (turns and streaming) and `useFiles.js` (file listing with live refresh) |
| `src/components/` | Sign-in, chat, conversation list, file panel, versions dialog, tooltips |
| `src/utils/` | Branding colors, theme, URL parsing, turn folding, Markdown, downloads, storage |
| `src/i18n/` | Locale registry and catalogs for the dashboard's nine locales plus the `zz` pseudo-locale |
| `src/tests/` | Unit tests |
| `tests/e2e/` | Browser tests and the mock gateway |
| `public/config.js` | Runtime configuration; the image rewrites it from `GARRISON_API_URL` |

[docs/APP_UI.md](../docs/APP_UI.md) covers routing, serving, sessions, stream recovery, theming, languages, and accessibility in detail.
