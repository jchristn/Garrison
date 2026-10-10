# Garrison REST API

This is the reference for Garrison's HTTP surface on the control plane: authentication, tenancy, the shared request and response conventions, every endpoint grouped by resource, the worker node protocol, the server-sent event stream, and the models those endpoints exchange. The live OpenAPI document at `GET /openapi.json` is generated from the same route registrations and is what the dashboard's API Explorer reads; this file adds the permission each route needs, examples, and the parts OpenAPI does not describe well, such as streaming.

The server listens on port 8700 by default. MCP is on its own port (8701, see `MCP_API.md`), A2A shares the REST port (see `A2A_API.md`), and the WebSocket live-update channel is at `/v1.0/ws` (see `WEBSOCKETS_API.md`). Examples use `http://127.0.0.1:8700`, the default tenant `default`, and `$TOKEN` for a session token.

## Conventions

JSON bodies use camelCase property names. Enumerations travel as their string names (`"status": "Succeeded"`), timestamps are ISO 8601 in UTC, and properties whose value is null are omitted from responses. Identifiers are prefixed, K-sortable strings such as `agt_mv1pdwem_PWOwUcelVy0GXphYF11`; the prefix tells you the type (`ten_` tenant, `usr_` user, `crd_` credential, `ses_` session, `rol_` role, `prm_` permission, `agt_` agent, `dep_` deployment, `hrn_` harness profile, `tpl_` prompt template, `mcp_` MCP server, `sec_` secret, `wsp_` workspace template, `ast_` artifact store, `run_` run, `rev_` run event, `nod_` node, `npl_` node pool, `req_` request history entry, `aud_` audit record).

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

Authorization failures add `requiredPermission`, `resourceType`, and `tenantId`. Validation failures (400 `ValidationFailed`) add `fields`, a map from field path to the problem with that field.

| Status | When |
|---|---|
| 400 | Malformed JSON (`InvalidJson`, `InvalidBody`), invalid input (`ValidationFailed`, `BadRequest`), template errors (`TemplateRenderFailed`), unknown references (`ReferenceNotFound`) |
| 401 | Missing or invalid credentials (`AuthenticationRequired`, `InvalidCredentials`) |
| 403 | Authenticated but not permitted (`AuthorizationDenied`) |
| 404 | The resource does not exist or belongs to another tenant (`NotFound`, `RouteNotFound`) |
| 409 | The request conflicts with current state. Codes include `NameInUse`, `NameConflict`, `Duplicate`, `Protected`, `BuiltInImmutable`, `InUse`, `RunActive`, `RunFinished`, `RunNotFinished`, `AgentInactive`, `DeploymentInactive`, `RemoteAgentNotSupported`, `NodeActive`, `NodeHasRuns`, `PoolInUse`, `StaleLease`, `NodeIdentityMismatch`, and the delegation codes `DelegationDisabled`, `DelegationNotAllowed`, `DelegationCycle`, `DelegationDepthExceeded`, `DelegationDenied`, `ParentRunFinished`, `ParentRunNotFound` |
| 429 | Too many authentication attempts from one address (`RateLimited`) |
| 500 | An unexpected failure (`InternalError`); the server log has the request identifier |

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

Health check.

| | |
|---|---|
| Permission | Anonymous |
| Response | `HealthResponse` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/health"
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

Issue a fresh token for the authenticated principal.

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

Revoke the presented token (logout).

| | |
|---|---|
| Permission | Authenticated; the handler checks permissions (see notes) |
| Success | 204 |

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
  -d '{"name": "string", "description": "string", "active": false}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}`

Delete a tenant and everything it owns.

| | |
|---|---|
| Permission | Delete on `Tenant` |
| Response | `DeleteCountResponse` |
| Success | 200 |

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

Create a custom role.

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

Assign a role to a user.

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
| Response | `DeleteResponse` |
| Success | 200 |

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
| Response | `DeleteResponse` |
| Success | 200 |

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
| Response | `DeleteResponse` |
| Success | 200 |

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

### Secrets

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
  -d '{"name": "string", "description": "string", "kind": "AnthropicApiKey", "value": "string", "expiresUtc": "2026-01-01T00:00:00Z"}'
```

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
| Response | `DeleteResponse` |
| Success | 200 |

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
| Response | `DeleteResponse` |
| Success | 200 |

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
| Response | `DeleteResponse` |
| Success | 200 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/artifact-stores/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

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

#### `GET /v1.0/api/tenants/{tenantId}/agents/{id}`

Read an agent.

| | |
|---|---|
| Permission | Read on `Agent` |
| Response | `Agent` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `PUT /v1.0/api/tenants/{tenantId}/agents/{id}`

Update an agent.

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

#### `DELETE /v1.0/api/tenants/{tenantId}/agents/{id}`

Delete an agent and its deployments.

| | |
|---|---|
| Permission | Delete on `Agent` |
| Response | `DeleteResponse` |
| Success | 200 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `GET /v1.0/api/tenants/{tenantId}/agents/{id}/card`

Read the agent's A2A agent card.

| | |
|---|---|
| Permission | Read on `Agent` |
| Response | `AgentCard` |
| Success | 200 |

```bash
curl -s -X GET "http://127.0.0.1:8700/v1.0/api/tenants/default/agents/{id}/card" \
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
  -d '{"agentId": "string", "name": "string", "description": "string", "harnessProfileId": "string", "model": "string", "fallbackModel": "string", "effort": "string", "maxTurns": 0, "maxBudgetUsd": 0, "maxConcurrentRuns": 0, "timeoutSeconds": 0, "maxAttempts": 0, "retryOnNodeLoss": false, "weight": 0, "nodePoolId": "string", "workspaceTemplateId": "string", "artifactStoreId": "string", "active": false, "promptBindings": [{}], "resourceBindings": [{}], "argumentOverrides": [{}], "environmentOverrides": [{}], "fileOverrides": [{}], "nodeSelector": [{}], "parameters": [{}], "allowedRunOverrides": [{}]}'
```

#### `DELETE /v1.0/api/tenants/{tenantId}/deployments/{id}`

Delete a deployment.

| | |
|---|---|
| Permission | Delete on `Deployment` |
| Response | `DeleteResponse` |
| Success | 200 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/deployments/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

#### `POST /v1.0/api/tenants/{tenantId}/deployments/{id}/compile-preview`

Compile the deployment with sample input; secret values are redacted.

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

#### `POST /v1.0/api/tenants/{tenantId}/manifests/export`

Export the tenant configuration as YAML manifests (secrets as metadata only).

| | |
|---|---|
| Permission | Read on `Manifest` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/manifests/export" \
  -H "Authorization: Bearer $TOKEN"
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
| Success | 201 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/runs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agentName": "helper", "input": "Summarize the README", "parameters": {"model": "haiku"}, "wait": false}'
```

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

Delete finished runs matching a filter.

| | |
|---|---|
| Permission | Delete on `Run` |
| Response | `DeleteCountResponse` |
| Success | 200 |

```bash
curl -s -X DELETE "http://127.0.0.1:8700/v1.0/api/tenants/default/runs" \
  -H "Authorization: Bearer $TOKEN"
```

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

### Overview

#### `GET /v1.0/api/tenants/{tenantId}/overview`

Tenant overview for the Home page.

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
  -d '{"name": "string", "version": "string", "address": "string", "maxConcurrentRuns": 0, "nodePool": "string", "labels": {"key": "value"}, "capabilities": [{}]}'
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

#### `POST /v1.0/api/node/lease`

Lease runs (long poll).

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
  -d '{"nodeId": "string", "maxRuns": 0, "waitMs": 0}'
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

Report a run started.

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
| Response | `NodeAckResponse` |
| Success | 200 |

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/node/runs/{runId}/complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "string", "epoch": 0, "status": "Pending", "outcome": "None", "exitCode": 0, "resultText": "string", "structuredOutputJson": "string", "sessionId": "string", "servedModel": "string", "stderrTail": "string", "errorMessage": "string", "inputTokens": 0, "outputTokens": 0, "cachedTokens": 0, "costUsd": 0, "costEstimated": false, "completedUtc": "2026-01-01T00:00:00Z"}'
```

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

**Invoking agents.** `POST .../agents/{agentId}/invoke` accepts the agent's identifier or its name. With `wait` true (the default for invoke) the call holds until the run finishes or `waitSeconds` elapses, then returns the run: 200 when it finished, 202 when it is still queued or running. `wait` and `waitSeconds` may also be passed as query parameters. Send an `Idempotency-Key` header to make retries safe: a repeated key from the same caller within 24 hours returns the original run. `parameters` must be allowed by the deployment's `allowedRunOverrides`; anything else is a 400 with field errors.

**Run filters.** `GET .../runs` also accepts `status`, `agentId`, `deploymentId`, `harnessType`, `nodeId`, `parentRunId`, `rootRunId`, `outcome`, `callerId`, `fromUtc`, and `toUtc`. `DELETE .../runs` deletes finished runs matching `status`, `agentId`, `fromUtc`, and `toUtc` (up to 1000 per call). Active runs cannot be deleted; cancel them first.

**Run events.** `GET .../runs/{id}/events?afterSequence=0&limit=500` returns events with a sequence greater than `afterSequence`, in order, plus the run's current status. Poll with the last sequence you saw to follow a run.

**Self-service.** `GET .../users/{id}` and `GET .../users/{id}/permissions` let a user read their own record and permissions without any role; reading someone else needs Read on User, or Admin on User for permissions. `GET .../credentials/{id}/permissions` answers for the credential making the call without any role, and otherwise needs Admin on Credential. `GET /v1.0/api/tenants` lists every tenant for system administrators and only the caller's tenant for everyone else. `GET /v1.0/api/server-info` is available to any authenticated caller.

**Built-in records.** Built-in harness profiles, prompt templates, roles, and permissions have no tenant, are visible to every tenant, and cannot be changed or deleted through these routes (409 `BuiltInImmutable` or `Protected`). Clone them to customize. `POST .../prompt-templates/{id}/reset` restores a built-in's seeded content in a tenant copy.

**Secrets.** Secret values are write-only. Responses carry metadata, the last four characters, and a fingerprint, never the value.

**Credentials.** `POST .../credentials` and `POST .../credentials/{id}/rotate` return the secret key exactly once. When the caller is the administrator API key (which has no user), `userId` is required.

**Manifests.** `POST .../manifests/apply` takes a YAML or JSON body containing one or more documents (`Content-Type: application/yaml` or `application/json`); add `?dryRun=true` to validate without writing and `?allowSecretValues=true` to accept secret values. `POST .../manifests/export` returns the tenant's configuration as YAML. See `docs/MANIFESTS.md`.

**Settings.** `GET /v1.0/api/settings` returns every setting with its value (secrets show only whether they are set), source (`File`, `Environment`, `ConfigMap`, or `Database`), whether a change applies live or needs a restart, and whether it is editable. `PUT` takes `{"values":[{"path":"...","value":"..."}]}` and answers 400 with per-field errors when a value is rejected. `POST /v1.0/api/settings/restart` answers 202 and exits the process so the container runtime restarts it.

## Server-sent events

`GET /v1.0/api/tenants/{tenantId}/runs/{id}/events/stream` streams a run as `text/event-stream`. Pass `afterSequence` to resume.

| Event | Data |
|---|---|
| `run.event` | One `RunEvent`; the SSE `id` is its sequence |
| `run.status` | `{"status":"Running"}`, sent about every 15 seconds while the run is active |
| `run.completed` | The finished `Run`; the stream then closes |

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
| `POST /v1.0/api/node/runs/{runId}/started` | The harness started. Moves the run from Leased to Running. |
| `POST /v1.0/api/node/runs/{runId}/events` | A batch of normalized events with worker-assigned sequences starting at 1. Re-sent sequences are ignored. |
| `POST /v1.0/api/node/runs/{runId}/complete` | Terminal status, outcome, result, structured output, usage, cost, session identifier, served model, exit code, and stderr tail. |
| `POST /v1.0/api/node/drain` | The worker is draining (body is a heartbeat). The node becomes Draining, or Offline when it holds no runs. |

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
| `exposeMcpTool` | `bool` | Whether the agent is exposed as its own MCP tool. |
| `mcpToolName` | `string?` | MCP tool name override. |
| `toolDescriptionTemplateId` | `string?` | Template for the MCP tool description. |
| `skillDescriptionTemplateId` | `string?` | Template for the A2A skill description. |
| `inputMode` | `AgentInputModeEnum` | Input mode. |
| `inputSchemaJson` | `string?` | JSON Schema for structured input (unmanaged JSON). |
| `outputSchemaJson` | `string?` | JSON Schema for structured output (unmanaged JSON). |
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

`AuthSuccess`, `AuthFailure`, `SessionIssued`, `SessionRevoked`, `CredentialCreated`, `CredentialRotated`, `CredentialUsed`, `AuthorizationDenied`, `AuthorizationBypass`, `RoleChanged`, `PermissionChanged`, `AssignmentChanged`, `ConfigurationChanged`, `SecretChanged`, `SettingsChanged`, `RestartRequested`, `ManifestApplied`, `NodeRegistered`, `NodeStatusChanged`, `RunCancelled`

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
| `timeoutSeconds` | `int` | Deadline in seconds from start. |
| `killGraceSeconds` | `int` | Seconds between graceful stop and process tree kill. |
| `maxOutputBytes` | `long` | Maximum stdout bytes. |
| `stderrTailBytes` | `int` | Retained stderr tail bytes. |
| `isolateHome` | `bool` | Whether the run gets its own HOME directory. |
| `mcpPreflight` | `List<ExecutionMcpCheck>` | MCP pre-flight checks. |
| `scrubValues` | `List<string>` | Values to redact from stderr, events, and logs. |
| `traceParent` | `string?` | W3C traceparent for span correlation. |

#### `HarnessTypeEnum`

`ClaudeCode`, `Codex`, `Mux`, `GeminiCli`, `Generic`

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

#### `WorkspaceKindEnum`

`Empty`, `GitRepository`, `Seeded`

#### `ExecutionWorkspaceFile`

Seeded workspace file.

| Field | Type | Description |
|---|---|---|
| `path` | `string` | Path relative to the workspace. |
| `content` | `string` | Content. |

#### `WorkspaceRetentionEnum`

`Delete`, `Keep`, `KeepOnFailure`

#### `OutputParserEnum`

`ClaudeStreamJson`, `CodexJsonl`, `MuxJsonl`, `GeminiStreamJson`, `GenericJsonl`, `PlainText`

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

#### `DeleteResponse`

Delete result.

| Field | Type | Description |
|---|---|---|
| `deleted` | `bool` | Whether something was deleted. |
| `cascaded` | `int` | Dependent records deleted with it. |

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
| `maxConcurrentRuns` | `int` | Maximum concurrent runs; 0 means unlimited. Minimum 0, maximum 100000. |
| `timeoutSeconds` | `int?` | Run deadline override. |
| `maxAttempts` | `int` | Maximum attempts. Minimum 1, maximum 10, default 1. |
| `retryOnNodeLoss` | `bool` | Whether a running run is requeued when its node is lost. |
| `weight` | `int` | Traffic weight among the agent's active deployments. Minimum 0, maximum 1000, default 100. |
| `nodePoolId` | `string?` | Required node pool. |
| `workspaceTemplateId` | `string?` | Workspace template. |
| `artifactStoreId` | `string?` | Artifact store. |
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

#### `DeploymentRunOverrideRule`

Child record of Deployment: parameters callers may override per run.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `deploymentId` | `string` | Parent Deployment identifier. |
| `name` | `string` | Parameter name (deployment parameter or model). |
| `validation` | `RunOverrideValidationEnum` | Validation kind. |
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

`All`, `Account`, `Tenant`, `Admin`, `User`, `Credential`, `Session`, `Role`, `Permission`, `Assignment`, `Audit`, `RequestHistory`, `Settings`, `HarnessProfile`, `PromptTemplate`, `Agent`, `Deployment`, `McpServer`, `Secret`, `Workspace`, `ArtifactStore`, `Run`, `Node`, `NodePool`, `Manifest`, `Conversation`, `Approval`, `Artifact`

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
| `supportsResume` | `bool` | Whether the harness can resume a session. |
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

`Stdin`, `Argument`, `File`

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
| `status` | `string` | healthy or degraded. |
| `node` | `string` | Node identifier. |
| `version` | `string` | Product version. |
| `database` | `string` | Database status: ok or unreachable. |
| `utc` | `DateTime` | Server time (UTC). |

#### `InvokeRequest`

Request to invoke an agent.

| Field | Type | Description |
|---|---|---|
| `input` | `string` | Input message. |
| `inputContentType` | `string?` | Input content type, default text/plain. |
| `deploymentId` | `string?` | Specific deployment; null picks a weighted active deployment. |
| `parameters` | `Dictionary<string, string>` | Per-run parameter overrides allowed by the deployment. |
| `priority` | `int` | Priority from -100 to 100. |
| `wait` | `bool` | Whether to wait for completion before responding. |
| `waitSeconds` | `int` | Maximum seconds to wait (1 to 600). |

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
| `resourceId` | `string?` | Resulting resource identifier. |
| `message` | `string?` | Message. |

#### `ManifestApplyResultEnum`

`Created`, `Updated`, `Unchanged`, `Failed`, `Validated`

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

#### `NodeLeaseRequest`

Lease request (long poll).

| Field | Type | Description |
|---|---|---|
| `nodeId` | `string` | Node identifier. |
| `maxRuns` | `int` | Maximum runs to lease. Minimum 1, maximum 64. |
| `waitMs` | `int` | Maximum wait in milliseconds. Minimum 0, maximum 60000. |

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
| `spec` | `Garrison.Core.Compilation.ExecutionSpec` | Compiled execution spec. |

#### `NodePool`

Group of worker nodes, optionally dedicated to tenants.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifier. |
| `name` | `string` | Pool name. |
| `description` | `string?` | Description. |
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
| `nodePool` | `string?` | Node pool name, or null for the default pool. |
| `labels` | `Dictionary<string, string>` | Labels. |
| `capabilities` | `List<NodeCapabilityReport>` | Harness capabilities. |

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
| `sessionId` | `string?` | Harness session identifier. |
| `servedModel` | `string?` | Model that served the run. |
| `exitCode` | `int?` | Process exit code. |
| `stderrTail` | `string?` | Stderr tail (scrubbed). |
| `errorMessage` | `string?` | Error message. |
| `inputTokens` | `long` | Input tokens. |
| `outputTokens` | `long` | Output tokens. |
| `cachedTokens` | `long` | Cached input tokens. |
| `costUsd` | `double?` | Cost in USD. |
| `costEstimated` | `bool` | Whether the cost is an estimate. |
| `lastEventSequence` | `long` | Highest event sequence received. |
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |
| `parameters` | `List<RunParameter>` | Per-run parameter overrides. |
| `requirements` | `List<RunRequirement>` | Node label requirements copied from the deployment. |
| `templateVersions` | `List<RunTemplateVersion>` | Prompt template versions used to compile the run. |

#### `RunKindEnum`

`Invoke`, `Delegated`, `Test`, `Retry`

#### `RunStatusEnum`

`Pending`, `Queued`, `Leased`, `Running`, `Cancelling`, `Succeeded`, `Failed`, `Cancelled`, `TimedOut`, `Rejected`

#### `RunOutcomeEnum`

`None`, `Succeeded`, `HarnessFailed`, `NotInstalled`, `NotCredentialed`, `McpPreflightFailed`, `NodeLost`, `OutputLimitExceeded`, `SchemaValidationFailed`, `TimedOut`, `Cancelled`, `StaleLease`, `CompileFailed`, `WorkspaceFailed`, `Rejected`, `InternalError`

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

#### `RunCreateRequest`

Request to create a run.

| Field | Type | Description |
|---|---|---|
| `agentId` | `string?` | Agent identifier (or supply AgentName). |
| `agentName` | `string?` | Agent name (or supply AgentId). |
| `deploymentId` | `string?` | Specific deployment; null picks a weighted active deployment. |
| `input` | `string` | Input message. |
| `inputContentType` | `string?` | Input content type, default text/plain. |
| `parameters` | `Dictionary<string, string>` | Per-run parameter overrides allowed by the deployment. |
| `priority` | `int` | Priority from -100 to 100; higher runs first. |
| `wait` | `bool` | Whether to wait for completion before responding. |
| `waitSeconds` | `int` | Maximum seconds to wait (1 to 600). |

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
| `text` | `string?` | Text content. |
| `toolName` | `string?` | Tool name. |
| `toolCallId` | `string?` | Tool call identifier. |
| `success` | `bool?` | Tool result success. |
| `inputTokens` | `long?` | Input tokens for usage events. |
| `outputTokens` | `long?` | Output tokens for usage events. |
| `rawEventJson` | `string?` | Verbatim harness event. |

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
| `text` | `string?` | Text content. |
| `toolName` | `string?` | Tool name. |
| `toolCallId` | `string?` | Tool call identifier. |
| `success` | `bool?` | Success flag for tool results. |
| `inputTokens` | `long?` | Input tokens for usage events. |
| `outputTokens` | `long?` | Output tokens for usage events. |
| `rawEventJson` | `string?` | Verbatim harness event (unmanaged JSON). |
| `createdUtc` | `DateTime` | Persisted (UTC). |

#### `RunStartedRequest`

Worker report that a run's harness started.

| Field | Type | Description |
|---|---|---|
| `nodeId` | `string` | Node identifier. |
| `epoch` | `long` | Fencing epoch. |
| `processId` | `int?` | Process identifier. |
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
| `active` | `bool` | Whether the record is active. |
| `isProtected` | `bool` | Whether the record is protected from deletion. |
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `SecretKindEnum`

`AnthropicApiKey`, `ClaudeCodeOAuthToken`, `OpenAiApiKey`, `CodexAuthJson`, `GeminiApiKey`, `GenericEnv`, `GenericFile`, `BearerToken`, `BasicAuth`, `GitCredential`

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
| `createdUtc` | `DateTime` | Creation timestamp (UTC). |
| `lastUpdateUtc` | `DateTime` | Last update timestamp (UTC). |

#### `TenantRequest`

Tenant create or update request.

| Field | Type | Description |
|---|---|---|
| `name` | `string?` | Tenant name. Required on create. |
| `description` | `string?` | Description. |
| `active` | `bool?` | Whether the tenant is active. |

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
