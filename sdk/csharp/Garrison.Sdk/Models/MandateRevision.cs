namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One revision of a keeper mandate (AA1): objective, signals, wake schedule, and budgets. A draft becomes current when published; published revisions never change.
    /// </summary>
    public class MandateRevision
    {
        #region Public-Members

        /// <summary>
        /// Warnings from the create or update request that returned this revision (responses only): one entry per value
        /// the server did not store as given, for example code ValueClamped for a number outside its range. Null when
        /// there is nothing to report, and on reads.
        /// </summary>
        public List<FieldWarning>? Warnings { get; set; } = null;

        /// <summary>
        /// Identifier. Empty on create.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
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
        /// Mandate identifier.
        /// </summary>
        public string MandateId
        {
            get
            {
                return _MandateId;
            }
            set
            {
                _MandateId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Revision number, starting at 1. Assigned by the server.
        /// </summary>
        public int Number { get; set; } = 0;

        /// <summary>
        /// Draft or Published.
        /// </summary>
        public MandateRevisionStateEnum State { get; set; } = MandateRevisionStateEnum.Draft;

        /// <summary>
        /// What the keeper is responsible for. Required.
        /// </summary>
        public string Objective
        {
            get
            {
                return _Objective;
            }
            set
            {
                _Objective = value ?? String.Empty;
            }
        }

        /// <summary>
        /// What healthy looks like.
        /// </summary>
        public string? HealthyDefinition { get; set; } = null;

        /// <summary>
        /// What the keeper may do on its own.
        /// </summary>
        public string? Autonomy { get; set; } = null;

        /// <summary>
        /// When and how the keeper escalates.
        /// </summary>
        public string? EscalationPolicy { get; set; } = null;

        /// <summary>
        /// Current direction from the author.
        /// </summary>
        public string? Direction { get; set; } = null;

        /// <summary>
        /// Signals to check on each tick, in order.
        /// </summary>
        public List<MandateRevisionSignal> Signals
        {
            get
            {
                return _Signals;
            }
            set
            {
                _Signals = value ?? new List<MandateRevisionSignal>();
            }
        }

        /// <summary>
        /// Fixed or Backoff. Default Backoff.
        /// </summary>
        public WakeModeEnum WakeMode { get; set; } = WakeModeEnum.Backoff;

        /// <summary>
        /// Minimum seconds between wakes. Default 900. The cluster floor (default 60) raises smaller values and the response carries a ValueClamped warning.
        /// </summary>
        public int MinIntervalSeconds { get; set; } = 900;

        /// <summary>
        /// Maximum seconds between wakes under Backoff. Default 86400.
        /// </summary>
        public int MaxIntervalSeconds { get; set; } = 86400;

        /// <summary>
        /// Interval multiplier after a Quiet tick under Backoff. Default 2.0.
        /// </summary>
        public double BackoffFactor { get; set; } = 2.0;

        /// <summary>
        /// Random spread applied to each interval in percent, 0 to 50, or null for the cluster default.
        /// </summary>
        public int? JitterPercent { get; set; } = null;

        /// <summary>
        /// Spend limit per tick in USD, or null for none.
        /// </summary>
        public double? BudgetPerTickUsd { get; set; } = null;

        /// <summary>
        /// Spend limit per day in USD, or null for none.
        /// </summary>
        public double? BudgetPerDayUsd { get; set; } = null;

        /// <summary>
        /// Token limit per tick, or null for none.
        /// </summary>
        public long? MaxTokensPerTick { get; set; } = null;

        /// <summary>
        /// Who authored it. Default Human.
        /// </summary>
        public MandateRevisionSourceEnum Source { get; set; } = MandateRevisionSourceEnum.Human;

        /// <summary>
        /// Author name.
        /// </summary>
        public string? Author { get; set; } = null;

        /// <summary>
        /// Why it changed.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When it was published, or null while a draft.
        /// </summary>
        public DateTime? PublishedUtc { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _MandateId = String.Empty;
        private string _Objective = String.Empty;
        private List<MandateRevisionSignal> _Signals = new List<MandateRevisionSignal>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public MandateRevision()
        {
        }

        #endregion
    }
}
