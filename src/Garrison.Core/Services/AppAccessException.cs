namespace Garrison.Core.Services
{
    using System;

    /// <summary>
    /// An app gateway request without a usable app session (401) or by a user the app does not admit (403) (AD6.5).
    /// </summary>
    public class AppAccessException : Exception
    {
        /// <summary>
        /// HTTP status: 401 or 403.
        /// </summary>
        public int StatusCode { get; }

        /// <summary>
        /// Machine-readable code, for example AppSessionRequired, AppAccessDenied, AnonymousDisabled.
        /// </summary>
        public string Code { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="statusCode">401 or 403.</param>
        /// <param name="code">Code.</param>
        /// <param name="message">Message.</param>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the status is not 401 or 403.</exception>
        public AppAccessException(int statusCode, string code, string message) : base(message)
        {
            if (statusCode != 401 && statusCode != 403) throw new ArgumentOutOfRangeException(nameof(statusCode), "App access errors are 401 or 403.");
            StatusCode = statusCode;
            Code = code ?? "AppAccessDenied";
        }
    }
}
