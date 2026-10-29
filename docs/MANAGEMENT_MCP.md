# Configuration through MCP

Normal user and API credentials can manage tenant configuration through Garrison's existing MCP endpoint. `AgentDeveloper` grants the standard agent, deployment, and manifest permissions; tenant/system administrators and equivalent custom grants work too. Each call is authorized for its resource and operation. Hosted run and node tokens cannot use these tools, even when the run originated from an administrator. They are hidden from those callers' tool lists.

## Agents and deployments

Agent tools are `garrison_get_agent_configuration`, `garrison_create_agent`, `garrison_update_agent`, and `garrison_delete_agent`. Existing discovery tools remain available. Agent identifiers can be names or IDs.

Deployment tools are `garrison_list_deployments`, `garrison_get_deployment`, `garrison_create_deployment`, `garrison_update_deployment`, and `garrison_delete_deployment`. Reads, updates, and deletion use `deploymentId`; listing accepts `search` and `maxResults`.

Creation takes `configuration`, using the normal REST model. For example:

```json
{
  "name": "garrison_create_agent",
  "arguments": {
    "configuration": { "name": "review-helper", "description": "Reviews proposed changes." }
  }
}
```

Creating an agent does not create its deployment. Create a deployment with `name`, `agentId`, and `harnessProfileId`; standard prompt bindings are applied automatically. A caller-bound tenant always wins over supplied tenant fields. Creation assigns identity, protection, and deployment version. Updates preserve identity/creation metadata and advance deployment `configVersion`.

Updates replace the configuration. Read it first, edit the fields you intend to change, and send the complete replacement with `agent` or `deploymentId`. Omitted fields take their defaults. Protected records reject updates/deletion. Agent deletion cascades its deployments, matching REST. Mutations use the shared REST validation and audit path. A number outside its range (for example `maxAttempts: 99`) is clamped as over REST, and the returned record's `warnings` array names the field, the value sent, and the value stored (`REST_API.md`, "Warnings").

## Pipelines

Pipeline tools are `garrison_get_pipeline`, `garrison_create_pipeline`, `garrison_update_pipeline`, and `garrison_delete_pipeline`. A pipeline `configuration` carries its whole ordered `stages` list, so read it with `garrison_get_pipeline`, change what you need, and send the complete list back; each update increments the pipeline `version`, and runs already in flight keep the stages they started with. Stage agents and deployments are checked the same way as over REST. Deleting a pipeline that still has active pipeline runs fails with `PipelineInUse`, and deleting an agent or deployment that a stage uses fails with `ReferencedByPipeline`.

Starting and following pipelines (`garrison_start_pipeline`, `garrison_get_pipeline_run`, the review tools) are ordinary tools described in `MCP_API.md` and [PIPELINES.md](PIPELINES.md). None of the pipeline tools are offered to run tokens, so an agent cannot start a pipeline or approve its own stage.

## Triggers and notification endpoints

Trigger tools are `garrison_list_triggers`, `garrison_get_trigger`, `garrison_create_trigger`, `garrison_update_trigger`, `garrison_delete_trigger`, `garrison_list_trigger_fires`, `garrison_fire_trigger`, and `garrison_rotate_trigger_secret`; they take `trigger` (name or ID) and, for create and update, a `configuration` in the REST trigger model. A trigger runs as whoever saved it last, so creating or updating one over MCP makes the calling credential its run-as principal and needs Execute on the agent or pipeline it starts. A webhook trigger's `signingSecret` appears once, in the create result and in the result of `garrison_rotate_trigger_secret`, which replaces it at once. `garrison_fire_trigger` fires a trigger by hand, with an optional `body` payload, and returns the fire (see [TRIGGERS.md](TRIGGERS.md)).

Notification endpoint tools are `garrison_list_notification_endpoints`, `garrison_get_notification_endpoint`, `garrison_create_notification_endpoint`, `garrison_update_notification_endpoint`, `garrison_delete_notification_endpoint`, `garrison_list_notification_deliveries`, `garrison_rotate_notification_endpoint_secret`, and `garrison_test_notification_endpoint`, keyed by `endpoint` (name or ID). The URL is checked against the same SSRF rules as over REST, and the `signingSecret` is returned once, by create. `garrison_rotate_notification_endpoint_secret` returns the new `signingSecret` once, and `garrison_test_notification_endpoint` sends a signed test notification and returns the delivery (see [NOTIFICATIONS.md](NOTIFICATIONS.md)). Deleting an agent, deployment, or pipeline that a trigger or endpoint names fails with `ReferencedByTrigger` or `ReferencedByNotificationEndpoint`.

## Revisions and promotion

`garrison_list_agent_revisions`, `garrison_get_agent_revision`, and `garrison_publish_agent_revision` read an agent's revisions and publish its open draft. `garrison_promote` moves a revision from one environment to the next, and `garrison_rollback_promotion` restores the pins a promotion replaced. Promotion needs Execute on `Promotion` for the target environment, so a `Releaser` assigned to `staging` can promote there and nowhere else ([REVISIONS.md](REVISIONS.md)).

## Agent assets

`garrison_list_agent_assets` and `garrison_get_agent_asset` are ordinary read tools, also offered to runs with the permission. `garrison_create_agent_asset`, `garrison_update_agent_asset`, `garrison_upload_agent_asset_version`, and `garrison_delete_agent_asset` are management tools: users and credentials only, never runs, including studio runs ([ASSETS.md](ASSETS.md)).

## Agentic apps

`garrison_list_apps`, `garrison_get_app`, `garrison_create_app`, and `garrison_update_app` take the same fields as the REST app routes, with agents given by name or ID ([APPS.md](APPS.md)). Deleting, publishing app revisions, and promoting an app are REST only.

## Studio and architect prompts

The studio draft tools (`garrison_studio_*`) are ordinary tools for users and credentials with `StudioDraft` permissions, and are also offered to runs whose deployment has `managementAccess: Drafts`; none of them applies a draft ([STUDIO.md](STUDIO.md)). The architect tools (`garrison_studio_list_architects`, `garrison_studio_get_architect`, `garrison_studio_create_architect`, `garrison_studio_update_architect`, `garrison_studio_delete_architect`), the architect prompt tools (`garrison_studio_list_architect_prompts`, `garrison_studio_get_architect_prompt`, `garrison_studio_set_architect_prompt`) and the prompt template tools (`garrison_clone_prompt_template`, `garrison_update_prompt_template`, `garrison_reset_prompt_template`, `garrison_render_prompt_template`) are management tools, hidden from every run token ([ARCHITECT.md](ARCHITECT.md)).

## Manifests

`garrison_apply_manifest` accepts `manifest` YAML/JSON text. Set `dryRun: true` to validate without changing configuration; the default applies it. Inspect `failedCount` and the per-document results. Reapplying unchanged documents remains idempotent.

Inline secret values are rejected by default. `allowSecretValues: true` additionally requires `Secret.Create` permission; `AgentDeveloper` alone does not grant it. `garrison_export_manifest` returns `{ "manifest": "YAML text", "mediaType": "application/yaml", "fileName": "garrison-bundle-<tenant>.yaml", "requiredSecrets": ["github-token"] }`. With no arguments it exports every tenant-owned resource. To export part of the tenant, pass `kinds` (for example `["Agent", "Pipeline"]`), `resources` (for example `["Agent/triage"]`), `followReferences: true` to bring what the selection depends on, and `includeBuiltIn: true` to include referenced built-ins. Secret values are never exported; `requiredSecrets` and the bundle's `Bundle` document name the secrets to create in the target tenant first. The exported `manifest` can be passed directly to a dry-run apply, and applying it to a tenant without those secrets fails with `MissingSecret` until they exist. See [MANIFESTS.md](MANIFESTS.md).

Tool descriptions remain editable through their existing prompt-template overrides. Input schemas use the same agent/deployment model definitions as the API Explorer. System administrators whose credentials are not tenant-bound must pass a top-level `tenantId`; ordinary callers always act in their own tenant.

Run `dotnet run --project src/Test.Automated -f net10.0 -- --suites management-mcp` for CRUD, protection/versioning/audit, developer API credentials, tenant isolation, hosted-run restrictions, and manifest checks.
