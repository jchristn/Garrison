namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Helpers;

    /// <summary>Provider credential lifecycle metadata. No bearer value or provider authorization is persisted.</summary>
    public class CredentialLease
    {
        /// <summary>Stable provider idempotency and revocation identity.</summary>
        public string Id { get; set; } = IdGenerator.New(Constants.CredentialLeaseIdPrefix);
        /// <summary>Tenant boundary.</summary>
        public string TenantId { get; set; } = String.Empty;
        /// <summary>Owning run.</summary>
        public string RunId { get; set; } = String.Empty;
        /// <summary>Bound secret metadata identifier.</summary>
        public string SecretId { get; set; } = String.Empty;
        /// <summary>Fenced run epoch.</summary>
        public long LeaseEpoch { get; set; }
        /// <summary>Provider resource identifier.</summary>
        public string Resource { get; set; } = String.Empty;
        /// <summary>Optional provider audience.</summary>
        public string? Audience { get; set; }
        /// <summary>Authorized, Issued, or Revoked.</summary>
        public string State { get; set; } = "Authorized";
        /// <summary>Requested provider expiry and maximum possible token validity.</summary>
        public DateTime ExpiresUtc { get; set; }
        /// <summary>Reservation creation timestamp.</summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
        /// <summary>Confirmed revocation timestamp.</summary>
        public DateTime? RevokedUtc { get; set; }
        /// <summary>Provider revocation attempts.</summary>
        public int RevokeAttempts { get; set; }
    }
}
