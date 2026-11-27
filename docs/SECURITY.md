# Security

Garrison runs code-writing agents on your infrastructure with your credentials, on behalf of whoever can reach its API. This page describes how it decides who may do what, how it keeps tenants and secrets apart, what the harness sandbox does and does not protect against, and what to change before you expose it.

## Before you expose Garrison

Every one of these defaults is public, so change them all:

| Setting | Default | Change it to |
|---|---|---|
| `Auth.AdminApiKey` (`GARRISON_ADMIN_API_KEY`) | `garrisonadmin` | A long random value, kept out of day-to-day use |
| `Auth.SigningKey` (`GARRISON_AUTH_SIGNING_KEY`) | placeholder | A random value; it protects every session token |
| `Security.MasterKey` (`GARRISON_MASTER_KEY`) | placeholder | Base64 of 32 random bytes; back it up, because losing it makes every secret unreadable |
| `Security.AdminPassword` | `password` | Allowed, so a new install signs in as `admin@garrison` / `password`. Change it after the first sign-in, or set a strong one before first start (it only seeds). Only an empty value is refused |
| `Security.DefaultAccessKey` / `DefaultSecretKey` | `access_garrison_default` / `secret_garrison_default_change_me` | Random values before first start, or rotate the credential afterwards |
| `Security.NodeAccessKey` / `NodeSecretKey` | `access_garrison_node` / `secret_garrison_node_change_me` | Random values, set identically on the server and every worker |

`k8s/scripts/generate-secrets.sh` generates all of these for Kubernetes except the administrator password, which is `GARRISON_ADMIN_PASSWORD` when set and otherwise `password`. For Docker Compose, `docker/update.sh` and `docker/factory/reset.sh` generate any that are missing into `docker/.env` (again with `password` for the administrator), and `compose.yaml` has no defaults for them. Terminate TLS at the ingress (or set `Rest.Ssl`); credentials and tokens otherwise cross the network in the clear.

## Identities

| Principal | How it authenticates | Notes |
|---|---|---|
| User | Email and password, exchanged for a session token | Belongs to one tenant. May be a tenant administrator or a system administrator |
| Credential | Access key and secret key, sent directly, used to sign requests, or exchanged for a token | Owned by a user. Never has more permission than its owner |
| Administrator | `x-api-key` | No tenant and no user. Bypasses every check. Meant for bootstrapping and platform operations |
| Run | A run token issued by Garrison | Exists for one run; every run gets one for Garrison's MCP tools (escalations, and delegation, approvals, keeper ticks, memory, and drafts where enabled) |
| Node | A credential with the `NodeAgent` role | Can only use the node protocol. Only a role that names `Node` explicitly, or a system administrator, may use the node protocol; tenant administrators and `All` grants do not count, because a node receives every tenant's runs and their secrets |

`REST_API.md` documents the headers for each scheme and the signed-request canonical string.

### Tokens and sessions

Session tokens are opaque. Each one is AES-256-CBC encrypted with a random IV and authenticated with HMAC-SHA256, with both keys derived from `Auth.SigningKey`, and each points at a session row in the database. That row is what makes revocation immediate: `DELETE /v1.0/token`, disabling the user, credential, or tenant, or rotating a credential stops tokens on every replica at once. Tokens expire after `Auth.TokenLifetimeMinutes` (480 by default).

Each replica caches the user and credential sessions, tenants, users, and credentials it reads to authenticate requests for `Auth.CacheSeconds` (5 by default, 0 turns the cache off). The cache never weakens revocation done through the API: logging out drops the session from every replica's cache, and any change to tenants, users, credentials, roles, permissions, or assignments clears every replica's cache, both through the backplane within milliseconds. `Auth.CacheSeconds` bounds only a change made outside the API, such as a direct database edit, or a replica that missed a backplane message (a replica that reconnects to the backplane clears its cache). Run tokens and failed lookups are never cached.

Changing a user's password revokes every other session of that user at once; a user who changes their own password keeps the session they did it from. `POST /v1.0/token/refresh` issues a new session and revokes the one it was called with, so a token can be renewed but never multiplied (SR-17).

Artifact download tickets use their own keys, derived from both `Auth.SigningKey` and `Security.MasterKey` under an artifact label, so a session token never works as a ticket and forging one needs both secrets (SR-12).

Run tokens are sessions too. They are issued when a run is leased (only for agents that may delegate), expire at the run's deadline, and are revoked when the run finishes, times out, or loses its lease. They are scrubbed from the harness's output.

Each run token is also fenced by the lease epoch it was minted for (the epoch increases every time a worker claims the run). Garrison accepts a run token only while its run is Leased, Running, or Cancelling at that same epoch. When a lease expires and the run is requeued, the reaper revokes every token minted for the expired attempt, and the next claim mints a new one for the new epoch. A harness that kept running on a partitioned worker after its lease expired therefore cannot delegate, read runs, or open an MCP session with its old token, and the check does not depend on the revocation having happened: a token for an older epoch is refused on its own. Only a run that never started, or one admitted under the `AtLeastOnce` effect policy, is requeued after its lease expires; under the default `AtMostOnce` a started run ends `NodeLost` instead, so its effects are never repeated by Garrison (see "Effect policy" in `REST_API.md`).

### Signed requests and replay

A signed request carries an HMAC-SHA256 signature over the method, path, query, tenant, date, nonce, and body hash, so the secret key never crosses the wire. The date must be within `Auth.SignedRequestSkewSeconds` (300) of the server clock, and nonces are remembered for the replay window. Nonces are stored in the database until twice the skew has passed, so a captured request is refused as a replay by every control-plane replica, not only the one that first accepted it. Use TLS regardless.

### Stored secrets

| What | How it is stored |
|---|---|
| Garrison secrets (API keys and the like) | AES-256-GCM under `Security.MasterKey`, with the secret's identifier as associated data so a ciphertext cannot be moved to another record. Only the last four characters (empty for values shorter than 12 characters) and a fingerprint are ever returned. The fingerprint is HMAC-SHA256 under a key derived from the master key, so it cannot be used to confirm a guessed value without that key (SR-18) |
| Credential secret keys | AES-256-GCM under the master key; they must be recoverable to verify signed requests. Returned once, at creation or rotation |
| Trigger and notification endpoint signing secrets | AES-256-GCM under the master key with the record's identifier as associated data; they must be recoverable to verify webhooks and sign notifications. Returned once, at creation or rotation, with only the last four characters shown afterwards |
| User passwords | PBKDF2-HMAC-SHA256, random 16-byte salt, 600,000 iterations (`Auth.PasswordHashIterations`), constant-time comparison; legacy SHA-256 hashes are upgraded at the next successful sign-in |

Every encrypted value records the master key version it was written with (`Security.MasterKeyVersion`), and a value written under another version is refused with a clear error instead of failing as a bad tag. Use base64 of 32 random bytes for the master key and at least 32 random characters for the signing key; anything else is hashed with SHA-256 without stretching, and the server logs a warning for it at startup (SR-19).

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

Token issuance is limited per source address (`Auth.RateLimitPerMinute`, 60), answering 429 `RateLimited` beyond it. Failed administrator API key, secret key, and signature attempts count against the same per-minute limit, separately from token issuance; once an address passes it, requests from that address that present `x-api-key` or `x-access-key` get 429 `RateLimited` for the rest of the minute, even with the right key. Successful requests are never counted. The counters live in the database, so the limits hold across all control-plane replicas. Behind a proxy or load balancer the source address is the address the server sees, so all clients behind one proxy share a budget. Other routes are not rate limited.

## Authorization

Every route and MCP tool is registered together with its authorization rule in an operation scope map: anonymous (health, token issuance, A2A cards), any authenticated caller with checks made inside the handler (self-service routes, A2A JSON-RPC, and the live-updates WebSocket `/v1.0/ws`, which authorizes each subscription and allows at most 64 per connection), or a resource type and operation. Each route's rule is listed in `REST_API.md`.

**Resource types:** `Tenant`, `Admin`, `User`, `Credential`, `Session`, `Role`, `Permission`, `Assignment`, `Audit`, `RequestHistory`, `Settings`, `HarnessProfile`, `PromptTemplate`, `Agent`, `Deployment`, `McpServer`, `Secret`, `Workspace`, `ArtifactStore`, `Run`, `Node`, `NodePool`, `Manifest`, `Conversation`, `Approval`, `Artifact`, `ModelPrice`, `UsageQuota`, `Pipeline`, `PipelineRun`, `Trigger`, `NotificationEndpoint`, `AgentRevision`, `Promotion`, `AgentAsset`, `ConversationFileSpace`, `Capability`, `FanOutGroup`, `AgenticApp`, `StudioDraft`, plus `All`.

**Operations:** `Create`, `Read`, `Write`, `Update`, `Delete`, `Execute`, `Admin`, plus `All`.

A permission lists resource types and operations and is either `Permit` or `Deny`. Roles group permissions. Users and credentials receive roles through assignments, scoped either to the whole tenant or to one resource (`resourceScope: Resource` with a `resourceId`).

The decision for a request is made in this order:

1. The administrator API key and system administrators (`isAdmin`) are allowed.
2. A tenant in the path that is not the caller's tenant is reported as not found.
3. Platform resources (`Settings`, `NodePool`, `Admin`, creating or deleting tenants, and changing nodes) need a system administrator.
4. Run tokens are limited to reading and invoking agents and to reading, starting, and cancelling runs (plus studio drafts for deployments with `managementAccess: Drafts` or `OrgSubtree`, see "Delegated management" and "Executive authority"), and are then checked against the permissions of the user or credential that started the chain. A run token cannot retry a run (403 `RunTokenRetryNotAllowed`), because a retry would start a top-level run outside the delegation policy.
5. The node protocol (`Node` `Execute`) needs a grant that names `Node` explicitly, such as the `NodeAgent` role. The tenant administrator bypass and `All` grants are not enough.
6. Tenant administrators (`isTenantAdmin`) are allowed within their tenant. A credential owned by a tenant administrator is still limited by its own assignments when it has any.
7. Everyone else: the grants from all their assignments are expanded. An explicit `Deny` wins, then any `Permit`, otherwise the request is denied. For a credential, its owner's grants are checked as well, so a credential can never do what its owner cannot.

A system administrator's account can only be changed by a system administrator: creating or rotating one of their credentials, or changing their password or email, answers 400 to anyone else, since a credential acts with its owner's administrator flag.

Nobody can grant more than they hold (SR-13). These answer 400 with field code `GrantCeiling` unless the caller holds every permission involved (system administrators have no ceiling):

- assigning a role to a user or credential, including one's own;
- mapping a permission to a role, or changing a permission's resource types or operations;
- creating a credential with a role, or for another user (the new secret acts as that user);
- rotating another user's credential, or changing another user's password or email (both let the caller act as that user).

Setting or clearing `isTenantAdmin`, and acting for a tenant administrator in the ways above, needs a tenant administrator. A tenant role may not be named like a built-in role in any letter case (400, `ReservedRoleName`), and an assignment that carries a role identifier is resolved by that identifier only.

Denials are audited with the permission that was missing, and the response carries it (`requiredPermission`, `resourceType`), so a 403 tells you exactly what to grant. `GET .../users/{id}/permissions` and `GET .../credentials/{id}/permissions` show the effective permissions of a principal.

### Organization-scoped grants

An assignment with `resourceScope: Resource` matches its resource by identifier and, where the route takes a name, by name: Garrison resolves the name to its identifier before it compares (UT-02). When the resource is an organization and the assignment inherits to children (`inheritsToChildren`, the default), the grant also covers what belongs to that organization (UT-01). Membership comes from `ChainOfCommand`, so only the published revision of a live organization counts:

| Record | Belongs to the organization when |
|---|---|
| Unit | It is a unit of the organization |
| Agent, deployment, run | The agent holds a position in the organization |
| Keeper (mandate) | Its agent holds a position, or a seat names it |
| Escalation | It was raised by one of its agents or keepers, or is addressed to one of its agents |
| Freeze | It targets the organization, a unit, an agent, a keeper, or a deployment that belongs to it |
| Report | Its author is one of its agents, or it was filed for one of its units |
| Memory entry | Its scope is the organization, one of its units, or one of its agents |
| Message | Its sender or recipient is one of its agents |
| Change rule | It is on the organization |
| Eval set, eval run, shadow trial, canary release | It was authored in one of its units, or its agent or deployment belongs to the organization |

Lists are authorized in one of two ways for such a principal. A list filtered by a query parameter that names a covered record is authorized against that record, and the filter already limits the result. The organization, escalation, freeze, and report lists without a filter return only the records of the principal's organizations; an unfiltered list of anything else needs a tenant-wide grant. A new freeze and a new change rule are authorized against the target in the body. A principal with no Create on Freeze anywhere is refused before the target is looked up, so the answer does not reveal whether it exists.

Some things stay tenant-wide. The kill switch stops every keeper in the tenant, so setting it needs Update on Freeze for the whole tenant; reading it needs Read on Freeze anywhere. An app belongs to no organization. A scoped grant never crosses tenants: another tenant's records answer 404 before any of this runs.

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
| `SecretManager` | Manage secrets, reveal their values, and use them in configuration |
| `SecretUser` | Use secrets in configuration (`Execute` on `Secret`) without managing them; assign with resource scope to allow one secret |
| `NodeAgent` | The node protocol only; for worker credentials |
| `AgentRegistrar` | Self-registration of remote agents |
| `Releaser` | Execute on `Promotion`, plus Read on agents, agent revisions, and deployments. Assign it with resource scope and the target environment's name as the resource identifier to limit which environments a person may promote to ([REVISIONS.md](REVISIONS.md#permissions)) |
| `AppUser` | Execute on `AgenticApp` and nothing else. Assign it with resource scope on one app so a person can use that app's chat UI ([APPS.md](APPS.md#sign-in)) |
| `BoardMember` | Govern an organization from its board (AA10): Read and Execute on `Mandate`; Read and Update on `Escalation`, `Organization`, `EvalSet`, `EvalRun`, `ShadowTrial`, `CanaryRelease`, and `Approval`; Create, Read, and Update on `Freeze`; Read and Create on `AgentMessage`; all four on `ChangeRule`; Read on `Memory`, `Report`, `Agent`, `Deployment`, `Run`, and `Conversation`; Execute on `Deployment`. Assign it with resource scope on an organization to limit it to that organization and its records (see Organization-scoped grants above and [BOARD.md](BOARD.md#the-boardmember-role)) |
| `Custom` | No permissions; a starting point for tenant-defined roles |

Triggers and notification endpoints (resource types `Trigger` and `NotificationEndpoint`): `Viewer`, `Auditor`, and `AgentOperator` can read them; `Editor` and `AgentDeveloper` can create, change, and delete them and run their actions (manual fire, test send); `AgentOperator` can also fire triggers by hand. Saving a trigger additionally needs Execute on the agent or pipeline it starts.

Freezes and the autonomy kill switch (resource type `Freeze`, see `BRAKES.md`): `Viewer`, `Auditor`, `AgentDeveloper`, and `AgentOperator` can read them; `Editor`, `AgentOperator` (through its `AgentOperator.Brakes` permission), and `TenantAdmin` can apply and lift freezes and set the kill switch. Run tokens never hold any `Freeze` permission, so an agent cannot lift a freeze on itself or turn the kill switch off. Freezes are checked in the control plane when a run is created and when a keeper wakes, so a frozen agent never reaches a worker.

Memory (resource type `Memory`, see `AGENT_MEMORY.md`): `Viewer`, `Auditor`, and `AgentOperator` can list entries and read their text; `AgentDeveloper`, `Editor`, and `TenantAdmin` can also write and delete them. People calling the memory tools for an agent's private scope also need Execute on that agent. Runs never use these permissions: a run reads and writes only its own agent's scope, the shared scopes of its agent's apps, and the unit and organization scopes its position allows (it never writes upward), and asking for any other scope answers `Forbidden`. Memory text is untrusted. It reaches a prompt only through `builtin/memory-recall`, framed as data between markers chosen at random for each render, and audit records name the entry, never its key or text.

Reports (resource type `Report`, see `REPORTS.md`): `Viewer`, `Auditor`, and `AgentOperator` can list and read reports; `AgentDeveloper`, `Editor`, and `TenantAdmin` can also file them. Reports are immutable, so no role can change or delete one. Runs never use these permissions: a run reads its own agent's reports, the reports of the members of apps whose entry agent is its agent, and in an organization the reports that reach it up the chain of command (`ORGANIZATIONS.md`). Report text is untrusted. It reaches a prompt only through `builtin/report-digest`, framed as data between markers chosen at random for each render, and audit records and logs name the report, never its text.

Messages (resource type `AgentMessage`, see `MESSAGING.md`): `Viewer` and `Auditor` can list and read messages and threads; `AgentDeveloper` and `AgentOperator` can also write to an agent; `Editor` and `TenantAdmin` hold every operation. Runs never use these permissions: a run writes only along an app edge, an organization's reporting or peer line, or as a reply to the agent that wrote to it, reads only its own agent's inbox, and every send passes the loop guards (hop limit, thread budget, per-line rate, recipient freeze), with each refusal stored. Message text is untrusted. It reaches a prompt only through `builtin/inbox-delivery`, framed as data between markers chosen at random for each render, and audit records and logs name the message, its parties, and its urgency, never its subject or body.

Organizations (resource type `Organization`, see `ORGANIZATIONS.md`): `Viewer`, `Auditor`, and `AgentOperator` can read organizations, their revisions, charts, and spend; `AgentDeveloper` can also create them, edit their units, and publish and roll back revisions; `Editor` and `TenantAdmin` hold every operation, including delete. Run tokens never hold `Organization` permissions: a run reads its own place through `garrison_org_chart` and `garrison_org_whoami` and cannot change the structure it sits in. Nothing in the working tree takes effect until a person publishes it, and every change is audited. Mandate summaries on the chart are text people or agents wrote and are returned as data.

Change rules (resource type `ChangeRule`, see `EXECUTIVES.md`): `Viewer`, `Auditor`, `AgentOperator`, and `AgentDeveloper` can read them; `Editor` and `TenantAdmin` can also create, change, and delete them. Run tokens never write a rule, whatever their permissions (403 `RulesArePeopleOnly`).

Evaluations (resource types `EvalSet`, `EvalRun`, `ShadowTrial`, and `CanaryRelease`, see `EVALS.md`): `Viewer` and `Auditor` can read all four; `AgentOperator` can also run and cancel evals, stop shadow trials, and abort canary releases; `AgentDeveloper` can also write and approve eval sets and start trials and releases; `Editor` and `TenantAdmin` hold every operation, including deleting draft set versions. Starting an eval run or a shadow trial also needs Execute on the agent, and starting a canary release needs Update on both deployments. Executive run tokens get Read and Create on `EvalSet` and Read and Execute on `EvalRun`, limited to their own drafts and their own eval runs; no other run token holds any of these permissions.

Permission approvals (resource type `Approval`): `Viewer`, `Auditor`, `AgentDeveloper`, and `AgentOperator` can read them; `Editor`, `AgentOperator`, `ResourceAdmin`, and `TenantAdmin` can decide them (Update on `Approval`). Deciding with `remember`, which adds a rule to the deployment, also needs Update on that deployment.

Built-in roles and permissions cannot be changed. Create custom roles and map permissions to them with `POST .../role-permissions`.

## Tenant isolation

Every tenant-owned table carries a tenant identifier, and every query for a tenant-owned record filters on the tenant taken from the authenticated principal, not from the request body. Asking for another tenant's resource answers 404, the same as a resource that does not exist. Built-in harness profiles, prompt templates, roles, and permissions are shared read-only records with no tenant.

Workers are shared by default. To keep a tenant's runs on its own workers, create a node pool dedicated to that tenant (`tenants` on the pool) and start those workers in the pool; the scheduler will not lease that tenant's runs elsewhere if its deployments require the pool, and will not lease other tenants' runs to the pool.

## Harness isolation

This is the most important limit to understand. Garrison has two executors, chosen per deployment (`executor`) or per node pool (`defaultExecutor`), and they protect against different things.

For any prompt, document, or repository you do not control, use the isolated path:

1. Run the worker in Kubernetes with the KubernetesJob executor, so each run gets its own pod (below).
2. Mark the deployment `trustLevel: Untrusted`, so its runs are only ever placed on an executor that isolates them.
3. Give the deployment `egressRules`, so its runs reach only the endpoints they need.

The isolation red-team test (`k8s/tests/isolation-test.sh`, below) attacks exactly this setup on every change to the Kubernetes manifests or the worker. The Process executor, which runs harnesses as subprocesses of the worker, is for trusted workloads only; it is described after the isolated path.

### KubernetesJob executor (pod per run, isolated)

Each run gets its own Job and pod (`docs/KUBERNETES.md`, "Pod-per-run executor"). The worker keeps every credential; the pod gets only the compiled spec for its own run through a Secret. The pod:

- has its own filesystem: the work, home, config, and `/tmp` directories are emptyDir volumes that exist only for this run, so a run cannot see another run's files or the worker's;
- has no Kubernetes credentials: `automountServiceAccountToken: false` and the `garrison-run` service account, which has no RoleBindings;
- has no Garrison credentials besides the run token in its MCP configuration (every run gets one so it can escalate; it is limited to its delegation tree and revoked when the run ends) and the secrets its own deployment binds;
- runs as UID 10001 with `runAsNonRoot`, a read-only root filesystem, every capability dropped, `allowPrivilegeEscalation: false`, the `RuntimeDefault` seccomp profile, and no service environment variables (`enableServiceLinks: false`);
- is limited by the deployment's CPU, memory, and ephemeral storage requests and limits, so a runaway harness is OOMKilled or evicted instead of starving the node's other runs;
- accepts no inbound traffic and may only resolve DNS, reach the Garrison MCP port (the `garrison-run` NetworkPolicy), and make HTTPS connections to any address except link-local ones such as the cloud metadata service, 169.254.0.0/16 (the `garrison-run-default-egress` NetworkPolicy, SR-23). A deployment with an egress allowlist replaces that HTTPS rule with its own CIDR and port rules ("Egress allowlists" below). Policies need a network plugin that enforces them; K3S's default one does;
- can optionally run under gVisor or Kata Containers (`runtimeClassName`) for a kernel boundary as well.

The worker trusts nothing the pod prints except lines that start with the run's random nonce, which only the worker and the pod's spec Secret know. JSON encoding keeps harness text on one line, and `run-one` marks itself non-dumpable so the harness, which runs as the same user with no capabilities, cannot open `run-one`'s stdout through `/proc`. A harness that reads its own spec file learns its own nonce and could, at worst, misreport its own run; it cannot affect other runs or the control plane.

What it does not protect against: run pods still share the node's kernel unless you use a sandboxed runtime; for deployments without an egress allowlist, the default egress rule allows HTTPS to anywhere, which a prompt-injected harness can use to send out what it can read (its workspace, its own secrets), so give such deployments `egressRules` (below); and the worker's Role can create pods in the run namespace, which can mount that namespace's Secrets, so a compromised worker in the same namespace as `garrison-secrets` could read them.

### Deployment trust level

Every deployment declares how far its input is trusted with `trustLevel` (P11.14, D-035, D-049):

- `Trusted` (the default, and the value every deployment created before schema 23 keeps): callers and content are trusted. Runs may use any executor, including Process, so nothing changes for existing deployments. The dashboard shows a "trusted only" warning on the deployment form and run view whenever such a deployment resolves to Process.
- `Untrusted`: runs need an executor with at least Container isolation on top of the deployment's own `requiredCapabilities`. An unset executor resolves to `KubernetesJob`, and `executor: Process` is rejected (`UntrustedNeedsIsolation`). The requirement is fixed on the run at admission, and every claim path enforces it in the database, so an Untrusted run is never handed to a Process worker. When no Ready worker can isolate it, the run waits in the queue with `blockedReason: NoIsolatingWorker`; it is not rejected at submit.

A tenant can require Untrusted for all its deployments with `requireUntrustedDeployments` (`PUT /v1.0/api/tenants/{tenantId}`). While it is on, creating or updating a Trusted deployment in that tenant is rejected with a field error on `trustLevel` (`TenantRequiresUntrusted`) over REST, MCP, and manifests; nothing is silently converted. Turning it on does not rewrite existing deployments: Trusted ones keep running as configured, the deployment list flags them, and their next configuration update must set Untrusted. Rewriting them automatically would move their runs to executors the operator may not have yet, which could stop production traffic without warning, so the policy blocks new Trusted configuration and leaves the switch to the operator. Review flagged deployments after turning the policy on.

Delegated children run under their own deployment's trust level, not their parent's. An Untrusted parent may delegate to a Trusted child when the parent's delegation rules allow it, and the child then runs on whatever executor its own deployment allows. Since a child's input is the parent's output, keep untrusted agents' delegation allowlists to children whose deployments are also Untrusted, or that you would trust with that content.

Trust level is a placement policy, not a sandbox by itself: Container isolation means the KubernetesJob executor described above, with the limits listed under it (shared kernel unless you use a sandboxed runtime, and the default egress rule unless the deployment has an egress allowlist).

### Egress allowlists

Egress allowlists are the way to narrow what a run can reach on the network, per deployment (P11.15, D-035, D-052). A deployment lists the destinations its runs need, such as the model API, a git host, or an MCP server, as `egressRules`:

```json
"egressRules": [
  { "cidr": "203.0.113.0/24", "port": 443, "protocol": "TCP" },
  { "cidr": "2001:db8::/32", "port": 443 },
  { "cidr": "198.51.100.7/32" }
]
```

Each rule is a CIDR block (IPv4 or IPv6, written as its network address), an optional port from 1 to 65535 (omitted means every port), and a protocol, `TCP` (the default) or `UDP`. A deployment can have at most 64 rules. Host names are not accepted: resolve them yourself and list the blocks, and keep the list current when a provider's addresses change. Many providers publish their ranges.

With at least one rule, a run pod of that deployment can reach only:

- DNS (UDP and TCP port 53),
- the Garrison server's MCP port (the same rule as `garrison-run`),
- the listed rules.

The HTTPS-to-anywhere default does not apply to it. An empty list (the default, and what every existing deployment has) keeps today's behavior.

How it is enforced:

- Only KubernetesJob run pods with a NetworkPolicy enforce an allowlist. Admission requires the `EgressControl` capability and at least Container isolation for every run of such a deployment, and an unset executor resolves to `KubernetesJob`. `executor: Process` is rejected (`EgressRulesNeedKubernetesJob`), and so is Warm startup (`EgressRulesNeedColdStart`).
- Only workers that enforce allowlists claim these runs. A worker reports `EgressControl` when all of the following hold: `Kubernetes.EgressAllowlists` is on, `Kubernetes.EgressCanary` is set, its Role can create, get, list, and delete NetworkPolicies, and no shared NetworkPolicy in the run namespace would widen allowlisted pods.
- When no such worker is Ready, the run waits in the queue with `blockedReason: NoIsolatingWorker`. It is never run without its allowlist.
- For each run the worker labels the Job and pod `garrison.io/egress: allowlist`, so `garrison-run-default-egress` never selects the pod. It then creates a NetworkPolicy owned by the Job that selects only that pod and allows DNS, the MCP port, and the rules. This policy exists before the spec Secret, so it is in place before `run-one` can start, and the egress canary still has to be blocked before the harness starts.
- The worker deletes the policy when the run ends, and reconciliation removes any it misses. Warm pods are never used for these runs: a warm pod already runs under the default egress, and relabeling it would leave a short window that the canary cannot detect.
- Defense in depth: the compiler refuses to lease an allowlisted spec for any executor but KubernetesJob. A Process executor that receives one anyway fails the run (`NoCapableWorker`), and so does a KubernetesJob worker that cannot enforce the rules at that moment.

Limits:

- NetworkPolicy works on addresses, not names. A CDN or shared IP range lets the pod reach every host that shares the range.
- DNS stays open, so a determined harness can still leak small amounts of data through DNS queries to the cluster resolver.
- The rules are only as strong as the network plugin, which must enforce NetworkPolicy, including IPv6 rules if you list IPv6 blocks.
- Do not list a block that contains the Garrison server's pod or service address on every port. Doing so makes the egress canary reachable, and runs then fail with `PodFailed` rather than start.

### Isolation red-team test

`k8s/tests/isolation-test.sh` (P11.17) checks the isolated path end to end on a throwaway k3d cluster. It builds the server and worker images from your checkout, installs Garrison with the KubernetesJob executor and egress allowlists on, and starts two runs of an `Untrusted` deployment whose allowlist names one in-cluster test server on one port. Run A writes a marker file into its own workspace and stays alive; run B, of the same deployment, then tries to:

- read A's marker, by its path in a run pod and on the worker, and by globbing every run directory;
- read the worker's settings file, find the worker's access and secret keys in its own environment or in any process it can see, and read a service account token;
- list Secrets and pods through the Kubernetes API, and connect to the API server's node port;
- connect to the control plane REST port (8700), the database, the worker's health port, the internet on 443 and 80, an external DNS server over TCP, an in-cluster pod that is not allowlisted, and the allowlisted pod on a port that is not allowlisted.

Every one of those attempts must fail, and both positive controls must succeed: the allowlisted pod and port (TCP and HTTP), and the Garrison MCP port. The probes come from the fake harness's probe mode (`--probe-prompt`, `src/Garrison.FakeHarness/README.md`), which only reads and connects and never reports file contents, variable values, or tokens. The script also runs the same probes in two `Trusted` deployments without an allowlist, a run pod and a Process run on the worker, and reports what they reach without failing on it. That contrast shows what the isolated path takes away. In the first local run (k3s v1.31.4, 2026-10-14) the Trusted run pod reached only the internet on 443 and the MCP port, as the default `garrison-run` policies intend. The Process run read the other run's marker, the worker's settings file, the worker's secret key (in the worker process's `/proc/1/environ`), and the worker's service account token, listed the namespace's pods with that token, and reached every network target except the database, which is exactly why Process is trusted only.

Run it locally with Docker and k3d (it takes about 10 to 20 minutes, most of it the worker image build):

```bash
k8s/tests/isolation-test.sh                  # build, test, print the table, delete the cluster
KEEP_CLUSTER=1 k8s/tests/isolation-test.sh   # keep the cluster for inspection; delete it with CLUSTER_NAME=garrison-isolation k8s/tests/cluster-down.sh
```

It uses its own cluster name (`garrison-isolation`), API port (6562), NodePort mapping (127.0.0.1:18872), and kubeconfig, so it does not touch other clusters, your default kubeconfig, or a Docker Compose stack. It refuses to start if a cluster with its name already exists and deletes only the cluster it created. Results, including a CSV and each run's JSON, go to `k8s/tests/results/isolation-<time>/`. The `Isolation` GitHub Actions workflow (`.github/workflows/isolation.yaml`) runs it on pushes that touch `k8s/`, `src/Garrison.Worker/`, or the workflow, and on demand, and uploads the results.

### Recommendations for untrusted prompts

- Set `trustLevel: Untrusted` on every deployment that handles prompts, documents, or repositories you do not control, and turn on `requireUntrustedDeployments` for tenants that only serve such work.

- Use `executor: KubernetesJob` (or leave it unset on an Untrusted deployment) for every deployment that handles prompts, documents, or repositories you do not control.
- Put run pods in their own namespace (`kubernetesExecutor.runNamespace`) with the `restricted` Pod Security level, away from `garrison-secrets`.
- Give every deployment that handles untrusted input `egressRules` listing only the model APIs, git hosts, and MCP servers it needs, and narrow `runEgress` (the default for deployments without rules) from 443-anywhere as far as your other deployments allow.
- Set `podResources` limits so one run cannot exhaust a node, and use a sandboxed `runtimeClassName` where the nodes support it.
- Bind only the secrets and MCP servers the agent needs, keep delegation off or on a tight allowlist, and use the harnesses' own sandboxes (`sandbox` for Codex and Mux, `permissionMode` and `allowedTools` for Claude Code) as tightly as the work allows.
- A worker with the KubernetesJob executor enabled mounts its service account token, which Process runs on that worker can read. Where Process deployments also take untrusted input, give them a separate worker pool with `GARRISON_WORKER_KUBERNETES_ENABLED=false` and `automountServiceAccountToken: false`, and keep the Job-capable pool for KubernetesJob deployments (pin them with a node pool or `nodeSelector`).
- For Process deployments that must stay, run one concurrent run per worker (`MaxConcurrentRuns: 1`) and give sensitive tenants dedicated node pools.

### Process executor (trusted only)

Process is the default executor when a deployment and its node pool name none, because it needs no cluster. Use it only for trusted work.

Process execution is for trusted workloads only. The worker image stays non-root (UID 10001); all Process harnesses use that same user. Unix run roots and their `work`, `home`, and `config` directories are created with mode `0700`, and existing directories are tightened on reuse, including conversation turns. These permissions exclude other OS users; they do not isolate concurrent harnesses sharing the worker user. Windows inherits the worker account's directory ACLs. Use `KubernetesJob` for untrusted inputs. The dashboard displays the same warning in deployment forms and Process run details.

Each run is a subprocess of the worker, inside the worker's container, with:

- its own working directory, `HOME`, and configuration directory, deleted after the run (the workspace may be kept for debugging);
- for a conversation turn, the conversation's working, `HOME`, and configuration directories instead, which stay on the worker between turns (so the next turn can resume the harness session) until they go unused for the worker's `ConversationRetentionHours`. Files the profile writes there, such as a Codex `auth.json` or an MCP configuration with a run token, are rewritten every turn and the run token is revoked when its run ends, but they sit on the worker's disk between turns;
- an environment that starts empty apart from an allowlist (`PATH`, locale, proxy and certificate settings), plus the variables the profile and deployment define;
- a deadline, an output size limit, run guards, and a process-tree kill on cancellation;
- relative paths for every file it writes, with absolute paths and `..` rejected;
- secret values scrubbed from everything it prints before it leaves the node.

It does **not** have its own filesystem namespace, network namespace, or user. A harness running with permissions such as Claude Code's `acceptEdits`, Codex's `workspace-write`, or Gemini's `yolo` can read anything the worker user can read, including other concurrent runs' directories and the worker's node credential, and can reach anything the worker pod can reach. Treat everyone who can configure deployments on a shared worker as able to see the others' runs. In Kubernetes the worker's service account token is mounted (it creates run Jobs), so a harness on a Process worker can also use the worker's Role.

### Codex sandbox in containers

Codex normally runs each shell command inside bubblewrap with its `workspace-write` sandbox: writes limited to the workspace, no network. Bubblewrap needs user namespaces, which a worker container or run pod cannot create, so inside Docker or Kubernetes that sandbox stops every shell command instead of confining it. Garrison's built-in Codex profiles therefore default to `danger-full-access` when the run executes in a container: a KubernetesJob run pod, or a Process run on a worker that reports `Containerized` (set by the worker image). Workers started directly on a host keep `workspace-write`. A deployment `sandbox` parameter always wins (D-050, `docs/HARNESSES.md`).

The container or pod is then the isolation boundary, so what Codex can reach is what the executor sections above say:

- In a KubernetesJob run pod, Codex can write anywhere the pod allows (its own emptyDir volumes; the root filesystem is read-only) and use the network the `garrison-run` NetworkPolicy allows. It cannot see other runs or the worker's credentials. This is the same boundary every other harness in a run pod has.
- In a Process run on a containerized worker, Codex can write anything the worker user can write and reach anything the worker can reach, including other concurrent runs' directories and the node credential. That was already true of reads with `workspace-write` (the Process executor has no filesystem namespace); `danger-full-access` adds writes outside the workspace and network access from shell commands. This is why Process stays trusted only.

### Mux sandbox

Mux's `sandbox` parameter chooses which of Mux's own tools may run; it is not an operating system sandbox. Checked against Mux 1.8.0 on a macOS host worker (AA12.7, 2026-11-26): `read-only` refuses `run_process` and `write_file` but still lists directories outside the workspace; `workspace-write` (the default) refuses `write_file` outside the workspace, but a shell command it runs can read and write anywhere the worker's user can and can reach the network, loopback included; `none` also lets `write_file` go anywhere. A keeper that runs `curl` against `127.0.0.1` works under `workspace-write`, and the same run can list your home directory. Treat a Mux run on a host worker as having the worker user's file access, and use a containerized worker or the KubernetesJob executor, with an egress allowlist, when that is too much. `docs/HARNESSES.md` has the table.

Trust levels ("Deployment trust level" above) still decide placement: an `Untrusted` deployment never runs on a Process worker, whatever the sandbox. Set `sandbox` explicitly (for example `read-only`) on a deployment that should not run shell commands at all, and expect shell commands to fail in a container when you do.

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

## Delegated management

Runs cannot change configuration on their own. There are two narrow exceptions: a deployment with `managementAccess: Drafts` gives its run tokens access to studio drafts ([STUDIO.md](STUDIO.md#delegated-management)), and `managementAccess: OrgSubtree` makes a unit lead an executive that drafts changes to the units below it ([Executive authority](#executive-authority)). A `Drafts` token:

- may create, read, and edit drafts, try them in the playground (writing agent draft revisions, never publishing), and request their apply, only for the person who started the run;
- may read design configuration (deployments, harness profiles, prompt templates, MCP servers, workspace templates, revisions, assets, capabilities, apps, pipelines, triggers), never secrets;
- is checked against that person's permissions on every call, so a person without design permissions gets an architect that cannot design;
- can never apply a draft, decide an approval (403 for any run), or delete a live resource;
- ends with the run, like every run token.

The architect cannot change its own instructions either: the architect prompt and prompt template MCP tools are hidden from every run token and refused if called ([ARCHITECT.md](ARCHITECT.md#who-may-change-the-prompt)).

Applying an architect's draft takes a `DraftApply` approval decided by a person who holds Create on `Manifest`. The approval shows the full diff, and the draft is checked again at decision time, so a change made to live configuration after the request is never silently overwritten (409 `DraftStale`). Turning `managementAccess` on or off is audited with the deployment change.

## Executive authority

An executive is a unit lead whose deployment has `managementAccess: OrgSubtree`. It drafts changes to the units below it, and a draft that human-written change rules fully cover applies without a person ([EXECUTIVES.md](EXECUTIVES.md)). That is the one place in Garrison where an agent changes configuration and nobody looks first, so it gets its own threat model. Authority points down the tree only, a person sets every ceiling, and one rollback undoes any apply.

**Goal drift through self-modification.** The risk that matters most is an agent rewriting what it is for. An executive cannot touch its own agent, its deployments, its mandates, the mandate it holds as lead, or its own unit, including that unit's members, budgets, and title (`SelfModification`). It cannot touch its unit's parents or the organization's mission (`OutsideSubtree`). These are hard limits: they are checked when a draft is validated, when apply is requested, and again just before it applies, and no change rule or human approval lifts them. A person who wants to change an executive does it directly, outside the draft path. Mandate revisions an executive writes carry source `Executive`, and a run token is refused on the mandate publish route.

**Privilege escalation through management access.** Changing `managementAccess` on any deployment, new or existing, is refused with `AuthorityChange`, so an executive cannot mint another executive or an architect. Change rules are written only by people: every rule route answers 403 `RulesArePeopleOnly` to a run token, and the rule-writing MCP tools are hidden from runs. An executive reads the rules that bear on its subtree and nothing else. Executive authority also follows the live chart. Garrison works out the executive's position on every call, so a person who publishes a revision moving it out of the lead's seat ends its authority at once, including for drafts it already wrote.

**The person ceiling.** Every executive draft is still checked against the person who started the run. The dry run uses that person's permissions and secret access. A rule-covered draft applies only when that person holds Create on `Manifest`, and it applies as them; otherwise it waits. A rule therefore never grants an agent more than its person could do by hand. An executive's run token reaches only that person's drafts and only the executive's own proposals for the unit it leads now; other runs, including an architect working for the same person, never see an executive's proposals.

**Secrets.** Changing any field whose path names a secret or a credential on an agent, deployment, or asset is refused with `ForbiddenKind`, so an executive cannot rebind a worker to a different secret or read one by routing it somewhere new. `Secret` documents are not among the kinds an executive draft may hold, and executives never read secret values.

**Budgets.** Raising or removing a budget is refused with `BudgetIncrease`: `maxBudgetUsd` on an existing deployment, the per-tick and per-day budgets and token cap on an existing mandate, and the budgets of existing units below. Lowering is allowed. A new worker's deployment and mandate are not compared with anything, so hiring (`AddWorker`) deserves a careful rule or none. Unit budgets at and above the executive's unit still cap the whole subtree, and the executive cannot reach them, so spending inside it stays bounded either way.

**Outside agents adopted into a subtree.** An agent that is live outside the subtree, or in no unit, cannot be added to a unit below the executive (`OutsideSubtree`). New agents may join, but only in the same draft that creates them, and only below the executive. Without this an executive could pull any agent in the tenant under its authority by listing it as a member. New peer lines from inside the subtree to units outside it are refused for the same reason.

**Shared templates and assets.** A prompt template or agent asset used both inside and outside the subtree is read-only to the executive. Editing it would change how agents above or beside the executive behave. The executive is told to copy it under a new name and bind the copy.

**Deletes.** An executive never deletes a live record (`ForbiddenKind`). Deletes cannot be undone by a revision rollback. Retiring a worker means removing it from its unit, and the records stay for a person to delete.

**Unreviewed changes stay narrow.** A rule covers a change only when every changed field falls in a class the rule lists and within its limits. Fields that loosen isolation or reach, such as trust level, egress rules, approval settings, harness, and an agent's delegation settings, have no class at all, so a change to them always waits for a person. Rules match per change, oldest rule first, against the live chart, and `count` limits stop one draft from hiring a crowd.

**Rollback as the safety net.** Every executive apply, by rule or by a person, publishes a new organization revision with the draft's identifier and a revert draft holding the records as they were. Rolling the organization back past that revision restores the tree and pinned mandates and then applies the revert drafts newest first, so the agents, deployments, mandates, templates, and assets it changed go back too. Agents and deployments it created are deleted; mandates, templates, and assets it created stay for a person to remove. Every rule change, apply, and revision is audited, `OrgProposalApplied` tells subscribed endpoints each time rules applied something without a person, and `proposal.changed` shows each proposal on the organization's WebSocket channel.

Some things stay closed even to a fully trusted executive: the playground, freezes, approvals, escalation answers, and any change to change rules. An executive can try a draft agent revision only by running an eval set against its own draft, and it cannot approve the set that grades it.

## Evaluations and shadow runs

[Evaluations](EVALS.md) put agents in two new positions: graded by sets that may gate their own changes, and running beside production on real inputs as shadows.

**Self-graded evals.** An executive that proposes a change and then evaluates it could write an easy set, or tune its draft to the cases it can read. A set gates an executive's change only when a person approved it, or when an evaluator agent outside the proposer's subtree wrote it. A promotion gate is stricter: only a version a person approved counts there, and a draft never does, whoever wrote it. A set the proposer wrote, or one written by a unit or agent below it, is refused with `EvalSetSelfAuthored`, and a draft no person approved with `EvalSetNotApproved`. Authorship is recorded by the server from the run token, and a person cannot mark a set `Evaluator`. Approval is people only (`ApprovalIsPeopleOnly`), and an approved version never changes, so a gate cannot be loosened after the fact without a person approving a new version. Executive run tokens hold only Read and Create on eval sets and Read and Execute on eval runs, and they evaluate only their own drafts, so they cannot edit a set, approve one, or run evals of anything else.

**Reading the answers.** Hidden cases are redacted for every run token: input, expected text, check arguments, file contents, the agent's output, the judge's notes, and error text. Run tokens see scores and pass flags only, over REST, MCP, and the `eval-run:{id}` channel. The case and judge runs that hidden cases start are closed to every run token but their own, since their input would give the case away: `GET /runs/{id}` and its sub-routes answer 404, run lists (filtered by `evalRunId` or not) leave them out, the `run:{id}` WebSocket channel refuses them and the `runs` channel drops them, and the MCP run tools refuse them. A hidden result's `runId`, `sourceRunId`, and `judgeRunId` are cleared for run tokens, so no identifier leads back. Keep some cases hidden in any set that gates an executive.

For runs that are not hidden, REST is broader than MCP: a run token with Read on `Run` lists and reads the tenant's runs over `GET /runs`, while `garrison_list_runs` keeps a run token to its own run tree. Treat run inputs and outputs as visible to the agents of the tenant.

**Judge injection.** The answer a judge grades is written by the agent under test, which has every reason to talk the judge into a high score. `builtin/eval-judge` frames the criteria, input, reference, and answer as data between begin and end lines that carry a random marker generated for each judgement, and tells the judge not to follow instructions inside them. The framing lowers the risk without removing it, so give the judge agent an output schema so its verdict is a typed object, no tools, and a different model from the agent it grades, and keep `ExactMatch`, `Contains`, or `JsonSchemaValid` checks next to `Judge` checks where the answer allows it.

**People grading their own work.** Garrison separates agents from the sets that grade them. It does not stop a person who writes an agent from also approving its gate, because approval is an Update on the set. Where that matters, give developers Create on `EvalSet` and keep Update with reviewers.

**Bypassing the gate.** An environment's eval gate is checked on every way a revision is pinned there: agent promotions, agentic app promotions (every member revision), creating or editing a deployment with `agentRevisionId` there or moving a pinned one there, and manifest and studio applies of a pinned `Deployment` document, all with `EvalGateFailed`. Only runs over the set's cases of an approved version count; a recent-input replay never does. Rollbacks are left open on purpose: `POST /promotions/{id}/rollback` and an organization rollback's revert drafts restore the previous pins without a gate, because getting back to a known state must not wait on an eval, and both are audit-logged. Two gaps remain. A deployment that pins no revision follows the agent's latest published revision, so publishing moves it with no gate; pin the deployments of a gated environment. And whoever holds Update on a gated environment's deployments can still change everything about them except the pin, including the model, without an eval.

**Shadow leakage.** A shadow run answers real inputs, so anything it does happens for real unless something stops it (decision AA-027). Garrison stops it in four places. The MCP gateway re-reads the run on every tool call and refuses every tool the effect journal would record, every agent tool, messaging, escalations, reports, memory writes, keeper and studio draft tools, file writes, and starting or cancelling other runs, with `ShadowRunRefused`; those tools are missing from its tool list as well. Every permission prompt a shadow run raises is denied, whatever the deployment's rules say, and Garrison turns approvals on for it where the harness can relay prompts, putting Claude Code in permission mode `default` with only Garrison's tools pre-allowed. A shadow run gets no conversation file space and cannot write one back. It has no caller, conversation, trigger, pipeline, app, mandate, or parent, and sends no run notifications, so its answer goes nowhere but the comparison.

What Garrison cannot stop is a harness's built-in tools on a harness that does not relay permission prompts (Codex exec, Gemini CLI, Mux, opencode, pi, custom CLIs), and MCP servers or network calls a deployment reaches on its own. The Garrison REST and A2A APIs called with the run's own token are covered: authorization refuses a shadow or eval run's token every operation other than Read with `ShadowRunRefused` or `EvalRunRefused`, using the same rule as the MCP gateway (SR-29). Only shadow such a deployment when its trust level, executor, and egress allowlist already keep it away from anything with side effects, or give the candidate a harness that relays approvals.

**Shadow inputs.** A shadow trial copies real users' inputs and run parameters to another deployment, under the identity of the person who started the trial. Starting one needs Execute on the agent, and only people start or stop trials. The candidate must be a deployment of the same agent, so a trial cannot route one agent's inputs to an unrelated agent. Conversation turns after the first are not copied, so earlier turns are not replayed out of context.

**Shadow cost.** Shadow runs are real runs and are billed like them, at the lowest priority. Their cost counts toward the agent's spend, deployment quotas, and org unit budgets, so a large sample on a busy deployment can exhaust a budget that real traffic needs. Start with a small `samplePercent` and an `endsUtc`.

**Eval runs act like shadows** (decision AA-074). Replaying a case, or a production input in `RecentInputs` mode, must not repeat its effects, so every `Eval` run (case runs, recent-input replays, and judge runs, including a shadow comparison's judge) runs under the same four restrictions as a shadow run, with the refusal code `EvalRunRefused`. Judges need no tools to answer, so they lose nothing. The same residual risk applies: on a harness that cannot relay permission prompts, an eval run's built-in tools run unasked, so evaluate such deployments only when their sandbox and egress rules already keep them harmless.

**Case files.** A case's files are written into the case run's workspace as bytes, never rendered as templates, at paths checked to stay inside the workspace when the case is saved. Asset-backed files are downloaded with a short-lived ticket and checked against their SHA-256 like any asset file. A case's `sourceRunId` and `assetId` are resolved in the caller's tenant only.

**Eval copies.** Revision and studio draft evals run on protected copies in the reserved `draft` environment at weight 0, so routing never sends real traffic to them. A draft's copies are deleted when it is applied or deleted, and the leader deletes any copy idle for a day; copies in use by a run, an eval run, a shadow trial, or a canary release are kept.

**Canary weights.** A canary release changes deployment weights, and only people start or abort one. Starting one needs Update on both deployments. A rollback restores the weights from before the release, every move is a compare-and-set, every weight change is audited, and a rollback sends `CanaryRolledBack`.

## App sessions and anonymous use

End users of an agentic app never hold management credentials. The app gateway (`/v1.0/apps/{slug}/`) issues its own session tokens, prefixed `gas_` and stored only as SHA-256 hashes. A session token works only on the gateway routes of the app that issued it and only for the conversations its owner started; anything else answers 404, and the management API refuses the token with 401. Sessions end after `Apps.SessionMinutes` (480 by default) for signed-in users, after `Apps.AnonymousSessionMinutes` (60) for anonymous ones, on sign-out, or as soon as the user loses access to the app, and each session may send at most `Apps.MessagesPerMinute` messages a minute.

Anonymous use is off unless an app sets both `authMode: Anonymous` and `anonymousEnabled: true`. Everyone with the URL can then start a session, so treat an anonymous app as public: give its agents only the tools, secrets, and delegation edges you would expose to anyone, and set a budget or quota on its deployments. `AppUsers`, the default mode, admits only tenant users who hold the `AppUser` role on that app.

Runs started through an app run as the app, with the end user recorded as the caller. The end user gets no management permission from them, and the app's edges, written into each member's delegation allow list, bound what those runs may call. Thinking, tool calls, and warnings reach end users only when the app sets `showOperatorDetail`. See [APPS.md](APPS.md).

## Permission approvals

Approvals (P12.3) put a person, or rules a person wrote, between a Claude Code or Codex app-server run and the tools it wants to use. What they do and do not guarantee:

- A run can ask, never decide. `garrison_permission_prompt` takes the run from the run token, so a run can only ask about itself, and run tokens are refused by the approval list, read, and decide tools and routes. Every decision a person makes is audited (`ApprovalDecided`); rule decisions are recorded as approvals with source `Rule` or `Default`.
- Rules follow D-025: Deny beats Ask and Ask beats Allow, an Allow rule for `Bash` must cover every command of a compound line, and a line with command or process substitution is never allowed by a rule. A bare `Bash` (or `Bash(*)`, `Bash(:*)`) Allow rule allows every command; prefer narrow prefixes. Interpreters (`python -c`, `node -e`), `find -exec`, `xargs`, and variable expansion are not inspected, so `Bash(python:*)` is as broad as `Bash`.
- Rules are not a sandbox. Tools the deployment pre-allows through the `allowedTools` parameter, and read-only tools in Claude Code's `default` permission mode, never reach the rules; keep the harness sandbox and `allowedTools` tight.
- Previews redact the values of the deployment's bound secrets and common credential shapes (bearer tokens, `sk-` and GitHub tokens, AWS key IDs, private keys, `password=`-style assignments) and keep at most 4,000 characters. The full tool input is never stored; the harness gets its own input back on allow.
- Deployments are permissive by default: `approvalDefaultAction` is `Allow`, and a request nobody decides within `approvalTimeoutSeconds` is approved (`approvalTimeoutDecision` `Allow`, recorded as `Expired` with source `Timeout`). Set either to `Deny` (or add Ask and Deny rules) when an agent needs a hard gate. Approvals are kept after their run is deleted or purged, so every decision stays available for review. Cancelling a run, its completion, or a lost lease cancels its pending approvals and the waiting harness is told no. Decisions are compare-and-set in the database, so two people deciding at once on different replicas produce one decision; the second gets 409 `ApprovalNotPending`.
- The Codex relay uses the run token, so a worker that lost its lease cannot ask on behalf of a newer attempt.

## Trigger webhooks

A webhook trigger's URL (`POST /v1.0/api/tenants/{tenantId}/triggers/{id}/webhook`) takes no token; the `X-Garrison-Signature` header is its only authorization, so the details matter (see [TRIGGERS.md](TRIGGERS.md#webhook-triggers)).

The header is `t=<unix seconds>,v1=<hex>`, where the hex value is HMAC-SHA256 under the trigger's signing secret of the timestamp, a period, and the raw body bytes. The server compares signatures in constant time. A timestamp more than `Triggers.WebhookToleranceSeconds` (300) away from the server clock is refused, which bounds how long a captured request stays usable; within that window, a sender that sets `X-Garrison-Delivery` gets idempotency on top (a repeated delivery identifier returns the first fire and starts nothing). Senders that cannot set a delivery identifier should treat the tolerance window as the replay window and keep it short. Bodies over `Triggers.WebhookMaxBodyBytes` (256 KiB) are refused with 413 before any work is done.

Every verification failure answers the same 401 `InvalidSignature`: an unknown tenant, an unknown trigger, a cron trigger, and a missing, malformed, stale, or wrong signature are indistinguishable, and the server still computes an HMAC against a random key when it has no secret so the timing matches. Only a correctly signed request learns whether the trigger is active (409 `TriggerInactive`). Rejections are counted by reason in `garrison_trigger_webhook_rejections_total`.

A fire runs as the principal that last saved the trigger, and that principal's permission to run the target is checked again on every fire, not only when the trigger was saved. Deactivating a user or credential, or removing its role, stops its triggers from starting anything (the fires record `RunAsNotAuthorized`). The webhook payload reaches the agent only through the trigger's input template, so treat it like any other untrusted input (below).

## Outbound notifications

Notification endpoints make the control plane send HTTP requests to URLs a tenant chooses, which is a classic server-side request forgery risk. Garrison checks the URL when it is saved (http or https only, no user information, `localhost` and IP literals judged right away) and again on every connection: it resolves the host itself and connects only to addresses that pass, so a name that resolves or rebinds to an internal address gets no connection. Loopback and private ranges are refused unless the cluster setting `Notifications.AllowPrivateDestinations` is on; link-local addresses (169.254.0.0/16, home of 169.254.169.254 and other metadata services, and fe80::/10), multicast, and reserved ranges are refused regardless. IPv6 addresses that embed an IPv4 address are judged by that address. Redirects are never followed (a 3xx fails the delivery) and no HTTP proxy is used.

Each notification is signed with the endpoint's own secret using the same `X-Garrison-Signature` scheme, and carries `X-Garrison-Delivery` so receivers can drop repeats; delivery is at least once. Payloads hold identifiers, status, outcome, agent, deployment, timestamps, and a link. They never hold secrets, run input, error text, or tool input, and they hold run output only when an endpoint opts in with `includeResultText`, cut to `resultTextMaxChars` (see [NOTIFICATIONS.md](NOTIFICATIONS.md)).

## Prompts and untrusted input

Callers' messages, parameters, and other agents' replies are inserted into prompts as text. Garrison does not and cannot stop a harness from following instructions embedded in that text. Limit what an agent can do (tools, MCP servers, secrets, sandbox, delegation allowlist) to what its job needs, and expose agents that hold powerful credentials only to callers you trust.

Harness processes are started with an argument list, never through a shell, and each argument template renders to exactly one argument. Run parameters can only set values a deployment explicitly allows, each with a validation rule. A rule saved without a validation is an `Enum` rule, which needs its allowed values; `Any`, which accepts whatever the caller sends, has to be chosen explicitly, and should not be used for anything that lands in a command line. The built-in profiles deliver the prompt on stdin. A custom profile with `promptDelivery: Argument` gets `--` before the task text, so text that starts with `-` is never read as an option; a `promptArgumentTemplate` with a literal prefix, such as `--prompt={{input.text}}`, is one argument the CLI reads as a value and needs no separator (SR-14).

## Configuration authors and tenant secrets

Secret values are never returned by the API, with one audited exception: `POST .../secrets/{id}/reveal` returns the decrypted value to a caller with `Admin` on `Secret`. `TenantAdmin`, `SecretManager`, and `ResourceAdmin` hold it; `SecretUser`, `Editor`, and `AgentDeveloper` do not. Each reveal writes a `SecretRevealed` audit record (the value is never in it), the response carries `Cache-Control: no-store`, and request history redacts the body. The dashboard's Reveal action fetches only when the person confirms and discards the value when the dialog closes. There is no MCP tool for it, so agents cannot reveal secrets through Garrison's MCP server.

Sending a secret somewhere through configuration is a separate permission, `Execute` on `Secret` ("use"), which `TenantAdmin`, `SecretManager`, and `SecretUser` hold and `Editor` and `AgentDeveloper` do not (SR-10). It is checked, for each secret involved, whenever someone saves configuration that would send a secret's value somewhere:

- a deployment that binds secrets (every bound secret, on every save, since any change to a deployment can change where its secrets go);
- an MCP server or harness profile whose templates reference secrets, for the secrets of every deployment that uses it;
- an artifact store (`secretId`), workspace template (`gitCredentialSecretId`), or agent (`remoteCredentialSecretId`);
- an MCP server test, for the secrets its templates name (only those are decrypted);
- the same records in a manifest apply, where a document that fails the check is reported with `SecretUseDenied`.

A caller without the permission gets 400 with field code `SecretUseDenied`. To let someone configure agents with one secret, assign `SecretUser` with resource scope on that secret. Invoking an agent never needs the permission: whoever configured the deployment already had it.

Stdio MCP server tests (`POST .../mcp-servers/{id}/test?nodeId=`) run the server's command directly on the selected worker, outside any run pod. Workers do not run them unless the operator sets `McpTestsEnabled` (`GARRISON_WORKER_MCP_TESTS_ENABLED=true`) on that worker; the default is off, so the worker images, Docker Compose, and Kubernetes workers never offer them. Turn it on only for Process workers whose host you already accept as the boundary for tenant-configured commands, never on KubernetesJob workers. A tenant with `requireUntrustedDeployments` cannot run them on any worker (400, field code `StdioDiagnosticsRequireTrust`). Where they are on, treat the permission to test stdio MCP servers like the permission to run Process deployments.

The capability catalog refresh (`POST .../capabilities/refresh`, AD4.3) lists stdio MCP servers the same way, so it needs a worker with `McpTestsEnabled` and lists a server only when the caller may use the secrets its templates name. The leader's background refresh lists HTTP servers only; it never starts a stdio server's command.

Tool probes (AD4.4) are tenant-defined too, but they run on every worker host outside any run, so they are restricted to what cannot do harm: a bare executable name looked up on the `PATH` (no directory part) and at most one argument from `--version`, `-version`, `-v`, `-V`, `version`, `--help`, and `-h`. The worker re-checks each probe before running it and skips one that breaks the rules. Two profiles cannot fight over a tool name: workers probe the first definition (built-in profiles first, then tenant profiles by creation time). Operators who want no probes set `ToolProbesEnabled` to false (`GARRISON_WORKER_TOOL_PROBES_ENABLED=false`).

App sessions (AD6.5) are a separate credential from management tokens. A session token (prefix `gas_`, stored only as a SHA-256 hash) works only on its own app's gateway routes under `/v1.0/apps/{slug}/` and only for the conversations its owner started; the management API rejects it. Sessions end on sign-out, on expiry (`Apps.SessionMinutes`, `Apps.AnonymousSessionMinutes`), and as soon as the user loses the `AppUser` role or is deactivated. Anonymous sessions need both `authMode: Anonymous` and `anonymousEnabled: true` on the app. Runs started through an app run as the app with the end user recorded as the caller; the end user gains no management permission, and the entry agent's delegation policy bounds what those runs can call. End users never see process output, and see tool calls and thinking only when the app sets `showOperatorDetail`.

## Worker hardening

- **Node identity.** A node name is bound to the credential that registered it. Another credential gets 409 `NodeIdentityMismatch` when it registers that name or reports `started`, `events`, or `complete` for that node, until the bound credential is deleted or deactivated (then the name can move). System administrators are exempt. Lifecycle reports check the binding through a 30-second per-replica cache, so event ingestion does not read the node row per batch. Give each worker pool its own `NodeAgent` credential if pools must not be able to act for each other (SR-16).
- **Git workspaces.** `gitUrl` must be `https://`, `ssh://`, or scp-like `user@host:path`; local paths, `file://`, `http://`, `git://`, `ext::`, and anything starting with `-` are refused when the workspace template is saved, and again by the worker. `gitRef` may not start with `-` or contain whitespace or `..`. The worker passes `--` before the URL, uses `--end-of-options` before the reference, and runs git with `GIT_ALLOW_PROTOCOL=https:ssh` and `GIT_PROTOCOL_FROM_USER=0` (SR-22).
- **Reused conversation directories.** Before writing spec files or seeded workspace files into a directory a previous turn's harness controlled, the worker replaces a link at the file's path with a regular file and refuses to write through a linked directory. Artifact uploads check, after opening a file, that it is the regular file at its path inside the workspace; on Linux the open descriptor itself is checked through `/proc/self/fd`, so a link swapped in between selection and upload is caught (SR-24).
- **PersistentVolume workspaces.** A KubernetesJob run mounts a PersistentVolumeClaim only when the claim's `garrison.io/tenant` label equals the run's tenant (SR-09, `docs/KUBERNETES.md`).

## Outbound requests and request limits

The control plane refuses to contact unspecified, link-local, multicast, and broadcast addresses on a tenant's behalf. That includes the cloud metadata services at 169.254.169.254 and fd00:ec2::254. Loopback and private ranges are allowed, because in-cluster MCP servers and object stores live there (SR-07):

- **S3 artifact stores with a custom endpoint** connect through `OutboundAddressPolicy.CreateHandler` (`src/Garrison.Core/Security/OutboundAddressPolicy.cs`). Its connect callback resolves the host and connects only to an allowed address, so a DNS answer that changes between a check and the connection cannot reach a blocked address, and it never follows redirects. Such a store also needs a credential secret: the server's own cloud identity (IRSA, an instance role) is never sent to an endpoint a tenant chose, unless the operator sets `Artifacts.AllowAmbientCredentialsWithCustomEndpoint` (SR-21).
- **The HTTP MCP server test, MCP preflight on workers, and the provider harness bridge** connect through the same handler (Voltaic 2.4.0 accepts it, P15.24), so a redirect or a DNS answer that changes after a check cannot reach a blocked address. An MCP server URL that redirects fails the test; configure the final URL. Test errors name only the class of failure, never the raw exception text.
- **Remote agent endpoints** (`remoteEndpointUrl`) must be absolute http or https URLs without credentials, and are refused when the host is a blocked address.

`OutboundAddressPolicy.CreateHandler(allowPrivateNetworks)` is public so any feature that calls tenant-chosen URLs (webhooks, remote agents) can use it; pass `false` to refuse loopback and private ranges as well. Keep the egress NetworkPolicies below as the second layer.

The REST listener refuses a request whose Content-Length exceeds `Rest.MaxRequestBodyBytes` (128 MiB by default) with 413 before reading it, and reads a body sent with chunked transfer encoding chunk by chunk, answering 413 as soon as it passes the limit. The MCP listener does the same with `Mcp.MaxMessageSize`. Authentication reads the body only for signed requests (`x-signature`), so an unauthenticated request is refused before its body is read (SR-03).

Request history redacts request and response bodies for secrets, tokens, credentials, users, manifest applies, settings, artifact uploads and downloads, and node leases and heartbeats, redacts authentication headers, and replaces the value of any query parameter whose name contains `token`, `secret`, `password`, `ticket`, `key`, or `signature`.

On Kubernetes the server and worker pods have egress NetworkPolicies too (`garrison-server`, `garrison-worker` in `k8s/base/networkpolicies.yaml` and the Helm chart): any pod in the cluster and any address outside it except 169.254.169.254, so a request Garrison makes for a tenant cannot reach the node's cloud identity even if an address check is bypassed (SR-23). Metrics are served on the dedicated metrics listeners (9464, 9465), not on the REST port: `Telemetry.ServeMetricsOnServicePort` defaults to false because `/metrics` needs no authentication and labels series with tenant identifiers and agent names (SR-20).

## Dashboard

The dashboard image's nginx sends these headers on every response (`dashboard/nginx-security-headers.conf`, SR-25):

- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' <API origins>; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. The API origins are the origin of `GARRISON_API_URL` (with its `ws`/`wss` form) and whatever `GARRISON_CSP_CONNECT_SRC` lists; with neither set, the browser may call only the dashboard's own origin, which proxies `/v1.0`. The sign-in page offers a Server URL field only when `GARRISON_CSP_CONNECT_SRC` is set, so with the defaults there is no way to point the console at an origin the policy blocks, and a URL a browser remembered from earlier is ignored.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer`.

Run output is rendered as Markdown through DOMPurify with a strict URL scheme check, and image, video, and audio sources that point at another origin are dropped, so prompt-injected output cannot make the browser send data to an outside host by loading an image. The CSP blocks the same thing a second time, and blocks inline and remote scripts outright.

The session token is kept in `localStorage`, so script running in the dashboard's origin could read it. Garrison has no cookie-based sign-in to move it to; the CSP above (no inline or third-party script, no framing) is what keeps other script out of that origin. Sign out on shared machines, and keep `Auth.TokenLifetimeMinutes` short where that matters.

## Security review

`docs/SECURITY_REVIEW.md` records the P15.1 review and the P15.22 fixes: what was checked, what was found, and how each finding was fixed, with the test that covers it.

## Audit

Garrison records authentication successes and failures, sessions issued and revoked, credential creation, rotation, and use, authorization denials and administrator bypasses, changes to roles, permissions, assignments, configuration, secrets, and settings, secret reveals (`SecretRevealed`), restarts, manifest applies, node registration and status changes, run cancellations, permission approval decisions, trigger and notification endpoint changes, manual trigger fires, and signing secret rotations (`SigningSecretRotated`). Read them at `GET .../audit` with the `Audit` permission. They are kept for `Audit.RetentionDays` (365).

## Reporting a vulnerability

Please report security problems privately through GitHub's security advisory feature on https://github.com/jchristn/Garrison rather than in a public issue.
