namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Secret manifest spec. Values are accepted only when the apply allows secret values.
    /// </summary>
    public class SecretSpec
    {
        /// <summary>
        /// Kind.
        /// </summary>
        public SecretKindEnum Kind { get; set; } = SecretKindEnum.GenericEnv;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Value (ignored unless allowSecretValues is true).
        /// </summary>
        public string? Value { get; set; } = null;

        /// <summary>
        /// Expiration (UTC).
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;
    }
}
