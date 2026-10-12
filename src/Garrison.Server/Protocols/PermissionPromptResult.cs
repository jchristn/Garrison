namespace Garrison.Server.Protocols
{
    using System;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>
    /// The answer Claude Code expects from a <c>--permission-prompt-tool</c> (P12.3), as the text of the tool result:
    /// <c>{"behavior":"allow","updatedInput":{...}}</c> or <c>{"behavior":"deny","message":"..."}</c>. Garrison adds
    /// the approval identifier and status for other callers (the worker's Codex relay); Claude Code ignores them.
    /// </summary>
    public class PermissionPromptResult
    {
        #region Public-Members

        /// <summary>
        /// allow or deny.
        /// </summary>
        [JsonPropertyName("behavior")]
        public string Behavior { get; set; } = "deny";

        /// <summary>
        /// The tool input to run with (the original input, unchanged) when allowed; omitted when denied.
        /// </summary>
        [JsonPropertyName("updatedInput")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public JsonElement? UpdatedInput { get; set; } = null;

        /// <summary>
        /// Why the call was denied (rendered from the approval-denied prompt template); omitted when allowed.
        /// </summary>
        [JsonPropertyName("message")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Message { get; set; } = null;

        /// <summary>
        /// Approval identifier, or null when nothing was recorded.
        /// </summary>
        [JsonPropertyName("approvalId")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ApprovalId { get; set; } = null;

        /// <summary>
        /// Final approval status (Approved, Denied, Expired, Cancelled), or null.
        /// </summary>
        [JsonPropertyName("approvalStatus")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ApprovalStatus { get; set; } = null;

        #endregion
    }
}
