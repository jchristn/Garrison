namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Body of an app session request. Leave both fields null for an anonymous session. Not thread-safe.
    /// </summary>
    public class AppSessionRequest
    {
        /// <summary>
        /// Email of an app user or tenant user, or null.
        /// </summary>
        public string? Email { get; set; } = null;

        /// <summary>
        /// Password, or null.
        /// </summary>
        public string? Password { get; set; } = null;
    }
}
