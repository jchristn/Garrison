namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// MCP server connection test result.
    /// </summary>
    public class McpServerTestResponse
    {
        /// <summary>Worker selected for a stdio test, or null for an HTTP test.</summary>
        public string? NodeId { get; set; } = null;

        /// <summary>Whether the server answered tools/list.</summary>
        public bool Success { get; set; } = false;

        /// <summary>
        /// Tool names.
        /// </summary>
        public List<string> Tools { get; set; } = new List<string>();

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
