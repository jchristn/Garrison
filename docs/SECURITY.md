# Security

Garrison runs code-writing agents on your infrastructure with your credentials, on behalf of whoever can reach its API. This page describes how it decides who may do what, how it keeps tenants and secrets apart, what the harness sandbox does and does not protect against, and what to change before you expose it.

## Before you expose Garrison

Every one of these defaults is public, so change them all:

| Setting | Default | Change it to |
|---|---|---|
| `Auth.AdminApiKey` (`GARRISON_ADMIN_API_KEY`) | `garrisonadmin` | A long random value, kept out of day-to-day use |
| `Auth.SigningKey` (`GARRISON_AUTH_SIGNING_KEY`) | placeholder | A random value; it protects every session token |
| `Security.MasterKey` (`GARRISON_MASTER_KEY`) | placeholder | Base64 of 32 random bytes; back it up, because losing it makes every secret unreadable |
| `Security.AdminPassword` | `password` | A strong password, before first start (it only seeds) |
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

Each run token is also fenced by the lease epoch it was minted for (the epoch increases every time a worker claims the run). Garrison accepts a run token only while its run is Leased, Running, or Cancelling at that same epoch. When a lease expires and the run is requeued, the reaper revokes every token minted for the expired attempt, and the next claim mints a new one for the new epoch. A harness that kept running on a partitioned worker after its lease expired therefore cannot delegate, read runs, or open an MCP session with its old token, and the check does not depend on the revocation having happened: a token for an older epoch is refused on its own.

### Signed requests and replay

A signed request carries an HMAC-SHA256 signature over the method, path, query, tenant, date, nonce, and body hash, so the secret key never crosses the wire. The date must be within `Auth.SignedRequestSkewSeconds` (300) of the server clock, and nonces are remembered for the replay window. Nonces are stored in the database until twice the skew has passed, so a captured request is refused as a replay by every control-plane replica, not only the one that first accepted it. Use TLS regardless.

### Stored secrets

| What | How it is stored |
|---|---|
| Garrison secrets (API keys and the like) | AES-256-GCM under `Security.MasterKey`, with the secret's identifier as associated data so a ciphertext cannot be moved to another record. Only the last four characters and a fingerprint are ever returned |
| Credential secret keys | AES-256-GCM under the master key; they must be recoverable to verify signed requests. Returned once, at creation or rotation |
| User passwords | PBKDF2-HMAC-SHA256, random 16-byte salt, 600,000 iterations (`Auth.PasswordHashIterations`), constant-time comparison; legacy SHA-256 hashes are upgraded at the next successful sign-in |

Passwords are stored as `pbkdf2-sha256$<iterations>$<salt>$<hash>`. Hashes written by earlier builds still verify and are replaced on the next successful sign-in. Signing in to an unknown or inactive account takes as long as a real verification, so timing does not reveal which accounts exist. Rolling the database back to an earlier build would leave upgraded users unable to sign in until their passwords are reset.

Secret values never appear in API responses, manifest exports, logs, the compile preview, or the template preview. They exist in plaintext only inside the execution spec sent to the worker that leased the run, and in the harness process's environment or files.

### Codex logins

A `CodexAuthJson` secret holds a ChatGPT login, including a long-lived refresh token. Garrison keeps that refresh token on the control plane (G-22):

- Only the control plane refreshes the login, against `Codex.TokenEndpoint` (default `https://auth.openai.com/oauth/token`), and it writes the rotated tokens back encrypted under the master key, like any secret value. Refreshes are serialized across replicas by a database lease, and the write-back is a compare-and-swap on the stored ciphertext.
- Runs receive a copy of `auth.json` with the refresh token removed, plus `CODEX_REFRESH_TOKEN_URL_OVERRIDE` pointing at a closed loopback port. A run, or anything running inside it, can use the current access token until it expires but cannot read, use up, or rotate the refresh token, and nothing a run does is persisted.
- The access, refresh, and ID tokens are each added to the run's scrub list, so they are replaced in events, results, and the stderr tail.
- Token values are never logged and never appear in API responses. Refresh failures are recorded on the secret (`status`, `statusMessage`, `statusUtc`) with the provider's error code and description only.
- A login the provider rejects for good is marked `NeedsReauthentication` and is not presented again until an operator replaces the value.

Treat a login stored in Garrison as belonging to Garrison. The same login used on another machine shares the refresh token, and whichever copy refreshes second is rejected with `refresh_token_reused`. For shared deployments, prefer an `OpenAiApiKey` secret.

### Rate limiting

Token issuance is limited per source address (`Auth.RateLimitPerMinute`, 60), answering 429 `RateLimited` beyond it. The counter lives in the database, so the limit holds across all control-plane replicas. Behind a proxy or load balancer the source address is the address the server sees, so all clients behind one proxy share a budget. Other routes are not rate limited.

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
| `AgentOperator` | Operate runs and conversations (read, cancel, retry, delete), decide permission approvals, and observe nodes |
| `AgentInvoker` | Invoke agents and read runs and conversations; meant for integration credentials |
| `SecretManager` | Manage secrets |
| `NodeAgent` | The node protocol only; for worker credentials |
| `AgentRegistrar` | Self-registration of remote agents |
| `Custom` | No permissions; a starting point for tenant-defined roles |

Permission approvals (resource type `Approval`): `Viewer`, `Auditor`, `AgentDeveloper`, and `AgentOperator` can read them; `Editor`, `AgentOperator`, `ResourceAdmin`, and `TenantAdmin` can decide them (Update on `Approval`). Deciding with `remember`, which adds a rule to the deployment, also needs Update on that deployment.

Built-in roles and permissions cannot be changed. Create custom roles and map permissions to them with `POST .../role-permissions`.

## Tenant isolation

Every tenant-owned table carries a tenant identifier, and every query for a tenant-owned record filters on the tenant taken from the authenticated principal, not from the request body. Asking for another tenant's resource answers 404, the same as a resource that does not exist. Built-in harness profiles, prompt templates, roles, and permissions are shared read-only records with no tenant.

Workers are shared by default. To keep a tenant's runs on its own workers, create a node pool dedicated to that tenant (`tenants` on the pool) and start those workers in the pool; the scheduler will not lease that tenant's runs elsewhere if its deployments require the pool, and will not lease other tenants' runs to the pool.

## Harness isolation

This is the most important limit to understand. Garrison has two executors, chosen per deployment (`executor`) or per node pool (`defaultExecutor`), and they protect against different things.

### Process executor (trusted only, default)

Process execution is for trusted workloads only. The worker image stays non-root (UID 10001); all Process harnesses use that same user. Unix run roots and their `work`, `home`, and `config` directories are created with mode `0700`, and existing directories are tightened on reuse, including conversation turns. These permissions exclude other OS users; they do not isolate concurrent harnesses sharing the worker user. Windows inherits the worker account's directory ACLs. Use `KubernetesJob` for untrusted inputs. The dashboard displays the same warning in deployment forms and Process run details.

Each run is a subprocess of the worker, inside the worker's container, with:

- its own working directory, `HOME`, and configuration directory, deleted after the run (the workspace may be kept for debugging);
- for a conversation turn, the conversation's working, `HOME`, and configuration directories instead, which stay on the worker between turns (so the next turn can resume the harness session) until they go unused for the worker's `ConversationRetentionHours`. Files the profile writes there, such as a Codex `auth.json` or an MCP configuration with a run token, are rewritten every turn and the run token is revoked when its run ends, but they sit on the worker's disk between turns;
- an environment that starts empty apart from an allowlist (`PATH`, locale, proxy and certificate settings), plus the variables the profile and deployment define;
- a deadline, an output size limit, run guards, and a process-tree kill on cancellation;
- relative paths for every file it writes, with absolute paths and `..` rejected;
- secret values scrubbed from everything it prints before it leaves the node.

It does **not** have its own filesystem namespace, network namespace, or user. A harness running with permissions such as Claude Code's `acceptEdits`, Codex's `workspace-write`, or Gemini's `yolo` can read anything the worker user can read, including other concurrent runs' directories and the worker's node credential, and can reach anything the worker pod can reach. Treat everyone who can configure deployments on a shared worker as able to see the others' runs. In Kubernetes the worker's service account token is mounted (it creates run Jobs), so a harness on a Process worker can also use the worker's Role.

### KubernetesJob executor (pod per run)

Each run gets its own Job and pod (`docs/KUBERNETES.md`, "Pod-per-run executor"). The worker keeps every credential; the pod gets only the compiled spec for its own run through a Secret. The pod:

- has its own filesystem: the work, home, config, and `/tmp` directories are emptyDir volumes that exist only for this run, so a run cannot see another run's files or the worker's;
- has no Kubernetes credentials: `automountServiceAccountToken: false` and the `garrison-run` service account, which has no RoleBindings;
- has no Garrison credentials besides the run token in its MCP configuration (needed for delegation, limited to its delegation tree, and revoked when the run ends) and the secrets its own deployment binds;
- runs as UID 10001 with `runAsNonRoot`, a read-only root filesystem, every capability dropped, `allowPrivilegeEscalation: false`, the `RuntimeDefault` seccomp profile, and no service environment variables (`enableServiceLinks: false`);
- is limited by the deployment's CPU, memory, and ephemeral storage requests and limits, so a runaway harness is OOMKilled or evicted instead of starving the node's other runs;
- accepts no inbound traffic and may only resolve DNS, reach the Garrison MCP port, and make HTTPS connections (the `garrison-run` NetworkPolicy; adjust it to your harnesses' endpoints). Policies need a network plugin that enforces them; K3S's default one does;
- can optionally run under gVisor or Kata Containers (`runtimeClassName`) for a kernel boundary as well.

The worker trusts nothing the pod prints except lines that start with the run's random nonce, which only the worker and the pod's spec Secret know. JSON encoding keeps harness text on one line, and `run-one` marks itself non-dumpable so the harness, which runs as the same user with no capabilities, cannot open `run-one`'s stdout through `/proc`. A harness that reads its own spec file learns its own nonce and could, at worst, misreport its own run; it cannot affect other runs or the control plane.

What it does not protect against: run pods still share the node's kernel unless you use a sandboxed runtime; the default egress rule allows HTTPS to anywhere, which a prompt-injected harness can use to send out what it can read (its workspace, its own secrets); and the worker's Role can create pods in the run namespace, which can mount that namespace's Secrets, so a compromised worker in the same namespace as `garrison-secrets` could read them.

### Recommendations for untrusted prompts

- Use `executor: KubernetesJob` for every deployment that handles prompts, documents, or repositories you do not control.
- Put run pods in their own namespace (`kubernetesExecutor.runNamespace`) with the `restricted` Pod Security level, away from `garrison-secrets`.
- Narrow `runEgress` from 443-anywhere to the model APIs and git hosts the harness needs.
- Set `podResources` limits so one run cannot exhaust a node, and use a sandboxed `runtimeClassName` where the nodes support it.
- Bind only the secrets and MCP servers the agent needs, keep delegation off or on a tight allowlist, and use the harnesses' own sandboxes (`sandbox` for Codex and Mux, `permissionMode` and `allowedTools` for Claude Code) as tightly as the work allows.
- A worker with the KubernetesJob executor enabled mounts its service account token, which Process runs on that worker can read. Where Process deployments also take untrusted input, give them a separate worker pool with `GARRISON_WORKER_KUBERNETES_ENABLED=false` and `automountServiceAccountToken: false`, and keep the Job-capable pool for KubernetesJob deployments (pin them with a node pool or `nodeSelector`).
- For Process deployments that must stay, run one concurrent run per worker (`MaxConcurrentRuns: 1`) and give sensitive tenants dedicated node pools.

## Delegation

An agent can only delegate when its `delegationMode` is not `None`. The run token it gets:

- lists and invokes only the agents on its allowlist (or any agent, with mode `Any`);
- cannot invoke itself or an agent already in the chain unless recursion is allowed;
- cannot go deeper than the agent's `delegationMaxDepth` or the cluster's `Runs.MaxDelegationDepth`;
- sees only runs in its own delegation tree;
- always acts in its run's tenant: the MCP tool schemas it is shown have no `tenantId` argument (only system administrators see one), and a `tenantId` it sends anyway is ignored;
- carries the permissions of the human or credential that started the chain as a ceiling, so delegation never escalates;
- works only for the attempt it was minted for: after a requeue it is revoked, and a token for an older lease epoch is refused even if it was not (see "Tokens and sessions" above).

Violations fail the invocation with `DelegationDisabled`, `DelegationNotAllowed`, `DelegationCycle`, or `DelegationDepthExceeded`. A waiting delegation can also fail with `DelegationCapacityExhausted` when waiting could leave no capacity to run the child; that is a capacity limit, not a policy decision (see `docs/SCALING.md`, "Delegation capacity"), and it bounds how many idle waiting processes one agent tree can pin on a worker.

## Permission approvals

Approvals (P12.3) put a person, or rules a person wrote, between a Claude Code or Codex app-server run and the tools it wants to use. What they do and do not guarantee:

- A run can ask, never decide. `garrison_permission_prompt` takes the run from the run token, so a run can only ask about itself, and run tokens are refused by the approval list, read, and decide tools and routes. Every decision a person makes is audited (`ApprovalDecided`); rule decisions are recorded as approvals with source `Rule` or `Default`.
- Rules follow D-025: Deny beats Ask and Ask beats Allow, an Allow rule for `Bash` must cover every command of a compound line, and a line with command or process substitution is never allowed by a rule. A bare `Bash` (or `Bash(*)`, `Bash(:*)`) Allow rule allows every command; prefer narrow prefixes. Interpreters (`python -c`, `node -e`), `find -exec`, `xargs`, and variable expansion are not inspected, so `Bash(python:*)` is as broad as `Bash`.
- Rules are not a sandbox. Tools the deployment pre-allows through the `allowedTools` parameter, and read-only tools in Claude Code's `default` permission mode, never reach the rules; keep the harness sandbox and `allowedTools` tight.
- Previews redact the values of the deployment's bound secrets and common credential shapes (bearer tokens, `sk-` and GitHub tokens, AWS key IDs, private keys, `password=`-style assignments) and keep at most 4,000 characters. The full tool input is never stored; the harness gets its own input back on allow.
- A request that cannot be decided in time is denied by default (`approvalTimeoutDecision`). Cancelling a run, its completion, or a lost lease cancels its pending approvals and the waiting harness is told no. Decisions are compare-and-set in the database, so two people deciding at once on different replicas produce one decision; the second gets 409 `ApprovalNotPending`.
- The Codex relay uses the run token, so a worker that lost its lease cannot ask on behalf of a newer attempt.

## Prompts and untrusted input

Callers' messages, parameters, and other agents' replies are inserted into prompts as text. Garrison does not and cannot stop a harness from following instructions embedded in that text. Limit what an agent can do (tools, MCP servers, secrets, sandbox, delegation allowlist) to what its job needs, and expose agents that hold powerful credentials only to callers you trust. Run parameters can only set values a deployment explicitly allows, each with a validation rule, so callers cannot inject arbitrary command-line flags.

## Audit

Garrison records authentication successes and failures, sessions issued and revoked, credential creation, rotation, and use, authorization denials and administrator bypasses, changes to roles, permissions, assignments, configuration, secrets, and settings, restarts, manifest applies, node registration and status changes, run cancellations, and permission approval decisions. Read them at `GET .../audit` with the `Audit` permission. They are kept for `Audit.RetentionDays` (365).

## Reporting a vulnerability

Please report security problems privately through GitHub's security advisory feature on https://github.com/jchristn/Garrison rather than in a public issue.
