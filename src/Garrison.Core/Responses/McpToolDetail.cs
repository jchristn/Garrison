namespace Garrison.Core.Responses
{
    using System;
    using System.Text.Json;

    /// <summary>
    /// One tool an MCP server listed, with what the capability catalog copies from it (AD4.3).
    /// </summary>
    public class McpToolDetail
    {
        #region Public-Members

        /// <summary>
        /// Longest description kept, in characters.
        /// </summary>
        public static readonly int MaxDescriptionLength = 4000;

        /// <summary>
        /// Longest input schema kept, in characters; a longer one is dropped.
        /// </summary>
        public static readonly int MaxSchemaLength = 65536;

        /// <summary>
        /// Tool name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// The server's description of the tool, or null. Truncated to <see cref="MaxDescriptionLength"/> characters.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// The tool's input JSON Schema as JSON text, or null. Dropped when longer than <see cref="MaxSchemaLength"/>.
        /// </summary>
        public string? InputSchemaJson { get; set; } = null;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build a bounded detail from what a server listed. The schema is copied as raw JSON text and never navigated.
        /// </summary>
        /// <param name="name">Tool name.</param>
        /// <param name="description">Description, or null.</param>
        /// <param name="inputSchema">Input schema, or null.</param>
        /// <returns>Detail.</returns>
        public static McpToolDetail Create(string name, string? description, JsonElement? inputSchema)
        {
            McpToolDetail detail = new McpToolDetail();
            detail.Name = name ?? String.Empty;
            string? trimmed = String.IsNullOrWhiteSpace(description) ? null : description.Trim();
            detail.Description = trimmed != null && trimmed.Length > MaxDescriptionLength ? trimmed.Substring(0, MaxDescriptionLength) : trimmed;
            if (inputSchema.HasValue && inputSchema.Value.ValueKind == JsonValueKind.Object)
            {
                string raw = inputSchema.Value.GetRawText();
                detail.InputSchemaJson = raw.Length > MaxSchemaLength ? null : raw;
            }
            return detail;
        }

        #endregion
    }
}
