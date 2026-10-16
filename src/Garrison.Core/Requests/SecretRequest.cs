namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Create or update a secret. The value is write-only and never returned.
    /// </summary>
    public class SecretRequest
    {
        /// <summary>Provider resource identifier for LeaseBroker secrets; not a credential value. Maximum 512 characters.</summary>
        public string? BrokerResource { get; set; } = null;
        /// <summary>Optional provider audience for LeaseBroker secrets. Maximum 512 characters.</summary>
        public string? BrokerAudience { get; set; } = null;

        /// <summary>
        /// Name, unique per tenant.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Kind.
        /// </summary>
        public SecretKindEnum Kind { get; set; } = SecretKindEnum.GenericEnv;

        /// <summary>
        /// Secret value; omit on update to keep the current value.
        /// </summary>
        public string? Value { get; set; } = null;

        /// <summary>
        /// Expiration (UTC).
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;
    }
}
