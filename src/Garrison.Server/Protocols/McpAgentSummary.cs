namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;

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
        [JsonIgnore]
        public string? InputSchemaJson { get; set; } = null;

        /// <summary>
        /// JSON Schema the input must match, as a JSON object; null when the agent takes free text. Stored as
        /// <see cref="InputSchemaJson"/>. A request may also send the schema as a JSON string.
        /// </summary>
        public JsonElement? InputSchema
        {
            get
            {
                return JsonText.Value(InputSchemaJson);
            }
            set
            {
                InputSchemaJson = JsonText.Text(value);
            }
        }

        /// <summary>
        /// Output JSON Schema, when structured.
        /// </summary>
        [JsonIgnore]
        public string? OutputSchemaJson { get; set; } = null;

        /// <summary>
        /// JSON Schema the structured output must match, as a JSON object; null when the agent answers free text.
        /// Stored as <see cref="OutputSchemaJson"/>. A request may also send the schema as a JSON string.
        /// </summary>
        public JsonElement? OutputSchema
        {
            get
            {
                return JsonText.Value(OutputSchemaJson);
            }
            set
            {
                OutputSchemaJson = JsonText.Text(value);
            }
        }

        /// <summary>
        /// Cost and latency hints from the capability catalog (AD4.5), or null when the agent has no descriptor yet.
        /// Values are null, never zero, while the status is Unknown.
        /// </summary>
        public Garrison.Core.Models.CapabilityHints? Hints { get; set; } = null;
    }
}
