namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Tenant-owned daily usage and active-run limits.
    /// </summary>
    public class UsageQuota
    {
        #region Public-Members

        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? String.Empty : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Quota entry name.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>Scope of the quota. Default Tenant.</summary>
        public UsageQuotaScopeEnum Scope { get; set; } = UsageQuotaScopeEnum.Tenant;

        /// <summary>Tenant, agent, or deployment ID within the owning tenant. Default empty; routes require a valid target.</summary>
        public string ResourceId
        {
            get { return _ResourceId; }
            set { _ResourceId = (value ?? String.Empty).Trim(); }
        }

        /// <summary>Limit on admitted runs per UTC day. Null is unlimited, zero disallows usage. Range 0 to 9007199254740991; default null.</summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the limit is outside the accepted range.</exception>
        public long? DailyRunLimit
        {
            get { return _DailyRunLimit; }
            set
            {
                if (value.HasValue && (value.Value < 0 || value.Value > 9007199254740991)) throw new ArgumentOutOfRangeException(nameof(value), "DailyRunLimit must be between 0 and 9007199254740991, or null for unlimited.");
                _DailyRunLimit = value;
            }
        }

        /// <summary>Limit on input plus output tokens per UTC completion day, including separate Claude cache reads. Null is unlimited, zero disallows usage. Range 0 to 9007199254740991; default null.</summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the limit is outside the accepted range.</exception>
        public long? DailyTokenLimit
        {
            get { return _DailyTokenLimit; }
            set
            {
                if (value.HasValue && (value.Value < 0 || value.Value > 9007199254740991)) throw new ArgumentOutOfRangeException(nameof(value), "DailyTokenLimit must be between 0 and 9007199254740991, or null for unlimited.");
                _DailyTokenLimit = value;
            }
        }

        /// <summary>Limit on known USD per UTC completion day. Null is unlimited, zero disallows usage. Range 0 to 1000000000000; default null.</summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the limit is outside the accepted range.</exception>
        public double? DailyCostUsdLimit
        {
            get { return _DailyCostUsdLimit; }
            set
            {
                if (value.HasValue && (!Double.IsFinite(value.Value) || value.Value < 0 || value.Value > 1000000000000)) throw new ArgumentOutOfRangeException(nameof(value), "DailyCostUsdLimit must be between 0 and 1000000000000, or null for unlimited.");
                _DailyCostUsdLimit = value;
            }
        }

        /// <summary>Limit on currently Leased, Running, or Cancelling runs. Null is unlimited, zero disallows usage. Range 0 to 2147483647; default null.</summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the limit is outside the accepted range.</exception>
        public int? MaxConcurrentRuns
        {
            get { return _MaxConcurrentRuns; }
            set
            {
                if (value.HasValue && (value.Value < 0 || value.Value > 2147483647)) throw new ArgumentOutOfRangeException(nameof(value), "MaxConcurrentRuns must be between 0 and 2147483647, or null for unlimited.");
                _MaxConcurrentRuns = value;
            }
        }

        /// <summary>
        /// Whether the record is active.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Whether the record is protected from deletion.
        /// </summary>
        public bool IsProtected { get; set; } = false;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc
        {
            get
            {
                return _CreatedUtc;
            }
            set
            {
                _CreatedUtc = value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
            }
        }

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc
        {
            get
            {
                return _LastUpdateUtc;
            }
            set
            {
                _LastUpdateUtc = value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
            }
        }

        #endregion

        #region Private-Members

        private string _ResourceId = String.Empty;
        private long? _DailyRunLimit = null;
        private long? _DailyTokenLimit = null;
        private double? _DailyCostUsdLimit = null;
        private int? _MaxConcurrentRuns = null;
        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;

        #endregion
    }
}
