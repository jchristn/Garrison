namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One wake of a keeper mandate (AA1) and the run it started.
    /// </summary>
    public class MandateTick
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
        /// Revision the tick used.
        /// </summary>
        public string? RevisionId { get; set; } = null;

        /// <summary>
        /// Number of the revision the tick used.
        /// </summary>
        public int RevisionNumber { get; set; } = 0;

        /// <summary>
        /// Why the tick started.
        /// </summary>
        public WakeSourceEnum WakeSource { get; set; } = WakeSourceEnum.Timer;

        /// <summary>
        /// When the wake was scheduled (UTC).
        /// </summary>
        public DateTime ScheduledUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the tick started (UTC).
        /// </summary>
        public DateTime StartedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When it finished, or null while running.
        /// </summary>
        public DateTime? FinishedUtc { get; set; } = null;

        /// <summary>
        /// Run that executed the tick, or null when none was started (Skipped).
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Outcome, or null while running.
        /// </summary>
        public TickOutcomeEnum? Outcome { get; set; } = null;

        /// <summary>
        /// True when the run reported its outcome with garrison_keeper_complete_tick.
        /// </summary>
        public bool Reported { get; set; } = false;

        /// <summary>
        /// Next wake the keeper asked for, in seconds, or null.
        /// </summary>
        public int? RequestedNextWakeSeconds { get; set; } = null;

        /// <summary>
        /// Interval the scheduler applied after the tick, or null.
        /// </summary>
        public int? AppliedIntervalSeconds { get; set; } = null;

        /// <summary>
        /// Cost of the tick's run in USD, or null.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// The keeper's summary of the tick.
        /// </summary>
        public string? Summary { get; set; } = null;

        /// <summary>
        /// Prompt template that rendered the tick input.
        /// </summary>
        public string? TemplateName { get; set; } = null;

        /// <summary>
        /// Version of that template.
        /// </summary>
        public int TemplateVersion { get; set; } = 0;

        /// <summary>
        /// Error code when the tick failed.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// Error message when the tick failed.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _MandateId = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public MandateTick()
        {
        }

        #endregion
    }
}
