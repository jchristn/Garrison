namespace Garrison.Server.Runtime
{
    using Garrison.Core.Codex;

    /// <summary>
    /// What the token endpoint said about one refresh request, classified the way the Codex CLI classifies it (G-22).
    /// Never carries token values other than the successful response itself.
    /// </summary>
    public class CodexTokenEndpointReply
    {
        #region Public-Members

        /// <summary>
        /// Successful response with a new access token, or null when the refresh failed.
        /// </summary>
        public CodexTokenRefreshResponse? Response { get; set; } = null;

        /// <summary>
        /// Whether the failure is permanent (the login needs reauthentication). False for success and for failures
        /// worth retrying.
        /// </summary>
        public bool Permanent { get; set; } = false;

        /// <summary>
        /// HTTP status, or null when no response arrived.
        /// </summary>
        public int? HttpStatus { get; set; } = null;

        /// <summary>
        /// Provider error code, or null.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// Operator-facing explanation of a failure, or null on success.
        /// </summary>
        public string? Message { get; set; } = null;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build a reply for a failure worth retrying.
        /// </summary>
        /// <param name="status">HTTP status, or null.</param>
        /// <param name="code">Provider error code, or null.</param>
        /// <param name="message">Explanation.</param>
        /// <returns>Reply.</returns>
        public static CodexTokenEndpointReply Transient(int? status, string? code, string message)
        {
            CodexTokenEndpointReply reply = new CodexTokenEndpointReply();
            reply.HttpStatus = status;
            reply.ErrorCode = code;
            reply.Message = message;
            return reply;
        }

        #endregion
    }
}
