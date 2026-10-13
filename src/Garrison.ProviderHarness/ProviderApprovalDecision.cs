namespace Garrison.ProviderHarness
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>Typed provider MCP protocol contract.</summary>
    public class ProviderApprovalDecision
    {
        /// <summary>allow or deny.</summary>
        [JsonPropertyName("behavior")]
        public string Behavior { get; set; } = "deny";
        /// <summary>Optional approved replacement arguments.</summary>
        [JsonPropertyName("updatedInput")]
        public Dictionary<string, object?>? UpdatedInput { get; set; } = null;
        /// <summary>Denial detail from the configured approval prompt.</summary>
        [JsonPropertyName("message")]
        public string? Message { get; set; } = null;
    }
}
