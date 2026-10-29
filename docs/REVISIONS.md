# Agent revisions, environments, and promotion

An agent's definition (its description, input and output schemas, delegation policy, prompt pins, capabilities, and tags) is kept as a series of revisions. A deployment runs one revision, and promotion moves a tested revision from one environment's deployments to the next. This page explains how those three pieces fit together. The routes are in [REST_API.md](../REST_API.md), the tools in [MCP_API.md](../MCP_API.md), and the manifest fields in [MANIFESTS.md](MANIFESTS.md).

## Revisions

Every agent starts with revision 1, published, built from the fields it was created with. Revisions are numbered per agent and identified by an `arv_` identifier. Routes take either.

A revision is either a draft or published:

- **Draft.** An agent has at most one open draft. Saving content creates the draft, or replaces the content of the one that is open. A draft never changes what runs, except in the studio playground (AD9).
- **Published.** Publishing freezes the draft. A published revision never changes again: publishing it twice answers 409 `RevisionPublished`, and so does deleting it. Publishing a draft whose content equals the latest published revision answers 409 `RevisionUnchanged`.

When a draft is published, it becomes the agent's latest published revision and its content is copied onto the agent, so `GET .../agents/{id}` shows what unpinned deployments run. The agent's `draftRevisionId` and `latestPublishedRevisionId` point at the open draft and the latest published revision.

Each revision carries a content hash: SHA-256 over its content fields. The order of the allow list, capabilities, and tags does not change the hash; the order of prompt pins does. Two revisions with the same hash define the agent the same way.

### Direct edits

Editing an agent directly (`PUT .../agents/{id}`, a manifest without `revision.publish: false`, or self-registration) still takes effect at once. When the edit changes the content, Garrison publishes it as the next revision in the same transaction. An edit that changes nothing creates no revision. Use drafts when you want to review a change before it runs.

### Numbering

A published number is never reused. If you discard a draft, the next revision takes its number.

### Diff

`GET .../agents/{id}/revisions/diff?from=1&to=2` lists every changed scalar field with its old and new value (`Changed`), and every allow list entry, prompt pin, capability, and tag that was `Added` or `Removed`. Without `from` and `to`, it compares the open draft (or, with none open, the latest published revision) with the published revision before it.

## Environments

An environment is a label on a deployment, not a tenant or a namespace. A tenant that never set a list has `dev`, `staging`, and `prod`, in that order. `PUT .../environments` replaces the list:

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/environments" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"environments": [{"name": "dev"}, {"name": "qa"}, {"name": "prod", "description": "Customer traffic"}]}'
```

Names are 1 to 32 lowercase letters, digits, and hyphens, starting with a letter. The list holds 1 to 16 environments. `draft` is reserved for playground runs. Removing an environment that a deployment still uses answers 409 `EnvironmentInUse`.

A deployment's `environment` defaults to `dev`. A value outside the list answers 400 with field code `UnknownEnvironment`.

## Pinning

A deployment's `agentRevisionId` pins it to one published revision. Leave it empty and the deployment follows the agent's latest published revision. Pinning a draft, or a revision of another agent, answers 400 with field code `UnknownRevision`.

A run records the revision it compiles from in `agentRevisionId`, fixed when the run is created. A promotion while it waits in the queue does not change what it runs. The delegation checks for a run use the same revision.

## Promotion

`POST .../promotions` moves a revision from one environment to the next by repinning every deployment of the agent in the target environment, in one transaction. The record keeps each deployment's previous pin:

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/promotions" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"agentId": "researcher", "sourceEnvironment": "dev", "note": "Passed review"}'
```

- The target defaults to the next environment after the source. A source with nothing after it answers 400 `NoNextEnvironment`.
- The revision defaults to what the source environment runs: the common pin of its deployments, or the latest published revision when they are unpinned. If they run different revisions, name one with `agentRevisionId` (409 `AmbiguousSourceRevision` otherwise). A draft answers 409 `RevisionNotPublished`.
- A target that skips environments in the order (for example `dev` straight to `prod`) answers 409 `PromotionOrderViolation` unless the request sets `allowSkip`.
- If the agent has no deployment in the target environment, the request answers 409 `NoTargetDeployments`.

`POST .../promotions/{id}/rollback` restores the exact pins the promotion replaced, again in one transaction, and marks the promotion `RolledBack`. A deployment that followed the latest revision before the promotion follows it again after the rollback. A promotion can be rolled back once (409 `AlreadyRolledBack`), and a rollback cannot be rolled back (409 `NotAPromotion`).

Promotions and rollbacks are audited, and `GET .../promotions?agentId=` lists them newest first.

## Permissions

| Action | Permission |
|---|---|
| List and read revisions, diff | Read on `AgentRevision` |
| Save or discard a draft | Create or Delete on `AgentRevision` |
| Publish | Execute on `AgentRevision` |
| Read the environment list | Read on `Deployment` |
| Replace the environment list | Update on `Tenant` |
| List promotions | Read on `Promotion` |
| Promote or roll back | Execute on `Promotion` for the target environment |

The `Releaser` role holds Read and Execute on `Promotion`. Assign it at resource scope with the environment name as the resource identifier to limit which environments a person may promote to:

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/user-role-assignments" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"userId": "usr_...", "roleName": "Releaser", "resourceScope": "Resource", "resourceId": "prod"}'
```

`AgentDeveloper` can draft and publish revisions and read promotions, but not promote.

## Manifests

A deployment document takes `environment` and `agentRevision` (a revision number, so a bundle applies to another tenant). An agent document takes `revision: { publish: false, changeNote: ... }` to write its content as the agent's draft instead of changing what runs. See [MANIFESTS.md](MANIFESTS.md).

## A worked example on the fake harness

```bash
B=http://127.0.0.1:8700/v1.0/api/tenants/default
H=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

# An agent with an unpinned dev deployment and a staging deployment.
AGENT=$(curl -s -X POST $B/agents "${H[@]}" -d '{"name": "echo-rev", "description": "First wording"}' | jq -r .id)
curl -s -X POST $B/deployments "${H[@]}" -d '{"name": "echo-rev-dev", "agentId": "'$AGENT'", "harnessProfileId": "hrn_builtin_fake"}'
curl -s -X POST $B/deployments "${H[@]}" -d '{"name": "echo-rev-staging", "agentId": "'$AGENT'", "harnessProfileId": "hrn_builtin_fake", "environment": "staging"}'

# Draft, check the diff, publish.
curl -s -X POST $B/agents/echo-rev/revisions "${H[@]}" -d '{"description": "Second wording"}'
curl -s $B/agents/echo-rev/revisions/diff "${H[@]}"
curl -s -X POST $B/agents/echo-rev/revisions/2/publish "${H[@]}" -d '{"changeNote": "Clearer"}'

# dev now runs revision 2. Promote it to staging, then roll back.
curl -s -X POST $B/promotions "${H[@]}" -d '{"agentId": "echo-rev", "sourceEnvironment": "dev"}'
curl -s -X POST $B/promotions/pro_.../rollback "${H[@]}"
```
