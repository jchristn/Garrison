namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A standing responsibility bound to one deployment of an agent (AA1, AA-012). The mandate holds scheduling state
    /// (next wake, current interval, the tick in flight); what the keeper is for lives in its versioned revisions. An agent
    /// deployment with an active mandate is a keeper. Not thread-safe.
    /// </summary>
    public class Mandate
    {
        #region Public-Members

        /// <summary>
        /// Warnings about values in the request that created or updated this record and were not stored as given, for
        /// example an interval outside its range that was clamped (code ValueClamped). Present only on create and update
        /// responses when there is something to report; null otherwise. Read-only and never stored.
        /// </summary>
        public List<FieldWarning>? Warnings
        {
            get
            {
                List<FieldWarning> all = new List<FieldWarning>();
                if (_CurrentRevision?.Warnings != null) all.AddRange(_CurrentRevision.Warnings);
                return all.Count > 0 ? all : null;
            }
        }

        /// <summary>
        /// Identifier (prefix mdt_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewMandateId() : value;
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
        /// Name, unique in the tenant: 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or
        /// digit.
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
        /// Optional description for people. Not sent to the harness.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Agent identifier. Required.
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
        /// Deployment of the agent that runs each tick. Required; it must belong to the agent and be active.
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
        /// Status. Default Draft. Only Active mandates wake.
        /// </summary>
        public MandateStatusEnum Status { get; set; } = MandateStatusEnum.Draft;

        /// <summary>
        /// Identifier of the current (latest published) revision, or null before the first publish.
        /// </summary>
        public string? CurrentRevisionId { get; set; } = null;

        /// <summary>
        /// Number of the current revision, or 0 before the first publish.
        /// </summary>
        public int CurrentRevisionNumber
        {
            get
            {
                return _CurrentRevisionNumber;
            }
            set
            {
                _CurrentRevisionNumber = Math.Max(0, value);
            }
        }

        /// <summary>
        /// The current revision. On create, an optional first revision to publish at once (the mandate becomes Active
        /// unless status Paused is given). On reads, filled in by the service. Not stored on the mandate row.
        /// </summary>
        public MandateRevision? CurrentRevision
        {
            get
            {
                return _CurrentRevision;
            }
            set
            {
                _CurrentRevision = value;
            }
        }

        /// <summary>
        /// When the scheduler next wakes this mandate (UTC), or null when nothing is scheduled (Draft, Paused, Retired).
        /// Read-only through the API.
        /// </summary>
        public DateTime? NextWakeUtc { get; set; } = null;

        /// <summary>
        /// Why the next wake happens when it is not the timer (for example Manual after a wake request), or null.
        /// Cleared when the tick starts.
        /// </summary>
        public WakeSourceEnum? PendingWakeSource { get; set; } = null;

        /// <summary>
        /// Interval in seconds used to schedule the next timer wake. Starts at the revision's minimum interval. Minimum 0.
        /// </summary>
        public int CurrentIntervalSeconds
        {
            get
            {
                return _CurrentIntervalSeconds;
            }
            set
            {
                _CurrentIntervalSeconds = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Quiet ticks in a row since the last tick that was not Quiet. Minimum 0.
        /// </summary>
        public int ConsecutiveQuietTicks
        {
            get
            {
                return _ConsecutiveQuietTicks;
            }
            set
            {
                _ConsecutiveQuietTicks = Math.Max(0, value);
            }
        }

        /// <summary>
        /// When the last tick finished (UTC), or null.
        /// </summary>
        public DateTime? LastTickUtc { get; set; } = null;

        /// <summary>
        /// Outcome of the last finished tick, or null.
        /// </summary>
        public TickOutcomeEnum? LastTickOutcome { get; set; } = null;

        /// <summary>
        /// Run of the tick in flight, or null. While it is set no other tick starts (single-flight, AA-014).
        /// </summary>
        public string? ActiveRunId { get; set; } = null;

        /// <summary>
        /// Tick in flight, or null.
        /// </summary>
        public string? ActiveTickId { get; set; } = null;

        /// <summary>
        /// Ticks started over the mandate's life. Minimum 0.
        /// </summary>
        public long TickCount
        {
            get
            {
                return _TickCount;
            }
            set
            {
                _TickCount = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Principal type ticks run as. Set from the caller on create and update; checked before every tick.
        /// </summary>
        public PrincipalTypeEnum RunAsType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// User or credential identifier ticks run as, or null for an administrator.
        /// </summary>
        public string? RunAsId { get; set; } = null;

        /// <summary>
        /// Display name of the run-as principal, or null.
        /// </summary>
        public string? RunAsName { get; set; } = null;

        /// <summary>
        /// Name of the principal that created the mandate, or null.
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

        private string _Id = IdGenerator.NewMandateId();
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _AgentId = String.Empty;
        private string _DeploymentId = String.Empty;
        private int _CurrentRevisionNumber = 0;
        private MandateRevision? _CurrentRevision = null;
        private int _CurrentIntervalSeconds = 0;
        private int _ConsecutiveQuietTicks = 0;
        private long _TickCount = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with defaults.
        /// </summary>
        public Mandate()
        {
        }

        #endregion
    }
}
