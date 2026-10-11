namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// Raised while compiling a run when a bound credential cannot be used: a CodexAuthJson login that needs
    /// reauthentication (code <c>SecretNeedsReauthentication</c>), or one that is expired and could not be refreshed
    /// right now (code <c>SecretRefreshFailed</c>). The run fails with outcome NotCredentialed (G-22).
    /// </summary>
    public class CredentialUnavailableException : CompilationException
    {
        #region Public-Members

        /// <summary>
        /// Identifier of the secret that cannot be used.
        /// </summary>
        public string SecretId { get; }

        /// <summary>
        /// Name of the secret that cannot be used.
        /// </summary>
        public string SecretName { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="code">Stable error code: SecretNeedsReauthentication or SecretRefreshFailed.</param>
        /// <param name="secretId">Secret identifier.</param>
        /// <param name="secretName">Secret name.</param>
        /// <param name="message">Message for the operator, saying what to do.</param>
        public CredentialUnavailableException(string code, string secretId, string secretName, string message) : base(code, message)
        {
            SecretId = secretId ?? String.Empty;
            SecretName = secretName ?? String.Empty;
        }

        /// <summary>
        /// Instantiate with an inner exception.
        /// </summary>
        /// <param name="code">Stable error code: SecretNeedsReauthentication or SecretRefreshFailed.</param>
        /// <param name="secretId">Secret identifier.</param>
        /// <param name="secretName">Secret name.</param>
        /// <param name="message">Message for the operator, saying what to do.</param>
        /// <param name="inner">Inner exception.</param>
        public CredentialUnavailableException(string code, string secretId, string secretName, string message, Exception inner) : base(code, message, inner)
        {
            SecretId = secretId ?? String.Empty;
            SecretName = secretName ?? String.Empty;
        }

        #endregion
    }
}
