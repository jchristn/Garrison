namespace Garrison.Core
{
    /// <summary>
    /// Product-wide constants that are not operator-configurable (protocol names, header names, product identity).
    /// Configurable values live in settings classes.
    /// </summary>
    public static class Constants
    {
        /// <summary>Prefix for tenant-owned model price records.</summary>
        public const string ModelPriceIdPrefix = "mpr_";

        /// <summary>Transient worker MCP diagnostic identifier prefix.</summary>
        public const string McpTestIdPrefix = "mct_";

        /// <summary>Worker MCP diagnostic tool outcome child prefix.</summary>
        public const string McpTestToolIdPrefix = "mtt_";

        /// <summary>Usage quota identifier prefix.</summary>
        public const string UsageQuotaIdPrefix = "uqt_";

        /// <summary>
        /// Product name.
        /// </summary>
        public const string ProductName = "Garrison";

        /// <summary>
        /// Product version. Mirrors src/Directory.Build.props; never change without explicit approval.
        /// </summary>
        public const string ProductVersion = "0.1.0-alpha";

        /// <summary>
        /// Repository URL.
        /// </summary>
        public const string RepositoryUrl = "https://github.com/jchristn/Garrison";

        /// <summary>
        /// Name of the Garrison MCP server as seen by harnesses.
        /// </summary>
        public const string McpServerName = "garrison";

        /// <summary>
        /// Prefix reserved for built-in harness profiles and prompt templates.
        /// </summary>
        public const string BuiltInPrefix = "builtin/";

        /// <summary>
        /// Identifier of the default tenant seeded on first boot.
        /// </summary>
        public const string DefaultTenantId = "default";

        /// <summary>
        /// Name of the default tenant seeded on first boot.
        /// </summary>
        public const string DefaultTenantName = "Default";

        /// <summary>
        /// Header carrying a bearer token alternative.
        /// </summary>
        public const string HeaderToken = "x-token";

        /// <summary>
        /// Header carrying the system administrator API key.
        /// </summary>
        public const string HeaderApiKey = "x-api-key";

        /// <summary>
        /// Header carrying a tenant identifier.
        /// </summary>
        public const string HeaderTenantId = "x-tenant-id";

        /// <summary>
        /// Header carrying a user email for token issuance.
        /// </summary>
        public const string HeaderEmail = "x-email";

        /// <summary>
        /// Header carrying a user password for token issuance.
        /// </summary>
        public const string HeaderPassword = "x-password";

        /// <summary>
        /// Header carrying a credential access key.
        /// </summary>
        public const string HeaderAccessKey = "x-access-key";

        /// <summary>
        /// Header carrying a credential secret key.
        /// </summary>
        public const string HeaderSecretKey = "x-secret-key";

        /// <summary>
        /// Header carrying the signed-request timestamp.
        /// </summary>
        public const string HeaderDate = "x-date";

        /// <summary>
        /// Header carrying the signed-request nonce.
        /// </summary>
        public const string HeaderNonce = "x-nonce";

        /// <summary>
        /// Header carrying the signed-request signature.
        /// </summary>
        public const string HeaderSignature = "x-signature";

        /// <summary>
        /// Header carrying a request identifier.
        /// </summary>
        public const string HeaderRequestId = "x-request-id";

        /// <summary>
        /// Header carrying an idempotency key on run creation.
        /// </summary>
        public const string HeaderIdempotencyKey = "Idempotency-Key";

        /// <summary>
        /// Coordination lease name for the maintenance leader.
        /// </summary>
        public const string LeaderLeaseName = "garrison-leader";
    }
}
