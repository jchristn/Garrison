namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>Persisted effect intent for a Garrison-served gateway operation.</summary>
    public class EffectOperation
    {
        /// <summary>Stable operation identifier and destination idempotency key.</summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>Owning tenant.</summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>Owning run.</summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>Lease epoch that authorized dispatch.</summary>
        public long LeaseEpoch { get; set; } = 0;

        /// <summary>Gateway operation name.</summary>
        public string Tool { get; set; } = String.Empty;

        /// <summary>SHA-256 digest of arguments. Raw arguments and credentials are never stored.</summary>
        public string ArgumentDigest { get; set; } = String.Empty;

        /// <summary>Durable dispatch state.</summary>
        public EffectOperationStateEnum State { get; set; } = EffectOperationStateEnum.Authorized;

        /// <summary>Reference to the result, never the secret or result body.</summary>
        public string? ResultReference { get; set; } = null;

        /// <summary>Intent creation timestamp.</summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    }
}
