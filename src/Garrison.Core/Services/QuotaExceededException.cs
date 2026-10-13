namespace Garrison.Core.Services
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>An enabled tenant, agent, or deployment quota refuses admission. REST maps it to 429; protocol errors retain QuotaExceeded.</summary>
    public class QuotaExceededException : ConflictException
    {
        /// <summary>Quota ID.</summary>
        public string QuotaId { get; }
        /// <summary>Scope.</summary>
        public UsageQuotaScopeEnum Scope { get; }
        /// <summary>Target ID.</summary>
        public string ResourceId { get; }
        /// <summary>The limit that was reached.</summary>
        public string LimitName { get; }
        /// <summary>Observed usage.</summary>
        public double Used { get; }
        /// <summary>Configured limit.</summary>
        public double Limit { get; }
        /// <summary>Next UTC daily reset, or a short concurrency retry time.</summary>
        public DateTime RetryUtc { get; }

        /// <summary>Instantiate a refusal with its accounting details.</summary>
        /// <param name="quotaId">Quota.</param>
        /// <param name="scope">Scope.</param>
        /// <param name="resourceId">Target.</param>
        /// <param name="limitName">Limit name.</param>
        /// <param name="used">Usage.</param>
        /// <param name="limit">Limit.</param>
        /// <param name="retryUtc">Next retry.</param>
        public QuotaExceededException(string quotaId, UsageQuotaScopeEnum scope, string resourceId, string limitName, double used, double limit, DateTime retryUtc)
            : base("QuotaExceeded", scope + " " + resourceId + " reached " + limitName + " (used " + used.ToString(System.Globalization.CultureInfo.InvariantCulture) + ", limit " + limit.ToString(System.Globalization.CultureInfo.InvariantCulture) + "; quota " + quotaId + ").")
        {
            QuotaId = quotaId;
            Scope = scope;
            ResourceId = resourceId;
            LimitName = limitName;
            Used = used;
            Limit = limit;
            RetryUtc = retryUtc;
        }
    }
}
