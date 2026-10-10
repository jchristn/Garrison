namespace Garrison.Core.Responses
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Issued session token.
    /// </summary>
    public class TokenResponse
    {
        /// <summary>
        /// Opaque token for Authorization: Bearer or x-token.
        /// </summary>
        public string Token { get; set; } = String.Empty;

        /// <summary>
        /// Expiry (UTC).
        /// </summary>
        public DateTime ExpiresUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Tenant the token is bound to.
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Session identifier.
        /// </summary>
        public string SessionId { get; set; } = String.Empty;

        /// <summary>
        /// Principal type.
        /// </summary>
        public PrincipalTypeEnum PrincipalType { get; set; } = PrincipalTypeEnum.User;
    }
}
