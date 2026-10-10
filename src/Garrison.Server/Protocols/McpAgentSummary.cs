namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Agent description returned by MCP tools.
    /// </summary>
    public class McpAgentSummary
    {
        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Agent name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Display name.
        /// </summary>
        public string? DisplayName { get; set; } = null;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Input mode.
        /// </summary>
        public string InputMode { get; set; } = "Text";

        /// <summary>
        /// Skills.
        /// </summary>
        public List<string> Skills { get; set; } = new List<string>();

        /// <summary>
        /// Input JSON Schema, when structured.
        /// </summary>
        public string? InputSchemaJson { get; set; } = null;

        /// <summary>
        /// Output JSON Schema, when structured.
        /// </summary>
        public string? OutputSchemaJson { get; set; } = null;
    }
}
