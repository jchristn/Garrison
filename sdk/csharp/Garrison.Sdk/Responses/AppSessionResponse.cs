namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// An app session. The token has the prefix gas_ and works only on /v1.0/apps/{slug}/ for that app. Not thread-safe.
    /// </summary>
    public class AppSessionResponse
    {
        /// <summary>
        /// Session token, sent as a bearer token. Never null.
        /// </summary>
        public string Token
        {
            get
            {
                return _Token;
            }
            set
            {
                _Token = value ?? String.Empty;
            }
        }

        /// <summary>
        /// When the session expires, UTC.
        /// </summary>
        public DateTime ExpiresUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Name of the signed-in principal (an anonymous name for anonymous sessions). Never null.
        /// </summary>
        public string PrincipalName
        {
            get
            {
                return _PrincipalName;
            }
            set
            {
                _PrincipalName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// True for an anonymous session.
        /// </summary>
        public bool Anonymous { get; set; } = false;

        private string _Token = String.Empty;
        private string _PrincipalName = String.Empty;
    }
}
