namespace Garrison.Server.Runtime
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// Result of one control-plane check of a CodexAuthJson login (G-22). Raised through
    /// <see cref="CodexCredentialService.RefreshCompleted"/> so that telemetry can count outcomes in one place. Never
    /// carries token values.
    /// </summary>
    public class CodexRefreshResult
    {
        #region Public-Members

        /// <summary>
        /// Outcome.
        /// </summary>
        public CodexRefreshOutcomeEnum Outcome { get; set; } = CodexRefreshOutcomeEnum.NotNeeded;

        /// <summary>
        /// The secret as it stands after the check (read back after a refresh). Its value stays encrypted.
        /// </summary>
        public Secret Secret
        {
            get
            {
                return _Secret;
            }
            set
            {
                _Secret = value ?? throw new ArgumentNullException(nameof(Secret));
            }
        }

        /// <summary>
        /// Operator-facing explanation for NeedsReauthentication and Failed (provider error code and description, or
        /// the transport error), or null.
        /// </summary>
        public string? Message { get; set; } = null;

        /// <summary>
        /// Provider error code for NeedsReauthentication and Failed when the endpoint returned one (for example
        /// refresh_token_reused or invalid_grant), or null.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// HTTP status of the refresh request, or null when none was sent or no response arrived.
        /// </summary>
        public int? HttpStatus { get; set; } = null;

        /// <summary>
        /// Whether the check was made for a run (true) or by the background refresh (false).
        /// </summary>
        public bool ForRun { get; set; } = false;

        /// <summary>
        /// Time the check took, including any wait for another replica's refresh, in milliseconds.
        /// </summary>
        public double DurationMs { get; set; } = 0;

        #endregion

        #region Private-Members

        private Secret _Secret = new Secret();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="outcome">Outcome.</param>
        /// <param name="secret">Secret after the check.</param>
        /// <param name="message">Explanation, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when secret is null.</exception>
        public CodexRefreshResult(CodexRefreshOutcomeEnum outcome, Secret secret, string? message = null)
        {
            Outcome = outcome;
            Secret = secret ?? throw new ArgumentNullException(nameof(secret));
            Message = message;
        }

        #endregion
    }
}
