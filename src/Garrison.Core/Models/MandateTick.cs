namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One wake of a keeper (AA1): why it woke, the run it started, and how it ended. A tick without a run is Skipped.
    /// Tick history is pruned after Autonomy.TickHistoryRetentionDays. Not thread-safe.
    /// </summary>
    public class MandateTick
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix mtk_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewMandateTickId() : value;
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
        /// Revision the tick ran under, or null when the mandate had none.
        /// </summary>
        public string? RevisionId { get; set; } = null;

        /// <summary>
        /// Number of that revision, or 0.
        /// </summary>
        public int RevisionNumber
        {
            get
            {
                return _RevisionNumber;
            }
            set
            {
                _RevisionNumber = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Why the tick started.
        /// </summary>
        public WakeSourceEnum WakeSource { get; set; } = WakeSourceEnum.Timer;

        /// <summary>
        /// When the wake was due (UTC).
        /// </summary>
        public DateTime ScheduledUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the scheduler started the tick (UTC).
        /// </summary>
        public DateTime StartedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the tick finished (UTC), or null while its run is active.
        /// </summary>
        public DateTime? FinishedUtc { get; set; } = null;

        /// <summary>
        /// Run started for the tick, or null for a Skipped tick or one that failed to start.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Outcome, or null while the run is active.
        /// </summary>
        public TickOutcomeEnum? Outcome { get; set; } = null;

        /// <summary>
        /// True when the run reported the outcome with garrison_keeper_complete_tick. The first report wins; later ones are
        /// ignored, so a retried call is not applied twice.
        /// </summary>
        public bool Reported { get; set; } = false;

        /// <summary>
        /// Seconds until the next wake the run asked for, or null. Clamped to the revision's interval bounds when applied.
        /// </summary>
        public int? RequestedNextWakeSeconds { get; set; } = null;

        /// <summary>
        /// Interval in seconds the scheduler applied after this tick (before jitter), or null while active.
        /// </summary>
        public int? AppliedIntervalSeconds { get; set; } = null;

        /// <summary>
        /// Cost of the tick's run in US dollars, or null.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Summary the run reported, or null. At most 4000 characters. Untrusted agent-written text (AA-025).
        /// </summary>
        public string? Summary { get; set; } = null;

        /// <summary>
        /// Name of the task template the tick input was rendered from (builtin/keeper-tick or the tenant's keeper-tick), or
        /// null for a Skipped tick.
        /// </summary>
        public string? TemplateName { get; set; } = null;

        /// <summary>
        /// Version of that template, or 0.
        /// </summary>
        public int TemplateVersion
        {
            get
            {
                return _TemplateVersion;
            }
            set
            {
                _TemplateVersion = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Stable error code when the tick was Skipped or Failed (for example PreviousTickRunning, RunAsNotAuthorized,
        /// DeploymentInactive), or null.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// Error message, or null.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewMandateTickId();
        private string _TenantId = String.Empty;
        private string _MandateId = String.Empty;
        private int _RevisionNumber = 0;
        private int _TemplateVersion = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with defaults.
        /// </summary>
        public MandateTick()
        {
        }

        #endregion
    }
}
