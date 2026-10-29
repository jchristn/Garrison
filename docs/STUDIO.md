# Agent Studio

The studio is where agents and apps get designed before anything changes in live configuration. Work happens in a **draft**: a set of manifest documents, one per resource, that a person or the agent architect edits. When the draft looks right, someone asks for it to be applied. That creates an approval, and a person with the right permissions decides it. Only then does the draft touch live configuration.

```
 person or architect          person who may apply manifests
         |                                  |
   edit draft items  -->  request-apply --> DraftApply approval --> apply (one manifest apply)
   graph operations         (validates)        allow / deny
   diff, validate
```

## Drafts

A draft belongs to a tenant and to the person who started it (for an architect run, the person the run works for). It has a title, an optional target app, a version number, a status, its items, and a canvas layout.

| Status | Meaning |
|---|---|
| `Open` | Editable |
| `PendingApproval` | Waiting for a decision on its `DraftApply` approval. Frozen |
| `Applied` | Applied; `manifestApplyId` links to the manifest apply record |
| `Discarded` | Discarded |

Each item is one manifest document, keyed by kind and name, with an operation:

- `Upsert` creates or updates the resource. The document is plain manifest YAML ([MANIFESTS.md](MANIFESTS.md)) and its kind and name must match the item's.
- `Delete` deletes the resource when the draft is applied. Drafts can delete `Agent`, `Deployment`, `Pipeline`, and `AgenticApp`.

Drafts hold `PromptTemplate`, `HarnessProfile`, `McpServer`, `WorkspaceTemplate`, `AgentAsset`, `Agent`, `Deployment`, `Pipeline`, `AgenticApp`, `Trigger`, and `NotificationEndpoint` documents. They never hold secrets: a document refers to a secret by name, and the secret itself is managed separately.

Item document text is stored as written. It is one of the few unmanaged text columns in Garrison, because a draft can hold a document that does not validate yet.

### Versions

Every change to a draft (an item, a graph operation, the layout, a status change) raises its version by one. Each change names the version the caller read. If the draft moved on in the meantime, the change fails with 409 `DraftVersionConflict` and changes nothing; read the draft again and retry. Two editors, or a person and the architect, can therefore work on one draft without overwriting each other.

### Starting from an app

`POST .../studio/drafts` with `fromApp` exports the app with everything it references (members, their deployments, prompt templates, assets, and so on) and makes one item per document. Each item records a hash of the live document it started from. That hash is how the studio notices when live configuration changes under a draft.

## Diff and validation

`GET .../diff` compares each item with live configuration:

| `change` | Meaning |
|---|---|
| `Create` | The resource does not exist yet |
| `Update` | It exists and differs; `changes` lists the fields |
| `Delete` | The draft deletes it |
| `Unchanged` | Applying changes nothing |
| `Failed` | The document does not validate; `message` and `errorCode` say why |

An item is `stale` when the live resource changed after the draft was based on it. `POST .../validate` runs the same comparison. Both are a manifest dry run of the draft's documents, so they give the same per-document results as `POST .../manifests/apply?dryRun=true`. `valid` is true when nothing failed and nothing is stale.

## Applying a draft

`POST .../request-apply` with the version you read:

1. validates the draft and refuses with 400 `DraftStale`, `DraftInvalid`, or `DraftEmpty`;
2. creates an approval of kind `DraftApply`. Its summary counts the creates, updates, and deletes, and its `inputPreview` holds the full diff;
3. moves the draft to `PendingApproval`.

Nothing changes in live configuration yet. The approval appears with the other approvals ([REST_API.md](../REST_API.md#approvals)) and is decided with the same `POST .../approvals/{id}/decide`:

- **Allow** checks that the decider holds Create on `Manifest` and Delete on each kind the draft deletes (403 `ApproverLacksPermission` otherwise). It then validates again. If live configuration moved since the request, the approval is denied with 409 `DraftStale`, and the draft returns to `Open` for the author to rebase. Otherwise the documents apply as one manifest apply, deletes run, and the draft becomes `Applied`. Applying deploys to `dev`: each agent the draft changed gets a new published revision, and its `dev` deployments that are pinned to a revision move to it. Other environments change only through promotion ([REVISIONS.md](REVISIONS.md)), so a draft never reaches staging or production directly.
- **Deny** returns the draft to `Open`.
- An approval that expires (after 7 days) or is cancelled also returns the draft to `Open`. Discarding a pending draft cancels its approval.

A run can never decide a draft approval: 403, whatever its permissions.

## The graph

`GET .../graph` draws a draft's apps: a node per app and per agent (agents the draft holds, plus members its apps refer to), each app's call edges, the apps each agent belongs to or is the entry of, the capabilities each drafted agent names, and canvas positions. Each edge carries its fan-out flag and the delegation depth it needs: one plus the longest chain of calls below the called member.

`POST .../graph-operations` changes the graph with one operation at a time:

| `operation` | Fields | Effect |
|---|---|---|
| `AddMember` | `agent`, optional `role` | Adds a member; the first member becomes the entry agent |
| `RemoveMember` | `agent` | Removes the member and every edge touching it |
| `Connect` | `from`, `to`, optional `fanOut` | Adds or updates an edge |
| `Disconnect` | `from`, `to` | Removes an edge |
| `SetEntry` | `agent` | Makes a member the entry agent |
| `MoveNode` | `nodeKey`, `x`, `y` | Places a node on the canvas (layout only) |

`app` names the app and defaults to the draft's target app. An operation on an app the draft does not hold yet starts from the live app, or from a new app when none exists. Member and edge operations rewrite the draft's `AgenticApp` item, so the graph and the item text never disagree.

## Playground

The playground runs an agent's draft revision before anything is published. Each run goes to a temporary copy of one of the agent's deployments (its `dev` deployment, or the first one), named `playground-{agent}` and kept in the reserved `draft` environment, pinned to the revision being tried. Playground runs have kind `Playground`. They keep conversations and file spaces like any run, but they are left out of capability hints, and no app can select the `draft` environment, so end users never reach them.

- `POST .../agents/{agentId}/playground/invoke` with `{input, agentRevisionId?, sourceDeploymentId?, conversationId?, wait, waitSeconds}` runs the given revision, by default the agent's open draft revision. Needs Execute on the agent.
- `POST .../studio/drafts/{id}/playground/invoke` with `{input, agent?, conversationId?}` first writes the draft's document for that agent (default: the target app's entry agent) as the agent's draft revision, then runs it. Live configuration does not change. Needs Update on `StudioDraft` and on `AgentRevision`. An agent the draft creates must be applied before it can be tried (400 `AgentNotLive`).
- MCP: `garrison_studio_playground_invoke` with `draftId`, `input`, and optional `agent`, `conversationId`, `waitSeconds`, also available to the architect.

Users cannot create deployments in the `draft` environment (400 `ReservedEnvironment`). Deleting the agent deletes its playground copy.

## Delegated management

The agent architect builds drafts by calling studio tools from inside a run. Runs normally cannot touch configuration. A deployment can grant its runs draft access with `managementAccess: Drafts`:

```yaml
kind: Deployment
metadata:
  name: architect
spec:
  agent: agent-architect
  harnessProfile: claude-code
  managementAccess: Drafts
```

The run token of such a deployment may:

- create, read, and edit studio drafts, try them in the playground (which writes agent draft revisions, never published ones), and request their apply;
- read design configuration: deployments, harness profiles, prompt templates, MCP servers, workspace templates, agent revisions, agent assets, capabilities, apps, pipelines, and triggers.

Every permission is also checked against the person who started the run, so the architect can never do more than that person. It sees and edits only that person's drafts. It can never apply a draft, decide an approval, delete live resources, or read secret values. The grant ends when the run ends, like every run token.

## The agent architect

Every tenant has a protected agent named `agent-architect`. It designs agents and apps with a person, in a draft, using the studio tools above. Its published revision pins the skill asset `agent-architect-skills`, which teaches it manifest authoring and Garrison conventions. It cannot be edited or deleted. To change how it behaves, give its deployment a different prompt ([PROMPTS.md](PROMPTS.md#architect-prompts)).

It has no deployment until you create one:

```bash
curl -s -X POST $B/deployments -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"architect","agentId":"<agent-architect id>","harnessProfileId":"hrn_builtin_claude_code","architectPromptTemplateId":"builtin/agent-architect-guided"}'
```

A deployment of `agent-architect` always gets `managementAccess: Drafts`, and binds `builtin/agent-architect` unless you choose another architect prompt. Talk to it like any agent, for example in a conversation. It works only on the drafts of the person talking to it, within that person's permissions.

## Routes

All paths are under `/v1.0/api/tenants/{tenantId}/studio/drafts`:

| Method and path suffix | Permission | Result |
|---|---|---|
| `GET` | Read on `StudioDraft` | `EnumerationResult<StudioDraft>`; `mine=true` for your own |
| `POST` | Create on `StudioDraft` (and Read on `AgenticApp` with `fromApp`) | `StudioDraft`, 201 |
| `GET /{id}` | Read on `StudioDraft` | `StudioDraft` |
| `DELETE /{id}` | Delete on `StudioDraft` | 204 |
| `PUT /{id}/items/{kind}/{name}` | Update on `StudioDraft` | `StudioDraft`. Body `{version, operation, document}` |
| `DELETE /{id}/items/{kind}/{name}?version=` | Update on `StudioDraft` | `StudioDraft` |
| `GET /{id}/diff`, `POST /{id}/validate` | Read on `StudioDraft` | `StudioDraftDiff` |
| `POST /{id}/request-apply` | Update on `StudioDraft` | `Approval`, 201. Body `{version}` |
| `GET /{id}/graph` | Read on `StudioDraft` | `StudioGraph` |
| `POST /{id}/graph-operations` | Update on `StudioDraft` | `StudioGraph` |

Architect prompts, under `/v1.0/api/tenants/{tenantId}/studio`:

| Method and path | Permission | Result |
|---|---|---|
| `GET /architect-prompts` | Read on `PromptTemplate` | `ArchitectPromptEntry[]` |
| `GET /architects/{deploymentId}/prompt` | Read on `Deployment` | `ArchitectPromptSelection` |
| `PUT /architects/{deploymentId}/prompt` | Update on `Deployment` | `ArchitectPromptSelection`; 400 `NotAnArchitectDeployment`, `InvalidArchitectPrompt` |

Errors: 400 `ValidationFailed` with codes `UnsupportedKind`, `InvalidDocument`, `DocumentMismatch`, `DeleteNotSupported`, `NotAMember`, `SelfEdge`, `NoSuchEdge`, `AppDeleted`, and 400 `DraftStale`, `DraftInvalid`, `DraftEmpty` on request-apply; 409 `DraftVersionConflict`, `DraftNotOpen`; on decide, 403 `ApproverLacksPermission`, 409 `DraftStale`, `DraftInvalid`.

The MCP tools are in [MCP_API.md](../MCP_API.md#studio-drafts).
