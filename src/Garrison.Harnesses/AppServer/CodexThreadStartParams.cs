namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Parameters of <c>thread/start</c> (<c>ThreadStartParams</c>). Unset values come from the configuration the process was started with (<c>-c</c> overrides).
    /// </summary>
    public class CodexThreadStartParams
    {
        #region Public-Members

        /// <summary>
        /// Working directory of the thread, or null for the process working directory.
        /// </summary>
        [JsonPropertyName("cwd")]
        public string? Cwd { get; set; } = null;

        /// <summary>
        /// Approval policy (never, on-request, untrusted), or null for the configured one.
        /// </summary>
        [JsonPropertyName("approvalPolicy")]
        public string? ApprovalPolicy { get; set; } = null;

        #endregion
    }
}
