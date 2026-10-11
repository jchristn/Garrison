# Manifests

A manifest describes a tenant's configuration (secrets, prompt templates, harness profiles, MCP servers, workspace templates, agents, and deployments) as YAML or JSON documents you can keep in source control, review, and apply to any Garrison. Applying the same manifest twice changes nothing. Exporting a tenant gives you a manifest that recreates it.

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
| `kind` | `Secret`, `PromptTemplate`, `HarnessProfile`, `McpServer`, `WorkspaceTemplate`, `Agent`, or `Deployment` |
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
{ "kind": "Gadget", "name": "x", "result": "Failed", "message": "Document 1 has unknown kind 'Gadget'. Supported: Secret, PromptTemplate, HarnessProfile, McpServer, WorkspaceTemplate, Agent, Deployment." }
```

Every apply, including dry runs, is recorded. `GET .../manifests/applies` lists them and `GET .../manifests/applies/{id}` returns one with its items.

Manifests never delete anything. Removing a document from a manifest leaves the record in place; delete it through the API or dashboard.

## Exporting

```bash
curl -s -X POST http://127.0.0.1:8700/v1.0/api/tenants/default/manifests/export \
  -H "Authorization: Bearer $TOKEN" > tenant.yaml
```

The response is `application/yaml` with every tenant-owned record (built-ins are left out, but references to them are kept). Secrets are exported without values. Deployments come out with every field, including the default prompt bindings:

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
    secrets: []
  retryOnNodeLoss: false
  weight: 100
```

## Kinds

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
| `model`, `fallbackModel`, `effort`, `maxTurns`, `maxBudgetUsd`, `timeoutSeconds`, `maxConcurrentRuns`, `maxAttempts`, `retryOnNodeLoss`, `weight` | As in the REST API |
| `executor` | `Process` or `KubernetesJob` (a pod per run). Omit it to use the node pool's default, then `Process` |
| `podResources` | Run pod `cpuRequest`, `cpuLimit`, `memoryRequest`, `memoryLimit`, `ephemeralStorageRequest`, `ephemeralStorageLimit` for `KubernetesJob` runs. It is not called `resources` because that key holds the secret and MCP server bindings |

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
