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
| `kind` | `Secret`, `PromptTemplate`, `HarnessProfile`, `McpServer`, `WorkspaceTemplate`, `AgentAsset`, `Agent`, `Deployment`, `Pipeline`, `AgenticApp`, `Trigger`, `Mandate`, `Organization`, `NotificationEndpoint`, or `Bundle` (the requirements document an export starts with, see [Bundle](#bundle)) |
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
| `force` | `false` | Let an `Organization` document undo changes approved through executive proposals since the organization's last manifest apply. Without it, such a document fails with `OrganizationDrift` (see [Organization](#organization)) |

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

A failed item also carries `errorCode` and, when one field is at fault, `errorField`. A document that would send a secret's value somewhere (a deployment's `resources.secrets`, an MCP server or harness profile that renders a deployment's secrets, a workspace template's git credential, or an agent's remote credential) fails with `SecretUseDenied` unless the caller holds `Execute` on that secret, for example through the `SecretManager` or `SecretUser` role; see "Using secrets" in `REST_API.md`. A spec field with the wrong type or a value it does not accept gives `ManifestInvalid`, and the message names the document, the field, the value, and what the field accepts:

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
| Agent | Its deployments, the triggers, mandates, and notification endpoints that target it, the agents in its delegation allow list, and its tool and skill description templates |
| Deployment | Its agent, harness profile, prompt templates, workspace template, and MCP servers |
| Pipeline | Its stage agents (with their own dependencies), pinned deployments, handoff templates, and the triggers that target it |
| Trigger | Its agent or pipeline, deployment, and input template |
| Mandate | Its agent and deployment |
| Organization | The agents, mandates, and apps its units name |
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

A webhook trigger or notification endpoint applied from a bundle gets a new signing secret in the target tenant; rotate it there to read it. Triggers and mandates run as the principal that applied the bundle.

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

### AgentAsset

```yaml
apiVersion: garrison/v1
kind: AgentAsset
metadata:
  name: citation-style
spec:
  kind: Skill
  description: How to cite sources
  tags: [writing]
  files:
    - path: SKILL.md
      content: |
        # Citations
        Use author-date.
    - path: examples/logo.png
      contentBase64: iVBORw0KGgo...
```

| Field | Meaning |
|---|---|
| `kind` | `SystemPrompt`, `Skill`, `ReferenceFile`, or `DocumentTemplate`. Cannot change on an existing asset |
| `promptTemplate` | For `SystemPrompt` only, required there (field code `AssetTemplateRequired`) |
| `artifactStore` | By name. Omit to keep the files in the Garrison database. Cannot change once the asset has versions |
| `files` | The files of the current version: `path`, optional `mediaType`, and `content` (text), `contentBase64`, or `sha256` (a reference to content the tenant already holds). A changed file list uploads a new version; the same list is unchanged. Omit `files` to leave the versions alone |
| `changeNote` | Note of a version this document creates |

Export writes text files up to 256 KiB inline and binary files by reference (`sha256`, `sizeBytes`, and a `note`). Applying a reference that the target asset does not already hold fails with `errorCode` `AssetContentMissing`; upload the file there first. See [ASSETS.md](ASSETS.md).

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
| `toolDescriptionTemplate`, `skillDescriptionTemplate` | The prompt template, by name |

An agent's content is kept as revisions (see [REVISIONS.md](REVISIONS.md)). Applying an Agent document normally publishes its content as the next revision when it changed. Add a `revision` block to write it as the agent's draft instead, leaving what runs alone until the draft is published:

```yaml
spec:
  description: Reviews a change and lists problems, worst first
  revision:
    publish: false
    changeNote: Order findings by severity
```

An Agent document can also pin assets with `assets: [ { asset: citation-style }, { asset: report-template, version: 2 } ]`. Without an `assets` key the agent keeps its current pins; with one, the next revision carries exactly that list. Export writes the latest published revision's pins, and `followReferences` adds the pinned AgentAsset documents.

In the same way, `capabilities: [pandoc]` names the capabilities the agent's next revision uses, such as host tools a worker must report before it runs the agent ([CAPABILITIES.md](CAPABILITIES.md)). Without a `capabilities` key the agent keeps its current list, and export writes the latest published revision's list.

With `publish: false`, only the revision content fields (description, display name, schemas, delegation policy, tags, prompt templates) go into the draft; the agent's other fields stay as they are. A new agent is always created with its content as revision 1, published.

`inputSchema` and `outputSchema` are YAML mappings (JSON objects in a JSON manifest), the same shape the REST API uses. Export writes them as mappings too. Both schemas must be valid JSON Schema documents; one that is not fails the document with field code `InvalidJsonSchema`. An agent with an input schema only accepts input that is a JSON document matching it, on every surface (see "Input schemas" in `REST_API.md`), and the dashboard's Invoke page builds a form from it:

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

The generated form supports primitive fields, enums, arrays of primitives, and one level of nested object fields. More complex properties use a JSON editor; schemas without an object root with properties use the raw JSON editor for the whole input. Invoke also lets you switch between Form and JSON. The server still validates the full schema and returns field errors, including constraints the form does not check locally.

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
| `environment` | Environment label from the tenant's list (default `dev`; export omits it when `dev`). A name outside the list fails the document with field code `UnknownEnvironment` |
| `agentRevision` | A published revision number of the agent to pin. Omit it to follow the latest published revision. Numbers keep a bundle portable: in another tenant the number resolves to that tenant's revision. An agent created by the same bundle has only revision 1. An unknown number fails the document with `errorCode` `UnknownRevision` |
| `prompts` | Role to template name. Append `@<version>` to pin a version (`shouty-task@1`). Roles you leave out get the built-in defaults |
| `resources.secrets`, `resources.mcpServers` | Bindings with the alias templates use (`{{secret.anthropic}}`) |
| `workspace`, `artifactStore` | By name |
| `parameters`, `nodeSelector` | Maps of strings. Quote values YAML would read as numbers or booleans |
| `allowedRunOverrides`, `argumentOverrides`, `environmentOverrides`, `fileOverrides` | Lists, as in the REST API |
| `approvalsEnabled`, `approvalDefaultAction`, `approvalTimeoutSeconds`, `approvalTimeoutDecision`, `approvalRules` | Permission approvals, as in the REST API. Rules are a list of `action`, `pattern`, and optional `inputPattern` and `description`; applying a manifest keeps the identifiers of rules that did not change |
| `model`, `fallbackModel`, `effort`, `maxTurns`, `maxBudgetUsd`, `timeoutSeconds`, `maxConcurrentRuns`, `maxAttempts`, `weight` | As in the REST API |
| `effectPolicy` | `AtMostOnce`, `AtLeastOnce`, or `Journaled`: what happens to a run that was already running when its worker was lost (see "Effect policy" in `REST_API.md`). Omit it for `AtMostOnce`; export always writes it. `Journaled` behaves as `AtMostOnce` until the effect journal exists |
| `retryOnNodeLoss` | Deprecated; use `effectPolicy`. Still accepted for one release: `true` means `AtLeastOnce` and `false` means `AtMostOnce`. A document that sets both with different meanings fails with `errorCode` `EffectPolicyConflict` and `errorField` `effectPolicy` (also on a dry run). Export never writes it, so an exported document that used it re-applies unchanged with `effectPolicy` instead |
| `managementAccess` | `Drafts` lets the deployment's runs work on studio drafts for the person who started them ([STUDIO.md](STUDIO.md#delegated-management)). `OrgSubtree` makes the agent an executive that drafts changes to the units below the one it leads ([EXECUTIVES.md](EXECUTIVES.md)); the agent must lead exactly one unit, or the document fails with `errorCode` `NotAUnitLead` or `LeadsSeveralUnits` and `errorField` `managementAccess`. An Organization in the same bundle may make it the lead. Omit it for `None`; export omits `None`. A deployment of `agent-architect` always has `Drafts` |
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

### AgenticApp

```yaml
apiVersion: garrison/v1
kind: AgenticApp
metadata:
  name: research
  description: Research overviews
spec:
  slug: research
  entry: orchestrator
  members:
    - { agent: orchestrator, role: Talks to people and plans the work }
    - { agent: researcher }
  edges:
    - { from: orchestrator, to: researcher, fanOut: true }
  environments:
    - { environment: dev, deployment: orchestrator-dev }
  liveEnvironment: dev
  authMode: Anonymous
  anonymousEnabled: true
  showOperatorDetail: false
  branding:
    displayName: Research Desk
    logo: research-logo
    primaryColor: "#1F6FEB"
    backgroundColor: "#F6F8FA"
    headerColor: "#0D1117"
    agentBubbleColor: "#EAEEF2"
    conversationListColor: "#F0F3F6"
    composerColor: "#FFFFFF"
    filesColor: "#F0F3F6"
    font: Serif
    favicon: research-icon
    welcomeText: Ask for an overview of any topic.
    subtitle: Sourced overviews in minutes
    paletteId: harbor
    darkPrimaryColor: "#58A6FF"
    themeDefault: System
    cornerStyle: Rounded
    starterPrompts:
      - Give me an overview of solid-state batteries
      - What changed in EU AI rules this year?
```

| Field | Meaning |
|---|---|
| `slug` | The app's URL name, unique across the cluster. Default: the name |
| `entry` | The member that talks to end users |
| `members` | Each `agent` by name, with an optional `role` |
| `edges` | Calls members may make, `from` and `to` by agent name, with an optional `fanOut` flag. Every member must be reachable from the entry agent, and the edges may not form a cycle |
| `environments` | The entry deployment per environment, by name. Without `deployment`, the app uses the entry agent's first active deployment in that environment |
| `liveEnvironment` | The environment the app UI talks to. Default `dev` |
| `authMode`, `anonymousEnabled`, `showOperatorDetail` | Sign-in and what end users see, as in [APPS.md](APPS.md#sign-in) |
| `branding` | `displayName` (any characters, up to 128; the app's `metadata.name` and `slug` stay lowercase letters, digits, and hyphens), `logo` (an `AgentAsset` by name; its first image is the logo), `primaryColor`, `accentColor`, `backgroundColor`, `headerColor`, `agentBubbleColor`, `conversationListColor`, `composerColor`, `filesColor`, `font` (`System`, `Sans`, `Serif`, `Rounded`, `Mono`; default `System`), `favicon` (an `AgentAsset` by name, shown as the browser tab icon; without it the logo is used), `welcomeText`. Appearance keys: `subtitle`, `welcomeTitle`, `composerPlaceholder`, `agentDisplayName`, `agentAvatar` (an `AgentAsset` by name, stored as `agentAvatarAssetId`), `paletteId`, the eight dark colors (`darkPrimaryColor` through `darkFilesColor`), `themeDefault` (`System`, `Light`, `Dark`), `allowThemeSwitch`, `cornerStyle` (`Sharp`, `Rounded`, `Pill`), `density` (`Compact`, `Comfortable`), `showFilesPanel`, `showLanguagePicker`, `showPoweredBy`, and `starterPrompts` (a list of up to 4). Colors are `#rgb` or `#rrggbb`. Export writes every key the app sets and leaves out defaults. See [APPS.md](APPS.md#branding) for what each one does |
| `active` | Whether the app accepts sessions. Default `true`; set `false` to close the app to end users without deleting it |

Agents, deployments, and the logo, favicon, and avatar assets can come from the same bundle. Apps sort after pipelines, so their members already exist when the app is applied. Export with `followReferences` brings the members, their deployments, and what those refer to, which is how the studio starts a draft from a live app ([STUDIO.md](STUDIO.md#starting-from-an-app)). [examples/agentic-apps](../examples/agentic-apps/README.md) has two complete bundles.

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

### Mandate

A mandate is a keeper's standing job: Garrison wakes the agent on a schedule to look after it (see [KEEPERS.md](KEEPERS.md)). Mandates are applied after triggers, so they can name agents and deployments from the same manifest.

```yaml
apiVersion: garrison/v1
kind: Mandate
metadata:
  name: support-queue
  description: Watches the support inbox
spec:
  agent: support-agent
  deployment: support-agent-prod
  revision:
    objective: Keep the support queue under 20 open tickets.
    healthyDefinition: Fewer than 20 open tickets and none older than a day.
    autonomy: Answer password resets and close duplicates.
    escalationPolicy: Ask a person before refunding anything.
    signals:
      - name: open tickets
        description: Count in the support inbox
    wakeMode: Backoff
    minIntervalSeconds: 900
    maxIntervalSeconds: 14400
    backoffFactor: 2
```

| Field | Meaning |
|---|---|
| `agent`, `deployment` | The hosted agent that keeps the mandate and the active deployment its ticks run on, by name. Applying a document with a different agent to an existing mandate fails with `Immutable`; delete it first |
| `paused` | `true` to create it paused, or to pause it. `false` or absent means active, so applying a document without it resumes a paused mandate |
| `revision` | Required, with at least an `objective`. The other fields are those of a `MandateRevision` in the REST API, including `direction`, `jitterPercent`, the budgets, `briefIntervalHours` (AA10), `changeNote`, and the default escalation target `escalationTargetKind` and `escalationTargetId` (see [Escalations](ESCALATIONS.md)) |

An apply compares `revision` with the mandate's current revision. When they differ it publishes a new revision, so the keeper wakes at once with its interval reset; when they match, the revision is `Unchanged` and nothing wakes. Interval values outside the cluster bounds are adjusted before the comparison, as over REST, so a manifest asking for a 30 second minimum stays `Unchanged` on the second apply. A mandate the apply creates or changes runs as the principal that applied the manifest. A revision written by an apply has source `Human`, or `Architect` when Agent Studio applies a draft. Export writes the agent, deployment, `paused` when it is paused, and the current revision's non-default fields.

### Organization

An organization is a tree of org units with lead agents, members, peer lines, and budgets (see [ORGANIZATIONS.md](ORGANIZATIONS.md)). Units nest under their parents, so the document reads like the chart. Organizations are applied after mandates, so a unit can name agents and mandates from the same manifest.

```yaml
apiVersion: garrison/v1
kind: Organization
metadata:
  name: support-org
spec:
  description: Customer support
  mission: Answer every customer within a day.
  units:
    - name: leadership
      lead: support-lead
      leadTitle: Head of support
      leadMandate: support-lead-keeper
      budgets:
        - { period: Day, amountUsd: 20 }
      units:
        - name: triage
          lead: triage-lead
          members:
            - { agent: classifier, title: Classifier, mandate: classifier-keeper }
          peers: [billing]
          budgets:
            - { period: Day, amountUsd: 5 }
        - name: billing
          lead: billing-lead
          app: billing-app
```

| Field | Meaning |
|---|---|
| `description`, `mission` | As in the REST API |
| `budgetFreezeMarginPercent` | 0 to 100, default 10: how far past a unit budget its subtree may spend before the unit is frozen automatically. A value outside the range fails the document with field code `OutOfRange` on `spec.budgetFreezeMarginPercent`. Exports carry it when it is not 10. In an executive's draft, a change to it is refused like the description and mission |
| `publish` | `false` writes the working tree without publishing it. Absent or `true` publishes it as a new revision when it differs from the live one. In an executive's draft the flag is ignored: the document is applied with `publish: false`, and the revision Garrison records for the apply publishes the tree ([EXECUTIVES.md](EXECUTIVES.md#revisions-revert-drafts-and-rollback)) |
| `units` | The root unit, with every other unit nested under its parent in `units`. At most one root |
| `units[].name` | Unique in the organization. A unit keeps its identifier across applies by name, so memory and history stay attached |
| `units[].lead`, `leadTitle`, `leadMandate` | The lead agent by name, its title, and its mandate, which must belong to the lead |
| `units[].app` | An agentic app by name |
| `units[].members` | `agent`, optional `title`, and optional `mandate` (a mandate of that agent) |
| `units[].peers` | Names of other units of the organization this unit has peer lines with |
| `units[].budgets` | `period` (`Day` or `Month`, default `Day`) and `amountUsd`, more than 0 and no more than the nearest ancestor's budget for the same period |

The tree is checked with the same rules as the REST API: one root, unique unit names, one position per agent, active agents, mandates owned by their agents, peers inside the organization, and child budgets within their parent's. A broken tree fails the document with the rule's code, such as `OneRoot`, `LeadsTwoUnits`, or `BudgetExceedsParent`, in the field code of `spec.units`.

Applying replaces the organization's working tree with the document's units. When the document publishes, Garrison snapshots the tree as a new revision that pins the current revision of every mandate it names, makes it live, and writes a promotion record with subject Organization. A second apply of the same document is `Unchanged` and publishes nothing. An apply that fails later in the same manifest restores the earlier working tree; a revision it already published stays in the organization's history, and [rollback](ORGANIZATIONS.md) returns to the earlier one. A retired organization refuses the document with `OrganizationRetired`. Export writes the working tree with names in place of identifiers.

The changes an apply reports for an organization match units by name, members by agent, budgets by period, and peers as a set, wherever they sit in the tree. Listing units, members, or peers in a different order is `Unchanged` and publishes nothing. A removed unit is one change, `units.uptime`, whose before value says what the unit held (`unit uptime (lead uptime-keeper; budgets Day (amountUsd 2); under reliability)`). Other paths read `units.latency.peers.dependencies`, `units.latency.members.probe.title`, `units.latency.budgets.Day.amountUsd`, and `units.dependencies.parent` for a unit that moved. Studio diffs and executive proposals show the same paths.

An executive's approved proposal publishes its own revision (see [EXECUTIVES.md](EXECUTIVES.md#revisions-revert-drafts-and-rollback)), and a manifest written before it does not know about it. When an Organization document would publish a tree that undoes a change from such a revision published since the organization's last manifest apply, the document fails with `errorCode` `OrganizationDrift` and `errorField` `spec.units`, on a dry run too. The message names the revisions and drafts and each change it would undo, for example `units.latency.peers.dependencies: dependencies to none`, and the item's `changes` list exactly those changes. Nothing is written. Either add the changes to the manifest (export the organization for its current tree) or apply again with `?force=true` to overwrite them. A document that keeps the approved changes and changes other things applies as usual, and once a manifest apply publishes, later applies compare against that revision. An organization rollback past executive revisions always goes through. The `garrison_apply_manifest` tool has no `force` argument, so a run never overwrites an approved change this way.

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
| `events` | One or more of `RunSucceeded`, `RunFailed`, `RunCancelled`, `RunTimedOut`, `PipelineCompleted`, `PipelineFailed`, `ApprovalRequested`, `EscalationRaised`, `EscalationExpired` |
| `escalationMinimumSeverity` | Optional `Info`, `Warning`, or `Urgent`: escalation events below it are not sent |
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
