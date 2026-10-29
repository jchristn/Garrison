# Garrison REST API

This is the reference for Garrison's HTTP surface on the control plane: authentication, tenancy, the shared request and response conventions, every endpoint grouped by resource, the worker node protocol, the server-sent event stream, and the models those endpoints exchange. The live OpenAPI document at `GET /openapi.json` is generated from the same route registrations and is what the dashboard's API Explorer reads, and `GET /swagger` serves a browsable Swagger UI for it; this file adds the permission each route needs, examples, and the parts OpenAPI does not describe well, such as streaming.

The server listens on port 8700 by default. MCP is on its own port (8701, see `MCP_API.md`), A2A shares the REST port (see `A2A_API.md`), and the WebSocket live-update channel is at `/v1.0/ws` (see `WEBSOCKETS_API.md`). Examples use `http://127.0.0.1:8700`, the default tenant `default`, and `$TOKEN` for a session token.

## Conventions

JSON bodies use camelCase property names. Enumerations travel as their string names (`"status": "Succeeded"`), timestamps are ISO 8601 in UTC, and properties whose value is null are omitted from responses. Identifiers are prefixed, K-sortable strings such as `agt_mv1pdwem_PWOwUcelVy0GXphYF11`; the prefix tells you the type (`ten_` tenant, `usr_` user, `crd_` credential, `ses_` session, `rol_` role, `prm_` permission, `agt_` agent, `dep_` deployment, `hrn_` harness profile, `tpl_` prompt template, `mcp_` MCP server, `sec_` secret, `wsp_` workspace template, `ast_` artifact store, `mpr_` model price, `uqt_` usage quota, `ppl_` pipeline, `pst_` pipeline stage, `plr_` pipeline run, `prs_` pipeline run stage, `prv_` pipeline stage review, `run_` run, `rev_` run event, `nod_` node, `npl_` node pool, `req_` request history entry, `aud_` audit record).

Deleting one resource (`DELETE` on a path that ends in an identifier) answers 204 No Content with an empty body, for identity, runtime, and configuration resources alike, and 404 when the resource does not exist. Deletes that take a filter instead of an identifier (runs, audit records, request history) answer 200 with a `DeleteCountResponse`, because the count is the result. `DELETE /v1.0/token` is the one other exception: it answers 200 with `{"valid": false}` (see below).

Tenant-owned resources live under `/v1.0/api/tenants/{tenantId}/...`. The tenant in the path must be the tenant your credentials belong to; a mismatched tenant answers 404 rather than 403 so that the existence of another tenant's resources does not leak. System administrators can address any tenant. Platform resources (tenants, nodes, node pools, settings, request history) sit directly under `/v1.0/api`.

### Enumeration

List endpoints accept the same query parameters and return the same envelope.

| Query parameter | Meaning |
|---|---|
| `maxResults` | Page size, 1 to 1000, default 25 |
| `skip` | Records to skip, default 0 |
| `ordering` | `CreatedDescending` (default), `CreatedAscending`, `NameAscending`, `NameDescending` |
| `search` | Case-insensitive substring of the name, for named resources |
| `activeOnly` | `true` to return only active records |
| `includeBuiltIn` | `false` to hide built-in records (harness profiles, prompt templates, roles, permissions); default `true` |

```json
{
  "success": true,
  "maxResults": 25,
  "skip": 0,
  "totalRecords": 1,
  "recordsRemaining": 0,
  "endOfResults": true,
  "timestampUtc": "2026-10-10T01:16:07.778368Z",
  "objects": [ { "id": "nod_mv1pckac_m5dsSyMlcQZQludIyur", "name": "docs-worker-0", "status": "Ready" } ]
}
```

Request history and audit use `pageNumber` and `pageSize` instead, because their pages also carry summary counts. Runs accept extra filters, listed with the run endpoints.

### Warnings

Some numeric fields have a documented range and are clamped into it rather than rejected, which keeps older clients working: `maxAttempts: 99` on a deployment is stored as 10. Create and update responses then say so in a `warnings` array (I-08). Each entry has `field` (the field name as this API spells it), `code` (`ValueClamped`), `given` and `stored` (the values as text), and a `message`:

```json
{
  "id": "dep_mv4m...",
  "name": "helper-default",
  "maxAttempts": 10,
  "warnings": [
    { "field": "maxAttempts", "code": "ValueClamped", "given": "99", "stored": "10", "message": "maxAttempts 99 is outside the allowed range 1 to 10; 10 was stored." }
  ]
}
```

The array is omitted when nothing was clamped and is never stored, so reads do not carry it, and it is ignored if a client sends it back. Clamped fields: deployments `maxConcurrentRuns` (0 to 100000), `maxAssistantChars` (0 to 100000000), `noProgressSeconds` (0 to 86400), `maxAttempts` (1 to 10), `weight` (0 to 1000), `approvalTimeoutSeconds` (10 to 3600); agents `delegationMaxDepth` (0 to 10), `registrationTtlSeconds` (0 to 31536000); harness profiles `defaultTimeoutSeconds` (5 to 86400), `killGraceSeconds` (0 to 60), `maxOutputBytes` (1024 to 1073741824), `stderrTailBytes` (0 to 1048576); MCP servers `toolTimeoutSeconds` (1 to 3600); workspace templates `gitDepth` (0 to 10000). The MCP management tools that create or update agents and deployments return the same `warnings` in their results, and manifest apply items report them too (`ManifestApplyItem.warnings`).

### Errors

Every error has the same shape. `error` names the broad category (`NotFound`, `Unauthorized`, `Conflict`, and so on), `code` is a stable identifier that clients and the dashboard switch on, and `message` is for people.

```json
{
  "error": "NotFound",
  "code": "NotFound",
  "message": "Run run_missing not found.",
  "requestId": "9b62c109435b4a859134816f90e15cda"
}
```

Authorization failures add `requiredPermission`, `resourceType`, and `tenantId`. Validation failures (400 `ValidationFailed`) that concern particular fields add three maps keyed by the same field path: `fields` and `errors` (the same human message per field; `errors` is the name the settings contract uses, `fields` stays for older clients) and `fieldCodes`, a stable machine code per field so a client can show its own translated text.

```json
{
  "error": "BadRequest",
  "code": "ValidationFailed",
  "message": "One or more settings are invalid. Nothing was saved.",
  "fields":     { "Audit.RetentionDays": "Must be between 1 and 3650." },
  "errors":     { "Audit.RetentionDays": "Must be between 1 and 3650." },
  "fieldCodes": { "Audit.RetentionDays": "OutOfRange" }
}
```

| Field code | Meaning |
|---|---|
| `OutOfRange` | A number is outside the allowed range (the settings metadata carries `minimum` and `maximum`) |
| `NotAnInteger`, `NotABoolean` | The value has the wrong type |
| `NotAllowedValue` | The value is not one of `allowedValues` |
| `TooLong` | The value is longer than allowed |
| `UnknownSetting`, `PathRequired` | The setting path does not exist or is missing |
| `OverriddenByEnvironment`, `SettingsFileReadOnly` | The setting cannot be changed through the API on this deployment |
| `ParameterNotAllowed`, `ParameterInvalid` | A run parameter the deployment does not allow, or a value its rule rejects |
| `ExpiryInPast` | A secret `expiresUtc` that has already passed |
| `InputRequired` | A run or pipeline start without input, or with an input that is empty or only whitespace |
| `SecretUseDenied` | The configuration would send a secret's value somewhere and the caller lacks `Execute` on that `Secret` (see [Using secrets](#using-secrets)) |
| `GrantCeiling` | An assignment, role permission, credential, or password or email change would give the caller, or someone the caller controls, a permission the caller does not hold, or would act for a tenant administrator |
| `ReservedRoleName` | A tenant role named like a built-in role, in any letter case |
| `InputNotJson`, `InputSchemaViolation` | The agent has an input schema and the input is not JSON, or does not match it (the field key is `input` or `input.` plus the path, such as `input.topic`) |
| `InvalidJsonSchema` | An agent's `inputSchemaJson` or `outputSchemaJson` is not a usable JSON Schema |
| `InvalidFormat` | A transcript `format` other than `markdown` or `json` |
| `UnknownKind`, `InvalidSelector` | A manifest export `kinds` value that cannot be exported, or a `resources` entry that is not `Kind/name` |
| `Invalid` | Any other field problem; read the message |

Query string values are decoded the way browsers and HTTP clients encode them: percent escapes are decoded and a `+` is a space, so send a literal plus sign as `%2B`. A model name such as `gpt-oss:20b` works raw or encoded (`gpt-oss%3A20b`). Timestamps keep a raw `+` as a time zone offset sign.

| Status | When |
|---|---|
| 400 | Malformed JSON (`InvalidJson`, `InvalidBody`), invalid input (`ValidationFailed`, `BadRequest`), template errors (`TemplateRenderFailed`), unknown references (`ReferenceNotFound`) |
| 401 | Missing or invalid credentials (`AuthenticationRequired`, `InvalidCredentials`) |
| 403 | Authenticated but not permitted (`AuthorizationDenied`); a run token asked to retry a run (`RunTokenRetryNotAllowed`) |
| 413 | The request body is larger than `Rest.MaxRequestBodyBytes` (128 MiB by default): refused before the body is read when Content-Length says so, or as soon as a chunked body passes the limit (`RequestTooLarge`) |
| 404 | The resource does not exist or belongs to another tenant (`NotFound`, `RouteNotFound`). A system administrator who names a tenant that does not exist in a `/tenants/{tenantId}/...` path gets `TenantNotFound`; other callers get `NotFound` for any tenant but their own, so the response does not reveal which tenants exist |
| 409 | The request conflicts with current state. Codes include `NameInUse`, `NameConflict`, `Duplicate`, `Protected`, `BuiltInImmutable`, `InUse`, `RunActive`, `RunFinished`, `RunNotFinished`, `AgentInactive`, `DeploymentInactive`, `NoActiveDeployment` (the agent has no active deployment with a weight above zero), `AgentDeleted` and `DeploymentDeleted` (a retried run's agent or deployment no longer exists), `IdempotencyKeyConflict` (an `Idempotency-Key` reused with different input), `RemoteAgentNotSupported`, `NodeActive`, `NodeHasRuns`, `PoolInUse`, `StaleLease`, `NodeIdentityMismatch`, and the delegation codes `DelegationDisabled`, `DelegationNotAllowed`, `DelegationCycle`, `DelegationDepthExceeded`, `DelegationDenied`, `ParentRunFinished`, `ParentRunNotFound`, and the conversation codes `ConversationBusy` (the conversation's previous turn is unfinished), `ConversationAgentMismatch`, `ConversationDeploymentMismatch`, `ConversationDeploymentUnavailable`, and the pipeline codes `PipelineInUse`, `PipelineInactive`, `PipelineEmpty`, `PipelineRunFinished`, `PipelineRunActive`, `PipelineRunNotRetryable`, `PipelineRunChanged`, `PipelineHistoryPruned`, `PipelineStageRun` (a stage run cannot be retried on its own), `ReferencedByPipeline` (an agent or deployment a pipeline stage uses), `ReviewNotPending`, and `RevisionLimitReached` |
| 429 | Too many authentication attempts from one address (`RateLimited`): token requests, or failed administrator API key, secret key, and signature attempts, beyond `Auth.RateLimitPerMinute` in a minute; a quota refused admission (`QuotaExceeded`); or a run that delegates and waits was refused because waiting could leave no capacity to run its child (`DelegationCapacityExhausted`: the parent's worker already keeps as many waiting runs as it may, `Runs.DelegationChildQueueDepth` waited children are already queued, or the replica has no `Scheduling.MaxSynchronousWaiters` budget available before child admission). `QuotaExceeded` and `DelegationCapacityExhausted` carry `Retry-After` in seconds (`Runs.DelegationRetryAfterSeconds`, default 5, for delegation). Delegating without waiting (`wait: false`) is never refused this way |
| 500 | An unexpected failure (`InternalError`); the server log has the request identifier |
| 503 | The database cannot take the request right now: `DatabaseBusy` (the connection pool is exhausted, or PostgreSQL has no connection slots left) or `DatabaseUnavailable` (the database cannot be reached, is restarting, or is shutting down). Both carry a `Retry-After` header in seconds (`Rest.DatabaseRetryAfterSeconds`, default 2). Retrying is safe for reads and for creations that send an `Idempotency-Key`. `Cancelled` means the server is shutting down and dropped the request |

Every failure answers with this JSON shape, including failures while authenticating the request, checking that the tenant in the path exists, or authorizing it; Garrison never sends an HTML error page.

## Authentication

Every route except health, token issuance, and A2A agent cards requires credentials. Garrison accepts five schemes, and a request may use only one of them.

| Scheme | Headers | Use it for |
|---|---|---|
| Session token | `Authorization: Bearer <token>` or `x-token: <token>` (if both are present they must match) | Dashboards, SDKs, scripts after login |
| Credential keys | `x-access-key` and `x-secret-key` | Server-to-server calls over TLS |
| Signed request | `x-access-key`, `x-date`, `x-nonce`, `x-signature` | Server-to-server calls where the secret should never cross the wire |
| Administrator API key | `x-api-key` (plus optional `x-tenant-id`) | Platform administration and bootstrapping |
| Run token | `Authorization: Bearer <run token>` | Agents delegating to other agents; issued by Garrison to each run |

### Session tokens

`POST /v1.0/token` exchanges a user's email and password (with `tenantId`, which defaults to the Default tenant) or a credential's access and secret keys for an opaque token. The same values can be sent as headers instead of a body: `x-tenant-id`, `x-email`, `x-password`, `x-access-key`, `x-secret-key`.

The examples in this document use the development defaults (`admin@garrison` with password `password`, administrator key `garrisonadmin`), which only a server started with `GARRISON_ALLOW_INSECURE_DEFAULTS=true` accepts. Substitute your own values: Docker Compose keeps them in `docker/.env`, and Kubernetes in the `garrison-secrets` Secret.

Passwords are stored as salted PBKDF2-HMAC-SHA256 hashes (`Auth.PasswordHashIterations`, 600,000 by default). A password stored by an earlier build as unsalted SHA-256 still works and is rehashed on its next successful sign-in, with no change for the client.

```bash
curl -s -X POST http://127.0.0.1:8700/v1.0/token \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"default","email":"admin@garrison","password":"password"}'
```

```json
{
  "token": "mYN7C3k11nw1I53l16XgBVT9VAWQ0-fVuQqVdOM3y4Fc0pRL7AJa3jYAB5iJFwiQp5Uy...",
  "expiresUtc": "2026-10-10T09:16:07.6Z",
  "tenantId": "default",
  "sessionId": "ses_mv1pdwe5_PbsIONqokkSegZfhQXs",
  "principalType": "User"
}
```

Tokens are AES-256 encrypted with a random IV and authenticated with HMAC-SHA256, and each one points at a session row, so `DELETE /v1.0/token` revokes it immediately and disabling the user, credential, or tenant stops it working. The lifetime defaults to 480 minutes (`Auth.TokenLifetimeMinutes`).

### Signed requests

A signed request proves possession of the secret key without sending it. Build the canonical string by joining these seven values with `\n`:

1. the HTTP method in upper case
2. the path without the query string
3. the raw query string without the leading `?` (empty when there is none)
4. the tenant identifier of the credential
5. the `x-date` value (ISO 8601, UTC)
6. the `x-nonce` value (any unique string)
7. the lowercase hex SHA-256 of the request body (of an empty array when there is no body)

`x-signature` is the lowercase hex HMAC-SHA256 of the canonical string keyed with the secret key. The date must be within `Auth.SignedRequestSkewSeconds` (300 by default) of the server clock, and a nonce cannot be reused within the replay window.

```bash
DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ); NONCE=$(uuidgen)
BODYHASH=$(printf '' | shasum -a 256 | cut -d' ' -f1)
CANON=$(printf 'GET\n/v1.0/api/nodes\n\ndefault\n%s\n%s\n%s' "$DATE" "$NONCE" "$BODYHASH")
SIG=$(printf '%s' "$CANON" | openssl dgst -sha256 -hmac "$SECRET_KEY" | sed 's/^.* //')
curl -s http://127.0.0.1:8700/v1.0/api/nodes \
  -H "x-access-key: $ACCESS_KEY" -H "x-date: $DATE" -H "x-nonce: $NONCE" -H "x-signature: $SIG"
```

### Permissions

Each route below lists the permission it needs as an operation on a resource type, for example `Execute on Agent`. Permissions come from roles assigned to users and credentials (see the Roles, Permissions, and Assignments sections and `docs/SECURITY.md`). System administrators bypass these checks; tenant administrators bypass them inside their own tenant, except for platform-only resources (node pools, settings, creating and deleting tenants, and changing nodes), which always need a system administrator. A credential never gets more than its owning user has. A run token can only discover and invoke agents and read, start, and cancel runs, and never more than the person who started the run.

## Endpoints
### Health

#### `GET /v1.0/api/health`

Readiness. Answers 200 with `status` `healthy` when the database answers, its schema is at the version this build needs, and the replica is not shutting down. Otherwise it answers 503 with `status` `degraded` (database unreachable), `migrating` (the schema is behind, for example while another replica applies migrations), `starting` (this replica is still waiting for the startup lock, migrating, or seeding), or `draining` (the replica received SIGTERM and is finishing in-flight work). Use it, or `/v1.0/api/health/ready`, as the readiness probe.

| | |
|---|---|
| Permission | Anonymous |
| Response | `HealthResponse` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/health"
```

#### `GET /v1.0/api/health/ready`

Readiness, the same as `GET /v1.0/api/health`.

| | |
|---|---|
| Permission | Anonymous |
| Response | `HealthResponse` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/health/ready"
```

#### `GET /v1.0/api/health/live`

Liveness. Answers 200 whenever the process is up, including while it waits for another replica's migrations, migrates, seeds (`status` `starting`), or drains (`status` `draining`). It does not touch the database, so a slow migration or a database outage never gets a replica restarted.

The same answer is served on a separate liveness port, `Rest.LivenessPort` (default 8702, `GARRISON_LIVENESS_PORT`), by one dedicated thread that never waits behind the REST listener's request queue, the database pool, or the thread pool. Point liveness probes there (`http://127.0.0.1:8702/v1.0/api/health/live`, as the shipped Kubernetes manifests do), so an overloaded replica sheds traffic through readiness instead of being restarted. Any other path on that port answers 404.

| | |
|---|---|
| Permission | Anonymous |
| Response | `HealthResponse` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8702/v1.0/api/health/live"
```

#### `GET /metrics`

Prometheus metrics in text exposition format, relayed from the metrics listener (port 9464) so that `kubectl port-forward` to the REST port and in-pod requests to `127.0.0.1` work. Not under `/v1.0`, and not recorded in request history. Off by default: answers 404 while `Telemetry.ServeMetricsOnServicePort` is false (the default, because the endpoint needs no authentication and its series carry tenant and agent labels; scrape the metrics listener instead) and 503 (`MetricsUnavailable`) when the Prometheus listener is off or did not answer. Workers serve the same at `GET /metrics` on their health port (8710). See `docs/TELEMETRY.md`.

| | |
|---|---|
| Permission | Anonymous |
| Response | `text/plain; version=0.0.4` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/metrics"
```

### Tokens

#### `POST /v1.0/token`

Issue a session token from user login or credential keys.

| | |
|---|---|
| Permission | Anonymous |
| Request body | `TokenRequest` |
| Response | `TokenResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/token" \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "default", "email": "admin@garrison", "password": "password"}'
```

#### `GET /v1.0/token`

Validate the presented token.

| | |
|---|---|
| Permission | Authenticated; the handler checks permissions (see notes) |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/token" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/token/details`

Describe the authenticated principal.

| | |
|---|---|
| Permission | Authenticated; the handler checks permissions (see notes) |
| Response | `TokenDetailsResponse` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/token/details" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/token/refresh`

Issue a fresh token for the authenticated principal. When called with a session token, that session is revoked, so the old token stops working as soon as the new one is issued.

| | |
|---|---|
| Permission | Authenticated; the handler checks permissions (see notes) |
| Response | `TokenResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/token/refresh" \
  -H "Authorization: Bearer $TOKEN"
```

#### `DELETE /v1.0/token`

Revoke the presented token (logout). The response has the same shape as `GET /v1.0/token`: `{"valid": false}` once the token is revoked. The route returns 200 with that body rather than 204 so that one parser handles both token routes.

| | |
|---|---|
| Permission | Authenticated; the handler checks permissions (see notes) |
| Response | `TokenValidResponse` |
| Success | 200 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/token" \
  -H "Authorization: Bearer $TOKEN"
```

### Tenants

#### `GET /v1.0/api/tenants`

List tenants visible to the caller.

| | |
|---|---|
| Permission | Authenticated; the handler checks permissions (see notes) |
| Response | `EnumerationResult<Tenant>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants`

Create a tenant.

| | |
|---|---|
| Permission | Create on `Tenant` |
| Request body | `TenantRequest` |
| Response | `Tenant` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme", "description": "Acme platform team"}'
```

#### `GET /v1.0/api/tenants/{tenantId}`

Read a tenant.

| | |
|---|---|
| Permission | Read on `Tenant` |
| Response | `Tenant` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}`

Update a tenant.

| | |
|---|---|
| Permission | Update on `Tenant` |
| Request body | `TenantRequest` |
| Response | `Tenant` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "description": "string", "active": false, "requireUntrustedDeployments": true}'
```

`requireUntrustedDeployments` makes every new or updated deployment in the tenant `Untrusted`-only; see [Deployment trust level](#deployment-trust-level-trustlevel).

#### `DELETE /v1.0/api/tenants/{tenantId}`

Delete a tenant and everything it owns.

| | |
|---|---|
| Permission | Delete on `Tenant` |
| Success | 204 (no body) |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default" \
  -H "Authorization: Bearer $TOKEN"
```

### Users

#### `GET /v1.0/api/tenants/{tenantId}/users`

List users.

| | |
|---|---|
| Permission | Read on `User` |
| Response | `EnumerationResult<User>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/users" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/users`

Create a user.

| | |
|---|---|
| Permission | Create on `User` |
| Request body | `UserRequest` |
| Response | `User` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "dev@acme.example", "password": "change-me", "firstName": "Dev", "lastName": "User"}'
```

#### `GET /v1.0/api/tenants/{tenantId}/users/{id}`

Read a user (self or with User Read).

| | |
|---|---|
| Permission | Authenticated; the handler checks permissions (see notes) |
| Response | `User` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/users/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/users/{id}`

Update a user.

| | |
|---|---|
| Permission | Update on `User` |
| Request body | `UserRequest` |
| Response | `User` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/users/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "string", "password": "string", "firstName": "string", "lastName": "string", "isTenantAdmin": false, "isAdmin": false, "active": false}'
```

Only a system administrator may change a system administrator's `password` or `email` (400 `ValidationFailed` on that field otherwise). Only a tenant administrator may set or clear `isTenantAdmin`, or change a tenant administrator's `password` or `email`. Changing another user's `password` or `email` also needs every permission that user has (400 with field code `GrantCeiling` otherwise), since it lets the caller sign in as them. A password change revokes the user's other sessions; a user changing their own password keeps the session they used.

#### `DELETE /v1.0/api/tenants/{tenantId}/users/{id}`

Delete a user with credentials, sessions, and assignments.

| | |
|---|---|
| Permission | Delete on `User` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/users/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/users/{id}/permissions`

Effective permissions of a user (self or with User Admin).

| | |
|---|---|
| Permission | Authenticated; the handler checks permissions (see notes) |
| Response | `EffectivePermissionsResponse` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/users/{id}/permissions" \
  -H "Authorization: Bearer $TOKEN"
```

### Credentials

#### `GET /v1.0/api/tenants/{tenantId}/credentials`

List credentials.

| | |
|---|---|
| Permission | Read on `Credential` |
| Response | `EnumerationResult<Credential>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/credentials" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/credentials`

Create a credential (the secret is returned once).

| | |
|---|---|
| Permission | Create on `Credential` |
| Request body | `CredentialRequest` |
| Response | `CredentialCreateResponse` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/credentials" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "ci key", "userId": "usr_...", "roleName": "AgentInvoker"}'
```

A credential acts with its owner's system administrator flag, so only a system administrator may create one for a system administrator (400 `ValidationFailed` on `userId` otherwise).

#### `GET /v1.0/api/tenants/{tenantId}/credentials/{id}`

Read a credential.

| | |
|---|---|
| Permission | Read on `Credential` |
| Response | `Credential` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/credentials/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/credentials/{id}`

Update a credential.

| | |
|---|---|
| Permission | Update on `Credential` |
| Request body | `CredentialRequest` |
| Response | `Credential` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/credentials/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "userId": "string", "authMode": "DirectHeader", "expiresUtc": "2026-01-01T00:00:00Z", "active": false, "roleName": "string"}'
```

#### `POST /v1.0/api/tenants/{tenantId}/credentials/{id}/rotate`

Rotate a credential secret (the new secret is returned once).

| | |
|---|---|
| Permission | Update on `Credential` |
| Response | `CredentialCreateResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/credentials/{id}/rotate" \
  -H "Authorization: Bearer $TOKEN"
```

Only a system administrator may rotate a credential owned by a system administrator (400 `ValidationFailed` on `id` otherwise).

#### `DELETE /v1.0/api/tenants/{tenantId}/credentials/{id}`

Delete a credential.

| | |
|---|---|
| Permission | Delete on `Credential` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/credentials/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/credentials/{id}/permissions`

Effective permissions of a credential (self or with Credential Admin).

| | |
|---|---|
| Permission | Authenticated; the handler checks permissions (see notes) |
| Response | `EffectivePermissionsResponse` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/credentials/{id}/permissions" \
  -H "Authorization: Bearer $TOKEN"
```

### Roles

#### `GET /v1.0/api/tenants/{tenantId}/roles`

List roles, including built-in roles.

| | |
|---|---|
| Permission | Read on `Role` |
| Response | `EnumerationResult<Role>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/roles" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/roles`

Create a custom role. A name that matches a built-in role in any letter case answers 400 with field code `ReservedRoleName`.

| | |
|---|---|
| Permission | Create on `Role` |
| Request body | `RoleRequest` |
| Response | `Role` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Runner", "description": "Invoke agents and read runs"}'
```

#### `GET /v1.0/api/tenants/{tenantId}/roles/{id}`

Read a role.

| | |
|---|---|
| Permission | Read on `Role` |
| Response | `Role` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/roles/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/roles/{id}`

Update a custom role.

| | |
|---|---|
| Permission | Update on `Role` |
| Request body | `RoleRequest` |
| Response | `Role` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/roles/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "description": "string", "active": false}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/roles/{id}`

Delete a custom role.

| | |
|---|---|
| Permission | Delete on `Role` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/roles/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/roles/{id}/clone`

Clone a role (including built-ins) into a custom role.

| | |
|---|---|
| Permission | Create on `Role` |
| Request body | `RoleRequest` |
| Response | `Role` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/roles/{id}/clone" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "description": "string", "active": false}'
```

#### `GET /v1.0/api/tenants/{tenantId}/role-permissions`

List role-permission mappings (filter with roleId).

| | |
|---|---|
| Permission | Read on `Role` |
| Response | `EnumerationResult<RolePermissionMap>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/role-permissions" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/role-permissions`

Map a permission to a custom role.

| | |
|---|---|
| Permission | Update on `Role` |
| Request body | `RolePermissionRequest` |
| Response | `RolePermissionMap` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/role-permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleId": "rol_...", "permissionId": "prm_..."}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/role-permissions/{id}`

Remove a role-permission mapping.

| | |
|---|---|
| Permission | Update on `Role` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/role-permissions/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Permissions

#### `GET /v1.0/api/tenants/{tenantId}/permissions`

List permissions, including built-ins.

| | |
|---|---|
| Permission | Read on `Permission` |
| Response | `EnumerationResult<Permission>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/permissions" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/permissions`

Create a permission.

| | |
|---|---|
| Permission | Create on `Permission` |
| Request body | `PermissionRequest` |
| Response | `Permission` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Invoke agents", "permissionType": "Permit", "resourceTypes": ["Agent"], "operationTypes": ["Read", "Execute"]}'
```

#### `GET /v1.0/api/tenants/{tenantId}/permissions/{id}`

Read a permission.

| | |
|---|---|
| Permission | Read on `Permission` |
| Response | `Permission` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/permissions/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/permissions/{id}`

Update a permission.

| | |
|---|---|
| Permission | Update on `Permission` |
| Request body | `PermissionRequest` |
| Response | `Permission` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/permissions/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "permissionType": "Permit", "resourceTypes": ["string"], "operationTypes": ["string"], "active": false}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/permissions/{id}`

Delete a permission.

| | |
|---|---|
| Permission | Delete on `Permission` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/permissions/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Assignments

#### `GET /v1.0/api/tenants/{tenantId}/user-role-assignments`

List user role assignments (filter with userId).

| | |
|---|---|
| Permission | Read on `Assignment` |
| Response | `EnumerationResult<UserRoleAssignment>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/user-role-assignments" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/user-role-assignments`

Assign a role to a user. The caller must hold every permission the role grants at the requested scope (system administrators excepted); otherwise 400 with field code `GrantCeiling` names the first missing one. The same ceiling applies to credential scope assignments, `POST .../role-permissions`, `PUT .../permissions/{id}`, and creating or rotating a credential that acts for another user. A `roleId` is resolved by identifier only.

| | |
|---|---|
| Permission | Create on `Assignment` |
| Request body | `AssignmentRequest` |
| Response | `UserRoleAssignment` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/user-role-assignments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "usr_...", "roleName": "AgentOperator", "resourceScope": "Tenant"}'
```

#### `GET /v1.0/api/tenants/{tenantId}/user-role-assignments/{id}`

Read a user role assignment.

| | |
|---|---|
| Permission | Read on `Assignment` |
| Response | `UserRoleAssignment` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/user-role-assignments/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/user-role-assignments/{id}`

Update a user role assignment.

| | |
|---|---|
| Permission | Update on `Assignment` |
| Request body | `AssignmentRequest` |
| Response | `UserRoleAssignment` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/user-role-assignments/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "string", "credentialId": "string", "roleId": "string", "roleName": "string", "resourceScope": "Tenant", "resourceId": "string", "inheritsToChildren": false, "active": false}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/user-role-assignments/{id}`

Remove a user role assignment.

| | |
|---|---|
| Permission | Delete on `Assignment` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/user-role-assignments/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/credential-scope-assignments`

List credential scope assignments (filter with credentialId).

| | |
|---|---|
| Permission | Read on `Assignment` |
| Response | `EnumerationResult<CredentialScopeAssignment>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/credential-scope-assignments" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/credential-scope-assignments`

Assign a role to a credential.

| | |
|---|---|
| Permission | Create on `Assignment` |
| Request body | `AssignmentRequest` |
| Response | `CredentialScopeAssignment` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/credential-scope-assignments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"credentialId": "crd_...", "roleName": "AgentInvoker", "resourceScope": "Resource", "resourceId": "agt_..."}'
```

#### `GET /v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}`

Read a credential scope assignment.

| | |
|---|---|
| Permission | Read on `Assignment` |
| Response | `CredentialScopeAssignment` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/credential-scope-assignments/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}`

Update a credential scope assignment.

| | |
|---|---|
| Permission | Update on `Assignment` |
| Request body | `AssignmentRequest` |
| Response | `CredentialScopeAssignment` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/credential-scope-assignments/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "string", "credentialId": "string", "roleId": "string", "roleName": "string", "resourceScope": "Tenant", "resourceId": "string", "inheritsToChildren": false, "active": false}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}`

Remove a credential scope assignment.

| | |
|---|---|
| Permission | Delete on `Assignment` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/credential-scope-assignments/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Audit

#### `GET /v1.0/api/tenants/{tenantId}/audit`

List audit records (eventType, principalId, result, fromUtc, toUtc, pageNumber, pageSize).

| | |
|---|---|
| Permission | Read on `Audit` |
| Response | `AuditPage` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/audit" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/audit/{id}`

Read an audit record.

| | |
|---|---|
| Permission | Read on `Audit` |
| Response | `AuditRecord` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/audit/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `DELETE /v1.0/api/tenants/{tenantId}/audit/{id}`

Delete an audit record.

| | |
|---|---|
| Permission | Delete on `Audit` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/audit/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `DELETE /v1.0/api/tenants/{tenantId}/audit`

Delete audit records matching the filter.

| | |
|---|---|
| Permission | Delete on `Audit` |
| Response | `DeleteCountResponse` |
| Success | 200 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/audit" \
  -H "Authorization: Bearer $TOKEN"
```

### Request History

#### `GET /v1.0/api/request-history`

List captured requests (method, statusCode, pathContains, fromUtc, toUtc, pageNumber, pageSize, tenantId, userId).

| | |
|---|---|
| Permission | Read on `RequestHistory` |
| Response | `RequestHistoryPage` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/request-history" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/request-history/summary`

Time-bucketed request counts (fromUtc, toUtc, bucketMinutes).

| | |
|---|---|
| Permission | Read on `RequestHistory` |
| Response | `RequestHistorySummary` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/request-history/summary" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/request-history/{id}`

Read a captured request with headers and bodies.

| | |
|---|---|
| Permission | Read on `RequestHistory` |
| Response | `RequestHistoryEntry` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/request-history/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `DELETE /v1.0/api/request-history/{id}`

Delete a captured request.

| | |
|---|---|
| Permission | Delete on `RequestHistory` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/request-history/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `DELETE /v1.0/api/request-history`

Delete captured requests matching the filter.

| | |
|---|---|
| Permission | Delete on `RequestHistory` |
| Response | `DeleteCountResponse` |
| Success | 200 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/request-history" \
  -H "Authorization: Bearer $TOKEN"
```

### Settings

#### `GET /v1.0/api/settings`

Read settings with source, apply mode, and editability metadata.

| | |
|---|---|
| Permission | Read on `Settings` |
| Response | `SettingsView` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/settings" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/settings`

Update settings.

| | |
|---|---|
| Permission | Update on `Settings` |
| Request body | `SettingsUpdateRequest` |
| Response | `SettingsSaveResponse` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"values": [{"path": "Runs.DefaultTimeoutSeconds", "value": "900"}]}'
```

Every value is checked against its metadata from `GET /v1.0/api/settings` (`type`, `minimum`, `maximum`, `allowedValues`) before anything is written. If any value is invalid, the whole update is rejected with 400 `ValidationFailed`, `errors` and `fieldCodes` keyed by setting path (see [Errors](#errors)), and nothing is saved. Values are never clamped: `-5` for `Audit.RetentionDays` is an error, not 1.

#### `POST /v1.0/api/settings/restart`

Restart this server process (the container runtime restarts it).

| | |
|---|---|
| Permission | Admin on `Settings` |
| Response | `RestartResponse` |
| Success | 202 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/settings/restart" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/settings/database/test`

Test database connectivity.

| | |
|---|---|
| Permission | Admin on `Settings` |
| Response | `DatabaseTestResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/settings/database/test" \
  -H "Authorization: Bearer $TOKEN"
```

### Server

#### `GET /v1.0/api/server-info`

Server version, endpoints, and feature flags.

| | |
|---|---|
| Permission | Authenticated; the handler checks permissions (see notes) |
| Response | `ServerInfoResponse` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/server-info" \
  -H "Authorization: Bearer $TOKEN"
```

The response includes `observability`, which is always present: the browser-facing Grafana, Prometheus, Loki, and Tempo URLs from the `Observability.*` cluster settings, and the Grafana datasource and dashboard UIDs used for deep links. Anything not configured is `null`, and `datasources` and `dashboards` are `null` until a Grafana URL is set.

```json
"observability": {
  "grafanaUrl": "https://grafana.example.com",
  "prometheusUrl": null,
  "lokiUrl": null,
  "tempoUrl": null,
  "datasources": { "prometheus": "garrison-prometheus", "loki": "garrison-loki", "tempo": "garrison-tempo" },
  "dashboards": {
    "overview": "garrison-overview", "http": "garrison-http", "runs": "garrison-runs", "workers": "garrison-workers",
    "protocols": "garrison-protocols", "integrations": "garrison-integrations", "agents": "garrison-agents",
    "models": "garrison-models", "kubernetes": "garrison-kubernetes", "scheduler": "garrison-scheduler",
    "database": "garrison-database", "controlPlane": "garrison-control-plane", "security": "garrison-security",
    "logs": "garrison-logs"
  }
}
```

#### `GET /v1.0/api/observability/status`

Reachability and version of the configured observability services, checked by the server (not the browser) against the `Observability.*InternalUrl` settings, or the browser URLs when those are empty. Always returns four entries, in the order `grafana`, `prometheus`, `loki`, `tempo`. A service is `configured` when its browser URL is set and `reachable` when its readiness check (Grafana `/api/health`, Prometheus `/-/ready`, Loki `/ready`, Tempo `/ready`) answered 2xx within 2 seconds. `version` comes from Grafana's health response and the build information endpoints of the others, and is `null` when unknown. Results are cached for 30 seconds and refreshed at once when a URL changes. The endpoint does not fail when a service is down.

| | |
|---|---|
| Permission | Authenticated (any signed-in user) |
| Response | `List<ObservabilityServiceStatus>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/observability/status" \
  -H "Authorization: Bearer $TOKEN"
```

```json
[
  { "service": "grafana", "configured": true, "reachable": true, "version": "11.3.0", "checkedUtc": "2026-10-10T12:00:00.000Z" },
  { "service": "prometheus", "configured": true, "reachable": false, "version": null, "checkedUtc": "2026-10-10T12:00:00.000Z" },
  { "service": "loki", "configured": false, "reachable": false, "version": null, "checkedUtc": "2026-10-10T12:00:00.000Z" },
  { "service": "tempo", "configured": false, "reachable": false, "version": null, "checkedUtc": "2026-10-10T12:00:00.000Z" }
]
```

### Harness Profiles

#### `GET /v1.0/api/harness-profiles/builtin`

List built-in harness profiles.

| | |
|---|---|
| Permission | Read on `HarnessProfile` |
| Response | `List<HarnessProfile>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/harness-profiles/builtin" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/harness-profiles`

List harness profiles (tenant and built-in).

| | |
|---|---|
| Permission | Read on `HarnessProfile` |
| Response | `EnumerationResult<HarnessProfile>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/harness-profiles" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/harness-profiles`

Create a harness profile.

| | |
|---|---|
| Permission | Create on `HarnessProfile` |
| Request body | `HarnessProfile` |
| Response | `HarnessProfile` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/harness-profiles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-cli", "harnessType": "Generic", "executable": "my-agent", "promptDelivery": "Stdin", "systemPromptDelivery": "None", "outputParser": "GenericJsonl", "genericTextField": "delta.text", "genericFinalField": "result", "genericSuccessField": "status", "genericSuccessValue": "ok", "arguments": [{"template": "--json"}]}'
```

#### `GET /v1.0/api/tenants/{tenantId}/harness-profiles/{id}`

Read a harness profile.

| | |
|---|---|
| Permission | Read on `HarnessProfile` |
| Response | `HarnessProfile` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/harness-profiles/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/harness-profiles/{id}`

Update a harness profile.

| | |
|---|---|
| Permission | Update on `HarnessProfile` |
| Request body | `HarnessProfile` |
| Response | `HarnessProfile` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/harness-profiles/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "description": "string", "harnessType": "ClaudeCode", "executable": "string", "promptDelivery": "Stdin", "promptArgumentTemplate": "string", "systemPromptDelivery": "File", "systemPromptTarget": "string", "mcpConfigFormat": "None", "mcpConfigFileName": "string", "outputParser": "ClaudeStreamJson", "resultSource": "ParserFinalEvent", "resultFileName": "string", "successPolicy": "FinalEvent", "genericTextField": "string", "genericFinalField": "string", "genericSuccessField": "string", "genericSuccessValue": "string", "defaultTimeoutSeconds": 0, "killGraceSeconds": 0, "maxOutputBytes": 0, "stderrTailBytes": 0, "isolateHome": false, "supportsResume": false, "active": false, "arguments": [{}], "environment": [{}], "files": [{}], "successExitCodes": [0], "probeArguments": ["string"], "credentialEnvironmentAllowlist": ["string"]}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/harness-profiles/{id}`

Delete a harness profile.

| | |
|---|---|
| Permission | Delete on `HarnessProfile` |
| Success | 204 (no body) |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/harness-profiles/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/harness-profiles/{id}/clone`

Clone a harness profile (built-in or tenant) into a new tenant profile.

| | |
|---|---|
| Permission | Create on `HarnessProfile` |
| Request body | `CloneRequest` |
| Response | `HarnessProfile` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/harness-profiles/{id}/clone" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "claude-code-local"}'
```

### Prompt Templates

#### `GET /v1.0/api/tenants/{tenantId}/prompt-templates`

List prompt templates (tenant and built-in).

| | |
|---|---|
| Permission | Read on `PromptTemplate` |
| Response | `EnumerationResult<PromptTemplate>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/prompt-templates`

Create a prompt template.

| | |
|---|---|
| Permission | Create on `PromptTemplate` |
| Request body | `PromptTemplateRequest` |
| Response | `PromptTemplate` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "helper-system", "kind": "System", "content": "You are {{agent.name}}. {{agent.description}}", "changeNote": "First version"}'
```

#### `POST /v1.0/api/tenants/{tenantId}/prompt-templates/render`

Render ad hoc template content with sample data.

| | |
|---|---|
| Permission | Read on `PromptTemplate` |
| Request body | `PromptRenderRequest` |
| Response | `PromptRenderResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates/render" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello {{input.message | upper}}", "context": {"input": {"message": "world"}}}'
```

#### `GET /v1.0/api/tenants/{tenantId}/prompt-templates/{id}`

Read a prompt template.

| | |
|---|---|
| Permission | Read on `PromptTemplate` |
| Response | `PromptTemplate` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/prompt-templates/{id}`

Update a prompt template (content changes create a version).

| | |
|---|---|
| Permission | Update on `PromptTemplate` |
| Request body | `PromptTemplateRequest` |
| Response | `PromptTemplate` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "description": "string", "kind": "System", "content": "string", "variables": [{}], "changeNote": "string"}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/prompt-templates/{id}`

Delete a prompt template and its versions.

| | |
|---|---|
| Permission | Delete on `PromptTemplate` |
| Success | 204 (no body) |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/versions`

List template versions, newest first.

| | |
|---|---|
| Permission | Read on `PromptTemplate` |
| Response | `List<PromptTemplateVersion>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates/{id}/versions" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/versions/{version}`

Read one template version.

| | |
|---|---|
| Permission | Read on `PromptTemplate` |
| Response | `PromptTemplateVersion` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates/{id}/versions/{version}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/restore/{version}`

Restore a version as a new version.

| | |
|---|---|
| Permission | Update on `PromptTemplate` |
| Response | `PromptTemplate` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates/{id}/restore/{version}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/clone`

Clone a template (built-in or tenant).

| | |
|---|---|
| Permission | Create on `PromptTemplate` |
| Request body | `CloneRequest` |
| Response | `PromptTemplate` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates/{id}/clone" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "default-system-custom"}'
```

#### `POST /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/reset`

Reset a cloned built-in template to the shipped default.

| | |
|---|---|
| Permission | Update on `PromptTemplate` |
| Response | `PromptTemplate` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates/{id}/reset" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/render`

Render a stored template with sample data.

| | |
|---|---|
| Permission | Read on `PromptTemplate` |
| Request body | `PromptRenderRequest` |
| Response | `PromptRenderResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates/{id}/render" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"context": {"input": {"message": "world"}}}'
```

### MCP Servers

#### `GET /v1.0/api/tenants/{tenantId}/mcp-servers`

List MCP servers.

| | |
|---|---|
| Permission | Read on `McpServer` |
| Response | `EnumerationResult<McpServer>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/mcp-servers" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/mcp-servers`

Register an MCP server.

| | |
|---|---|
| Permission | Create on `McpServer` |
| Request body | `McpServer` |
| Response | `McpServer` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/mcp-servers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "docs", "transport": "Http", "url": "https://mcp.example", "path": "/mcp", "headers": [{"name": "Authorization", "valueTemplate": "Bearer {{secret.docs}}"}], "requiredTools": ["search"]}'
```

#### `GET /v1.0/api/tenants/{tenantId}/mcp-servers/{id}`

Read an MCP server.

| | |
|---|---|
| Permission | Read on `McpServer` |
| Response | `McpServer` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/mcp-servers/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/mcp-servers/{id}`

Update an MCP server.

| | |
|---|---|
| Permission | Update on `McpServer` |
| Request body | `McpServer` |
| Response | `McpServer` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/mcp-servers/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "description": "string", "transport": "Http", "url": "string", "path": "string", "command": "string", "toolTimeoutSeconds": 0, "required": false, "active": false, "arguments": ["string"], "environment": [{}], "headers": [{}], "requiredTools": ["string"]}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/mcp-servers/{id}`

Delete an MCP server.

| | |
|---|---|
| Permission | Delete on `McpServer` |
| Success | 204 (no body) |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/mcp-servers/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/mcp-servers/{id}/test`

Connect to an HTTP MCP server and list its tools.

| | |
|---|---|
| Permission | Update on `McpServer` |
| Response | `McpServerTestResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/mcp-servers/{id}/test" \
  -H "Authorization: Bearer $TOKEN"
```

The test renders only the secrets its command, arguments, environment, and headers name (`{{secret.NAME}}`), and the caller needs `Execute` on each of them (400 `SecretUseDenied` otherwise). An HTTP server whose host is, or resolves to, an unspecified, link-local, multicast, or broadcast address (including the cloud metadata addresses 169.254.169.254 and fd00:ec2::254) is not contacted: the test answers 200 with `success` false and an `error` that names the address. Other connection failures report only their class (for example "The MCP server could not be reached (ConnectionError)."), never the raw exception text. A stdio server is tested on the worker named by `?nodeId=`; in a tenant with `requireUntrustedDeployments` that answers 400 `ValidationFailed` with field code `StdioDiagnosticsRequireTrust` on `transport`, because the command would run on the worker host, outside run isolation.

### Secrets

#### Using secrets

Reading and managing secrets (`Read`, `Create`, `Update`, `Delete` on `Secret`) is separate from using them. Using a secret, `Execute` on `Secret`, is what it takes to save configuration that sends a secret's value somewhere. `TenantAdmin`, `SecretManager`, and `SecretUser` hold it; `Editor` and `AgentDeveloper` do not. Assign `SecretUser` with `resourceScope: Resource` and the secret's identifier to allow one secret. Without it, these answer 400 `ValidationFailed` with field code `SecretUseDenied` and name the secret:

| Request | Secrets checked |
|---|---|
| Create or update a deployment | Every secret in `resourceBindings`, on every save |
| Update an MCP server or harness profile whose templates reference `secret.*` | Every secret bound by a deployment that uses it |
| Create or update an artifact store, workspace template, or agent | `secretId`, `gitCredentialSecretId`, `remoteCredentialSecretId` |
| Test an MCP server | The secrets its templates name |
| Manifest apply, REST or MCP | The same, per document; a failing document reports `errorCode` `SecretUseDenied` |

Invoking an agent does not need it.

#### `GET /v1.0/api/tenants/{tenantId}/secrets`

List secrets (metadata only).

| | |
|---|---|
| Permission | Read on `Secret` |
| Response | `EnumerationResult<Secret>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/secrets" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/secrets`

Create a secret.

| | |
|---|---|
| Permission | Create on `Secret` |
| Request body | `SecretRequest` |
| Response | `Secret` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/secrets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "anthropic-api-key", "kind": "AnthropicApiKey", "value": "sk-ant-..."}'
```

`expiresUtc` is optional. When set it must be in the future: a time that has already passed returns 400 `ValidationFailed` with field code `ExpiryInPast`, on create and on update. Manifests apply the same rule to a Secret's `spec.expiresUtc`.

#### `GET /v1.0/api/tenants/{tenantId}/secrets/{id}`

Read secret metadata.

| | |
|---|---|
| Permission | Read on `Secret` |
| Response | `Secret` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/secrets/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/secrets/{id}`

Update secret metadata (and value when supplied).

| | |
|---|---|
| Permission | Update on `Secret` |
| Request body | `SecretRequest` |
| Response | `Secret` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/secrets/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "anthropic-api-key", "description": "Rotated quarterly", "kind": "AnthropicApiKey", "expiresUtc": "2027-12-31T00:00:00Z"}'
```

Leave `value` out to keep the stored value. A past `expiresUtc` returns 400 (`ExpiryInPast`).

#### `PUT /v1.0/api/tenants/{tenantId}/secrets/{id}/value`

Set a secret value.

| | |
|---|---|
| Permission | Update on `Secret` |
| Request body | `SecretValueRequest` |
| Response | `Secret` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/secrets/{id}/value" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "new-value"}'
```

#### `POST /v1.0/api/tenants/{tenantId}/secrets/{id}/rotate`

Rotate a secret value.

| | |
|---|---|
| Permission | Update on `Secret` |
| Request body | `SecretValueRequest` |
| Response | `Secret` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/secrets/{id}/rotate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "new-value"}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/secrets/{id}`

Delete a secret.

| | |
|---|---|
| Permission | Delete on `Secret` |
| Success | 204 (no body) |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/secrets/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Workspaces

#### `GET /v1.0/api/tenants/{tenantId}/workspace-templates`

List workspace templates.

| | |
|---|---|
| Permission | Read on `Workspace` |
| Response | `EnumerationResult<WorkspaceTemplate>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/workspace-templates" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/workspace-templates`

Create a workspace template.

| | |
|---|---|
| Permission | Create on `Workspace` |
| Request body | `WorkspaceTemplate` |
| Response | `WorkspaceTemplate` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/workspace-templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "repo", "kind": "GitRepository", "gitUrl": "https://github.com/example/repo.git", "gitRef": "main", "gitDepth": 1}'
```

#### `GET /v1.0/api/tenants/{tenantId}/workspace-templates/{id}`

Read a workspace template.

| | |
|---|---|
| Permission | Read on `Workspace` |
| Response | `WorkspaceTemplate` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/workspace-templates/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/workspace-templates/{id}`

Update a workspace template.

| | |
|---|---|
| Permission | Update on `Workspace` |
| Request body | `WorkspaceTemplate` |
| Response | `WorkspaceTemplate` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/workspace-templates/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "description": "string", "kind": "Empty", "gitUrl": "string", "gitRef": "string", "gitDepth": 0, "gitCredentialSecretId": "string", "retention": "Delete", "active": false, "files": [{}]}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/workspace-templates/{id}`

Delete a workspace template.

| | |
|---|---|
| Permission | Delete on `Workspace` |
| Success | 204 (no body) |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/workspace-templates/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Artifact Stores

#### `GET /v1.0/api/tenants/{tenantId}/artifact-stores`

List artifact stores.

| | |
|---|---|
| Permission | Read on `ArtifactStore` |
| Response | `EnumerationResult<ArtifactStore>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/artifact-stores" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/artifact-stores`

Create an artifact store.

| | |
|---|---|
| Permission | Create on `ArtifactStore` |
| Request body | `ArtifactStore` |
| Response | `ArtifactStore` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/artifact-stores" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "default", "kind": "Database"}'
```

#### `GET /v1.0/api/tenants/{tenantId}/artifact-stores/{id}`

Read an artifact store.

| | |
|---|---|
| Permission | Read on `ArtifactStore` |
| Response | `ArtifactStore` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/artifact-stores/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/artifact-stores/{id}`

Update an artifact store.

| | |
|---|---|
| Permission | Update on `ArtifactStore` |
| Request body | `ArtifactStore` |
| Response | `ArtifactStore` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/artifact-stores/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "description": "string", "kind": "Database", "active": false}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/artifact-stores/{id}`

Delete an artifact store.

| | |
|---|---|
| Permission | Delete on `ArtifactStore` |
| Success | 204 (no body) |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/artifact-stores/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Usage Quotas

Quota limits are monitoring-only by default. Set `enforcementEnabled: true` explicitly to enforce an active quota. With enforcement off, zero or exceeded limits do not reject admission, hold claims, or change harness budgets. Usage remains available. Migration 16 sets enforcement off for every existing quota; operators must explicitly opt in again.

Usage quotas limit a tenant, an agent across its deployments, or a single deployment. Configure them in Configuration > Usage Quotas or under `/v1.0/api/tenants/{tenantId}/usage-quotas`. No quotas are seeded. Limits default to null (unlimited); explicit zero disallows usage only when enforcement is enabled. Only tenant/system administrators have built-in write grants; Editor, Viewer, Auditor, and AgentOperator can inspect quotas and usage.

| Method and suffix | Permission | Response |
|---|---|---|
| `GET /usage-quotas` | `UsageQuota:Read` | Enumeration |
| `POST /usage-quotas` | `UsageQuota:Create` | `UsageQuota`, 201 |
| `GET /usage-quotas/{id}` | `UsageQuota:Read` | `UsageQuota`, 200 |
| `PUT /usage-quotas/{id}` | `UsageQuota:Update` | `UsageQuota`, 200 |
| `DELETE /usage-quotas/{id}` | `UsageQuota:Delete` | Empty, 204 |
| `GET /usage-quotas/{id}/usage` | `UsageQuota:Read` | `UsageQuotaUsage`, 200 |

```json
{
  "name": "agent-daily-quota",
  "enforcementEnabled": false,
  "scope": "Agent",
  "resourceId": "agt_example",
  "dailyRunLimit": 100,
  "dailyTokenLimit": 1000000,
  "dailyCostUsdLimit": 25,
  "maxConcurrentRuns": 4,
  "active": true
}
```

The target must belong to the tenant. `scope` is `Tenant`, `Agent`, or `Deployment`; a tenant quota with an empty `resourceId` targets the route's tenant. Names and scope/target pairs are unique within a tenant, including inactive entries. Duplicate names answer 409 `NameConflict`, duplicate targets 409 `UsageQuotaExists`, and invalid or cross-tenant targets 404. IDs start with `uqt_`. The record also has `description`, `isProtected`, `createdUtc`, and `lastUpdateUtc`.

Daily windows begin at midnight UTC. `dailyRunLimit` counts distinct admissions, including delegated children and retries that create a new run; idempotent replays do not consume another admission. Tokens and cost count on the UTC completion day. Tokens are reported input plus output, adding Claude Code's separately reported cache reads. Reasoning already included in output is not counted twice. Negative token counts and negative cost do not reduce usage. Run/token limits accept whole numbers from 0 to 9,007,199,254,740,991; USD limits accept finite values from 0 to 1,000,000,000,000; concurrency accepts 0 to 2,147,483,647.

`UsageQuotaUsage` returns `quotaId`, `windowStartUtc`, `windowEndUtc`, `runsUsed`, `tokensUsed`, `costUsd` (known cost), `unknownCostRuns`, `costAccountingComplete`, and `activeRuns`. Active concurrency counts Leased, Running, and Cancelling runs across accounting days. Deleting or archiving runs does not reset daily meters; migration 15 backfills existing runs. A usage view also includes runs created by older replicas during a rolling upgrade, and deletion snapshots them before removal. Unknown cost permits admission and makes accounting visibly incomplete. Known usage enforces limits only when quota enforcement is enabled.

When enforcement is enabled, admission checks and run creation share a database transaction, serialized across replicas for the tenant. Refusal answers 429 `QuotaExceeded`, names the scope, target, quota, and limit, and supplies `Retry-After`. MCP and A2A retain `QuotaExceeded` in their protocol errors. Claims recheck token/cost/concurrency limits atomically; admitted queued runs wait for capacity, a daily reset, or a quota change. They are not charged another admission when claimed.

Only enforcement-enabled active quotas cause compilation to lower `deployment.maxBudgetUsd` to the smallest remaining known daily allowance without changing stored deployment configuration. Built-in Claude Code renders it as `--max-budget-usd`; custom profiles can render the same value where their CLI supports it. Prior reported repair cost reduces the allowance. Daily token/cost meters enforce recorded completed usage, so in-flight runs can exceed a daily total before completion. CLI budgets apply where supported; these quotas are not a guarantee about an external provider's invoice. Delegation-tree reservations are outside the current product scope.

### Model Prices

Prices start empty. Operators configure tenant-owned rates under `/v1.0/api/tenants/{tenantId}/model-prices`; the dashboard exposes them under Configuration > Model Prices. Rates are USD per million tokens, finite and between 0 and 1,000,000,000. Zero means free.

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET /model-prices` | `ModelPrice:Read` | Standard enumeration |
| `POST /model-prices` | `ModelPrice:Create` | Created `ModelPrice`, 201 |
| `GET /model-prices/{id}` | `ModelPrice:Read` | `ModelPrice`, 200 |
| `PUT /model-prices/{id}` | `ModelPrice:Update` | Updated `ModelPrice`, 200 |
| `DELETE /model-prices/{id}` | `ModelPrice:Delete` | Empty, 204 |

TenantAdmin and Editor can manage prices. Viewer, Auditor, and AgentOperator can read them. Names are unique within a tenant, as is each `(harnessType, model)` pair, including inactive entries. Duplicate names answer 409 `NameConflict`; duplicate harness/model pairs answer 409 `ModelPriceExists` (a concurrent uniqueness collision can also return `ModelPriceExists`). Invalid rates or model names answer 400. Cross-tenant reads answer 404. IDs start with `mpr_`.

Example request with fictional operator-supplied rates:

```json
{
  "name": "example-price",
  "model": "exact-served-model",
  "harnessType": "Generic",
  "inputUsdPerMillion": 2,
  "outputUsdPerMillion": 10,
  "cachedInputUsdPerMillion": 0.5,
  "reasoningUsdPerMillion": null,
  "inputIncludesCachedTokens": true,
  "outputIncludesReasoningTokens": true,
  "active": true
}
```

`ModelPrice` also has `id`, `tenantId`, `description`, `isProtected`, `createdUtc`, and `lastUpdateUtc`. Model names are trimmed, case-sensitive, exact identifiers of 1 to 256 characters without control characters. No aliases or wildcards are inferred. Input/output rates default to zero; optional cache/reasoning rates default to null and use the corresponding input/output rate. Both inclusion flags default to true.

On completion, any harness-reported `costUsd`, including zero, takes precedence. Otherwise an active price matching the run's tenant, harness, and served model estimates cost and sets `costEstimated=true`. Unknown or disabled prices leave cost unknown. Repair executions are priced individually before their usage and cost are accumulated; a repair that omits its model uses the run's previous served model. Editing or deleting prices never recalculates saved costs.

Included cached/reasoning subtotals are deducted from their parent input/output counts before applying their rates, capped at the parent totals. Separate counts are added. Claude Code reports cache reads separately: disable `inputIncludesCachedTokens` for its prices. Negative counts are treated as zero. These rates estimate token cost only; operators must incorporate their billing arrangements themselves.


### Agents

#### `GET /v1.0/api/tenants/{tenantId}/agents`

List agents.

| | |
|---|---|
| Permission | Read on `Agent` |
| Response | `EnumerationResult<Agent>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/agents" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/agents`

Create an agent.

| | |
|---|---|
| Permission | Create on `Agent` |
| Request body | `Agent` |
| Response | `Agent` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "helper", "description": "General assistant", "exposeA2A": true, "delegationMode": "AllowList", "delegationAllowList": ["coder"]}'
```

#### `POST /v1.0/api/tenants/{tenantId}/agents/register`

Self-register an agent (idempotent by name).

| | |
|---|---|
| Permission | Create on `Agent` |
| Request body | `Agent` |
| Response | `Agent` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/register" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "remote-helper", "kind": "Remote", "remoteProtocol": "A2A", "remoteEndpointUrl": "https://agents.example/helper", "registrationTtlSeconds": 300}'
```

#### `GET /v1.0/api/tenants/{tenantId}/agents/{idOrName}`

Read an agent by identifier or name. An identifier match wins over a name match. Unknown values return 404.

| | |
|---|---|
| Permission | Read on `Agent` |
| Response | `Agent` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/claude-helper" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/agents/{idOrName}`

Update an agent, addressed by identifier or name (identifier first).

| | |
|---|---|
| Permission | Update on `Agent` |
| Request body | `Agent` |
| Response | `Agent` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "displayName": "string", "description": "string", "kind": "Hosted", "agentVersion": "string", "exposeA2A": false, "exposeMcpTool": false, "mcpToolName": "string", "toolDescriptionTemplateId": "string", "skillDescriptionTemplateId": "string", "inputMode": "Text", "inputSchemaJson": "string", "outputSchemaJson": "string", "delegationMode": "None", "delegationMaxDepth": 0, "delegationAllowRecursion": false, "remoteProtocol": "A2A", "remoteEndpointUrl": "string", "remoteCredentialSecretId": "string", "lastRegisteredUtc": "2026-01-01T00:00:00Z", "registrationTtlSeconds": 0, "active": false, "skills": [{}], "tags": ["string"], "delegationAllowList": ["string"]}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/agents/{idOrName}`

Delete an agent and its deployments, addressed by identifier or name (identifier first).

| | |
|---|---|
| Permission | Delete on `Agent` |
| Success | 204 (no body) |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/agents/{idOrName}/card`

Read the agent's A2A agent card, addressed by identifier or name (identifier first). The interface URL uses `Rest.ExternalBaseUrl`, or the request's scheme and `Host` when that is unset; see `A2A_API.md`.

| | |
|---|---|
| Permission | Read on `Agent` |
| Response | `AgentCard` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/claude-helper/card" \
  -H "Authorization: Bearer $TOKEN"
```

### Deployments

#### `GET /v1.0/api/tenants/{tenantId}/deployments`

List deployments.

| | |
|---|---|
| Permission | Read on `Deployment` |
| Response | `EnumerationResult<Deployment>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/deployments" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/deployments`

Create a deployment.

| | |
|---|---|
| Permission | Create on `Deployment` |
| Request body | `Deployment` |
| Response | `Deployment` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/deployments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "agt_...", "name": "helper-claude", "harnessProfileId": "hrn_builtin_claude_code", "model": "sonnet", "maxTurns": 8, "timeoutSeconds": 600, "resourceBindings": [{"kind": "Secret", "alias": "anthropic", "resourceId": "sec_..."}], "allowedRunOverrides": [{"name": "model", "validation": "Enum", "pattern": "sonnet,haiku"}]}'
```

#### Deployment approval fields

| Field | Meaning |
|---|---|
| `approvalsEnabled` | Relay permission requests to Garrison (default false). Accepted only for Claude Code profiles and profiles with `CodexAppServer` delivery; `codex exec`, Mux, Gemini CLI, opencode, pi, and generic profiles have no approval hook, and a deployment that enables approvals on them is rejected with 400 (field `approvalsEnabled`). |
| `approvalDefaultAction` | `Allow`, `Deny`, or `Ask` (default) for requests no rule matches |
| `approvalTimeoutSeconds` | How long a pending approval waits for a person: 10 to 3,600, default 300. The wait never outlasts the run's deadline. |
| `approvalTimeoutDecision` | `Deny` (default) or `Allow`, applied when a pending approval expires |
| `approvalRules` | Ordered rules: `action` (`Allow`, `Deny`, `Ask`), `pattern`, optional `inputPattern` (a regular expression the tool input JSON must also match), optional `description`. Rule IDs (`dar_`) stay stable across updates. At most 500 rules. |

Patterns use Claude Code's rule syntax: a tool name (`Bash`, `Edit`, `Read`, `WebFetch`, `mcp__github__create_issue`), a tool with a specifier (`Bash(git status:*)` for a command prefix, `Bash(npm test)` for an exact command, `Bash(npm run *)` for a glob, `Edit(src/**)` for workspace-relative paths, `Edit(//etc/**)` for absolute ones, `WebFetch(domain:example.com)`), or an MCP server wildcard (`mcp__github__*`). When several rules match, Deny beats Ask and Ask beats Allow. A rule named `Edit` also covers `Write`, `MultiEdit`, and `NotebookEdit`, and `Read` covers `Glob`, `Grep`, and `LS`. For `Bash`, an Allow rule must cover every command of the line (split on `;`, `&&`, `||`, `|`, `&`, and new lines), and a line with command substitution (`$(...)`, backticks, `<(...)`) is never allowed by a rule, so it falls to the default; Deny and Ask rules match when any command of the line matches. Use [approval-check](#post-v10apitenantstenantiddeploymentsdeploymentidapproval-check) to test rules.

#### `GET /v1.0/api/tenants/{tenantId}/deployments/{id}`

Read a deployment.

| | |
|---|---|
| Permission | Read on `Deployment` |
| Response | `Deployment` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/deployments/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/deployments/{id}`

Update a deployment (increments its configuration version).

| | |
|---|---|
| Permission | Update on `Deployment` |
| Request body | `Deployment` |
| Response | `Deployment` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/deployments/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "string", "name": "string", "description": "string", "harnessProfileId": "string", "model": "string", "fallbackModel": "string", "effort": "string", "maxTurns": 0, "maxBudgetUsd": 0, "maxConcurrentRuns": 0, "timeoutSeconds": 0, "maxAttempts": 0, "effectPolicy": "AtMostOnce", "weight": 0, "nodePoolId": "string", "workspaceTemplateId": "string", "artifactStoreId": "string", "active": false, "promptBindings": [{}], "resourceBindings": [{}], "argumentOverrides": [{}], "environmentOverrides": [{}], "fileOverrides": [{}], "nodeSelector": [{}], "parameters": [{}], "allowedRunOverrides": [{}]}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/deployments/{id}`

Delete a deployment.

| | |
|---|---|
| Permission | Delete on `Deployment` |
| Success | 204 (no body) |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/deployments/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/deployments/{id}/compile-preview`

Compile the deployment with sample input; secret values are redacted. The body takes `input`, `parameters`, and two options from the studio (AD9.3):

- `agentRevisionId` compiles with another revision of the agent, such as a draft before it is published, so you can see its placed asset paths and system prompt. It also needs Read on `AgentRevision`.
- `environment` compiles the same agent's deployment in that environment instead (400 `NoDeploymentInEnvironment` when there is none).

The response has the `spec`, `commandLine`, `templateVersions`, the `deploymentId` that was compiled, and the `agentRevisionId` used.

| | |
|---|---|
| Permission | Read on `Deployment` |
| Request body | `CompilePreviewRequest` |
| Response | `CompilePreviewResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/deployments/{id}/compile-preview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "Reply with OK", "parameters": {}}'
```

### Manifests

#### `POST /v1.0/api/tenants/{tenantId}/manifests/apply`

Apply YAML or JSON manifests (query: dryRun, allowSecretValues).

| | |
|---|---|
| Permission | Create on `Manifest` |
| Request body | `string` |
| Response | `ManifestApply` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/manifests/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/yaml" \
  --data-binary @manifests.yaml
```

Add `?dryRun=true` to see what would happen without writing anything. Each item in `items` reports:

| Field | Meaning |
|---|---|
| `result` | `Created`, `Updated`, `Unchanged`, or `Failed` for an apply; `Validated` (or `Failed`) for a dry run, and for every document of an apply that was not written because another document failed |
| `plannedResult` | What the apply does or would do: `Created`, `Updated`, `Unchanged`, or `Failed`. In a dry run this is the answer to "what would change" |
| `changes` | For `Updated` documents, one entry per changed field: `{ "field", "before", "after" }`. Values are text, truncated to 200 characters, `null` when the field was not set. Secret values are never shown; a changed value appears as field `value` with `(hidden)` and `(hidden, changed)` |
| `resourceId` | The record's ID; `null` in a dry run for a record that does not exist yet |
| `message` | For people, for example `Would be updated: content, description.` |
| `errorCode`, `errorField` | For a failed document, a stable code and the failing field's path. `ManifestInvalid` means a spec field has the wrong type or a value that is not allowed; the message then names the document, field, value, and the allowed values, never internal type names. A reference that cannot be resolved fails with `MissingSecret` (a secret reference) or `ReferenceNotFound` (any other kind), and `errorField` names the reference, such as `resources.secrets.github` or `agent`. A `Bundle` document fails with `MissingSecret`, `MissingArtifactStore`, or `MissingBuiltIn` |

A document whose spec has a value the field does not accept fails like this (the apply answers 400 and writes nothing):

```json
{ "kind": "Secret", "name": "mux-api-key", "result": "Failed", "plannedResult": "Failed",
  "errorCode": "ManifestInvalid", "errorField": "documents[1].spec.kind",
  "message": "Secret mux-api-key (documents[1]) has an invalid spec: spec.kind is 'Generic', which is not an allowed value. Allowed values: GenericEnv, GenericFile." }
```

In a dry run, `createdCount`, `updatedCount`, and `unchangedCount` count what would happen. The applied record, including `changes`, is stored and returned again by `GET .../manifests/applies/{id}`.

```json
{
  "dryRun": true, "createdCount": 0, "updatedCount": 1, "unchangedCount": 1, "failedCount": 0,
  "items": [
    { "kind": "PromptTemplate", "name": "helper-system", "result": "Validated", "plannedResult": "Updated",
      "message": "Would be updated: content.",
      "changes": [ { "field": "content", "before": "Be brief.", "after": "Answer in one line." } ] },
    { "kind": "Agent", "name": "helper", "result": "Validated", "plannedResult": "Unchanged", "changes": [] }
  ]
}
```

#### `GET /v1.0/api/tenants/{tenantId}/manifests/export`

Export tenant configuration as a manifest bundle: multi-document YAML that `POST .../manifests/apply` accepts unchanged. Secret values are never exported.

| Query parameter | Meaning |
|---|---|
| `kinds` | Comma list of kinds to export in full: `PromptTemplate`, `HarnessProfile`, `McpServer`, `WorkspaceTemplate`, `Agent`, `Deployment`, `Pipeline`, `Trigger`, `NotificationEndpoint` (case does not matter) |
| `resources` | Comma list of `Kind/name` entries, such as `Agent/triage,Pipeline/release`. The kind ends at the first `/`, so names that contain `/` work |
| `followReferences` | `true` to also export what the selection depends on. Default `false` |
| `includeBuiltIn` | `true` to include referenced built-in prompt templates and harness profiles as documents. Default `false` |

With neither `kinds` nor `resources`, every tenant-owned resource is exported and built-ins are left out (references to them are kept). `kinds` and `resources` can be combined.

With `followReferences=true`:

- an agent brings its deployments, the triggers and notification endpoints that target it, the agents in its delegation allow list, and its tool and skill description templates;
- a deployment brings its agent, harness profile, prompt templates, workspace template, and MCP servers;
- a pipeline brings its stage agents (with their own dependencies), pinned deployments, handoff templates, and the triggers that target it;
- a trigger brings its agent or pipeline, its deployment, and its input template;
- a notification endpoint brings its agent and deployment.

Secrets and artifact stores never become documents. They are listed as requirements in the first document of the bundle, a `Bundle` document, and secrets are also listed in the header comment:

```yaml
# Garrison manifest bundle (garrison/v1) exported 2026-10-14T12:00:00Z from tenant default.
# Apply it with POST /v1.0/api/tenants/{tenantId}/manifests/apply (add ?dryRun=true to check it first).
# Secret values are never exported. Create these secrets in the target tenant before applying:
#   - github-token (ApiKey)
apiVersion: garrison/v1
kind: Bundle
metadata:
  name: garrison-bundle
spec:
  exportedUtc: 2026-10-14T12:00:00.0000000Z
  requiredSecrets:
  - name: github-token
    kind: ApiKey
  requiredArtifactStores: []
  requiredBuiltIns:
  - kind: HarnessProfile
    name: builtin/fake
---
apiVersion: garrison/v1
kind: Agent
...
```

When applied, the `Bundle` document writes nothing. It checks that every required secret, artifact store, and built-in exists in the target tenant (a secret may also be defined in the same manifest) and reports `Unchanged`. When something is missing it fails with `errorCode` `MissingSecret`, `MissingArtifactStore`, or `MissingBuiltIn` and an `errorField` such as `spec.requiredSecrets[0]`, so the whole apply writes nothing until the secrets exist.

| | |
|---|---|
| Permission | Read on `Manifest` |
| Response | `application/yaml; charset=utf-8`, with `Content-Disposition: attachment; filename="garrison-bundle-<tenantId>.yaml"` |
| Success | 200 |
| Errors | 400 `ValidationFailed` with field code `UnknownKind` on `kinds` (also for `Secret` and `Bundle`, which are never exported) or `InvalidSelector` on `resources`; 404 `NotFound` when a selected resource does not exist in the tenant |

```bash
curl -s "http://127.0.0.1:8700/v1.0/api/tenants/default/manifests/export?resources=Agent/triage&followReferences=true" \
  -H "Authorization: Bearer $TOKEN" -o triage-bundle.yaml
```

#### `GET /v1.0/api/tenants/{tenantId}/manifests/applies`

List manifest applies.

| | |
|---|---|
| Permission | Read on `Manifest` |
| Response | `EnumerationResult<ManifestApply>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/manifests/applies" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/manifests/applies/{id}`

Read a manifest apply with per-document results.

| | |
|---|---|
| Permission | Read on `Manifest` |
| Response | `ManifestApply` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/manifests/applies/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Runs

#### `POST /v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke`

Invoke an agent.

| | |
|---|---|
| Permission | Execute on `Agent` |
| Request body | `InvokeRequest` |
| Response | `Run` |
| Success | 200 when the run finished within the wait, 202 when it is still queued or running |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/{agentId}/invoke" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "Summarize the README", "wait": true, "waitSeconds": 60}'
```

An agent with no active deployment whose weight is above zero cannot run: the call returns 409 `NoActiveDeployment` with a message that says so. Create a deployment for the agent (or activate one) first. A 404 means the agent itself does not exist.

An `Idempotency-Key` header makes retries safe: the same key with the same agent and input returns the run it created (within 24 hours), even when the retries reach different replicas at the same moment. The same key with different input returns 409 `IdempotencyKeyConflict` naming the existing run; use a new key for a new request.

A waiting call (`"wait": true`) that loses its client cancels the run: when the connection closes before the run finishes, the run moves to `Cancelling` and the worker stops the harness, so nobody pays for output that no one will read. To keep the run going after a disconnect (and read it later with `GET .../runs/{id}`), send `"cancelOnDisconnect": false` in the body or `?cancelOnDisconnect=false` on the URL; the query parameter wins. The wait timing out (`waitSeconds` elapsing, answered with 202) never cancels the run, and neither does a control-plane replica shutting down. See [Cancellation](#cancellation).

To hold a conversation, send `"startConversation": true` with the first request and the returned run's `conversationId` with each follow-up. The follow-up becomes the conversation's next turn, and the harness resumes the session the earlier turns built. See [Conversations](#conversations).

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/helper/invoke" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "Draft a release note for 0.2", "startConversation": true}'

# The run carries "conversationId": "cnv_..."; send the next turn with it.
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/helper/invoke" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "Make it shorter", "conversationId": "cnv_..."}'
```

#### `POST /v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/test`

Invoke a specific deployment with a test input.

| | |
|---|---|
| Permission | Read on `Deployment` |
| Request body | `InvokeRequest` |
| Response | `Run` |
| Success | 200 when the run finished within the wait, 202 when it is still queued or running |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/deployments/{deploymentId}/test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "Reply with OK", "wait": true}'
```

#### `POST /v1.0/api/tenants/{tenantId}/runs`

Create a run.

| | |
|---|---|
| Permission | Create on `Run` |
| Request body | `RunCreateRequest` |
| Response | `Run` |
| Success | 200 when the run finished within the wait, 202 when it is still queued or running (always 202 with `"wait": false`) |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/runs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agentName": "helper", "input": "Summarize the README", "parameters": {"model": "haiku"}, "wait": false}'
```

This needs the `helper-claude` deployment from the Deployments section (created with `helper`'s ID, and allowing `model` overrides). Without an active deployment the call returns 409 `NoActiveDeployment`, and a parameter the deployment does not allow returns 400 with field code `ParameterNotAllowed` under `parameters.model`. The status codes match invoke: 202 Accepted means the run was queued, not that it finished. With `"wait": true`, a client disconnect cancels the run unless `cancelOnDisconnect` is `false`, as for invoke.

#### `GET /v1.0/api/tenants/{tenantId}/runs`

List runs.

| | |
|---|---|
| Permission | Read on `Run` |
| Response | `EnumerationResult<Run>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/runs" \
  -H "Authorization: Bearer $TOKEN"
```

#### `DELETE /v1.0/api/tenants/{tenantId}/runs`

Delete finished runs matching a filter, up to 1000 per call. Runs that are still active are skipped; cancel them first.

**Warning:** every filter is optional. A call with no filter deletes up to 1000 finished runs of every agent in the tenant, with their events. There is no undo. List first with the same filters (`GET .../runs?...`) to see what would go.

| Query parameter | Meaning |
|---|---|
| `status` | Only runs in this status, for example `Failed` or `Cancelled` |
| `agentId` | Only runs of this agent (ID) |
| `fromUtc` | Only runs created at or after this ISO 8601 UTC time |
| `toUtc` | Only runs created before this ISO 8601 UTC time |

| | |
|---|---|
| Permission | Delete on `Run` |
| Response | `DeleteCountResponse` |
| Success | 200 |

This example deletes the failed runs of one agent that are older than 30 days:

```bash
CUTOFF=$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)
curl -s -G -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/runs" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "agentId=agt_..." --data-urlencode "status=Failed" --data-urlencode "toUtc=$CUTOFF"
```

The `date` line works with GNU `date` (Linux) and BSD `date` (macOS).

#### `GET /v1.0/api/tenants/{tenantId}/runs/{id}`

Read a run.

| | |
|---|---|
| Permission | Read on `Run` |
| Response | `Run` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/runs/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

##### Run timing and usage fields

Every `Run` (and every run in a list) carries these telemetry fields. Durations are milliseconds. A field that could not be measured is left out of the JSON, following the general rule for null values, with one exception: `outputTokensPerSecond` is always present and is `null` when it cannot be measured. Clients should treat a missing field and `null` the same way.

| Field | Meaning | Measured by |
|---|---|---|
| `firstTokenUtc`, `lastTokenUtc` | First and last model output event (assistant text or thinking) | Worker |
| `timeToFirstTokenMs` | Harness process start to first model output (includes harness startup) | Worker, monotonic clock |
| `streamingMs` | First model output to last model output | Worker, monotonic clock |
| `executionMs` | Harness process start to process exit | Worker, monotonic clock |
| `queueMs` | Queued to leased | Server timestamps |
| `totalMs` | Queued to the server receiving the completion | Server timestamps |
| `outputTokensPerSecond` | `outputTokens / (streamingMs / 1000)`, two decimals, when `streamingMs` is at least 100; otherwise `null` | Server |
| `inputTokens`, `outputTokens`, `cachedTokens` | Usage reported by the harness | Parser |
| `reasoningTokens` | Reasoning or thinking tokens when the harness reports them (Codex `reasoning_output_tokens`, Claude Code `thinking_tokens`), otherwise 0 | Parser |
| `toolCallCount` | Tool call events in the run | Worker |
| `delegationWaitMs` | Time the run spent waiting on child runs it delegated to (runs whose `parentRunId` is this run): the union of each child's lifetime, created to finished, clipped to this run's execution, so children running in parallel count once. 0 for a run that delegated nothing | Server timestamps, when the run finishes |
| `timeToFirstTokenExcludingDelegationMs` | `timeToFirstTokenMs` minus the part of `delegationWaitMs` that happened before the first model output, never negative. Equal to `timeToFirstTokenMs` for a run that delegated nothing first. Use it to compare agents that delegate with agents that answer directly | Server |

`timeToFirstTokenMs` stays the true time to the first model output, so a run that calls `garrison_invoke_agent` before writing anything has a long TTFT; the two delegation fields explain how much of it was spent waiting. Runs that finished before schema migration 4, or without a worker report, have `null` delegation fields.

Runs that finished before schema migration 2, or that ended without a worker report (cancelled while queued, failed by the lease reaper), have `null` worker timings; their `queueMs` and `totalMs` are derived from the stored timestamps. See `docs/TELEMETRY.md` for how each value is measured.

```json
{
  "id": "run_mv2abc...",
  "status": "Succeeded",
  "inputTokens": 12, "outputTokens": 7, "cachedTokens": 3, "reasoningTokens": 2,
  "toolCallCount": 0,
  "firstTokenUtc": "2026-10-09T18:02:11.412Z", "lastTokenUtc": "2026-10-09T18:02:11.655Z",
  "timeToFirstTokenMs": 184, "streamingMs": 243, "executionMs": 466,
  "queueMs": 41, "totalMs": 590, "outputTokensPerSecond": 28.81,
  "delegationWaitMs": 0, "timeToFirstTokenExcludingDelegationMs": 184
}
```

##### Blocked runs (`blockedReason`)

Every `Run` returned by REST (invoke, create, read, list, children, cancel, retry) carries `blockedReason`, a read-only field computed when the run is read. It is never stored, it cannot be set, and unlike other null fields it is always present in the JSON, as `null` when there is nothing to report.

| Value | Meaning |
|---|---|
| `null` | The run is not `Queued`, or at least one Ready node could run it. It may still be waiting for capacity or a deployment concurrency limit. |
| `NoReadyWorker` | No node is Ready at all. |
| `NoCapableWorker` | Ready nodes exist, but none reports the run's harness as available. |
| `NoMatchingPool` | Ready nodes report the harness, but none matches the deployment's node pool, the pool's tenant dedication, or the deployment's node selector labels. |
| `NoIsolatingWorker` | The run is `Untrusted` (see [Deployment trust level](#deployment-trust-level-trustlevel)) or needs egress control because its deployment has `egressRules` (see [Deployment egress allowlist](#deployment-egress-allowlist-egressrules)), and Ready nodes report its harness, but none offers its executor with the isolation it needs (at least `Container`) and, for an allowlist, egress control. The run waits until such a worker registers; it is never given to a Process worker or run without its allowlist. |
| `NoToolWorker` | The run's agent revision uses a harness built-in capability (AD4.4), such as `pandoc`, and no Ready worker that can run it reports the tool as the node label `garrison.io/tool-{name}=true`. The explanation names the missing tools. See [docs/CAPABILITIES.md](docs/CAPABILITIES.md). |

The reason comes from a snapshot of node state that is reused for up to 3 seconds, so it can lag a node registering or going away by that long. The control plane leader also checks queued runs every 5 seconds. The first time it finds a run blocked for a given reason it appends one `Warning` run event that explains it, for example `No Ready worker reports the Codex harness. The run waits until one registers.` Each reason is explained at most once per run. When the cluster setting `Runtime.FailBlockedAfterSeconds` is above 0 (the default 0 waits forever), a run that stays blocked that long fails with status `Failed`, outcome `NoCapableWorker`, and an `errorMessage` that names the reason. The overview counts blocked runs in `blockedRuns`.

```json
{
  "id": "run_mv2abd...",
  "status": "Queued",
  "harnessType": "Codex",
  "blockedReason": "NoCapableWorker"
}
```

##### Structured output validation (`outputSchemaValid`, `schemaValidationErrors`, `repairAttempts`)

When the run's agent has an output schema (`outputSchemaJson`), the control plane validates the final output against it when a successful execution is reported. It validates the structured output the harness reported (Claude Code `structured_output`) when there is one, and otherwise parses the final `resultText` as JSON. A result that is one JSON document wrapped in a Markdown code fence (three backticks, optionally tagged `json`) is unwrapped first. Agents without an output schema skip validation.

| Outcome of validation | What happens |
|---|---|
| Valid | The run succeeds. `outputSchemaValid` is `true` and `structuredOutputJson` holds the validated document as compact JSON, including when it came from `resultText`. |
| Invalid, first time, resume possible | One repair attempt starts inside the same lease. The worker resumes the harness session in the run's directories with a prompt rendered from the deployment's `Repair` prompt binding, or from `builtin/structured-output-repair` when the deployment binds none. The run stays `Running`, `repairAttempts` becomes 1, and the repair's output is validated the same way. Its result, structured output, and session become the run's; usage, cost, tool calls, streaming time, and execution time are the sum of both executions. |
| Invalid, no repair possible, or invalid again after the repair | The run fails with status `Failed`, outcome `SchemaValidationFailed`, and an `errorMessage` that names the first few validation errors and, when no repair ran, why. |

A repair is possible when the deployment's harness profile has `supportsResume` set, the harness reported a session ID, no repair ran yet, cancellation was not requested, and the worker supports in-lease repairs. Every failed validation appends one `Warning` run event that lists the errors; its `rawEventJson` is a `SchemaValidationNotice` (`notice` is `SchemaValidationFailed`, plus `repairAttempt`, `source`, `errors`, `totalErrors`, `repairStarted`, and `noRepairReason`). The repair template version is added to the run's `templateVersions`.

| Field | Type | Meaning |
|---|---|---|
| `outputSchemaValid` | `bool?` | `true` when the final output validated, `false` when it did not, `null` when the agent has no output schema or no successful execution was validated. Always present. |
| `schemaValidationErrors` | `string?` | The first few errors of the most recent failed validation, separated by `; `, each as `<location>: <message> (<keyword>)` with `(root)` for the document itself. `null` when the output validated or was not validated. Always present. |
| `repairAttempts` | `int` | Structured output repairs started: 0 or 1. |

```json
{
  "id": "run_mv2abe...",
  "status": "Failed",
  "outcome": "SchemaValidationFailed",
  "repairAttempts": 1,
  "outputSchemaValid": false,
  "schemaValidationErrors": "/answer: Value is \"integer\" but should be \"string\" (type)",
  "errorMessage": "Output does not match the agent's output schema after one repair attempt: /answer: Value is \"integer\" but should be \"string\" (type)."
}
```

##### Run guards (`RepetitionDetected`, `OutputLimitExceeded`, `NoProgress`)

The worker watches every run, whatever the harness, and stops it when it stops doing useful work. A small model stuck printing `* \n` forever is the typical case: without a guard it runs until its deadline.

| Guard | Deployment field | Cluster default | Stops the run when | Outcome |
|---|---|---|---|---|
| Repetition | `repetitionGuard` | `Runtime.RepetitionGuard` (`true`) | The most recent 2,000 characters of assistant text are one unit of 1 to 64 characters repeated (at least 30 times), or the most recent 1,000 characters contain no letter or digit (only whitespace, punctuation, or symbols). | `RepetitionDetected` |
| Assistant text size | `maxAssistantChars` | `Runtime.MaxAssistantChars` (200,000; 0 is unlimited) | The run's assistant text passes the limit. | `OutputLimitExceeded` |
| No progress | `noProgressSeconds` | `Runtime.NoProgressSeconds` (300; 0 turns it off) | No progress for that many seconds while no tool call is open. | `NoProgress` |

Progress means an `AssistantText`, `Thinking`, `ToolCall`, or `ToolResult` event. A tool call is open from its `ToolCall` event until the `ToolResult` with the same `toolCallId`, or until the model writes text or thinks again, so a 20-minute build or test command never counts as no progress. Lifecycle, usage, warning, error, stdout, and stderr events are not progress. The repetition window only covers assistant text written since the last tool call or tool result, so an agent that says "Reading the next file." between hundreds of tool calls is not a loop. The deadline (`timeoutSeconds`, capped by `Runtime.MaxRunSeconds`) still bounds everything.

When a guard trips, the worker sends the harness SIGTERM, then SIGKILL after the harness profile's `killGraceSeconds`, to the harness and every process it started. The run gets exactly one `Warning` event with code `RunGuardTriggered` whose text says which guard tripped and why, and it ends `Failed` with the guard's outcome. `errorMessage` repeats the reason and `resultText` keeps the output produced so far.

```json
{
  "id": "run_mv2z7m72...",
  "status": "Failed",
  "outcome": "RepetitionDetected",
  "errorMessage": "Repetition guard: the last 1,000 characters of assistant text contain no letters or digits (only whitespace, punctuation, or symbols), ending with \" \\n* \\n* \\n* \\n*\".",
  "resultText": "You are Mux Helper, an agent operated by Garrison. ... * \n* \n* \n"
}
```

#### `DELETE /v1.0/api/tenants/{tenantId}/runs/{id}`

Delete a finished run.

| | |
|---|---|
| Permission | Delete on `Run` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/runs/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/runs/{id}/cancel`

Cancel a run.

| | |
|---|---|
| Permission | Update on `Run` |
| Response | `Run` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/runs/{id}/cancel" \
  -H "Authorization: Bearer $TOKEN"
```

##### Cancellation

A queued run is cancelled at once. A leased or running run moves to `Cancelling`; the worker holding it learns about it through its cancellation watch (`POST /v1.0/api/node/watch`, a long poll answered the moment the run is cancelled on any replica) and stops the harness with SIGTERM, then SIGKILL after the profile's `killGraceSeconds`. In the test suite the cancel request reaches a `Cancelled` run in under 100 ms for a harness that exits on SIGTERM and in about 1.1 seconds for one that ignores SIGTERM with a 1-second grace; the contract is under 5 seconds. The heartbeat (every 5 seconds by default) is the fallback when the watch is unavailable.

Cancelling a run also cancels the runs it delegated to other agents that have not finished, and their delegated runs in turn. Callers that go away cancel their runs too:

| Caller | Cancels its run when |
|---|---|
| REST invoke, deployment test, or run create with `wait=true` | The client disconnects before the run finishes, unless `cancelOnDisconnect` is `false`. |
| MCP `garrison_invoke_agent` | The client sends `notifications/cancelled` for the tool call, or deletes or closes the MCP session, while the call waits. See `MCP_API.md`. |
| A2A blocking `SendMessage` and `SendStreamingMessage` | The client disconnects before the task finishes. See `A2A_API.md`. |

#### `POST /v1.0/api/tenants/{tenantId}/runs/{id}/retry`

Retry a finished run as a new run.

| | |
|---|---|
| Permission | Create on `Run` |
| Response | `Run` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/runs/{id}/retry" \
  -H "Authorization: Bearer $TOKEN"
```

Only finished runs can be retried (409 `RunNotFinished` otherwise). A pipeline stage run answers 409 `PipelineStageRun`; retry its pipeline run with `POST .../pipeline-runs/{id}/retry` instead (see [Pipelines](#pipelines)). If the run's agent was deleted, the retry returns 409 `AgentDeleted` ("Run ... cannot be retried because the agent ... was deleted."); if only its deployment was deleted, 409 `DeploymentDeleted`. Invoke the agent again instead. Run tokens cannot retry runs (403 `RunTokenRetryNotAllowed`): a retry starts a top-level run, outside the delegation policy, so a delegating harness invokes the agent instead.

#### `GET /v1.0/api/tenants/{tenantId}/runs/{id}/events`

Read run events after a sequence.

| | |
|---|---|
| Permission | Read on `Run` |
| Response | `RunEventsResponse` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/runs/{id}/events" \
  -H "Authorization: Bearer $TOKEN"
```

Workers merge consecutive `AssistantText` deltas, and consecutive `Thinking` deltas, within one event flush window, up to `EventTextCoalesceMaxChars` (default 2048). Other event types, differing metadata, explicit flushes, and retry batches are boundaries. Text concatenation preserves the transcript; `rawEventJson` retains each original harness line separated by newline, and timestamps retain the earliest merged event time. Live streams use the same ordered database events and flush cadence. Individual events larger than the cap are retained intact.

Events whose text Garrison writes itself (rather than the harness or the model) carry a stable `code` so clients can show a translated label next to, or instead of, the English `text`: `WorkspacePrepared`, `RepairAttemptStarted`, `McpPreflightPassed`, `McpPreflightWarning`, `HarnessExited`, `EventsDropped`, `RunBlocked` (the run's `blockedReason` says why), `StructuredOutputInvalid`, `ApprovalRequested` (a permission request is waiting for a person), and `ApprovalDecided` (a permission request was decided by a rule, the deployment default, a person, the timeout, or a cancellation). The two approval events are `Lifecycle` events the worker records from the control plane; their `rawEventJson` carries the approval ID, status, decision, and source. Other events have no `code`.

#### `GET /v1.0/api/tenants/{tenantId}/runs/{id}/events/stream`

Stream run events (server-sent events).

| | |
|---|---|
| Permission | Read on `Run` |
| Success | 200 (text/event-stream) |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/runs/{id}/events/stream" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/runs/{id}/transcript`

Download a run as a readable transcript, in Markdown or as a JSON document. See [docs/TRANSCRIPTS.md](docs/TRANSCRIPTS.md).

| Query parameter | Meaning |
|---|---|
| `format` | `markdown` or `json` (case does not matter). Without it, an `Accept` header that contains `application/json` gives JSON and anything else gives Markdown |
| `includeThinking` | `true` to include thinking events. Default `false` |

| | |
|---|---|
| Permission | Read on `Run` |
| Response | `text/markdown; charset=utf-8`, or `application/json; charset=utf-8` with a `Transcript` |
| Headers | `Content-Disposition: attachment; filename="<runId>-transcript.md"` (or `.json`), `Cache-Control: private, no-store`, `X-Garrison-Transcript-Truncated: true` or `false` |
| Success | 200 |
| Errors | 400 `ValidationFailed` with field code `InvalidFormat` on `format`; 404 for an unknown run or one in another tenant |

```bash
curl -s "http://127.0.0.1:8700/v1.0/api/tenants/default/runs/{id}/transcript?format=markdown" \
  -H "Authorization: Bearer $TOKEN" -o transcript.md
```

The transcript has the input, assistant text, tool calls with their arguments and results, approvals, warnings and errors, the result, usage and cost, and timestamps. Standard output, standard error, progress, usage, and result events are not entries (the result and usage are on the turn). Tool call and tool result text is cut at `Transcripts.ToolTextMaxChars` characters and marked `textTruncated`. Secret values the deployment binds and common credential shapes are replaced with `[REDACTED]`, using the same redactor as approval previews. The whole transcript is capped at `Transcripts.MaxBytes`; later events are left out, `truncated` is true, and `truncationNote` says so.

```json
{
  "schema": "garrison.transcript/v1",
  "kind": "Run",
  "tenantId": "default", "runId": "run_...", "agentName": "helper",
  "generatedUtc": "2026-10-14T12:00:00Z", "includesThinking": false,
  "truncated": false, "turnCount": 1,
  "usage": { "inputTokens": 1200, "outputTokens": 340, "cachedTokens": 0, "reasoningTokens": 0, "toolCallCount": 1, "costUsd": 0.0123, "costEstimated": false, "durationMs": 8200 },
  "turns": [
    {
      "turn": 1, "runId": "run_...", "agentName": "helper", "deploymentId": "dep_...",
      "kind": "Invoke", "status": "Succeeded", "outcome": "Success", "callerName": "admin", "model": "sonnet",
      "input": "List the files.", "createdUtc": "2026-10-14T11:59:50Z", "startedUtc": "2026-10-14T11:59:51Z", "completedUtc": "2026-10-14T11:59:59Z",
      "entries": [
        { "sequence": 2, "timestampUtc": "2026-10-14T11:59:52Z", "type": "ToolCall", "toolName": "Bash", "toolCallId": "t1", "text": "{\"command\":\"ls\"}", "textTruncated": false },
        { "sequence": 3, "timestampUtc": "2026-10-14T11:59:53Z", "type": "ToolResult", "toolCallId": "t1", "success": true, "text": "README.md", "textTruncated": false },
        { "sequence": 4, "timestampUtc": "2026-10-14T11:59:55Z", "type": "AssistantText", "text": "There is one file.", "textTruncated": false }
      ],
      "approvals": [],
      "result": "There is one file.",
      "usage": { "inputTokens": 1200, "outputTokens": 340, "cachedTokens": 0, "reasoningTokens": 0, "toolCallCount": 1, "costUsd": 0.0123, "costEstimated": false, "durationMs": 8200 },
      "omittedEvents": 0, "truncated": false
    }
  ]
}
```

| `Transcript` field | Meaning |
|---|---|
| `schema` | Always `garrison.transcript/v1` |
| `kind` | `Run` or `Conversation` |
| `runId`, `conversationId` | The run, or the conversation, the transcript is for |
| `includesThinking` | Whether thinking events were asked for |
| `truncated`, `truncationNote` | Whether the size cap or the turn cap cut the transcript, and how |
| `usage` | Totals over the included turns |
| `turns[].omittedEvents` | Events the run recorded that are no longer stored, removed by `Runs.EventRetentionDays` |
| `turns[].entries[].type` | `AssistantText`, `Thinking`, `ToolCall`, `ToolResult`, `Warning`, `Error`, or `Lifecycle` |
| `turns[].approvals` | Approvals the run asked for: `id`, `kind`, `toolName`, `summary`, `inputPreview` (redacted), `status`, `decision`, `decisionSource`, `decidedBy`, `reason`, `requestedUtc`, `decidedUtc` |

#### `GET /v1.0/api/tenants/{tenantId}/runs/{id}/children`

List runs delegated by a run.

| | |
|---|---|
| Permission | Read on `Run` |
| Response | `EnumerationResult<Run>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/runs/{id}/children" \
  -H "Authorization: Bearer $TOKEN"
```

### Conversations

A conversation is a series of runs (turns) with one agent that share a harness session. The first turn starts the conversation (`"startConversation": true` on invoke, or any A2A message); each later turn names it with `conversationId` (or the A2A `contextId`) and resumes the session where the previous turn left it: Claude Code and Mux with `--resume <session>`, Codex with `codex exec resume <session>`, the Codex app-server profile with `thread/resume`, Gemini CLI with `--resume`. A conversation stays on the deployment of its first turn, because a session can only be resumed by the harness that created it.

**One turn at a time.** A turn sent while the conversation's previous turn has not finished is refused with 409 `ConversationBusy`; the error names the unfinished run. Turns are refused rather than queued, so no caller holds a connection open behind someone else's turn. Wait for the run to finish (or cancel it) and send the turn again. A cancelled, failed, or timed-out turn frees the conversation like a successful one.

**Where a turn runs.** A harness keeps its session in the run's home and config directories, so the conversation's turns run in one set of directories (`<WorkRoot>/conversations/<conversationId>/` on the worker) on the node that ran the last successful turn, the conversation's `affinityNodeId`. A follow-up turn waits for that node: other nodes leave it queued for up to `Runtime.ConversationAffinityWaitMs` (default 30 seconds) while the node is Ready. When the node is not Ready (Lost, Draining, Cordoned, or deleted), or the wait ends, another node takes the turn as a **fallback**: it starts a fresh harness session whose task prompt repeats the earlier turns (the `ConversationFallback` prompt role, `builtin/conversation-fallback` by default, limited to `Runtime.ConversationTranscriptTurns` turns of at most `Runtime.ConversationTranscriptChars` characters each) before the new request. A turn whose node no longer has the conversation's directories (the worker's work root was emptied, or the directories went unused for the worker's `ConversationRetentionHours`) reports `ConversationStateLost`, and the control plane queues it again as a fallback without using an attempt.

Every fallback is recorded three ways: the run's `conversationFallbackReason`, a `ConversationFallback` lifecycle event on the run, and the conversation's `fallbackCount`, `lastFallbackReason`, and `lastFallbackUtc`. The node that runs a fallback turn becomes the new affinity node once the turn succeeds.

| `conversationFallbackReason` | Meaning |
|---|---|
| `AffinityNodeLost` | The node holding the session is not Ready (or the conversation has no affinity node), so another node ran the turn. |
| `AffinityWaitExpired` | The node holding the session stayed Ready but did not take the turn within `Runtime.ConversationAffinityWaitMs`. |
| `WorkspaceLost` | The node holding the session no longer had the conversation's directories. |
| `SessionMissing` | Earlier turns exist, but none reported a session to resume (for example, they all failed early). |
| `HarnessChanged` | The deployment's harness profile changed since the session was recorded. |
| `ResumeUnsupported` | The deployment's harness profile has `supportsResume` off. |
| `ExecutorWithoutState` | The deployment runs on the KubernetesJob executor, whose run pods keep no home directory between runs, so every turn after the first starts from the transcript. |

Runs carry `conversationId`, `conversationTurn` (1 for the first turn), `resumeSessionId` (the session the turn resumes, cleared by a fallback), `affinityNodeId` and `affinityUntilUtc` (the node the turn waits for and until when), and `conversationFallbackReason`. `GET .../runs?conversationId=cnv_...` lists a conversation's turns, as does `GET .../conversations/{id}/runs`.

Conversations need the `Conversation` permission resource: Read to list and read them, Delete to delete them. Invoking a turn needs Execute on the agent, as for any invocation. A conversation from another tenant answers 404.

#### `GET /v1.0/api/tenants/{tenantId}/conversations`

List conversations, newest first.

| Query parameter | Meaning |
|---|---|
| `agentId` | Only conversations with this agent (ID) |
| `contextId` | Only the conversation created for this client-supplied A2A context identifier |
| `callerId` | Only conversations started by this principal |
| `appId` | Only conversations started through this agentic app ([docs/APPS.md](docs/APPS.md)) |
| `search` | Case-insensitive part of the title |

| | |
|---|---|
| Permission | Read on `Conversation` |
| Response | `EnumerationResult<Conversation>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/conversations?agentId=agt_..." \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/conversations/{id}`

Read a conversation. `busy` is computed on read: true while a turn is unfinished.

| | |
|---|---|
| Permission | Read on `Conversation` |
| Response | `Conversation` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/conversations/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{
  "id": "cnv_mv4m...",
  "agentId": "agt_...", "agentName": "helper", "deploymentId": "dep_...", "harnessType": "ClaudeCode",
  "title": "Draft a release note for 0.2",
  "sessionId": "9c1d0f7e-...", "sessionHarnessProfileId": "hrn_builtin_claude_code",
  "affinityNodeId": "nod_...", "affinityNodeName": "garrison-worker-0",
  "activeRunId": "run_...", "lastRunId": "run_...",
  "turnCount": 2, "fallbackCount": 0, "busy": false,
  "lastActivityUtc": "2026-10-11T20:14:03.112Z", "createdUtc": "2026-10-11T20:12:40.008Z"
}
```

#### `DELETE /v1.0/api/tenants/{tenantId}/conversations/{id}`

Delete a conversation. Its runs are kept (with their `conversationId`), so history and analytics are unchanged; a later turn naming the deleted conversation gets 404. A conversation with an unfinished turn answers 409 `ConversationBusy`. The deletion is audited (`ConversationDeleted`). The worker removes the conversation's directories when they have gone unused for its `ConversationRetentionHours`.

| | |
|---|---|
| Permission | Delete on `Conversation` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/conversations/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/conversations/{id}/runs`

List a conversation's turns (runs), oldest first unless `ordering` is given.

| | |
|---|---|
| Permission | Read on `Conversation` |
| Response | `EnumerationResult<Run>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/conversations/{id}/runs" \
  -H "Authorization: Bearer $TOKEN"
```


#### `GET /v1.0/api/tenants/{tenantId}/conversations/{id}/transcript`

Download every turn of a conversation, oldest first, as one transcript (`kind` `Conversation`). It takes the same `format` and `includeThinking` parameters, sends the same headers, and has the same shape as the run transcript (`GET .../runs/{id}/transcript`), with one entry in `turns` per run. At most `Transcripts.MaxTurns` turns are included; when a conversation has more, `truncated` is true and `truncationNote` says how many were left out.

| | |
|---|---|
| Permission | Read on `Conversation` |
| Response | `text/markdown; charset=utf-8`, or `application/json; charset=utf-8` with a `Transcript` |
| Success | 200 |
| Errors | 400 `ValidationFailed` with field code `InvalidFormat` on `format`; 404 for an unknown conversation or one in another tenant |

```bash
curl -s "http://127.0.0.1:8700/v1.0/api/tenants/default/conversations/{id}/transcript?format=json" \
  -H "Authorization: Bearer $TOKEN" -o conversation.json
```


### Conversation file spaces

A shared folder per conversation, pipeline run, or delegation tree (AD3). Every run of the tree syncs it into its workspace at start and writes changes back at the end. [docs/FILE_SPACES.md](docs/FILE_SPACES.md) explains which space a run uses, conflicts, limits, and retention.

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET /conversations/{id}/files?includeDeleted=` | Read on `Conversation` | `FileSpaceListing` (`fileSpaceId`, `files`, `totalBytes`, `fileCount`), 200 |
| `GET /conversations/{id}/files/content?path=&version=` | Read on `Conversation` | The file's bytes with its media type, 200 |
| `GET /conversations/{id}/files/versions?path=` | Read on `Conversation` | `ConversationFileVersion[]`, newest first, 200 |
| `POST /conversations/{id}/files` | Update on `Conversation` | `FileSpaceUploadResult`, 201 |
| `DELETE /conversations/{id}/files?path=` | Update on `Conversation` | Empty, 204. Versions are kept |
| `POST /conversations/{id}/files/download-url?path=&version=` | Read on `Conversation` | `FileDownloadUrl` (`url`, `expiresUtc`), 200 |

The same six routes exist under `/runs/{id}/files` with Read and Update on `Run`; a run resolves to its tree's space, so any run of a conversation answers with the conversation's files. Paths are relative to `/v1.0/api/tenants/{tenantId}`, and another tenant's conversation or run answers 404. The URL from `download-url` points at `GET /v1.0/file-download/{fileSpaceId}?ticket=`, which needs no credentials and opens one file version until it expires.

#### `POST /v1.0/api/tenants/{tenantId}/conversations/{id}/files`

A JSON body carries `path`, `content` (text) or `contentBase64`, and optional `mediaType` and `baseVersion`. Raw bytes work too: `Content-Type: application/octet-stream` with the query parameters `path`, optional `mediaType`, and optional `baseVersion`.

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/conversations/{id}/files" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"path": "notes/sources.md", "content": "- https://example.com", "baseVersion": 0}'
```

```json
{ "requestedPath": "notes/sources.md", "path": "notes/sources.md", "version": 1, "conflict": false, "sha256": "4b7e..." }
```

With `baseVersion` set and the file changed since that version, the upload is kept under a conflict name: `conflict` is true and `path` is the name it used, such as `notes/sources.user-mv3k2a1b.md`. Without `baseVersion` the upload replaces the file.

| | |
|---|---|
| Errors | 400 `InvalidFilePath` (field code `InvalidFilePath` on `path`); 404 for an unknown conversation, run, or file; 413 `FileTooLarge` (`FileSpaces.MaxFileBytes`), `FileSpaceFull` (`FileSpaces.MaxTotalBytes`), `TooManyFiles` (`FileSpaces.MaxFiles`) |


### Approvals

Permission approvals (P12.3) let a person, or a deployment's rules, decide the tool calls a harness asks permission for. Claude Code asks through `--permission-prompt-tool mcp__garrison__garrison_permission_prompt` (see [MCP_API.md](MCP_API.md)); for Codex with the `CodexAppServer` delivery, the worker relays the app-server's command and file change approval requests to the same tool with the run token. Turn approvals on per deployment with `approvalsEnabled` (see [Deployment approval fields](#deployment-approval-fields)).

Every request is evaluated against the deployment's `approvalRules`. A matching Allow or Deny rule, or the deployment's `approvalDefaultAction` when no rule matches, decides at once and the decision is recorded. Ask creates a `Pending` approval: the harness call blocks, the run stays `Running` with `awaitingApproval: true`, and the approval waits until a person decides it here (or over MCP or the dashboard), it expires (`approvalTimeoutSeconds`, then `approvalTimeoutDecision` applies, Deny by default), or the run stops. Decisions are compare-and-set updates in the database, so they work from any replica: a decision on one replica wakes the call waiting on another through the event backplane.

| Field | Meaning |
|---|---|
| `id` | `apr_` identifier |
| `runId`, `rootRunId`, `agentId`, `agentName`, `deploymentId`, `leaseEpoch` | The run (attempt) that asked, and the deployment whose rules applied |
| `harnessType`, `kind` | `Tool` (Claude Code), `Command` (Codex command, evaluated as `Bash`), or `FileChange` (Codex file change, evaluated as `Edit`) |
| `toolName`, `toolCallId` | The tool and the harness's call identifier |
| `inputPreview` | The tool input as JSON, with secrets redacted (values of the deployment's bound secrets, bearer tokens, API keys, `password=`-style assignments, private keys) and cut to 4,000 characters. The full input is never stored. |
| `summary` | One line for lists: the command, URL, paths, or query, redacted |
| `suggestedRule` | A rule pattern covering this request, used by `remember` |
| `status` | `Pending`, `Approved`, `Denied`, `Expired`, or `Cancelled` |
| `decision` | What the harness was told: `Allow` or `Deny` (null while pending) |
| `decisionSource` | `Rule`, `Default`, `User`, `Timeout`, or `Cancelled` |
| `ruleId`, `rulePattern` | The rule that matched, if any |
| `rememberedRuleId` | The rule a decision with `remember` added |
| `decidedBy`, `decidedById`, `reason` | Who decided and why (Garrison writes the reason for timeouts and cancellations) |
| `timeoutDecision` | The decision applied if the approval expires, copied from the deployment |
| `requestedUtc`, `decidedUtc`, `expiresUtc`, `waitMs` | Timing; pending approvals expire before the run's deadline |

#### `GET /v1.0/api/tenants/{tenantId}/approvals`

List approvals, newest first. Filters: `status`, `runId`, `rootRunId` (every approval in a delegation tree), `agentId`, `deploymentId`, `decisionSource`, `fromUtc`, `toUtc`, plus the [enumeration](#enumeration) parameters. For an inbox badge, ask for `status=Pending&maxResults=1` and read `totalRecords`.

| | |
|---|---|
| Permission | Read on `Approval` |
| Response | `EnumerationResult<Approval>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/approvals?status=Pending" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{
  "success": true,
  "maxResults": 25,
  "skip": 0,
  "totalRecords": 1,
  "recordsRemaining": 0,
  "endOfResults": true,
  "timestampUtc": "2026-10-11T21:04:12.118034Z",
  "objects": [
    {
      "id": "apr_mv3k2a1b_7QxJm2LhR8sWcN4dTzEf",
      "tenantId": "default",
      "runId": "run_mv3k29zq_Hc8wPnB2dLx5rTq1VkYa",
      "rootRunId": null,
      "agentId": "agt_mv1a0c4e_2nKqLw9ZtBv7XsRm",
      "agentName": "release-helper",
      "deploymentId": "dep_mv1a0c5f_Pq7RtLw2ZxYv9NmK",
      "leaseEpoch": 1,
      "harnessType": "ClaudeCode",
      "kind": "Tool",
      "toolName": "Bash",
      "toolCallId": "toolu_01JmH6x9",
      "inputPreview": "{\"command\":\"git push origin main\",\"description\":\"Push the release branch\"}",
      "summary": "git push origin main",
      "suggestedRule": "Bash(git push:*)",
      "status": "Pending",
      "decision": null,
      "decisionSource": null,
      "ruleId": null,
      "rulePattern": null,
      "rememberedRuleId": null,
      "decidedBy": null,
      "decidedById": null,
      "reason": null,
      "timeoutDecision": "Deny",
      "requestedUtc": "2026-10-11T21:04:03.502117Z",
      "decidedUtc": null,
      "expiresUtc": "2026-10-11T21:09:03.502117Z",
      "waitMs": null,
      "createdUtc": "2026-10-11T21:04:03.509871Z",
      "lastUpdateUtc": "2026-10-11T21:04:03.509871Z"
    }
  ]
}
```

#### `GET /v1.0/api/tenants/{tenantId}/approvals/{id}`

Read an approval. Approvals of other tenants return 404.

| | |
|---|---|
| Permission | Read on `Approval` |
| Response | `Approval` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/approvals/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/approvals/{id}/decide`

Allow or deny a pending approval. The waiting harness continues at once; a denial's `reason` is part of the message the harness receives. With `remember: true`, Garrison also adds a rule to the approval's deployment (an Allow rule for Allow, a Deny rule for Deny) with `rulePattern`, or the approval's `suggestedRule` when it is omitted; the deployment's configuration version goes up and the change is audited. Remember also needs Update on the deployment.

| | |
|---|---|
| Permission | Update on `Approval` (and Update on `Deployment` with `remember`) |
| Request body | `ApprovalDecideRequest`: `decision` (`Allow` or `Deny`, required), `reason` (optional, up to 4,000 characters), `remember` (default false), `rulePattern` (optional) |
| Response | `Approval` |
| Success | 200 |
| Errors | 409 `ApprovalNotPending` when the approval was already decided, expired, or cancelled; 400 `ValidationFailed` for a missing decision or an invalid `rulePattern` |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/approvals/{id}/decide" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision": "Allow", "reason": "Release approved in the change ticket", "remember": false}'
```

Every decision a person makes writes an `ApprovalDecided` audit record.

#### `POST /v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/approval-check`

Evaluate a deployment's approval rules against a sample tool call without recording anything, for testing rules. The `input` object uses the tool input field names (`command`, `cwd`, `url`, `file_path`, `notebook_path`, `path`, `paths`, `pattern`, `query`).

| | |
|---|---|
| Permission | Read on `Deployment` |
| Request body | `ApprovalCheckRequest`: `toolName`, `input` |
| Response | `ApprovalCheckResponse`: `action` (`Allow`, `Deny`, `Ask`), `source` (`Rule` or `Default`), `ruleId`, `rulePattern`, `suggestedRule`, `approvalsEnabled` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/deployments/{deploymentId}/approval-check" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toolName": "Bash", "input": {"command": "git status && rm -rf build"}}'
```

```json
{
  "action": "Deny",
  "source": "Rule",
  "ruleId": "dar_mv1a0c5g_4TzLq8WbNx2YvRkP",
  "rulePattern": "Bash(rm:*)",
  "suggestedRule": "Bash(git status:*)",
  "approvalsEnabled": true
}
```

### Pipelines

A pipeline (P12.9) runs agents in a fixed order on one request: each stage is an ordinary run of its agent, the next stage sees the previous stage's result through its `PipelineStage` prompt template, and a stage with `requiresReview` waits for a person to approve, request changes, or reject before the pipeline continues. [docs/PIPELINES.md](docs/PIPELINES.md) explains the model, the handoff templates, reviews, and failure handling; this section is the route reference.

Three resources make up the API. Pipeline definitions (`ppl_`) are configuration and are authorized as `Pipeline`. Pipeline runs (`plr_`) are executions, authorized as `PipelineRun`. Stage reviews (`prv_`) share the approvals inbox and are authorized as `Approval`. Run tokens cannot use any of these routes.

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET /pipelines` | Read on `Pipeline` | `EnumerationResult<Pipeline>`, 200 |
| `POST /pipelines` | Create on `Pipeline` | `Pipeline`, 201 |
| `GET /pipelines/{idOrName}` | Read on `Pipeline` | `Pipeline`, 200 |
| `PUT /pipelines/{idOrName}` | Update on `Pipeline` | `Pipeline`, 200 |
| `DELETE /pipelines/{idOrName}` | Delete on `Pipeline` | Empty, 204 |
| `POST /pipelines/{idOrName}/start` | Execute on `Pipeline` and Execute on `Agent` for every stage agent | `PipelineRun`, 201 |
| `POST /pipelines/{idOrName}/preview` | Read on `Pipeline` | `PipelinePreviewResponse`, 200 |
| `GET /pipeline-runs` | Read on `PipelineRun` | `EnumerationResult<PipelineRun>`, 200 |
| `GET /pipeline-runs/{id}` | Read on `PipelineRun` | `PipelineRun` with stages, stage runs, and reviews, 200 |
| `POST /pipeline-runs/{id}/cancel` | Update on `PipelineRun` | `PipelineRun`, 200 |
| `POST /pipeline-runs/{id}/retry` | Update on `PipelineRun` | `PipelineRun`, 200 |
| `DELETE /pipeline-runs/{id}` | Delete on `PipelineRun` | Empty, 204 |
| `GET /pipeline-reviews` | Read on `Approval` | `EnumerationResult<PipelineReview>`, 200 |
| `GET /pipeline-reviews/{id}` | Read on `Approval` | `PipelineReview`, 200 |
| `POST /pipeline-reviews/{id}/decide` | Update on `Approval` | `PipelineReview`, 200 |

Paths are relative to `/v1.0/api/tenants/{tenantId}`. Pipelines of another tenant, and their runs and reviews, answer 404.

#### `GET /v1.0/api/tenants/{tenantId}/pipelines`

List pipelines with the [enumeration](#enumeration) parameters (`search` matches the name, `activeOnly` hides inactive ones). Each pipeline comes with its stages.

| | |
|---|---|
| Permission | Read on `Pipeline` |
| Response | `EnumerationResult<Pipeline>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/pipelines?search=release" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/pipelines`

Create a pipeline. Stages run in list order; `position` is assigned from the order (1 to N) and any value you send is ignored. Identifiers, `tenantId`, `version`, and `isProtected` in the body are ignored too.

| | |
|---|---|
| Permission | Create on `Pipeline` |
| Request body | `Pipeline` |
| Response | `Pipeline` |
| Success | 201 |
| Errors | 400 `ValidationFailed` with per-field codes (`PipelineEmpty`, `TooManyStages`, `ReferenceNotFound`, `DeploymentAgentMismatch`, `TemplateKindMismatch`, `ParameterNotAllowed`, `ParameterInvalid`, `Invalid`); 409 `NameConflict` |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/pipelines" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "release-notes",
    "description": "Draft release notes, have a person check them, then edit",
    "maxDurationSeconds": 86400,
    "stages": [
      { "name": "draft", "agentId": "agt_mv1a0c4e_2nKqLw9ZtBv7XsRm", "requiresReview": true, "reviewTimeoutSeconds": 14400, "reviewTimeoutAction": "Reject", "maxRevisions": 2 },
      { "name": "edit", "agentId": "agt_mv1a0c7k_8TqPw3ZxLm5RvBn", "deploymentId": "dep_mv1a0c7m_Yh2Kq9WtRb4ZxLp",
        "maxAttempts": 2, "outputCharLimit": 32000, "parameters": [ { "name": "model", "value": "opus" } ] }
    ]
  }'
```

```json
{
  "id": "ppl_mv5c9r2d_Wq8LmT3xZb7KvRn",
  "tenantId": "default",
  "name": "release-notes",
  "description": "Draft release notes, have a person check them, then edit",
  "version": 1,
  "maxDurationSeconds": 86400,
  "active": true,
  "isProtected": false,
  "createdUtc": "2026-10-13T17:52:11.402118Z",
  "lastUpdateUtc": "2026-10-13T17:52:11.402118Z",
  "stages": [
    {
      "id": "pst_mv5c9r2e_Bn4Kq7WzLt2XmPv",
      "pipelineId": "ppl_mv5c9r2d_Wq8LmT3xZb7KvRn",
      "tenantId": "default",
      "position": 1,
      "name": "draft",
      "agentId": "agt_mv1a0c4e_2nKqLw9ZtBv7XsRm",
      "outputCharLimit": 16000,
      "maxAttempts": 1,
      "continueOnFailure": false,
      "requiresReview": true,
      "reviewTimeoutSeconds": 14400,
      "reviewTimeoutAction": "Reject",
      "maxRevisions": 2,
      "parameters": []
    },
    {
      "id": "pst_mv5c9r2f_Rk7Tz2QwNb8LxVm",
      "pipelineId": "ppl_mv5c9r2d_Wq8LmT3xZb7KvRn",
      "tenantId": "default",
      "position": 2,
      "name": "edit",
      "agentId": "agt_mv1a0c7k_8TqPw3ZxLm5RvBn",
      "deploymentId": "dep_mv1a0c7m_Yh2Kq9WtRb4ZxLp",
      "outputCharLimit": 32000,
      "maxAttempts": 2,
      "continueOnFailure": false,
      "requiresReview": false,
      "reviewTimeoutSeconds": 0,
      "reviewTimeoutAction": "Reject",
      "maxRevisions": 3,
      "parameters": [ { "id": "psp_mv5c9r2g_Lq3Wn8TzKb5RxYv", "stageId": "pst_mv5c9r2f_Rk7Tz2QwNb8LxVm", "tenantId": "default", "name": "model", "value": "opus" } ]
    }
  ]
}
```

Validation covers the name (1 to 64 lowercase letters, digits, and hyphens), one to `Runtime.PipelineMaxStages` stages (default 20), unique stage names of up to 128 characters, every numeric range listed under the `PipelineStage` model, that each agent exists, that a pinned `deploymentId` belongs to the stage's agent, that a `handoffTemplateId` is a `Task` template (and a pinned `handoffTemplateVersion` exists), and that `parameters` are allowed run overrides of the pinned deployment. Stage parameters therefore need a `deploymentId`. Field keys look like `stages[1].deploymentId`.

#### `GET /v1.0/api/tenants/{tenantId}/pipelines/{idOrName}`

Read a pipeline by identifier or name. When addressed by name, resource-scoped permissions are checked against the resolved identifier.

| | |
|---|---|
| Permission | Read on `Pipeline` |
| Response | `Pipeline` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/pipelines/release-notes" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/pipelines/{idOrName}`

Replace a pipeline and all of its stages. Send the complete definition: stages left out are removed. `version` goes up by one. Pipeline runs that already started keep the stage snapshot they started with.

| | |
|---|---|
| Permission | Update on `Pipeline` |
| Request body | `Pipeline` |
| Response | `Pipeline` |
| Success | 200 |
| Errors | As for create, plus 409 `Protected` for a protected pipeline |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/pipelines/release-notes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "release-notes", "stages": [ { "name": "draft", "agentId": "agt_mv1a0c4e_2nKqLw9ZtBv7XsRm", "requiresReview": true } ]}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/pipelines/{idOrName}`

Delete a pipeline. Its finished pipeline runs are kept. While any of its pipeline runs is active (`Running`, `AwaitingReview`, or `Cancelling`), the delete answers 409 `PipelineInUse`; cancel them or let them finish first.

| | |
|---|---|
| Permission | Delete on `Pipeline` |
| Success | 204 |
| Errors | 409 `PipelineInUse`, 409 `Protected` |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/pipelines/release-notes" \
  -H "Authorization: Bearer $TOKEN"
```

Agents and deployments that a pipeline stage references cannot be deleted while the reference exists: deleting them answers 409 `ReferencedByPipeline` and names the pipelines.

#### `POST /v1.0/api/tenants/{tenantId}/pipelines/{idOrName}/start`

Start a pipeline. The caller needs Execute on the pipeline and Execute on every stage's agent, checked before anything is created. The pipeline run snapshots the stages, creates the first stage run at once, and answers 201 with the pipeline run.

With `wait` true the call holds until the pipeline run ends or stops for a review, or until `waitSeconds` (default 60, at most 600) elapses, and then returns its current state. `wait` and `waitSeconds` may also be passed as query parameters. Running out of time never cancels anything.

Send an `Idempotency-Key` header to make retries safe: a start with a key the same caller already used returns that pipeline run (201, even when it already finished). A key reused for a different pipeline or a different input answers 409 `IdempotencyKeyConflict`.

| | |
|---|---|
| Permission | Execute on `Pipeline`, and Execute on `Agent` for each stage agent |
| Headers | `Idempotency-Key` (optional) |
| Request body | `PipelineStartRequest`: `input`, `inputContentType` (default `text/plain`), `priority` (given to every stage run, default 0), `wait` (default false), `waitSeconds` (0 to 600, default 60) |
| Response | `PipelineRun` with `stages`, `runs`, and `reviews` |
| Success | 201 |
| Errors | 409 `PipelineInactive`, 409 `PipelineEmpty`, 409 `IdempotencyKeyConflict`, 403 when an agent is not permitted |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/pipelines/release-notes/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: release-2.4" \
  -d '{"input": "Write release notes for 2.4 from the merged pull requests.", "wait": true, "waitSeconds": 60}'
```

```json
{
  "id": "plr_mv5d0k3q_Rk2wT8mNbX4vLq7Y",
  "tenantId": "default",
  "pipelineId": "ppl_mv5c9r2d_Wq8LmT3xZb7KvRn",
  "pipelineName": "release-notes",
  "pipelineVersion": 1,
  "status": "AwaitingReview",
  "outcome": "None",
  "currentPosition": 1,
  "stageCount": 2,
  "casVersion": 4,
  "inputText": "Write release notes for 2.4 from the merged pull requests.",
  "inputContentType": "text/plain",
  "callerType": "User",
  "callerId": "usr_mv1pdwe4_Kx8TqLm2WbZr5Nv",
  "callerName": "admin@garrison",
  "idempotencyKey": "release-2.4",
  "priority": 0,
  "deadlineUtc": "2026-10-14T18:01:07.488Z",
  "cancelRequested": false,
  "startedUtc": "2026-10-13T18:01:07.488Z",
  "createdUtc": "2026-10-13T18:01:07.491Z",
  "lastUpdateUtc": "2026-10-13T18:01:09.102Z",
  "stages": [
    { "id": "prs_mv5d0k3r_Tz4Lq8WbNm2XvKp", "position": 1, "name": "draft", "agentId": "agt_mv1a0c4e_2nKqLw9ZtBv7XsRm", "agentName": "writer", "requiresReview": true, "maxRevisions": 2, "status": "AwaitingReview", "executions": 1, "attempts": 1, "revisions": 0, "currentRunId": "run_mv5d0k3s_9VbQx2LmT7nRp4Wz", "startedUtc": "2026-10-13T18:01:07.495Z", "parameters": [] },
    { "id": "prs_mv5d0k3r_Qm7Kz2WtLb9XnRv", "position": 2, "name": "edit", "agentId": "agt_mv1a0c7k_8TqPw3ZxLm5RvBn", "agentName": "editor", "status": "Pending", "executions": 0, "attempts": 0, "revisions": 0, "parameters": [ { "name": "model", "value": "opus" } ] }
  ],
  "runs": [
    { "runId": "run_mv5d0k3s_9VbQx2LmT7nRp4Wz", "position": 1, "execution": 1, "agentName": "writer", "status": "Succeeded", "outcome": "Succeeded", "createdUtc": "2026-10-13T18:01:07.497Z", "completedUtc": "2026-10-13T18:01:09.044Z" }
  ],
  "reviews": [
    { "id": "prv_mv5d0k9a_Hq3Lz8WcN1tYb5Ks", "pipelineRunId": "plr_mv5d0k3q_Rk2wT8mNbX4vLq7Y", "position": 1, "stageName": "draft", "runId": "run_mv5d0k3s_9VbQx2LmT7nRp4Wz", "execution": 1, "status": "Pending", "timeoutAction": "Reject", "requestedUtc": "2026-10-13T18:01:09.098Z", "expiresUtc": "2026-10-13T22:01:09.098Z" }
  ]
}
```

(Stage snapshots carry every stage setting; the example trims them.)

#### `POST /v1.0/api/tenants/{tenantId}/pipelines/{idOrName}/preview`

Render every stage's task prompt from a sample input and sample stage outputs, without creating anything. Each stage compiles against its pinned deployment, or else the agent's first active deployment with a weight above zero. `sampleOutputs[i]` is the output stage `i + 2` sees as `pipeline.previous.output`; missing entries are empty. A stage that cannot compile reports `success: false` with `errorCode` (`AgentNotFound`, `NoActiveDeployment`, or a compilation code such as `TemplateRenderFailed`) instead of failing the whole preview. Secret values never appear in previews.

| | |
|---|---|
| Permission | Read on `Pipeline` |
| Request body | `PipelinePreviewRequest`: `input`, `sampleOutputs` |
| Response | `PipelinePreviewResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/pipelines/release-notes/preview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "Write release notes for 2.4.", "sampleOutputs": ["Garrison 2.4 adds pipelines."]}'
```

```json
{
  "pipelineId": "ppl_mv5c9r2d_Wq8LmT3xZb7KvRn",
  "pipelineName": "release-notes",
  "stages": [
    { "position": 1, "stageName": "draft", "agentName": "writer", "deploymentId": "dep_mv1a0c4f_Pq7RtLw2ZxYv9NmK", "deploymentName": "writer-claude", "success": true, "prompt": "You are stage 1 of 2 (\"draft\") in the pipeline release-notes. ...\n\n--- Your task ---\nWrite release notes for 2.4." },
    { "position": 2, "stageName": "edit", "agentName": "editor", "deploymentId": "dep_mv1a0c7m_Yh2Kq9WtRb4ZxLp", "deploymentName": "editor-claude", "success": true, "prompt": "You are stage 2 of 2 (\"edit\") in the pipeline release-notes. ...\n\n--- Output of draft ---\nGarrison 2.4 adds pipelines.\n--- End of output ---\n\n--- Your task ---\nWrite release notes for 2.4." }
  ]
}
```

#### `GET /v1.0/api/tenants/{tenantId}/pipeline-runs`

List pipeline runs, newest first. Filters: `pipelineId` (the `ppl_` identifier), `status` (`Running`, `AwaitingReview`, `Cancelling`, `Succeeded`, `Failed`, `Cancelled`, `TimedOut`), `callerId`, `fromUtc`, `toUtc`, plus `maxResults`, `skip`, and `ordering`. List items carry their stages but not `runs` or `reviews`; read one pipeline run for those.

| | |
|---|---|
| Permission | Read on `PipelineRun` |
| Response | `EnumerationResult<PipelineRun>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/pipeline-runs?status=AwaitingReview" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/pipeline-runs/{id}`

Read a pipeline run with its stage snapshots, summaries of every stage run (`runs`, ordered by position and execution), and its reviews (oldest first). With `waitSeconds` (1 to 600) the call first waits until the pipeline run ends or stops for a review, or the time runs out.

| | |
|---|---|
| Permission | Read on `PipelineRun` |
| Response | `PipelineRun` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/pipeline-runs/{id}?waitSeconds=60" \
  -H "Authorization: Bearer $TOKEN"
```

The stage runs themselves are ordinary runs with `kind: Pipeline` and the fields `pipelineRunId`, `pipelinePosition`, and `pipelineExecution`; `GET .../runs?pipelineRunId={id}` lists them in full.

#### `POST /v1.0/api/tenants/{tenantId}/pipeline-runs/{id}/cancel`

Cancel an active pipeline run. It moves to `Cancelling`, its pending review is cancelled, its current stage run (with the runs it delegated to) is cancelled, and it ends `Cancelled` with outcome `Cancelled`. Writes a `PipelineRunCancelled` audit record. Cancelling a pipeline run that is already `Cancelling` is accepted and finishes the cancellation.

| | |
|---|---|
| Permission | Update on `PipelineRun` |
| Response | `PipelineRun` |
| Success | 200 |
| Errors | 409 `PipelineRunFinished` when it already ended |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/pipeline-runs/{id}/cancel" \
  -H "Authorization: Bearer $TOKEN"
```

Cancelling the current stage run directly with `POST .../runs/{runId}/cancel` also cancels the pipeline run.

#### `POST /v1.0/api/tenants/{tenantId}/pipeline-runs/{id}/retry`

Resume a `Failed`, `TimedOut`, or `Cancelled` pipeline run at the stage where it stopped. That stage runs again as a new execution with a fresh attempt count, the earlier stages keep their outputs, and the deadline restarts from now. The pipeline run is `Running` again with outcome `None`.

| | |
|---|---|
| Permission | Update on `PipelineRun` |
| Response | `PipelineRun` |
| Success | 200 |
| Errors | 409 `PipelineRunNotRetryable` (active or succeeded), 409 `PipelineRunChanged` (another request changed it first; read it and try again), 409 `PipelineHistoryPruned` (retention removed the run of an earlier stage, so its output cannot be handed on; start the pipeline again) |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/pipeline-runs/{id}/retry" \
  -H "Authorization: Bearer $TOKEN"
```

A single stage run cannot be retried with `POST .../runs/{runId}/retry`: that answers 409 `PipelineStageRun`. Retry the pipeline run instead.

#### `DELETE /v1.0/api/tenants/{tenantId}/pipeline-runs/{id}`

Delete a finished pipeline run and its reviews. Its stage runs are kept (with `pipelineRunId` still set) for history and analytics. A pipeline run that is not terminal answers 409, including one a concurrent retry has just reopened; cancel it first.

| | |
|---|---|
| Permission | Delete on `PipelineRun` |
| Success | 204 |
| Errors | 409 `PipelineRunActive` |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/pipeline-runs/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

Finished pipeline runs are also removed by retention after `Runs.RetentionDays`. The runs of an active pipeline run are never pruned.

#### `GET /v1.0/api/tenants/{tenantId}/pipeline-reviews`

List stage reviews, newest first. Filters: `status` (`Pending`, `Approved`, `ChangesRequested`, `Rejected`, `Expired`, `Cancelled`), `pipelineRunId`, `pipelineId`, `runId` (the stage run under review), `decisionSource` (`User`, `Timeout`, `Cancelled`), `fromUtc`, `toUtc`, plus the [enumeration](#enumeration) parameters. For an inbox badge, ask for `status=Pending&maxResults=1` and read `totalRecords`, or follow `reviewsPending` on the WebSocket `approvals` channel.

| | |
|---|---|
| Permission | Read on `Approval` |
| Response | `EnumerationResult<PipelineReview>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/pipeline-reviews?status=Pending" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{
  "success": true,
  "maxResults": 25,
  "skip": 0,
  "totalRecords": 1,
  "recordsRemaining": 0,
  "endOfResults": true,
  "timestampUtc": "2026-10-13T18:02:30.118034Z",
  "objects": [
    {
      "id": "prv_mv5d0k9a_Hq3Lz8WcN1tYb5Ks",
      "tenantId": "default",
      "pipelineRunId": "plr_mv5d0k3q_Rk2wT8mNbX4vLq7Y",
      "pipelineId": "ppl_mv5c9r2d_Wq8LmT3xZb7KvRn",
      "pipelineName": "release-notes",
      "runStageId": "prs_mv5d0k3r_Tz4Lq8WbNm2XvKp",
      "position": 1,
      "stageName": "draft",
      "runId": "run_mv5d0k3s_9VbQx2LmT7nRp4Wz",
      "execution": 1,
      "status": "Pending",
      "timeoutAction": "Reject",
      "requestedUtc": "2026-10-13T18:01:09.098Z",
      "expiresUtc": "2026-10-13T22:01:09.098Z",
      "createdUtc": "2026-10-13T18:01:09.098Z",
      "lastUpdateUtc": "2026-10-13T18:01:09.098Z"
    }
  ]
}
```

#### `GET /v1.0/api/tenants/{tenantId}/pipeline-reviews/{id}`

Read a stage review. The output under review is the `resultText` of the run named by `runId`.

| | |
|---|---|
| Permission | Read on `Approval` |
| Response | `PipelineReview` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/pipeline-reviews/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/pipeline-reviews/{id}/decide`

Decide a pending stage review, then advance the pipeline run.

- `Approve` continues with the next stage, or ends the pipeline run `Succeeded` after the last one. The optional `comment` reaches the next stage's prompt as `pipeline.reviewNotes`.
- `RequestChanges` runs the same stage again as a new execution, with `comment` (required) as `pipeline.revision.feedback`. When the stage already used `maxRevisions` revisions, the decision answers 409 `RevisionLimitReached` and the review stays pending.
- `Reject` ends the pipeline run `Failed` with outcome `ReviewRejected`; `comment` is the optional reason.

| | |
|---|---|
| Permission | Update on `Approval` |
| Request body | `PipelineReviewDecideRequest`: `decision` (`Approve`, `RequestChanges`, or `Reject`, required), `comment` (up to 8000 characters; required for `RequestChanges`) |
| Response | `PipelineReview` |
| Success | 200 |
| Errors | 400 `ValidationFailed` (missing decision, missing comment for `RequestChanges`, comment too long); 409 `ReviewNotPending` (already decided, expired, or cancelled, or the pipeline run is cancelling or finished); 409 `RevisionLimitReached` |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/pipeline-reviews/{id}/decide" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision": "RequestChanges", "comment": "List the breaking changes first."}'
```

Decisions are compare-and-set updates, so they are safe from any replica and two people deciding at once produce one decision and one 409. Every decision a person makes writes a `PipelineReviewDecided` audit record. Undecided reviews wait indefinitely unless the stage sets `reviewTimeoutSeconds`; then the leader applies the stage's `reviewTimeoutAction` with `decisionSource: Timeout` (a timed-out `Reject` gives the review status `Expired` and the pipeline outcome `ReviewExpired`).

### Triggers

A trigger (P12.5) starts an agent run or a pipeline run on a cron schedule, when a signed webhook arrives, or when someone fires it by hand. Every fire runs as the principal that last saved the trigger and goes through the normal invocation path; the run has `kind: Trigger` and `triggerId`. [docs/TRIGGERS.md](docs/TRIGGERS.md) covers schedules, catch-up, signing, and run-as semantics; this section is the route reference.

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET /triggers` | Read on `Trigger` | `EnumerationResult<Trigger>`, 200 |
| `POST /triggers` | Create on `Trigger`, and Execute on the target | `Trigger`, 201 |
| `GET /triggers/{idOrName}` | Read on `Trigger` | `Trigger`, 200 |
| `PUT /triggers/{idOrName}` | Update on `Trigger`, and Execute on the target | `Trigger`, 200 |
| `DELETE /triggers/{idOrName}` | Delete on `Trigger` | Empty, 204 |
| `POST /triggers/{idOrName}/rotate-secret` | Update on `Trigger` | `Trigger` with `signingSecret`, 200 |
| `POST /triggers/{idOrName}/fire` | Execute on `Trigger` | `TriggerFire`, 201 |
| `GET /triggers/{idOrName}/fires` | Read on `Trigger` | `EnumerationResult<TriggerFire>`, 200 |
| `POST /triggers/{id}/webhook` | None: the `X-Garrison-Signature` header | `TriggerFire`, 202 (200 for a repeated delivery) |

Paths are relative to `/v1.0/api/tenants/{tenantId}`. Triggers of another tenant answer 404. "Execute on the target" means Execute on the trigger's agent, or Execute on its pipeline and on every stage agent of that pipeline; when it is missing the save answers 403 and nothing changes.

#### `GET /v1.0/api/tenants/{tenantId}/triggers`

List triggers with the [enumeration](#enumeration) parameters (`search` matches the name, `activeOnly` hides inactive ones) and an optional `type` (`Cron` or `Webhook`).

```bash
curl -s "http://127.0.0.1:8700/v1.0/api/tenants/default/triggers?type=Cron" -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/triggers`

Create a trigger. `agentId`, `deploymentId`, `pipelineId`, and `inputTemplateId` accept identifiers or names and are stored as identifiers. The caller becomes the run-as principal (`runAsType`, `runAsId`, `runAsName`); supplied values for those, for the identifier, and for the fire bookkeeping are ignored. A `Webhook` trigger's response carries `signingSecret`, the only time it is returned.

| | |
|---|---|
| Request body | `Trigger` |
| Response | `Trigger`, 201 |
| Errors | 400 `ValidationFailed` with field codes `ReferenceNotFound`, `DeploymentAgentMismatch`, `TemplateKindMismatch`, `TargetMismatch`, `InvalidCron`, `InvalidTimeZone`; 403 when the caller may not run the target; 409 `NameConflict` |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/triggers" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "nightly-report", "type": "Cron", "agentId": "reporter", "cronExpression": "0 6 * * *", "timeZone": "Europe/Berlin"}'
```

```json
{
  "id": "trg_mv8d1k2a_Pq7LwT2xZb9KvRm",
  "tenantId": "default",
  "name": "nightly-report",
  "type": "Cron",
  "targetType": "Agent",
  "agentId": "agt_mv1a0c4e_2nKqLw9ZtBv7XsRm",
  "priority": 0,
  "cronExpression": "0 6 * * *",
  "timeZone": "Europe/Berlin",
  "active": true,
  "runAsType": "User",
  "runAsId": "usr_mv1a0b9z_Kq2LwT7xZb3VmRn",
  "runAsName": "admin@garrison",
  "nextFireUtc": "2026-10-15T04:00:00Z",
  "fireCount": 0,
  "createdUtc": "2026-10-14T18:02:11.402118Z",
  "lastUpdateUtc": "2026-10-14T18:02:11.402118Z"
}
```

#### `PUT /v1.0/api/tenants/{tenantId}/triggers/{idOrName}`

Replace a trigger's configuration with a complete `Trigger` body. The caller becomes the run-as principal. `type` cannot change (400 with field code `TypeImmutable`); the signing secret, fire count, and last fire are kept. When the cron expression, time zone, and active flag are unchanged the scheduled `nextFireUtc` is kept; otherwise it is computed again from now, so reactivating a trigger never catches up on the time it was off.

#### `DELETE /v1.0/api/tenants/{tenantId}/triggers/{idOrName}`

Delete a trigger and its fire history. Runs it started are kept.

#### `POST /v1.0/api/tenants/{tenantId}/triggers/{idOrName}/rotate-secret`

Replace a webhook trigger's signing secret. The response carries the new `signingSecret`; the old one stops working at once. A `Cron` trigger answers 409 `NotAWebhookTrigger`. Writes a `SigningSecretRotated` audit record.

#### `POST /v1.0/api/tenants/{tenantId}/triggers/{idOrName}/fire`

Fire the trigger now, whatever its type or schedule. The optional body is a `TriggerFireRequest`; its `body` reaches the input template as `webhook.body` (and `webhook.json` when it parses as JSON). The answer is 201 with the `TriggerFire`, whose `outcome` is `Started` with a `runId` or `pipelineRunId`, or `Failed` with an `errorCode` such as `RunAsNotAuthorized`, `InputRequired`, `TemplateRenderFailed`, `InputTemplateNotFound`, `AgentNotFound`, `NoActiveDeployment`, or `QuotaExceeded`. A payload over `Triggers.WebhookMaxBodyBytes` answers 400 with field code `PayloadTooLarge`.

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/triggers/pr-review/fire" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"body": "{\"action\":\"opened\",\"number\":42}", "contentType": "application/json"}'
```

#### `GET /v1.0/api/tenants/{tenantId}/triggers/{idOrName}/fires`

List the trigger's fires, newest first, with the [enumeration](#enumeration) parameters and an optional `outcome` (`Started`, `Failed`, `Skipped`). Fires are kept for `Triggers.FireRetentionDays` (30). The runs a trigger started are also listed by `GET .../runs?triggerId={id}`.

#### `POST /v1.0/api/tenants/{tenantId}/triggers/{id}/webhook`

Deliver a webhook to a `Webhook` trigger. The route takes no token and must be addressed by the trigger identifier. It is authorized only by `X-Garrison-Signature: t=<unix seconds>,v1=<hex>`, the lowercase HMAC-SHA256 under the signing secret of `<t>.<raw body>`, with the timestamp within `Triggers.WebhookToleranceSeconds` (300) of the server clock. An optional `X-Garrison-Delivery` header (1 to 128 printable ASCII characters) makes repeats idempotent. The raw body and its `Content-Type` reach the input template as `webhook.body`, `webhook.json`, and `webhook.contentType`.

| Status | Body | When |
|---|---|---|
| 202 | `TriggerFire` | The delivery was accepted and recorded (check `outcome`) |
| 200 | `TriggerFire` with `duplicate: true` | A repeated `X-Garrison-Delivery` |
| 400 | `InvalidDeliveryId` | The delivery header is not 1 to 128 printable ASCII characters |
| 401 | `InvalidSignature` | Any verification failure, including an unknown tenant or trigger and a cron trigger |
| 409 | `TriggerInactive` | A correctly signed delivery to an inactive trigger |
| 413 | `PayloadTooLarge` | The body is larger than `Triggers.WebhookMaxBodyBytes` (262144 bytes) |

```bash
BODY='{"action":"opened","number":42}'; TS=$(date +%s)
SIG=$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/^.* //')
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/triggers/trg_mv8d1k2a_Pq7LwT2xZb9KvRm/webhook" \
  -H "Content-Type: application/json" -H "X-Garrison-Delivery: pr-42-opened" \
  -H "X-Garrison-Signature: t=$TS,v1=$SIG" --data-binary "$BODY"
```

### Agent revisions

An agent's definition is kept as revisions (AD1). Every agent starts with revision 1, published; an agent has at most one open draft; a published revision never changes. Deployments pin a revision or follow the latest published one. [docs/REVISIONS.md](docs/REVISIONS.md) explains drafts, publishing, direct edits, and diffs.

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET /agents/{idOrName}/revisions` | Read on `AgentRevision` | `EnumerationResult<AgentRevision>`, newest first, 200 |
| `POST /agents/{idOrName}/revisions` | Create on `AgentRevision` | The draft `AgentRevision`, 201 |
| `GET /agents/{idOrName}/revisions/diff?from=&to=` | Read on `AgentRevision` | `AgentRevisionDiff`, 200 |
| `GET /agents/{idOrName}/revisions/{revIdOrNumber}` | Read on `AgentRevision` | `AgentRevision`, 200 |
| `DELETE /agents/{idOrName}/revisions/{revIdOrNumber}` | Delete on `AgentRevision` | Empty, 204 |
| `POST /agents/{idOrName}/revisions/{revIdOrNumber}/publish` | Execute on `AgentRevision` | The published `AgentRevision`, 200 |

Paths are relative to `/v1.0/api/tenants/{tenantId}`. Another tenant's agents and revisions answer 404.

#### `POST /v1.0/api/tenants/{tenantId}/agents/{idOrName}/revisions`

Create the agent's draft, or replace the content of its open draft. The body carries the content fields of `AgentRevision`: `displayName`, `description`, `inputMode`, `inputSchemaJson`, `outputSchemaJson`, `delegationMode`, `delegationMaxDepth`, `delegationAllowRecursion`, `delegationAllowList`, `promptPins` (`role` `ToolDescription` or `SkillDescription`, `templateId`, optional `pinnedVersion`), `capabilities`, `tags`, and `changeNote`. Identity, number, state, and hash are assigned by the server.

| | |
|---|---|
| Errors | 400 `ValidationFailed` with fields such as `outputSchemaJson` (`InvalidJsonSchema`), `promptPins[0].templateId`, `changeNote`; 409 `Protected` for a protected built-in agent |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/researcher/revisions" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"description": "Researches one source and writes notes", "delegationMode": "None", "changeNote": "Narrower task"}'
```

```json
{
  "id": "arv_...",
  "agentId": "agt_...",
  "number": 2,
  "state": "Draft",
  "contentHash": "4f1c...",
  "description": "Researches one source and writes notes",
  "inputMode": "Text",
  "delegationMode": "None",
  "delegationMaxDepth": 2,
  "delegationAllowRecursion": false,
  "delegationAllowList": [],
  "promptPins": [],
  "capabilities": [],
  "tags": [],
  "authorName": "admin@garrison",
  "changeNote": "Narrower task",
  "createdUtc": "2026-11-02T10:00:00Z",
  "lastUpdateUtc": "2026-11-02T10:00:00Z"
}
```

#### `POST /v1.0/api/tenants/{tenantId}/agents/{idOrName}/revisions/{revIdOrNumber}/publish`

Publish a draft. Optional body `{"changeNote": "..."}` (at most 2000 characters) replaces the draft's note. The revision becomes the agent's latest published revision, and its content is copied onto the agent.

| | |
|---|---|
| Errors | 409 `RevisionUnchanged` when the content equals the latest published revision; 409 `RevisionPublished` when the revision is already published |

#### `GET /v1.0/api/tenants/{tenantId}/agents/{idOrName}/revisions/diff`

`from` and `to` take identifiers or numbers. With no `to`, the open draft is used (or the latest published revision when there is no draft); with no `from`, the published revision before `to`. The response lists `changes`: `field`, `changeType` (`Changed`, `Added`, `Removed`), `from`, and `to`.

```json
{
  "agentId": "agt_...",
  "fromNumber": 1,
  "toNumber": 2,
  "identical": false,
  "changes": [
    { "field": "description", "changeType": "Changed", "from": "Researches a topic", "to": "Researches one source and writes notes" },
    { "field": "delegationAllowList", "changeType": "Removed", "from": "researcher", "to": null }
  ]
}
```

#### `DELETE /v1.0/api/tenants/{tenantId}/agents/{idOrName}/revisions/{revIdOrNumber}`

Discard the open draft. A published revision answers 409 `RevisionPublished`.

### Agent assets

Versioned skills, reference files, document templates, and system prompts (AD2). [docs/ASSETS.md](docs/ASSETS.md) explains kinds, storage, limits, placement, and integrity checking.

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET /agent-assets?kind=&search=` | Read on `AgentAsset` | `EnumerationResult<AgentAsset>`, 200 |
| `POST /agent-assets` | Create on `AgentAsset` | `AgentAsset`, 201 |
| `GET /agent-assets/{idOrName}` | Read on `AgentAsset` | `AgentAsset`, 200 |
| `PUT /agent-assets/{idOrName}` | Update on `AgentAsset` | `AgentAsset`, 200 |
| `DELETE /agent-assets/{idOrName}` | Delete on `AgentAsset` | Empty, 204 |
| `GET /agent-assets/{idOrName}/versions` | Read on `AgentAsset` | `AgentAssetVersion[]`, newest first, 200 |
| `POST /agent-assets/{idOrName}/versions` | Create on `AgentAsset` | `AgentAssetVersion`, 201 (200 when the files equal the current version) |
| `GET /agent-assets/{idOrName}/versions/{number}` | Read on `AgentAsset` | `AgentAssetVersion`, 200 |
| `GET /agent-assets/{idOrName}/versions/{number}/files?path=` | Read on `AgentAsset` | The file's bytes with its media type, 200 |

Paths are relative to `/v1.0/api/tenants/{tenantId}`. Another tenant's assets answer 404. Workers download asset files for a leased run from `GET /v1.0/asset-download/{assetId}?ticket=`, with a download-only ticket the spec carries; it opens exactly one file.

#### `POST /v1.0/api/tenants/{tenantId}/agent-assets`

Body: `name`, `kind` (`SystemPrompt`, `Skill`, `ReferenceFile`, `DocumentTemplate`), optional `description`, `tags`, `promptTemplateId` (required for and only for `SystemPrompt`), and `artifactStoreId` (default: the Garrison database).

| | |
|---|---|
| Errors | 400 `AssetTemplateRequired`, `ValidationFailed` (name, `promptTemplateId`, `artifactStoreId`); 409 `NameConflict` |

#### `PUT /v1.0/api/tenants/{tenantId}/agent-assets/{idOrName}`

Replaces name, description, tags, and prompt template. Answers 409 `AssetKindImmutable` when the kind changes and 409 `AssetStoreImmutable` when the store changes on an asset with versions.

#### `DELETE /v1.0/api/tenants/{tenantId}/agent-assets/{idOrName}`

Deletes the asset, its versions, and its content. Answers 409 `AssetInUse`, naming the agents, while any revision pins it.

#### `POST /v1.0/api/tenants/{tenantId}/agent-assets/{idOrName}/versions`

A JSON body lists every file of the new version:

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/agent-assets/citation-style/versions" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"changeNote": "Author-date", "files": [{"path": "SKILL.md", "mediaType": "text/markdown", "contentBase64": "IyBDaXRhdGlvbnMK"}]}'
```

```json
{
  "id": "aav_...",
  "assetId": "aas_...",
  "number": 1,
  "totalBytes": 12,
  "authorName": "admin@garrison",
  "changeNote": "Author-date",
  "files": [
    { "path": "SKILL.md", "mediaType": "text/markdown", "sizeBytes": 12, "sha256": "6c1f...", "storageKey": ".garrison-assets/3b2a.../aas_.../6c1f..." }
  ],
  "createdUtc": "2026-11-03T09:00:00Z"
}
```

A single file can be sent as raw bytes with `Content-Type: application/octet-stream` and the query parameters `path`, optional `mediaType`, and optional `changeNote`. A media type left out is guessed from the extension.

| | |
|---|---|
| Errors | 400 `AssetHasNoFiles` (SystemPrompt assets), field codes `InvalidAssetPath`, `MacroFormatRefused`; 413 `AssetFileTooLarge` (`Assets.MaxFileBytes`), `AssetVersionTooLarge` (`Assets.MaxVersionBytes`), `AssetTooManyFiles` (`Assets.MaxFilesPerVersion`) |

Agent revisions pin assets in `assetPins` (`assetId` as an identifier or name, optional `version`); see [Agent revisions](#agent-revisions).

### Agentic apps

Groups of agents behind one end-user chat UI (AD6). [docs/APPS.md](docs/APPS.md) explains members, edges, delegation from the graph, app revisions and promotion, sign-in, and the app gateway.

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET /apps` | Read on `AgenticApp` | `EnumerationResult<AgenticApp>`, 200 |
| `POST /apps` | Create on `AgenticApp` | `AgenticApp`, 201 |
| `GET /apps/{idOrName}` | Read on `AgenticApp` | `AgenticApp`, 200 |
| `PUT /apps/{idOrName}` | Update on `AgenticApp` | `AgenticApp`, 200 |
| `DELETE /apps/{idOrName}` | Delete on `AgenticApp` | Empty, 204 |
| `GET /apps/{idOrName}/delegation` | Read on `AgenticApp` | `AppDelegationPlan`: each member's desired and published policy and drift, 200 |
| `POST /apps/{idOrName}/delegation` | Update on `AgenticApp` | `AppDelegationPlan` with the draft revisions written, 200 |
| `GET /apps/{idOrName}/revisions` | Read on `AgenticApp` | `AppRevision[]`, newest first, 200 |
| `POST /apps/{idOrName}/revisions` | Update on `AgenticApp` | `AppRevision` (draft) pinning every member's published revision, 201 |
| `GET /apps/{idOrName}/revisions/{idOrNumber}` | Read on `AgenticApp` | `AppRevision`, 200 |
| `POST /apps/{idOrName}/revisions/{idOrNumber}/publish` | Execute on `AgenticApp` | `AppRevision`, 200; 409 `RevisionPublished` |
| `POST /apps/{idOrName}/promote` | Execute on `Promotion` for the target | `PromotionRecord`, 201 |

Errors: 400 `ValidationFailed` with field codes `InvalidName`, `InvalidSlug`, `UnknownAgent`, `DuplicateMember`, `EntryNotMember`, `EdgeNotMember`, `SelfEdge`, `AppGraphCycle`, `UnreachableMember`, `UnknownEnvironment`, `InvalidEntryDeployment`, `InvalidColor`, `UnknownAsset`; 409 `NameConflict`, `AppSlugTaken`, `NoPublishedRevision`, `NoTargetDeployments`. Deleting an agent that belongs to an app answers 409 `AgentInUse`.

The app gateway under `/v1.0/apps/{slug}/` is for end users and authenticates with app sessions, not management tokens; see [docs/APPS.md](docs/APPS.md#the-app-gateway).

### Studio drafts

Manifest bundles designed in the studio and applied only after a person approves (AD7). [docs/STUDIO.md](docs/STUDIO.md) explains drafts, versions, diffs, the graph, `DraftApply` approvals, and the `managementAccess: Drafts` grant. Routes are under `/studio/drafts`, and the architect prompt routes under `/studio/architect-prompts` and `/studio/architects/{deploymentId}/prompt`; the tables are in [docs/STUDIO.md](docs/STUDIO.md#routes). A `DraftApply` approval is decided with `POST /approvals/{id}/decide`, which then needs Create on `Manifest` (403 `ApproverLacksPermission`) and answers 409 `DraftStale` when live configuration moved since the request.

### Fan-out groups

Groups of child runs a run started with `garrison_fan_out` (AD5); see [MCP_API.md](MCP_API.md#fan-out-and-gather) for how they are started, joined, and bounded.

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET /runs/{id}/fan-out-groups` | Read on `Run` | `FanOutGroupView[]`, the run's groups, oldest first, 200 |
| `GET /fan-out-groups/{groupId}` | Read on `FanOutGroup` | `FanOutGroupView`, 200 |
| `POST /fan-out-groups/{groupId}/cancel` | Update on `FanOutGroup` | `FanOutGroupView`; members still running are cancelled, 200 |

Paths are relative to `/v1.0/api/tenants/{tenantId}`; another tenant's group answers 404.

| Field | Meaning |
|---|---|
| `fanOutGroupId`, `parentRunId` | `fog_` identifier and the run that started the group |
| `status`, `statusReason` | `Running`, `Joined`, `TimedOut`, `BudgetExceeded`, or `Cancelled`, and why it ended |
| `joinPolicy`, `quorum` | `All`, `Any`, or `Quorum`, and the successes `Quorum` needs |
| `total`, `finished`, `succeeded`, `pending`, `failed` | Counts, and the labels of members still running and of members that did not succeed |
| `members` | Each `label`, `agent`, `runId`, `status`, `outcome`, `resultText`, `resultTruncated`, `structuredOutputJson`, `errorMessage`, `filesWritten`, `costUsd`, `tokens` |
| `costUsd`, `tokens`, `maxCostUsd`, `maxTokens`, `deadlineUtc` | Usage so far and the group's budget and deadline |
| `createdUtc`, `completedUtc` | When the group started and ended |

```bash
curl -s "http://127.0.0.1:8700/v1.0/api/tenants/default/runs/{runId}/fan-out-groups" -H "Authorization: Bearer $TOKEN"
```

### Capabilities

The capability catalog (AD4): one descriptor per agent, MCP tool, and harness built-in, with schemas and cost and latency hints. [docs/CAPABILITIES.md](docs/CAPABILITIES.md) explains derivation, tool probes, placement, and hints.

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET /capabilities?kind=&tag=&search=` | Read on `Capability` | `EnumerationResult<CapabilityDescriptor>`, ordered by kind and name, 200 |
| `GET /capabilities/{idOrName}` | Read on `Capability` | `CapabilityDescriptor`, 200 |
| `POST /capabilities` | Create on `Capability` | Manual `CapabilityDescriptor`, 201 |
| `PUT /capabilities/{id}` | Update on `Capability` | Manual `CapabilityDescriptor`, 200 |
| `DELETE /capabilities/{id}` | Delete on `Capability` | Empty, 204 |
| `POST /capabilities/refresh?mcpServerId=` | Execute on `Capability` | `CapabilityRefreshResult`, 200 |

Paths are relative to `/v1.0/api/tenants/{tenantId}`. A tenant sees its own descriptors and the shared ones (`tenantId` null, from built-in harness profiles); another tenant's descriptor answers 404. Listing first brings Agent descriptors up to date with published revisions.

| Field | Meaning |
|---|---|
| `id` | `cap_` identifier |
| `tenantId` | Owning tenant, or null for a descriptor every tenant shares |
| `name` | The agent name, `server/tool` for MCP tools, or the tool name for built-ins. Not unique across kinds |
| `kind`, `origin` | `Agent`, `McpTool`, or `HarnessBuiltIn`; `Derived` or `Manual` |
| `sourceKey`, `sourceAgentId`, `sourceRevisionId`, `sourceMcpServerId`, `sourceToolName`, `sourceHarnessProfileId`, `sourceHarnessType` | Where a derived descriptor comes from |
| `summary`, `inputSchemaJson`, `outputSchemaJson`, `tags` | What it does, its schemas as JSON text, and up to 32 tags |
| `requirements` | Node labels (`key`, `value`) a run needs when its agent uses this capability |
| `hints` | `status` (`Known` or `Unknown`), `sampleSize`, `medianDurationMs`, `p90DurationMs`, `meanCostUsd`, `windowDays`, `computedUtc`. Values are null while `Unknown` |
| `refreshWarning`, `lastRefreshedUtc` | Why the last refresh of the source failed (the content is the last good one), and when it last succeeded |

#### `POST /v1.0/api/tenants/{tenantId}/capabilities`

Body: `name`, `kind`, optional `summary`, `inputSchemaJson`, `outputSchemaJson`, `tags`, `requirements`, and `sourceAgentId`, `sourceMcpServerId`, `sourceToolName`.

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/capabilities" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "docx-to-pdf", "kind": "HarnessBuiltIn", "summary": "Converts DOCX to PDF.", "tags": ["documents"], "requirements": [{"key": "garrison.io/tool-libreoffice", "value": "true"}]}'
```

| | |
|---|---|
| Errors | 400 `InvalidJsonSchema` (field codes on `inputSchemaJson`, `outputSchemaJson`), `ValidationFailed` (field codes `InvalidTags`, `TooManyRequirements`); 409 `NameConflict` (a manual descriptor has the name); 409 `CapabilityDerived` on PUT or DELETE of a derived descriptor |

#### `POST /v1.0/api/tenants/{tenantId}/capabilities/refresh`

Refreshes Agent and HarnessBuiltIn descriptors, lists every active MCP server (stdio servers through a Ready worker with stdio diagnostics on), and recomputes hints. A server whose templates name secrets the caller may not use is skipped with an error in its entry. With `mcpServerId`, only that server is listed (404 when it is not an active server of the tenant).

```json
{ "agents": 1, "harnessBuiltIns": 0, "hints": 4, "mcpServers": [ { "mcpServerId": "mcp_...", "mcpServerName": "search", "tools": 3, "removed": 1, "warned": 0, "error": null } ] }
```

### Environments and promotions

Environments are labels on deployments (AD1.3); a tenant without a stored list uses `dev`, `staging`, `prod`. A deployment's `environment` defaults to `dev`, and its optional `agentRevisionId` pins a published revision (400 field codes `UnknownEnvironment` and `UnknownRevision`). Promotion repins every deployment of an agent in the next environment in one transaction, and rollback restores the exact previous pins. See [docs/REVISIONS.md](docs/REVISIONS.md).

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET /environments` | Read on `Deployment` | `TenantEnvironmentList`, 200 |
| `PUT /environments` | Update on `Tenant` | `TenantEnvironmentList`, 200 |
| `GET /promotions?agentId=&appId=` | Read on `Promotion` | `EnumerationResult<PromotionRecord>`, newest first, 200 |
| `POST /promotions` | Execute on `Promotion` for the target environment | `PromotionRecord`, 201 |
| `GET /promotions/{id}` | Read on `Promotion` | `PromotionRecord`, 200 |
| `POST /promotions/{id}/rollback` | Execute on `Promotion` for the promotion's target environment | `PromotionRecord` of kind `Rollback`, 201 |

#### `PUT /v1.0/api/tenants/{tenantId}/environments`

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/environments" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"environments": [{"name": "dev"}, {"name": "staging"}, {"name": "prod"}]}'
```

| | |
|---|---|
| Errors | 400 `ValidationFailed` (1 to 16 environments; names are 1 to 32 lowercase letters, digits, and hyphens starting with a letter; `draft` is reserved); 409 `EnvironmentInUse` when a removed environment still has deployments |

#### `POST /v1.0/api/tenants/{tenantId}/promotions`

Body: `agentId` (identifier or name), `sourceEnvironment`, optional `targetEnvironment` (default: the next environment), optional `agentRevisionId` (default: what the source environment runs), `allowSkip` (default false), and `note`.

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/promotions" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"agentId": "researcher", "sourceEnvironment": "staging"}'
```

```json
{
  "id": "pro_...",
  "kind": "Promote",
  "outcome": "Applied",
  "agentId": "agt_...",
  "agentRevisionId": "arv_...",
  "sourceEnvironment": "staging",
  "targetEnvironment": "prod",
  "skippedEnvironments": false,
  "actorType": "User",
  "actorName": "admin@garrison",
  "items": [
    { "deploymentId": "dep_...", "deploymentName": "researcher-prod", "agentId": "agt_...", "previousRevisionId": "arv_...", "newRevisionId": "arv_..." }
  ],
  "createdUtc": "2026-11-02T10:05:00Z"
}
```

| | |
|---|---|
| Errors | 400 `UnknownEnvironment`, `NoNextEnvironment`; 403 without Execute on `Promotion` for the target; 404 for an unknown agent or revision; 409 `PromotionOrderViolation`, `RevisionNotPublished`, `NoSourceRevision`, `AmbiguousSourceRevision`, `NoTargetDeployments` |

#### `POST /v1.0/api/tenants/{tenantId}/promotions/{id}/rollback`

Optional body `{"note": "..."}`. Answers 409 `AlreadyRolledBack` or `NotAPromotion`.

### Notification endpoints

A notification endpoint (P12.14) receives a signed JSON POST when a subscribed run, pipeline, or approval event happens in the tenant. Delivery is asynchronous and at least once, with retries and exponential backoff, and every attempt is checked against the SSRF rules. [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md) explains events, the payload, verification, retries, and the SSRF rules.

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET /notification-endpoints` | Read on `NotificationEndpoint` | `EnumerationResult<NotificationEndpoint>`, 200 |
| `POST /notification-endpoints` | Create on `NotificationEndpoint` | `NotificationEndpoint` with `signingSecret`, 201 |
| `GET /notification-endpoints/{idOrName}` | Read on `NotificationEndpoint` | `NotificationEndpoint`, 200 |
| `PUT /notification-endpoints/{idOrName}` | Update on `NotificationEndpoint` | `NotificationEndpoint`, 200 |
| `DELETE /notification-endpoints/{idOrName}` | Delete on `NotificationEndpoint` | Empty, 204 |
| `POST /notification-endpoints/{idOrName}/rotate-secret` | Update on `NotificationEndpoint` | `NotificationEndpoint` with `signingSecret`, 200 |
| `POST /notification-endpoints/{idOrName}/test` | Execute on `NotificationEndpoint` | `NotificationDelivery`, 200 |
| `GET /notification-endpoints/{idOrName}/deliveries` | Read on `NotificationEndpoint` | `EnumerationResult<NotificationDelivery>`, 200 |
| `GET /notification-endpoints/{idOrName}/deliveries/{deliveryId}` | Read on `NotificationEndpoint` | `NotificationDelivery`, 200 |

Paths are relative to `/v1.0/api/tenants/{tenantId}`. Endpoints of another tenant answer 404.

#### `POST /v1.0/api/tenants/{tenantId}/notification-endpoints`

Create an endpoint. The response carries `signingSecret`, the only time it is returned. `agentId` and `deploymentId` accept identifiers or names.

| | |
|---|---|
| Request body | `NotificationEndpoint` |
| Response | `NotificationEndpoint`, 201 |
| Errors | 400 `ValidationFailed` with field codes `InvalidUrl`, `DestinationBlocked`, `EventsRequired`, `InvalidEvent`, `ReferenceNotFound`, `DeploymentAgentMismatch`; 409 `NameConflict` |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/notification-endpoints" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "ops-alerts", "url": "https://hooks.example.com/garrison", "events": ["RunFailed", "PipelineFailed", "ApprovalRequested"]}'
```

#### `PUT /v1.0/api/tenants/{tenantId}/notification-endpoints/{idOrName}`

Replace the configuration with a complete `NotificationEndpoint` body. The signing secret is kept. Deliveries already queued are sent to the new URL on their next attempt.

#### `DELETE /v1.0/api/tenants/{tenantId}/notification-endpoints/{idOrName}`

Delete the endpoint and its delivery log. Queued deliveries are never sent.

#### `POST /v1.0/api/tenants/{tenantId}/notification-endpoints/{idOrName}/rotate-secret`

Replace the signing secret and return it once. Later attempts of queued deliveries are signed with the new secret. Writes a `SigningSecretRotated` audit record.

#### `POST /v1.0/api/tenants/{tenantId}/notification-endpoints/{idOrName}/test`

Queue a `Test` notification and make its first attempt before answering, so the returned `NotificationDelivery` already shows `status`, `lastStatusCode`, and `lastError`. Works on inactive endpoints. A retryable failure stays `Pending` and is retried on the normal schedule.

#### `GET /v1.0/api/tenants/{tenantId}/notification-endpoints/{idOrName}/deliveries`

The delivery log, newest first, with the [enumeration](#enumeration) parameters and an optional `status` (`Pending`, `Delivering`, `Succeeded`, `Failed`). Finished deliveries are kept for `Notifications.DeliveryRetentionDays` (14).

#### `GET /v1.0/api/tenants/{tenantId}/notification-endpoints/{idOrName}/deliveries/{deliveryId}`

One delivery, including the exact `payload` sent on every attempt.

### Analytics

#### `GET /v1.0/api/tenants/{tenantId}/analytics/runs`

Time-bucketed run analytics: counts, tokens, cost, and timing averages and percentiles.

| | |
|---|---|
| Permission | Read on `Run` |
| Response | `RunAnalyticsResponse` |
| Success | 200 |
| Errors | 400 when `from` is not earlier than `to`, the range needs more than 400 buckets, or a parameter is invalid |

| Query | Meaning | Default |
|---|---|---|
| `from`, `to` | ISO 8601 UTC range. A run is included when its creation time is in `[from, to)` | the last 24 hours |
| `interval` | `minute`, `hour`, `day`, `week`, or `auto` | `auto` |
| `agentId`, `harnessType`, `deploymentId` | Filters; combine them freely (`harnessType` is case-insensitive, for example `ClaudeCode`, `Codex`, `Mux`, `Generic`) | none |
| `model` | Only runs whose served model (the run's `servedModel`) equals this value. `unknown` matches runs without a recorded model. Combines with the other filters | none |
| `groupBy` | `none`, `agent`, `harness`, `model`, or `harnessModel`: one series per group | `none` |

How the response is built:

- Buckets are aligned to UTC multiples of the bucket size (days start at midnight UTC, weeks on Monday), so the first bucket can start before `from`. Every bucket in the range is returned, including empty ones: counts and sums are 0 and averages and percentiles are `null`.
- `auto` picks the smallest size from 1, 5, 10, 15, and 30 minutes; 1, 2, 3, 6, and 12 hours; 1 and 2 days; then whole weeks that gives at most 96 buckets (about 24 to 96 for most ranges). `interval` in the response is `minute`, `hour`, `day`, or `week` when the size matches one of those, and `auto` otherwise; `bucketSeconds` is always the exact size.
- Series keys are `all` (label `All runs`) without grouping, agent IDs (label: the agent's name on its newest run) for `groupBy=agent`, harness types for `groupBy=harness`, served models for `groupBy=model` (runs without a recorded model share the key and label `unknown`), and `Harness|model` (label `Harness / model`, for example key `ClaudeCode|claude-sonnet-5-5` and label `ClaudeCode / claude-sonnet-5-5`) for `groupBy=harnessModel`. The `|` separator is safe to split on because harness type names never contain it. Series are ordered by run count, largest first. `totals` covers every series.
- At most 100,000 runs are aggregated per request, newest first; `truncated` is `true` when the cap was hit, in which case the oldest runs in the range are left out.
- Aggregation happens in the server process, so the numbers are the same on Sqlite and Postgresql. Percentiles use the nearest-rank method (the smallest value with at least p percent of samples at or below it). Averages are rounded to one decimal place, `outputTokensPerSecondAvg` to two, and `costUsd` to six.

Metrics, present in `totals` and in every bucket:

| Field | Meaning |
|---|---|
| `runs` | Runs created in the bucket, in any status |
| `succeeded`, `failed`, `cancelled`, `timedOut` | Runs by terminal status (`failed` includes `Rejected`; queued and running runs count only toward `runs`) |
| `inputTokens`, `outputTokens`, `cachedTokens`, `reasoningTokens`, `costUsd`, `toolCalls` | Sums |
| `timeToFirstTokenMsAvg`, `timeToFirstTokenMsP50`, `timeToFirstTokenMsP95` | Time to first token over runs that have it |
| `delegationWaitMsAvg` | Average `delegationWaitMs` over runs that recorded it (runs that delegated nothing count as 0) |
| `timeToFirstTokenExcludingDelegationMsAvg`, `timeToFirstTokenExcludingDelegationMsP50`, `timeToFirstTokenExcludingDelegationMsP95` | Time to first token without the delegation wait before it, over runs that recorded it |
| `streamingMsAvg` | Average streaming time |
| `executionMsAvg`, `executionMsP95` | Process start to exit |
| `queueMsAvg` | Queued to leased |
| `outputTokensPerSecondAvg` | Average of the per-run `outputTokensPerSecond` over runs where it is defined |

The examples below cover the last 24 hours, computed when you run them. The `date` lines work with GNU `date` (Linux) and BSD `date` (macOS):

```bash
FROM=$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)
TO=$(date -u +%Y-%m-%dT%H:%M:%SZ)

curl -s -G "http://127.0.0.1:8700/v1.0/api/tenants/default/analytics/runs" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "from=$FROM" --data-urlencode "to=$TO" \
  --data-urlencode "interval=hour" --data-urlencode "groupBy=agent"
```

Response (abbreviated to one series and one bucket):

```json
{
  "fromUtc": "2026-10-09T00:00:00Z",
  "toUtc": "2026-10-10T00:00:00Z",
  "interval": "hour",
  "bucketSeconds": 3600,
  "truncated": false,
  "totals": {
    "runs": 5, "succeeded": 2, "failed": 1, "cancelled": 1, "timedOut": 1,
    "inputTokens": 100, "outputTokens": 1510, "cachedTokens": 10, "reasoningTokens": 5,
    "costUsd": 0.03, "toolCalls": 3,
    "timeToFirstTokenMsAvg": 400, "timeToFirstTokenMsP50": 200, "timeToFirstTokenMsP95": 1000,
    "streamingMsAvg": 1016.7, "executionMsAvg": 4750, "executionMsP95": 10000,
    "queueMsAvg": 100, "outputTokensPerSecondAvg": 500
  },
  "series": [
    {
      "key": "agt_mv2abc...",
      "label": "helper",
      "buckets": [
        {
          "startUtc": "2026-10-09T00:00:00Z",
          "runs": 2, "succeeded": 1, "failed": 1, "cancelled": 0, "timedOut": 0,
          "inputTokens": 100, "outputTokens": 510, "cachedTokens": 10, "reasoningTokens": 5,
          "costUsd": 0.01, "toolCalls": 3,
          "timeToFirstTokenMsAvg": 200, "timeToFirstTokenMsP50": 100, "timeToFirstTokenMsP95": 300,
          "streamingMsAvg": 525, "executionMsAvg": 3000, "executionMsP95": 4000,
          "queueMsAvg": 100, "outputTokensPerSecondAvg": 500
        }
      ]
    }
  ]
}
```

Filtering by model and grouping by harness and model:

```bash
curl -s -G "http://127.0.0.1:8700/v1.0/api/tenants/default/analytics/runs" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "from=$FROM" --data-urlencode "to=$TO" \
  --data-urlencode "model=claude-sonnet-5-5" --data-urlencode "groupBy=harnessModel"
```

Each series in that response has a key such as `ClaudeCode|claude-sonnet-5-5` and a label such as `ClaudeCode / claude-sonnet-5-5`; the metrics are the same as above. Use a model name your runs actually report: the `servedModel` of a recent run, or the `models` list from the dimensions endpoint below. Names with reserved characters, such as Ollama's `gpt-oss:20b`, work when they are URL-encoded, which `--data-urlencode` does.

#### `GET /v1.0/api/tenants/{tenantId}/analytics/runs/dimensions`

The distinct agents, harness types, deployments, and served models among runs in a range. Use it to fill the filter pickers for the analytics endpoint.

| | |
|---|---|
| Permission | Read on `Run` |
| Response | `RunAnalyticsDimensions` |
| Success | 200 |
| Errors | 400 when `from` is not earlier than `to` or a timestamp is invalid |

| Query | Meaning | Default |
|---|---|---|
| `from`, `to` | ISO 8601 UTC range. A run is included when its creation time is in `[from, to)` | the last 24 hours |

| Field | Meaning |
|---|---|
| `agents` | `[{ "id", "name" }]`, sorted by name. `name` is the agent's name on a run in the range, or the ID when the run has none |
| `harnesses` | Harness type names, sorted |
| `deployments` | `[{ "id", "name", "agentId" }]` for runs that have a deployment, sorted by name. `name` falls back to the ID when the deployment no longer exists |
| `models` | Served models, sorted. `unknown` stands for runs without a recorded model and can be passed back as `model=unknown` |
| `truncated` | `true` when the range held more than 100,000 runs and only the newest were scanned |

```bash
curl -s -G "http://127.0.0.1:8700/v1.0/api/tenants/default/analytics/runs/dimensions" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "from=$FROM" --data-urlencode "to=$TO"
```

`FROM` and `TO` are the variables set in the analytics example above.

Response:

```json
{
  "agents": [
    { "id": "agt_mv2abc...", "name": "helper" }
  ],
  "harnesses": ["ClaudeCode", "Codex"],
  "deployments": [
    { "id": "dep_mv2def...", "name": "helper-claude", "agentId": "agt_mv2abc..." }
  ],
  "models": ["claude-sonnet-5-5", "gpt-6.1-sol", "unknown"],
  "truncated": false
}
```

### Overview

#### `GET /v1.0/api/tenants/{tenantId}/overview`

Tenant overview for the Home page. `queued` counts every queued run; `blockedRuns` counts the queued runs whose `blockedReason` is not null (no Ready worker can run them right now). See [Blocked runs](#blocked-runs-blockedreason). `nodesByStatus` counts worker nodes and `controlNodesByStatus` counts control-plane replicas, each as `[{ "status": "Ready", "count": 2 }]`; both are cluster-wide. `leaderNodeId` names the replica that holds the maintenance leader lease, and is omitted when no replica holds an unexpired lease.

| | |
|---|---|
| Permission | Read on `Run` |
| Response | `OverviewResponse` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/overview" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/queue/summary`

Active runs grouped by agent and harness.

| | |
|---|---|
| Permission | Read on `Run` |
| Response | `List<QueueSummaryRow>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/queue/summary" \
  -H "Authorization: Bearer $TOKEN"
```

### Nodes

#### `GET /v1.0/api/nodes`

List worker nodes.

| | |
|---|---|
| Permission | Read on `Node` |
| Response | `EnumerationResult<Node>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/nodes" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/nodes/{id}`

Read a worker node.

| | |
|---|---|
| Permission | Read on `Node` |
| Response | `Node` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/nodes/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/nodes/{id}`

Change a node's capacity or pool.

| | |
|---|---|
| Permission | Update on `Node` |
| Request body | `NodeUpdateRequest` |
| Response | `Node` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/nodes/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maxConcurrentRuns": 8}'
```

#### `POST /v1.0/api/nodes/{id}/cordon`

Stop scheduling new runs on a node.

| | |
|---|---|
| Permission | Update on `Node` |
| Response | `Node` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/nodes/{id}/cordon" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/nodes/{id}/uncordon`

Resume scheduling on a node.

| | |
|---|---|
| Permission | Update on `Node` |
| Response | `Node` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/nodes/{id}/uncordon" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/nodes/{id}/drain`

Ask a node to finish its runs and stop.

| | |
|---|---|
| Permission | Update on `Node` |
| Response | `Node` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/nodes/{id}/drain" \
  -H "Authorization: Bearer $TOKEN"
```

#### `DELETE /v1.0/api/nodes/{id}`

Remove a lost or offline node.

| | |
|---|---|
| Permission | Delete on `Node` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/nodes/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Node Pools

#### `GET /v1.0/api/node-pools`

List node pools.

| | |
|---|---|
| Permission | Read on `Node` |
| Response | `EnumerationResult<NodePool>` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/node-pools" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/node-pools`

Create a node pool.

| | |
|---|---|
| Permission | Create on `NodePool` |
| Request body | `NodePool` |
| Response | `NodePool` |
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/node-pools" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "gpu", "description": "Workers with GPUs", "tenants": []}'
```

#### `GET /v1.0/api/node-pools/{id}`

Read a node pool.

| | |
|---|---|
| Permission | Read on `Node` |
| Response | `NodePool` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/node-pools/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/node-pools/{id}`

Update a node pool.

| | |
|---|---|
| Permission | Update on `NodePool` |
| Request body | `NodePool` |
| Response | `NodePool` |
| Success | 200 |

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/node-pools/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "description": "string", "active": false, "tenants": ["string"]}'
```

#### `DELETE /v1.0/api/node-pools/{id}`

Delete an empty node pool.

| | |
|---|---|
| Permission | Delete on `NodePool` |
| Success | 204 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/node-pools/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Control Nodes

Control nodes are the control-plane replicas (Command). Each replica registers its own row when it starts and heartbeats it every 5 seconds (`ControlPlane.HeartbeatIntervalMs`), so these routes are read-only. A row moves through `Starting` (initializing), `Ready` (serving), `Draining` (shutdown has begun: readiness answers 503 and streams and long polls are ending), and `Offline` (stopped cleanly, or silent for 30 seconds, `ControlPlane.OfflineAfterMs`, and marked by the leader). The leader deletes rows that have been `Offline` for 24 hours (`ControlPlane.OfflineRetentionHours`).

| Field | Meaning |
|---|---|
| `id`, `name` | The replica's node ID (`GARRISON_NODE_ID`, the pod name in Kubernetes) |
| `hostname`, `address` | Host name, and IP address with the REST port |
| `version`, `schemaVersion` | Server version, and the database schema version the replica found at startup |
| `backplane` | Event backplane the replica runs (`Local`, `Polling`, `PostgresNotify`) |
| `status` | `Starting`, `Ready`, `Draining`, or `Offline` |
| `startedUtc`, `lastHeartbeatUtc` | Process start and last heartbeat |
| `activeRequests`, `openStreams`, `heldLongPolls` | At the last heartbeat: HTTP requests in flight, open SSE streams and WebSocket connections, and worker lease long polls being held |
| `isLeader`, `leaderEpoch` | Computed from the coordination lease when the response is built: whether the replica holds the maintenance leader lease, and its fencing epoch (leader only) |
| `respondingNodeId` | Node ID of the replica that answered (top level of the list, and on a single read) |

#### `GET /v1.0/api/control-nodes`

List control-plane replicas. Supports the [enumeration](#enumeration) query parameters; `search` matches the name, and the default ordering is newest start first.

| | |
|---|---|
| Permission | Read on `Node` |
| Response | `ControlNodeListResponse` (`EnumerationResult<ControlNode>` plus `respondingNodeId`) |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/control-nodes" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{
  "respondingNodeId": "garrison-server-7d9f8c6b5-k2x4p",
  "success": true,
  "maxResults": 25,
  "skip": 0,
  "totalRecords": 2,
  "recordsRemaining": 0,
  "endOfResults": true,
  "timestampUtc": "2026-10-10T22:09:09.328739Z",
  "objects": [
    {
      "id": "garrison-server-7d9f8c6b5-k2x4p",
      "name": "garrison-server-7d9f8c6b5-k2x4p",
      "hostname": "garrison-server-7d9f8c6b5-k2x4p",
      "address": "10.42.0.17:8700",
      "version": "0.2.0",
      "schemaVersion": 7,
      "backplane": "PostgresNotify",
      "status": "Ready",
      "startedUtc": "2026-10-10T22:08:58.159396Z",
      "lastHeartbeatUtc": "2026-10-10T22:09:08.362554Z",
      "activeRequests": 1,
      "openStreams": 2,
      "heldLongPolls": 3,
      "isLeader": true,
      "leaderEpoch": 4
    },
    {
      "id": "garrison-server-7d9f8c6b5-q8w2n",
      "name": "garrison-server-7d9f8c6b5-q8w2n",
      "hostname": "garrison-server-7d9f8c6b5-q8w2n",
      "address": "10.42.0.18:8700",
      "version": "0.2.0",
      "schemaVersion": 7,
      "backplane": "PostgresNotify",
      "status": "Ready",
      "startedUtc": "2026-10-10T22:08:57.902114Z",
      "lastHeartbeatUtc": "2026-10-10T22:09:07.977031Z",
      "activeRequests": 0,
      "openStreams": 0,
      "heldLongPolls": 1,
      "isLeader": false
    }
  ]
}
```

#### `GET /v1.0/api/control-nodes/{id}`

Read a control-plane replica by node ID. The record carries `respondingNodeId`. Returns 404 when no replica has that ID.

| | |
|---|---|
| Permission | Read on `Node` |
| Response | `ControlNode` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/control-nodes/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Node Protocol

#### `POST /v1.0/api/node/register`

Register a worker node.

| | |
|---|---|
| Permission | Execute on `Node` |
| Request body | `NodeRegisterRequest` |
| Response | `NodeRegisterResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/node/register" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "version": "string", "address": "string", "maxConcurrentRuns": 0, "childReserveSlots": 0, "maxResidentWaiters": 0, "nodePool": "string", "labels": {"key": "value"}, "capabilities": [{}]}'
```

#### `POST /v1.0/api/node/heartbeat`

Worker heartbeat.

| | |
|---|---|
| Permission | Execute on `Node` |
| Request body | `NodeHeartbeatRequest` |
| Response | `NodeHeartbeatResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/node/heartbeat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "string", "activeRuns": [{}], "freeCapacity": 0, "draining": false}'
```

#### `POST /v1.0/api/node/watch`

Watch held runs for cancellation (long poll). The worker names the runs it is executing that it has not been told to cancel; the call returns as soon as any of them is cancelled (from any replica, through the event backplane) or when `waitMs` (at most 60,000) elapses, and the worker calls again. The worker restarts the watch when it starts a new run. A worker talking to an older control plane gets 404 and relies on the heartbeat.

| | |
|---|---|
| Permission | Execute on `Node` |
| Request body | `NodeWatchRequest` |
| Response | `NodeWatchResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/node/watch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "string", "runs": [{"runId": "string", "epoch": 1}], "waitMs": 25000}'
```

#### `POST /v1.0/api/node/lease`

Lease runs (long poll). Any replica can answer: a run queued on another replica wakes the wait through the event backplane. While the replica is shutting down, a waiting long poll returns with no assignments and new lease requests get 503 `Draining`, so the worker retries against another replica.

Delegated runs are handed out ahead of new top-level work. A worker with a child reserve (`childReserveSlots` at registration) keeps a second long poll with `childReserve: true` and the identifiers of the reserve runs it is executing in `reserveRunIds`. That poll only returns a queued run whose parent is waiting on it, and only while the node has an open reserve slot: one per run on the node that is waiting on a child, up to `childReserveSlots`, less the reserve runs still active.

| | |
|---|---|
| Permission | Execute on `Node` |
| Request body | `NodeLeaseRequest` |
| Response | `NodeLeaseResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/node/lease" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "string", "maxRuns": 0, "waitMs": 0, "childReserve": false, "reserveRunIds": ["string"]}'
```

#### `POST /v1.0/api/node/drain`

Report that a worker is draining.

| | |
|---|---|
| Permission | Execute on `Node` |
| Request body | `NodeHeartbeatRequest` |
| Response | `NodeAckResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/node/drain" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "string", "activeRuns": [{}], "freeCapacity": 0, "draining": false}'
```

#### `POST /v1.0/api/node/runs/{runId}/started`

Start gate. A worker calls this before it launches the harness and launches only after a 200: it moves the run from Leased to Running at the given epoch. 409 `StaleLease` means the lease was lost (expired, requeued, or claimed again) and the worker must not launch. A second call for a run already Running at the same epoch and node (for example the report of the harness process identifier) answers 200 and changes nothing.

| | |
|---|---|
| Permission | Execute on `Node` |
| Request body | `RunStartedRequest` |
| Response | `NodeAckResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/node/runs/{runId}/started" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "string", "epoch": 0, "processId": 0, "startedUtc": "2026-01-01T00:00:00Z"}'
```

#### `POST /v1.0/api/node/runs/{runId}/events`

Report run events.

| | |
|---|---|
| Permission | Execute on `Node` |
| Request body | `RunEventsRequest` |
| Response | `NodeAckResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/node/runs/{runId}/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "string", "epoch": 0, "events": [{}]}'
```

#### `POST /v1.0/api/node/runs/{runId}/complete`

Report a run finished.

| | |
|---|---|
| Permission | Execute on `Node` |
| Request body | `RunCompleteRequest` |
| Response | `RunCompleteResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/node/runs/{runId}/complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "string", "epoch": 0, "status": "Pending", "outcome": "None", "exitCode": 0, "resultText": "string", "structuredOutputJson": "string", "sessionId": "string", "servedModel": "string", "stderrTail": "string", "errorMessage": "string", "inputTokens": 0, "outputTokens": 0, "cachedTokens": 0, "costUsd": 0, "costEstimated": false, "reasoningTokens": 0, "firstTokenUtc": "2026-01-01T00:00:00Z", "lastTokenUtc": "2026-01-01T00:00:00Z", "timeToFirstTokenMs": 0, "streamingMs": 0, "executionMs": 0, "toolCallCount": 0, "completedUtc": "2026-01-01T00:00:00Z", "repairAttempt": 0, "supportsRepair": true}'
```

The timing fields (`firstTokenUtc`, `lastTokenUtc`, `timeToFirstTokenMs`, `streamingMs`, `executionMs`) are optional and may be `null`; the server stores them as reported (negative durations become 0) and computes `queueMs` and `totalMs` from its own clock.

When a successful execution's output fails validation against the agent's output schema and a repair is possible, the response carries `repair` (an `ExecutionSpec`), `repairAttempt` (1), and `eventSequenceStart`. The run stays leased to the node: the worker numbers further events after `eventSequenceStart`, runs the repair in the same run directories, and reports completion again with `repairAttempt` set to 1. A repeated report for an execution the server already answered with a repair gets the same answer again. Workers that do not send `supportsRepair: true` never receive a repair.

### A2A

#### `GET /v1.0/a2a/{tenantId}/{agentName}/.well-known/agent-card.json`

A2A agent card.

| | |
|---|---|
| Permission | Anonymous |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/a2a/default/{agentName}/.well-known/agent-card.json"
```

#### `GET /v1.0/a2a/{tenantId}`

A2A agent cards for every exposed agent in a tenant.

| | |
|---|---|
| Permission | Read on `Agent` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/a2a/default" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/a2a/{tenantId}/{agentName}`

A2A JSON-RPC endpoint (SendMessage, SendStreamingMessage, GetTask, ListTasks, CancelTask, SubscribeToTask).

| | |
|---|---|
| Permission | Authenticated; the handler checks permissions (see notes) |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/a2a/default/{agentName}" \
  -H "Authorization: Bearer $TOKEN"
```

## Notes on specific routes

**Addressing agents.** Every route under `.../agents/{idOrName}` (read, update, delete, card, and invoke) accepts the agent's identifier or its name, resolved within the tenant. An identifier match takes precedence over an agent whose name happens to equal it. When a name is used, resource-scoped permissions are checked against the resolved agent's identifier.

**Invoking agents.** `POST .../agents/{agentId}/invoke` accepts the agent's identifier or its name. With `wait` true (the default for invoke) the call holds until the run finishes or `waitSeconds` (default 60) elapses, then returns the run: 200 when it finished, 202 when it is still queued or running. `wait` and `waitSeconds` may also be passed as query parameters. Send an `Idempotency-Key` header to make retries safe: a repeated key from the same caller within 24 hours returns the original run. `parameters` must be allowed by the deployment's `allowedRunOverrides`; anything else is a 400 with field errors. Besides deployment parameters, a deployment can allow the fields `model`, `effort`, `maxTurns`, and `timeoutSeconds` (validate it with an `IntegerRange` rule, for example `"pattern": "30,1800"`); a per-run `timeoutSeconds` is still capped by `Runtime.MaxRunSeconds`. A waiting call cancels its run when the client disconnects unless `cancelOnDisconnect` is false. Every call that starts a run from caller input (invoke, conversation turns, `POST .../runs`, `POST .../deployments/{deploymentId}/test`, and pipeline start) needs a non-empty `input`: a missing body or an empty or whitespace input returns 400 `ValidationFailed` with field code `InputRequired` on `input` instead of starting a run that spends harness quota on nothing. Retrying a run (`POST .../runs/{id}/retry`) reuses the stored input and is not checked.

**Input schemas.** When the agent has an `inputSchemaJson`, the input must be a JSON document that matches it. This is checked on every surface that starts a run from caller input: invoke, `POST .../runs`, deployment tests, conversation turns, MCP (`garrison_invoke_agent`, `garrison_start_run`, and agent tools), A2A, and delegation. A mismatch is a 400 `ValidationFailed` with `fields` and `fieldCodes`. The key is `input` for the document itself, otherwise `input.` plus the path to the value, with dots between properties and `[n]` for array items: `input.topic`, `input.tags[1]`, `input.address.city`. A missing required property is reported on its own key (`input.topic`). The code is `InputNotJson` when the input does not parse as JSON and `InputSchemaViolation` for every schema failure. Send `inputContentType: "application/json"` with a structured input. Agents without an input schema take any text.

```json
{ "error": "BadRequest", "code": "ValidationFailed", "message": "The input does not match the agent's input schema.",
  "fields": { "input.topic": "is required", "input.count": "Value should be at least 1" },
  "fieldCodes": { "input.topic": "InputSchemaViolation", "input.count": "InputSchemaViolation" } }
```

Trigger agent targets apply the same schema check to the rendered trigger input; a rejected input is recorded as a failed fire with `InputNotJson` or `InputSchemaViolation`. Pipeline stages validate the fully rendered handoff task during compilation, before the system prompt is added. Their stored input remains the original caller input. An invalid handoff fails the receiving run with outcome `CompileFailed` and an error message starting with the same schema code, rather than returning an invocation-time HTTP 400. Compile preview exposes the same error. See [pipeline handoffs](docs/PIPELINES.md#the-handoff-between-stages).

**Run filters.** `GET .../runs` also accepts `status`, `agentId`, `deploymentId`, `harnessType`, `nodeId`, `parentRunId`, `rootRunId`, `conversationId`, `pipelineRunId` (the stage runs of one pipeline run), `triggerId` (runs a trigger started), `outcome`, `callerId`, `fromUtc`, and `toUtc`. `DELETE .../runs` deletes finished runs matching `status`, `agentId`, `fromUtc`, and `toUtc` (up to 1000 per call). Active runs cannot be deleted; cancel them first.

**Run events.** `GET .../runs/{id}/events?afterSequence=0&limit=500` returns events with a sequence greater than `afterSequence`, in order, plus the run's current status. Poll with the last sequence you saw to follow a run.

**Self-service.** `GET .../users/{id}` and `GET .../users/{id}/permissions` let a user read their own record and permissions without any role; reading someone else needs Read on User, or Admin on User for permissions. `GET .../credentials/{id}/permissions` answers for the credential making the call without any role, and otherwise needs Admin on Credential. `GET /v1.0/api/tenants` lists every tenant for system administrators and only the caller's tenant for everyone else. `GET /v1.0/api/server-info` and `GET /v1.0/api/observability/status` are available to any authenticated caller.

**Built-in records.** Built-in harness profiles, prompt templates, roles, and permissions have no tenant, are visible to every tenant, and cannot be changed or deleted through these routes (409 `BuiltInImmutable` or `Protected`). Clone them to customize. `POST .../prompt-templates/{id}/reset` restores a built-in's seeded content in a tenant copy.

**Secrets.** Secret values are write-only. Responses carry metadata, the last four characters, and a fingerprint, never the value.

**Credentials.** `POST .../credentials` and `POST .../credentials/{id}/rotate` return the secret key exactly once. When the caller is the administrator API key (which has no user), `userId` is required.

**Manifests.** `POST .../manifests/apply` takes a YAML or JSON body containing one or more documents (`Content-Type: application/yaml` or `application/json`); add `?dryRun=true` to validate without writing and `?allowSecretValues=true` to accept secret values. `GET .../manifests/export` returns a manifest bundle (YAML) of the whole tenant or of selected resources (`kinds`, `resources`, `followReferences`, `includeBuiltIn`), with secrets listed as requirements, never values. See `docs/MANIFESTS.md`.

**Transcripts.** `GET .../runs/{id}/transcript` and `GET .../conversations/{id}/transcript` return a Markdown or JSON transcript (`format`, `includeThinking`) as an attachment, with secrets redacted. See `docs/TRANSCRIPTS.md`.

**Settings.** `GET /v1.0/api/settings` returns every setting with its value (secrets show only whether they are set), source (`File`, `Environment`, `ConfigMap`, or `Database`), whether a change applies live or needs a restart, and whether it is editable. `PUT` takes `{"values":[{"path":"...","value":"..."}]}` and answers 400 with per-field errors when a value is rejected. `POST /v1.0/api/settings/restart` answers 202 and exits the process so the container runtime restarts it.

## Server-sent events

`GET /v1.0/api/tenants/{tenantId}/runs/{id}/events/stream` streams a run as `text/event-stream`. Pass `afterSequence` to resume; a `Last-Event-ID` header (which `EventSource` sends when it reconnects) works the same way and wins when it is higher. Any replica can serve a stream, whichever replica created the run or runs its worker.

| Event | Data |
|---|---|
| `run.event` | One `RunEvent`; the SSE `id` is its sequence |
| `run.status` | `{"status":"Running"}`, sent about every 15 seconds while the run is active |
| `run.completed` | The finished `Run`; the stream then closes |
| `server.draining` | `{}`; the replica is shutting down and closes the stream. Reconnect (to any replica) with `Last-Event-ID` to continue |

```text
id: 1
event: run.event
data: {"id":"rev_...","runId":"run_...","sequence":1,"eventType":"Lifecycle","text":"Workspace ready."}

event: run.completed
data: {"id":"run_...","status":"Succeeded","resultText":"Echo: Hello, Garrison", ...}
```

## Worker node protocol

Workers authenticate with a credential that holds the `NodeAgent` role (by default `access_garrison_node`, seeded at first start), exchange it for a session token, and then call these routes. All of them need Execute on Node. Run-scoped calls carry the run's fencing `epoch`; when the epoch or node no longer matches, the server answers 409 `StaleLease` and the worker must stop the harness.

| Call | Purpose |
|---|---|
| `POST /v1.0/api/node/register` | Register or re-register by node name with labels, capacity, version, and harness capabilities. Returns the node identifier and the heartbeat, lease wait, and lease duration to use. |
| `POST /v1.0/api/node/heartbeat` | Report held leases and free capacity. Extends held leases and returns runs to cancel (`cancelRunIds`), leases the node lost (`lostRunIds`), and whether to drain. |
| `POST /v1.0/api/node/lease` | Long poll for up to `maxRuns` runs, waiting up to `waitMs`. Each assignment carries the run identifier, the epoch, the lease expiry, and the compiled `ExecutionSpec`. |
| `POST /v1.0/api/node/tool-probes` | The tool probes the worker runs before it registers (AD4.4): one per tool name across every active harness profile, with a hash. The worker reports the tools it finds as node labels `garrison.io/tool-{name}=true`; heartbeat responses carry `toolProbeHash`, and the worker fetches the probes again when it changes. Requires the node credential. |
| `POST /v1.0/api/node/runs/{runId}/started` | Start gate: the worker asks before it launches the harness, and launches only when the server answers 200, which moves the run from Leased to Running. A worker that cannot get the acknowledgement before its lease expires abandons the run without launching it. |
| `POST /v1.0/api/node/runs/{runId}/events` | A batch of normalized events with worker-assigned sequences starting after the assignment's `eventSequenceStart` (1 for a run with no events yet). Re-sent sequences are ignored. |
| `POST /v1.0/api/node/runs/{runId}/artifacts` | Upload an internal checkpoint or prepared workspace as `application/octet-stream`, with `nodeId`, `tenantId`, `storeId`, `name`, `epoch`, and `repairAttempt` query parameters. Requires the bound node credential and current live lease; ordinary run and administrator artifact uploads cannot use the reserved `.garrison/` namespace. |
| `POST /v1.0/api/node/runs/{runId}/files` | Write one file the run produced back to its file space (AD3), as `application/octet-stream`, with `nodeId`, `tenantId`, `path`, `baseVersion` (the version the run downloaded, 0 for a new file), `epoch`, and `repairAttempt` query parameters; the media type is guessed from the path. Requires the bound node credential and the current live lease; a stale lease answers 409 `StaleFileUpload`. Answers a `FileSpaceUploadResult`, with `conflict` true when the file changed since `baseVersion`. See [docs/FILE_SPACES.md](docs/FILE_SPACES.md). |
| `POST /v1.0/api/node/runs/{runId}/complete` | Terminal status, outcome, result, structured output, usage, cost, session identifier, served model, exit code, and stderr tail. The response may carry a structured output repair to run in the same lease (see the route above). |
| `POST /v1.0/api/node/drain` | The worker is draining (body is a heartbeat). The node becomes Draining, or Offline when it holds no runs. |

When a lease expires, the leader's reaper requeues a run that is still Leased (it never started, so no harness ran), and treats a Running run by the `effectPolicy` the run was admitted under: `AtMostOnce` (the default) and `Journaled` fail it with `NodeLost`, `AtLeastOnce` requeues it while attempts remain (see [Effect policy](#effect-policy-effectpolicy)). Every requeue revokes the run tokens minted for the expired attempt, and run tokens only work while the run is active at the lease epoch they were minted for (see `docs/SECURITY.md`).

The `ExecutionSpec` is fully resolved: executable, argument list, environment, files, stdin, workspace instructions, parser, timeouts, MCP pre-flight checks, and values to scrub. Paths in it use the placeholders `$GARRISON_CONFIG_DIR`, `$GARRISON_WORKSPACE_DIR`, and `$GARRISON_HOME_DIR`, which the worker replaces with the run's directories. See `docs/HARNESSES.md`.

## Models

These are the request and response types referenced above. Fields marked with `?` may be null and are then omitted from responses.

#### `Agent`

Named agent capability exposed by Garrison.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `name` | `string` | DNS-safe agent name, unique per tenant. |
| `displayName` | `string?` | Display name. |
| `description` | `string?` | Description. |
| `kind` | `AgentKindEnum` | Hosted or remote. |
| `agentVersion` | `string?` | Agent version string advertised in the A2A card. |
| `exposeA2A` | `bool` | Whether the agent is exposed over A2A. |
| `exposeMcpTool` | `bool` | Whether the agent is offered as its own MCP tool to callers in its tenant (see `MCP_API.md`). |
| `mcpToolName` | `string?` | MCP tool name; null uses the agent name. 1 to 64 letters, digits, underscores, dots, and hyphens, not starting with `garrison_`. |
| `toolDescriptionTemplateId` | `string?` | Template for the MCP tool description; null uses the tenant's `mcp-tool-description` template or `builtin/mcp-tool-description`. |
| `skillDescriptionTemplateId` | `string?` | Template for the A2A skill description. |
| `inputMode` | `AgentInputModeEnum` | Input mode. |
| `inputSchemaJson` | `string?` | JSON Schema for structured input (unmanaged JSON). Must be a valid JSON Schema when saved (field code `InvalidJsonSchema`). When set, every invocation's input must be a JSON document that matches it (field codes `InputNotJson` and `InputSchemaViolation`; see Input schemas under Notes on specific routes), the A2A card advertises `application/json` input, and the dashboard's Invoke page shows a form built from it. |
| `outputSchemaJson` | `string?` | JSON Schema for structured output (unmanaged JSON). Must be a valid JSON Schema when saved (field code `InvalidJsonSchema`). When set, each run's final output is validated against it, with one repair attempt when the harness can resume (see [Structured output validation](#structured-output-validation-outputschemavalid-schemavalidationerrors-repairattempts)). |
| `delegationMode` | `DelegationModeEnum` | Delegation mode. |
| `delegationMaxDepth` | `int` | Maximum delegation depth below this agent. Minimum 0, maximum 10, default 2. |
| `delegationAllowRecursion` | `bool` | Whether an agent may appear twice in a delegation chain. |
| `remoteProtocol` | `RemoteProtocolEnum?` | Protocol for remote agents. |
| `remoteEndpointUrl` | `string?` | Endpoint URL for remote agents. |
| `remoteCredentialSecretId` | `string?` | Secret used to call a remote agent. |
| `lastRegisteredUtc` | `DateTime?` | Last self-registration (UTC). |
| `registrationTtlSeconds` | `int` | Self-registration time to live; 0 means no expiry. Minimum 0, maximum 31536000. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `skills` | `List<AgentSkillDefinition>` | A2A skills. |
| `tags` | `List<string>` | Tags. |
| `delegationAllowList` | `List<string>` | Agent names this agent may delegate to when the mode is AllowList. |

#### `AgentKindEnum`

`Hosted`, `Remote`

#### `AgentInputModeEnum`

`Text`, `Structured`

#### `DelegationModeEnum`

`None`, `AllowList`, `Any`

#### `RemoteProtocolEnum`

`A2A`, `Mcp`

#### `AgentSkillDefinition`

Child record of Agent: a2A skills.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `agentId` | `string` | Parent Agent identifier. |
| `skillId` | `string` | Skill identifier. |
| `name` | `string` | Skill name. |
| `description` | `string?` | Skill description. |

#### `Approval`

A permission request relayed from a harness and its decision (P12.3). See [Approvals](#approvals).

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (`apr_`). |
| `tenantId` | `string` | Tenant identifier. |
| `runId` | `string` | Run that asked. Empty for `DraftApply`. |
| `draftId` | `string?` | Studio draft to apply, for `DraftApply`. |
| `rootRunId` | `string?` | Root of the run's delegation tree, or null for a root run. |
| `agentId` | `string` | Agent of the run. |
| `agentName` | `string` | Agent name at request time. |
| `deploymentId` | `string` | Deployment whose rules were evaluated. |
| `leaseEpoch` | `long` | Lease epoch of the run attempt that asked. |
| `harnessType` | `HarnessTypeEnum` | Harness type of the run. |
| `kind` | `ApprovalKindEnum` | Where the request came from. |
| `toolName` | `string` | Tool the rules were evaluated against (Codex commands are `Bash`, Codex file changes `Edit`). |
| `toolCallId` | `string?` | The harness's tool call identifier. |
| `inputPreview` | `string?` | Tool input JSON with secrets redacted, at most 4,000 characters. |
| `summary` | `string?` | One-line summary (command, URL, paths, or query), redacted, at most 500 characters. |
| `suggestedRule` | `string?` | A rule pattern covering the request, used by remember. |
| `status` | `ApprovalStatusEnum` | State. |
| `decision` | `ApprovalDecisionEnum?` | What the harness was told; null while pending. |
| `decisionSource` | `ApprovalSourceEnum?` | Who or what decided; null while pending. |
| `ruleId` | `string?` | Rule that matched. |
| `rulePattern` | `string?` | Pattern of the rule that matched. |
| `rememberedRuleId` | `string?` | Rule added by a decision with remember. |
| `decidedBy` | `string?` | Name of the principal that decided, `rule ...`, `deployment default`, or `garrison`. |
| `decidedById` | `string?` | User or credential identifier of the decider. |
| `reason` | `string?` | Reason given with the decision, or the reason Garrison decided. |
| `timeoutDecision` | `ApprovalDecisionEnum` | Decision applied on expiry. |
| `requestedUtc` | `DateTime` | When the harness asked. |
| `decidedUtc` | `DateTime?` | When it was decided. |
| `expiresUtc` | `DateTime?` | When a pending approval expires. |
| `waitMs` | `long?` | Milliseconds from request to decision. Computed. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `ApprovalStatusEnum`

`Pending`, `Approved`, `Denied`, `Expired`, `Cancelled`

#### `ApprovalDecisionEnum`

`Allow`, `Deny`

#### `ApprovalSourceEnum`

`Rule`, `Default`, `User`, `Timeout`, `Cancelled`

#### `ApprovalKindEnum`

`Tool` (Claude Code permission prompt), `Command` (Codex app-server command approval), `FileChange` (Codex app-server file change approval), `DraftApply` (applying a studio draft; no run, `draftId` set, see [docs/STUDIO.md](docs/STUDIO.md#applying-a-draft))

#### `ApprovalRuleActionEnum`

`Allow`, `Deny`, `Ask`

#### `ApprovalDecideRequest`

| Field | Type | Description |
|---|---|---|
| `decision` | `ApprovalDecisionEnum` | `Allow` or `Deny`. Required. |
| `reason` | `string?` | Optional reason, at most 4,000 characters. |
| `remember` | `bool` | Also add a rule to the deployment. Default false. |
| `rulePattern` | `string?` | Pattern of the remembered rule; null uses the approval's `suggestedRule`. |

#### `ApprovalCheckRequest`

| Field | Type | Description |
|---|---|---|
| `toolName` | `string` | Tool name. Required. |
| `input` | `object?` | Tool input fields: `command`, `cwd`, `url`, `file_path`, `notebook_path`, `path`, `paths`, `pattern`, `query`. |

#### `ApprovalCheckResponse`

| Field | Type | Description |
|---|---|---|
| `action` | `ApprovalRuleActionEnum` | What the rules would do. |
| `source` | `ApprovalSourceEnum` | `Rule` or `Default`. |
| `ruleId` | `string?` | Matching rule. |
| `rulePattern` | `string?` | Matching rule pattern. |
| `suggestedRule` | `string?` | A rule pattern covering the request. |
| `approvalsEnabled` | `bool` | Whether the deployment has approvals enabled. |

#### `ArtifactStore`

Where run artifacts are stored.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `name` | `string` | Store name. |
| `description` | `string?` | Description. |
| `kind` | `ArtifactStoreKindEnum` | Store kind. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `ArtifactStoreKindEnum`

`Database`, `Filesystem`, `S3`

#### `AssignmentRequest`

Role assignment request for a user or credential.

| Field | Type | Description |
|---|---|---|
| `userId` | `string?` | User identifier (user role assignments). |
| `credentialId` | `string?` | Credential identifier (credential scope assignments). |
| `roleId` | `string?` | Role identifier. |
| `roleName` | `string?` | Role name, used when RoleId is omitted. |
| `resourceScope` | `ResourceScopeEnum?` | Tenant or Resource scope. Default Tenant. |
| `resourceId` | `string?` | Resource identifier for Resource scope. |
| `inheritsToChildren` | `bool?` | Whether tenant-scoped grants apply to resources. Default true. |
| `active` | `bool?` | Whether the assignment is active. |

#### `ResourceScopeEnum`

`Tenant`, `Resource`

#### `AuditPage`

Page of audit records.

| Field | Type | Description |
|---|---|---|
| `pageNumber` | `int` | Page number. |
| `pageSize` | `int` | Page size. |
| `totalCount` | `long` | Total matching records. |
| `totalPages` | `int` | Total pages. |
| `objects` | `List<Garrison.Core.Models.AuditRecord>` | Records. |

#### `AuditRecord`

Security and configuration audit record.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string?` | Tenant identifier. Null for global or built-in records. |
| `eventType` | `AuditEventTypeEnum` | Event type. |
| `requestId` | `string?` | Request identifier. |
| `correlationId` | `string?` | Correlation identifier. |
| `traceId` | `string?` | Trace identifier. |
| `authScheme` | `AuthSchemeEnum?` | Authentication scheme. |
| `principalType` | `PrincipalTypeEnum?` | Principal type. |
| `principalId` | `string?` | Principal identifier. |
| `principalName` | `string?` | Principal display name. |
| `sessionId` | `string?` | Session identifier. |
| `resourceType` | `string?` | Resource type involved. |
| `resourceId` | `string?` | Resource identifier involved. |
| `operation` | `string?` | Operation involved. |
| `requestType` | `string?` | Classified request type. |
| `method` | `string?` | HTTP method or protocol verb. |
| `path` | `string?` | Request path or tool name. |
| `sourceIp` | `string?` | Source IP address. |
| `authResult` | `AuthResultEnum?` | Authentication result. |
| `authorizationResult` | `AuthorizationResultEnum?` | Authorization result. |
| `reason` | `string?` | Denial or change reason. |
| `bypassReason` | `string?` | Bypass reason when authorization was skipped. |
| `statusCode` | `int` | Response status code, when applicable. |
| `description` | `string?` | Short description. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `AuditEventTypeEnum`

`AuthSuccess`, `AuthFailure`, `SessionIssued`, `SessionRevoked`, `CredentialCreated`, `CredentialRotated`, `CredentialUsed`, `AuthorizationDenied`, `AuthorizationBypass`, `RoleChanged`, `PermissionChanged`, `AssignmentChanged`, `ConfigurationChanged`, `SecretChanged`, `SettingsChanged`, `RestartRequested`, `ManifestApplied`, `NodeRegistered`, `NodeStatusChanged`, `RunCancelled`, `ConversationDeleted`, `ApprovalDecided`, `PipelineReviewDecided`, `PipelineRunCancelled`, `SigningSecretRotated`

#### `AuthSchemeEnum`

`BearerToken`, `XToken`, `PasswordHeaders`, `AccessKeySecret`, `AccessKeySignature`, `AdminApiKey`, `RunToken`

#### `PrincipalTypeEnum`

`Administrator`, `User`, `Credential`, `Run`

#### `AuthResultEnum`

`Success`, `NotFound`, `Inactive`, `Invalid`

#### `AuthorizationResultEnum`

`Permitted`, `DeniedExplicit`, `DeniedImplicit`, `NotFound`, `Conflict`

#### `CloneRequest`

Clone a record under a new name.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Name of the new record. |

#### `CompilePreviewRequest`

Compile preview input.

| Field | Type | Description |
|---|---|---|
| `input` | `string` | Sample input message. |
| `parameters` | `Dictionary<string, string>` | Sample run parameters. |

#### `CompilePreviewResponse`

Compile preview with secret values redacted.

| Field | Type | Description |
|---|---|---|
| `spec` | `Garrison.Core.Compilation.ExecutionSpec` | Execution spec. |
| `templateVersions` | `List<Garrison.Core.Models.RunTemplateVersion>` | Template versions used. |
| `commandLine` | `string` | Shell-quoted command line for display only. |

#### `ExecutionSpec`

Fully resolved instructions for one harness invocation. Compiled by the control plane and sent to the worker with the lease; the worker never renders templates or reads the database. Directory contract: the compiler emits the tokens in <see cref="ExecutionPlaceholders"/> ($GARRISON_CONFIG_DIR, $GARRISON_WORKSPACE_DIR, $GARRISON_HOME_DIR) and the worker replaces them with its per-run absolute paths in Executable, Arguments, Environment values, Files paths and content, Stdin, and McpPreflight before launch.

| Field | Type | Description |
|---|---|---|
| `runId` | `string` | Run identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `agentName` | `string` | Agent name. |
| `deploymentId` | `string` | Deployment identifier. |
| `harnessType` | `HarnessTypeEnum` | Harness type. |
| `executable` | `string` | Executable. |
| `arguments` | `List<string>` | Final argument list, passed with ArgumentList and never through a shell. |
| `environment` | `List<ExecutionEnvironmentVariable>` | Environment variables added to the allowlisted base environment. |
| `files` | `List<ExecutionFile>` | Files to materialize. |
| `stdin` | `string?` | Text written to stdin before it is closed. Null closes stdin immediately. |
| `workspace` | `ExecutionWorkspace` | Workspace preparation. |
| `parser` | `OutputParserEnum` | Output parser. |
| `parserOptions` | `ExecutionParserOptions` | Generic parser options. |
| `resultSource` | `ResultSourceEnum` | Result source. |
| `resultFileName` | `string?` | Result file name in the config directory, for LastMessageFile. |
| `successPolicy` | `SuccessPolicyEnum` | Success policy. |
| `successExitCodes` | `List<int>` | Successful exit codes. |
| `timeoutSeconds` | `int` | Deadline in seconds from start: the deployment's `timeoutSeconds` (or the per-run `timeoutSeconds` parameter when the deployment allows it), else the profile default, capped by `Runtime.MaxRunSeconds`. |
| `killGraceSeconds` | `int` | Seconds between graceful stop and process tree kill. |
| `maxOutputBytes` | `long` | Maximum stdout bytes. |
| `stderrTailBytes` | `int` | Retained stderr tail bytes. |
| `repetitionGuard` | `bool` | Run guard: stop with RepetitionDetected when assistant text degenerates. From the deployment, else `Runtime.RepetitionGuard`. Default true. |
| `maxAssistantChars` | `long` | Run guard: most characters of assistant text before OutputLimitExceeded; 0 is unlimited. From the deployment, else `Runtime.MaxAssistantChars`. Default 200,000. |
| `noProgressSeconds` | `int` | Run guard: seconds without progress (while no tool call is open) before NoProgress; 0 turns it off. From the deployment, else `Runtime.NoProgressSeconds`. Default 300. |
| `isolateHome` | `bool` | Whether the run gets its own HOME directory. |
| `mcpPreflight` | `List<ExecutionMcpCheck>` | MCP pre-flight checks. |
| `scrubValues` | `List<string>` | Values to redact from stderr, events, and logs. |
| `traceParent` | `string?` | W3C traceparent for span correlation. |
| `retainForRepair` | `bool` | Whether the worker keeps the run directories after a successful execution because a structured output repair may follow (the agent has an output schema and the profile supports resume). Default false. |
| `repairAttempt` | `int` | 0 for the original execution, 1 for a structured output repair, which reuses the original directories and skips workspace preparation. Default 0. |
| `executor` | `RunExecutorEnum` | `Process` (subprocess) or `KubernetesJob` (a Job per run). From the run. |
| `podResources` | `RunPodResources?` | Run pod requests and limits from the deployment for KubernetesJob runs; null otherwise. |

#### `HarnessTypeEnum`

`ClaudeCode`, `Codex`, `Mux`, `GeminiCli`, `Generic`, `ProviderApi`, `OpenCode`, `Pi`

#### `ExecutionEnvironmentVariable`

Resolved environment variable or header for a run.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Name. |
| `value` | `string` | Value (may be secret). |
| `isSecret` | `bool` | Whether the value is secret and must be scrubbed from logs. |

#### `ExecutionFile`

Resolved file materialized before launch.

| Field | Type | Description |
|---|---|---|
| `baseDirectory` | `FileBaseDirectoryEnum` | Base directory. |
| `path` | `string` | Path relative to the base directory. Must not escape it. |
| `content` | `string` | Content. |
| `mode` | `string?` | Optional octal mode, for example 600. |
| `isSecret` | `bool` | Whether the content is secret. |

#### `FileBaseDirectoryEnum`

`Config`, `Workspace`, `Home`

#### `ExecutionWorkspace`

Workspace preparation instructions.

| Field | Type | Description |
|---|---|---|
| `kind` | `WorkspaceKindEnum` | Kind. |
| `gitUrl` | `string?` | Repository URL for GitRepository workspaces. |
| `gitRef` | `string?` | Branch, tag, or commit. |
| `gitDepth` | `int` | Clone depth; 0 means full history. |
| `gitUsername` | `string?` | Git username when credentials are bound. |
| `gitPassword` | `string?` | Git password or token when credentials are bound (secret). |
| `files` | `List<ExecutionWorkspaceFile>` | Seeded files. |
| `retention` | `WorkspaceRetentionEnum` | Retention policy. |
| `persistentVolumeClaim` | `string?` | PersistentVolumeClaim mounted at the workspace path, for PersistentVolume workspaces (KubernetesJob runs only). |

#### `WorkspaceKindEnum`

`Empty`, `GitRepository`, `Seeded`, `PersistentVolume`

`PersistentVolume` mounts an existing PersistentVolumeClaim (the template's `persistentVolumeClaim`, in the worker's run namespace) at the run pod's workspace path. Its contents persist across runs and retention never deletes them. Only deployments with executor `KubernetesJob` may use it.

#### `RunExecutorEnum`

`Process`, `KubernetesJob`

`Process` runs the harness as a subprocess of the worker. `KubernetesJob` runs it in its own Job and pod (see `docs/KUBERNETES.md`, "Pod-per-run executor"); only workers that report the `KubernetesJob` executor claim such runs.

#### `RunPodResources`

Requests and limits of a KubernetesJob run pod, as Kubernetes quantities (`500m`, `2`, `512Mi`, `4Gi`). Null fields use the worker's defaults. A request may not exceed its limit.

| Field | Type | Description |
|---|---|---|
| `cpuRequest` | `string?` | CPU request. |
| `cpuLimit` | `string?` | CPU limit. |
| `memoryRequest` | `string?` | Memory request. |
| `memoryLimit` | `string?` | Memory limit; a pod that exceeds it is OOMKilled and the run fails with `PodFailed`. |
| `ephemeralStorageRequest` | `string?` | Ephemeral storage request (covers the emptyDir workspace, home, and temporary directories). |
| `ephemeralStorageLimit` | `string?` | Ephemeral storage limit. |

#### `ExecutionWorkspaceFile`

Seeded workspace file.

| Field | Type | Description |
|---|---|---|
| `path` | `string` | Path relative to the workspace. |
| `content` | `string` | Content. |

#### `WorkspaceRetentionEnum`

`Delete`, `Keep`, `KeepOnFailure`

#### `OutputParserEnum`

`ClaudeStreamJson`, `CodexJsonl`, `MuxJsonl`, `GeminiStreamJson`, `GenericJsonl`, `PlainText`, `CodexAppServer`

#### `ExecutionParserOptions`

Options for the GenericJsonl parser.

| Field | Type | Description |
|---|---|---|
| `textField` | `string?` | Dotted path of assistant text. |
| `finalField` | `string?` | Dotted path of final result text. |
| `successField` | `string?` | Dotted path whose value indicates success. |
| `successValue` | `string?` | Success field value meaning success. |

#### `ResultSourceEnum`

`ParserFinalEvent`, `LastMessageFile`, `Stdout`

#### `SuccessPolicyEnum`

`FinalEvent`, `ExitCode`, `FinalEventAndExitCode`

#### `ExecutionMcpCheck`

MCP pre-flight check the worker runs before launching the harness.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Server name. |
| `url` | `string` | Base URL. |
| `path` | `string` | MCP path. |
| `headers` | `List<ExecutionEnvironmentVariable>` | Resolved HTTP headers (may contain secrets). |
| `requiredTools` | `List<string>` | Tools that must be listed. |
| `required` | `bool` | Whether failure fails the run. |

#### `RunTemplateVersion`

Child record of Run: prompt template versions used to compile the run.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `runId` | `string` | Parent Run identifier. |
| `templateId` | `string` | Template identifier. |
| `templateName` | `string` | Template name. |
| `version` | `int` | Version. |

#### `Credential`

Non-interactive principal (access key and secret) owned by a user.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `userId` | `string` | Owning user identifier. |
| `name` | `string` | Human-readable name. |
| `accessKey` | `string` | Public access key. |
| `secretKeyLast4` | `string?` | Last four characters of the secret key. |
| `authMode` | `CredentialAuthModeEnum` | Authentication mode. |
| `lastUsedUtc` | `DateTime?` | Last use timestamp (UTC). |
| `expiresUtc` | `DateTime?` | Expiration timestamp (UTC). |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `CredentialAuthModeEnum`

`DirectHeader`, `SignedRequest`, `SessionExchange`, `Hybrid`

#### `CredentialCreateResponse`

Created or rotated credential. The secret key is shown only in this response.

| Field | Type | Description |
|---|---|---|
| `credential` | `Garrison.Core.Models.Credential` | Credential record. |
| `accessKey` | `string` | Access key. |
| `secretKey` | `string` | Secret key. Store it now; it is never returned again. |

#### `CredentialRequest`

Credential create or update request.

| Field | Type | Description |
|---|---|---|
| `name` | `string?` | Credential name. Required on create. |
| `userId` | `string?` | Owning user. Defaults to the caller's user. |
| `authMode` | `CredentialAuthModeEnum?` | Authentication mode. |
| `expiresUtc` | `DateTime?` | Expiration (UTC). |
| `active` | `bool?` | Whether the credential is active. |
| `roleName` | `string?` | Optional built-in or custom role to grant at tenant scope on create. |

#### `CredentialScopeAssignment`

Assignment of a role to a credential at a scope.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `credentialId` | `string` | Credential identifier. |
| `roleId` | `string?` | Role identifier. |
| `roleName` | `string?` | Built-in role name fallback. |
| `resourceScope` | `ResourceScopeEnum` | Tenant or resource scope. |
| `resourceId` | `string?` | Target resource identifier when resource-scoped. |
| `inheritsToChildren` | `bool` | Whether a tenant-scoped grant flows to resources in the tenant. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `DatabaseTestResponse`

Database connectivity test result.

| Field | Type | Description |
|---|---|---|
| `ok` | `bool` | Whether the database answered. |
| `provider` | `string` | Provider. |
| `message` | `string?` | Detail. |

#### `DeleteCountResponse`

Bulk delete result.

| Field | Type | Description |
|---|---|---|
| `deletedCount` | `long` | Records deleted. |

#### `Deployment`

Binds an agent to a harness profile, prompts, resources, placement, and limits.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `agentId` | `string` | Agent identifier. |
| `name` | `string` | Deployment name, unique per tenant. |
| `description` | `string?` | Description. |
| `harnessProfileId` | `string` | Harness profile identifier. |
| `model` | `string?` | Model name passed to the harness. |
| `fallbackModel` | `string?` | Fallback model. |
| `effort` | `string?` | Reasoning effort. |
| `maxTurns` | `int?` | Maximum agent turns. |
| `maxBudgetUsd` | `double?` | Maximum spend per run in USD where the harness supports it. |
| `maxConcurrentRuns` | `int` | Maximum concurrent runs; 0 means unlimited. A delegated run's ancestors in the same deployment that are waiting on a descendant are not counted when it is claimed, so a parent and its child in one deployment cannot deadlock. Minimum 0, maximum 100000. |
| `timeoutSeconds` | `int?` | Run deadline override. Capped by the cluster setting `Runtime.MaxRunSeconds` (default 3600). |
| `repetitionGuard` | `bool?` | Run guard: stop runs whose assistant text degenerates into repetition (outcome RepetitionDetected). Null uses `Runtime.RepetitionGuard` (default true). |
| `maxAssistantChars` | `long?` | Run guard: most characters of assistant text per run (outcome OutputLimitExceeded); 0 is unlimited. Null uses `Runtime.MaxAssistantChars` (default 200,000). Minimum 0, maximum 100,000,000. |
| `noProgressSeconds` | `int?` | Run guard: seconds without progress before a run stops (outcome NoProgress); 0 turns it off. Null uses `Runtime.NoProgressSeconds` (default 300). Minimum 0, maximum 86,400. |
| `maxAttempts` | `int` | Maximum attempts. Minimum 1, maximum 10, default 1. |
| `effectPolicy` | `DeploymentEffectPolicyEnum` | What happens to a run that was already Running when its node was lost: `AtMostOnce` (default for new deployments) fails it with `NodeLost`, `AtLeastOnce` requeues it while attempts remain, `Journaled` behaves as `AtMostOnce` until the effect journal exists. For KubernetesJob runs this also covers a run pod that was evicted or deleted from outside Garrison. See [Effect policy](#effect-policy-effectpolicy). |
| `retryOnNodeLoss` | `bool` | Deprecated; use `effectPolicy`. Responses carry it as a derived value, `true` only for `AtLeastOnce`. Still accepted on input for one release: `true` maps to `AtLeastOnce` and `false` to `AtMostOnce` when `effectPolicy` is absent; disagreeing with a supplied `effectPolicy` is a 400 (`EffectPolicyConflict`). |
| `weight` | `int` | Traffic weight among the agent's active deployments. Minimum 0, maximum 1000, default 100. |
| `nodePoolId` | `string?` | Required node pool. |
| `executor` | `RunExecutorEnum?` | `Process` or `KubernetesJob`. Null uses the node pool's `defaultExecutor`, then `Process`; for an `Untrusted` deployment or one with `egressRules`, null never resolves to `Process` and uses `KubernetesJob`. A PersistentVolume workspace template requires `KubernetesJob`. `Process` on an `Untrusted` deployment is rejected (`UntrustedNeedsIsolation`), and on a deployment with `egressRules` too (`EgressRulesNeedKubernetesJob`). |
| `trustLevel` | `DeploymentTrustLevelEnum` | `Trusted` (default) or `Untrusted`. Untrusted runs need at least `Container` isolation and queue with `NoIsolatingWorker` until a worker can provide it. See [Deployment trust level](#deployment-trust-level-trustlevel). |
| `managementAccess` | `ManagementAccessEnum` | `None` (default) or `Drafts`. With `Drafts`, this deployment's runs may read design configuration and create and edit studio drafts for the person who started them, within that person's permissions. They can never apply a draft, decide its approval, delete live resources, or read secrets. See [docs/STUDIO.md](docs/STUDIO.md#delegated-management). |
| `architectPromptTemplateId`, `architectPromptVersion` | `string?`, `int?` | On create only, for architect deployments: the architect prompt to bind as the `System` prompt, and an optional pinned version. A deployment of `agent-architect` without them binds `builtin/agent-architect`. See [docs/PROMPTS.md](docs/PROMPTS.md#architect-prompts). |
| `egressRules` | `DeploymentEgressRule[]` | Egress allowlist; empty (default) means none. With rules, run pods reach only DNS, the Garrison MCP port, and these rules, and runs need a worker that enforces them. At most 64. See [Deployment egress allowlist](#deployment-egress-allowlist-egressrules). |
| `podResources` | `RunPodResources` | Run pod requests and limits for KubernetesJob runs; ignored for Process runs. |
| `workspaceTemplateId` | `string?` | Workspace template. |
| `artifactStoreId` | `string?` | Artifact store. |
| `fileSpaceMountPath` | `string` | Workspace folder the conversation file space is synced into, relative to the workspace. Default `files`. See [docs/FILE_SPACES.md](docs/FILE_SPACES.md). |
| `approvalsEnabled` | `bool` | Relay permission requests to Garrison (Claude Code, Codex app-server). Default false. See [Deployment approval fields](#deployment-approval-fields). |
| `approvalDefaultAction` | `ApprovalRuleActionEnum` | Action when no rule matches. Default `Ask`. |
| `approvalTimeoutSeconds` | `int` | Seconds a pending approval waits. Minimum 10, maximum 3600, default 300. |
| `approvalTimeoutDecision` | `ApprovalDecisionEnum` | Decision on expiry. Default `Deny`. |
| `configVersion` | `int` | Configuration version, incremented on every change. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `promptBindings` | `List<DeploymentPromptBinding>` | Prompt role to template bindings. |
| `resourceBindings` | `List<DeploymentResourceBinding>` | MCP server and secret bindings. |
| `argumentOverrides` | `List<DeploymentArgumentOverride>` | Argument overrides applied to the profile. |
| `environmentOverrides` | `List<DeploymentEnvironmentOverride>` | Environment overrides. |
| `fileOverrides` | `List<DeploymentFileOverride>` | File overrides. |
| `nodeSelector` | `List<DeploymentNodeSelector>` | Node label requirements. |
| `parameters` | `List<DeploymentParameter>` | Named parameters exposed to templates as deployment.parameters. |
| `allowedRunOverrides` | `List<DeploymentRunOverrideRule>` | Parameters callers may override per run. |
| `approvalRules` | `List<DeploymentApprovalRule>` | Permission approval rules in order. |

#### `DeploymentPromptBinding`

Child record of Deployment: prompt role to template bindings.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `deploymentId` | `string` | Parent Deployment identifier. |
| `role` | `string` | Prompt role, for example System or Task. |
| `templateId` | `string` | Template identifier. |
| `pinnedVersion` | `int?` | Pinned version, or null to follow the current version. |

#### `DeploymentResourceBinding`

Child record of Deployment: mCP server and secret bindings.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `deploymentId` | `string` | Parent Deployment identifier. |
| `kind` | `ResourceBindingKindEnum` | Resource kind. |
| `alias` | `string` | Alias used in templates, for example {{secret.anthropic}}. |
| `resourceId` | `string` | Bound resource identifier. |

#### `ResourceBindingKindEnum`

`McpServer`, `Secret`

#### `DeploymentArgumentOverride`

Child record of Deployment: argument overrides applied to the profile.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `deploymentId` | `string` | Parent Deployment identifier. |
| `position` | `int` | Zero-based position. |
| `operation` | `ArgumentOverrideOperationEnum` | Operation. |
| `match` | `string?` | For Remove and Replace, the profile argument template to match. |
| `template` | `string?` | Argument template for Append, Prepend, and Replace. |
| `condition` | `string?` | Optional condition template. |

#### `ArgumentOverrideOperationEnum`

`Append`, `Prepend`, `Remove`, `Replace`

#### `DeploymentEnvironmentOverride`

Child record of Deployment: environment overrides.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `deploymentId` | `string` | Parent Deployment identifier. |
| `name` | `string` | Variable name. |
| `valueTemplate` | `string` | Value template. |
| `isSecret` | `bool` | Whether the value is secret. |

#### `DeploymentFileOverride`

Child record of Deployment: file overrides.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `deploymentId` | `string` | Parent Deployment identifier. |
| `baseDirectory` | `FileBaseDirectoryEnum` | Base directory. |
| `pathTemplate` | `string` | Relative path template. |
| `contentTemplate` | `string` | Content template. |
| `mode` | `string?` | Optional octal file mode. |
| `isSecret` | `bool` | Whether the content is secret. |

#### `DeploymentNodeSelector`

Child record of Deployment: node label requirements.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `deploymentId` | `string` | Parent Deployment identifier. |
| `key` | `string` | Label key. |
| `value` | `string` | Label value. |

#### `DeploymentParameter`

Child record of Deployment: named parameters exposed to templates as deployment.parameters.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `deploymentId` | `string` | Parent Deployment identifier. |
| `name` | `string` | Parameter name. |
| `value` | `string` | Default value. |

#### `DeploymentApprovalRule`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (`dar_`), stable across deployment updates. |
| `deploymentId` | `string` | Owning deployment. |
| `action` | `ApprovalRuleActionEnum` | `Allow`, `Deny`, or `Ask`. Default `Ask`. |
| `pattern` | `string` | Claude Code rule syntax, for example `Bash(git status:*)` or `mcp__github__*`. Required, one line, at most 1,000 characters. |
| `inputPattern` | `string?` | Regular expression the tool input JSON must also match. |
| `description` | `string?` | Note shown in the dashboard. |

#### `DeploymentRunOverrideRule`

Child record of Deployment: parameters callers may override per run.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `deploymentId` | `string` | Parent Deployment identifier. |
| `name` | `string` | Parameter name (deployment parameter or model). |
| `validation` | `RunOverrideValidationEnum` | Validation kind. Default `Enum`, so a rule sent without it needs its allowed values in `pattern`; send `Any` explicitly to accept any value. |
| `pattern` | `string?` | Regex, comma-separated enum values, or min,max range. |

#### `RunOverrideValidationEnum`

`Any`, `Enum`, `Regex`, `IntegerRange`

#### `EffectivePermissionsResponse`

Effective permissions of a user or credential.

| Field | Type | Description |
|---|---|---|
| `principalType` | `PrincipalTypeEnum` | Principal type. |
| `principalId` | `string` | Principal identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `isAdmin` | `bool` | System administrator bypass. |
| `isTenantAdmin` | `bool` | Tenant administrator bypass. |
| `grants` | `List<EffectiveGrant>` | Expanded grants. |
| `hasPermission` | `List<PermissionCheck>` | Tenant-level permission matrix. |

#### `EffectiveGrant`

One effective grant.

| Field | Type | Description |
|---|---|---|
| `source` | `string` | Role that produced the grant. |
| `permissionType` | `PermissionTypeEnum` | Permit or deny. |
| `resourceTypes` | `List<string>` | Resource types. |
| `operations` | `List<string>` | Operations. |
| `scope` | `ResourceScopeEnum` | Scope. |
| `resourceId` | `string?` | Resource identifier for Resource scope. |
| `inheritsToChildren` | `bool` | Whether a tenant grant applies to resources. |

#### `PermissionTypeEnum`

`Permit`, `Deny`

#### `PermissionCheck`

Result of one hasPermission evaluation at tenant level.

| Field | Type | Description |
|---|---|---|
| `resourceType` | `ResourceTypeEnum` | Resource type. |
| `operation` | `OperationTypeEnum` | Operation. |
| `permitted` | `bool` | Whether the principal may perform the operation. |

#### `ResourceTypeEnum`

`All`, `Account`, `Tenant`, `Admin`, `User`, `Credential`, `Session`, `Role`, `Permission`, `Assignment`, `Audit`, `RequestHistory`, `Settings`, `HarnessProfile`, `PromptTemplate`, `Agent`, `Deployment`, `McpServer`, `Secret`, `Workspace`, `ArtifactStore`, `Run`, `Node`, `NodePool`, `Manifest`, `Conversation`, `Approval`, `Artifact`, `ModelPrice`, `UsageQuota`, `Pipeline`, `PipelineRun`, `Trigger`, `NotificationEndpoint`

#### `OperationTypeEnum`

`All`, `Create`, `Read`, `Write`, `Update`, `Delete`, `Execute`, `Admin`

#### `HarnessProfile`

Describes how to run one harness headless.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string?` | Tenant identifier. Null for global or built-in records. |
| `name` | `string` | Profile name, unique per tenant. Built-ins use the builtin/ prefix. |
| `description` | `string?` | Description. |
| `harnessType` | `HarnessTypeEnum` | Harness family; workers advertise which types they can run. |
| `executable` | `string` | Executable template, for example claude. |
| `promptDelivery` | `PromptDeliveryEnum` | How the task prompt reaches the harness. |
| `promptArgumentTemplate` | `string?` | Argument or file name template used when delivery is Argument or File. |
| `systemPromptDelivery` | `SystemPromptDeliveryEnum` | How the system prompt reaches the harness. |
| `systemPromptTarget` | `string?` | Argument flag, environment variable name, or file name for the system prompt. |
| `mcpConfigFormat` | `McpConfigFormatEnum` | MCP configuration format. |
| `mcpConfigFileName` | `string?` | File name (in the config directory) for the MCP configuration. |
| `outputParser` | `OutputParserEnum` | Output parser. |
| `resultSource` | `ResultSourceEnum` | Where the final result text comes from. |
| `resultFileName` | `string?` | Result file name (in the config directory) when the result source is LastMessageFile. |
| `successPolicy` | `SuccessPolicyEnum` | How success is decided. |
| `genericTextField` | `string?` | GenericJsonl: dotted path of assistant text in an event. |
| `genericFinalField` | `string?` | GenericJsonl: dotted path of final result text. |
| `genericSuccessField` | `string?` | GenericJsonl: dotted path whose value indicates success. |
| `genericSuccessValue` | `string?` | GenericJsonl: value of the success field that means success. |
| `defaultTimeoutSeconds` | `int` | Run deadline when the deployment does not set one. Minimum 5, maximum 86400, default 1800. |
| `killGraceSeconds` | `int` | Seconds between graceful stop and process tree kill. Minimum 0, maximum 60, default 5. |
| `maxOutputBytes` | `long` | Maximum stdout bytes before the run fails. Minimum 1024, maximum 1073741824, default 67108864. |
| `stderrTailBytes` | `int` | Retained stderr tail size. Minimum 0, maximum 1048576, default 8000. |
| `isolateHome` | `bool` | Whether each run gets its own HOME directory. |
| `supportsResume` | `bool` | Whether the harness can resume a session by ID. Required for the structured output repair; the profile's arguments must pass `run.resumeSessionId` (see `docs/HARNESSES.md`). |
| `isBuiltIn` | `bool` | Whether the profile is seeded by the platform. |
| `builtInKey` | `string?` | Stable built-in key. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `arguments` | `List<HarnessArgument>` | Ordered argument templates. |
| `environment` | `List<HarnessEnvironmentVariable>` | Environment variable templates. |
| `files` | `List<HarnessFile>` | Files materialized before launch. |
| `successExitCodes` | `List<int>` | Exit codes considered successful when the success policy involves exit codes. |
| `probeArguments` | `List<string>` | Version probe argument list (no tokens spent), for example --version. |
| `credentialEnvironmentAllowlist` | `List<string>` | Environment variable names that may carry secret values for this harness. |

#### `PromptDeliveryEnum`

`Stdin`, `Argument`, `File`, `CodexAppServer`

#### `SystemPromptDeliveryEnum`

`File`, `Argument`, `Environment`, `PrependToPrompt`, `None`

#### `McpConfigFormatEnum`

`None`, `ClaudeJson`, `CodexToml`, `MuxJson`, `GeminiSettings`

#### `HarnessArgument`

Child record of HarnessProfile: ordered argument templates.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `harnessProfileId` | `string` | Parent HarnessProfile identifier. |
| `position` | `int` | Zero-based position. |
| `template` | `string` | Argument template. Renders to one argv entry. |
| `condition` | `string?` | Optional condition template; the argument is skipped when it renders empty or false. |
| `repeatOver` | `string?` | Optional list variable; the argument is emitted once per element. |

#### `HarnessEnvironmentVariable`

Child record of HarnessProfile: environment variable templates.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `harnessProfileId` | `string` | Parent HarnessProfile identifier. |
| `name` | `string` | Variable name. |
| `valueTemplate` | `string` | Value template. May reference secrets. |
| `condition` | `string?` | Optional condition template. |
| `isSecret` | `bool` | Whether the rendered value is secret and must be scrubbed. |

#### `HarnessFile`

Child record of HarnessProfile: files materialized before launch.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `harnessProfileId` | `string` | Parent HarnessProfile identifier. |
| `baseDirectory` | `FileBaseDirectoryEnum` | Base directory. |
| `pathTemplate` | `string` | Relative path template. |
| `contentTemplate` | `string` | Content template. May include another template with {{> name}}. |
| `condition` | `string?` | Optional condition template. |
| `mode` | `string?` | Optional octal file mode, for example 600. |
| `isSecret` | `bool` | Whether the content is secret. |

#### `HealthResponse`

Health check result.

| Field | Type | Description |
|---|---|---|
| `status` | `string` | Readiness: healthy, degraded, migrating, starting, or draining (only healthy answers 200). Liveness: alive, starting, or draining. |
| `node` | `string` | Node identifier. |
| `version` | `string` | Product version. |
| `database` | `string` | Database status: ok, unreachable, or unchecked (liveness and startup answers). |
| `schemaVersion` | `int` | Highest migration applied to the database, or 0 when it was not read. |
| `expectedSchemaVersion` | `int` | Migration version this build requires. |
| `backplane` | `string?` | Event backplane of this replica: Local, Polling, or PostgresNotify. |
| `utc` | `DateTime` | Server time (UTC). |

#### `InvokeRequest`

Request to invoke an agent.

| Field | Type | Description |
|---|---|---|
| `input` | `string` | Input message. Required: a missing body or an input that is empty or only whitespace is a 400 `ValidationFailed` with field code `InputRequired` on `input`, and no run is created. An agent with structured input takes its JSON document here. |
| `inputContentType` | `string?` | Input content type, default text/plain. |
| `deploymentId` | `string?` | Specific deployment; null picks a weighted active deployment. |
| `parameters` | `Dictionary<string, string>` | Per-run parameter overrides allowed by the deployment. |
| `priority` | `int` | Priority from -100 to 100. |
| `wait` | `bool` | Whether to wait for completion before responding. |
| `waitSeconds` | `int` | Maximum seconds to wait (1 to 600, default 60). |
| `cancelOnDisconnect` | `bool?` | When waiting, whether the run is cancelled if the client disconnects before it finishes. Null means true; false keeps the run going. The query parameter `cancelOnDisconnect` overrides it. |
| `conversationId` | `string?` | Conversation to continue: the run becomes its next turn and resumes the harness session of the earlier turns. 404 when it names no conversation of the tenant, 409 `ConversationAgentMismatch` for another agent's conversation, 409 `ConversationDeploymentMismatch` when `deploymentId` names another deployment, 409 `ConversationBusy` while the previous turn is unfinished. |
| `startConversation` | `bool` | Start a new conversation with this run as its first turn; the run's `conversationId` names it. Ignored when `conversationId` is set. Default false. |
| `studioDraftId` | `string?` | Studio draft this conversation works on (AD7.10): when the run starts a conversation, the draft is linked to it, and every turn renders the draft as `studio.draftId`, `studio.draftTitle`, and `studio.draftVersion` in the prompt. Needs Update on the draft. |

#### `ManifestApply`

Record of a declarative manifest apply.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `principalName` | `string?` | Principal that applied. |
| `dryRun` | `bool` | Whether the apply was a dry run. |
| `documentCount` | `int` | Documents submitted. |
| `createdCount` | `int` | Documents created. |
| `updatedCount` | `int` | Documents updated. |
| `unchangedCount` | `int` | Documents unchanged. |
| `failedCount` | `int` | Documents failed. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `items` | `List<ManifestApplyItem>` | Per-document results. |

#### `ManifestApplyItem`

Child record of ManifestApply: per-document results.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `manifestApplyId` | `string` | Parent ManifestApply identifier. |
| `position` | `int` | Zero-based position. |
| `kind` | `string` | Document kind. |
| `name` | `string` | Document name. |
| `result` | `ManifestApplyResultEnum` | Result. |
| `resourceId` | `string?` | Resulting resource identifier; null in a dry run for a record that does not exist yet. |
| `message` | `string?` | Message. For a spec field with the wrong type or a value that is not allowed, it names the document, the field, the value, and what the field accepts (for an enumeration, every allowed value). |
| `errorCode` | `string?` | Stable code of a failed document: `ManifestInvalid` (a spec field has the wrong type or a value that is not allowed), `ValidationFailed`, or a reference or template code such as `ReferenceNotFound`. Null unless the document failed. |
| `errorField` | `string?` | Path of the field that failed, for example `documents[1].spec.kind`. Null when the failure is not about one field. |
| `plannedResult` | `ManifestApplyResultEnum?` | What the apply does or, in a dry run, would do: Created, Updated, Unchanged, or Failed. |
| `changes` | `List<ManifestFieldChange>` | Changed fields of an Updated document; empty otherwise. |
| `warnings` | `List<FieldWarning>` | Values in the document that were accepted but not stored as written, such as a number clamped into its range (`ValueClamped`), with the given and stored values. Reported for dry runs and applies, whatever the result; empty when there is nothing to report. |

#### `FieldWarning`

A value in a request that was accepted but not stored as given (see "Warnings" under Conventions).

| Field | Type | Description |
|---|---|---|
| `field` | `string` | Field name as the REST API spells it, for example `maxAttempts`. |
| `code` | `string` | `ValueClamped`: the value was outside its range and the nearest allowed value was stored. |
| `given` | `string?` | The value sent, as text. |
| `stored` | `string?` | The value stored, as text. |
| `message` | `string` | Names the field, the given value, the allowed range, and the stored value. |

#### `ManifestFieldChange`

One field a manifest apply changes (or would change) on an existing resource.

| Field | Type | Description |
|---|---|---|
| `field` | `string` | Field path within the document spec, for example `content`, `model`, or `resources.secrets[0].secret`. |
| `before` | `string?` | Value before, as text, truncated to 200 characters; null when not set. |
| `after` | `string?` | Value after, as text, truncated to 200 characters; null when removed. |

#### `ManifestApplyResultEnum`

`Created`, `Updated`, `Unchanged`, `Failed`, `Validated`

#### `ModelPrice`

Tenant-owned, operator-configured rates. See [Model Prices](#model-prices) for estimation rules.

| Property | Type | Meaning |
|---|---|---|
| `id`, `tenantId`, `name` | `string` | Identifier, owning tenant, unique configuration name |
| `description` | `string?` | Operator notes |
| `model` | `string` | Exact served-model identifier, 1 to 256 characters |
| `harnessType` | `HarnessTypeEnum` | Token accounting harness; default `Generic` |
| `inputUsdPerMillion`, `outputUsdPerMillion` | `double` | USD per million tokens; default 0 |
| `cachedInputUsdPerMillion`, `reasoningUsdPerMillion` | `double?` | Optional rates; null uses input/output respectively |
| `inputIncludesCachedTokens`, `outputIncludesReasoningTokens` | `bool` | Whether cached/reasoning counts are included subtotals; default true |
| `active`, `isProtected` | `bool` | Whether used for estimation; whether editing is prohibited |
| `createdUtc`, `lastUpdateUtc` | `DateTime` | Creation and modification timestamps |

#### `McpServer`

MCP server that can be bound to deployments.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `name` | `string` | Server name, used as the MCP server key in harness configuration. |
| `description` | `string?` | Description. |
| `transport` | `McpTransportEnum` | Transport. |
| `url` | `string?` | Base URL for HTTP servers. |
| `path` | `string?` | MCP path for HTTP servers, default /mcp. |
| `command` | `string?` | Command for stdio servers. |
| `toolTimeoutSeconds` | `int` | Tool call timeout. Minimum 1, maximum 3600, default 600. |
| `required` | `bool` | Whether the run fails when the server is unreachable. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `arguments` | `List<string>` | Command arguments for stdio servers. |
| `environment` | `List<McpServerVariable>` | Environment templates for stdio servers. |
| `headers` | `List<McpServerHeader>` | HTTP header templates. |
| `requiredTools` | `List<string>` | Tools that must be present for pre-flight to pass. |

#### `McpTransportEnum`

`Http`, `Stdio`

#### `McpServerVariable`

Child record of McpServer: environment templates for stdio servers.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `mcpServerId` | `string` | Parent McpServer identifier. |
| `name` | `string` | Variable name. |
| `valueTemplate` | `string` | Value template. May reference secrets. |

#### `McpServerHeader`

Child record of McpServer: hTTP header templates.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `mcpServerId` | `string` | Parent McpServer identifier. |
| `name` | `string` | Header name. |
| `valueTemplate` | `string` | Value template. May reference secrets. |

#### `McpServerTestResponse`

MCP server connection test result.

| Field | Type | Description |
|---|---|---|
| `success` | `bool` | Whether the server answered tools/list. |
| `tools` | `List<string>` | Tool names. |
| `missingRequiredTools` | `List<string>` | Required tools the server did not list. |
| `error` | `string?` | Error message. |
| `durationMs` | `long` | Duration in milliseconds. |

#### `Node`

Worker node (Post).

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `name` | `string` | Node name, unique (Kubernetes pod name). |
| `nodePoolId` | `string?` | Node pool. |
| `address` | `string?` | Informational address. |
| `nodeVersion` | `string?` | Worker software version. |
| `status` | `NodeStatusEnum` | Status. |
| `maxConcurrentRuns` | `int` | Run capacity. Minimum 1, maximum 1000, default 4. |
| `childReserveSlots` | `int` | Child reserve the worker reported: extra slots only a delegated run whose parent waits on it may use, one per run on the node waiting on a child. Minimum 0 (none), maximum 64. 0 for a node registered before the reserve existed. |
| `maxResidentWaiters` | `int` | Most runs on the node that may wait on a delegated run at once, as reported; 0 means `maxConcurrentRuns`. The control plane never lets more than `maxConcurrentRuns + childReserveSlots - 1` wait. Minimum 0, maximum 1024. |
| `containerized` | `bool` | Whether the worker reported that it runs in a container or pod (G-29). Harness profiles see it as `executor.containerized`; the built-in Codex profiles then default their sandbox to `danger-full-access`. False for a worker run on a host and for a node registered before the field existed. |
| `activeRuns` | `int` | Runs currently held. |
| `credentialId` | `string?` | Credential the node authenticates with. |
| `lastHeartbeatUtc` | `DateTime?` | Last heartbeat (UTC). |
| `registeredUtc` | `DateTime?` | Last registration (UTC). |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `labels` | `List<NodeLabel>` | Labels. |
| `capabilities` | `List<NodeCapability>` | Harness capabilities detected by probes. |
| `executors` | `List<RunExecutorEnum>` | Executors the worker reports: always `Process`, plus `KubernetesJob` when it can create run Jobs. |

#### `NodeStatusEnum`

`Ready`, `Draining`, `Cordoned`, `Lost`, `Offline`

#### `NodeLabel`

Child record of Node: labels.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `nodeId` | `string` | Parent Node identifier. |
| `key` | `string` | Label key. |
| `value` | `string` | Label value. |

#### `NodeCapability`

Child record of Node: harness capabilities detected by probes.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `nodeId` | `string` | Parent Node identifier. |
| `harnessType` | `HarnessTypeEnum` | Harness type. |
| `executable` | `string?` | Resolved executable. |
| `detectedVersion` | `string?` | Detected version. |
| `available` | `bool` | Whether the probe succeeded. |
| `detail` | `string?` | Probe detail or error. |

#### `NodeAckResponse`

Acknowledgement of a node protocol call.

| Field | Type | Description |
|---|---|---|
| `accepted` | `bool` | Whether the call was accepted. |
| `message` | `string?` | Optional message. |

#### `NodeHeartbeatRequest`

Worker heartbeat.

| Field | Type | Description |
|---|---|---|
| `nodeId` | `string` | Node identifier. |
| `activeRuns` | `List<NodeRunLease>` | Leases currently held. |
| `freeCapacity` | `int` | Free run slots. |
| `draining` | `bool` | Whether the worker is draining. |

#### `NodeRunLease`

A run lease held by a worker.

| Field | Type | Description |
|---|---|---|
| `runId` | `string` | Run identifier. |
| `epoch` | `long` | Fencing epoch. |

#### `NodeHeartbeatResponse`

Heartbeat result.

| Field | Type | Description |
|---|---|---|
| `cancelRunIds` | `List<string>` | Runs the worker must cancel. |
| `lostRunIds` | `List<string>` | Runs whose lease the worker no longer holds; kill immediately. |
| `drain` | `bool` | Whether the control plane asks the worker to drain. |
| `leaseDurationMs` | `int` | Lease duration in milliseconds. |

#### `NodeWatchRequest`

Cancellation watch (long poll).

| Field | Type | Description |
|---|---|---|
| `nodeId` | `string` | Node identifier. |
| `runs` | `List<NodeRunLease>` | Runs to watch (run identifier and lease epoch). |
| `waitMs` | `int` | Longest wait in milliseconds. Minimum 0, maximum 60,000, default 25,000. |

#### `NodeWatchResponse`

Cancellation watch result.

| Field | Type | Description |
|---|---|---|
| `cancelRunIds` | `List<string>` | Watched runs the worker must cancel now. |

#### `NodeLeaseRequest`

Lease request (long poll).

| Field | Type | Description |
|---|---|---|
| `nodeId` | `string` | Node identifier. |
| `maxRuns` | `int` | Maximum runs to lease. Minimum 1, maximum 64. |
| `waitMs` | `int` | Maximum wait in milliseconds. Minimum 0, maximum 60000. |
| `childReserve` | `bool` | Lease into the child reserve: only a queued delegated run whose parent waits on it, while the node has an open reserve slot. Default false. |
| `reserveRunIds` | `List<string>` | Runs the worker is executing in its child reserve; those still active hold reserve slots. At most 64 are read. |

#### `NodeLeaseResponse`

Lease result.

| Field | Type | Description |
|---|---|---|
| `assignments` | `List<RunAssignment>` | Assignments; empty when the wait elapsed with no work. |

#### `RunAssignment`

A leased run with its compiled execution spec.

| Field | Type | Description |
|---|---|---|
| `runId` | `string` | Run identifier. |
| `epoch` | `long` | Fencing epoch; include it in every run-scoped call. |
| `leaseExpiresUtc` | `DateTime` | Lease expiry (UTC). |
| `eventSequenceStart` | `long` | Highest event sequence already recorded for the run (for example a control-plane warning written while it was queued). The worker numbers its events after it. |
| `spec` | `Garrison.Core.Compilation.ExecutionSpec` | Compiled execution spec. |

#### `NodePool`

Group of worker nodes, optionally dedicated to tenants.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `name` | `string` | Pool name. |
| `description` | `string?` | Description. |
| `defaultExecutor` | `RunExecutorEnum?` | Executor for deployments in the pool that leave `executor` null. Null means `Process`. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `tenants` | `List<string>` | Tenants allowed to use the pool; empty means all. |

#### `NodeRegisterRequest`

Worker registration. Idempotent by node name.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Node name, unique (Kubernetes pod name). |
| `version` | `string?` | Worker software version. |
| `address` | `string?` | Informational address. |
| `maxConcurrentRuns` | `int` | Maximum concurrent runs. |
| `childReserveSlots` | `int` | Child reserve slots (0 to 64; 0 means none). Default 0. |
| `maxResidentWaiters` | `int` | Most runs that may wait on a delegated run at once (0 to 1024; 0 means `maxConcurrentRuns`). Default 0. |
| `containerized` | `bool` | Whether the worker runs in a container or pod (worker setting `Containerized`). Default false. |
| `nodePool` | `string?` | Node pool name, or null for the default pool. |
| `labels` | `Dictionary<string, string>` | Labels. |
| `capabilities` | `List<NodeCapabilityReport>` | Harness capabilities. |
| `executors` | `List<RunExecutorEnum>` | Executors the worker supports; empty means `Process` only. |

#### `NodeCapabilityReport`

Harness capability reported by a worker.

| Field | Type | Description |
|---|---|---|
| `harnessType` | `HarnessTypeEnum` | Harness type. |
| `executable` | `string?` | Resolved executable path. |
| `version` | `string?` | Detected version. |
| `available` | `bool` | Whether the probe succeeded. |
| `detail` | `string?` | Probe detail or error. |

#### `NodeRegisterResponse`

Registration result with protocol timing the worker should use.

| Field | Type | Description |
|---|---|---|
| `nodeId` | `string` | Node identifier. |
| `heartbeatIntervalMs` | `int` | Heartbeat interval in milliseconds. |
| `leaseWaitMs` | `int` | Lease long-poll wait in milliseconds. |
| `leaseDurationMs` | `int` | Lease duration in milliseconds; heartbeats extend it. |

#### `NodeUpdateRequest`

Administrative node change.

| Field | Type | Description |
|---|---|---|
| `maxConcurrentRuns` | `int?` | New capacity. |
| `nodePoolId` | `string?` | New node pool. |

#### `ObservabilityInfo`

Observability endpoints in `ServerInfoResponse.observability`. Every field is always present; `null` means not configured.

| Field | Type | Description |
|---|---|---|
| `grafanaUrl` | `string?` | Grafana URL (`Observability.GrafanaUrl`). |
| `prometheusUrl` | `string?` | Prometheus URL (`Observability.PrometheusUrl`). |
| `lokiUrl` | `string?` | Loki URL (`Observability.LokiUrl`). |
| `tempoUrl` | `string?` | Tempo URL (`Observability.TempoUrl`). |
| `datasources` | `ObservabilityDatasources?` | Grafana datasource UIDs: `prometheus` (`garrison-prometheus`), `loki` (`garrison-loki`), `tempo` (`garrison-tempo`). `null` when Grafana is not configured. |
| `dashboards` | `ObservabilityDashboards?` | Grafana dashboard UIDs, one per section of the Garrison folder: `overview`, `http`, `runs`, `workers`, `protocols`, `integrations`, `agents`, `models`, `kubernetes`, `scheduler`, `database`, `controlPlane`, `security`, `logs` (`garrison-overview`, ..., `garrison-control-plane`, ...). `null` when Grafana is not configured. |

#### `ObservabilityServiceStatus`

One entry of `GET /v1.0/api/observability/status`.

| Field | Type | Description |
|---|---|---|
| `service` | `string` | `grafana`, `prometheus`, `loki`, or `tempo`. |
| `configured` | `bool` | Whether the service's browser URL is set. |
| `reachable` | `bool` | Whether the readiness check answered 2xx. Always false when not configured. |
| `version` | `string?` | Version reported by the service, or `null` when unknown. Always present. |
| `checkedUtc` | `DateTime` | When the check ran (UTC). |

#### `OverviewResponse`

Home page summary for a tenant.

| Field | Type | Description |
|---|---|---|
| `agents` | `long` | Agents. |
| `deployments` | `long` | Deployments. |
| `runsLast24Hours` | `long` | Runs created in the last 24 hours. |
| `runsByStatus` | `List<StatusCount>` | Runs in the last 24 hours by status. |
| `nodesByStatus` | `List<StatusCount>` | Nodes by status. |
| `queued` | `long` | Runs waiting for a node. |
| `blockedRuns` | `long` | Queued runs that no Ready worker can run right now (runs whose `blockedReason` is not null). |
| `active` | `long` | Runs leased or running. |
| `recentFailures` | `List<Garrison.Core.Models.Run>` | Most recent failed or timed-out runs. |
| `generatedUtc` | `DateTime` | When the summary was generated (UTC). |

#### `StatusCount`

Count of records in one status.

| Field | Type | Description |
|---|---|---|
| `status` | `string` | Status name. |
| `count` | `long` | Count. |

#### `Run`

One invocation of one deployment.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `agentId` | `string` | Agent identifier. |
| `agentName` | `string` | Agent name at creation. |
| `deploymentId` | `string` | Deployment identifier. |
| `deploymentVersion` | `int` | Deployment configuration version used. |
| `harnessType` | `HarnessTypeEnum` | Harness type required. |
| `executor` | `RunExecutorEnum` | Executor the run needs, resolved at creation from the deployment and its node pool. |
| `trustLevel` | `DeploymentTrustLevelEnum` | The deployment's trust level when the run was admitted. For `Untrusted` runs, `requiredCapabilities.isolation` is at least `Container`. |
| `effectPolicy` | `DeploymentEffectPolicyEnum` | The deployment's effect policy when the run was admitted. The lease reaper uses this value, so changing the deployment does not change how an in-flight run is handled. |
| `nodePoolId` | `string?` | Required node pool. |
| `kind` | `RunKindEnum` | Run kind. |
| `status` | `RunStatusEnum` | Status. |
| `outcome` | `RunOutcomeEnum` | Outcome code. |
| `priority` | `int` | Priority; higher runs first. Minimum -100, maximum 100, default 0. |
| `inputText` | `string?` | Input message. |
| `inputContentType` | `string?` | Input content type. |
| `callerType` | `PrincipalTypeEnum` | Caller principal type. |
| `callerId` | `string?` | Caller principal identifier. |
| `callerName` | `string?` | Caller display name. |
| `parentRunId` | `string?` | Parent run when delegated. |
| `rootRunId` | `string?` | Root run of the delegation chain. |
| `depth` | `int` | Delegation depth; 0 for top-level runs. |
| `callChain` | `string?` | Comma-separated agent names from the root to this run. |
| `idempotencyKey` | `string?` | Caller-supplied idempotency key. |
| `retryOfRunId` | `string?` | Run this run retries. |
| `attempt` | `int` | Attempt number. |
| `maxAttempts` | `int` | Maximum attempts. |
| `leaseNodeId` | `string?` | Node holding the lease. |
| `leaseNodeName` | `string?` | Node name holding the lease. |
| `leaseEpoch` | `long` | Fencing epoch, incremented on every claim. |
| `leaseExpiresUtc` | `DateTime?` | Lease expiry (UTC). |
| `queuedUtc` | `DateTime?` | Queued (UTC). |
| `leasedUtc` | `DateTime?` | Leased (UTC). |
| `startedUtc` | `DateTime?` | Started (UTC). |
| `completedUtc` | `DateTime?` | Completed (UTC). |
| `deadlineUtc` | `DateTime?` | Deadline (UTC). |
| `cancelRequested` | `bool` | Whether cancellation was requested. |
| `resultText` | `string?` | Final result text. |
| `structuredOutputJson` | `string?` | Structured output (unmanaged JSON). |
| `outputSchemaValid` | `bool?` | Whether the final output validated against the agent's output schema; `null` when not validated. Always present. See [Structured output validation](#structured-output-validation-outputschemavalid-schemavalidationerrors-repairattempts). |
| `schemaValidationErrors` | `string?` | First few errors of the most recent failed schema validation, or `null`. Always present. |
| `repairAttempts` | `int` | Structured output repair attempts started (0 or 1). |
| `sessionId` | `string?` | Harness session identifier. |
| `servedModel` | `string?` | Model that served the run. |
| `conversationId` | `string?` | Conversation this run is a turn of, or `null`. Always present. See [Conversations](#conversations). |
| `fanOutGroupId` | `string?` | The fan-out group this run is a member of, or `null`. See [Fan-out groups](#fan-out-groups). |
| `fileSpaceId` | `string?` | The file space this run syncs (`cfs_` identifier): its conversation's, its pipeline run's, or its root run's. See [Conversation file spaces](#conversation-file-spaces). |
| `conversationTurn` | `int` | Turn number within the conversation, starting at 1; 0 outside a conversation. |
| `resumeSessionId` | `string?` | Harness session this turn resumes on its affinity node, or `null` (first turn, fallback, or no conversation). Always present. |
| `affinityNodeId` | `string?` | Node this turn waits for because it holds the conversation's directories, or `null`. Always present. |
| `affinityUntilUtc` | `DateTime?` | End of the affinity wait; after it any capable node may take the turn as a fallback. Always present. |
| `conversationFallbackReason` | `ConversationFallbackReasonEnum?` | Why this turn started a fresh session seeded with the transcript instead of resuming, or `null`. Always present. |
| `pipelineRunId` | `string?` | Pipeline run this run is a stage execution of, or `null`. Always present. See [Pipelines](#pipelines). |
| `pipelinePosition` | `int` | Position of the pipeline stage this run executes, starting at 1; 0 outside a pipeline. |
| `pipelineExecution` | `int` | Execution number of that stage, starting at 1 (retries, revisions, and resumes increase it); 0 outside a pipeline. |
| `triggerId` | `string?` | Trigger that started the run (also set on the stage runs of a pipeline run a trigger started), or `null`. See [Triggers](#triggers). |
| `traceId` | `string?` | W3C trace ID (32 lowercase hexadecimal characters) of the trace the run was created and compiled in; the server's `run:create`, `run:claim`, and `run:compile` spans and the worker's `harness <type> exec` span share it, and delegated runs join their parent's trace. Use it to open the trace in Tempo or search logs (`trace=<traceId>`). `null` for runs created before schema migration 5. Always present. See `docs/TELEMETRY.md`. |
| `exitCode` | `int?` | Process exit code. |
| `stderrTail` | `string?` | Stderr tail (scrubbed). |
| `errorMessage` | `string?` | Error message. |
| `inputTokens` | `long` | Input tokens. |
| `outputTokens` | `long` | Output tokens. |
| `cachedTokens` | `long` | Cached input tokens. |
| `costUsd` | `double?` | Cost in USD. |
| `costEstimated` | `bool` | Whether the cost is an estimate. |
| `lastEventSequence` | `long` | Highest event sequence received. |
| `blockedReason` | `RunBlockedReasonEnum?` | Read-only and computed on read: why the queued run cannot be handed to any worker right now, or `null`. Always present. See [Blocked runs](#blocked-runs-blockedreason). |
| `delegationWaitMs` | `long?` | Milliseconds spent waiting on child runs this run delegated to, from server timestamps; 0 when it delegated nothing. See [Run timing and usage fields](#run-timing-and-usage-fields). |
| `timeToFirstTokenExcludingDelegationMs` | `long?` | `timeToFirstTokenMs` minus the delegation wait before the first output, never negative. |
| `pendingApprovals` | `int` | Permission approvals of the run waiting for a person. Read-only. |
| `awaitingApproval` | `bool` | Whether the harness is blocked on an approval (`pendingApprovals` above 0). The run stays `Running`; this is a substatus. Computed and always present. |
| `approvalWaitMs` | `long?` | Total milliseconds spent waiting for approvals decided by a person or by the timeout. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `parameters` | `List<RunParameter>` | Per-run parameter overrides. |
| `requirements` | `List<RunRequirement>` | Node label requirements copied from the deployment. |
| `templateVersions` | `List<RunTemplateVersion>` | Prompt template versions used to compile the run. |

#### `RunKindEnum`

`Invoke`, `Delegated`, `Test`, `Retry`, `Pipeline` (a stage run of a pipeline run), `Trigger` (started by a trigger fire)

#### `RunStatusEnum`

`Pending`, `Queued`, `Leased`, `Running`, `Cancelling`, `Succeeded`, `Failed`, `Cancelled`, `TimedOut`, `Rejected`

#### `RunOutcomeEnum`

`None`, `Succeeded`, `HarnessFailed`, `NotInstalled`, `NotCredentialed`, `McpPreflightFailed`, `NodeLost`, `OutputLimitExceeded`, `SchemaValidationFailed`, `TimedOut`, `Cancelled`, `StaleLease`, `CompileFailed`, `WorkspaceFailed`, `Rejected`, `NoCapableWorker`, `InternalError`, `RepetitionDetected`, `NoProgress`, `PodFailed`, `ConversationStateLost`

`PodFailed` means the run pod of a KubernetesJob run failed outside the harness: it stayed Pending past the worker's pending timeout, its image could not be pulled, its configuration was invalid, it was OOMKilled, or `run-one` exited without reporting a completion. `errorMessage` names the cause. A pod evicted or deleted while running is treated as node loss instead (the lease expires and the run's `effectPolicy` applies).

`RepetitionDetected`, `NoProgress`, and `OutputLimitExceeded` (when the assistant text passed `maxAssistantChars`) are run guard stops; see [Run guards](#run-guards-repetitiondetected-outputlimitexceeded-noprogress). `OutputLimitExceeded` also means the harness wrote more than the profile's `maxOutputBytes` to stdout.

`NoCapableWorker` means the run stayed queued with no Ready worker able to run it for longer than `Runtime.FailBlockedAfterSeconds`.

`ConversationStateLost` means a conversation turn that should resume its harness session found the conversation's directories gone on its node. The control plane normally queues the turn again as a fallback, so a run only ends with this outcome when that was not possible (for example, it was cancelled at the same moment).

#### `Conversation`

A multi-turn conversation with one agent. See [Conversations](#conversations).

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (`cnv_`). |
| `tenantId` | `string` | Tenant identifier. |
| `agentId` | `string` | Agent the conversation is with. |
| `agentName` | `string` | Agent name when the conversation started. |
| `deploymentId` | `string` | Deployment every turn runs on (chosen for the first turn). |
| `harnessType` | `HarnessTypeEnum` | Harness type of the deployment's profile. |
| `contextId` | `string?` | Client-supplied A2A context identifier the conversation was created for, or `null` (the A2A context identifier is then the conversation identifier). |
| `title` | `string?` | First line of the first turn's input, at most 200 characters. |
| `callerType` | `PrincipalTypeEnum` | Principal type that started the conversation. |
| `callerId` | `string?` | Principal that started the conversation. |
| `callerName` | `string?` | Display name of that principal. |
| `sessionId` | `string?` | Harness session the next turn resumes, from the last successful turn. |
| `sessionHarnessProfileId` | `string?` | Harness profile that created the session. |
| `affinityNodeId` | `string?` | Node holding the conversation's directories, or `null`. |
| `affinityNodeName` | `string?` | Name of that node. |
| `activeRunId` | `string?` | Run of the turn in progress or of the most recent turn. |
| `lastRunId` | `string?` | Most recent turn's run. |
| `turnCount` | `int` | Turns created (every run, whatever its outcome). |
| `fallbackCount` | `int` | Turns that started a fresh session from the transcript. |
| `lastFallbackReason` | `ConversationFallbackReasonEnum?` | Reason of the most recent fallback. |
| `lastFallbackUtc` | `DateTime?` | Time of the most recent fallback. |
| `lastActivityUtc` | `DateTime?` | Time of the most recent turn's start or success. |
| `busy` | `bool` | Read-only and computed on read: true while a turn is unfinished. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `ConversationFallbackReasonEnum`

`AffinityNodeLost`, `AffinityWaitExpired`, `WorkspaceLost`, `SessionMissing`, `HarnessChanged`, `ResumeUnsupported`, `ExecutorWithoutState`

`NotCredentialed` also covers bound credentials the control plane cannot use (G-22). The run fails before it reaches a worker and `errorMessage` starts with a code: `SecretNeedsReauthentication:` when a `CodexAuthJson` secret's `status` is `NeedsReauthentication` (replace its value), or `SecretRefreshFailed:` when its access token is expired and the refresh failed for a reason worth retrying (retry the run).

`SchemaValidationFailed` means the final output did not validate against the agent's output schema, either after the one repair attempt or immediately when no repair was possible (for example the harness profile does not support resume). See [Structured output validation](#structured-output-validation-outputschemavalid-schemavalidationerrors-repairattempts).

#### `RunBlockedReasonEnum`

`NoReadyWorker`, `NoCapableWorker`, `NoMatchingPool`, `NoIsolatingWorker`, `NoToolWorker`

#### `EgressProtocolEnum`

`TCP` (default), `UDP`. Used by `DeploymentEgressRule.protocol`.

#### `DeploymentTrustLevelEnum`

`Trusted` (default), `Untrusted`. Used by `Deployment.trustLevel`, `Run.trustLevel`, and the manifest `DeploymentSpec`.

#### `DeploymentEffectPolicyEnum`

`AtMostOnce` (default for new deployments), `AtLeastOnce`, `Journaled`. Used by `Deployment.effectPolicy`, `Run.effectPolicy`, and the manifest `DeploymentSpec`.

#### `RunParameter`

Child record of Run: per-run parameter overrides.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `runId` | `string` | Parent Run identifier. |
| `name` | `string` | Parameter name. |
| `value` | `string` | Value. |

#### `RunRequirement`

Child record of Run: node label requirements copied from the deployment.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `runId` | `string` | Parent Run identifier. |
| `key` | `string` | Label key. |
| `value` | `string` | Label value. |

#### `Permission`

Permission over resource types and operations.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string?` | Tenant identifier. Null for global or built-in records. |
| `name` | `string` | Permission name. |
| `permissionType` | `PermissionTypeEnum` | Permit or deny. |
| `isBuiltIn` | `bool` | Whether the permission is seeded by the platform. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `resourceTypes` | `List<string>` | Resource types covered (names of ResourceTypeEnum). |
| `operationTypes` | `List<string>` | Operation types covered (names of OperationTypeEnum). |

#### `PermissionRequest`

Custom permission create or update request.

| Field | Type | Description |
|---|---|---|
| `name` | `string?` | Permission name. Required on create. |
| `permissionType` | `PermissionTypeEnum?` | Permit or deny. |
| `resourceTypes` | `List<string>?` | Resource type names (ResourceTypeEnum) or All. |
| `operationTypes` | `List<string>?` | Operation names (OperationTypeEnum) or All. |
| `active` | `bool?` | Whether the permission is active. |

#### `Pipeline`

Ordered agent stages with optional review gates (P12.9). See [Pipelines](#pipelines).

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (`ppl_`). |
| `tenantId` | `string` | Tenant identifier. |
| `name` | `string` | 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit; unique per tenant. |
| `description` | `string?` | Description, up to 4000 characters. |
| `version` | `int` | Definition version, starting at 1 and increased by every change. Read-only. |
| `maxDurationSeconds` | `int` | Most seconds a pipeline run may take, review waits included. 0 (default) is no limit; maximum 2592000. |
| `active` | `bool` | Whether the pipeline can be started. Default true. |
| `isProtected` | `bool` | Whether the pipeline is protected from changes and deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `stages` | `List<PipelineStage>` | Stages in run order; 1 to `Runtime.PipelineMaxStages` (default 20). |

#### `PipelineStage`

Child record of Pipeline: one stage.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (`pst_`). |
| `pipelineId` | `string` | Parent Pipeline identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `position` | `int` | Position, starting at 1, assigned from list order when the pipeline is saved. |
| `name` | `string` | Stage name, 1 to 128 characters, unique within the pipeline. |
| `description` | `string?` | Description (not sent to the harness). |
| `agentId` | `string` | Agent that runs the stage. |
| `deploymentId` | `string?` | Deployment of that agent to use, or `null` for the agent's weighted deployment selection. |
| `handoffTemplateId` | `string?` | `Task` prompt template rendered as this stage's `PipelineStage` prompt, or `null` for the deployment's `PipelineStage` binding and then `builtin/pipeline-stage`. |
| `handoffTemplateVersion` | `int?` | Pinned version of the handoff template, or `null` for its current version. Needs `handoffTemplateId`. |
| `outputCharLimit` | `int` | Most characters of each earlier output (and of a revised output) rendered into the prompt; longer outputs are cut and marked. 1000 to 200000, default 16000. |
| `maxAttempts` | `int` | Executions, including the first, before a failure counts. 1 to 5, default 1. |
| `continueOnFailure` | `bool` | Whether the pipeline moves on after this stage fails all its attempts. Default false (the pipeline run fails with `StageFailed`). |
| `requiresReview` | `bool` | Whether a person reviews the stage result before the pipeline continues. Default false. |
| `reviewTimeoutSeconds` | `int` | Seconds a review waits before `reviewTimeoutAction` applies. 0 (default) waits indefinitely; maximum 2592000. |
| `reviewTimeoutAction` | `PipelineReviewDecisionEnum` | `Approve` or `Reject` (default). `RequestChanges` is not allowed. |
| `maxRevisions` | `int` | Most `RequestChanges` decisions for this stage in one pipeline run. 0 to 10, default 3. |
| `parameters` | `List<PipelineStageParameter>` | Run parameter overrides for every run of the stage, validated against the pinned deployment's `allowedRunOverrides`. |

#### `PipelineStageParameter`

Child record of PipelineStage: a run parameter override (`psp_`). Fields `id`, `stageId`, `tenantId`, `name`, `value`.

#### `PipelineRun`

One execution of a pipeline.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (`plr_`). |
| `tenantId` | `string` | Tenant identifier. |
| `pipelineId` | `string` | Pipeline that was started. |
| `pipelineName` | `string` | Pipeline name at start. |
| `pipelineVersion` | `int` | Pipeline version at start. |
| `status` | `PipelineRunStatusEnum` | Status. |
| `outcome` | `PipelineRunOutcomeEnum` | Why it ended; `None` while active. |
| `currentPosition` | `int` | Position of the stage being run or reviewed. |
| `stageCount` | `int` | Number of stages. |
| `casVersion` | `int` | Compare-and-set version, increased by every change of the record. Read-only. |
| `inputText` | `string` | Caller input. Every stage run receives it as its input. |
| `inputContentType` | `string` | Input content type. Default `text/plain`. |
| `callerType`, `callerId`, `callerName` | `PrincipalTypeEnum`, `string?`, `string?` | Who started it. |
| `idempotencyKey` | `string?` | `Idempotency-Key` of the start request. |
| `triggerId` | `string?` | Trigger that started the pipeline run, or `null`. |
| `priority` | `int` | Priority given to every stage run. |
| `finalRunId` | `string?` | Run of the last stage when the pipeline run succeeded. |
| `errorMessage` | `string?` | Why it failed, timed out, or was cancelled. |
| `deadlineUtc` | `DateTime?` | End of the allowed duration, or `null` without a limit. |
| `cancelRequested` | `bool` | Whether cancellation was requested. |
| `traceParent` | `string?` | W3C traceparent of the start request. |
| `startedUtc`, `completedUtc` | `DateTime?` | Start and completion times (UTC). |
| `createdUtc`, `lastUpdateUtc` | `DateTime` | Timestamps (UTC). |
| `stages` | `List<PipelineRunStage>` | Stage snapshots in order, with their progress. |
| `runs` | `List<PipelineStageRunSummary>` | Stage run summaries ordered by position and execution. Filled in by single reads, start, cancel, and retry; empty in lists. |
| `reviews` | `List<PipelineReview>` | Reviews, oldest first. Filled in like `runs`. |

#### `PipelineRunStage`

Child record of PipelineRun: the snapshot of one stage taken at start (`prs_`), with its progress. It has every `PipelineStage` setting (`position`, `name`, `description`, `agentId`, `deploymentId`, `handoffTemplateId`, `handoffTemplateVersion`, `outputCharLimit`, `maxAttempts`, `continueOnFailure`, `requiresReview`, `reviewTimeoutSeconds`, `reviewTimeoutAction`, `maxRevisions`, and `parameters` as `prp_` records with `runStageId`) plus:

| Field | Type | Description |
|---|---|---|
| `pipelineRunId` | `string` | Parent PipelineRun identifier. |
| `agentName` | `string` | Agent name at start. |
| `status` | `PipelineStageStatusEnum` | Stage status. |
| `executions` | `int` | Executions claimed so far. |
| `attempts` | `int` | Attempt number of the current execution within its retry cycle (a revision or a resume starts again at 1). |
| `revisions` | `int` | `RequestChanges` decisions applied to the stage. |
| `currentRunId` | `string?` | Run of the current execution, or `null` before it is created. |
| `lastRunId` | `string?` | Run of the previous execution. |
| `blockedReason` | `string?` | Why the current execution has no run yet: a transient refusal such as `QuotaExceeded: ...`, retried about every five seconds without using an attempt. |
| `nextAttemptUtc` | `DateTime?` | When a blocked execution is tried again. |
| `startedUtc`, `completedUtc` | `DateTime?` | When the first execution was claimed and when the stage finished. |

#### `PipelineStageRunSummary`

One stage run of a pipeline run: `runId`, `position`, `execution`, `agentName`, `status` (`RunStatusEnum`), `outcome` (`RunOutcomeEnum?`, `null` while active), `errorMessage`, `createdUtc`, `completedUtc`.

#### `PipelineReview`

A stage review (`prv_`). Authorized as `Approval`.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (`prv_`). |
| `tenantId` | `string` | Tenant identifier. |
| `pipelineRunId`, `pipelineId`, `pipelineName` | `string` | The pipeline run and its pipeline. |
| `runStageId`, `position`, `stageName` | `string`, `int`, `string` | The stage under review. |
| `runId` | `string` | The stage run whose output is under review. |
| `execution` | `int` | The stage execution under review; one review per stage execution. |
| `status` | `PipelineReviewStatusEnum` | Status. |
| `decision` | `PipelineReviewDecisionEnum?` | The decision, or `null` while pending and for cancelled reviews. |
| `decisionSource` | `PipelineReviewSourceEnum?` | Who decided, or `null` while pending. |
| `comment` | `string?` | Up to 8000 characters: notes for the next stage on `Approve`, feedback on `RequestChanges`, the reason on `Reject`, or Garrison's reason for a cancellation. |
| `decidedBy`, `decidedById` | `string?` | Display name and user or credential identifier of the decider (`timeout` or `system` for automatic decisions). |
| `timeoutAction` | `PipelineReviewDecisionEnum` | Decision applied if the review expires. |
| `requestedUtc` | `DateTime` | When the review was requested. |
| `expiresUtc` | `DateTime?` | When the timeout action applies, or `null` to wait indefinitely. |
| `decidedUtc` | `DateTime?` | When it was decided. |
| `createdUtc`, `lastUpdateUtc` | `DateTime` | Timestamps (UTC). |

#### `PipelineStartRequest`

| Field | Type | Description |
|---|---|---|
| `input` | `string` | Caller input given to every stage run. Required: a missing body or an input that is empty or only whitespace is a 400 `ValidationFailed` with field code `InputRequired` on `input`, and no pipeline run is started. |
| `inputContentType` | `string?` | Media type of the input, or `null` for `text/plain`. |
| `priority` | `int` | Priority of every stage run. Default 0. |
| `wait` | `bool` | Wait until the pipeline run ends or stops for a review. Default false. |
| `waitSeconds` | `int` | Most seconds to wait. 0 to 600, default 60. |

#### `PipelinePreviewRequest`

`input` (`string`, sample caller input) and `sampleOutputs` (`List<string>`, sample result text of each stage in order: entry `i` is what stage `i + 2` sees as `pipeline.previous.output`).

#### `PipelinePreviewResponse`

`pipelineId`, `pipelineName`, and `stages`, a list of `PipelinePreviewStage`: `position`, `stageName`, `agentName`, `deploymentId`, `deploymentName`, `success`, `prompt` (the rendered task prompt, or `null` on failure), `errorCode`, `errorMessage`.

#### `PipelineReviewDecideRequest`

`decision` (`PipelineReviewDecisionEnum`, required) and `comment` (`string?`, up to 8000 characters, required for `RequestChanges`).

#### `Trigger`

A cron schedule or signed webhook that starts runs (P12.5). See [docs/TRIGGERS.md](docs/TRIGGERS.md).

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (`trg_`). |
| `tenantId` | `string` | Tenant identifier. |
| `name` | `string` | Unique per tenant; 1 to 64 lowercase letters, digits, and hyphens. |
| `description` | `string?` | At most 4000 characters. |
| `type` | `TriggerTypeEnum` | `Cron` (default) or `Webhook`. Cannot change. |
| `targetType` | `TriggerTargetTypeEnum` | `Agent` (default) or `Pipeline`. |
| `agentId` | `string?` | Agent to run (identifier or name on input). Required for `Agent` targets. |
| `deploymentId` | `string?` | Optional deployment of that agent to pin runs to. |
| `pipelineId` | `string?` | Pipeline to start. Required for `Pipeline` targets. |
| `inputTemplateId` | `string?` | `Task` prompt template that renders the input; `null` uses `builtin/trigger-input`. |
| `priority` | `int` | Run priority, -100 to 100 (clamped), default 0. |
| `cronExpression` | `string?` | Five-field cron expression (Cron triggers only). |
| `timeZone` | `string` | IANA time zone of the expression, default `UTC`. |
| `active` | `bool` | Whether it fires. Default true. |
| `signingSecret` | `string?` | Webhook signing secret. Only in the responses to create and rotate-secret. |
| `signingSecretLast4` | `string?` | Last four characters of the current secret. |
| `signingSecretRotatedUtc` | `DateTime?` | When the secret was last set. |
| `runAsType`, `runAsId`, `runAsName` | `PrincipalTypeEnum`, `string?`, `string?` | Principal fires run as: whoever last created or updated the trigger. Read-only. |
| `lastFireUtc` | `DateTime?` | Scheduled time of the last fire. |
| `lastFireOutcome` | `TriggerFireOutcomeEnum?` | Outcome of the last fire. |
| `nextFireUtc` | `DateTime?` | Next cron occurrence for active Cron triggers, else `null`. |
| `fireCount` | `long` | Fires recorded, including failed and skipped ones. |
| `createdUtc`, `lastUpdateUtc` | `DateTime` | Timestamps (UTC). |

#### `TriggerFire`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (`tfr_`). |
| `tenantId`, `triggerId`, `triggerName` | `string` | Tenant, trigger, and the trigger's name at the time. |
| `source` | `TriggerFireSourceEnum` | `Cron`, `Webhook`, or `Manual`. |
| `deliveryId` | `string?` | `X-Garrison-Delivery` of a webhook delivery. |
| `scheduledUtc` | `DateTime` | The cron occurrence, or the arrival time. |
| `firedUtc` | `DateTime` | When the fire was processed. |
| `outcome` | `TriggerFireOutcomeEnum` | `Started`, `Failed`, or `Skipped`. |
| `runId`, `pipelineRunId` | `string?` | What the fire started. |
| `errorCode`, `errorMessage` | `string?` | Why it failed or was skipped. |
| `duplicate` | `bool` | True when a webhook response repeats an earlier fire for the same delivery identifier. Not stored. |
| `createdUtc` | `DateTime` | Timestamp (UTC). |

#### `TriggerFireRequest`

| Field | Type | Description |
|---|---|---|
| `body` | `string?` | Payload text for the input template (`webhook.body`). |
| `contentType` | `string?` | Payload media type (`webhook.contentType`). |

#### `NotificationEndpoint`

A webhook subscription to tenant events (P12.14). See [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md).

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (`nep_`). |
| `tenantId` | `string` | Tenant identifier. |
| `name` | `string` | Unique per tenant; 1 to 64 lowercase letters, digits, and hyphens. |
| `description` | `string?` | At most 4000 characters. |
| `url` | `string` | `http` or `https` destination, at most 2048 characters, checked against the SSRF rules. |
| `events` | `List<NotificationEventEnum>` | Subscribed events; at least one, `Test` excluded. |
| `agentId`, `deploymentId` | `string?` | Optional filters. With either set, pipeline events are not sent. |
| `includeResultText` | `bool` | Include run result text in run notifications. Default false. |
| `resultTextMaxChars` | `int` | Result text limit, 1 to 16000 (clamped), default 1000. |
| `active` | `bool` | Default true. |
| `signingSecret` | `string?` | Only in the responses to create and rotate-secret. |
| `signingSecretLast4` | `string?` | Last four characters of the current secret. |
| `signingSecretRotatedUtc` | `DateTime?` | When the secret was last set. |
| `createdUtc`, `lastUpdateUtc` | `DateTime` | Timestamps (UTC). Events before `createdUtc` are never sent. |

#### `NotificationDelivery`

One notification to one endpoint: the outbox row and its delivery log entry.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (`ndl_`), also the `X-Garrison-Delivery` header and payload `id`. |
| `tenantId`, `endpointId` | `string` | Tenant and endpoint. |
| `event` | `NotificationEventEnum` | Event. |
| `subjectType` | `string` | `Run`, `PipelineRun`, `Approval`, `PipelineReview`, or `Test`. |
| `subjectId` | `string?` | Identifier of the subject. |
| `status` | `NotificationDeliveryStatusEnum` | Delivery status. |
| `attempts`, `maxAttempts` | `int` | Attempts made, and the limit when it was queued. |
| `nextAttemptUtc` | `DateTime?` | Next attempt, or `null` once finished. |
| `lastStatusCode` | `int?` | HTTP status of the last attempt. |
| `lastError` | `string?` | Error of the last attempt. |
| `lastAttemptUtc` | `DateTime?` | Time of the last attempt. |
| `lastDurationMs` | `long` | Duration of the last attempt. |
| `deliveredUtc` | `DateTime?` | When the endpoint accepted it. |
| `payload` | `string` | The JSON body sent on every attempt. |
| `createdUtc`, `lastUpdateUtc` | `DateTime` | Timestamps (UTC). |

#### `TriggerTypeEnum`

`Cron`, `Webhook`

#### `TriggerTargetTypeEnum`

`Agent`, `Pipeline`

#### `TriggerFireSourceEnum`

`Cron`, `Webhook`, `Manual`

#### `TriggerFireOutcomeEnum`

`Started`, `Failed`, `Skipped`

#### `NotificationEventEnum`

`RunSucceeded`, `RunFailed` (Failed or Rejected), `RunCancelled`, `RunTimedOut`, `PipelineCompleted`, `PipelineFailed` (Failed, TimedOut, or Cancelled), `ApprovalRequested`, `Test` (test sends only)

#### `NotificationDeliveryStatusEnum`

`Pending`, `Delivering`, `Succeeded`, `Failed`

#### `PipelineRunStatusEnum`

`Running`, `AwaitingReview`, `Cancelling` (active); `Succeeded`, `Failed`, `Cancelled`, `TimedOut` (terminal)

#### `PipelineRunOutcomeEnum`

`None`, `Succeeded`, `StageFailed`, `StageStartFailed`, `ReviewRejected`, `ReviewExpired`, `Cancelled`, `TimedOut`, `InternalError`

#### `PipelineStageStatusEnum`

`Pending`, `Running`, `AwaitingReview`, `Succeeded`, `Failed`, `Cancelled`

#### `PipelineReviewStatusEnum`

`Pending`, `Approved`, `ChangesRequested`, `Rejected`, `Expired`, `Cancelled`

#### `PipelineReviewDecisionEnum`

`Approve`, `RequestChanges`, `Reject`

#### `PipelineReviewSourceEnum`

`User`, `Timeout`, `Cancelled`

#### `PromptRenderRequest`

Render a template with sample data. The sample context is user-defined JSON and intentionally schemaless.

| Field | Type | Description |
|---|---|---|
| `content` | `string?` | Template content for ad hoc renders; ignored when rendering a stored template. |
| `context` | `System.Text.Json.JsonElement?` | Sample context values merged over the built-in sample context (schemaless by design). |
| `deploymentId` | `string?` | Optional deployment whose real context (without secrets) is used as the base. |

#### `PromptRenderResponse`

Render preview result.

| Field | Type | Description |
|---|---|---|
| `rendered` | `string` | Rendered text, empty when rendering failed. |
| `success` | `bool` | Whether rendering succeeded. |
| `variables` | `List<string>` | Variables the template references. |
| `includes` | `List<string>` | Templates the template includes. |
| `errors` | `List<string>` | Validation or render errors with positions. |

#### `PromptTemplate`

Named, versioned prompt or file template.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string?` | Tenant identifier. Null for global or built-in records. |
| `name` | `string` | Template name, unique per tenant. Built-ins use the builtin/ prefix. |
| `description` | `string?` | Description. |
| `kind` | `PromptTemplateKindEnum` | Template kind. |
| `content` | `string` | Current content. |
| `currentVersion` | `int` | Current version number. |
| `isBuiltIn` | `bool` | Whether the template is seeded by the platform. |
| `builtInKey` | `string?` | Stable built-in key. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `variables` | `List<PromptTemplateVariable>` | Declared variables. |

#### `PromptTemplateKindEnum`

`System`, `Task`, `Fragment`, `ToolDescription`, `ConfigFile`, `Other`

#### `PromptTemplateVariable`

Child record of PromptTemplate: declared variables.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `promptTemplateId` | `string` | Parent PromptTemplate identifier. |
| `name` | `string` | Dotted variable path. |
| `description` | `string?` | Description. |
| `required` | `bool` | Whether the variable must be present. |
| `defaultValue` | `string?` | Default value when absent. |

#### `PromptTemplateRequest`

Create or update a prompt template. Updating content creates a new version.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Template name, unique per tenant. Names starting with builtin/ are reserved. |
| `description` | `string?` | Description. |
| `kind` | `PromptTemplateKindEnum` | Kind. |
| `content` | `string` | Template content. |
| `variables` | `List<Garrison.Core.Models.PromptTemplateVariable>` | Declared variables. |
| `changeNote` | `string?` | Note stored with the new version. |

#### `PromptTemplateVersion`

Immutable historical version of a prompt template.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string?` | Tenant identifier. Null for global or built-in records. |
| `templateId` | `string` | Template identifier. |
| `version` | `int` | Version number. |
| `content` | `string` | Content of this version. |
| `changeNote` | `string?` | Change note. |
| `createdBy` | `string?` | Principal that created the version. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `QueueSummaryRow`

Active run counts for one agent and harness.

| Field | Type | Description |
|---|---|---|
| `agentName` | `string` | Agent name. |
| `harnessType` | `HarnessTypeEnum` | Harness type. |
| `queued` | `long` | Queued runs. |
| `leased` | `long` | Leased runs. |
| `running` | `long` | Running runs. |

#### `RequestHistoryEntry`

Captured HTTP request and response.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string?` | Tenant identifier. Null for global or built-in records. |
| `userId` | `string?` | User identifier. |
| `principalName` | `string?` | Principal display name. |
| `method` | `string` | HTTP method. |
| `path` | `string` | Route path. |
| `url` | `string` | Full URL including query. |
| `statusCode` | `int` | Response status code. |
| `durationMs` | `double` | Duration in milliseconds. |
| `sourceIp` | `string?` | Source IP. |
| `requestBody` | `string?` | Request body, possibly truncated. |
| `requestBodyBytes` | `long` | Original request body length in bytes. |
| `requestBodyTruncated` | `bool` | Whether the request body was truncated. |
| `responseBody` | `string?` | Response body, possibly truncated. |
| `responseBodyBytes` | `long` | Original response body length in bytes. |
| `responseBodyTruncated` | `bool` | Whether the response body was truncated. |
| `createdUtc` | `DateTime` | Request start (UTC). |
| `completedUtc` | `DateTime?` | Response completion (UTC). |
| `headers` | `List<RequestHistoryHeader>` | Captured request and response headers (secrets redacted). |

#### `RequestHistoryHeader`

Child record of RequestHistoryEntry: captured request and response headers (secrets redacted).

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `requestHistoryEntryId` | `string` | Parent RequestHistoryEntry identifier. |
| `direction` | `HeaderDirectionEnum` | Request or response. |
| `name` | `string` | Header name. |
| `value` | `string` | Header value. |

#### `HeaderDirectionEnum`

`Request`, `Response`

#### `RequestHistoryPage`

Page of request history entries (bodies omitted).

| Field | Type | Description |
|---|---|---|
| `pageNumber` | `int` | Page number. |
| `pageSize` | `int` | Page size. |
| `totalCount` | `long` | Total matching entries. |
| `totalPages` | `int` | Total pages. |
| `objects` | `List<Garrison.Core.Models.RequestHistoryEntry>` | Entries. |

#### `RequestHistorySummary`

Time-bucketed request history summary. Every bucket in the range is present, including empty ones.

| Field | Type | Description |
|---|---|---|
| `totalCount` | `long` | Total requests. |
| `totalSuccess` | `long` | Successful requests. |
| `totalFailure` | `long` | Failed requests. |
| `averageDurationMs` | `double` | Average duration. |
| `buckets` | `List<RequestHistoryBucket>` | Buckets. |

#### `RequestHistoryBucket`

One summary bucket.

| Field | Type | Description |
|---|---|---|
| `bucketStartUtc` | `DateTime` | Bucket start (UTC). |
| `bucketEndUtc` | `DateTime` | Bucket end (UTC). |
| `successCount` | `long` | Requests with status below 400. |
| `failureCount` | `long` | Requests with status 400 or above. |
| `averageDurationMs` | `double` | Average duration. |

#### `RestartResponse`

Restart acknowledgement.

| Field | Type | Description |
|---|---|---|
| `restarting` | `bool` | Whether the process will exit. |
| `node` | `string` | Node identifier. |

#### `Role`

Role grouping permissions. Built-in roles have a null tenant.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string?` | Tenant identifier. Null for global or built-in records. |
| `name` | `string` | Role name. |
| `description` | `string?` | Description. |
| `isBuiltIn` | `bool` | Whether the role is seeded by the platform. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `RolePermissionMap`

Association between a role and a permission.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string?` | Tenant identifier. Null for global or built-in records. |
| `roleId` | `string` | Role identifier. |
| `permissionId` | `string` | Permission identifier. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `RolePermissionRequest`

Role to permission mapping request.

| Field | Type | Description |
|---|---|---|
| `roleId` | `string?` | Role identifier. |
| `permissionId` | `string?` | Permission identifier. |

#### `RoleRequest`

Custom role create or update request.

| Field | Type | Description |
|---|---|---|
| `name` | `string?` | Role name. Required on create. |
| `description` | `string?` | Description. |
| `active` | `bool?` | Whether the role is active. |

#### `RunCompleteRequest`

Worker report that a run finished.

| Field | Type | Description |
|---|---|---|
| `nodeId` | `string` | Node identifier. |
| `epoch` | `long` | Fencing epoch. |
| `status` | `RunStatusEnum` | Terminal status: Succeeded, Failed, Cancelled, or TimedOut. |
| `outcome` | `RunOutcomeEnum` | Outcome code. |
| `exitCode` | `int?` | Exit code. |
| `resultText` | `string?` | Final result text. |
| `structuredOutputJson` | `string?` | Structured output JSON. |
| `sessionId` | `string?` | Harness session identifier. |
| `servedModel` | `string?` | Model that served the run. |
| `stderrTail` | `string?` | Scrubbed stderr tail. |
| `errorMessage` | `string?` | Error message. |
| `inputTokens` | `long` | Input tokens. |
| `outputTokens` | `long` | Output tokens. |
| `cachedTokens` | `long` | Cached input tokens. |
| `costUsd` | `double?` | Cost in USD. |
| `costEstimated` | `bool` | Whether the cost is estimated. |
| `completedUtc` | `DateTime` | Completion time (UTC). |
| `repairAttempt` | `int` | Execution this report covers: 0 for the original execution, 1 for the structured output repair. Default 0. |
| `supportsRepair` | `bool` | Whether the worker can run a structured output repair inside the same lease. Default false. |

#### `RunCompleteResponse`

Control plane answer to a completion report.

| Field | Type | Description |
|---|---|---|
| `accepted` | `bool` | Whether the report was accepted. |
| `message` | `string?` | Optional message. |
| `repair` | `ExecutionSpec?` | Spec of the structured output repair to run in the same lease, or `null` when the run is finished. |
| `repairAttempt` | `int` | Repair attempt the spec runs (1), or 0. |
| `eventSequenceStart` | `long` | Last stored event sequence (including the validation warning); the repair's events follow it. 0 when there is no repair. |

#### `RunCreateRequest`

Request to create a run.

| Field | Type | Description |
|---|---|---|
| `agentId` | `string?` | Agent identifier (or supply AgentName). |
| `agentName` | `string?` | Agent name (or supply AgentId). |
| `deploymentId` | `string?` | Specific deployment; null picks a weighted active deployment. |
| `input` | `string` | Input message. Required: a missing body or an input that is empty or only whitespace is a 400 `ValidationFailed` with field code `InputRequired` on `input`, and no run is created. An agent with structured input takes its JSON document here. |
| `inputContentType` | `string?` | Input content type, default text/plain. |
| `parameters` | `Dictionary<string, string>` | Per-run parameter overrides allowed by the deployment. |
| `priority` | `int` | Priority from -100 to 100; higher runs first. |
| `wait` | `bool` | Whether to wait for completion before responding. |
| `waitSeconds` | `int` | Maximum seconds to wait (1 to 600). |
| `cancelOnDisconnect` | `bool?` | When waiting, whether the run is cancelled if the client disconnects before it finishes. Null means true; false keeps the run going. The query parameter `cancelOnDisconnect` overrides it. |
| `conversationId` | `string?` | Conversation to continue: the run becomes its next turn and resumes the harness session of the earlier turns. 404 when it names no conversation of the tenant, 409 `ConversationAgentMismatch` for another agent's conversation, 409 `ConversationDeploymentMismatch` when `deploymentId` names another deployment, 409 `ConversationBusy` while the previous turn is unfinished. |
| `startConversation` | `bool` | Start a new conversation with this run as its first turn; the run's `conversationId` names it. Ignored when `conversationId` is set. Default false. |

#### `RunEventsRequest`

Batch of run events.

| Field | Type | Description |
|---|---|---|
| `nodeId` | `string` | Node identifier. |
| `epoch` | `long` | Fencing epoch. |
| `events` | `List<RunEventReport>` | Events in sequence order. |

#### `RunEventReport`

Normalized event reported by a worker.

| Field | Type | Description |
|---|---|---|
| `sequence` | `long` | Per-run sequence assigned by the worker, starting at 1. |
| `eventType` | `RunEventTypeEnum` | Event type. |
| `timestampUtc` | `DateTime` | Event time (UTC). |
| `code` | `string?` | Stable machine code for text Garrison writes itself (for example `WorkspacePrepared`, `HarnessExited`, `RunBlocked`); null for harness or model text. |
| `text` | `string?` | Text content. |
| `toolName` | `string?` | Tool name. |
| `toolCallId` | `string?` | Tool call identifier. |
| `success` | `bool?` | Tool result success. |
| `inputTokens` | `long?` | Input tokens for usage events. |
| `outputTokens` | `long?` | Output tokens for usage events. |
| `rawEventJson` | `string?` | Verbatim harness event; merged text events contain the original lines separated by newline (JSONL). |

#### `RunEventTypeEnum`

`Lifecycle`, `AssistantText`, `Thinking`, `ToolCall`, `ToolResult`, `Usage`, `Progress`, `Warning`, `Error`, `Stdout`, `Stderr`, `Result`

#### `RunEventsResponse`

Page of run events.

| Field | Type | Description |
|---|---|---|
| `runId` | `string` | Run identifier. |
| `status` | `RunStatusEnum` | Current run status. |
| `events` | `List<Garrison.Core.Models.RunEvent>` | Events in sequence order. |
| `lastSequence` | `long` | Highest sequence returned, or the requested afterSequence when empty. |
| `hasMore` | `bool` | Whether more events are immediately available. |

#### `RunEvent`

Normalized event emitted by a run.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `runId` | `string` | Run identifier. |
| `sequence` | `long` | Per-run sequence number. |
| `eventType` | `RunEventTypeEnum` | Event type. |
| `timestampUtc` | `DateTime` | Event time (UTC). |
| `code` | `string?` | Stable machine code for text Garrison writes itself (for example `WorkspacePrepared`, `HarnessExited`, `RunBlocked`); null for harness or model text. |
| `text` | `string?` | Text content. |
| `toolName` | `string?` | Tool name. |
| `toolCallId` | `string?` | Tool call identifier. |
| `success` | `bool?` | Success flag for tool results. |
| `inputTokens` | `long?` | Input tokens for usage events. |
| `outputTokens` | `long?` | Output tokens for usage events. |
| `rawEventJson` | `string?` | Verbatim harness event (unmanaged JSON); merged text events contain the original lines separated by newline (JSONL). |
| `createdUtc` | `DateTime` | Persisted (UTC). |

#### `RunStartedRequest`

Worker start gate request, sent before the harness is launched (and optionally again with the process identifier once it runs).

| Field | Type | Description |
|---|---|---|
| `nodeId` | `string` | Node identifier. |
| `epoch` | `long` | Fencing epoch. |
| `processId` | `int?` | Process identifier; null on the start gate call made before launching. |
| `startedUtc` | `DateTime` | Start time (UTC). |

#### `Secret`

Encrypted credential or secret value.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `name` | `string` | Secret name. |
| `description` | `string?` | Description. |
| `kind` | `SecretKindEnum` | Secret kind. |
| `valueLast4` | `string?` | Last four characters of the value. |
| `fingerprint` | `string?` | SHA-256 fingerprint prefix of the value. |
| `keyVersion` | `int` | Master key version used for encryption. |
| `expiresUtc` | `DateTime?` | Expiration (UTC). |
| `rotatedUtc` | `DateTime?` | Last value change (UTC). |
| `status` | `SecretStatusEnum` | Health of the stored credential: `Ok`, or `NeedsReauthentication` when a `CodexAuthJson` login can no longer be refreshed. Setting a new value returns it to `Ok`. |
| `statusMessage` | `string?` | Why the secret is not `Ok`, for example the provider error code and description. |
| `statusUtc` | `DateTime?` | When the status left `Ok` (UTC). |
| `refreshedUtc` | `DateTime?` | When the control plane last refreshed the stored login itself (UTC). `CodexAuthJson` only. |
| `accessTokenExpiresUtc` | `DateTime?` | When the access token in the stored login expires (UTC, from its `exp` claim). `CodexAuthJson` ChatGPT logins only. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `SecretKindEnum`

`AnthropicApiKey`, `ClaudeCodeOAuthToken`, `OpenAiApiKey`, `CodexAuthJson`, `GeminiApiKey`, `GenericEnv`, `GenericFile`, `BearerToken`, `BasicAuth`, `GitCredential`

#### `SecretStatusEnum`

`Ok`, `NeedsReauthentication`

`NeedsReauthentication` (G-22) is set by the control plane when OpenAI rejects the refresh of a `CodexAuthJson` ChatGPT login for good (`refresh_token_reused`, `refresh_token_expired`, `refresh_token_invalidated`, `invalid_grant`, or HTTP 401). Runs that bind the secret then fail at once with outcome `NotCredentialed`. Replace the value (`PUT .../secrets/{id}/value`, `POST .../secrets/{id}/rotate`, an update that includes `value`, or a manifest apply with a new value) to return it to `Ok`. The control plane refreshes `CodexAuthJson` logins itself before they expire and writes the rotated tokens back to the secret, which changes `refreshedUtc`, `accessTokenExpiresUtc`, `valueLast4`, and `fingerprint` but not `rotatedUtc`. See `docs/HARNESSES.md`, ChatGPT logins.

#### `SecretRequest`

Create or update a secret. The value is write-only and never returned.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Name, unique per tenant. |
| `description` | `string?` | Description. |
| `kind` | `SecretKindEnum` | Kind. |
| `value` | `string?` | Secret value; omit on update to keep the current value. |
| `expiresUtc` | `DateTime?` | Expiration (UTC). |

#### `SecretValueRequest`

Set or rotate a secret value.

| Field | Type | Description |
|---|---|---|
| `value` | `string` | New value. |

#### `ServerInfoResponse`

Server information for the dashboard.

| Field | Type | Description |
|---|---|---|
| `product` | `string` | Product name. |
| `version` | `string` | Product version. |
| `nodeId` | `string` | Node identifier. |
| `restUrl` | `string` | Public REST base URL. |
| `mcpUrl` | `string?` | Public MCP URL including the path, or null when disabled. |
| `a2aUrl` | `string` | A2A base URL. |
| `openApiUrl` | `string` | OpenAPI document URL. |
| `databaseType` | `string` | Database provider. |
| `expectedReplicas` | `int` | Configured control-plane replicas. |
| `telemetryEnabled` | `bool` | Whether telemetry is active. |
| `requestHistoryEnabled` | `bool` | Whether request history capture is enabled. |
| `routeCount` | `int` | Registered routes and tools in the operation scope map. |
| `repositoryUrl` | `string` | Repository URL. |
| `startedUtc` | `DateTime` | Process start (UTC). |
| `features` | `List<string>` | Enabled feature flags. |
| `observability` | `ObservabilityInfo` | Observability URLs and Grafana UIDs; always present, with `null` fields when not configured. |

#### `SettingsSaveResponse`

Result of a settings save.

| Field | Type | Description |
|---|---|---|
| `saved` | `bool` | Whether the change was saved. |
| `restartRequired` | `bool` | Whether a restart is needed for some changes. |
| `appliedLive` | `List<string>` | Paths applied immediately. |
| `pendingRestart` | `List<string>` | Paths that apply after restart. |
| `settings` | `SettingsView` | Updated settings. |

#### `SettingsView`

Settings with metadata.

| Field | Type | Description |
|---|---|---|
| `settingsFile` | `string?` | Settings file path. |
| `settingsFileWritable` | `bool` | Whether file settings can be saved. |
| `restartPending` | `bool` | Whether a restart-required change was saved since start. |
| `fields` | `List<SettingField>` | Fields. |

#### `SettingField`

One setting with metadata for the Settings page.

| Field | Type | Description |
|---|---|---|
| `path` | `string` | Dotted path. |
| `group` | `string` | Group, for example Rest or Scheduling. |
| `description` | `string` | Description. |
| `type` | `string` | Value type: string, int, bool, enum, secret. |
| `value` | `string?` | Current value; for secrets, null (see IsSet). |
| `isSecret` | `bool` | Whether the value is a secret. |
| `isSet` | `bool` | For secrets, whether a value is configured. |
| `source` | `string` | Source: File, Environment, ConfigMap, or Database. |
| `applyMode` | `string` | Live or RestartRequired. |
| `editable` | `bool` | Whether the dashboard may change it. |
| `minimum` | `long?` | Minimum for numeric values. |
| `maximum` | `long?` | Maximum for numeric values. |
| `allowedValues` | `List<string>?` | Allowed values for enums. |

#### `SettingsUpdateRequest`

Settings update. Each entry sets one setting by dotted path; secrets are changed only when a new non-mask value is supplied.

| Field | Type | Description |
|---|---|---|
| `values` | `List<SettingValue>` | Values to set. |

#### `SettingValue`

One setting assignment.

| Field | Type | Description |
|---|---|---|
| `path` | `string` | Dotted setting path, for example Rest.Port or Scheduling.LeaseDurationMs. |
| `value` | `string?` | Value as text. |

#### `Tenant`

Tenant, the top-level isolation boundary.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `name` | `string` | Tenant name. |
| `description` | `string?` | Optional description. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `requireUntrustedDeployments` | `bool` | Require every deployment in the tenant to be `Untrusted`. Default false. See [Deployment trust level](#deployment-trust-level-trustlevel). |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `TenantRequest`

Tenant create or update request.

| Field | Type | Description |
|---|---|---|
| `name` | `string?` | Tenant name. Required on create. |
| `description` | `string?` | Description. |
| `active` | `bool?` | Whether the tenant is active. |
| `requireUntrustedDeployments` | `bool?` | Require `Untrusted` deployments. Null keeps the current value (false on create). Turning it on does not change existing deployments; their next update must set `Untrusted`. |

#### `TokenDetailsResponse`

Authenticated principal details.

| Field | Type | Description |
|---|---|---|
| `principalType` | `PrincipalTypeEnum` | Principal type. |
| `principalId` | `string?` | Principal identifier. |
| `principalName` | `string?` | Principal display name. |
| `tenantId` | `string?` | Tenant identifier. |
| `userId` | `string?` | User identifier. |
| `credentialId` | `string?` | Credential identifier. |
| `runId` | `string?` | Run identifier for run tokens. |
| `sessionId` | `string?` | Session identifier. |
| `authScheme` | `AuthSchemeEnum?` | Authentication scheme. |
| `isAdmin` | `bool` | Whether the principal is a system administrator. |
| `isTenantAdmin` | `bool` | Whether the principal is a tenant administrator. |
| `email` | `string?` | User email. |
| `firstName` | `string?` | User first name. |
| `lastName` | `string?` | User last name. |
| `expiresUtc` | `DateTime?` | Token expiry (UTC). |

#### `TokenRequest`

Token issuance request. Supply tenant, email, and password for a user session, or access key and secret key for a credential session. Header equivalents are accepted.

| Field | Type | Description |
|---|---|---|
| `tenantId` | `string?` | Tenant identifier for user login. Defaults to the Default tenant. |
| `email` | `string?` | User email. |
| `password` | `string?` | User password. |
| `accessKey` | `string?` | Credential access key. |
| `secretKey` | `string?` | Credential secret key. |

#### `TokenResponse`

Issued session token.

| Field | Type | Description |
|---|---|---|
| `token` | `string` | Opaque token for Authorization: Bearer or x-token. |
| `expiresUtc` | `DateTime` | Expiry (UTC). |
| `tenantId` | `string?` | Tenant the token is bound to. |
| `sessionId` | `string` | Session identifier. |
| `principalType` | `PrincipalTypeEnum` | Principal type. |

#### `User`

User within a tenant.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `firstName` | `string?` | First name. |
| `lastName` | `string?` | Last name. |
| `email` | `string` | Email address, unique within a tenant. |
| `isAdmin` | `bool` | Whether the user is a system administrator (bypasses all checks). |
| `isTenantAdmin` | `bool` | Whether the user is a tenant administrator (bypasses RBAC within the tenant). |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `UserRequest`

User create or update request. Omitted fields are left unchanged on update.

| Field | Type | Description |
|---|---|---|
| `email` | `string?` | Email, unique within the tenant. Required on create. |
| `password` | `string?` | Password. Required on create; supplying it on update changes the password. |
| `firstName` | `string?` | First name. |
| `lastName` | `string?` | Last name. |
| `isTenantAdmin` | `bool?` | Whether the user is a tenant administrator. |
| `isAdmin` | `bool?` | Whether the user is a system administrator. Only system administrators may set it. |
| `active` | `bool?` | Whether the user is active. |

#### `UserRoleAssignment`

Assignment of a role to a user at a scope.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `userId` | `string` | User identifier. |
| `roleId` | `string?` | Role identifier. |
| `roleName` | `string?` | Built-in role name fallback. |
| `resourceScope` | `ResourceScopeEnum` | Tenant or resource scope. |
| `resourceId` | `string?` | Target resource identifier when resource-scoped. |
| `inheritsToChildren` | `bool` | Whether a tenant-scoped grant flows to resources in the tenant. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `WorkspaceTemplate`

Defines how a run workspace is prepared.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `tenantId` | `string` | Tenant identifier. |
| `name` | `string` | Template name. |
| `description` | `string?` | Description. |
| `kind` | `WorkspaceKindEnum` | Workspace kind. |
| `gitUrl` | `string?` | Repository URL for GitRepository workspaces. |
| `gitRef` | `string?` | Branch, tag, or commit. |
| `gitDepth` | `int` | Clone depth. Minimum 0 (full), maximum 10000, default 1. |
| `gitCredentialSecretId` | `string?` | Secret holding git credentials. |
| `persistentVolumeClaim` | `string?` | For PersistentVolume workspaces: name of an existing PersistentVolumeClaim (DNS-1123) in the run namespace, mounted at the workspace path. |
| `retention` | `WorkspaceRetentionEnum` | Retention policy. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `files` | `List<WorkspaceFile>` | Seeded files. |

#### `WorkspaceFile`

Child record of WorkspaceTemplate: seeded files.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `workspaceTemplateId` | `string` | Parent WorkspaceTemplate identifier. |
| `path` | `string` | Relative path. |
| `content` | `string` | Content. |


### Executor capability fields

Deployment create/update accepts `requiredCapabilities`:

```json
{"isolation":"Container","egressControl":false,"filesystemSnapshot":false,"sessionContinuation":false,"crossNodeRestore":false,"coldStartClass":"Cold"}
```

Isolation values are `Process`, `Container`, and `SandboxedRuntime`; startup classes are `Immediate`, `Cold`, and `Warm` (omit or use null to accept any class). Defaults impose no advanced requirement. Select the appropriate `executor` separately, such as `KubernetesJob` for Container isolation. A session requirement needs a resume-capable harness profile. Runs expose the admission-time requirement copy. Worker registration and node reads expose `executorCapabilities`, an array with `executor` plus these capability fields. Missing reports make no advanced promise. The legacy `executors` list remains supported.

Unsupported requirements stay queued with `blockedReason: "NoCapableWorker"`; they never fall back to a less capable executor. Registration rejects unknown enum values and duplicate executor reports. See `docs/ARCHITECTURE.md` for current supported capabilities.

### Deployment trust level (`trustLevel`)

Deployments carry `trustLevel`: `Trusted` (the default for new deployments, and the value every deployment that existed before schema 23 keeps) or `Untrusted`. Choose `Untrusted` when callers or the content a run reads may be hostile, for example public A2A callers, issue text from the internet, or untrusted repositories.

- An `Untrusted` deployment raises the isolation every run needs to at least `Container`, on top of its own `requiredCapabilities` (a stronger requirement such as `SandboxedRuntime` is kept). The run's `requiredCapabilities` shows the raised value, and the run records `trustLevel`. Like other requirements, this is copied at admission, so editing the deployment does not change queued runs.
- When `executor` is unset, an `Untrusted` deployment resolves to `KubernetesJob` instead of a `Process` pool default or `Process`. Setting `executor: "Process"` on an `Untrusted` deployment is rejected with a 400 field error on `executor`, code `UntrustedNeedsIsolation`.
- An `Untrusted` run is never claimed by a worker without the isolation: candidate selection, the atomic claim, and the delegated child reserve claim all match the stored requirement. When no Ready worker can isolate it, the run stays `Queued` with `blockedReason: "NoIsolatingWorker"` and is not rejected at submit. `Runtime.FailBlockedAfterSeconds` applies as for other blocked runs.
- A delegated child runs under its own deployment's trust level. An `Untrusted` parent may delegate to a `Trusted` child when the delegation rules allow it; the child's input is then the parent's output, so allow-list only children whose deployments you would trust with that content, or make them `Untrusted` too.
- Changes to `trustLevel` go through the usual deployment update audit record, which names the old and new level.

Tenants carry `requireUntrustedDeployments` (default `false`), set with `PUT /v1.0/api/tenants/{tenantId}` (`TenantRequest.requireUntrustedDeployments`). While it is `true`, creating or updating a `Trusted` deployment in that tenant, over REST, MCP, or manifest apply, is rejected with a 400 field error on `trustLevel`, code `TenantRequiresUntrusted`. Turning it on does not rewrite existing deployments: `Trusted` deployments keep running as configured (their runs are admitted as before), the dashboard flags them, and their next configuration update must set `Untrusted`. The change is audited on the tenant.

```json
{ "code": "ValidationFailed", "message": "The deployment is invalid.",
  "fields": { "trustLevel": "Tenant default requires every deployment to be Untrusted; set trustLevel to Untrusted." },
  "fieldCodes": { "trustLevel": "TenantRequiresUntrusted" } }
```

### Deployment egress allowlist (`egressRules`)

`egressRules` narrows what a deployment's runs can reach on the network (P11.15). Each rule is a `DeploymentEgressRule`:

| Field | Type | Description |
|---|---|---|
| `cidr` | `string` | Required. IPv4 or IPv6 block in CIDR notation, written as its network address (`203.0.113.0/24`, `198.51.100.7/32`, `2001:db8::/32`). Host names are not accepted; resolve them yourself. |
| `port` | `int?` | Destination port, 1 to 65535. Null or omitted allows every port. |
| `protocol` | `EgressProtocolEnum` | `TCP` (default) or `UDP`. |

An empty list (the default) keeps the cluster's default run egress. With at least one rule:

- The run pod may reach only DNS (port 53), the Garrison server MCP port, and the listed rules; the default HTTPS-to-anywhere rule does not apply to it.
- Every run requires `EgressControl` and at least `Container` isolation, recorded in its `requiredCapabilities` at admission, and an unset `executor` resolves to `KubernetesJob`. Only KubernetesJob workers with egress allowlists enabled report `EgressControl`.
- When no Ready worker can enforce the rules, the run stays `Queued` with `blockedReason: "NoIsolatingWorker"`. It is never run without them.
- The rules are compiled into the run's spec when it is leased, so a deployment edit applies to runs not yet leased. A run admitted for the `Process` executor before rules were added fails when it is leased (outcome `CompileFailed`, `ExecutorMismatch` in its error message) instead of running unenforced; submit it again.

Validation errors are 400 `ValidationFailed` with these field codes:

| Field | Code | Meaning |
|---|---|---|
| `egressRules` | `TooManyEgressRules` | More than 64 rules. |
| `egressRules[i].cidr` | `InvalidCidr` | Not a CIDR block, host bits set, a host name, leading zeros, or an IPv4-mapped IPv6 address. |
| `egressRules[i].port` | `PortOutOfRange` | Port below 1 or above 65535. |
| `egressRules[i].protocol` | `InvalidProtocol` | Not `TCP` or `UDP`. |
| `executor` | `EgressRulesNeedKubernetesJob` | `executor: "Process"` with rules. |
| `requiredCapabilities.coldStartClass` | `EgressRulesNeedColdStart` | `Warm` startup with rules (warm pods already run under the default egress). |

```json
{ "egressRules": [ { "cidr": "203.0.113.0/24", "port": 443, "protocol": "TCP" }, { "cidr": "198.51.100.7/32" } ] }
```

Changes to `egressRules` are named in the deployment update audit record. See `docs/SECURITY.md`, "Egress allowlists", for how workers enforce them.

### Effect policy (`effectPolicy`)

A deployment's `effectPolicy` says what Garrison may do with a run whose worker was lost after the harness started (the lease expired while the run was `Running`, or a KubernetesJob run pod was evicted or deleted). A started harness may already have pushed a commit, sent a message, or called a paid API, and Garrison cannot tell which, so starting it again can repeat those effects.

| Value | A lost `Running` run |
|---|---|
| `AtMostOnce` | Ends `Failed` with outcome `NodeLost`. Effects happen at most once. The default for new deployments. |
| `AtLeastOnce` | Is requeued for another attempt while `maxAttempts` allows. Choose it only when repeating the run's effects is acceptable (read-only or idempotent work). |
| `Journaled` | Will be requeued only when every effect went through Garrison's effect journal and none has an unknown outcome. The journal (plan P12.33) does not exist yet, so today `Journaled` behaves exactly like `AtMostOnce`. |

- A run that was still `Leased` when its lease expired never started a harness (the start gate), so it is requeued under every policy while attempts remain. A cancelled run is never requeued.
- The run records the policy it was admitted under (`Run.effectPolicy`), and the reaper uses that value. Changing the deployment does not change how runs already queued or running are handled.
- Delegated child runs and pipeline stage runs are admitted under their own deployment's policy, not the parent's.
- Policy changes appear in the deployment update audit record, which names the old and new policy.
- Schema 24 carried every existing deployment over: `retryOnNodeLoss: true` became `AtLeastOnce` and `false` became `AtMostOnce`, and runs that existed then took their deployment's mapped policy, so their behaviour did not change.

`retryOnNodeLoss` is deprecated and is still accepted on input for one release, over REST, MCP management tools, and manifests. If a request sends only `retryOnNodeLoss`, `true` maps to `AtLeastOnce` and `false` to `AtMostOnce`. If it sends both and they disagree (`retryOnNodeLoss: true` with anything but `AtLeastOnce`, or `false` with `AtLeastOnce`), the request is rejected. Responses always carry `effectPolicy` and a derived, read-only `retryOnNodeLoss` that is `true` only for `AtLeastOnce`, so older clients keep reading a meaningful value. When you change `effectPolicy` on a deployment you read back, drop `retryOnNodeLoss` from the body or update it to match.

```json
{ "code": "ValidationFailed", "message": "The deployment is invalid.",
  "fields": { "effectPolicy": "effectPolicy AtMostOnce disagrees with the deprecated retryOnNodeLoss value. Send only effectPolicy (retryOnNodeLoss true means AtLeastOnce, false means AtMostOnce)." },
  "fieldCodes": { "effectPolicy": "EffectPolicyConflict" } }
```

Worker capability records additionally expose `warmStart` (boolean, default false). A Kubernetes executor with primary `coldStartClass: "Cold"` and `warmStart: true` satisfies either Cold or Warm requirements. Explicit Warm requirements reject custom deployment pod resources and PersistentVolume workspaces. Node lease responses include `queuedKubernetesRuns`, a bounded eligible queue estimate for adaptive warm-stock sizing; it is zero for workers without warm support.

### Optional provider API deployment

The existing agent/deployment APIs support `hrn_builtin_provider_api` (`harnessType: ProviderApi`, `outputParser: ProviderApiJsonl`). Set an explicit deployment model and `baseUrl` parameter, bind an `OpenAiApiKey` secret, and use the usual prompt bindings. Existing invoke, conversation, approval, artifact, and cost-estimation endpoints apply. See [configuration and limits](docs/PROVIDER_API.md). Daily quotas remain opt-in.


### Agent Studio models (0.2.0)

Models added for revisions, assets, file spaces, capabilities, fan-out, agentic apps, and the studio (AD1 to AD9).

#### `AgentRevision`

An immutable snapshot of an agent's definition (AD1, AD-003). An agent has at most one open draft at a time; a published revision never changes again. Deployments pin a revision, or follow the agent's latest published revision when unpinned (AD-012). Runs record the revision they compiled from.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (prefix arv_). |
| `tenantId` | `string` | Tenant identifier. |
| `agentId` | `string` | Agent identifier. |
| `number` | `integer` | Revision number, per agent, starting at 1. A published number is never reused; the number of a discarded draft goes to the next revision. |
| `contentHash` | `string` | SHA-256 (lowercase hex) of the revision's content fields, computed by `AgentRevisionContent`. Two revisions with the same hash define the agent the same way. |
| `displayName` | `string?` | Display name. |
| `description` | `string?` | Description. |
| `inputMode` | `AgentInputModeEnum` | Input mode. |
| `inputSchemaJson` | `string?` | Input JSON Schema copied from the agent (unmanaged JSON column, section 7.3 of the plan). |
| `outputSchemaJson` | `string?` | Output JSON Schema copied from the agent (unmanaged JSON column, section 7.3 of the plan). |
| `delegationMode` | `DelegationModeEnum` | Delegation mode. |
| `delegationMaxDepth` | `integer` | Maximum delegation depth below this agent. Minimum 0, maximum 10, default 2. Values outside the range are clamped. |
| `delegationAllowRecursion` | `boolean` | Whether the agent may appear twice in a delegation chain. |
| `delegationAllowList` | `string[]` | Agent names this revision may delegate to when the mode is AllowList. |
| `promptPins` | `AgentRevisionPromptPin[]` | Prompt templates the revision uses, with optional version pins. |
| `assetPins` | `AgentRevisionAssetPin[]` | Assets the revision uses (AD2), with optional version pins. |
| `capabilities` | `string[]` | Names of capabilities the revision is bound to (AD4). Empty until capabilities are bound. |
| `tags` | `string[]` | Tags. |
| `authorUserId` | `string?` | User identifier of the author, when a user created the revision. |
| `authorName` | `string?` | Display name of the author (user email, credential name, or "system"). |
| `changeNote` | `string?` | Optional change note, at most 2000 characters. |
| `publishedByUserId` | `string?` | User identifier of the person who published the revision. |
| `publishedByName` | `string?` | Display name of the publisher. |
| `publishedUtc` | `DateTime?` | When the revision was published, or null for a draft. |
| `createdUtc` | `DateTime` | Creation timestamp, UTC. |
| `lastUpdateUtc` | `DateTime` | Last update timestamp, UTC. A published revision is never updated after publication. |

#### `AgentRevisionAssetPin`

An asset an agent revision uses (AD2), optionally pinned to one version.

| Field | Type | Description |
|---|---|---|
| `assetId` | `string` | Asset identifier. |
| `version` | `integer?` | Pinned version, or null to use the asset's current version at compile time. For a SystemPrompt asset this is a version of its prompt template. |

#### `AgentRevisionPromptPin`

A prompt template an agent revision uses, optionally pinned to one version (AD1). Roles are ToolDescription and SkillDescription today (the templates that describe the agent as an MCP tool and as A2A skills).

| Field | Type | Description |
|---|---|---|
| `role` | `string` | Role the template plays, for example ToolDescription. 1 to 64 characters. |
| `templateId` | `string` | Prompt template identifier. |
| `pinnedVersion` | `integer?` | Pinned template version, or null to follow the template's current version. |

#### `AgentRevisionStateEnum`

`Draft`, `Published`

#### `PromotionRecord`

A promotion or rollback (AD1.4): which revision moved from which environment to which, the deployments it repinned, and the pins they had before, so the change can be rolled back. Written in the same transaction as the repinning, and audited.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (prefix pro_). |
| `tenantId` | `string` | Tenant identifier. |
| `kind` | `PromotionKindEnum` | Kind: Promote or Rollback. |
| `outcome` | `PromotionOutcomeEnum` | Outcome. A promotion that was later rolled back reads RolledBack. |
| `agentId` | `string?` | Agent promoted, for an agent promotion. |
| `appId` | `string?` | Agentic app promoted, for an app promotion (AD6.4). |
| `appRevisionId` | `string?` | App revision promoted, for an app promotion (AD6.4). |
| `agentRevisionId` | `string?` | Agent revision promoted, for an agent promotion. |
| `sourceEnvironment` | `string` | Environment the revision came from. |
| `targetEnvironment` | `string` | Environment whose deployments were repinned. |
| `skippedEnvironments` | `boolean` | Whether the promotion skipped environments in the ordered list (allowSkip). |
| `rollbackOfId` | `string?` | For a rollback, the promotion it reverted. |
| `rolledBackById` | `string?` | For a promotion that was rolled back, the rollback record. |
| `actorType` | `PrincipalTypeEnum` | Principal type of the actor. |
| `actorId` | `string?` | Actor identifier (user or credential). |
| `actorName` | `string?` | Actor display name. |
| `note` | `string?` | Optional note, at most 2000 characters. |
| `items` | `PromotionRecordItem[]` | Deployments repinned, with their previous pins. |
| `createdUtc` | `DateTime` | Creation timestamp, UTC. |

#### `AgentAsset`

A versioned file set an agent needs at run time (AD2, AD-004): a skill, a reference file, a document template, or a system prompt. A SystemPrompt asset names a prompt template and has no files (AD-010); the other kinds have versions with one or more files, stored under the reserved .garrison-assets/ prefix of an artifact store (AD-011). Asset files are not artifacts: they never appear in artifact listings and are not removed by artifact retention.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (prefix aas_). |
| `tenantId` | `string` | Tenant identifier. |
| `name` | `string` | Name, unique per tenant: 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit. Placement paths use it, for example .claude/skills/{name}/. |
| `description` | `string?` | Optional description, at most 4000 characters. The asset listing in the system prompt shows it. |
| `promptTemplateId` | `string?` | Prompt template identifier. Required for SystemPrompt assets (AssetTemplateRequired otherwise) and refused for the other kinds. |
| `artifactStoreId` | `string?` | Artifact store holding the files, or null to keep them in the Garrison database (AD-011). Cannot change once the asset has versions. |
| `currentVersion` | `integer` | Latest version number, or 0 when the asset has no versions yet. Set by the server. |
| `tags` | `string[]` | Tags. |
| `createdUtc` | `DateTime` | Creation timestamp, UTC. |
| `lastUpdateUtc` | `DateTime` | Last update timestamp, UTC. |

#### `AgentAssetKindEnum`

`SystemPrompt`, `Skill`, `ReferenceFile`, `DocumentTemplate`

#### `AgentAssetFile`

One file of an agent asset version (AD2).

| Field | Type | Description |
|---|---|---|
| `path` | `string` | Path inside the asset, relative, with forward slashes, for example SKILL.md or templates/report.docx. No leading slash, no backslash, no "." or ".." segments; at most 512 characters. |
| `mediaType` | `string` | Media type, for example text/markdown. On upload, an empty value is guessed from the file extension, falling back to application/octet-stream. |
| `sizeBytes` | `integereger` | Size in bytes. |
| `sha256` | `string` | SHA-256 of the content, lowercase hex. |
| `storageKey` | `string` | Storage key inside the asset's store, under the reserved .garrison-assets/ prefix. Set by the server; never accepted from clients. |
| `contentBase64` | `string?` | Content as base64, only on upload requests and never returned in responses. |

#### `ConversationFileSpace`

A file area shared by every turn of one conversation and every run in its delegation trees (AD3, AD-014). A pipeline run's stages share their pipeline run's space, and a root run without a conversation or pipeline owns its own space. Content lives under the reserved .garrison-files/ prefix of the owner's deployment artifact store, or in the Garrison database. File spaces are not artifacts.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (prefix cfs_). |
| `tenantId` | `string` | Tenant identifier. |
| `ownerKey` | `string` | Owner key, unique per tenant: cnv:{conversationId}, plr:{pipelineRunId}, or run:{rootRunId}. |
| `conversationId` | `string?` | Conversation that owns the space, or null. |
| `pipelineRunId` | `string?` | Pipeline run that owns the space, or null. |
| `rootRunId` | `string?` | Root run that owns the space when there is no conversation or pipeline run, or null. |
| `artifactStoreId` | `string?` | Artifact store holding the content, or null for the Garrison database. Taken from the owner's deployment when the space is created. |
| `fileCount` | `integer` | Number of files that are not deleted. |
| `totalBytes` | `integereger` | Bytes of the current versions of files that are not deleted. |
| `createdUtc` | `DateTime` | Creation timestamp, UTC. |
| `lastUpdateUtc` | `DateTime` | Last change, UTC. |

#### `ConversationFile`

A file in a conversation file space (AD3) with its current version. Deleting a file marks it deleted; its versions stay until the space is removed.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (prefix cff_). |
| `tenantId` | `string` | Tenant identifier. |
| `fileSpaceId` | `string` | File space identifier. |
| `path` | `string` | Path inside the space, relative with forward slashes, for example notes/source-1.md. |
| `currentVersion` | `integer` | Current version number, starting at 1. |
| `sizeBytes` | `integereger` | Size of the current version. |
| `sha256` | `string` | SHA-256 of the current version, lowercase hex. |
| `mediaType` | `string` | Media type of the current version. |
| `deleted` | `boolean` | Whether the file is deleted. |
| `createdUtc` | `DateTime` | Creation timestamp, UTC. |
| `lastUpdateUtc` | `DateTime` | Last change, UTC. |

#### `FileSpaceListing`

The files of a conversation file space (AD3.6).

| Field | Type | Description |
|---|---|---|
| `fileSpaceId` | `string?` | Space identifier, or null when nothing has been written yet. |
| `fileCount` | `integer` | Number of files that are not deleted. |
| `totalBytes` | `integereger` | Bytes of the current versions. |
| `files` | `ConversationFile[]` | Files, ordered by path. Deleted files appear only when asked for. |

#### `CapabilityDescriptor`

One entry in the capability catalog (AD4, AD-006, AD-022): an agent, an MCP tool, or a harness built-in, described the same way so an orchestrator (or the studio) can choose between them. Derived descriptors follow their source (a published agent revision, an MCP server's tool list, a harness tool probe); manual descriptors are written by a person. A descriptor with a null tenant is shared by every tenant (harness built-ins of built-in profiles).

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (prefix cap_). |
| `tenantId` | `string?` | Tenant identifier, or null for a descriptor every tenant shares (derived from a built-in harness profile). |
| `kind` | `CapabilityKindEnum` | Kind. |
| `origin` | `CapabilityOriginEnum` | Derived or manual. |
| `sourceKey` | `string` | Stable key of the source, unique per tenant: agent:{agentId}, mcp:{serverId}:{tool}, tool:{name}, or manual:{id}. Set by Garrison. |
| `sourceAgentId` | `string?` | Source agent identifier for Agent descriptors; optional on manual ones. Null otherwise. |
| `sourceRevisionId` | `string?` | Published revision the Agent descriptor was derived from, or null. |
| `sourceMcpServerId` | `string?` | Source MCP server identifier for McpTool descriptors, or null. |
| `sourceToolName` | `string?` | Tool name on the source MCP server for McpTool descriptors, or null. |
| `sourceHarnessProfileId` | `string?` | Harness profile that declares the tool probe of a HarnessBuiltIn descriptor, or null. |
| `sourceHarnessType` | `HarnessTypeEnum?` | Harness type of that profile, for HarnessBuiltIn descriptors, or null. |
| `inputSchemaJson` | `string?` | JSON Schema of the input, as JSON text, or null. Validated as a JSON Schema on save (InvalidJsonSchema). |
| `outputSchemaJson` | `string?` | JSON Schema of the output, as JSON text, or null. Validated as a JSON Schema on save (InvalidJsonSchema). |
| `tags` | `string[]` | Tags for filtering. At most 32, each 1 to 64 characters. |
| `requirements` | `CapabilityRequirement[]` | Node labels a run needs when its agent uses this capability. HarnessBuiltIn descriptors require their tool label; other kinds usually require nothing. At most 16. |
| `hints` | `CapabilityHintegers` | Cost and latency hints. Never null. |
| `refreshWarning` | `string?` | Why the last refresh of the source failed, while the descriptor keeps its last good content, or null. |
| `lastRefreshedUtc` | `DateTime?` | When the descriptor was last refreshed from its source (UTC), or null for manual descriptors. |
| `createdUtc` | `DateTime` | Creation time (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update time (UTC). |

#### `CapabilityKindEnum`

`Agent`, `McpTool`, `HarnessBuiltIn`

#### `CapabilityOriginEnum`

`Derived`, `Manual`

#### `FanOutGroupView`

A fan-out group with its members' current state and results (AD5): what garrison_fan_out, garrison_gather, garrison_cancel_fan_out, the REST routes, and the fan-out channel return.

| Field | Type | Description |
|---|---|---|
| `fanOutGroupId` | `string` | Group identifier (fog_). |
| `parentRunId` | `string` | The run that started the group. |
| `status` | `FanOutGroupStatusEnum` | Group state. |
| `statusReason` | `string?` | Why the group ended, or null while it runs. |
| `joinPolicy` | `FanOutJoinPolicyEnum` | Join policy. |
| `quorum` | `integer` | Successes needed for Quorum. |
| `total` | `integer` | Members. |
| `finished` | `integer` | Members that finished, whatever their outcome. |
| `succeeded` | `integer` | Members that succeeded. |
| `pending` | `string[]` | Labels of members still running or queued. |
| `failed` | `string[]` | Labels of members that failed, timed out, or were cancelled. |
| `members` | `FanOutMemberView[]` | Every member, in the order given. |
| `costUsd` | `number` | Cost the members recorded together, in US dollars. |
| `tokens` | `integereger` | Input plus output tokens the members recorded together. |
| `maxCostUsd` | `number?` | Cost budget, or null. |
| `maxTokens` | `integereger?` | Token budget, or null. |
| `deadlineUtc` | `DateTime?` | When the group times out (UTC), or null. |
| `createdUtc` | `DateTime` | Creation time (UTC). |
| `completedUtc` | `DateTime?` | When the group ended (UTC), or null. |
| `summary` | `string?` | The results rendered for a harness by the fan-out-gather-result template; set by gather. |
| `continuationMarker` | `string?` | GARRISON_CONTINUATION_WAIT when the parent should finish its turn and resume when the group ends, or null. |
| `continuationInstruction` | `string?` | The instruction that goes with the continuation marker, or null. |

#### `FanOutMemberView`

One member of a fan-out group as gather and the REST routes show it (AD5.3).

| Field | Type | Description |
|---|---|---|
| `label` | `string` | Label. |
| `agent` | `string` | Agent name. |
| `runId` | `string` | Child run identifier. |
| `status` | `RunStatusEnum` | Child run status. |
| `outcome` | `RunOutcomeEnum?` | Child run outcome once finished, or null. |
| `resultText` | `string?` | Result text, cut at Delegation.GatherResultCharLimit, or null. |
| `resultTruncated` | `boolean` | Whether the result text was cut. |
| `structuredOutputJson` | `string?` | Structured output as JSON text, or null. |
| `errorMessage` | `string?` | Error message of a failed member, or null. |
| `filesWritten` | `string[]` | Paths the member wrote in the shared file space. |
| `costUsd` | `number?` | Cost the member recorded in US dollars, or null. |
| `tokens` | `integereger` | Input plus output tokens the member recorded. |

#### `FanOutJoinPolicyEnum`

`All`, `Any`, `Quorum`

#### `FanOutGroupStatusEnum`

`Running`, `Joined`, `TimedOut`, `BudgetExceeded`, `Cancelled`

#### `AgenticApp`

An agentic app (AD6, AD-002): a group of agents with one entry agent that talks to people, the calls its members may make to each other, the entry deployment per environment, and how end users reach it through its own chat UI at /apps/{slug}/. Validation lives in the app service; this model holds values as given.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (prefix app_). |
| `tenantId` | `string` | Tenant identifier. |
| `name` | `string` | Name, unique per tenant: 1 to 64 lowercase letters, digits, and hyphens. |
| `slug` | `string` | URL slug, unique across the cluster because it names the app's URL: 2 to 63 lowercase letters, digits, and hyphens, starting with a letter or digit. Default: the name. |
| `description` | `string?` | Description, up to 4000 characters, or null. |
| `entryAgentId` | `string` | The member that talks to end users. Must be a member. |
| `liveEnvironment` | `string` | Environment whose entry deployment the app UI uses. Default dev. |
| `authMode` | `AppAuthModeEnum` | Who may use the app UI. Default AppUsers. |
| `anonymousEnabled` | `boolean` | Must be true, in addition to AuthMode Anonymous, for anonymous sessions. Default false. |
| `showOperatorDetail` | `boolean` | Whether the app UI shows operator detail (tool calls, thinking). Default false. |
| `displayName` | `string?` | Name shown in the app UI, up to 128 characters, or null for the app name. |
| `logoAssetId` | `string?` | Agent asset (ReferenceFile) whose first image file is the app's logo, or null. |
| `primaryColor` | `string?` | Primary color as #RRGGBB, or null for the default. |
| `accentColor` | `string?` | Accent color as #RRGGBB, or null for the default. |
| `welcomeText` | `string?` | Text shown before the first message, up to 4000 characters, or null. |
| `members` | `AgenticAppMember[]` | Members, including the entry agent. |
| `edges` | `AgenticAppEdge[]` | Calls members may make to each other. |
| `environments` | `AgenticAppEnvironment[]` | Entry deployment per environment. |
| `latestPublishedRevisionId` | `string?` | Latest published app revision, or null. Set by the app service. |
| `active` | `boolean` | Whether the app accepts sessions. Default true. |
| `createdUtc` | `DateTime` | Creation time (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update time (UTC). |

#### `AgenticAppMember`

An agent that belongs to an agentic app (AD6.1).

| Field | Type | Description |
|---|---|---|
| `agentId` | `string` | Agent identifier. |
| `agentName` | `string?` | Agent name, filled in on read. |
| `role` | `string?` | What the member does in the app, for people, up to 256 characters, or null. |

#### `AgenticAppEdge`

One allowed call between members of an agentic app (AD6.1): the caller may delegate to the callee. The app's edges are the graph each member's delegation policy is derived from (AD6.3).

| Field | Type | Description |
|---|---|---|
| `callerAgentId` | `string` | Calling member's agent identifier. |
| `calleeAgentId` | `string` | Called member's agent identifier. |
| `fanOutAllowed` | `boolean` | Whether the caller may start the callee in a fan-out group. Default true. |

#### `AgenticAppEnvironment`

Which deployment of the entry agent an app uses in one environment (AD6.1). The app UI starts conversations on the deployment of the app's live environment.

| Field | Type | Description |
|---|---|---|
| `environment` | `string` | Environment label, one of the tenant's environments. |
| `deploymentId` | `string?` | Entry agent deployment for this environment, or null for the entry agent's weighted selection among its deployments in the environment. |

#### `AppAuthModeEnum`

`TenantUsers`, `AppUsers`, `Anonymous`

#### `AppRevision`

A snapshot of an agentic app (AD6.4): the published agent revision of every member and the app's edges. Draft until published; published revisions never change. Promoting an app promotes every member's pinned revision together.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (prefix apv_). |
| `tenantId` | `string` | Tenant identifier. |
| `appId` | `string` | App identifier. |
| `number` | `integer` | Number, per app, from 1. |
| `state` | `AgentRevisionStateEnum` | Draft or Published. |
| `members` | `AppRevisionMember[]` | Pinned member revisions. |
| `edges` | `AgenticAppEdge[]` | The app's edges when the revision was taken. |
| `authorName` | `string?` | Who created the revision, or null. |
| `changeNote` | `string?` | Change note, up to 2000 characters, or null. |
| `publishedByName` | `string?` | Who published it, or null. |
| `publishedUtc` | `DateTime?` | When it was published (UTC), or null. |
| `createdUtc` | `DateTime` | Creation time (UTC). |

#### `AppRevisionMember`

The agent revision an app revision pins for one member (AD6.4).

| Field | Type | Description |
|---|---|---|
| `agentId` | `string` | Member agent identifier. |
| `agentName` | `string?` | Member agent name, filled in on read. |
| `agentRevisionId` | `string` | Pinned published agent revision. |
| `agentRevisionNumber` | `integer?` | Number of the pinned revision, filled in on read. |

#### `AppDelegationPlan`

Every member's delegation policy derived from an app's graph (AD6.3, AD-005d), with drift against what is published.

| Field | Type | Description |
|---|---|---|
| `appId` | `string` | App identifier. |
| `applied` | `boolean` | Whether drafts were written (apply) or only reported. |
| `members` | `AppDelegationMember[]` | Members, in app order. |

#### `AppDelegationMember`

One member's delegation policy as the app graph requires it and as its latest published revision has it (AD6.3).

| Field | Type | Description |
|---|---|---|
| `agentId` | `string` | Member agent identifier. |
| `agentName` | `string` | Member agent name. |
| `desiredMode` | `DelegationModeEnum` | Mode the graph requires: AllowList when the member calls others, None otherwise. |
| `desiredAllowList` | `string[]` | Agents the member may call, from its edges, by name. |
| `desiredMaxDepth` | `integer` | The longest path of calls below the member. |
| `publishedMode` | `DelegationModeEnum?` | Mode of the member's latest published revision, or null when it has none. |
| `publishedAllowList` | `string[]` | Allow list of the latest published revision. |
| `publishedMaxDepth` | `integer?` | Maximum depth of the latest published revision, or null. |
| `drift` | `boolean` | Whether the published policy differs from the graph. |
| `draftRevisionNumber` | `integer?` | Draft revision written with the graph's policy, or null when none was written. |
| `skippedReason` | `string?` | Why no draft was written although the policy drifts, for example DraftConflict when the member's open draft already changes its delegation another way. Null otherwise. |

#### `AppInfo`

What an app's chat UI needs before anyone signs in (AD6.6, AD6.10): branding and how to sign in.

| Field | Type | Description |
|---|---|---|
| `slug` | `string` | URL slug. |
| `displayName` | `string` | Name shown: the display name, or the app name. |
| `description` | `string?` | Description, or null. |
| `welcomeText` | `string?` | Text shown before the first message, or null. |
| `primaryColor` | `string?` | Primary color (#RRGGBB), or null. |
| `accentColor` | `string?` | Accent color (#RRGGBB), or null. |
| `logoUrl` | `string?` | Logo URL relative to the server, or null without a logo. |
| `authMode` | `AppAuthModeEnum` | Who may sign in. |
| `anonymousAllowed` | `boolean` | Whether an anonymous session can be started. |
| `showOperatorDetail` | `boolean` | Whether the UI shows operator detail such as tool calls. |

#### `AppSessionResponse`

A new app session (AD6.5). Send the token as "Authorization: Bearer {token}" to the app's gateway routes only.

| Field | Type | Description |
|---|---|---|
| `token` | `string` | Session token (prefix gas_). Shown once. |
| `expiresUtc` | `DateTime` | When the session ends (UTC). |
| `principalName` | `string` | Who the session is for: the user's email, or "anonymous". |
| `anonymous` | `boolean` | Whether the session is anonymous. |

#### `AppConversationView`

An app conversation as its end user sees it (AD6.6).

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Conversation identifier. |
| `title` | `string?` | Title, or null. |
| `turnCount` | `integer` | Turns so far. |
| `busy` | `boolean` | Whether a turn is still running. |
| `lastRunId` | `string?` | Run of the latest turn, or null. |
| `createdUtc` | `DateTime` | Creation time (UTC). |
| `lastActivityUtc` | `DateTime?` | Last activity (UTC), or null. |
| `turns` | `AppTurnView[]` | Turns, oldest first. Empty in listings. |

#### `AppTurnView`

One turn of an app conversation as its end user sees it (AD6.6).

| Field | Type | Description |
|---|---|---|
| `runId` | `string` | Run of the turn. |
| `turn` | `integer` | Turn number, from 1. |
| `message` | `string` | The user's message. |
| `status` | `RunStatusEnum` | Run status. |
| `answer` | `string?` | The agent's answer, or null while it works. |
| `error` | `string?` | A short error for a failed turn, or null. |
| `awaitingApproval` | `boolean` | Whether the agent waits for an operator to approve a tool call. |
| `createdUtc` | `DateTime` | When the turn started (UTC). |
| `completedUtc` | `DateTime?` | When the turn finished (UTC), or null. |

#### `StudioDraft`

A studio draft (AD7, AD-002): a manifest bundle being designed, by a person or by the agent architect on their behalf, that changes nothing live until a person approves applying it. Every change increments the version; a change sent with a stale version is refused (DraftVersionConflict).

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier (prefix sdr_). |
| `tenantId` | `string` | Tenant identifier. |
| `title` | `string` | Title, up to 256 characters. |
| `ownerUserId` | `string?` | The person the draft belongs to: their user identifier. |
| `ownerName` | `string?` | The owner's name. |
| `conversationId` | `string?` | The architect conversation working on the draft, or null. |
| `targetApp` | `string?` | The app the draft builds or changes, by name, or null. |
| `version` | `integer` | Version, from 1; every change adds one. |
| `approvalId` | `string?` | The DraftApply approval while PendingApproval, or the one that applied it, or null. |
| `publishOnApply` | `boolean` | Whether applying also publishes the revisions the draft writes. Default true. |
| `manifestApplyId` | `string?` | The manifest apply record of the applied draft, or null. |
| `items` | `StudioDraftItem[]` | Items (manifest documents), in kind and name order. |
| `layout` | `StudioDraftNode[]` | Graph layout of the visual editor. |
| `createdUtc` | `DateTime` | Creation time (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update time (UTC). |

#### `StudioDraftItem`

One manifest document of a studio draft (AD7.1, AD-018), keyed by kind and name. The document text is user-authored YAML, kept as text like prompt template content.

| Field | Type | Description |
|---|---|---|
| `kind` | `string` | Manifest kind, for example Agent, Deployment, AgenticApp. |
| `name` | `string` | Record name. |
| `operation` | `StudioDraftOperationEnum` | Upsert or Delete. |
| `document` | `string` | The manifest document (YAML) for Upsert; empty for Delete. |
| `baseHash` | `string?` | SHA-256 of the live record's exported document when the item was based on it, or null for a new record. Apply refuses with DraftStale when live configuration moved since. |
| `lastUpdateUtc` | `DateTime` | Last change (UTC). |

#### `StudioDraftNode`

Where the visual editor placed one node of a draft's graph (AD7.1, AD8).

| Field | Type | Description |
|---|---|---|
| `nodeKey` | `string` | Node key, for example Agent/researcher. |
| `x` | `number` | Horizontal position. |
| `y` | `number` | Vertical position. |

#### `StudioDraftStatusEnum`

`Open`, `PendingApproval`, `Applied`, `Discarded`

#### `StudioDraftOperationEnum`

`Upsert`, `Delete`

#### `StudioDraftCreateRequest`

Body of POST .../studio/drafts (AD7.2).

| Field | Type | Description |
|---|---|---|
| `title` | `string?` | Title, up to 256 characters. Default: the app name, or "Untitled draft". |
| `fromApp` | `string?` | An existing app to start from: the draft gets its export with every record it needs. Null starts empty. |
| `conversationId` | `string?` | The architect conversation working on the draft, or null. |

#### `StudioDraftItemRequest`

Body of PUT .../studio/drafts/{id}/items/{kind}/{name} (AD7.2).

| Field | Type | Description |
|---|---|---|
| `version` | `integer` | The draft version the caller read. Required; a stale version answers 409 DraftVersionConflict. |
| `operation` | `string?` | Upsert (default) or Delete. |
| `document` | `string` | One manifest document (YAML or JSON) whose kind and name match the path. Required for Upsert. |

#### `StudioDraftVersionRequest`

The draft version a caller read, for actions on a whole draft (AD7.3).

| Field | Type | Description |
|---|---|---|
| `version` | `integer` | Draft version the caller read. A different version answers 409 DraftVersionConflict. |

#### `StudioDraftDiff`

A draft compared with live configuration and validated by a manifest dry run (AD7.2).

| Field | Type | Description |
|---|---|---|
| `draftId` | `string` | Draft identifier. |
| `version` | `integer` | Draft version compared. |
| `valid` | `boolean` | Whether every item validated and nothing is stale. |
| `items` | `StudioDraftDiffItem[]` | Items, in apply order. |

#### `StudioDraftDiffItem`

What applying one draft item would do to live configuration (AD7.2).

| Field | Type | Description |
|---|---|---|
| `kind` | `string` | Kind. |
| `name` | `string` | Name. |
| `change` | `string` | Create, Update, Delete, Unchanged, or Failed. |
| `changes` | `ManifestFieldChange[]` | Field changes of an Update, as the manifest dry run reports them. |
| `message` | `string?` | Why the item failed validation, or a note, or null. |
| `errorCode` | `string?` | Error code of a failed item, or null. |
| `stale` | `boolean` | Whether the live record changed since the item was based on it. |

#### `StudioGraph`

A draft's apps drawn as a graph (AD7.5, AD8): agent and app nodes with their positions, and the call edges of every app in the draft.

| Field | Type | Description |
|---|---|---|
| `draftId` | `string` | Draft identifier. |
| `version` | `integer` | Draft version the graph was read at. |
| `nodes` | `StudioGraphNode[]` | Nodes. |
| `edges` | `StudioGraphEdge[]` | Call edges. |

#### `StudioGraphNode`

One node of a draft graph: an agent or an app.

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Key: "Agent/{name}" or "AgenticApp/{name}". |
| `kind` | `string` | Kind: Agent or AgenticApp. |
| `name` | `string` | Name. |
| `inDraft` | `boolean` | Whether the draft holds a document for this node (false means the node is live configuration the draft refers to). |
| `deleted` | `boolean` | Whether the draft deletes this node. |
| `entryOf` | `string[]` | Apps that have this agent as their entry agent. |
| `memberOf` | `string[]` | Apps this agent is a member of. |
| `capabilities` | `string[]` | For an agent the draft holds: the capabilities its document names (host tools such as pandoc, AD7.8). |
| `x` | `number?` | Canvas X, or null when the node has not been placed. |
| `y` | `number?` | Canvas Y, or null when the node has not been placed. |

#### `StudioGraphEdge`

One call edge of a draft app: the From member may call the To member.

| Field | Type | Description |
|---|---|---|
| `app` | `string` | App name. |
| `from` | `string` | Calling agent name. |
| `to` | `string` | Called agent name. |
| `fanOut` | `boolean` | Whether the edge allows fan-out. |
| `depth` | `integer` | Delegation depth the edge needs: one plus the longest chain of calls below the called member. Minimum 1. |

#### `StudioGraphOperationRequest`

One graph operation on a studio draft (AD7.5), applied at the draft version the caller read.

| Field | Type | Description |
|---|---|---|
| `version` | `integer` | Draft version the caller read. A different version answers 409 DraftVersionConflict. |
| `operation` | `StudioGraphOperationEnum` | The operation. |
| `app` | `string?` | App name. Null means the draft's target app. Not used by MoveNode. |
| `agent` | `string?` | Agent name, for AddMember, RemoveMember, and SetEntry. |
| `role` | `string?` | Member role text, for AddMember. Null for none. |
| `from` | `string?` | Calling member, for Connect and Disconnect. |
| `to` | `string?` | Called member, for Connect and Disconnect. |
| `fanOut` | `boolean?` | Whether the edge allows fan-out, for Connect. Null means the default (true). |
| `nodeKey` | `string?` | Node key for MoveNode: "Agent/{name}" or "AgenticApp/{name}". |
| `x` | `number` | Canvas X for MoveNode. |
| `y` | `number` | Canvas Y for MoveNode. |

#### `StudioGraphOperationEnum`

`AddMember`, `RemoveMember`, `Connect`, `Disconnect`, `SetEntry`, `MoveNode`

#### `ManagementAccessEnum`

`None`, `Drafts`

#### `ArchitectPromptEntry`

One architect prompt in the catalog (AD7.12): a built-in architect System template, a tenant clone of one, or another tenant System template.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Template identifier. |
| `name` | `string` | Template name. |
| `description` | `string?` | Description, or null. |
| `isBuiltIn` | `boolean` | Whether the template is a protected built-in (edit by cloning). |
| `builtInKey` | `string?` | Built-in key the template is or was cloned from, or null for a custom template. |
| `currentVersion` | `integer` | Current version. |
| `isDefault` | `boolean` | Whether this is the default architect prompt. |
| `deployments` | `string[]` | Identifiers of the architect deployments that bind this template as their System prompt. |

#### `ArchitectPromptSelection`

The architect prompt an architect deployment uses (AD7.14): its System prompt binding.

| Field | Type | Description |
|---|---|---|
| `deploymentId` | `string` | Deployment identifier. |
| `architectPromptTemplateId` | `string` | Selected System template identifier. |
| `architectPromptName` | `string` | Selected template name. |
| `architectPromptVersion` | `integer?` | Pinned version, or null to follow the template's current version (edits apply on the next turn). |
| `currentVersion` | `integer` | The template's current version. |

#### `ArchitectPromptRequest`

Choose an architect deployment's prompt (AD7.14, AD-026).

| Field | Type | Description |
|---|---|---|
| `architectPromptTemplateId` | `string` | System template identifier or name (a built-in architect prompt, a clone, or another tenant System template). |
| `architectPromptVersion` | `integer?` | Version to pin, or null to follow the template's current version. Minimum 1. |

#### `PlaygroundInvokeRequest`

Run an agent's draft revision in the studio playground (AD9.1).

| Field | Type | Description |
|---|---|---|
| `input` | `string` | The message. |
| `agent` | `string?` | Agent, by name or identifier. For a studio draft, null means the target app's entry agent; for an agent route, ignored. |
| `agentRevisionId` | `string?` | Agent revision to run. Null runs the agent's open draft revision, or its latest published one when it has no draft. |
| `sourceDeploymentId` | `string?` | Deployment whose settings the playground copies. Null uses the agent's dev deployment, or its first one. |
| `conversationId` | `string?` | Conversation to continue, or null to start one. |
| `wait` | `boolean` | Whether to wait for the run to finish. Default true. |
| `waitSeconds` | `integer` | Most seconds to wait. Default 120; minimum 1; maximum 3600. |

## Execution safety and credential lifecycle

`GET /v1.0/api/tenants/{tenantId}/runs/{id}/operations` returns tenant-scoped effect metadata for a run. See [effect safety](docs/effect-safety.md) for states and recovery limits.

`POST /v1.0/api/settings/keys/rotate` is a system administrator operation with no body. It re-encrypts stored secret material under the already configured active master key and returns `{keyVersion, scanned, rotated, conflicts, failed}`. It never returns keys or plaintext. See [rotation procedure and expiry settings](docs/KEY_ROTATION.md).

Registered remote agents use the normal invoke routes. Tenant `schedulingWeight` is 1 to 1000 (default 1); only a system administrator may change it. Queue admission limits answer `429 QueueFull` with `Retry-After` when reached. See [remote execution](docs/REMOTE_AGENTS.md) and [tenant scheduling](docs/TENANT_SCHEDULING.md).

Deployments accept `suspensionEnabled` (default false). Compatible harness profiles pin `sessionFormat`. Suspended runs hold no worker lease and are represented as `Suspended` over REST/MCP and input-required over A2A. Approval decisions or completed child runs can resume an accepted checkpoint automatically; see [durable continuation](docs/CONTINUATION.md).

### Placement diagnostics

`GET /v1.0/api/tenants/{tenantId}/runs/{id}/placement` requires Run Read and returns a read-only `RunPlacementResponse`: `runId`, `takenUtc`, nullable `admissionRejection`, global `reasons`, `eligible`, and per-node `nodes` (`nodeId`, `eligible`, `reasons`). It uses admitted requirements and the scheduler's shared placement, capability, start-admission and affinity predicates. It checks current node/deployment/quota capacity without claiming, compiling, issuing credentials or reserving slots. Cross-tenant runs return 404; nodes dedicated exclusively to other tenants are omitted.

This multi-read snapshot is advisory: concurrent changes, worker-local slots, queue ordering and other claimers can change the next assignment. Remote health probes and compiler/provider network calls are not dispatched by diagnostics. See [placement reason codes and capacity semantics](docs/SCALING.md#explain-a-runs-placement).

Synchronous invocation wait is best effort. `Scheduling.MaxSynchronousWaiters` bounds run and pipeline waits per replica (default 256). When full, external agent invocation returns 202 with the accepted run and pipeline creation retains its existing 201 response. A resident run-principal synchronous delegation instead reserves a wait slot before its child handshake or creation; exhaustion returns `DelegationCapacityExhausted` (429 with `Retry-After`) and creates neither child nor handshake. Poll the returned run ID; do not repeat the invocation to wait for it. This protects worker heartbeats, lifecycle reports and slot handoffs from listener exhaustion.

### Per-run database attribution

`GET /v1.0/api/tenants/{tenantId}/runs/{id}/database-usage` uses the same Run Read authorization and cross-tenant 404 behavior as run details. It returns an array of `RunDatabaseUsage` rows: `tenantId`, `runId`, `operation`, `statements`, `reads`, `writes`, `errors`, `transactions`, and `durationMicroseconds`.

Counts are actual centrally instrumented ADO statement attempts in completed run scopes, including failed attempts and retries. Explicit transaction wrappers are separate from statements. Duration sums statement wall time, including lock waits; concurrent statement durations can exceed run elapsed time. Admission, claim/compile, worker event/completion, gateway, broker, continuation and invocation-wait scopes are attributed. Shared candidate scans and candidate eligibility prechecks before atomic claim, heartbeat/maintenance work, request history and attribution persistence are excluded. A process lost before its best-effort flush can leave a missing scope; inspect `garrison_application_operations_total{component="telemetry",operation="attribution_flush",result="error"}` for failed flushes. This is operational telemetry rather than a billing or effect-safety ledger. Rows follow run/tenant deletion.
