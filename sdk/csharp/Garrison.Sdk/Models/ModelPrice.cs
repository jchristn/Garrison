namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Operator-configured, tenant-owned token rates for one harness and exact served model.
    /// </summary>
    public class ModelPrice
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
        /// Price entry name.
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

        /// <summary>
        /// Exact served-model identifier. Default empty; must be nonempty and at most 256 characters.
        /// No wildcard or alias substitution is performed when estimating cost.
        /// </summary>
        public string Model
        {
            get
            {
                return _Model;
            }
            set
            {
                _Model = (value ?? String.Empty).Trim();
            }
        }

        /// <summary>
        /// Harness whose token accounting this price describes. Defaults to Generic.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Whether reported InputTokens already include CachedTokens. Default true; use false for Claude Code,
        /// whose parser reports cache reads separately. This prevents charging cached input twice.
        /// </summary>
        public bool InputIncludesCachedTokens { get; set; } = true;

        /// <summary>
        /// Whether reported OutputTokens already include ReasoningTokens. Default true; included reasoning is
        /// deducted from output before applying its rate. False adds reasoning to the reported output total.
        /// </summary>
        public bool OutputIncludesReasoningTokens { get; set; } = true;

        /// <summary>
        /// USD per million uncached input tokens. Default 0; finite values from 0 to 1,000,000,000 are accepted.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the rate is negative, nonfinite, or above the maximum.</exception>
        public double InputUsdPerMillion
        {
            get
            {
                return _InputUsdPerMillion;
            }
            set
            {
                if (!Double.IsFinite(value) || value < 0 || value > 1000000000) throw new ArgumentOutOfRangeException(nameof(value), "InputUsdPerMillion must be finite and between 0 and 1000000000.");
                _InputUsdPerMillion = value;
            }
        }

        /// <summary>
        /// USD per million output tokens. Default 0; finite values from 0 to 1,000,000,000 are accepted.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the rate is negative, nonfinite, or above the maximum.</exception>
        public double OutputUsdPerMillion
        {
            get
            {
                return _OutputUsdPerMillion;
            }
            set
            {
                if (!Double.IsFinite(value) || value < 0 || value > 1000000000) throw new ArgumentOutOfRangeException(nameof(value), "OutputUsdPerMillion must be finite and between 0 and 1000000000.");
                _OutputUsdPerMillion = value;
            }
        }

        /// <summary>
        /// USD per million cached input tokens; null uses the input rate. Default null; finite values from 0 to 1,000,000,000 are accepted.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the rate is negative, nonfinite, or above the maximum.</exception>
        public double? CachedInputUsdPerMillion
        {
            get
            {
                return _CachedInputUsdPerMillion;
            }
            set
            {
                if (value.HasValue && (!Double.IsFinite(value.Value) || value.Value < 0 || value.Value > 1000000000)) throw new ArgumentOutOfRangeException(nameof(value), "CachedInputUsdPerMillion must be finite and between 0 and 1000000000.");
                _CachedInputUsdPerMillion = value;
            }
        }

        /// <summary>
        /// USD per million separate reasoning tokens; null uses the output rate. Default null; finite values from 0 to 1,000,000,000 are accepted.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the rate is negative, nonfinite, or above the maximum.</exception>
        public double? ReasoningUsdPerMillion
        {
            get
            {
                return _ReasoningUsdPerMillion;
            }
            set
            {
                if (value.HasValue && (!Double.IsFinite(value.Value) || value.Value < 0 || value.Value > 1000000000)) throw new ArgumentOutOfRangeException(nameof(value), "ReasoningUsdPerMillion must be finite and between 0 and 1000000000.");
                _ReasoningUsdPerMillion = value;
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
                _CreatedUtc = value;
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
                _LastUpdateUtc = value;
            }
        }

        #endregion

        #region Private-Members

        private string _Model = String.Empty;
        private double _InputUsdPerMillion = 0;
        private double _OutputUsdPerMillion = 0;
        private double? _CachedInputUsdPerMillion = null;
        private double? _ReasoningUsdPerMillion = null;
        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;

        #endregion
    }
}
