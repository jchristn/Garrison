namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Enums;

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
            tools.Add(Tool("garrison_list_agents", ResourceTypeEnum.Agent, OperationTypeEnum.Read,
                "List the Garrison agents you may invoke, with their names, descriptions, and skills. Call it with no arguments unless you need to narrow the list; omit optional arguments you do not need. Optional: search (part of an agent name) and maxResults (1 to 100, default 25).",
                "{\"type\":\"object\",\"properties\":{\"search\":{\"type\":\"string\",\"description\":\"Optional. Part of an agent name. Omit it to list every agent you may invoke.\"},\"maxResults\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":100,\"description\":\"Optional. Default 25. Omit it unless you need more.\"}}}"));
            tools.Add(Tool("garrison_get_agent", ResourceTypeEnum.Agent, OperationTypeEnum.Read,
                "Describe one Garrison agent: purpose, skills, input mode, and output schema. Required argument: agent (name or identifier).",
                "{\"type\":\"object\",\"properties\":{\"agent\":{\"type\":\"string\",\"description\":\"Agent name or identifier, as returned by garrison_list_agents.\"}},\"required\":[\"agent\"]}"));
            tools.Add(Tool("garrison_invoke_agent", ResourceTypeEnum.Agent, OperationTypeEnum.Execute,
                "Ask another Garrison agent to do work and wait for its answer. Required arguments: agent (name or identifier) and input (the complete request, including any context the agent needs, because it cannot see your conversation). Optional arguments are rarely needed: omit parameters, deploymentId, and waitSeconds unless you have a specific value for them. If the agent is still working when the wait ends, the result carries the runId and status; call garrison_get_run or garrison_get_run_events to follow it.",
                "{\"type\":\"object\",\"properties\":{\"agent\":{\"type\":\"string\",\"description\":\"Agent name or identifier, as returned by garrison_list_agents.\"},\"input\":{\"type\":\"string\",\"description\":\"The complete request for the agent, with all the context it needs.\"},\"parameters\":{\"type\":\"object\",\"additionalProperties\":{\"type\":\"string\"},\"description\":\"Optional. Run parameters the agent allows, as string values. Omit it unless the agent's description asks for parameters.\"},\"deploymentId\":{\"type\":\"string\",\"description\":\"Optional. A deployment identifier (dep_...) of this agent, not an agent name. Omit it to use the agent's default routing.\"},\"waitSeconds\":{\"type\":\"integer\",\"minimum\":0,\"description\":\"Optional. How long to wait for the answer. Omit it to use the server's maximum.\"}},\"required\":[\"agent\",\"input\"]}"));
            tools.Add(Tool("garrison_start_run", ResourceTypeEnum.Agent, OperationTypeEnum.Execute,
                "Start a run of another Garrison agent and return immediately with its runId. Required arguments: agent and input. Omit parameters and deploymentId unless you have a specific value for them.",
                "{\"type\":\"object\",\"properties\":{\"agent\":{\"type\":\"string\",\"description\":\"Agent name or identifier, as returned by garrison_list_agents.\"},\"input\":{\"type\":\"string\",\"description\":\"The complete request for the agent, with all the context it needs.\"},\"parameters\":{\"type\":\"object\",\"additionalProperties\":{\"type\":\"string\"},\"description\":\"Optional. Run parameters the agent allows, as string values. Omit it unless the agent's description asks for parameters.\"},\"deploymentId\":{\"type\":\"string\",\"description\":\"Optional. A deployment identifier (dep_...) of this agent, not an agent name. Omit it to use the agent's default routing.\"}},\"required\":[\"agent\",\"input\"]}"));
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
            return tools;
        }

        #endregion

        #region Private-Methods

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
            return schema.Replace(
                "\"properties\":{",
                "\"properties\":{\"tenantId\":{\"type\":\"string\",\"description\":\"" + _TenantIdDescription + "\"},");
        }

        #endregion
    }
}
