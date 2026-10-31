# Agentic apps

An agentic app is a group of agents that work together behind one chat UI. One member, the entry agent, talks to people; it can call other members, and they can call each other along the app's edges. Each app has its own URL at `/apps/{slug}/`, its own branding, and its own sign-in, separate from the operator dashboard.

```
          end users
              |
     /apps/research/  (app UI)
              |
  /v1.0/apps/research/...  (app gateway, app sessions)
              |
        orchestrator  (entry agent)
         /         \
   researcher     writer
```

## Defining an app

| Field | Meaning |
|---|---|
| `name` | Unique in the tenant: 1 to 64 lowercase letters, digits, and hyphens |
| `slug` | The URL name, unique across the cluster (409 `AppSlugTaken`). Default: the name |
| `entryAgentId` | The member that talks to end users |
| `members` | The agents in the app (`agentId`, optional `role`). Agents may be given by name |
| `edges` | Calls members may make (`callerAgentId`, `calleeAgentId`, `fanOutAllowed`) |
| `environments` | The entry deployment per environment (`environment`, optional `deploymentId`). Without a `deploymentId`, or when that deployment is inactive, the app uses the entry agent's first active deployment in that environment by name |
| `liveEnvironment` | The environment the app UI uses. Default `dev` |
| `authMode`, `anonymousEnabled` | Who may use the app UI (see [Sign-in](#sign-in)) |
| `showOperatorDetail` | Whether end users see tool calls and thinking. Default false |
| `displayName`, `logoAssetId`, `primaryColor`, `accentColor`, `backgroundColor`, `headerColor`, `agentBubbleColor`, `conversationListColor`, `composerColor`, `filesColor`, `fontFamily`, `faviconAssetId`, `welcomeText` | Branding (see [Branding](#branding)) |

The control plane checks that the entry agent is a member, edges connect members, every member is reachable from the entry agent, and the edges have no cycle. An agent that belongs to an app cannot be deleted (409 `AgentInUse`); remove it from the app first.

### Branding

| Field | What it changes |
|---|---|
| `displayName` | The name in the header, on the sign-in page, and in the browser tab title. Any characters, up to 128, so "Research Desk" or "Équipe R&D" work. Null shows `name`. `name` and `slug` stay restricted to lowercase letters, digits, and hyphens because they identify the app and name its URL |
| `logoAssetId` | The logo on the sign-in page and in the header: the first image of an agent asset's current version |
| `primaryColor` | Buttons, the header rule, and your own messages |
| `accentColor` | Focus rings, the selected conversation, "New" badges, the busy indicator |
| `backgroundColor` | The page and the area behind the conversation. Null keeps the theme's background |
| `headerColor` | The top bar. Null keeps the theme's surface color |
| `agentBubbleColor` | The agent's messages. Null keeps the theme's bubble color |
| `conversationListColor` | The conversation list beside the chat. Null keeps the theme's surface color |
| `composerColor` | The message input area under the conversation. Null keeps the theme's surface color |
| `filesColor` | The conversation's file list. Null keeps the theme's surface color |
| `fontFamily` | The typeface: `System` (default, the operating system's interface font), `Sans`, `Serif`, `Rounded`, or `Mono`. Each uses fonts browsers already have, so nothing is downloaded |
| `faviconAssetId` | An image asset shown as the browser tab icon. Null uses the logo, or the default icon when there is no logo |
| `welcomeText` | Text shown before the first message |

Colors are `#RRGGBB` or null; anything else is 400 `InvalidColor`. An asset that is not one of the tenant's agent assets is 400 `UnknownAsset`. Text on every branded color is black or white, whichever contrasts more, with a matching muted shade for secondary text, so a dark header or a light bubble stays readable. Branded colors stay the same in light and dark themes; the colors left null follow the theme.

The same app as a manifest document:

```yaml
apiVersion: garrison/v1
kind: AgenticApp
metadata:
  name: research
  description: Research overviews
spec:
  entry: orchestrator
  members:
    - { agent: orchestrator, role: Talks to people and plans the work }
    - { agent: researcher }
    - { agent: writer }
  edges:
    - { from: orchestrator, to: researcher }
    - { from: researcher, to: writer }
  environments:
    - { environment: prod, deployment: orchestrator-prod }
  liveEnvironment: prod
  authMode: AppUsers
  branding:
    displayName: Research Desk
    logo: research-logo
    primaryColor: "#1F6FEB"
    headerColor: "#0D1117"
    agentBubbleColor: "#EAEEF2"
    conversationListColor: "#F0F3F6"
    composerColor: "#FFFFFF"
    filesColor: "#F0F3F6"
    font: Serif
    favicon: research-icon
    welcomeText: Ask for an overview of any topic.
```

## Delegation from the graph

The edges are the app's delegation policy. `GET .../apps/{id}/delegation` computes, for each member, the allow list (the members it has edges to), the mode (`AllowList`, or `None` for a member that calls nobody), and the maximum depth (the longest path of calls below it). It compares each one with the member's latest published revision and marks the members that differ as drifting.

`POST .../apps/{id}/delegation` writes the graph's policy into a draft revision of each drifting member. Nothing is published; review the drafts and publish them as usual ([REVISIONS.md](REVISIONS.md)). A member whose open draft already changes its delegation another way is left alone and reported with `skippedReason` `DraftConflict`, so a deliberate manual edit is never overwritten.

## App revisions and promotion

`POST .../apps/{id}/revisions` takes an app revision: it pins every member's latest published revision and copies the edges. Publish it with `POST .../apps/{id}/revisions/{number}/publish`.

`POST .../apps/{id}/promote` promotes a published app revision (default the latest) from one environment to the next, the same way an agent promotion works. Every member's pinned revision goes to every deployment of that member in the target environment, in one transaction, under one promotion record. If any member has no deployment in the target environment, the request fails with `NoTargetDeployments` naming the member, and nothing moves. Rolling the record back restores every pin together. The caller needs Execute on `Promotion` for the target environment.

## Sign-in

| `authMode` | Who may use the app |
|---|---|
| `AppUsers` (default) | Tenant users who hold the built-in `AppUser` role on the app. Assign it with resource scope on the app identifier |
| `TenantUsers` | Any active user of the app's tenant |
| `Anonymous` | Anyone with the URL, but only when `anonymousEnabled` is also true. Signed-in users still work |

The app UI starts a session with `POST /v1.0/apps/{slug}/session`: an email and password, a management bearer token in the `Authorization` header, or nothing for an anonymous session. The answer carries a session token (prefix `gas_`). The token:

- only works on `/v1.0/apps/{slug}/` for that app; the management API refuses it with 401;
- reaches only the conversations its owner started (a user, or the anonymous session itself); anything else answers 404;
- ends after `Apps.SessionMinutes` (default 480) for users and `Apps.AnonymousSessionMinutes` (default 60) for anonymous sessions, on sign-out, or as soon as the user loses access;
- is stored only as a SHA-256 hash.

One session may send `Apps.MessagesPerMinute` messages a minute (default 30); more answer 409 `AppRateLimited`.

Runs started through an app run as the app, with the end user recorded as the caller. The end user gets no management permissions through them, and the entry agent's delegation policy (derived from the graph) bounds what the run may call.

## The app gateway

| Method and path | Result |
|---|---|
| `GET /v1.0/apps/{slug}` | `AppInfo`: display name, description, welcome text, colors, `fontFamily`, logo URL, favicon URL, sign-in mode, whether anonymous use is allowed |
| `GET /v1.0/apps/{slug}/logo` | The logo image |
| `GET /v1.0/apps/{slug}/favicon` | The browser tab icon: the favicon asset, else the logo; 404 when the app has neither. Needs no credentials |
| `POST /v1.0/apps/{slug}/session` | 201 `AppSessionResponse` (`token`, `expiresUtc`, `principalName`, `anonymous`); 401 `InvalidCredentials`, `AppSignInRequired`, `AnonymousDisabled`; 403 `AppAccessDenied` |
| `DELETE /v1.0/apps/{slug}/session` | 204, signs out |
| `GET /v1.0/apps/{slug}/conversations` | The owner's conversations in the app |
| `POST /v1.0/apps/{slug}/conversations` | `{message}` starts a conversation on the live environment's entry deployment: 201 `{conversationId, turn}`; 409 `AppNotDeployed` without one |
| `GET /v1.0/apps/{slug}/conversations/{id}` | The conversation with its turns (message, status, answer, error, `awaitingApproval`) |
| `PUT /v1.0/apps/{slug}/conversations/{id}` | `{title}` renames the conversation: 200 `AppConversationView` without turns. The title's first line is kept, trimmed, at most 200 characters; blank is 400 |
| `DELETE /v1.0/apps/{slug}/conversations/{id}` | Deletes the conversation: 204; 409 `ConversationBusy` while a turn is still running. Its runs are kept and a `ConversationDeleted` audit event is written |
| `POST /v1.0/apps/{slug}/conversations/{id}/messages` | `{message}` sends the next turn: 201 `AppTurnView`; 409 `ConversationBusy` while the previous turn runs |
| `GET /v1.0/apps/{slug}/conversations/{id}/turns/{runId}/stream` | Server-sent events: `turn.event` (with the event sequence as its id), `turn.status`, `turn.completed`. Resumes after `Last-Event-ID` |
| `GET /v1.0/apps/{slug}/conversations/{id}/files` and `/files/content`, `/files/versions`, `POST /files/download-url` | The conversation's file space, as in [FILE_SPACES.md](FILE_SPACES.md) |
| `GET /v1.0/apps/{slug}/conversations/{id}/files/stream` | Server-sent `files.changed` events |

Send the session token as `Authorization: Bearer gas_...`. Event streams also accept `?session=gas_...`, because a browser `EventSource` cannot set headers.

End users see the answer, results, errors, and lifecycle events. Thinking, tool calls, progress, and warnings appear only when the app sets `showOperatorDetail`. Process output never does. With `showOperatorDetail` on, each turn view (from the conversation and turn routes and in `turn.status` events) also carries `telemetry`, an `AppTurnTelemetry` with the served model, timings, tokens, tool calls, and cost; the app chat shows it behind an (i) beside each answer, with tool time summed from the tool call and result times in the activity log. Every message in the app chat has a copy button in its top right corner. It works on http and https and turns into a green check once the text is copied.

```bash
B=http://127.0.0.1:8700/v1.0/apps/research
T=$(curl -s -X POST $B/session -H "Content-Type: application/json" -d '{"email":"reader@example.com","password":"..."}' | jq -r .token)
curl -s -X POST $B/conversations -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{"message":"Give me an overview of decision models."}'
```

## Operator routes

All paths are under `/v1.0/api/tenants/{tenantId}`:

| Method and path | Permission |
|---|---|
| `GET, POST /apps`; `GET, PUT, DELETE /apps/{idOrName}` | Read, Create, Update, Delete on `AgenticApp` |
| `GET /apps/{id}/delegation`; `POST /apps/{id}/delegation` | Read; Update on `AgenticApp` |
| `GET, POST /apps/{id}/revisions`; `GET /apps/{id}/revisions/{idOrNumber}` | Read; Update on `AgenticApp` |
| `POST /apps/{id}/revisions/{idOrNumber}/publish` | Execute on `AgenticApp` |
| `POST /apps/{id}/promote` | Execute on `Promotion` for the target environment |

MCP management tools `garrison_list_apps`, `garrison_get_app`, `garrison_create_app`, and `garrison_update_app` take the same fields ([MCP_API.md](../MCP_API.md)). The app UI itself is described in [APP_UI.md](APP_UI.md).
