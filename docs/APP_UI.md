# App UI

The app UI is the chat page end users see for an [agentic app](APPS.md). It lives in `app-ui/` and is a separate single-page app from the operator dashboard, with its own code, its own sign-in, and its own URL: `/apps/{slug}/`. One build serves every app. The page reads the slug from the address bar and loads the app's name, colors, logo, and welcome text from the server when it opens, so changing an app's branding never needs a rebuild.

It talks only to the app gateway (`/v1.0/apps/{slug}/...`, described in [APPS.md](APPS.md#the-app-gateway)) and never to the management API.

## What a user sees

1. **Sign-in.** The app's logo and name, an email and password form, and, when the app allows anonymous use, a "Continue without signing in" button. Which accounts may sign in depends on the app's `authMode`: any user of the tenant for `TenantUsers`, users holding the `AppUser` role on the app for `AppUsers`. An `Anonymous` app with `anonymousEnabled` adds the guest button.
2. **Chat.** A list of the user's conversations on the side, a "New conversation" button, and the conversation itself. Before the first message the page shows the app's welcome text (Markdown). Answers stream in as the agent writes them.
3. **Files.** A panel listing the files the agent wrote in the conversation's [file space](FILE_SPACES.md), with each file's version, size, and last change. Files can be downloaded, and every earlier version is one click away. The list updates while the agent works.

The header has a files toggle, a language picker, a light and dark theme toggle, and sign out.

## URLs and routing

| Path | What it is |
| --- | --- |
| `/apps/{slug}/` | The app: sign-in, or the chat with no conversation selected |
| `/apps/{slug}/c/{conversationId}` | One conversation. Reloading or sharing the link reopens it for the same user |
| `/apps/_ui/...` | Hashed scripts and styles. `_ui` can never be a slug (slugs are 2 to 63 lowercase letters, digits, and hyphens) |
| `/apps/config.js` | Runtime configuration written by the image at start (`window.GARRISON_CONFIG.apiUrl`) |
| `/v1.0/apps/{slug}/...` | The app gateway on the Garrison server's main REST port |

Any other path under `/apps/` returns the app UI's `index.html` (SPA fallback). A path that names no valid slug shows "No app selected", and a slug the server does not know shows "App not found".

## Serving

The dashboard image serves both front ends (AD-020). Its Dockerfile builds `dashboard/` into the web root and `app-ui/` into `/apps/`, so the image is built from the repository root:

```bash
docker build -f dashboard/Dockerfile -t jchristn77/garrison-dashboard:v0.2.0 .
```

`dashboard/Dockerfile.dockerignore` limits the build context to `dashboard/` and `app-ui/`. Compose (`docker/compose.yaml`), `build-dashboard.sh`, `k8s/scripts/publish-images.sh`, and the minikube and k3s deploy scripts already build it this way.

nginx in the image (`dashboard/nginx.conf`) has three locations for the app UI:

- `/apps/config.js`, never cached;
- `/apps/_ui/`, cached for a year (file names carry a content hash);
- `/apps/`, which serves real files and otherwise falls back to `/apps/index.html`.

The gateway needs nothing extra. The image already proxies every `/v1.0/` request to `GARRISON_API_UPSTREAM` (default `http://garrison-server:8700`) with buffering off and hour-long timeouts, which covers `/v1.0/apps/` and its event streams. `GARRISON_API_URL`, when set, is written to both `/config.js` and `/apps/config.js`, so the console and the app UI call the same API origin.

The image's Content-Security-Policy applies to the app UI too: scripts and styles from this origin only, images from this origin and `data:`, API calls to this origin plus `GARRISON_API_URL`. The logo and the favicon are served by the gateway (`/v1.0/apps/{slug}/logo` and `/v1.0/apps/{slug}/favicon`), so they load under that policy. Images in agent answers that point at another site are removed before they render.

### Kubernetes

The supplied ingresses (`k8s/overlays/k3s`, `k8s/overlays/production`, and the Helm chart's `templates/ingress.yaml`) send `/v1.0` to the server and `/` to the dashboard. `/v1.0/apps/` falls under the first and `/apps/` under the second, so apps work without new rules. If you write your own ingress, keep both prefixes, and turn off proxy buffering for `/v1.0` so turn and file events stream.

## How it works

| File | Role |
| --- | --- |
| `src/api/gateway.js` | Creates the JS SDK's `AppGatewayClient` (`@garrison/sdk/gateway`) for the app: same-origin API, the session kept in `sessionStorage`, and the 401 handler. The SDK client covers every gateway route, error codes, and server-sent event streams with resume, backoff, and duplicate dropping |
| `src/hooks/useConversation.js` | Loads a conversation, sends messages, follows running turns |
| `src/hooks/useFiles.js` | The file listing, refreshed on `files.changed` |
| `src/utils/turns.js` | Folds stream events into a turn (text, status, operator detail) |
| `src/utils/branding.js` | Branding colors and typeface to CSS variables, the page title, and the tab icon |
| `src/utils/theme.js` | Light and dark theme |
| `src/utils/location.js` | Slug and conversation from the URL |
| `src/components/` | Screens and controls |
| `src/i18n/` | Locale registry and catalogs |

### Sessions

`POST /v1.0/apps/{slug}/session` returns a `gas_` token, which the page keeps in `sessionStorage` under `garrison.app.session.{slug}`. That makes a session last for one browser tab and one app. Every gateway call sends it as `Authorization: Bearer <token>`. Event streams cannot send headers from a browser, so their URLs carry `?session=<token>`. A 401 from any gateway call drops the token and returns to sign-in with "Your session ended". Sign out calls `DELETE .../session` and forgets the token even if that call fails.

### Streaming and recovery

Sending a message returns the new turn at once. The page then opens `GET .../turns/{runId}/stream` and appends each `AssistantText` event to the answer as it arrives. `turn.status` updates the status and the approval notice ("Waiting for an operator to approve a step" while `awaitingApproval` is true). `turn.completed` closes the stream, and the server's final `answer` replaces the streamed text.

The browser's own EventSource retry keeps the first URL and gives up for good on an error status, so the page handles drops itself. When a stream fails before `turn.completed`, it closes the connection, shows "The connection dropped. Reconnecting", waits (500 ms, doubling up to 15 s, no limit on attempts), and reconnects with `afterSequence` set to the last event it received. The server resumes after that sequence. The page also drops any event whose sequence it has already seen, so a replay never doubles the text. After a second failed attempt it makes one ordinary request, which finds out whether the session ended (a 401 sends the user to sign-in) instead of retrying a dead session forever.

The file stream (`.../files/stream`) reconnects the same way. Its first message after every connect lists every file, so a reconnect catches up by itself.

### Errors

| Situation | What the user sees |
| --- | --- |
| 409 `ConversationBusy` | The agent is still answering the previous message. The text stays in the box |
| 409 `AppRateLimited` | Sending too quickly; wait a minute. The text stays in the box |
| 409 `AppNotDeployed` | The app is not ready yet |
| A failed, cancelled, timed-out, or rejected turn | "This turn did not finish", with any error text the agent streamed |
| Sign-in failures | `InvalidCredentials`, `AppSignInRequired`, `AnonymousDisabled`, `AppAccessDenied` each have their own message |
| No connection | The server could not be reached |

While a turn runs, Send is off and the hint under the box says why. The box stays editable.

### Operator detail

The gateway sends `Thinking`, `ToolCall`, `ToolResult`, `Progress`, and `Warning` events only when the app sets `showOperatorDetail`. When they arrive, each answer gets a collapsed "Agent activity" list under it. Otherwise end users see the answer text and nothing else.

### Downloads

Download asks `POST .../files/download-url` for a short-lived link that needs no credentials, then lets the browser fetch it, so large files go straight to disk. If that request fails for any reason other than a lost session, the page fetches `.../files/content` with the session and saves the bytes instead. The versions dialog downloads any version the same way.

## Theming

Branding comes from `AppInfo` and becomes CSS variables on `<html>`:

| Variable | From | Used for |
| --- | --- | --- |
| `--app-primary` | `primaryColor` | Buttons, the user's messages, the header rule |
| `--app-on-primary` | computed | Text on primary: black or white, whichever contrasts more (always at least 4.5:1) |
| `--app-accent` | `accentColor` | Focus rings, the selected conversation, "New" badges |
| `--app-on-accent` | computed | Text on accent |
| `--app-background` | `backgroundColor` | The page behind the conversation |
| `--app-header` | `headerColor` | The header bar |
| `--app-agent-bubble` | `agentBubbleColor` | The agent's messages (your own use `--app-primary`) |
| `--app-on-background`, `--app-on-header`, `--app-on-agent-bubble` | computed | Text on each of those, black or white, whichever contrasts more |
| `--app-font` | `fontFamily` | The typeface of the whole page |

Primary and accent always get a value: only `#rgb` and `#rrggbb` are accepted, and anything else keeps the built-in teal and amber. The background, header, and agent message variables are set only when the app sets those colors, so a null color keeps the theme's own color in both light and dark mode.

`fontFamily` picks a font stack the browser already has, so no font is downloaded and the Content-Security-Policy needs nothing extra:

| `fontFamily` | Stack |
| --- | --- |
| `System` (default) | The operating system's interface font (the page's default stack) |
| `Sans` | Helvetica Neue, Helvetica, Arial |
| `Serif` | Georgia, Times New Roman |
| `Rounded` | `ui-rounded` (SF Pro Rounded), then Nunito, Varela Round, Arial Rounded MT Bold where installed |
| `Mono` | `ui-monospace`, SF Mono, Cascadia Code, Consolas, Menlo |

The page title becomes the display name, which may contain any characters (up to 128); the app's `name` and `slug` stay lowercase letters, digits, and hyphens because they identify the app and its URL. The logo shows on sign-in and in the header. The browser tab icon is `faviconUrl` from `AppInfo`: the favicon asset, else the logo, else the built-in icon.

Light and dark themes are `data-theme` on `<html>`. With no saved choice the page follows the system setting and keeps following it. The toggle saves an explicit choice in `localStorage` (`garrison.app.theme`). Brand colors stay the same in both themes, and the computed text colors keep them readable.

## Languages

The app UI has the dashboard's locale set: English, German, Japanese, Spanish, French, Italian, Simplified and Traditional Mandarin, and Cantonese, plus the `zz` pseudo-locale (accented, padded, right to left) for layout testing. The language comes from `?lang=`, then the saved choice (`garrison.app.locale`), then the browser. Catalogs are in `src/i18n/locales/`, one file per locale with tooltips under `tips`. To add a locale, add an entry to `src/i18n/localeRegistry.js`, a catalog that mirrors `en.js`, and its import in `src/i18n/resources.js`. The unit tests fail when a catalog misses a key or loses a placeholder. Layout uses logical CSS properties, so right-to-left languages mirror without extra rules.

App content (display name, description, welcome text) is shown as the app owner wrote it and is not translated.

## Accessibility

- Every control has a visible label or an `aria-label`, and every interactive element has a tooltip (`data-tip`, the same tooltip layer as the dashboard) that shows on hover and on keyboard focus.
- A skip link jumps to the message box. Enter sends and Shift+Enter starts a new line.
- The versions dialog traps focus, closes with Escape, and returns focus to the button that opened it.
- New text in the conversation is announced through a polite live region. The approval notice, reconnecting note, and errors use status and alert roles.
- The layout works down to 360 px wide: the conversation list and file panel open over the chat on narrow screens.

## Development

```bash
cd app-ui
npm install
npm run dev            # http://127.0.0.1:3100/apps/{slug}/, proxies /v1.0 to GARRISON_API_URL (default http://127.0.0.1:8700)
npm run lint
npm test               # unit tests (vitest, jsdom)
npm run build          # dist/, served at /apps/
npm run test:e2e       # browser tests (Playwright) against a mock gateway
```

The browser tests run the production build under `vite preview`, which proxies `/v1.0` to `tests/e2e/mockGateway.mjs`. That mock speaks the gateway's JSON and streams real server-sent events with timing, so the tests cover streamed text, a dropped stream that resumes, files that appear mid-turn and download with a matching SHA-256, branding, a tooltip audit, every locale, and an axe WCAG audit in both themes. `playwright.image.config.js` runs the same tests against a running dashboard image to check the nginx side; its header shows the commands.
