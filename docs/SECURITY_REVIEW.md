# Security Review (P15.1)

Review date: 2026-10-14, against commit `a441fa1` (schema 27). Decision D-054 brought this review into scope. File and line references point at that commit. P15.1 fixed SR-01 to SR-07 (SR-03, SR-04, and SR-07 in part); P15.22 (decision D-055: there are no existing installations, so nothing is held back for compatibility) fixed the rest, as described under each finding, and P15.24 closed the last part of SR-07 with Voltaic 2.4.0.

The review covered the server, worker, core, harness, and provider-harness projects, the dashboard, `docs/SECURITY.md`, and the Kubernetes manifests. It looked at:

- secret storage and leakage into logs, errors, request history, run events, and metrics;
- token issuance, expiry, revocation, and comparison;
- authorization: the operation scope map, tenant filtering, and privilege escalation;
- SSRF on every URL Garrison fetches for a tenant;
- path traversal in workspaces, artifacts, manifests, and conversation directories;
- command-argument injection through harness profiles and the invocation compiler;
- request size limits;
- dashboard XSS.

Exploit notes describe the class of problem only.

Every fix has a Touchstone regression test, and each test was confirmed to fail with its fix removed:

| Suite | File | Covers |
|---|---|---|
| `security-unit`, `security-<provider>` | `src/Test.Shared/Suites/SecurityReviewSuite.cs` | P15.1 fixes |
| `security-hardening-unit`, `security-hardening-<provider>` | `src/Test.Shared/Suites/SecurityHardeningSuite.cs` | P15.22 server and core fixes |
| `security-worker-unit`, `security-worker-<provider>` | `src/Test.Shared/Suites/SecurityWorkerSuite.cs` | P15.22 worker fixes |
| `security-assets` | `src/Test.Shared/Suites/SecurityAssetsSuite.cs` | P15.22 Docker Compose, Kubernetes, Helm, and dashboard files |

Every finding is fixed. The last open part, redirects and DNS rebinding for Garrison's MCP clients (SR-07), closed in P15.24 once Voltaic 2.4.0 accepted a caller-supplied HTTP handler.

## Summary

| ID | Severity | Area | Status |
|---|---|---|---|
| SR-01 | Critical | Tenant administrators could act as worker nodes and lease other tenants' runs | Fixed |
| SR-02 | High | Tenant security roles could take over a system administrator through credentials or a password reset | Fixed |
| SR-03 | High | No request body limit; bodies buffered before authentication | Fixed: Content-Length (P15.1), chunked bodies capped while read, body read before authentication only when signed (P15.22) |
| SR-04 | High | Stdio MCP diagnostics run tenant-chosen commands on the worker host | Fixed: refused for Untrusted-only tenants (P15.1), off on every worker unless `McpTestsEnabled` (P15.22) |
| SR-05 | Medium | Run tokens could start runs outside the delegation policy through retry | Fixed |
| SR-06 | Medium | Request history stored passwords and secret values; debug log wrote WebSocket tokens | Fixed |
| SR-07 | Medium | MCP server test and S3 endpoints could target cloud metadata and link-local addresses | Fixed: connect-time checks and no redirects for S3 (P15.22) and for the Voltaic MCP clients (P15.24) |
| SR-08 | High | Public default keys and credentials accepted at startup | Fixed: refused unless `GARRISON_ALLOW_INSECURE_DEFAULTS`; Compose and Kubernetes generate or require real values. The administrator password `password` is allowed by operator decision (2026-11-04) |
| SR-09 | High (conditional) | PersistentVolume workspaces can mount any claim in the run namespace | Fixed: the claim needs label `garrison.io/tenant` equal to the run's tenant |
| SR-10 | Medium | Anyone who configures MCP servers or deployments can use any tenant secret | Fixed: separate use permission (`Execute` on `Secret`, role `SecretUser`) |
| SR-11 | Medium | Restart resets rotated seeded credentials to the configured secret | Fixed: seeded secrets are set only at creation |
| SR-12 | Medium | Artifact download tickets depend on the signing key alone | Fixed: tickets use keys derived from the signing and master keys |
| SR-13 | Medium | No grant ceiling on role assignment; tenant admin flag self-assignable | Fixed: grant ceiling, tenant administrator flag, reserved role names, role resolution by identifier |
| SR-14 | Medium | Prompts delivered as an argument can be read as flags | Fixed: `--` before the task |
| SR-15 | Medium | `/v1.0/ws` is outside the operation scope map and subscriptions are unbounded | Fixed: in the scope map, 64 subscriptions per session |
| SR-16 | Low | Node name re-registration and lifecycle reports are not bound to the node's credential | Fixed: 409 `NodeIdentityMismatch` |
| SR-17 | Low | Password changes keep sessions; refresh extends a session indefinitely | Fixed: revoked on password change and on refresh |
| SR-18 | Low | Short secrets fully shown in `last4`; unsalted fingerprints | Fixed: no `last4` under 12 characters; HMAC fingerprints |
| SR-19 | Low | Weak master or signing keys are not stretched; key version not checked | Fixed: weak keys logged, key version checked |
| SR-20 | Low | Anonymous `/metrics` on the REST port by default, with tenant labels | Fixed: off by default; scrapers use the metrics listeners |
| SR-21 | Low | S3 stores with a custom endpoint and no secret use the server's ambient cloud identity | Fixed: a secret is required unless the operator allows ambient credentials |
| SR-22 | Low | Git URLs accept any scheme and are passed without `--` | Fixed: https and ssh only, `--`, `GIT_ALLOW_PROTOCOL` |
| SR-23 | Low | Default run egress allows 169.254.0.0/16 on 443; server and worker pods have open egress | Fixed: metadata ranges excluded everywhere |
| SR-24 | Low | Workspace writes on reused conversation directories follow symlinks | Fixed: links replaced or refused; uploads checked after open |
| SR-25 | Low | Dashboard serves no CSP or framing headers; token in localStorage | Fixed: CSP and framing headers, remote media dropped; token kept in localStorage behind the CSP |
| SR-26 | Info | Smaller observations | Fixed |

## Fixed in P15.1

### SR-01 Critical: tenant administrators could act as worker nodes

**Where:** `src/Garrison.Server/Services/AuthorizationService.cs:324` (`IsPlatformOnly` exempted `Node` `Execute`), `src/Garrison.Server/Routes/NodeProtocolRoutes.cs:59-66`, `src/Garrison.Server/Runtime/SchedulerService.cs:266,297`.

**What was wrong:** the node protocol routes are authorized as `Node` `Execute`. Two paths granted that operation:

- the tenant administrator bypass (`isTenantAdmin`);
- any `All` grant, such as `TenantAdmin.All` or `ResourceAdmin.All`.

Nodes are global, and a node with no pool can claim any tenant's runs. The lease response carries each run's `ExecutionSpec`, which holds decrypted secrets, plus a run token.

**Exploit class:** cross-tenant secret disclosure. An administrator of any tenant registers a node, long-polls for leases, and receives other tenants' runs and credentials.

**Fix:** `Node` `Execute` now needs a grant that names `Node` explicitly, such as the `NodeAgent` role, or a system administrator. The tenant administrator bypass and `All` grants no longer count. A credential with no role assignments falls back to its owner's grants, under the same explicit-`Node` rule.

The seeded worker credential, Helm, Compose, and the Kubernetes base all use a `NodeAgent` credential, so workers are unaffected.

**Test:** `security-<provider>/node-protocol-tenant-admin`.

### SR-02 High: tenant security roles could become system administrator

**Where:** `src/Garrison.Server/Services/IdentityService.cs:205` (update user), `:261` (create credential), `:344` (rotate credential), and `src/Garrison.Server/Services/AuthenticationService.cs:467`, where a credential inherits its owner's `isAdmin`.

**What was wrong:** anyone allowed to create credentials or update users in a tenant could act on a system administrator in that tenant. That includes `SecurityAdmin`, `TenantAdmin`, and a tenant administrator. The seeded `admin@garrison` is one such administrator. Three actions were open:

- mint a credential owned by the administrator;
- rotate the administrator's credential and receive the new secret;
- reset the administrator's password.

**Exploit class:** vertical privilege escalation from a tenant role to platform administrator.

**Fix:** only a system administrator may do these three things to a system administrator:

- create a credential for them;
- rotate one of their credentials;
- change their password or email.

Anyone else gets 400 `ValidationFailed`, with the field named. Nothing changes for ordinary users.

**Test:** `security-<provider>/admin-escalation`.

### SR-03 High: no request body limit

**Where:** `src/Garrison.Server/GarrisonServer.cs:169` and `src/Garrison.Server/Protocols/McpClusterProxy.cs:170` never set Watson's `IO.MaxRequestBodySize`, whose default is unlimited. `src/Garrison.Server/Services/AuthenticationService.cs:87` reads the body before authentication, for signed-request verification.

**Exploit class:** unauthenticated memory exhaustion. One multi-gigabyte POST is buffered by the server.

**Fix:** a new setting, `Rest.MaxRequestBodyBytes` (environment variable `GARRISON_REST_MAX_REQUEST_BODY_BYTES`):

- Default 128 MiB, which leaves room for the default 16 MiB artifact limit. Explicitly raised artifact/checkpoint caps must be aligned with this ceiling and any proxy limits. 0 turns the check off.
- The REST listener refuses any request whose Content-Length is larger with 413, before reading the body.
- The MCP listener applies `Mcp.MaxMessageSize` the same way.

**Formerly open part:** Watson checks only Content-Length, so a body sent with chunked transfer encoding was still unbounded.

**Fixed in P15.22:** a chunked body is read chunk by chunk before routing and refused with 413 `RequestTooLarge` as soon as it passes the limit; a body within it replaces the request stream, so handlers read it as usual (`RequestBodyLimiter`, used by the REST listener with `Rest.MaxRequestBodyBytes` and the MCP listener with `Mcp.MaxMessageSize`). Authentication reads the body only when `x-signature` is present. No Watson change was needed.

**Tests:** `security-<provider>/request-body-limit`, `security-hardening-<provider>/chunked-body-limit`.

### SR-04 High: stdio MCP diagnostics run on the worker host

**Where:** `src/Garrison.Server/Routes/McpServerRoutes.cs:81`, `src/Garrison.Server/Services/WorkerMcpTestService.cs:43-45,117-125`, and `src/Garrison.Worker/Hosting/WorkerHost.cs:476,557-588`.

**What was wrong:** `POST .../mcp-servers/{id}/test?nodeId=` needs only `McpServer` `Update`, which `Editor` and `AgentDeveloper` have. It runs the server's command, arguments, and environment as a child of the worker process on any worker, outside any run pod. Every worker advertises the capability.

On a KubernetesJob worker, that process can read what the worker can read:

- the node credential;
- the worker's service account token, which can create Jobs.

**Exploit class:** escape from the isolation model. This includes tenants that set `requireUntrustedDeployments`.

**Fix:** tenants with `requireUntrustedDeployments` get 400 `ValidationFailed` with field code `StdioDiagnosticsRequireTrust` on `transport`. Those tenants have said that everything they run must be isolated, so they lose nothing they were entitled to.

**Open part:** other tenants can still run these diagnostics on any worker, including KubernetesJob workers whose run pods would otherwise isolate them. The recommendation is one of:

- a worker setting `McpTestsEnabled`, off by default, so operators turn the diagnostic on only on Process workers;
- running stdio diagnostics in a run pod.

**Fixed in P15.22:** workers have a setting `McpTestsEnabled` (`GARRISON_WORKER_MCP_TESTS_ENABLED`), off by default. A worker advertises stdio diagnostics, and runs one it is sent, only when an operator turns it on, which is meant for Process workers whose host is already the boundary. Docker Compose, Kubernetes, and the images leave it off. The dashboard explains why no worker is offered.

**Tests:** `security-<provider>/stdio-test-untrusted-tenant`, `security-worker-<provider>/mcp-tests-opt-in`.

### SR-05 Medium: run-token retries bypassed the delegation policy

**Where:** `src/Garrison.Server/Routes/RunRoutes.cs:190-206` and `src/Garrison.Server/Runtime/RunService.cs:407-444`.

**What was wrong:** run tokens may create runs, which is how delegation works. A retry, though, starts a new top-level run with no parent. It never passes through the delegation checks: `delegationMode`, the allowlist, depth, and cycle detection. An agent with `delegationMode: None` could start any agent its caller could start by retrying a visible run.

**Fix:** `POST .../runs/{id}/retry` answers 403 `RunTokenRetryNotAllowed` to run tokens. Runs delegate through invoke instead.

**Test:** `security-<provider>/run-token-retry`.

### SR-06 Medium: request history kept passwords and secret values

**Where:** `src/Garrison.Server/Services/RequestHistoryCaptureService.cs:54` and `src/Garrison.Server/GarrisonServer.cs:426`.

**What was wrong:** request and response bodies were redacted only for paths containing `/secrets`, `/token`, `/credentials`, or the node lease and heartbeat paths. Three routes with secrets in their bodies were captured anyway and kept for 30 days:

- user create and update, which carry `password`;
- `manifests/apply?allowSecretValues=true`, which carries secret values;
- `PUT /v1.0/api/settings`, which carries the master key, signing key, and database password.

Separately, the debug request log wrote the full query string, including the WebSocket `token`.

**Fix:** bodies are now also redacted for `/users`, `/manifests/apply`, and `/v1.0/api/settings`. In both the stored URL and the debug log, the value of any query parameter whose name contains `token`, `secret`, `password`, `ticket`, `key`, or `signature` is replaced with `[redacted]` (`RequestHistoryCaptureService.RedactQuery`).

**Test:** `security-unit/history-redaction`.

### SR-07 Medium: SSRF to cloud metadata and link-local addresses

**Where:** `src/Garrison.Server/Routes/McpServerRoutes.cs:143-173` (the HTTP MCP server test, run from the control plane) and `src/Garrison.Server/Routes/ArtifactStoreRoutes.cs:116` (the S3 endpoint).

**What was wrong:** any principal with `McpServer` `Update` controls the test's URL and headers. The test reaches any host the control plane can reach and returns the error text. Nothing checked the destination address. An artifact store's S3 endpoint is likewise any http or https URL.

**Exploit class:** semi-blind SSRF from the control plane into cloud instance metadata and the cluster network.

**Fix:** a new `OutboundAddressPolicy` (`src/Garrison.Core/Security/OutboundAddressPolicy.cs`) refuses these addresses, with IPv4-mapped IPv6 checked as IPv4:

- unspecified: 0.0.0.0/8 and `::`;
- link-local: 169.254.0.0/16 and fe80::/10, which covers 169.254.169.254;
- the AWS IPv6 metadata address, fd00:ec2::254;
- multicast and broadcast.

The policy is applied in two places:

- The MCP test resolves the host before connecting and fails fast with the reason, without connecting.
- An S3 endpoint whose host is one of these addresses is rejected at validation.

Loopback and private ranges stay allowed, because MCP servers and object stores normally live there.

**Open part:**

- Voltaic's `McpHttpClient` uses a default `HttpClient`, so it follows redirects, and the address check happens before the connection rather than inside it. A redirect, or a DNS answer that changes between check and connect, can still reach a blocked address.
- The S3 check covers literal addresses only.

The recommendation is a Voltaic constructor that accepts an `HttpMessageHandler`, so Garrison can pass a `SocketsHttpHandler` with redirects off and a `ConnectCallback` that applies the policy at connect time. Do the same for the AWS SDK through its HTTP client factory. Optionally add an operator setting that also blocks loopback and private ranges for tenant-defined destinations.

**Fixed in P15.22:**

- `OutboundAddressPolicy.CreateHandler(allowPrivateNetworks)` returns a `SocketsHttpHandler` with redirects off, no proxy, and a `ConnectCallback` that resolves the host and connects only to an address the policy allows, so neither a redirect nor a DNS answer that changes after a check can reach a blocked address. `allowPrivateNetworks: false` also refuses loopback and private ranges, for features whose destinations should be on the public internet. It is public for reuse by triggers, webhooks, and remote agents.
- S3 artifact stores with a custom endpoint use it through `GuardedS3HttpClientFactory` (`AmazonS3Config.HttpClientFactory`), so the S3 check now covers names as well as literal addresses.
- `remoteEndpointUrl` is validated as an absolute http or https URL without credentials and refused on blocked literal addresses, ahead of remote invocation (SR-26).

**Fixed in P15.24:** Voltaic 2.4.0 adds `McpHttpClient(HttpMessageHandler handler, bool disposeHandler = true)`. The HTTP MCP server test (`McpServerRoutes`), MCP preflight on workers (`McpPreflight`), and the provider harness bridge (`ProviderMcpBridge`) now pass `OutboundAddressPolicy.CreateHandler()`, so every request goes through the connect-time address check and none follows a redirect. An MCP server that answers with a redirect now fails the test with its status (for example HTTP 302); configure the final URL instead. The MCP clients that only talk to Garrison's own MCP server (the fake harness, the Codex approval relay, and the artifact uploader) keep the default client.

**Tests:** `security-unit/outbound-address-policy`, `security-<provider>/outbound-blocked`, `security-hardening-unit/outbound-handler`, `security-hardening-<provider>/mcp-test-redirect` (fails with the default client: the redirect target is contacted).

## Fixed in P15.22 (formerly open)

Each finding keeps its original description and recommendation, followed by what was done.

### SR-08 High: public default keys and credentials are accepted at startup

**Where:**

- `src/Garrison.Server/Settings/SecuritySettings.cs:10,26,30,34`
- `src/Garrison.Server/Settings/AuthSettings.cs:12,26`
- `src/Garrison.Server/Bootstrapper.cs:150-152`
- `docker/compose.yaml:98-106`

**What is wrong:** the admin API key (`garrisonadmin`), the admin password, the default and node credentials, the master key, and the signing key all have public defaults. Only the master key and signing key log a warning. Helm generates real values; Compose and bare runs do not.

**Exploit class:** full administrator access on any instance left on defaults.

**Recommendation:** refuse to start when any of these equal their default, unless `GARRISON_ALLOW_INSECURE_DEFAULTS=true` is set, and set it in the development Compose file. This breaks installations that rely on defaults until they set values, so it needs your approval.

**Fixed:**

- The server refuses to start while the master key, signing key, administrator API key, administrator password, default secret key, or node secret key is empty or equal to its public default, and names the environment variables to set. `Security.AllowInsecureDefaults` (`GARRISON_ALLOW_INSECURE_DEFAULTS=true`) is the explicit development mode, used by Touchstone, the SDK harness and contract test scripts, the local Kubernetes dry run, and the benchmarks.
- Docker Compose has no fallback values: `compose.yaml` requires every key and password (`${VAR:?}`), and `docker/env-secrets.sh` (run by `update.sh` and `factory/reset.sh`) generates any that are missing into `docker/.env`. It never overwrites a value, and never generates the database password or keys for an existing Postgres volume.
- `k8s/scripts/generate-secrets.sh` now also generates random administrator and Grafana passwords.

**Tests:** `security-hardening-unit/insecure-defaults`, `security-assets/compose-no-default-secrets`, `security-assets/secret-scripts-no-default-password`, `security-assets/dev-mode-explicit`.

**Changed 2026-11-04 (operator decision):** the administrator password is exempt. Every install seeds `admin@garrison` / `password` unless `GARRISON_ADMIN_PASSWORD` is set, the dashboard sign-in card shows it, and only an empty password is refused. Change it after the first sign-in on any server other people can reach. The keys and the seeded credentials are still refused at their public defaults. The test names above are unchanged; `secret-scripts-no-default-password` now checks that the scripts seed `password`.

### SR-09 High (conditional): any PersistentVolumeClaim can be mounted as a workspace

**Where:** `src/Garrison.Core/Services/ConfigurationValidator.cs:198-202` and `src/Garrison.Worker/Kubernetes/RunPodManifestBuilder.cs:330-339`.

**What is wrong:** a workspace template's `persistentVolumeClaim` is checked only as a DNS name. A tenant editor can name any claim in the run namespace, including:

- the PostgreSQL backup claim;
- the Loki or Tempo claims;
- another tenant's claim.

**Applies when:** those components share the run namespace, which is the default.

**Recommendation:** require claim names to carry a per-tenant prefix, or have the worker read the claim and require a `garrison.io/tenant` label (this adds `get` on persistentvolumeclaims to the worker Role). Both break existing templates whose claims don't follow the rule. Until then, keep `kubernetesExecutor.runNamespace` separate from backup and observability volumes.

**Fixed:** the worker reads the claim before creating the run Job (`WorkspaceClaimGuard`) and fails the run with outcome `WorkspaceFailed` unless the claim's `garrison.io/tenant` label equals the run's tenant. The worker Role in the Kustomize base and the Helm chart gains `get` on persistentvolumeclaims. Operators label each claim they offer to a tenant.

**Test:** `security-worker-unit/pvc-tenant-label`.

### SR-10 Medium: configuration authors can use any tenant secret

**Where:**

- `src/Garrison.Server/Routes/McpServerRoutes.cs:201-221` and `src/Garrison.Server/Services/WorkerMcpTestService.cs:111-126`: the MCP tests render templates with every secret in the tenant.
- `src/Garrison.Server/Routes/DeploymentRoutes.cs`: deployments may bind any tenant secret.

**What is wrong:** secrets are write-only through the API. But `Editor` and `AgentDeveloper` can still get a secret's value sent where they choose, through a test header or a harness environment variable.

**Why it is open:** this follows the current model, where anyone who can configure and run deployments can use the tenant's secrets. Closing it needs a "use" permission on secrets, checked when a template references them. That is a design change.

**Recommendation:** add `Secret` `Execute` (use) to `SecretManager` and `TenantAdmin`. Require it when a deployment binds a secret, and when an MCP server test renders a template that references `secret.*`. Render only the secrets a template references.

**Fixed:** using a secret is `Execute` on `Secret`, held by `TenantAdmin` and `SecretManager` and by a new built-in role `SecretUser` (assign it with resource scope to allow one secret); `Editor` and `AgentDeveloper` do not hold it. `SecretUseChecker` requires it, per secret, when someone saves a deployment that binds secrets (all of them, on every save), an MCP server or harness profile whose templates reference secrets (for the secrets of every deployment that uses it), an artifact store, workspace template, or agent that names a secret, or a manifest document that does any of these; and when an MCP server test renders secrets, where only the secrets its templates name are decrypted. Denials are 400 with field code `SecretUseDenied`.

**Test:** `security-hardening-<provider>/secret-use`.

### SR-11 Medium: restart resets rotated seeded credentials

**Where:** `src/Garrison.Core/Services/DefaultSeeder.cs:202-220`.

**What is wrong:** on every start, the seeded "Default Administrator Key" and "Worker Node Key" are overwritten with `Security.DefaultSecretKey` and `NodeSecretKey` when they differ. Rotating either through the API is undone, often back to the public default, at the next restart.

**Recommendation:** set the secret only when the credential is created, or overwrite it only when the setting comes from the environment. Operators who change the environment variable on purpose would then need to rotate through the API instead, so this needs a decision.

**Fixed:** the seeded secret is set only when the credential is created; a restart never changes an existing credential. Rotate through the API.

**Test:** `security-hardening-<provider>/seeded-credential-kept`.

### SR-12 Medium: artifact download tickets depend on the signing key alone

**Where:** `src/Garrison.Server/Services/ArtifactService.cs:116-121`.

**What is wrong:** session tokens also need a random session row in the database. A download ticket, by contrast, is valid whenever its signature checks out. With a known signing key (see SR-08), anyone can forge a ticket for a known artifact identifier.

**Recommendation:** derive a separate key for tickets from the signing key, labelled for artifacts. Optionally record ticket identifiers. Refusing default keys (SR-08) removes the practical risk.

**Fixed:** tickets are issued and checked by their own token service, whose keys are derived from the signing key and the master key under an artifact label, so a session token never works as a ticket and forging one needs both secrets. SR-08 removes the public defaults.

**Test:** `security-hardening-<provider>/artifact-ticket-key`.

### SR-13 Medium: no ceiling on what an assigner may grant

**Where:**

- `src/Garrison.Server/Routes/AssignmentRoutes.cs:81-101`
- `src/Garrison.Server/Services/IdentityService.cs:162,208`
- `src/Garrison.Server/Services/AuthorizationService.cs:381`

**What is wrong:** a holder of `Assignment` `Create`, or of `User` `Create` or `Update`, can assign `TenantAdmin` or set `isTenantAdmin`, including on themselves. Separately, a custom role whose name matches a built-in role case-insensitively receives the built-in's grants.

**Recommendation:**

- Require `isTenantAdmin` to change `isTenantAdmin`.
- Require the assigner to hold every permission of the role being granted.
- Resolve roles by `roleId` when it is set, and reject built-in names case-insensitively when custom roles are created.

The ceiling check changes what `SecurityAdmin` can do today.

**Fixed:**

- `AuthorizationService.CeilingViolationAsync` expands a set of grants into resource type and operation pairs and requires the caller to hold each one (system administrators have no ceiling; operations only system administrators can perform anyway, and node `Execute` unless named, are skipped). It applies to user and credential role assignments, mapping a permission to a role, changing a permission's lists, creating a credential with a role, and, because the caller can then act as that user, creating or rotating another user's credential and changing another user's password or email. Denials are 400 with field code `GrantCeiling`.
- Setting or clearing `isTenantAdmin`, and acting for a tenant administrator in those ways, needs a tenant administrator.
- An assignment with a role identifier resolves by identifier only, and tenant roles cannot take a built-in role's name in any letter case (`ReservedRoleName`).

**Test:** `security-hardening-<provider>/grant-ceiling`.

### SR-14 Medium: prompts delivered as an argument can be read as flags

**Where:** `src/Garrison.Core/Compilation/InvocationCompiler.cs:657-658`.

**What is wrong:** with `promptDelivery: Argument`, the task text is the last argument, with no `--` before it. Input that starts with `-` reaches a CLI as an option. No built-in profile uses this mode; they all deliver the prompt on stdin. `docs/SECURITY.md` was corrected in this change, since it said callers cannot inject flags.

**Recommendation:** add a profile field for an end-of-options separator, defaulting to `--` for new profiles. That needs a schema change. Otherwise, reject prompts that start with `-` in this mode.

**Fixed without a schema change:** in `Argument` mode the compiler adds `--` before the prompt argument whenever caller text would begin it: with no `promptArgumentTemplate`, or a template that starts with a variable. A template with a literal prefix, such as `--prompt={{input.text}}`, is a single option value and needs no separator. No built-in profile uses this mode.

**Test:** `security-hardening-<provider>/prompt-argument-separator`.

### SR-15 Medium: the live-updates WebSocket is outside the scope map

**Where:** `src/Garrison.Server/Modules/RuntimeModule.cs:161` and `src/Garrison.Server/WebSockets/LiveUpdatesHandler.cs`.

**What is wrong:** `/v1.0/ws` is registered directly on Watson and authenticates itself. It has no operation scope map entry, which the architecture rules require for every route. Subscriptions per socket are unbounded, and each one polls the database.

**Recommendation:** record a scope entry, and cap subscriptions per session (for example 64).

**Fixed:** the WebSocket is registered through `RouteRegistrar.WebSocket`, which records it in the operation scope map as handler-authorized. A session holds at most 64 subscriptions (`LiveUpdatesHandler.MaxSubscriptionsPerSession`); another subscribe answers `TooManySubscriptions`.

**Test:** `security-hardening-<provider>/websocket-scope-and-cap`.

### SR-16 Low: node identity binding

**Where:**

- `src/Garrison.Server/Runtime/NodeService.cs:124,138`: registration takes over an existing node by name and rebinds it to the caller's credential.
- `src/Garrison.Server/Routes/NodeProtocolRoutes.cs:125-146`: `started`, `events`, and `complete` take the node identifier from the body without checking the node's credential.

**Why Low now:** after SR-01, only `NodeAgent` credentials and system administrators can reach these routes. The remaining risk is one worker credential impersonating another, which matters only if you give pools separate credentials to keep them apart.

**Recommendation:** reject re-registration with 409 `NodeIdentityMismatch` when the node is bound to another credential. Call `RequireNodeAsync` in the three lifecycle handlers, with a short-lived cache, since event ingestion is on the claim-path budget (G-33).

**Fixed:** registration answers 409 `NodeIdentityMismatch` when the name is bound to another active credential (a deleted or deactivated credential releases the name, so a replaced node credential is not locked out). `started`, `events`, and `complete` check the binding through `NodeBindingCache`, a 30-second per-replica cache, so event ingestion does not read the node row per batch. System administrators are exempt.

**Test:** `security-worker-<provider>/node-identity`.

### SR-17 Low: session lifetime

**Where:** `src/Garrison.Server/Services/IdentityService.cs:205` and `src/Garrison.Server/Routes/CoreRoutes.cs:205-221`.

**What is wrong:** a password change leaves existing sessions valid until they expire. Refresh issues a new session without revoking the old one and has no overall cap.

**Recommendation:** revoke a user's sessions on password change. Revoke the old session on refresh, or cap total session age. This belongs with P15.3, token expiry policies.

**Fixed:** a password change revokes every other session of the user (a user who changes their own password keeps the session they used), and `POST /v1.0/token/refresh` revokes the session it was called with. A refreshed chain therefore never holds more than one live session, and it ends at the next password change, deactivation, or logout. A cap on total session age stays with P15.3.

**Test:** `security-hardening-<provider>/session-lifetime`.

### SR-18 Low: secret metadata

**Where:** `src/Garrison.Core/Security/SecretGenerator.cs:56-71`.

**What is wrong:** `last4` returns the whole value when it is four characters or fewer. Fingerprints are unsalted 64-bit SHA-256 prefixes, so a low-entropy secret can be confirmed offline from its metadata.

**Recommendation:** return an empty `last4` below about 12 characters. Key the fingerprint with an HMAC derived from the master key; this changes existing fingerprints.

**Fixed:** `last4` is empty for values shorter than 12 characters (`SecretGenerator.Last4MinimumLength`), and fingerprints are HMAC-SHA256 under a key derived from the master key (`SecretCipher.Fingerprint`).

**Test:** `security-hardening-unit/secret-metadata`.

### SR-19 Low: key handling

**Where:** `src/Garrison.Core/Security/SecretCipher.cs:128-139` and `src/Garrison.Core/Security/TokenService.cs:52-53`.

**What is wrong:** a key that is not base64 of 32 bytes is SHA-256 hashed with no stretching. The key-version byte is written but not checked on decrypt.

**Recommendation:** warn when a key is not 32 random bytes. Key rotation is P15.2.

**Fixed:** startup logs a warning when the master key is not base64 of 32 bytes or the signing key is shorter than 32 characters, and decryption refuses a value written under another key version with a clear error. Rotation remains P15.2.

**Test:** `security-hardening-unit/key-handling`.

### SR-20 Low: anonymous metrics

**Where:** `src/Garrison.Core/Settings/TelemetrySettings.cs:69` and `src/Garrison.Server/Routes/CoreRoutes.cs:56`.

**What is wrong:** `ServeMetricsOnServicePort` defaults to true. `/metrics` on the REST port is anonymous and labels series with tenant identifiers and agent names.

**Recommendation:** default it to false and scrape the telemetry port. This changes the default for existing scrapers.

**Fixed:** `ServeMetricsOnServicePort` defaults to false on the server and workers. The Kubernetes annotations, the Helm chart, and the Compose and Kubernetes Prometheus configurations scrape the metrics listeners (9464, 9465), which bind the pod IP (`GARRISON_PROMETHEUS_HOSTNAME`, `GARRISON_WORKER_PROMETHEUS_HOSTNAME`) or the Compose service name.

**Tests:** `security-hardening-unit/metrics-default`, `security-hardening-<provider>/metrics-service-port`, `security-assets/metrics-scrape-listener`, `security-assets/metrics-listener-hostname`.

### SR-21 Low: ambient cloud credentials with custom S3 endpoints

**Where:** `src/Garrison.Server/Storage/ArtifactStorage.cs:143-144`.

**What is wrong:** an S3 store with no `secretId` signs with the server's ambient identity, such as IRSA or an instance role. With a tenant-chosen endpoint, the signed requests, including the access key identifier and session token header, go to that host. The signatures are bound to the host and can't be replayed elsewhere.

**Recommendation:** require `secretId` whenever `endpoint` is set, behind a setting so existing stores keep working.

**Fixed:** an S3 store with a custom endpoint needs `secretId`, at validation and again when the client is built. `Artifacts.AllowAmbientCredentialsWithCustomEndpoint` (default false) is a deliberate operator choice for trusted tenants on, for example, an S3 VPC endpoint.

**Test:** `security-hardening-<provider>/s3-ambient-credentials`.

### SR-22 Low: git clone arguments

**Where:** `src/Garrison.Worker/Execution/WorkspacePreparer.cs:101-127` and `src/Garrison.Core/Services/ConfigurationValidator.cs:197`.

**What is wrong:** `gitUrl` accepts any scheme, including `file://` and local paths, and is passed with no `--` before it. The same applies to `gitRef` in the fallback checkout. With the current argument order this is not exploitable, but it rests on that order.

**Recommendation:**

- Allow only `https`, `ssh`, and `user@host:path`, and reject a leading `-`.
- Pass `--` before the URL and the ref.
- Set `GIT_ALLOW_PROTOCOL=https:ssh`.

**Fixed:** `gitUrl` must be `https://`, `ssh://`, or `user@host:path`; local paths, `file://`, `http://`, `git://`, `::` transports, a leading `-`, and whitespace are refused when the template is saved and again by the worker. `gitRef` may not start with `-` or contain whitespace, control characters, or `..`. The worker passes `--` before the URL, `--end-of-options` before the reference, and runs git with `GIT_ALLOW_PROTOCOL=https:ssh` and `GIT_PROTOCOL_FROM_USER=0`.

**Tests:** `security-worker-unit/git-url-policy`, `security-worker-unit/git-clone-local-refused`.

### SR-23 Low: egress for pods that fetch tenant URLs

**Where:** `k8s/base/networkpolicies.yaml:1-26,78-83` and Helm `runEgress`.

**What is wrong:** the server and worker NetworkPolicies cover ingress only, so their egress is open. Run pods default to TCP 443 anywhere, which includes 169.254.0.0/16. MCP preflight, provider endpoints, and the provider MCP bridge fetch tenant URLs from workers and run pods (`src/Garrison.Harnesses/Preflight/McpPreflight.cs:102`, `src/Garrison.ProviderHarness/ProviderApiRunner.cs:46`). The harness in those pods can already run arbitrary code, so the NetworkPolicy is the real boundary.

**Recommendation:**

- Add `except: [169.254.0.0/16]` to the default run egress rule.
- Add egress policies for the server and worker that exclude 169.254.169.254/32.

**Fixed:** both, in the Kustomize base and the Helm chart (`runEgress.except`). The server and worker egress policies allow cluster pods and any address outside the cluster except 169.254.169.254/32 (IPv4; `docs/KUBERNETES.md` covers adding fd00:ec2::254/128 on IPv6 AWS clusters).

**Test:** `security-assets/network-policies-metadata`.

### SR-24 Low: symlinks in reused conversation directories

**Where:** `src/Garrison.Worker/Execution/FileMaterializer.cs:36-44`, `src/Garrison.Worker/Execution/WorkspacePreparer.cs:70-73`, and `src/Garrison.Worker/Execution/ArtifactUploader.cs:115-116`.

**What is wrong:** on a conversation turn, the worker writes spec files into directories the previous turn's harness controlled, following any links planted there. The artifact uploader checks for a link and then opens the file, so a link swapped in between those two steps is followed. The harness runs as the same user, so it gains nothing it doesn't already have; this is defense in depth.

**Recommendation:** delete an existing link before writing, and compare the canonical path after opening.

**Fixed:** `FileMaterializer` and `WorkspacePreparer` replace a link at a file's own path with a regular file and refuse to write through a linked base or parent directory. `ArtifactUploader` checks after opening that the file is the regular file at its canonical path inside the workspace; on Linux it compares the open descriptor's real path through `/proc/self/fd`.

**Tests:** `security-worker-unit/link-safe-writes`, `security-worker-unit/artifact-link-swap`.

### SR-25 Low: dashboard hardening

**Where:** `dashboard/nginx.conf:9-59`, `dashboard/src/context/AuthContext.jsx:26,80`, and `dashboard/src/utils/markdown.js:14`.

**What is wrong:**

- No `Content-Security-Policy`, `frame-ancestors`, `X-Content-Type-Options`, or `Referrer-Policy` header.
- The bearer token is in localStorage.
- Sanitized model output may still load remote images, which a prompt-injected result can use to send data out.

**What is fine:** markdown goes through DOMPurify with a strict URL scheme check, and it is the only `dangerouslySetInnerHTML`.

**Recommendation:** add `Content-Security-Policy: default-src 'self'; img-src 'self' data:; connect-src 'self' <api>; frame-ancestors 'none'` with `nosniff` and `no-referrer`. A cross-origin `GARRISON_API_URL` has to be added to `connect-src`.

**Fixed:** `dashboard/nginx-security-headers.conf` sends the CSP (with `blob:` images for the chart export, and `connect-src` built from `GARRISON_API_URL` and `GARRISON_CSP_CONNECT_SRC`), `X-Frame-Options: DENY`, `nosniff`, and `no-referrer` on every location. The Markdown renderer drops remote image, video, and audio sources, so the vite development server is covered too. The token stays in `localStorage`: Garrison has no cookie sign-in, and the CSP is what keeps other script out of the origin (`docs/SECURITY.md`).

**Tests:** `security-assets/dashboard-headers`, and the dashboard unit test `markdown.test.js`.

### SR-26 Info

- The MCP server test returns the raw exception message to the caller (`McpServerRoutes.cs:193`).
- A credential whose secret cannot be decrypted makes signed-request verification throw, which answers 500 instead of 401. It fails closed (`AuthenticationService.cs:132,142`).
- The admin API key and `x-secret-key` checks are not rate limited; only `/v1.0/token` is.
- `A2ARoutes.cs:130` navigates a `JsonDocument`, against the repository's style rules.
- Run parameter overrides default to validation `Any`, so an allowed override takes any value. New rules could default to `Enum`.
- `Agent.remoteEndpointUrl` is stored but never called. Route remote invocation (P12.4) through `OutboundAddressPolicy` from the start.

**Fixed:**

- MCP server test errors name only the class of failure (for example "The MCP server could not be reached (ConnectionError)."), never the raw exception text, which could echo an internal service's response; the detail goes to the debug log.
- A credential secret that cannot be decrypted answers 401.
- Failed administrator API key, secret key, and signature attempts count per source address against `Auth.RateLimitPerMinute`, across replicas; past it, key-authenticated requests from that address get 429 for the rest of the minute.
- A2A JSON-RPC requests are read with typed classes (`A2AJsonRpcHead`, `A2AJsonRpcEnvelope<T>`, `JsonRpcIdConverter`); a fractional `id` no longer fails the request with 500.
- Run parameter override rules default to `Enum`, so a rule saved without a validation needs its allowed values; `Any` must be chosen explicitly.
- `remoteEndpointUrl` must be an absolute http or https URL without credentials and is refused on metadata and other blocked literal addresses; remote invocation should connect through `OutboundAddressPolicy.CreateHandler`.

**Test:** `security-hardening-<provider>/info-findings`.

## Checked and found sound

**Secrets at rest**

- AES-256-GCM with a fresh 12-byte nonce per value and the record identifier as associated data (`SecretCipher.cs:63-126`).
- Secret, credential, and password fields are `[JsonIgnore]`. Credential secrets are returned only on create and rotate.
- Settings secrets are masked. Manifest export leaves values out.

**Tokens**

- AES-CBC with a random IV, HMAC-SHA256 over IV and ciphertext, checked in constant time before decryption, with issuer and expiry checked (`TokenService.cs:74-122`).
- Every token also needs a live session row matched on a random identifier in constant time (`AuthCache.cs:155`).
- Run tokens are fenced by lease epoch.

**Comparisons and randomness**

- Admin key, secret key, HMAC signature, and token checks use `FixedTimeEquals`.
- All secrets come from `RandomNumberGenerator`.
- Passwords use PBKDF2-SHA256 with 600,000 iterations and a dummy verification for unknown users.

**Logs and run output**

- Unhandled errors return a generic 500.
- The `ExecutionSpec` is neither stored nor logged.
- Worker events, the stderr tail, and results are scrubbed of secret values and the run token.

**Tenant isolation**

- Cross-tenant paths answer 404 (`AuthorizationService.cs:176-180`).
- The MCP and A2A tenant comes from the principal.
- Deployment references are resolved inside the tenant (`ConfigurationValidator.cs`, `ConfigurationReferenceCache.cs`).
- Database reads for tenant-owned rows filter on the tenant.

**Scope map:** every REST route goes through `RouteRegistrar` and every MCP tool through `McpToolCatalog`; `/v1.0/ws` was the exception until SR-15.

**Paging:** list sizes are capped at 1,000, run events at 5,000.

**Processes**

- `ProcessRunner` uses `ArgumentList` with `UseShellExecute=false` and a cleared environment.
- Each argument template renders to exactly one argument.
- The template renderer has a fixed filter set and never evaluates code.

**Paths**

- `SafePaths.Combine` canonicalizes and checks containment.
- The compiler rejects absolute paths, `:`, and `..`.
- Run and conversation identifiers are validated before they become paths.
- Artifact collection skips links.
- Artifact store locations are server-generated and validated.
- There is no archive extraction.

**Run pods:** non-root, all capabilities dropped, read-only root filesystem, seccomp `RuntimeDefault`.

## Dependency and image scans (P15.4)

`.github/workflows/security-scans.yaml` runs on push, pull request, weekly, and on demand:

- `dotnet list package --vulnerable --include-transitive` across the solution, failing on High or Critical;
- `npm audit --audit-level=high` for `dashboard/` and `sdk/js`;
- `pip-audit` for `sdk/python`;
- `govulncheck` for `sdk/go`;
- Trivy over the server, worker, and dashboard images built from the commit. It looks at HIGH and CRITICAL findings with a fix available.

Results of the same checks run locally on 2026-10-14:

| Check | Result |
|---|---|
| NuGet (all 13 projects, transitive) | No known vulnerabilities |
| npm `sdk/js` | 0 vulnerabilities |
| npm `dashboard` | Before: 9 (2 critical, 4 high, 3 moderate). `npm audit fix`, which changes the lockfile only, fixed `brace-expansion`, `js-yaml`, and `source-map-js` and moved the top-level `vite` to 6.4.3. Remaining: 6 (2 critical, 1 high, 3 moderate), all in the `vitest` 2.x test runner tree (`vitest`, `tinypool`, `vite` 5 under `vite-node`, `esbuild`, `@vitest/mocker`). The fix is `vitest` 5, a major upgrade, so it is open. These are development dependencies and are not in the dashboard image |
| pip-audit `sdk/python` (pip-audit 2.10.1) | No known vulnerabilities |
| govulncheck `sdk/go` (v1.9.0, Go 1.27.2) | No reachable vulnerabilities. One unreachable, Windows-only advisory in `golang.org/x/sys` v0.29.0 (GO-2026-5024, fixed in v0.44.0). With Go 1.24 the scan lists standard library advisories fixed in later Go releases; those depend on the consumer's toolchain, not the module |
| Trivy 0.75.0, server image | Ubuntu 24.04 packages: 0. Application dependencies: 0. .NET runtime 10.0.12: 5 HIGH (CVE-2026-58280, CVE-2026-69651, CVE-2026-96225, CVE-2026-96231, CVE-2026-96233), fixed in 10.0.13. Rebuilding on a refreshed `mcr.microsoft.com/dotnet` base image picks it up |
| Trivy 0.75.0, worker image | Ubuntu 24.04 packages: 0. .NET runtime 10.0.12: the same 5 HIGH as the server, fixed in 10.0.13. Globally installed Node.js packages: 10 HIGH in `brace-expansion`, `ip-address`, `pacote`, `picomatch`, and `sigstore`, mostly inside the npm CLI that ships with Node.js; a newer Node.js or npm in the image clears them |
| Trivy 0.75.0, dashboard image | Alpine 3.24.2: 3 HIGH (libexpat CVE-2026-93990, pcre2 CVE-2026-103111, tiff CVE-2026-4775), fixed in the next Alpine package releases. Rebuilding on a refreshed `nginx:alpine` base picks them up |

None of the image findings are in Garrison's own dependencies. They are in the .NET runtime, Alpine packages, and the Node.js tooling the worker installs, and they clear when the images are rebuilt against current base images and a current npm, which is part of publishing images (not done here). Until the dashboard's `vitest` upgrade and the image rebuilds land, the npm and image jobs in the new workflow will fail.

## Addendum: autonomous agents (AA12.9)

Review date: 2026-11-26, against `feature/autonomous-agents` at `ea45b716` (schema 59). File and line references point at that commit with the fixes below applied. Schema versions 46 to 59 belong to 0.3.0. Version 45 was the last 0.2.0 migration (plan section 7.3).

0.3.0 lets agents act without a person asking. Keepers wake on a schedule. Agents write memory, file reports, message each other, and raise escalations. Executives change the units below them, and candidate deployments run beside production as shadows and canaries. `docs/SECURITY.md` has the threat model for each feature, and this addendum checks that model against the code. For each threat it names the mitigation and the Touchstone case that exercises it. A test reference is `suite/case`, where `<provider>` is `sqlite` or `postgresql`. Every reference was checked against `src/Test.Shared/Suites`. The review found one weakness and fixed it (SR-27), added one missing test (SR-28), and left one item open (SR-29).

### Summary

| ID | Severity | Area | Status |
|---|---|---|---|
| AT-1 | Threat | Prompt injection through memory, reports, messages, and escalation answers | Mitigated; SR-27 fixed |
| AT-2 | Threat | Self-modification: an agent changing its own mandate, authority, or budget | Mitigated |
| AT-3 | Threat | Privilege escalation through drafts and change rules | Mitigated |
| AT-4 | Threat | Loop cost: agents waking, messaging, and spending in a cycle | Mitigated |
| AT-5 | Threat | Shadow and eval leakage: side effects and hidden cases | Mitigated in Garrison's MCP gateway; SR-29 open |
| AT-6 | Threat | Tenant isolation of the 40 new tables | Mitigated; SR-28 test added |
| SR-27 | Medium | Escalation questions and answers were fenced by fixed lines that the text itself could forge | Fixed |
| SR-28 | Low | No data-layer isolation test for mandate revisions, signals, and ticks | Fixed: test added |
| SR-29 | Medium | Shadow and eval restrictions are enforced in the MCP gateway, not on REST routes called with the run's token | Open |

### AT-1: prompt injection through shared state

**Threat:** a worker reads a hostile page and writes it into memory, a report, a message, or an escalation. A keeper, a manager, or an executive reads it later, and the text tells that reader to ignore its instructions (plan risk R2).

**Mitigation:** decision AA-025. Text an agent wrote reaches a prompt only through a built-in template that frames it as data, with provenance, between begin and end lines that carry a random marker made for each render. Text that imitates an end line cannot close the block, and template syntax inside the text is never expanded.

| Channel | Template | Code | Test |
|---|---|---|---|
| Memory recall | `builtin/memory-recall` | `src/Garrison.Core/Memory/MemoryRecallRenderer.cs:38` | `scoped-memory-<provider>/recall-template` |
| A manager's digest of reports | `builtin/report-digest` | `src/Garrison.Core/Reports/ReportDigestRenderer.cs:36` | `reports-unit/digest-template`, `reports-<provider>/digest` |
| Inbox delivery, including escalations sent to an agent | `builtin/inbox-delivery` | `src/Garrison.Core/Messaging/InboxDeliveryRenderer.cs:42` | `messaging-unit/delivery-template`, `messaging-<provider>/escalation` |
| An escalation question to an agent, and answers back to the asker | `builtin/escalation-received`, `builtin/escalation-answered` | `src/Garrison.Server/Runtime/EscalationService.cs:502`, `:680` | `templates/escalation-templates`, `escalations-<provider>/keeper` |
| Judge prompts | `builtin/eval-judge` | `src/Garrison.Core/Evaluation/EvalJudgePrompt.cs` | `eval-unit/scorers` |

Board direction is the one deliberate exception. People with `Organization` permissions write it, and the template frames it as the board's instruction (`board-<provider>/direction`). A keeper's recent tick summaries in `builtin/keeper-tick` are its own notes and are framed as data without a marker.

Framing lowers the risk but cannot remove it, because a model can still follow text it was told to treat as data. Scope rules limit what a successful injection can reach:

- memory scopes follow the agent and its position (`src/Garrison.Server/Runtime/MemoryAccessPolicy.cs`, `scoped-memory-<provider>/policy-matrix`);
- report visibility follows the chain of command (`src/Garrison.Server/Runtime/ReportVisibility.cs`, `reports-<provider>/visibility`);
- messages travel only along app edges and the chart (`src/Garrison.Server/Runtime/MessageLinePolicy.cs`, `messaging-<provider>/lines`, `organizations-<provider>/chain`).

### SR-27 Medium: escalation fences could be forged

**Where:** `src/Garrison.Core/Seed/Prompts/escalation-received.md` and `escalation-answered.md`, rendered by `EscalationService.RenderAnswersAsync` and by the agent-routing path in `src/Garrison.Server/Runtime/EscalationService.cs`.

**What was wrong:** memory, reports, messages, and judge prompts used a random marker. The two escalation templates fenced the question, context, and answer with fixed lines (`--- Answer ---` and `--- End of answer ---`). A raising agent could put `--- End of question ---` in its question, followed by instructions, and the agent asked to answer would see those instructions outside the data block. The same was true of an answer written by an `Agent` target and read by the keeper that asked.

**Exploit class:** prompt injection between agents through the escalation channel.

**Fix:** both renders now set a `boundary` of 8 random bytes in hex, and both templates put it on every begin and end line, the same way the memory, report, and inbox templates do. `docs/PROMPTS.md` documents the new variable. Tenant templates that replace these two should use it.

**Test:** `templates/escalation-templates` now puts forged end lines in the hostile question, context, and answer and checks that the hostile text stays inside the marked block. `escalations-<provider>/keeper` checks that the marked block reaches a keeper tick.

### AT-2: self-modification

**Threat:** an agent rewrites what it is for: its own mandate, its authority, its budget, or anything above it (plan risk R3, decision AA-022).

**Mitigation:**

- Run tokens hold no write permission on `Mandate`, `Freeze`, `Organization`, or `ChangeRule` (`src/Garrison.Server/Services/AuthorizationService.cs:508`, `EvaluateRunAsync`). A keeper cannot publish a revision of its own mandate, lift a freeze, turn off the kill switch, or change the chart it sits in.
- An executive's draft is checked against hard limits that no change rule or approval lifts (`src/Garrison.Core/Organizations/ExecutiveDraftValidator.cs:25-45`): `SelfModification` for its own agent, deployments, mandates, and unit; `OutsideSubtree` for anything above or beside it; `BudgetIncrease`; `AuthorityChange`; and `ForbiddenKind`. The limits are checked at validation, at request-apply, and again just before apply (`src/Garrison.Server/Services/StudioService.cs:854-890`).
- An executive cannot grade its own change. A set that it or its subtree wrote does not count as a gate (`src/Garrison.Core/Evaluation/EvalGatePolicy.cs`).
- Every executive apply publishes an organization revision with a revert draft, so one rollback undoes it.

**Test:**

- `executives-unit/limits`: one refusal each for `OutsideSubtree`, `SelfModification`, `ForbiddenKind`, `BudgetIncrease`, and `AuthorityChange`;
- `executives-<provider>/apply`: a run token's direct mandate publish answers 403, and executive revisions carry source `Executive`;
- `keepers-<provider>/mcp`: keeper tools are visible only to keeper runs, and management tools are refused to other callers;
- `brakes-<provider>/mcp`: freeze tools are hidden from and refused to run tokens;
- `board-<provider>/permissions`: run tokens are refused on board routes and tools;
- `eval-unit/separation` and `eval-<provider>/separation`: self-authored sets do not gate.

### AT-3: privilege escalation through drafts and change rules

**Threat:** an agent widens its own reach by writing a change rule, minting another executive or architect, or applying a draft beyond what the person behind it may do.

**Mitigation:**

- Only people write change rules. Every mutation answers 403 `RulesArePeopleOnly` to a run token (`src/Garrison.Server/Runtime/ChangeRuleService.cs:196`).
- A rule covers a change only when every changed field falls in a class the rule lists, within its limits, inside its unit's subtree. Unclassified fields always wait for a person (`src/Garrison.Core/Organizations/ChangeRuleMatcher.cs`).
- A change to `managementAccess` is refused with `AuthorityChange`, and `OrgSubtree` needs an agent that leads exactly one unit.
- A draft a rule covers applies as the person who started the run, and only when that person holds Create on `Manifest`.
- A change rule can require a passing eval gate. Promotion gates count only approved set versions and runs over their cases.

**Test:**

- `executives-<provider>/rules`: a run token is refused on POST, PUT, and DELETE;
- `executives-unit/matching` and `executives-unit/gate-matching`;
- `executives-<provider>/deployments`: `NotAUnitLead` and `LeadsSeveralUnits`;
- `executives-<provider>/apply`: an uncovered draft waits for a person;
- `studio-<provider>/apply-approval` and `studio-<provider>/grant-mcp`: a draft changes nothing until a person with Create on `Manifest` approves it, and a `Drafts` token acts only for its person;
- `eval-<provider>/gate-bypass` and `eval-<provider>/executive`.

### AT-4: loop cost

**Threat:** agents wake each other, reply to each other, or retry in a cycle and spend without bound.

**Mitigation:**

- Keeper intervals are clamped and back off on quiet ticks (`src/Garrison.Core/Keepers/KeeperIntervalCalculator.cs`). A mandate runs one tick at a time, and the claim is a compare-and-set across replicas.
- Per-tick and per-day keeper budgets move a mandate to `CapReached` and escalate (`src/Garrison.Server/Runtime/KeeperScheduler.cs:369`).
- Messages stop at the hop limit, the thread budget, and the per-line rate (`src/Garrison.Server/Runtime/MessageService.cs:457-467`). `Messaging.UrgentWakesPerHour` caps urgent wakes (`:534`), and mail that arrives during a tick is handled by one following run.
- Unit budgets refuse runs with `BudgetExhausted`. The budget guard freezes a subtree that passes its budget plus the margin and cancels its runs (`src/Garrison.Server/Runtime/OrgBudgetGuard.cs`).
- Freezes and the kill switch stop new runs and keeper wakes in the control plane, and eval runs have their own budget.

**Test:**

- `keeper-unit/intervals`, `keepers-<provider>/single-flight`, and `keepers-<provider>/replicas`;
- `brakes-<provider>/caps`, `brakes-<provider>/keepers`, `brakes-<provider>/auto-freeze`, `brakes-<provider>/margin`, and `brakes-<provider>/cascade`;
- `messaging-<provider>/guards`, `messaging-<provider>/coalesce`, `messaging-<provider>/urgent`, and `messaging-<provider>/replicas`;
- `organizations-<provider>/budgets`;
- `eval-<provider>/budget-cancel`.

Shadow runs are billed like real runs and count toward agent spend and unit budgets. That is intended, and `docs/SECURITY.md` ("Shadow cost") tells operators to start with a small sample.

### AT-5: shadow and eval leakage

**Threat:** a shadow or eval run answers a real input, so anything it does happens for real: an email sent twice, a message to another agent, a memory write, a report. A run of a hidden eval case could also leak the expected answers to the executive under test.

**Mitigation:** decisions AA-027 and AA-074.

- The MCP gateway reads the run again on every call. It leaves effectful, agent, messaging, escalation, report, memory-write, keeper, draft, file, and run-control tools out of the tool list and refuses them with `ShadowRunRefused` or `EvalRunRefused` (`src/Garrison.Server/Runtime/ShadowRunPolicy.cs:105`, `src/Garrison.Server/Protocols/GarrisonMcpServer.cs:410`, `:658`).
- Permission prompts from these runs are denied.
- These runs get no file space write-back and no caller, conversation, trigger, app, mandate, or parent.
- Hidden cases are redacted for every run token, and their case and judge runs are closed to every run token but their own (`src/Garrison.Server/Runtime/HiddenEvalRunPolicy.cs`).
- Shadow and eval runs do not count toward canary decisions or performance rollups.

**Test:**

- `shadow-unit/policy`, `shadow-<provider>/refusals`, and `shadow-<provider>/trial`;
- `eval-<provider>/eval-refusals`;
- `eval-unit/separation` and `eval-<provider>/separation`: hidden cases are redacted;
- `canary-<provider>/promote`: shadow and eval runs do not count;
- `performance-<provider>/rollup`: eval runs are left out.

What remains open is SR-29.

### SR-29 Medium (open): shadow and eval restrictions stop at the MCP gateway

**Where:** `src/Garrison.Server/Services/AuthorizationService.cs:508`. `EvaluateRunAsync` treats the token of a shadow or eval run like any other run token.

**What is wrong:** the MCP gateway refuses effectful tools to a shadow or eval run, but the REST routes its token can reach are not shadow-aware. A run token may read and invoke agents and read, start, and cancel runs. A harness with network access to the control plane could call `POST /v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke` with its own token and start a real run from a shadow, within its agent's delegation policy. Harness built-in tools on harnesses that do not relay permission prompts are a related gap that `docs/SECURITY.md` already documents ("Shadow leakage").

**Why it is open:** closing it needs a run-kind check on every REST route a run token can reach, with a test for each. That is more than a review fix. Until it lands, shadow and evaluate only deployments whose trust level, executor, and egress allowlist keep them away from the control plane's REST port and from anything else with side effects.

**Recommendation:** in `EvaluateRunAsync`, refuse every operation other than Read when the token's run is a `Shadow` run or a restricted `Eval` run, and add a Touchstone case for each route family.

### AT-6: tenant isolation of the new tables

**Threat:** a request or a background sweep reads or changes another tenant's autonomy records.

**Mitigation:**

- All 40 tables created by schema versions 46 to 59 have a `tenantid` column, and every one is in `TableCatalog.AllTables`, so tenant deletion, backup, and retention cover it (`src/Garrison.Core/Database/TableCatalog.cs`).
- Driver reads and writes take the tenant, enumerations refuse a filter without one (for example `src/Garrison.Core/Database/Ado/AdoAgentMessageMethods.cs:110`), and child tables are read only through their tenant-filtered parent.
- Routes take the tenant from the `RequestContext` and answer 404 for another tenant's path (`src/Garrison.Server/Services/AuthorizationService.cs:176-178`).
- The driver methods without a tenant parameter are leader sweeps and scheduler claims that act on identifiers they have already read: `ListDueAsync`, `TryClaimAsync`, `ListExpiredAsync`, `ReleaseStaleClaimsAsync`, `ListRunningAsync`, `ListActiveAsync`, and `PruneAsync`. No request reaches them.

| Schema | Tables | Test |
|---|---|---|
| 46 | `mandates`, `mandate_revisions`, `mandate_revision_signals`, `mandate_ticks` | `keepers-<provider>/data-isolation` (new, SR-28), `keepers-<provider>/crud` |
| 47 | `escalations`, `escalation_options` | `escalations-<provider>/routes` |
| 48 | `freezes` | `brakes-<provider>/freezes` |
| 49 | `memory_entries`, `memory_entry_tags` | `scoped-memory-<provider>/metadata`, `scoped-memory-<provider>/routes`, `scoped-memory/store-contract` (content files) |
| 50 | `reports`, `report_metrics`, `report_issues`, `report_decisions` | `reports-<provider>/data`, `reports-<provider>/routes` |
| 51 | `agent_messages`, `agent_message_artifacts` | `messaging-<provider>/data`, `messaging-<provider>/routes` |
| 52 | `organizations`, `org_units`, `org_unit_members`, `org_unit_peer_lines`, `org_unit_budgets`, `org_revisions`, `org_revision_units`, `org_revision_members`, `org_revision_peer_lines`, `org_revision_budgets`, `org_revision_mandates` | `organizations-<provider>/data`, `organizations-<provider>/routes` |
| 53 | `change_rules`, `change_rule_classes`, `change_rule_limits` | `executives-<provider>/rules` |
| 54 | `eval_sets`, `eval_set_tags`, `eval_cases`, `eval_case_checks`, `eval_case_files`, `eval_runs`, `eval_case_results`, `eval_case_check_results`, `shadow_trials`, `canary_releases`, `canary_release_steps` | `evaluation-<provider>/sets`, `evaluation-<provider>/runs`, `evaluation-<provider>/shadow`, `evaluation-<provider>/canary`, `eval-<provider>/routes`, `shadow-<provider>/routes`, `canary-<provider>/routes` |
| 55 to 59 | No new tables. New columns on `tenant_environments`, `eval_sets`, `change_rules`, `studio_drafts`, `mandate_revisions`, `conversations`, `organizations`, `triggers`, `eval_runs`, and `trigger_fires` | The cases of the tables that own the columns |

### SR-28 Low: mandate child tables had no data-layer isolation test

**Where:** `src/Test.Shared/Suites/KeeperSuite.cs`.

**What was missing:** `keepers-<provider>/crud` checked cross-tenant 404 on the mandate routes, but no test read `mandate_revisions`, `mandate_revision_signals`, or `mandate_ticks` at the driver with another tenant's identifier.

**Fix:** a new case, `keepers-<provider>/data-isolation`. It creates a mandate with a revision, a signal, and a tick in one tenant, and a mandate with the same name in another. It checks that the other tenant cannot read, list, wake, delete, publish, or report them, and that each tenant's name lookup stays inside it. It passes on Sqlite and PostgreSQL.
