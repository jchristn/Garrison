namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// The Garrison MCP tools. Descriptions are seeded as built-in prompt templates (builtin/mcp-tool-*) and rendered
    /// at startup, so every word a harness reads can be changed without a release (D-021). A tenant template with the
    /// same name in the Default tenant overrides the built-in.
    /// </summary>
    public static class McpToolCatalog
    {
        /// <summary>
        /// All tools.
        /// </summary>
        /// <returns>Tool definitions.</returns>
        public static List<McpToolDefinition> All()
        {
            List<McpToolDefinition> tools = new List<McpToolDefinition>();
            tools.Add(Tool("garrison_list_agents", ResourceTypeEnum.Agent, OperationTypeEnum.Read,
                "List the Garrison agents you may invoke, with their names, descriptions, and skills. Optional arguments: search (part of an agent name) and maxResults (1 to 100, default 25).",
                "{\"type\":\"object\",\"properties\":{\"search\":{\"type\":\"string\",\"description\":\"Part of an agent name.\"},\"maxResults\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":100}}}"));
            tools.Add(Tool("garrison_get_agent", ResourceTypeEnum.Agent, OperationTypeEnum.Read,
                "Describe one Garrison agent: purpose, skills, input mode, and output schema. Required argument: agent (name or identifier).",
                "{\"type\":\"object\",\"properties\":{\"agent\":{\"type\":\"string\",\"description\":\"Agent name or identifier.\"}},\"required\":[\"agent\"]}"));
            tools.Add(Tool("garrison_invoke_agent", ResourceTypeEnum.Agent, OperationTypeEnum.Execute,
                "Ask another Garrison agent to do work and wait for its answer. Required arguments: agent (name or identifier) and input (the complete request, including any context the agent needs, because it cannot see your conversation). Optional: parameters (object of string values the agent allows) and waitSeconds. If the agent is still working when the wait ends, the result carries the runId and status; call garrison_get_run or garrison_get_run_events to follow it.",
                "{\"type\":\"object\",\"properties\":{\"agent\":{\"type\":\"string\"},\"input\":{\"type\":\"string\"},\"parameters\":{\"type\":\"object\",\"additionalProperties\":{\"type\":\"string\"}},\"deploymentId\":{\"type\":\"string\"},\"waitSeconds\":{\"type\":\"integer\",\"minimum\":0}},\"required\":[\"agent\",\"input\"]}"));
            tools.Add(Tool("garrison_start_run", ResourceTypeEnum.Agent, OperationTypeEnum.Execute,
                "Start a run of another Garrison agent and return immediately with its runId. Same arguments as garrison_invoke_agent without waitSeconds.",
                "{\"type\":\"object\",\"properties\":{\"agent\":{\"type\":\"string\"},\"input\":{\"type\":\"string\"},\"parameters\":{\"type\":\"object\",\"additionalProperties\":{\"type\":\"string\"}},\"deploymentId\":{\"type\":\"string\"}},\"required\":[\"agent\",\"input\"]}"));
            tools.Add(Tool("garrison_get_run", ResourceTypeEnum.Run, OperationTypeEnum.Read,
                "Get the status and, when finished, the result of a run. Required argument: runId.",
                "{\"type\":\"object\",\"properties\":{\"runId\":{\"type\":\"string\"}},\"required\":[\"runId\"]}"));
            tools.Add(Tool("garrison_get_run_events", ResourceTypeEnum.Run, OperationTypeEnum.Read,
                "Read a run's events (text, tool calls, usage) after a sequence number, to follow progress. Required: runId. Optional: afterSequence (default 0) and limit (1 to 500, default 100).",
                "{\"type\":\"object\",\"properties\":{\"runId\":{\"type\":\"string\"},\"afterSequence\":{\"type\":\"integer\",\"minimum\":0},\"limit\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":500}},\"required\":[\"runId\"]}"));
            tools.Add(Tool("garrison_cancel_run", ResourceTypeEnum.Run, OperationTypeEnum.Update,
                "Cancel a run that is queued or working. Required argument: runId.",
                "{\"type\":\"object\",\"properties\":{\"runId\":{\"type\":\"string\"}},\"required\":[\"runId\"]}"));
            tools.Add(Tool("garrison_list_runs", ResourceTypeEnum.Run, OperationTypeEnum.Read,
                "List recent runs. Optional arguments: status (Queued, Running, Succeeded, Failed, Cancelled, TimedOut), agent (name or identifier), and maxResults (1 to 100, default 25).",
                "{\"type\":\"object\",\"properties\":{\"status\":{\"type\":\"string\"},\"agent\":{\"type\":\"string\"},\"maxResults\":{\"type\":\"integer\",\"minimum\":1,\"maximum\":100}}}"));
            return tools;
        }

        private static McpToolDefinition Tool(string name, ResourceTypeEnum resourceType, OperationTypeEnum operation, string description, string schema)
        {
            McpToolDefinition tool = new McpToolDefinition();
            tool.Name = name;
            tool.ResourceType = resourceType;
            tool.Operation = operation;
            tool.DescriptionTemplate = "builtin/mcp-tool-" + name;
            tool.DefaultDescription = description;
            tool.InputSchemaJson = schema.Replace(
                "\"properties\":{",
                "\"properties\":{\"tenantId\":{\"type\":\"string\",\"description\":\"Tenant to act in. Only system administrators need it; every other caller acts in its own tenant.\"},");
            return tool;
        }
    }
}
