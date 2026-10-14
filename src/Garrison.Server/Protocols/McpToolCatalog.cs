namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Serialization;
    using Garrison.Server.Routes;

    /// <summary>
    /// The Garrison MCP tools. Descriptions are seeded as built-in prompt templates (builtin/mcp-tool-*) and rendered
    /// at startup, so every word a harness reads can be changed without a release (D-021). A tenant template with the
    /// same name in the Default tenant overrides the built-in. Each tool has two input schemas: the one most callers
    /// see, and one for system administrators that adds the administrator-only tenantId argument.
    /// </summary>
    public static class McpToolCatalog
    {
        #region Public-Members

        /// <summary>
        /// Description of the administrator-only tenantId argument.
        /// </summary>
        public static string TenantIdDescription
        {
            get
            {
                return _TenantIdDescription;
            }
        }

        #endregion

        #region Private-Members

        /// <summary>
        /// Prefix of the built-in tool description templates: builtin/mcp-tool-. A tenant template named
        /// <see cref="TenantOverridePrefix"/> plus the tool name (for example mcp-tool-garrison_invoke_agent) replaces
        /// the built-in description for callers in that tenant (G-3).
        /// </summary>
        public static readonly string BuiltInDescriptionPrefix = "builtin/mcp-tool-";

        /// <summary>
        /// Prefix of tenant templates that override a tool description: mcp-tool-.
        /// </summary>
        public static readonly string TenantOverridePrefix = "mcp-tool-";

        /// <summary>
        /// Prefix reserved for the built-in Garrison tools: garrison_. Agents cannot be offered under a name with it.
        /// </summary>
        public static readonly string ReservedToolPrefix = "garrison_";

        /// <summary>
        /// Input schema of an agent offered as its own MCP tool (exposeMcpTool), as most callers see it.
        /// </summary>
        public static string AgentToolInputSchemaJson
        {
            get
            {
                return _AgentToolSchema;
            }
        }

        /// <summary>
        /// Input schema of an agent tool including the administrator-only tenantId argument.
        /// </summary>
        public static string AgentToolAdministratorInputSchemaJson
        {
            get
            {
                return WithTenantId(_AgentToolSchema);
            }
        }

        private static readonly string _AgentToolSchema = "{\"type\":\"object\",\"properties\":{\"input\":{\"type\":\"string\",\"description\":\"The complete request for the agent, with all the context it needs.\"},\"parameters\":{\"type\":\"object\",\"additionalProperties\":{\"type\":\"string\"},\"description\":\"Optional. Run parameters the agent allows, as string values. Omit it unless the tool description asks for parameters.\"},\"waitSeconds\":{\"type\":\"integer\",\"minimum\":0,\"description\":\"Optional. How long to wait for the answer. Omit it to use the server's maximum.\"}},\"required\":[\"input\"]}";

        private static readonly string _TenantIdDescription = "System administrators only: the tenant to act in when your credential is not bound to one. Omit it otherwise; every other caller always acts in its own tenant.";

        #endregion

        #region Public-Methods

        /// <summary>
        /// All tools.
        /// </summary>
        /// <returns>Tool definitions.</returns>
        public static List<McpToolDefinition> All()
        {
            List<McpToolDefinition> tools = new List<McpToolDefinition>();
            tools.Add(Management("garrison_get_agent_configuration", ResourceTypeEnum.Agent, OperationTypeEnum.Read,
                "Read the complete configuration of one agent before replacing it. Requires agent (name or ID). Uses developer/user credentials; hosted run tokens cannot use management tools.",
                "{\"type\":\"object\",\"properties\":{\"agent\":{\"type\":\"string\"}},\"required\":[\"agent\"]}"));
            tools.Add(Management("garrison_create_agent", ResourceTypeEnum.Agent, OperationTypeEnum.Create,
                "Create an agent in your tenant from configuration using the standard agent API fields. Name is required; supplied ID, tenant, and protection are ignored. Requires Agent.Create permission (for example AgentDeveloper). Does not create a deployment.", ConfigurationSchema(typeof(Agent), null)));
            tools.Add(Management("garrison_update_agent", ResourceTypeEnum.Agent, OperationTypeEnum.Update,
                "Replace an agent configuration. Required: agent (name or ID), configuration (complete agent API body). Read garrison_get_agent_configuration first so fields you want to retain are included. Identity/creation/registration metadata is preserved; protected agents cannot be changed.", ConfigurationSchema(typeof(Agent), "agent")));
            tools.Add(Management("garrison_delete_agent", ResourceTypeEnum.Agent, OperationTypeEnum.Delete,
                "Delete an agent and its deployments, matching the REST API cascade. Requires agent (name or ID) and Agent.Delete permission. Protected agents cannot be deleted.",
                "{\"type\":\"object\",\"properties\":{\"agent\":{\"type\":\"string\"}},\"required\":[\"agent\"]}"));
            tools.Add(Management("garrison_list_deployments", ResourceTypeEnum.Deployment, OperationTypeEnum.Read,
                "List deployment configurations in your tenant. Optional search and maxResults (1-100, default 25). Requires Deployment.Read permission; use garrison_get_deployment when you have a specific ID.",
                "{\"type\":\"object\",\"properties\":{\"search\":{\"type\":\"string\"},\"maxResults\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":100}}}"));
            tools.Add(Management("garrison_get_deployment", ResourceTypeEnum.Deployment, OperationTypeEnum.Read,
                "Read the complete configuration of a deployment by deploymentId, including its configuration version. Requires Deployment.Read permission.",
                "{\"type\":\"object\",\"properties\":{\"deploymentId\":{\"type\":\"string\"}},\"required\":[\"deploymentId\"]}"));
            tools.Add(Management("garrison_create_deployment", ResourceTypeEnum.Deployment, OperationTypeEnum.Create,
                "Create a deployment from configuration using the standard deployment API fields. Name, agentId and harnessProfileId are required. Standard prompt bindings are applied and references validated. Supplied ID/tenant/version/protection are ignored. Requires Deployment.Create permission.", ConfigurationSchema(typeof(Deployment), null)));
            tools.Add(Management("garrison_update_deployment", ResourceTypeEnum.Deployment, OperationTypeEnum.Update,
                "Replace a deployment configuration. Required: deploymentId and configuration (complete deployment API body). Read garrison_get_deployment first; fields omitted from the replacement take their defaults. Preserves identity/creation time, advances configVersion, validates references, and rejects protected records.", ConfigurationSchema(typeof(Deployment), "deploymentId")));
            tools.Add(Management("garrison_delete_deployment", ResourceTypeEnum.Deployment, OperationTypeEnum.Delete,
                "Delete one deployment by deploymentId. Requires Deployment.Delete permission. Protected deployments cannot be deleted.",
                "{\"type\":\"object\",\"properties\":{\"deploymentId\":{\"type\":\"string\"}},\"required\":[\"deploymentId\"]}"));
            tools.Add(Management("garrison_apply_manifest", ResourceTypeEnum.Manifest, OperationTypeEnum.Create,
                "Apply YAML/JSON configuration manifests in your tenant, using the existing manifest API. Required: manifest text. Optional dryRun true validates without changes (default false); inspect failedCount and per-document results. Inline secret values are rejected unless allowSecretValues is true and you also have Secret.Create permission. Requires Manifest.Create permission.",
                "{\"type\":\"object\",\"properties\":{\"manifest\":{\"type\":\"string\"},\"dryRun\":{\"type\":\"boolean\"},\"allowSecretValues\":{\"type\":\"boolean\"}},\"required\":[\"manifest\"]}"));
            tools.Add(Management("garrison_export_manifest", ResourceTypeEnum.Manifest, OperationTypeEnum.Read,
                "Export your tenant configuration as {manifest: YAML text, mediaType: application/yaml}. Secrets appear as metadata only, never plaintext values. Requires Manifest.Read permission.", "{\"type\":\"object\",\"properties\":{}}"));
            tools.Add(Management("garrison_get_pipeline", ResourceTypeEnum.Pipeline, OperationTypeEnum.Read,
                "Read the complete configuration of one pipeline, including its ordered stages, before replacing it. Requires pipeline (name or ID) and Pipeline.Read permission.",
                "{\"type\":\"object\",\"properties\":{\"pipeline\":{\"type\":\"string\",\"description\":\"Pipeline name or identifier (ppl_...).\"}},\"required\":[\"pipeline\"]}"));
            tools.Add(Management("garrison_create_pipeline", ResourceTypeEnum.Pipeline, OperationTypeEnum.Create,
                "Create a pipeline in your tenant from configuration using the standard pipeline API fields: name, optional description and maxDurationSeconds, and ordered stages (each names an agentId and may pin a deploymentId, a handoffTemplateId, review settings, retries, and parameters). Supplied ID, tenant, version, and protection are ignored. Requires Pipeline.Create permission.", ConfigurationSchema(typeof(Pipeline), null)));
            tools.Add(Management("garrison_update_pipeline", ResourceTypeEnum.Pipeline, OperationTypeEnum.Update,
                "Replace a pipeline configuration and its stages. Required: pipeline (name or ID) and configuration (complete pipeline API body). Read garrison_get_pipeline first so stages you want to keep are included. The version advances; pipeline runs already started keep their snapshot. Protected pipelines cannot be changed.", ConfigurationSchema(typeof(Pipeline), "pipeline")));
            tools.Add(Management("garrison_delete_pipeline", ResourceTypeEnum.Pipeline, OperationTypeEnum.Delete,
                "Delete a pipeline. Requires pipeline (name or ID) and Pipeline.Delete permission. Finished pipeline runs are kept; while any pipeline run is active the delete fails with PipelineInUse. Protected pipelines cannot be deleted.",
                "{\"type\":\"object\",\"properties\":{\"pipeline\":{\"type\":\"string\",\"description\":\"Pipeline name or identifier (ppl_...).\"}},\"required\":[\"pipeline\"]}"));
            tools.Add(Tool("garrison_upload_artifact", ResourceTypeEnum.Artifact, OperationTypeEnum.Create,
                "Upload one workspace file selected by the producing deployment's artifact globs. Requires the current run and lease epoch; run tokens may upload only for their own execution. Provider credentials remain server-side.",
                "{\"type\":\"object\",\"properties\":{\"runId\":{\"type\":\"string\"},\"storeId\":{\"type\":\"string\"},\"name\":{\"type\":\"string\"},\"mediaType\":{\"type\":\"string\"},\"epoch\":{\"type\":\"integer\"},\"repairAttempt\":{\"type\":\"integer\"},\"contentBase64\":{\"type\":\"string\"}},\"required\":[\"runId\",\"storeId\",\"name\",\"epoch\",\"repairAttempt\",\"contentBase64\"]}"));
            tools.Add(Tool("garrison_list_agents", ResourceTypeEnum.Agent, OperationTypeEnum.Read,
                "List the Garrison agents you may invoke, with their names, descriptions, and skills. Call it with no arguments unless you need to narrow the list; omit optional arguments you do not need. Optional: search (part of an agent name) and maxResults (1 to 100, default 25).",
                "{\"type\":\"object\",\"properties\":{\"search\":{\"type\":\"string\",\"description\":\"Optional. Part of an agent name. Omit it to list every agent you may invoke.\"},\"maxResults\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":100,\"description\":\"Optional. Default 25. Omit it unless you need more.\"}}}"));
            tools.Add(Tool("garrison_get_agent", ResourceTypeEnum.Agent, OperationTypeEnum.Read,
                "Describe one Garrison agent: purpose, skills, input mode, and output schema. Required argument: agent (name or identifier).",
                "{\"type\":\"object\",\"properties\":{\"agent\":{\"type\":\"string\",\"description\":\"Agent name or identifier, as returned by garrison_list_agents.\"}},\"required\":[\"agent\"]}"));
            tools.Add(Tool("garrison_invoke_agent", ResourceTypeEnum.Agent, OperationTypeEnum.Execute,
                "Ask another Garrison agent to do work and wait for its answer. Required arguments: agent (name or identifier) and input (the complete request, including any context the agent needs, because it cannot see your conversation). Optional arguments are rarely needed: omit parameters, deploymentId, and waitSeconds unless you have a specific value for them. To hold a multi-turn conversation, pass startConversation true on the first request and the returned conversationId on each follow-up; one turn of a conversation runs at a time. If the agent is still working when the wait ends, the result carries the runId and status; call garrison_get_run or garrison_get_run_events to follow it.",
                "{\"type\":\"object\",\"properties\":{\"agent\":{\"type\":\"string\",\"description\":\"Agent name or identifier, as returned by garrison_list_agents.\"},\"input\":{\"type\":\"string\",\"description\":\"The complete request for the agent, with all the context it needs.\"},\"parameters\":{\"type\":\"object\",\"additionalProperties\":{\"type\":\"string\"},\"description\":\"Optional. Run parameters the agent allows, as string values. Omit it unless the agent's description asks for parameters.\"},\"deploymentId\":{\"type\":\"string\",\"description\":\"Optional. A deployment identifier (dep_...) of this agent, not an agent name. Omit it to use the agent's default routing.\"},\"conversationId\":{\"type\":\"string\",\"description\":\"Optional. A conversationId (cnv_...) from an earlier result of this agent: the request becomes the next turn of that conversation and the agent remembers the earlier turns. Omit it for a one-off request.\"},\"startConversation\":{\"type\":\"boolean\",\"description\":\"Optional. true starts a conversation; the result carries a conversationId to pass with follow-up requests. Omit it for a one-off request.\"},\"waitSeconds\":{\"type\":\"integer\",\"minimum\":0,\"description\":\"Optional. How long to wait for the answer. Omit it to use the server's maximum.\"}},\"required\":[\"agent\",\"input\"]}"));
            tools.Add(Tool("garrison_start_run", ResourceTypeEnum.Agent, OperationTypeEnum.Execute,
                "Start a run of another Garrison agent and return immediately with its runId. Required arguments: agent and input. Omit parameters and deploymentId unless you have a specific value for them. Pass startConversation or conversationId to hold a multi-turn conversation.",
                "{\"type\":\"object\",\"properties\":{\"agent\":{\"type\":\"string\",\"description\":\"Agent name or identifier, as returned by garrison_list_agents.\"},\"input\":{\"type\":\"string\",\"description\":\"The complete request for the agent, with all the context it needs.\"},\"parameters\":{\"type\":\"object\",\"additionalProperties\":{\"type\":\"string\"},\"description\":\"Optional. Run parameters the agent allows, as string values. Omit it unless the agent's description asks for parameters.\"},\"deploymentId\":{\"type\":\"string\",\"description\":\"Optional. A deployment identifier (dep_...) of this agent, not an agent name. Omit it to use the agent's default routing.\"},\"conversationId\":{\"type\":\"string\",\"description\":\"Optional. A conversationId (cnv_...) from an earlier result of this agent: the request becomes the next turn of that conversation. Omit it for a one-off request.\"},\"startConversation\":{\"type\":\"boolean\",\"description\":\"Optional. true starts a conversation; the result carries a conversationId to pass with follow-up requests.\"}},\"required\":[\"agent\",\"input\"]}"));
            tools.Add(Tool("garrison_get_run", ResourceTypeEnum.Run, OperationTypeEnum.Read,
                "Get the status and, when finished, the result of a run. Required argument: runId.",
                "{\"type\":\"object\",\"properties\":{\"runId\":{\"type\":\"string\",\"description\":\"Run identifier (run_...).\"}},\"required\":[\"runId\"]}"));
            tools.Add(Tool("garrison_get_run_events", ResourceTypeEnum.Run, OperationTypeEnum.Read,
                "Read a run's events (text, tool calls, usage) after a sequence number, to follow progress. Required: runId. Omit the optional afterSequence (default 0) and limit (1 to 500, default 100) unless you are paging.",
                "{\"type\":\"object\",\"properties\":{\"runId\":{\"type\":\"string\",\"description\":\"Run identifier (run_...).\"},\"afterSequence\":{\"type\":\"integer\",\"minimum\":0,\"description\":\"Optional. Return events after this sequence number. Default 0.\"},\"limit\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":500,\"description\":\"Optional. Default 100.\"}},\"required\":[\"runId\"]}"));
            tools.Add(Tool("garrison_cancel_run", ResourceTypeEnum.Run, OperationTypeEnum.Update,
                "Cancel a run that is queued or working. Required argument: runId.",
                "{\"type\":\"object\",\"properties\":{\"runId\":{\"type\":\"string\",\"description\":\"Run identifier (run_...).\"}},\"required\":[\"runId\"]}"));
            tools.Add(Tool("garrison_list_runs", ResourceTypeEnum.Run, OperationTypeEnum.Read,
                "List recent runs. Call it with no arguments unless you need to filter; omit optional arguments you do not need. Optional: status (Queued, Running, Succeeded, Failed, Cancelled, TimedOut), agent (name or identifier), and maxResults (1 to 100, default 25).",
                "{\"type\":\"object\",\"properties\":{\"status\":{\"type\":\"string\",\"description\":\"Optional. Queued, Running, Succeeded, Failed, Cancelled, or TimedOut.\"},\"agent\":{\"type\":\"string\",\"description\":\"Optional. Agent name or identifier.\"},\"maxResults\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":100,\"description\":\"Optional. Default 25.\"}}}"));
            tools.Add(Tool("garrison_permission_prompt", ResourceTypeEnum.Approval, OperationTypeEnum.Create,
                "Garrison's permission prompt for harness tool calls. Claude Code calls it through --permission-prompt-tool before running a tool; do not call it yourself. Arguments: tool_name and input (the tool's input object). Answers {\"behavior\":\"allow\",\"updatedInput\":...} or {\"behavior\":\"deny\",\"message\":...} after the deployment's approval rules or a person decide. Only run tokens may call it.",
                "{\"type\":\"object\",\"properties\":{\"tool_name\":{\"type\":\"string\",\"description\":\"Tool that wants to run, for example Bash.\"},\"input\":{\"type\":\"object\",\"description\":\"The tool's input.\"},\"tool_use_id\":{\"type\":\"string\",\"description\":\"Optional. The tool call identifier.\"}},\"required\":[\"tool_name\",\"input\"]}"));
            tools.Add(Tool("garrison_list_approvals", ResourceTypeEnum.Approval, OperationTypeEnum.Read,
                "List permission approvals, newest first. Call it with no arguments unless you need to filter. Optional: status (Pending, Approved, Denied, Expired, Cancelled), runId, agent (name or identifier), and maxResults (1 to 100, default 25).",
                "{\"type\":\"object\",\"properties\":{\"status\":{\"type\":\"string\",\"description\":\"Optional. Pending, Approved, Denied, Expired, or Cancelled.\"},\"runId\":{\"type\":\"string\",\"description\":\"Optional. Run identifier (run_...).\"},\"agent\":{\"type\":\"string\",\"description\":\"Optional. Agent name or identifier.\"},\"maxResults\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":100,\"description\":\"Optional. Default 25.\"}}}"));
            tools.Add(Tool("garrison_get_approval", ResourceTypeEnum.Approval, OperationTypeEnum.Read,
                "Get one permission approval: the tool, a redacted preview of its input, the rule that matched, and the decision. Required argument: approvalId.",
                "{\"type\":\"object\",\"properties\":{\"approvalId\":{\"type\":\"string\",\"description\":\"Approval identifier (apr_...).\"}},\"required\":[\"approvalId\"]}"));
            tools.Add(Tool("garrison_decide_approval", ResourceTypeEnum.Approval, OperationTypeEnum.Update,
                "Allow or deny a pending permission approval; the waiting harness continues at once. Required: approvalId and decision (Allow or Deny). Optional: reason (shown to the harness on a denial), remember (true adds a deployment rule so the same request is decided the same way next time; needs permission to update the deployment), and rulePattern (the rule to add; defaults to the approval's suggested rule).",
                "{\"type\":\"object\",\"properties\":{\"approvalId\":{\"type\":\"string\",\"description\":\"Approval identifier (apr_...).\"},\"decision\":{\"type\":\"string\",\"enum\":[\"Allow\",\"Deny\"],\"description\":\"Allow or Deny.\"},\"reason\":{\"type\":\"string\",\"description\":\"Optional. Why.\"},\"remember\":{\"type\":\"boolean\",\"description\":\"Optional. Also add a deployment rule. Default false.\"},\"rulePattern\":{\"type\":\"string\",\"description\":\"Optional. Rule to add when remember is true, for example Bash(git status:*).\"}},\"required\":[\"approvalId\",\"decision\"]}"));
            tools.Add(UserTool("garrison_list_pipelines", ResourceTypeEnum.Pipeline, OperationTypeEnum.Read,
                "List the pipelines in your tenant: ordered agent stages with optional human review gates. Call it with no arguments unless you need to narrow the list. Optional: search (part of a pipeline name) and maxResults (1 to 100, default 25).",
                "{\"type\":\"object\",\"properties\":{\"search\":{\"type\":\"string\",\"description\":\"Optional. Part of a pipeline name.\"},\"maxResults\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":100,\"description\":\"Optional. Default 25.\"}}}"));
            tools.Add(UserTool("garrison_start_pipeline", ResourceTypeEnum.Pipeline, OperationTypeEnum.Execute,
                "Start a pipeline: its stages run in order and each stage receives your input plus the earlier stages' results. Required: pipeline (name or identifier) and input (the complete request). Optional: waitSeconds waits until the pipeline run ends or waits for a review (omit it to return at once), idempotencyKey makes a repeated start return the same pipeline run, inputContentType, and priority. Requires permission to run every stage agent. Follow the returned pipelineRunId with garrison_get_pipeline_run.",
                "{\"type\":\"object\",\"properties\":{\"pipeline\":{\"type\":\"string\",\"description\":\"Pipeline name or identifier (ppl_...).\"},\"input\":{\"type\":\"string\",\"description\":\"The complete request every stage works on.\"},\"waitSeconds\":{\"type\":\"integer\",\"minimum\":0,\"maximum\":600,\"description\":\"Optional. Seconds to wait until the pipeline run ends or waits for a review. Omit it to return at once.\"},\"idempotencyKey\":{\"type\":\"string\",\"description\":\"Optional. Repeating a start with the same key and input returns the same pipeline run.\"},\"inputContentType\":{\"type\":\"string\",\"description\":\"Optional. Media type of the input. Default text/plain.\"},\"priority\":{\"type\":\"integer\",\"description\":\"Optional. Priority of the stage runs. Default 0.\"}},\"required\":[\"pipeline\",\"input\"]}"));
            tools.Add(UserTool("garrison_get_pipeline_run", ResourceTypeEnum.PipelineRun, OperationTypeEnum.Read,
                "Get a pipeline run: its status and outcome, each stage with its runs, and its reviews. Required: pipelineRunId. Optional: waitSeconds waits until the pipeline run ends or waits for a review.",
                "{\"type\":\"object\",\"properties\":{\"pipelineRunId\":{\"type\":\"string\",\"description\":\"Pipeline run identifier (plr_...).\"},\"waitSeconds\":{\"type\":\"integer\",\"minimum\":0,\"maximum\":600,\"description\":\"Optional. Seconds to wait until the pipeline run ends or waits for a review. Omit it to read at once.\"}},\"required\":[\"pipelineRunId\"]}"));
            tools.Add(UserTool("garrison_list_pipeline_runs", ResourceTypeEnum.PipelineRun, OperationTypeEnum.Read,
                "List recent pipeline runs, newest first. Call it with no arguments unless you need to filter. Optional: pipeline (name or identifier), status (Running, AwaitingReview, Cancelling, Succeeded, Failed, Cancelled, TimedOut), and maxResults (1 to 100, default 25).",
                "{\"type\":\"object\",\"properties\":{\"pipeline\":{\"type\":\"string\",\"description\":\"Optional. Pipeline name or identifier.\"},\"status\":{\"type\":\"string\",\"description\":\"Optional. Running, AwaitingReview, Cancelling, Succeeded, Failed, Cancelled, or TimedOut.\"},\"maxResults\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":100,\"description\":\"Optional. Default 25.\"}}}"));
            tools.Add(UserTool("garrison_cancel_pipeline_run", ResourceTypeEnum.PipelineRun, OperationTypeEnum.Update,
                "Cancel an active pipeline run: its pending review and its current stage run are cancelled too. Required: pipelineRunId.",
                "{\"type\":\"object\",\"properties\":{\"pipelineRunId\":{\"type\":\"string\",\"description\":\"Pipeline run identifier (plr_...).\"}},\"required\":[\"pipelineRunId\"]}"));
            tools.Add(UserTool("garrison_list_pipeline_reviews", ResourceTypeEnum.Approval, OperationTypeEnum.Read,
                "List pipeline stage reviews, newest first. Call it with no arguments unless you need to filter. Optional: status (Pending, Approved, ChangesRequested, Rejected, Expired, Cancelled), pipelineRunId, and maxResults (1 to 100, default 25).",
                "{\"type\":\"object\",\"properties\":{\"status\":{\"type\":\"string\",\"description\":\"Optional. Pending, Approved, ChangesRequested, Rejected, Expired, or Cancelled.\"},\"pipelineRunId\":{\"type\":\"string\",\"description\":\"Optional. Pipeline run identifier (plr_...).\"},\"maxResults\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":100,\"description\":\"Optional. Default 25.\"}}}"));
            tools.Add(UserTool("garrison_decide_pipeline_review", ResourceTypeEnum.Approval, OperationTypeEnum.Update,
                "Decide a pending pipeline stage review. Required: reviewId and decision. Approve continues the pipeline (an optional comment reaches the next stage as review notes); RequestChanges runs the stage again with your comment as feedback (comment required, limited by the stage's maxRevisions); Reject fails the pipeline run.",
                "{\"type\":\"object\",\"properties\":{\"reviewId\":{\"type\":\"string\",\"description\":\"Review identifier (prv_...).\"},\"decision\":{\"type\":\"string\",\"enum\":[\"Approve\",\"RequestChanges\",\"Reject\"],\"description\":\"Approve, RequestChanges, or Reject.\"},\"comment\":{\"type\":\"string\",\"description\":\"Optional for Approve and Reject, required for RequestChanges. At most 8000 characters.\"}},\"required\":[\"reviewId\",\"decision\"]}"));
            return tools;
        }

        #endregion

        #region Private-Methods

        private static McpToolDefinition Management(string name, ResourceTypeEnum resourceType, OperationTypeEnum operation, string description, string schema)
        {
            McpToolDefinition tool = Tool(name, resourceType, operation, description, schema);
            tool.ManagementTool = true;
            tool.UserOnly = true;
            return tool;
        }

        private static McpToolDefinition UserTool(string name, ResourceTypeEnum resourceType, OperationTypeEnum operation, string description, string schema)
        {
            McpToolDefinition tool = Tool(name, resourceType, operation, description, schema);
            tool.UserOnly = true;
            return tool;
        }

        private static string ConfigurationSchema(Type type, string? identifier)
        {
            Dictionary<string, object?> properties = new Dictionary<string, object?>();
            properties["configuration"] = OpenApiSchemaFactory.For(type);
            List<string> required = new List<string> { "configuration" };
            if (identifier != null)
            {
                properties[identifier] = new Dictionary<string, object?> { ["type"] = "string" };
                required.Add(identifier);
            }
            return Serializer.Serialize(new Dictionary<string, object?> { ["type"] = "object", ["properties"] = properties, ["required"] = required });
        }

        private static McpToolDefinition Tool(string name, ResourceTypeEnum resourceType, OperationTypeEnum operation, string description, string schema)
        {
            McpToolDefinition tool = new McpToolDefinition();
            tool.Name = name;
            tool.ResourceType = resourceType;
            tool.Operation = operation;
            tool.DescriptionTemplate = BuiltInDescriptionPrefix + name;
            tool.DefaultDescription = description;
            tool.InputSchemaJson = schema;
            tool.AdministratorInputSchemaJson = WithTenantId(schema);
            return tool;
        }

        private static string WithTenantId(string schema)
        {
            Dictionary<string, object?> document = Serializer.Deserialize<Dictionary<string, object?>>(schema) ?? new Dictionary<string, object?>();
            Dictionary<string, object?> properties = document.TryGetValue("properties", out object? value)
                ? Serializer.Deserialize<Dictionary<string, object?>>(Serializer.Serialize(value)) ?? new Dictionary<string, object?>()
                : new Dictionary<string, object?>();
            properties["tenantId"] = new Dictionary<string, object?> { ["type"] = "string", ["description"] = _TenantIdDescription };
            document["properties"] = properties;
            return Serializer.Serialize(document);
        }

        #endregion
    }
}
