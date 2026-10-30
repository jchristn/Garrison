# Agent Studio test coverage (0.2.0)

Every surface added in AD1 to AD10, and the tests that cover it. Touchstone suites run on Sqlite and Postgresql (`<area>-sqlite`, `<area>-postgresql`); dashboard and app UI specs run in Chromium; SDK harness cases run in all four SDKs through `scripts/run-sdk-harnesses.sh`; Postman folders run in Newman.

## REST routes

| Area | Routes | Touchstone | Dashboard / app UI | SDK harness | Postman |
|---|---|---|---|---|---|
| Revisions | `/agents/{id}/revisions`, `/revisions/diff`, `/revisions/{n}`, publish, discard | `revisions-*`: revision-one-backfill, draft-publish, compile-pin, routes-rbac, manifests | `revisions.spec.js` | revision cases | Revisions, Environments and Promotions |
| Environments and promotions | `/environments`, `/promotions`, `/promotions/{id}`, rollback | `revisions-*`: promotion, routes-rbac; `apps-*`: revisions-promotion; `studio-*`: build-deploy-chat | `revisions.spec.js`, `studio.spec.js` | promotion cases | Revisions, Environments and Promotions |
| Agent assets | `/agent-assets` CRUD, versions, files, `/v1.0/asset-download/{id}` | `assets-*`: crud-validation, storage-database, storage-filesystem, placements, run-integrity, manifests | `assets.spec.js` | asset cases | Agent Assets |
| File spaces | conversation, pipeline run, and run file routes, download URL, `/v1.0/file-download/{id}` | `filespaces-*`: resolution, writes-conflicts-limits, sync-pipeline, conversation-turns, routes-channel | `files.spec.js` (dashboard and app UI) | file space cases | File Spaces |
| Capabilities | `/capabilities` CRUD, refresh | `capabilities-*`: manual-crud, agent-derivation, mcp-tools, probes-placement, catalog-tools; `examples-*`: mcp-binding | `capabilities.spec.js` | capability cases | Capabilities |
| Fan-out | `/runs/{id}/fan-out-groups`, `/fan-out-groups/{id}`, cancel | `fanout-*`: start-refuse, join-policies, budget-cancel, suspension-capacity, example, routes-channel | `fanout.spec.js` | fan-out cases | Fan-out |
| Agentic apps | `/apps` CRUD, delegation, revisions, publish, promote | `apps-*`: crud-validation, delegation, revisions-promotion, manifest-mcp | `apps.spec.js` | app cases | Agentic Apps |
| App gateway | `/v1.0/apps/{slug}`, logo, session, conversations, messages, turn stream, files, files stream | `apps-*`: sessions, gateway-conversation; `studio-*`: deploy-dev, build-deploy-chat; `examples-*`: research-overview, support-triage-studio | `app-ui` chat.spec.js, files.spec.js | gateway chat case (support triage bundle) | Agentic Apps (gateway requests; the long-lived files stream is covered by Touchstone and SDKs only) |
| Studio drafts | `/studio/drafts` CRUD, items, diff, validate, request-apply, graph, graph-operations | `studio-*`: drafts, diff-validate, graph, apply-approval, grant-mcp, tenancy-rbac, deploy-dev, build-deploy-chat | `studio.spec.js`, `canvas.spec.js` | studio draft case | Studio Drafts |
| Architects | `/studio/architects` list (paginated, search, activeOnly), create with a credential secret, read by ID or name, update (replace or remove the credential), delete; 404 for a plain deployment and for another tenant | `studio-*`: architects | `architects.spec.js`, `studio.spec.js` (draft picker, New architect, setup wizard) | agent architects case | Architects |
| Architect prompts | `/studio/architect-prompts` (paginated), `/studio/architects/{id}/prompt`, prompt template clone, reset, delete in use | `studio-*`: architect-seed, architect-prompt-flow, architect-seed-replicas, tenancy-rbac | `studio.spec.js` (architect prompt panel) | architect prompt case | Architect Prompts |
| Playground and preview | `/agents/{id}/playground/invoke`, `/studio/drafts/{id}/playground/invoke`, compile-preview with revision and environment | `studio-*`: playground, preview | `studio.spec.js` | playground case | Playground |
| Approvals | DraftApply decisions on `/approvals/{id}/decide` | `studio-*`: apply-approval, grant-mcp | `studio.spec.js` | studio draft case | Studio Drafts |

## MCP tools

| Tools | Touchstone |
|---|---|
| `garrison_list_agent_assets`, `garrison_get_agent_asset`, asset management tools | `assets-*`: mcp; `studio-*`: grant-mcp |
| `garrison_files_list`, `garrison_files_read`, `garrison_files_write`, `garrison_files_delete` | `filespaces-*`: mcp-tools |
| `garrison_list_capabilities`, `garrison_describe_capability` | `capabilities-*`: catalog-tools; `examples-*`: mcp-binding |
| `garrison_fan_out`, `garrison_gather`, `garrison_cancel_fan_out` | `fanout-*`: all cases |
| `garrison_list_apps`, `garrison_get_app`, `garrison_create_app`, `garrison_update_app` | `apps-*`: manifest-mcp |
| `garrison_list_agent_revisions`, `garrison_get_agent_revision`, `garrison_publish_agent_revision`, `garrison_promote`, `garrison_rollback_promotion` | `revisions-*`: mcp |
| `garrison_studio_*` draft tools | `studio-*`: grant-mcp, channel, architect-script, build-deploy-chat |
| `garrison_studio_playground_invoke` | `studio-*`: playground (REST path); MCP dispatch shares `PlaygroundService` |
| `garrison_studio_list_architects`, `garrison_studio_get_architect`, `garrison_studio_create_architect`, `garrison_studio_update_architect`, `garrison_studio_delete_architect`, paginated `garrison_studio_list_architect_prompts` | `studio-*`: architects |
| Architect prompt and prompt template tools | `studio-*`: architect-prompt-flow |

## WebSocket channels

| Channel | Touchstone | Dashboard |
|---|---|---|
| `conversation-files:{id}` | `filespaces-*`: routes-channel | `files.spec.js` |
| `fan-out:{id}` | `fanout-*`: routes-channel | `fanout.spec.js` |
| `studio-draft:{id}` | `studio-*`: channel | `studio.spec.js`, `canvas.spec.js` |

## Dashboard views and app UI screens

| Screen | Specs |
|---|---|
| Agents > Revisions, Assets, Capabilities | `revisions.spec.js`, `assets.spec.js`, `capabilities.spec.js` |
| Run detail fan-out groups, conversation files | `fanout.spec.js`, `files.spec.js` |
| Agents > Apps | `apps.spec.js` |
| Agents > Architects (list, create, edit, delete, prompts, deployment link) | `architects.spec.js` |
| Agents > Studio (list, workspace, canvas, playground, preview, architect prompt panel) | `studio.spec.js`, `canvas.spec.js` |
| Every screen: translations, tooltips, accessibility | `i18n.spec.js`, `tooltips.spec.js`, `accessibility.spec.js` |
| App UI chat, file panel, branding, sign-in | `app-ui` chat.spec.js, files.spec.js, accessibility.spec.js, i18n.spec.js, tooltips.spec.js |

## Cross-cutting checks

| Check | Where |
|---|---|
| Cross-tenant 404 | `revisions-*`, `assets-*`, `filespaces-*`, `capabilities-*`, `fanout-*`, `apps-*`: their CRUD or routes cases; `studio-*`: tenancy-rbac |
| 403 without permission | `revisions-*`: routes-rbac; `assets-*`: crud-validation; `apps-*`: crud-validation; `studio-*`: tenancy-rbac (drafts, architect prompts, capabilities, assets, apps, fan-out groups, file spaces) |
| Both providers for every schema change (versions 35 to 41) | `db-sqlite`, `db-postgresql`: migrate-twice and the upgrade cases, plus each area suite on both providers |
| Multi-replica seeding of new built-ins | `studio-*`: architect-seed-replicas; built-in prompt seeding holds the startup lock like every built-in |
| Example apps end to end | `examples-*`: doc-converter-no-tools, research-overview, mcp-binding, support-triage-studio; `scripts/run-research-example.sh` |
