namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One version of what a keeper is for (AA1, AA-012): its objective, what it watches, what healthy means, what it may
    /// do alone, when to escalate, how often to wake, and its budgets. A published revision is immutable; a change makes a
    /// new revision. Text fields reach the harness only through the builtin/keeper-system template. Numbers outside their
    /// range are clamped and reported in <see cref="Warnings"/>. Not thread-safe.
    /// </summary>
    public class MandateRevision
    {
        #region Public-Members

        /// <summary>
        /// Warnings about values that were clamped when this revision was created or updated (code ValueClamped). Present
        /// only on create and update responses when there is something to report. Read-only and never stored.
        /// </summary>
        public List<FieldWarning>? Warnings
        {
            get
            {
                return _ClampWarnings.Count > 0 ? _ClampWarnings : null;
            }
        }

        /// <summary>
        /// Identifier (prefix mdr_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewMandateRevisionId() : value;
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
        /// Revision number within the mandate, starting at 1. Assigned by the server.
        /// </summary>
        public int Number
        {
            get
            {
                return _Number;
            }
            set
            {
                _Number = Math.Max(0, value);
            }
        }

        /// <summary>
        /// State. Default Draft; publishing makes it Published and immutable.
        /// </summary>
        public MandateRevisionStateEnum State { get; set; } = MandateRevisionStateEnum.Draft;

        /// <summary>
        /// What the keeper is responsible for. Required, at most 8000 characters.
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
        /// What "healthy" means for the thing the keeper watches, or null. At most 8000 characters.
        /// </summary>
        public string? HealthyDefinition { get; set; } = null;

        /// <summary>
        /// What the keeper may do on its own without asking, or null (it may only observe and report). At most 8000
        /// characters.
        /// </summary>
        public string? Autonomy { get; set; } = null;

        /// <summary>
        /// When and to whom the keeper should raise its hand, or null. At most 8000 characters.
        /// </summary>
        public string? EscalationPolicy { get; set; } = null;

        /// <summary>
        /// Standing direction from the board (AA10) or the author, or null. At most 8000 characters.
        /// </summary>
        public string? Direction { get; set; } = null;

        /// <summary>
        /// Where this keeper's escalations go when the keeper names no target (AA2, AA-043), or null for none. Manager is
        /// accepted once organizations land (AA7.5).
        /// </summary>
        public EscalationTargetKindEnum? EscalationTargetKind { get; set; } = null;

        /// <summary>
        /// User, role, or agent identifier of the default escalation target, or null. Required with User, Role, and Agent.
        /// </summary>
        public string? EscalationTargetId { get; set; } = null;

        /// <summary>
        /// Signals the keeper observes on each tick, in order. At most 50.
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
        /// How the interval changes between ticks. Default Backoff.
        /// </summary>
        public WakeModeEnum WakeMode { get; set; } = WakeModeEnum.Backoff;

        /// <summary>
        /// Shortest interval between timer wakes, in seconds. Minimum 10, maximum 2592000 (30 days), default 900. The
        /// server also raises it to Autonomy.MinIntervalSeconds.
        /// </summary>
        public int MinIntervalSeconds
        {
            get
            {
                return _MinIntervalSeconds;
            }
            set
            {
                _MinIntervalSeconds = ValueClamp.Int(value, 10, 2592000, "minIntervalSeconds", _ClampWarnings);
            }
        }

        /// <summary>
        /// Longest interval between timer wakes, in seconds. Minimum 10, maximum 2592000 (30 days), default 86400. Raised to
        /// the minimum interval when it is below it, and lowered to Autonomy.MaxIntervalSeconds by the server.
        /// </summary>
        public int MaxIntervalSeconds
        {
            get
            {
                return _MaxIntervalSeconds;
            }
            set
            {
                _MaxIntervalSeconds = ValueClamp.Int(value, 10, 2592000, "maxIntervalSeconds", _ClampWarnings);
            }
        }

        /// <summary>
        /// Factor the interval is multiplied by after a Quiet tick in Backoff mode. Minimum 1.0 (no growth), maximum 10.0,
        /// default 2.0.
        /// </summary>
        public double BackoffFactor
        {
            get
            {
                return _BackoffFactor;
            }
            set
            {
                _BackoffFactor = ValueClamp.Double(value, 1.0, 10.0, "backoffFactor", _ClampWarnings);
            }
        }

        /// <summary>
        /// Random delay added to each timer wake, as a percent of the interval (0 to the value). Minimum 0, maximum 50; null
        /// uses Autonomy.DefaultJitterPercent.
        /// </summary>
        public int? JitterPercent
        {
            get
            {
                return _JitterPercent;
            }
            set
            {
                _JitterPercent = ValueClamp.NullableInt(value, 0, 50, "jitterPercent", _ClampWarnings);
            }
        }

        /// <summary>
        /// Most a single tick may cost in US dollars, or null for no per-tick limit. Minimum 0, maximum 1000000. Enforced
        /// from AA3.
        /// </summary>
        public double? BudgetPerTickUsd
        {
            get
            {
                return _BudgetPerTickUsd;
            }
            set
            {
                _BudgetPerTickUsd = ValueClamp.NullableDouble(value, 0, 1000000, "budgetPerTickUsd", _ClampWarnings);
            }
        }

        /// <summary>
        /// Most the mandate's ticks may cost per UTC day in US dollars, or null for no daily limit. Minimum 0, maximum
        /// 1000000. Enforced from AA3.
        /// </summary>
        public double? BudgetPerDayUsd
        {
            get
            {
                return _BudgetPerDayUsd;
            }
            set
            {
                _BudgetPerDayUsd = ValueClamp.NullableDouble(value, 0, 1000000, "budgetPerDayUsd", _ClampWarnings);
            }
        }

        /// <summary>
        /// Most tokens (input plus output) a single tick may use, or null for no limit. Minimum 0, maximum 100000000.
        /// Enforced from AA3.
        /// </summary>
        public long? MaxTokensPerTick
        {
            get
            {
                return _MaxTokensPerTick;
            }
            set
            {
                _MaxTokensPerTick = ValueClamp.NullableLong(value, 0, 100000000, "maxTokensPerTick", _ClampWarnings);
            }
        }

        /// <summary>
        /// Who authored the revision. Default Human. Set by the server from the path the revision came through.
        /// </summary>
        public MandateRevisionSourceEnum Source { get; set; } = MandateRevisionSourceEnum.Human;

        /// <summary>
        /// Name of the principal that created the revision, or null. Set by the server.
        /// </summary>
        public string? Author { get; set; } = null;

        /// <summary>
        /// Why this revision was made, or null. At most 1024 characters.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Publish time (UTC), or null while it is a draft.
        /// </summary>
        public DateTime? PublishedUtc { get; set; } = null;

        #endregion

        #region Private-Members

        private readonly List<FieldWarning> _ClampWarnings = new List<FieldWarning>();
        private string _Id = IdGenerator.NewMandateRevisionId();
        private string _TenantId = String.Empty;
        private string _MandateId = String.Empty;
        private int _Number = 0;
        private string _Objective = String.Empty;
        private List<MandateRevisionSignal> _Signals = new List<MandateRevisionSignal>();
        private int _MinIntervalSeconds = 900;
        private int _MaxIntervalSeconds = 86400;
        private double _BackoffFactor = 2.0;
        private int? _JitterPercent = null;
        private double? _BudgetPerTickUsd = null;
        private double? _BudgetPerDayUsd = null;
        private long? _MaxTokensPerTick = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with defaults.
        /// </summary>
        public MandateRevision()
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Record a server-side clamp (for example to an Autonomy setting) as a ValueClamped warning on this revision.
        /// </summary>
        /// <param name="field">Field name.</param>
        /// <param name="given">Value given.</param>
        /// <param name="stored">Value stored.</param>
        /// <param name="message">Message for the caller.</param>
        /// <exception cref="ArgumentNullException">Thrown when field or message is null or empty.</exception>
        public void AddWarning(string field, string given, string stored, string message)
        {
            if (String.IsNullOrEmpty(field)) throw new ArgumentNullException(nameof(field));
            if (String.IsNullOrEmpty(message)) throw new ArgumentNullException(nameof(message));
            _ClampWarnings.RemoveAll(w => String.Equals(w.Field, field, StringComparison.Ordinal));
            _ClampWarnings.Add(new FieldWarning(field, "ValueClamped", given, stored, message));
        }

        #endregion
    }
}
