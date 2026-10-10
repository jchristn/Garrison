# Security

Garrison runs code-writing agents on your infrastructure with your credentials, on behalf of whoever can reach its API. This page describes how it decides who may do what, how it keeps tenants and secrets apart, what the harness sandbox does and does not protect against, and what to change before you expose it.

## Before you expose Garrison

Every one of these defaults is public, so change them all:

| Setting | Default | Change it to |
|---|---|---|
| `Auth.AdminApiKey` (`GARRISON_ADMIN_API_KEY`) | `garrisonadmin` | A long random value, kept out of day-to-day use |
| `Auth.SigningKey` (`GARRISON_AUTH_SIGNING_KEY`) | placeholder | A random value; it protects every session token |
| `Security.MasterKey` (`GARRISON_MASTER_KEY`) | placeholder | Base64 of 32 random bytes; back it up, because losing it makes every secret unreadable |
| `Security.AdminPassword` | `garrison` | A strong password, before first start (it only seeds) |
| `Security.DefaultAccessKey` / `DefaultSecretKey` | `access_garrison_default` / `secret_garrison_default_change_me` | Random values before first start, or rotate the credential afterwards |
| `Security.NodeAccessKey` / `NodeSecretKey` | `access_garrison_node` / `secret_garrison_node_change_me` | Random values, set identically on the server and every worker |

`k8s/scripts/generate-secrets.sh` generates all of these for Kubernetes. Terminate TLS at the ingress (or set `Rest.Ssl`); credentials and tokens otherwise cross the network in the clear.

## Identities

| Principal | How it authenticates | Notes |
|---|---|---|
| User | Email and password, exchanged for a session token | Belongs to one tenant. May be a tenant administrator or a system administrator |
| Credential | Access key and secret key, sent directly, used to sign requests, or exchanged for a token | Owned by a user. Never has more permission than its owner |
| Administrator | `x-api-key` | No tenant and no user. Bypasses every check. Meant for bootstrapping and platform operations |
| Run | A run token issued by Garrison | Exists for one run, for agent-to-agent delegation |
| Node | A credential with the `NodeAgent` role | Can only use the node protocol |

`REST_API.md` documents the headers for each scheme and the signed-request canonical string.

### Tokens and sessions

Session tokens are opaque. Each one is AES-256-CBC encrypted with a random IV and authenticated with HMAC-SHA256, with both keys derived from `Auth.SigningKey`, and each points at a session row in the database. That row is what makes revocation immediate: `DELETE /v1.0/token`, disabling the user, credential, or tenant, or rotating a credential stops tokens on every replica at once. Tokens expire after `Auth.TokenLifetimeMinutes` (480 by default).

Run tokens are sessions too. They are issued when a run is leased (only for agents that may delegate), expire at the run's deadline, and are revoked when the run finishes, times out, or loses its lease. They are scrubbed from the harness's output.

### Signed requests and replay

A signed request carries an HMAC-SHA256 signature over the method, path, query, tenant, date, nonce, and body hash, so the secret key never crosses the wire. The date must be within `Auth.SignedRequestSkewSeconds` (300) of the server clock, and nonces are remembered for the replay window. The nonce cache is per replica in this release, so with several control-plane replicas a captured request could be replayed once against each other replica within the window. Use TLS regardless.

### Stored secrets

| What | How it is stored |
|---|---|
| Garrison secrets (API keys and the like) | AES-256-GCM under `Security.MasterKey`, with the secret's identifier as associated data so a ciphertext cannot be moved to another record. Only the last four characters and a fingerprint are ever returned |
| Credential secret keys | AES-256-GCM under the master key; they must be recoverable to verify signed requests. Returned once, at creation or rotation |
| User passwords | SHA-256, compared in constant time |

Passwords are hashed without a salt or work factor in this release, following the shared authentication model this project family uses. Treat the database as sensitive and prefer credentials or an identity provider in front of Garrison for anything beyond a trusted team.

Secret values never appear in API responses, manifest exports, logs, the compile preview, or the template preview. They exist in plaintext only inside the execution spec sent to the worker that leased the run, and in the harness process's environment or files.

### Rate limiting

Token issuance is limited per source address (`Auth.RateLimitPerMinute`, 60), answering 429 `RateLimited` beyond it. Other routes are not rate limited.

## Authorization

Every route and MCP tool is registered together with its authorization rule in an operation scope map: anonymous (health, token issuance, A2A cards), any authenticated caller with checks made inside the handler (self-service routes, A2A JSON-RPC), or a resource type and operation. Each route's rule is listed in `REST_API.md`.

**Resource types:** `Tenant`, `Admin`, `User`, `Credential`, `Session`, `Role`, `Permission`, `Assignment`, `Audit`, `RequestHistory`, `Settings`, `HarnessProfile`, `PromptTemplate`, `Agent`, `Deployment`, `McpServer`, `Secret`, `Workspace`, `ArtifactStore`, `Run`, `Node`, `NodePool`, `Manifest`, plus `All`.

**Operations:** `Create`, `Read`, `Write`, `Update`, `Delete`, `Execute`, `Admin`, plus `All`.

A permission lists resource types and operations and is either `Permit` or `Deny`. Roles group permissions. Users and credentials receive roles through assignments, scoped either to the whole tenant or to one resource (`resourceScope: Resource` with a `resourceId`).

The decision for a request is made in this order:

1. The administrator API key and system administrators (`isAdmin`) are allowed.
2. A tenant in the path that is not the caller's tenant is reported as not found.
3. Platform resources (`Settings`, `NodePool`, `Admin`, creating or deleting tenants, and changing nodes) need a system administrator.
4. Run tokens are limited to reading and invoking agents and to reading, starting, and cancelling runs, and are then checked against the permissions of the user or credential that started the chain.
5. Tenant administrators (`isTenantAdmin`) are allowed within their tenant. A credential owned by a tenant administrator is still limited by its own assignments when it has any.
6. Everyone else: the grants from all their assignments are expanded. An explicit `Deny` wins, then any `Permit`, otherwise the request is denied. For a credential, its owner's grants are checked as well, so a credential can never do what its owner cannot.

Denials are audited with the permission that was missing, and the response carries it (`requiredPermission`, `resourceType`), so a 403 tells you exactly what to grant. `GET .../users/{id}/permissions` and `GET .../credentials/{id}/permissions` show the effective permissions of a principal.

### Built-in roles

| Role | Grants |
|---|---|
| `TenantAdmin` | Everything in the tenant |
| `SecurityAdmin` | Users, credentials, roles, permissions, assignments, sessions, and audit |
| `Auditor` | Read access to security records and audit |
| `ResourceAdmin` | Everything on one resource; assign it with resource scope |
| `Editor` | Read and write domain resources, without administration |
| `Viewer` | Read domain resources |
| `TenantMember` | Read agents and one's own profile |
| `AgentDeveloper` | Author harness profiles, prompts, agents, deployments, MCP servers, and workspaces; invoke agents |
| `AgentOperator` | Operate runs and observe nodes |
| `AgentInvoker` | Invoke agents and read runs; meant for integration credentials |
| `SecretManager` | Manage secrets |
| `NodeAgent` | The node protocol only; for worker credentials |
| `AgentRegistrar` | Self-registration of remote agents |
| `Custom` | No permissions; a starting point for tenant-defined roles |

Built-in roles and permissions cannot be changed. Create custom roles and map permissions to them with `POST .../role-permissions`.

## Tenant isolation

Every tenant-owned table carries a tenant identifier, and every query for a tenant-owned record filters on the tenant taken from the authenticated principal, not from the request body. Asking for another tenant's resource answers 404, the same as a resource that does not exist. Built-in harness profiles, prompt templates, roles, and permissions are shared read-only records with no tenant.

Workers are shared by default. To keep a tenant's runs on its own workers, create a node pool dedicated to that tenant (`tenants` on the pool) and start those workers in the pool; the scheduler will not lease that tenant's runs elsewhere if its deployments require the pool, and will not lease other tenants' runs to the pool.

## Harness isolation

This is the most important limit to understand. In this release, each run is a subprocess of the worker, inside the worker's container, with:

- its own working directory, `HOME`, and configuration directory, deleted after the run (the workspace may be kept for debugging);
- an environment that starts empty apart from an allowlist (`PATH`, locale, proxy and certificate settings), plus the variables the profile and deployment define;
- a deadline, an output size limit, and a process-tree kill on cancellation;
- relative paths for every file it writes, with absolute paths and `..` rejected;
- secret values scrubbed from everything it prints before it leaves the node.

It does **not** have its own filesystem namespace, network namespace, or user. A harness running with permissions such as Claude Code's `acceptEdits`, Codex's `workspace-write`, or Gemini's `yolo` can read anything the worker user can read, including other concurrent runs' directories, and can reach anything the worker pod can reach. Treat everyone who can configure deployments on a shared worker as able to see the others' runs.

Ways to reduce the exposure today:

- Run one concurrent run per worker (`MaxConcurrentRuns: 1`) for sensitive tenants, and give those tenants dedicated node pools.
- Use the harnesses' own sandboxes (`sandbox` parameter for Codex and Mux, `permissionMode` and `allowedTools` for Claude Code) as tightly as the work allows.
- Apply the Kubernetes network policies in `k8s/` and add egress rules for the endpoints your agents actually need.
- Keep the worker image minimal; it runs as UID 10001 with all capabilities dropped and privilege escalation disabled.

A pod-per-run executor, which gives each run its own container, is planned and tracked in `GARRISON_PLAN.md`.

## Delegation

An agent can only delegate when its `delegationMode` is not `None`. The run token it gets:

- lists and invokes only the agents on its allowlist (or any agent, with mode `Any`);
- cannot invoke itself or an agent already in the chain unless recursion is allowed;
- cannot go deeper than the agent's `delegationMaxDepth` or the cluster's `Runs.MaxDelegationDepth`;
- sees only runs in its own delegation tree;
- carries the permissions of the human or credential that started the chain as a ceiling, so delegation never escalates.

Violations fail the invocation with `DelegationDisabled`, `DelegationNotAllowed`, `DelegationCycle`, or `DelegationDepthExceeded`.

## Prompts and untrusted input

Callers' messages, parameters, and other agents' replies are inserted into prompts as text. Garrison does not and cannot stop a harness from following instructions embedded in that text. Limit what an agent can do (tools, MCP servers, secrets, sandbox, delegation allowlist) to what its job needs, and expose agents that hold powerful credentials only to callers you trust. Run parameters can only set values a deployment explicitly allows, each with a validation rule, so callers cannot inject arbitrary command-line flags.

## Audit

Garrison records authentication successes and failures, sessions issued and revoked, credential creation, rotation, and use, authorization denials and administrator bypasses, changes to roles, permissions, assignments, configuration, secrets, and settings, restarts, manifest applies, node registration and status changes, and run cancellations. Read them at `GET .../audit` with the `Audit` permission. They are kept for `Audit.RetentionDays` (365).

## Reporting a vulnerability

Please report security problems privately through GitHub's security advisory feature on https://github.com/jchristn/Garrison rather than in a public issue.
