# Manifests

A manifest describes a tenant's configuration (secrets, prompt templates, harness profiles, MCP servers, workspace templates, agents, deployments, pipelines, triggers, and notification endpoints) as YAML or JSON documents you can keep in source control, review, and apply to any Garrison. Applying the same manifest twice changes nothing. Exporting a tenant, or part of it, gives you a bundle that recreates it in another tenant or on another Garrison.

Every example on this page was checked with a dry run against a live server.

## Format

A manifest is one or more documents, separated by `---` in YAML or given as a JSON array. Each document has the same four fields:

```yaml
apiVersion: garrison/v1
kind: Agent
metadata:
  name: reviewer
  description: Reviews a change and lists problems
spec:
  displayName: Code Reviewer
```

| Field | Meaning |
|---|---|
| `apiVersion` | Always `garrison/v1` |
| `kind` | `Secret`, `PromptTemplate`, `HarnessProfile`, `McpServer`, `WorkspaceTemplate`, `Agent`, `Deployment`, `Pipeline`, `Trigger`, `NotificationEndpoint`, or `Bundle` (the requirements document an export starts with, see [Bundle](#bundle)) |
| `metadata.name` | The record's name, which is also how other documents refer to it. Names starting with `builtin/` are reserved |
| `metadata.description` | Optional; becomes the record's description |
| `spec` | The record's fields in camelCase, as in the REST API, with the conveniences listed below |

Documents refer to each other by name, never by identifier, so the same manifest works in any tenant. A reference can point to a document in the same manifest, a record that already exists in the tenant, or a built-in such as `builtin/claude-code`. Order does not matter: Garrison processes kinds in the order listed above.

## Applying

The examples on this page send a session token in `$TOKEN`:

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8700/v1.0/token -H "Content-Type: application/json" \
  -d '{"email":"admin@garrison","password":"password"}' | jq -r .token)
```

The dashboard does the same under Configuration, Manifests tab: upload or paste a manifest, then **Dry run** and **Apply**.

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/manifests/apply?dryRun=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/yaml" \
  --data-binary @reviewer.yaml
```

| Query parameter | Default | Meaning |
|---|---|---|
| `dryRun` | `false` | Validate and report what would change, without writing |
| `allowSecretValues` | `false` | Accept `value` in `Secret` documents. Without it, a secret with a value fails, so values do not end up in manifests by accident |

The body can be YAML or JSON (JSON is valid YAML). Applying needs Create on Manifest; each record is then written with the same validation as its REST route.

Apply is all or nothing at the validation stage: every document is validated first, and if any one fails, nothing is written. The response is a record of the apply, with one item per document:

```json
{
  "id": "man_mv1rhrbl_CACIkntqpee8lbNjiue",
  "tenantId": "default",
  "principalName": "System Administrator (API key)",
  "dryRun": true,
  "documentCount": 6,
  "createdCount": 0,
  "updatedCount": 0,
  "unchangedCount": 0,
  "failedCount": 0,
  "items": [
    { "position": 0, "kind": "Secret", "name": "anthropic-key", "result": "Validated", "resourceId": "sec_mv1rhrbp_PclG1sQcd36JhfEko5W", "message": "Would be created." },
    { "position": 4, "kind": "Agent", "name": "reviewer", "result": "Validated", "resourceId": "agt_mv1rhrc0_mqalq0Tmf1lsjYXdpOX", "message": "Would be created." }
  ]
}
```

| Item result | Meaning |
|---|---|
| `Created`, `Updated`, `Unchanged` | What happened to the record |
| `Validated` | Dry run, or not written because another document failed; `message` says which |
| `Failed` | This document is invalid; `message` says why |

A successful apply answers 200. If any document fails, the response is 400 with the same body, so you can see every problem at once:

```json
{ "kind": "Secret", "name": "k1", "result": "Failed", "message": "Secret k1 carries a value but this apply does not allow secret values." }
{ "kind": "Gadget", "name": "x", "result": "Failed", "message": "Document 1 has unknown kind 'Gadget'. Supported: Secret, PromptTemplate, HarnessProfile, McpServer, WorkspaceTemplate, Agent, Deployment, Pipeline, Trigger, NotificationEndpoint." }
```

A failed item also carries `errorCode` and, when one field is at fault, `errorField`. A spec field with the wrong type or a value it does not accept gives `ManifestInvalid`, and the message names the document, the field, the value, and what the field accepts:

```json
{ "kind": "Secret", "name": "mux-api-key", "result": "Failed", "errorCode": "ManifestInvalid", "errorField": "documents[1].spec.kind",
  "message": "Secret mux-api-key (documents[1]) has an invalid spec: spec.kind is 'Generic', which is not an allowed value. Allowed values: GenericEnv, GenericFile." }
```

Other failures use `ValidationFailed` (for example a name that breaks the naming rules) or the code of a reference or template problem. A reference that does not resolve fails with `MissingSecret` when it names a secret and `ReferenceNotFound` for any other kind, and `errorField` names the reference:

```json
{ "kind": "Deployment", "name": "triage-default", "result": "Failed", "errorCode": "MissingSecret", "errorField": "resources.secrets.github",
  "message": "Reference 'resources.secrets.github' points to Secret 'github-token', which does not exist and is not defined earlier in this manifest." }
```

A few numeric fields have a range and are clamped into it rather than rejected (the same rule as the REST API, listed under "Warnings" in `REST_API.md`). The document still applies, and its item carries a `warnings` entry naming the field, the value you wrote, and the value stored, on a dry run as well as on an apply, and again on every re-apply until you fix the value:

```json
{ "kind": "Deployment", "name": "helper-default", "result": "Created",
  "warnings": [ { "field": "maxAttempts", "code": "ValueClamped", "given": "99", "stored": "10", "message": "maxAttempts 99 is outside the allowed range 1 to 10; 10 was stored." } ] }
```

Warnings use the REST field name, so an agent's `delegation.maxDepth` is reported as `delegationMaxDepth`.

Applying a manifest reads each record it references (a built-in harness profile, a prompt template, an agent) once, however many documents name it, and reuses it for planning, the change diff, and validation; records written earlier in the same apply are read again after the write. A large manifest therefore costs about the same per document as a small one.

Every apply, including dry runs, is recorded. `GET .../manifests/applies` lists them and `GET .../manifests/applies/{id}` returns one with its items.

Manifests never delete anything. Removing a document from a manifest leaves the record in place; delete it through the API or dashboard.

## Exporting

`GET .../manifests/export` returns a bundle: multi-document YAML that `POST .../manifests/apply` accepts as it is. Export needs Read on Manifest.

```bash
curl -s "http://127.0.0.1:8700/v1.0/api/tenants/default/manifests/export" \
  -H "Authorization: Bearer $TOKEN" -o tenant.yaml
```

With no parameters you get every tenant-owned record. Built-ins are left out, but references to them are kept. To export part of a tenant, select what you want:

| Query parameter | Default | Meaning |
|---|---|---|
| `kinds` | none | Comma list of kinds to export in full, such as `Agent,Pipeline`. Any kind except `Secret` and `Bundle` |
| `resources` | none | Comma list of `Kind/name`, such as `Agent/triage,Pipeline/release`. The kind ends at the first `/` |
| `followReferences` | `false` | Also export what the selection depends on (see below) |
| `includeBuiltIn` | `false` | Include the built-in prompt templates and harness profiles the bundle refers to |

`kinds` and `resources` can be used together. An unknown kind answers 400 with field code `UnknownKind`, a `resources` entry without a `/` answers 400 with `InvalidSelector`, and a resource that does not exist in the tenant answers 404.

With `followReferences=true` the bundle carries everything the selection needs:

| Selected | Also exported |
|---|---|
| Agent | Its deployments, the triggers and notification endpoints that target it, the agents in its delegation allow list, and its tool and skill description templates |
| Deployment | Its agent, harness profile, prompt templates, workspace template, and MCP servers |
| Pipeline | Its stage agents (with their own dependencies), pinned deployments, handoff templates, and the triggers that target it |
| Trigger | Its agent or pipeline, deployment, and input template |
| NotificationEndpoint | Its agent and deployment |

Secret values are never exported, and secrets are not documents in a bundle at all. Neither are artifact stores. Both are listed as requirements instead, in a header comment and in the first document, `kind: Bundle`:

```yaml
# Garrison manifest bundle (garrison/v1) exported 2026-10-14T12:00:00Z from tenant default.
# Apply it with POST /v1.0/api/tenants/{tenantId}/manifests/apply (add ?dryRun=true to check it first).
# Secret values are never exported. Create these secrets in the target tenant before applying:
#   - github-token (GitCredential)
apiVersion: garrison/v1
kind: Bundle
metadata:
  name: garrison-bundle
spec:
  exportedUtc: 2026-10-14T12:00:00.0000000Z
  requiredSecrets:
  - name: github-token
    kind: GitCredential
  requiredArtifactStores: []
  requiredBuiltIns:
  - kind: HarnessProfile
    name: builtin/claude-code
---
apiVersion: garrison/v1
kind: Agent
metadata:
  name: triage
...
```

The other documents follow in apply order. Deployments come out with every field, including the default prompt bindings:

```yaml
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: shouter-fake
spec:
  agent: shouter
  harnessProfile: builtin/fake
  maxAttempts: 1
  maxConcurrentRuns: 0
  parameters:
    format: claude
  prompts:
    DelegatedTask: builtin/delegated-task
    System: builtin/default-system
    Task: shouty-task@1
  resources:
    mcpServers: []
    secrets:
    - alias: github
      secret: github-token
  effectPolicy: AtMostOnce
  weight: 100
```

### Moving an agent to another tenant

Export one agent with what it depends on:

```bash
curl -s "http://127.0.0.1:8700/v1.0/api/tenants/default/manifests/export?resources=Agent/triage&followReferences=true" \
  -H "Authorization: Bearer $TOKEN" -o triage.yaml
grep '^#   - ' triage.yaml
```

The `grep` prints the secrets the target needs. Check the bundle against the target tenant first. Until the secrets exist, the dry run reports the `Bundle` document and every document that uses them as `Failed` with `MissingSecret`, and nothing is written:

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/team-b/manifests/apply?dryRun=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/yaml" --data-binary @triage.yaml \
  | jq '.items[] | select(.result == "Failed") | {kind, name, errorCode, errorField}'
```

Create each secret in the target tenant, with its value:

```bash
curl -s -X POST http://127.0.0.1:8700/v1.0/api/tenants/team-b/secrets \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"github-token","kind":"GitCredential","value":"..."}'
```

Then apply. A second apply of the same file reports every document `Unchanged`:

```bash
curl -s -X POST http://127.0.0.1:8700/v1.0/api/tenants/team-b/manifests/apply \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/yaml" --data-binary @triage.yaml \
  | jq '{createdCount, updatedCount, unchangedCount, failedCount}'
```

The dashboard does the same under Configuration, Manifests: choose what to export and download the bundle, then paste or upload it in the target tenant and use **Dry run** and **Apply**. Over MCP, `garrison_export_manifest` takes the same selectors (see [MANAGEMENT_MCP.md](MANAGEMENT_MCP.md)).

A webhook trigger or notification endpoint applied from a bundle gets a new signing secret in the target tenant; rotate it there to read it. Triggers run as the principal that applied the bundle.

## Kinds

### Bundle

```yaml
apiVersion: garrison/v1
kind: Bundle
metadata:
  name: garrison-bundle
spec:
  requiredSecrets:
  - name: github-token
    kind: GitCredential
  requiredArtifactStores: [reports]
  requiredBuiltIns:
  - kind: PromptTemplate
    name: builtin/default-system
```

Export writes this document; you rarely write one yourself. Applying it changes nothing. It checks that each required secret exists in the tenant (or is a `Secret` document in the same manifest), and that each artifact store and built-in exists. When everything is there the item is `Unchanged`. Otherwise it fails with `errorCode` `MissingSecret`, `MissingArtifactStore`, or `MissingBuiltIn` and `errorField` such as `spec.requiredSecrets[0]`, and because apply is all or nothing, the rest of the bundle is not written either. `exportedUtc` is informational.

Built-in documents (names starting with `builtin/`, written by an export with `includeBuiltIn=true`) are never applied. Such a document reports `Unchanged` when the built-in exists in the target and fails with `MissingBuiltIn` when it does not; built-ins themselves are managed by the server.

### Secret

```yaml
apiVersion: garrison/v1
kind: Secret
metadata:
  name: anthropic-key
  description: Anthropic API key for code review agents
spec:
  kind: AnthropicApiKey
```

`kind` is one of `AnthropicApiKey`, `ClaudeCodeOAuthToken`, `OpenAiApiKey`, `CodexAuthJson`, `GeminiApiKey`, `GenericEnv`, `GenericFile`, `BearerToken`, `BasicAuth`, or `GitCredential`. `value` (only with `allowSecretValues=true`) and `expiresUtc` are optional. The usual pattern is to declare secrets without values in the manifest and set the values once through the API or dashboard; later applies leave the stored value alone. In the dashboard, that is Configuration, Secrets, then the secret's **Set value** action. Through the API, create the secret with its value before applying (`POST .../secrets` with `name`, `kind`, and `value`), or set it afterwards with `PUT .../secrets/{id}/value` and `{"value":"..."}`. `docs/QUICKSTART.md` walks through both, with a complete multi-agent manifest in `examples/multi-agent.yaml`.

### PromptTemplate

```yaml
apiVersion: garrison/v1
kind: PromptTemplate
metadata:
  name: reviewer-system
spec:
  kind: System
  content: |
    You are {{agent.name}}, a careful code reviewer.
    Report problems as a numbered list, most severe first.
    {{#if garrison.delegationEnabled}}

    {{> builtin/garrison-tools-instructions}}
    {{/if}}
```

A change to `content` creates a new version, exactly as an edit through the API does. The content is checked for syntax errors when the manifest is validated.

### HarnessProfile

Any CLI can be described here; see `docs/HARNESSES.md` for every field.

```yaml
apiVersion: garrison/v1
kind: HarnessProfile
metadata:
  name: acme-agent
  description: The Acme CLI in headless JSON-lines mode
spec:
  harnessType: Generic
  executable: acme
  promptDelivery: Stdin
  systemPromptDelivery: Argument
  systemPromptTarget: --system
  outputParser: GenericJsonl
  genericTextField: delta.text
  genericFinalField: result
  genericSuccessField: status
  genericSuccessValue: ok
  resultSource: ParserFinalEvent
  successPolicy: FinalEventAndExitCode
  successExitCodes: [0]
  defaultTimeoutSeconds: 600
  isolateHome: true
  arguments:
    - template: run
    - template: --json
    - template: --model
      condition: "{{deployment.model}}"
    - template: "{{deployment.model}}"
      condition: "{{deployment.model}}"
    - template: --cwd
    - template: $GARRISON_WORKSPACE_DIR
  environment:
    - name: ACME_API_KEY
      valueTemplate: "{{secret.acme}}"
      isSecret: true
  credentialEnvironmentAllowlist: [ACME_API_KEY]
  probeArguments: [--version]
```

Quote templates that start with `{{`, or YAML will read them as a mapping.

### McpServer

```yaml
apiVersion: garrison/v1
kind: McpServer
metadata:
  name: docs-search
spec:
  transport: Http
  url: http://docs-search.tools.svc:8080
  path: /mcp
  required: true
  requiredTools: [search]
  toolTimeoutSeconds: 120
```

HTTP servers take `url`, `path`, and `headers` (a list of `name` and `valueTemplate`, which may reference secrets). Stdio servers take `transport: Stdio`, `command`, `arguments`, and `environment`. `required` and `requiredTools` drive the worker's pre-flight check. The name `garrison` is reserved.

### WorkspaceTemplate

```yaml
apiVersion: garrison/v1
kind: WorkspaceTemplate
metadata:
  name: garrison-repo
spec:
  kind: GitRepository
  gitUrl: https://github.com/jchristn/Garrison.git
  gitRef: main
  gitDepth: 1
  retention: KeepOnFailure
```

`gitCredentialSecret` names a `GitCredential` secret for private repositories. `files` seeds files into the workspace.

`kind: PersistentVolume` with `persistentVolumeClaim: <claim>` mounts an existing PersistentVolumeClaim at the workspace path of each run pod, so its contents persist between runs. Only deployments with `executor: KubernetesJob` can use it (see `docs/KUBERNETES.md`, "Pod-per-run executor").

### Agent

```yaml
apiVersion: garrison/v1
kind: Agent
metadata:
  name: reviewer
  description: Reviews a change and lists problems
spec:
  displayName: Code Reviewer
  tags: [review, code]
  exposure:
    a2a: true
  delegation:
    allow: [docs-echo]
    maxDepth: 1
```

Agents accept a few shorthands:

| Shorthand | Same as |
|---|---|
| `exposure.a2a`, `exposure.mcpTool`, `exposure.toolName` | `exposeA2A`, `exposeMcpTool`, `mcpToolName` |
| `delegation.mode`, `delegation.allow`, `delegation.maxDepth`, `delegation.allowRecursion` | `delegationMode`, `delegationAllowList`, `delegationMaxDepth`, `delegationAllowRecursion`. Without `mode`, a non-empty `allow` means `AllowList` and anything else means `None` |
| `inputSchema`, `outputSchema` as YAML mappings | `inputSchemaJson`, `outputSchemaJson` |
| `toolDescriptionTemplate`, `skillDescriptionTemplate` | The prompt template, by name |

Both schemas must be valid JSON Schema documents; one that is not fails the document with field code `InvalidJsonSchema`. An agent with an input schema only accepts input that is a JSON document matching it, on every surface (see "Input schemas" in `REST_API.md`), and the dashboard's Invoke page builds a form from it:

```yaml
spec:
  inputMode: Structured
  inputSchema:
    type: object
    required: [topic]
    properties:
      topic: { type: string, description: What to research }
      depth: { type: integer, minimum: 1, maximum: 5, default: 2 }
```

### Deployment

```yaml
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: reviewer-claude
spec:
  agent: reviewer
  harnessProfile: builtin/claude-code
  model: sonnet
  effort: high
  maxTurns: 30
  timeoutSeconds: 900
  workspace: garrison-repo
  prompts:
    System: reviewer-system
  resources:
    secrets:
      - alias: anthropic
        secret: anthropic-key
    mcpServers:
      - alias: docs
        server: docs-search
  parameters:
    permissionMode: acceptEdits
  allowedRunOverrides:
    - name: model
      validation: Enum
      pattern: sonnet,opus
  nodeSelector:
    garrison.io/harness-claude: "true"
```

| Field | Meaning |
|---|---|
| `agent`, `harnessProfile` | By name. Built-in profiles use their `builtin/` names |
| `prompts` | Role to template name. Append `@<version>` to pin a version (`shouty-task@1`). Roles you leave out get the built-in defaults |
| `resources.secrets`, `resources.mcpServers` | Bindings with the alias templates use (`{{secret.anthropic}}`) |
| `workspace`, `artifactStore` | By name |
| `parameters`, `nodeSelector` | Maps of strings. Quote values YAML would read as numbers or booleans |
| `allowedRunOverrides`, `argumentOverrides`, `environmentOverrides`, `fileOverrides` | Lists, as in the REST API |
| `approvalsEnabled`, `approvalDefaultAction`, `approvalTimeoutSeconds`, `approvalTimeoutDecision`, `approvalRules` | Permission approvals, as in the REST API. Rules are a list of `action`, `pattern`, and optional `inputPattern` and `description`; applying a manifest keeps the identifiers of rules that did not change |
| `model`, `fallbackModel`, `effort`, `maxTurns`, `maxBudgetUsd`, `timeoutSeconds`, `maxConcurrentRuns`, `maxAttempts`, `weight` | As in the REST API |
| `effectPolicy` | `AtMostOnce`, `AtLeastOnce`, or `Journaled`: what happens to a run that was already running when its worker was lost (see "Effect policy" in `REST_API.md`). Omit it for `AtMostOnce`; export always writes it. `Journaled` behaves as `AtMostOnce` until the effect journal exists |
| `retryOnNodeLoss` | Deprecated; use `effectPolicy`. Still accepted for one release: `true` means `AtLeastOnce` and `false` means `AtMostOnce`. A document that sets both with different meanings fails with `errorCode` `EffectPolicyConflict` and `errorField` `effectPolicy` (also on a dry run). Export never writes it, so an exported document that used it re-applies unchanged with `effectPolicy` instead |
| `executor` | `Process` or `KubernetesJob` (a pod per run). Omit it to use the node pool's default, then `Process` (an `Untrusted` deployment never resolves to `Process` and uses `KubernetesJob`) |
| `trustLevel` | `Trusted` or `Untrusted`. Omit it for `Trusted`; export writes it only for `Untrusted` deployments. `Untrusted` runs need at least Container isolation and wait in the queue (`NoIsolatingWorker`) until a worker can provide it. In a tenant with `requireUntrustedDeployments`, a document that creates or changes a `Trusted` deployment fails with `errorCode` `TenantRequiresUntrusted` and `errorField` `trustLevel`; an unchanged existing deployment is left alone |
| `podResources` | Run pod `cpuRequest`, `cpuLimit`, `memoryRequest`, `memoryLimit`, `ephemeralStorageRequest`, `ephemeralStorageLimit` for `KubernetesJob` runs. It is not called `resources` because that key holds the secret and MCP server bindings |
| `egressRules` | Egress allowlist: a list of `cidr` (required), `port` (1 to 65535; omit for every port), and `protocol` (`TCP`, the default, or `UDP`), at most 64. Omit it for no allowlist; export writes it only for deployments that have rules. Runs of a deployment with rules reach only DNS, the Garrison MCP port, and the rules, and wait in the queue (`NoIsolatingWorker`) until a worker enforces them. An invalid rule fails the document with `errorCode` `InvalidCidr`, `PortOutOfRange`, or `TooManyEgressRules` and `errorField` such as `egressRules[0].cidr` |

### Pipeline

A pipeline runs agents in order, each stage seeing the previous stage's result, with optional review gates (see [PIPELINES.md](PIPELINES.md)). Stages refer to agents, deployments, and handoff templates by name, so the same document works in any tenant that has those agents. Pipelines are applied last, after the agents and deployments in the same manifest.

```yaml
apiVersion: garrison/v1
kind: Pipeline
metadata:
  name: release-notes
  description: Draft release notes, have a person check them, then edit
spec:
  maxDurationSeconds: 86400
  stages:
    - name: draft
      agent: writer
      requiresReview: true
      reviewTimeoutSeconds: 14400
      reviewTimeoutAction: Reject
      maxRevisions: 2
    - name: edit
      agent: editor
      deployment: editor-claude
      handoffTemplate: edit-handoff@2
      maxAttempts: 2
      outputCharLimit: 32000
      parameters:
        model: opus
```

| Field | Meaning |
|---|---|
| `description`, `maxDurationSeconds`, `active` | As in the REST API. `maxDurationSeconds` 0 or absent means no limit; `active` defaults to true |
| `stages` | The stages in run order, 1 to `Runtime.PipelineMaxStages` (default 20) |
| `stages[].name`, `stages[].description` | Stage name, unique within the pipeline, and an optional description |
| `stages[].agent` | The agent, by name |
| `stages[].deployment` | One of that agent's deployments, by name. Leave it out for the agent's weighted deployment selection |
| `stages[].handoffTemplate` | A `Task` template rendered as the stage's `PipelineStage` prompt, by name. Append `@<version>` to pin a version |
| `stages[].outputCharLimit`, `maxAttempts`, `continueOnFailure`, `requiresReview`, `reviewTimeoutSeconds`, `reviewTimeoutAction`, `maxRevisions` | As in the REST API; fields you leave out take the stage defaults (16000, 1, false, false, 0, `Reject`, 3) |
| `stages[].parameters` | A map of run parameter overrides. They must be allowed run overrides of the named `deployment`, so a stage with parameters needs one. Quote values YAML would read as numbers or booleans |

Applying a changed Pipeline document replaces its stages and increases the pipeline's version; pipeline runs that already started keep their own copy of the stages. An unchanged document reports `Unchanged` and keeps the version. A protected pipeline cannot be changed by a manifest. Export writes every tenant pipeline in this form and leaves out fields that hold their defaults.

### Trigger

A trigger starts an agent run or a pipeline run on a cron schedule or when a signed webhook arrives (see [TRIGGERS.md](TRIGGERS.md)). Triggers are applied after pipelines, so they can name agents, deployments, pipelines, and templates from the same manifest.

```yaml
apiVersion: garrison/v1
kind: Trigger
metadata:
  name: nightly-report
  description: Summarize yesterday's failed runs
spec:
  type: Cron
  agent: reporter
  deployment: reporter-claude
  inputTemplate: nightly-report-input
  cron: "0 6 * * *"
  timeZone: Europe/Berlin
```

| Field | Meaning |
|---|---|
| `type` | `Cron` (the default) or `Webhook`. Applying a document with a different type to an existing trigger fails with `TypeImmutable`; delete the trigger first |
| `agent`, `deployment` | The agent to run and, optionally, one of its deployments, by name |
| `pipeline` | The pipeline to start, by name. Give either `agent` or `pipeline`, not both |
| `inputTemplate` | A `Task` template by name. Leave it out for `builtin/trigger-input` |
| `priority`, `active` | As in the REST API; default 0 and true |
| `cron`, `timeZone` | Cron triggers only. `timeZone` defaults to `UTC`. A dry run reports an invalid expression (`InvalidCron`) or zone (`InvalidTimeZone`) |
| `signingSecret` | Webhook triggers only, and only in an apply with `allowSecretValues=true` (which also needs `Secret.Create`) |

A trigger that the apply creates or changes runs as the principal that applied the manifest; an `Unchanged` trigger keeps its run-as principal. A new webhook trigger without `signingSecret` gets a generated secret that the apply result does not show (its message says so); read it by rotating it with `POST .../triggers/{id}/rotate-secret`. Export writes `type`, the target, the template, the schedule, and non-default fields, and never the secret.

### NotificationEndpoint

A notification endpoint receives signed notifications about runs, pipeline runs, and approvals (see [NOTIFICATIONS.md](NOTIFICATIONS.md)).

```yaml
apiVersion: garrison/v1
kind: NotificationEndpoint
metadata:
  name: ops-alerts
spec:
  url: https://hooks.example.com/garrison
  events: [RunFailed, RunTimedOut, PipelineFailed, ApprovalRequested]
  agent: reporter
  includeResultText: false
```

| Field | Meaning |
|---|---|
| `url` | `http` or `https`. A refused destination fails with `DestinationBlocked`, already in a dry run |
| `events` | One or more of `RunSucceeded`, `RunFailed`, `RunCancelled`, `RunTimedOut`, `PipelineCompleted`, `PipelineFailed`, `ApprovalRequested` |
| `agent`, `deployment` | Optional filters, by name |
| `includeResultText`, `resultTextMaxChars`, `active` | As in the REST API; default false, 1000, and true |
| `signingSecret` | Only in an apply with `allowSecretValues=true` |

As with triggers, a new endpoint without `signingSecret` gets a generated secret that you read by rotating it, and export never includes it.

## A complete example on the fake harness

This manifest needs no API keys and runs on any worker that has the fake harness. Apply it, then invoke the agent:

```yaml
apiVersion: garrison/v1
kind: PromptTemplate
metadata:
  name: shouty-task
spec:
  kind: Task
  content: "Please answer loudly: {{input.message | upper}}"
---
apiVersion: garrison/v1
kind: Agent
metadata:
  name: shouter
  description: Repeats the request in capitals
spec:
  exposure:
    a2a: true
---
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: shouter-fake
spec:
  agent: shouter
  harnessProfile: builtin/fake
  prompts:
    Task: shouty-task@1
  parameters:
    format: claude
```

```bash
curl -s -X POST http://127.0.0.1:8700/v1.0/api/tenants/default/manifests/apply \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/yaml" --data-binary @shouter.yaml
curl -s -X POST http://127.0.0.1:8700/v1.0/api/tenants/default/agents/shouter/invoke \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"input":"hello","wait":true}'
```

The run succeeds with `"resultText": "Echo: Please answer loudly: HELLO"`. Applying the manifest a second time reports three `Unchanged` items.

## Artifact collection

Deployments may set `artifactStoreId` and explicit `artifactGlobs`, for example `["reports/**/*.json"]`. Empty globs disable collection. See [Run artifacts](ARTIFACTS.md) for filesystem/S3 configuration, limits, downloads, and API examples.

## MCP configuration clients

Developer/user credentials may call `garrison_apply_manifest` with the same YAML/JSON text, dry-run and inline-secret options as REST. `garrison_export_manifest` takes the same selectors as REST export and returns the bundle YAML, which never carries secret values. Existing permissions still apply; hosted run tokens cannot manage configuration. See [management MCP](MANAGEMENT_MCP.md).
