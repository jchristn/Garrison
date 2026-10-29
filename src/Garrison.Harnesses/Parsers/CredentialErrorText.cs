namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// Recognizes provider error messages that mean the harness has no valid credentials, for parsers whose harness
    /// reports model errors in its output stream rather than on stderr (opencode, pi). Thread-safe.
    /// </summary>
    public static class CredentialErrorText
    {
        #region Private-Members

        private static readonly List<string> _Markers = new List<string>
        {
            "401 unauthorized",
            "authentication_error",
            "invalid api key",
            "invalid_api_key",
            "invalid x-api-key",
            "incorrect api key",
            "api key is missing",
            "missing api key",
            "no api key",
            "api key not found",
            "not logged in"
        };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether the text describes a credential failure: it starts with the HTTP status 401, or it contains one of
        /// the known authentication failure phrases (case-insensitive).
        /// </summary>
        /// <param name="text">Error text; null or empty is never a credential failure.</param>
        /// <returns>True for a credential failure.</returns>
        public static bool IsCredentialFailure(string? text)
        {
            if (String.IsNullOrWhiteSpace(text)) return false;
            string lower = text.Trim().ToLowerInvariant();
            if (lower.StartsWith("401 ", StringComparison.Ordinal) || lower == "401") return true;
            return _Markers.Any(m => lower.Contains(m, StringComparison.Ordinal));
        }

        #endregion
    }
}
