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

## Manifests

`garrison_apply_manifest` accepts `manifest` YAML/JSON text. Set `dryRun: true` to validate without changing configuration; the default applies it. Inspect `failedCount` and the per-document results. Reapplying unchanged documents remains idempotent.

Inline secret values are rejected by default. `allowSecretValues: true` additionally requires `Secret.Create` permission; `AgentDeveloper` alone does not grant it. `garrison_export_manifest` returns `{ "manifest": "YAML text", "mediaType": "application/yaml" }`, with secret metadata only. The exported `manifest` can be passed directly to a dry-run apply.

Tool descriptions remain editable through their existing prompt-template overrides. Input schemas use the same agent/deployment model definitions as the API Explorer. System administrators whose credentials are not tenant-bound must pass a top-level `tenantId`; ordinary callers always act in their own tenant.

Run `dotnet run --project src/Test.Automated -f net10.0 -- --suites management-mcp` for CRUD, protection/versioning/audit, developer API credentials, tenant isolation, hosted-run restrictions, and manifest checks.
