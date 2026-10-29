namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// A new app session (AD6.5). Send the token as "Authorization: Bearer {token}" to the app's gateway routes only.
    /// </summary>
    public class AppSessionResponse
    {
        /// <summary>
        /// Session token (prefix gas_). Shown once.
        /// </summary>
        public string Token { get; set; } = String.Empty;

        /// <summary>
        /// When the session ends (UTC).
        /// </summary>
        public DateTime ExpiresUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Who the session is for: the user's email, or "anonymous".
        /// </summary>
        public string PrincipalName { get; set; } = String.Empty;

        /// <summary>
        /// Whether the session is anonymous.
        /// </summary>
        public bool Anonymous { get; set; } = false;
    }
}
