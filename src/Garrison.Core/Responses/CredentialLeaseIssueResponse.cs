namespace Garrison.Core.Responses
{
    using System;

    /// <summary>Provider response consumed only by the control plane. Never returned through management APIs.</summary>
    public class CredentialLeaseIssueResponse
    {
        /// <summary>Matching idempotent lease identity.</summary>
        public string LeaseId { get; set; } = String.Empty;
        /// <summary>Ephemeral bearer value. Never logged or persisted.</summary>
        public string Value { get; set; } = String.Empty;
        /// <summary>Effective expiry.</summary>
        public DateTime ExpiresUtc { get; set; }
    }
}
