namespace Garrison.Core.Requests
{
    using System;

    /// <summary>Typed operator provider issuance and idempotency contract.</summary>
    public class CredentialLeaseIssueRequest
    {
        /// <summary>Stable issuance identity; revocation must tombstone it even before issuance completes.</summary>
        public string LeaseId { get; set; } = String.Empty;
        /// <summary>Owning tenant.</summary>
        public string TenantId { get; set; } = String.Empty;
        /// <summary>Owning run.</summary>
        public string RunId { get; set; } = String.Empty;
        /// <summary>Fenced execution epoch.</summary>
        public long LeaseEpoch { get; set; }
        /// <summary>Provider resource identifier.</summary>
        public string Resource { get; set; } = String.Empty;
        /// <summary>Optional audience.</summary>
        public string? Audience { get; set; }
        /// <summary>Requested expiry. Provider must not issue a token valid beyond this value.</summary>
        public DateTime ExpiresUtc { get; set; }
    }
}
