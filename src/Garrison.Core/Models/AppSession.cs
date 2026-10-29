namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Helpers;

    /// <summary>
    /// An end user's session in one agentic app's chat UI (AD6.5, AD-021). The token is only good for that app's gateway
    /// routes under /v1.0/apps/{slug}/ and the caller's own conversations; the management API does not accept it. Only a
    /// SHA-256 of the token is stored.
    /// </summary>
    public class AppSession
    {
        /// <summary>
        /// Identifier (prefix aps_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewAppSessionId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// App identifier.
        /// </summary>
        public string AppId { get; set; } = String.Empty;

        /// <summary>
        /// SHA-256 of the token, as lowercase hex.
        /// </summary>
        public string TokenHash { get; set; } = String.Empty;

        /// <summary>
        /// Signed-in user, or null for an anonymous session.
        /// </summary>
        public string? UserId { get; set; } = null;

        /// <summary>
        /// Name shown for the session's principal: the user's email, or "anonymous".
        /// </summary>
        public string PrincipalName { get; set; } = String.Empty;

        /// <summary>
        /// The identifier the session's conversations are owned by: the user identifier, or anon:{sessionId}.
        /// </summary>
        public string OwnerId
        {
            get
            {
                return String.IsNullOrEmpty(UserId) ? "anon:" + Id : UserId;
            }
        }

        /// <summary>
        /// When the session stops working (UTC).
        /// </summary>
        public DateTime ExpiresUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the session was revoked (UTC), or null.
        /// </summary>
        public DateTime? RevokedUtc { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        private string _Id = IdGenerator.NewAppSessionId();
    }
}
