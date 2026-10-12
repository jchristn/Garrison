namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Parameters of <c>item/commandExecution/requestApproval</c> and <c>item/fileChange/requestApproval</c> (Codex
    /// 0.159.3); fields one kind does not send are null.
    /// </summary>
    public class CodexApprovalRequestParams
    {
        #region Public-Members

        /// <summary>
        /// Item the approval is for.
        /// </summary>
        [JsonPropertyName("itemId")]
        public string? ItemId { get; set; } = null;

        /// <summary>
        /// Command line (command approvals).
        /// </summary>
        [JsonPropertyName("command")]
        public string? Command { get; set; } = null;

        /// <summary>
        /// Working directory (command approvals).
        /// </summary>
        [JsonPropertyName("cwd")]
        public string? Cwd { get; set; } = null;

        /// <summary>
        /// Why Codex asks, when it says.
        /// </summary>
        [JsonPropertyName("reason")]
        public string? Reason { get; set; } = null;

        /// <summary>
        /// Directory Codex wants write access under for the session (file change approvals), or null.
        /// </summary>
        [JsonPropertyName("grantRoot")]
        public string? GrantRoot { get; set; } = null;

        #endregion
    }
}
