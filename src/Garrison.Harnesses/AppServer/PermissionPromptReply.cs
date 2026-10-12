namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// The decision garrison_permission_prompt returns (P12.3), read by the worker's Codex approval relay.
    /// </summary>
    public class PermissionPromptReply
    {
        #region Public-Members

        /// <summary>
        /// allow or deny.
        /// </summary>
        [JsonPropertyName("behavior")]
        public string? Behavior { get; set; } = null;

        /// <summary>
        /// Denial message, or null.
        /// </summary>
        [JsonPropertyName("message")]
        public string? Message { get; set; } = null;

        /// <summary>
        /// Approval identifier, or null.
        /// </summary>
        [JsonPropertyName("approvalId")]
        public string? ApprovalId { get; set; } = null;

        /// <summary>
        /// Whether the call may run.
        /// </summary>
        [JsonIgnore]
        public bool Allowed
        {
            get
            {
                return Behavior == "allow";
            }
        }

        #endregion
    }
}
