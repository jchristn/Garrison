namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// MCP server connection test result.
    /// </summary>
    public class McpServerTestResponse
    {
        /// <summary>Selected worker identifier for stdio, or null for HTTP.</summary>
        public string? NodeId { get; set; } = null;

        /// <summary>
        /// Whether the server answered tools/list.
        /// </summary>
        public bool Success { get; set; } = false;

        /// <summary>
        /// Tool names.
        /// </summary>
        public List<string> Tools { get; set; } = new List<string>();

        /// <summary>
        /// Each listed tool with its description and input schema.
        /// </summary>
        public List<McpToolDetail> ToolDetails { get; set; } = new List<McpToolDetail>();

        /// <summary>
        /// Required tools the server did not list.
        /// </summary>
        public List<string> MissingRequiredTools { get; set; } = new List<string>();

        /// <summary>
        /// Error message.
        /// </summary>
        public string? Error { get; set; } = null;

        /// <summary>
        /// Duration in milliseconds.
        /// </summary>
        public long DurationMs { get; set; } = 0;
    }
}
