namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A keeper mandate (AA1): a standing objective that wakes its agent on a schedule. Ticks run as the principal that last created or changed it. Created with an inline CurrentRevision it is published as revision 1 and the mandate becomes Active.
    /// </summary>
    public class Mandate
    {
        #region Public-Members

        /// <summary>
        /// Warnings from the create or update request that returned this mandate (responses only): one entry per value
        /// the server did not store as given, for example code ValueClamped for a number outside its range. Null when
        /// there is nothing to report, and on reads. Includes the current revision's warnings.
        /// </summary>
        public List<FieldWarning>? Warnings { get; set; } = null;

        /// <summary>
        /// Identifier (mdt_). Empty on create.
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
        /// Name, unique per tenant: 1 to 64 lowercase letters, digits, and hyphens.
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
        /// Optional description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Agent the keeper runs. Required on create; it cannot change.
        /// </summary>
        public string AgentId
        {
            get
            {
                return _AgentId;
            }
            set
            {
                _AgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Deployment its ticks run on. Required on create.
        /// </summary>
        public string DeploymentId
        {
            get
            {
                return _DeploymentId;
            }
            set
            {
                _DeploymentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Lifecycle state. Draft until a revision is published, then Active.
        /// </summary>
        public MandateStatusEnum Status { get; set; } = MandateStatusEnum.Draft;

        /// <summary>
        /// Identifier of the published revision ticks use, or null before the first publish.
        /// </summary>
        public string? CurrentRevisionId { get; set; } = null;

        /// <summary>
        /// Number of the current revision; 0 before the first publish.
        /// </summary>
        public int CurrentRevisionNumber { get; set; } = 0;

        /// <summary>
        /// The current revision. On create, an inline revision here is published as revision 1 and makes the mandate Active.
        /// </summary>
        public MandateRevision? CurrentRevision { get; set; } = null;

        /// <summary>
        /// When the scheduler next wakes it, or null.
        /// </summary>
        public DateTime? NextWakeUtc { get; set; } = null;

        /// <summary>
        /// Source of a wake requested but not yet started, or null.
        /// </summary>
        public WakeSourceEnum? PendingWakeSource { get; set; } = null;

        /// <summary>
        /// Current interval between wakes in seconds (grows under Backoff).
        /// </summary>
        public int CurrentIntervalSeconds { get; set; } = 0;

        /// <summary>
        /// Quiet ticks in a row, which drive Backoff.
        /// </summary>
        public int ConsecutiveQuietTicks { get; set; } = 0;

        /// <summary>
        /// When the last tick started, or null.
        /// </summary>
        public DateTime? LastTickUtc { get; set; } = null;

        /// <summary>
        /// Outcome of the last finished tick, or null.
        /// </summary>
        public TickOutcomeEnum? LastTickOutcome { get; set; } = null;

        /// <summary>
        /// Run of the tick in progress, or null.
        /// </summary>
        public string? ActiveRunId { get; set; } = null;

        /// <summary>
        /// Tick in progress, or null.
        /// </summary>
        public string? ActiveTickId { get; set; } = null;

        /// <summary>
        /// Ticks started so far.
        /// </summary>
        public long TickCount { get; set; } = 0;

        /// <summary>
        /// Principal type its ticks run as: the caller that last created or changed it.
        /// </summary>
        public PrincipalTypeEnum RunAsType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Principal identifier its ticks run as.
        /// </summary>
        public string? RunAsId { get; set; } = null;

        /// <summary>
        /// Principal display name its ticks run as.
        /// </summary>
        public string? RunAsName { get; set; } = null;

        /// <summary>
        /// Who created it.
        /// </summary>
        public string? CreatedBy { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _AgentId = String.Empty;
        private string _DeploymentId = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public Mandate()
        {
        }

        #endregion
    }
}
