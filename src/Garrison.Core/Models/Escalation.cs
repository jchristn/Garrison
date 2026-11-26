namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A question a run raises to a person or an agent (AA2, AA-016): a severity, optional choices, a default answer, a
    /// timeout and what happens when it passes, and the answer once there is one. A Blocking escalation suspends its run
    /// until it is resolved. Not thread-safe.
    /// </summary>
    public class Escalation
    {
        #region Public-Members

        /// <summary>
        /// Warnings about values the server adjusted on this request (code ValueClamped), for example a timeout outside its
        /// range. Present only on the raise response when there is something to report. Read-only and never stored.
        /// </summary>
        public List<FieldWarning>? Warnings
        {
            get
            {
                return _ClampWarnings.Count > 0 ? _ClampWarnings : null;
            }
        }

        /// <summary>
        /// Identifier (prefix esc_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewEscalationId() : value;
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
        /// The run that raised it, or null for an escalation a person or the timeout sweep created by escalating up.
        /// </summary>
        public string? RaisingRunId { get; set; } = null;

        /// <summary>
        /// The raising run's lease epoch when it was raised. A Blocking escalation is a continuation boundary for that epoch.
        /// </summary>
        public long LeaseEpoch
        {
            get
            {
                return _LeaseEpoch;
            }
            set
            {
                _LeaseEpoch = Math.Max(0, value);
            }
        }

        /// <summary>
        /// The raising agent's identifier, or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// The raising agent's name at the time, or null.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// The keeper (mandate) whose tick raised it, or null.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// The keeper tick that raised it, or null.
        /// </summary>
        public string? MandateTickId { get; set; } = null;

        /// <summary>
        /// Who it is addressed to. Default User.
        /// </summary>
        public EscalationTargetKindEnum TargetKind { get; set; } = EscalationTargetKindEnum.User;

        /// <summary>
        /// User, role, or agent identifier of the target; null for Manager.
        /// </summary>
        public string? TargetId { get; set; } = null;

        /// <summary>
        /// The target's display name at the time (user email, role name, or agent name), or null.
        /// </summary>
        public string? TargetName { get; set; } = null;

        /// <summary>
        /// How urgent it is. Default Warning.
        /// </summary>
        public EscalationSeverityEnum Severity { get; set; } = EscalationSeverityEnum.Warning;

        /// <summary>
        /// Whether the raising run waits for the answer. Default NonBlocking.
        /// </summary>
        public EscalationModeEnum Mode { get; set; } = EscalationModeEnum.NonBlocking;

        /// <summary>
        /// Lifecycle state. Default Open.
        /// </summary>
        public EscalationStatusEnum Status { get; set; } = EscalationStatusEnum.Open;

        /// <summary>
        /// The question, required. Question and context together are at most Escalations.MaxQuestionBytes UTF-8 bytes.
        /// </summary>
        public string Question
        {
            get
            {
                return _Question;
            }
            set
            {
                _Question = value ?? String.Empty;
            }
        }

        /// <summary>
        /// What the answerer needs to know: what the run saw and what it already tried, or null.
        /// </summary>
        public string? Context { get; set; } = null;

        /// <summary>
        /// Choices the answerer picks from, in order, or empty for a free-text answer. At most 20.
        /// </summary>
        public List<EscalationOption> Options
        {
            get
            {
                return _Options;
            }
            set
            {
                _Options = value ?? new List<EscalationOption>();
            }
        }

        /// <summary>
        /// The answer used by the timeout action UseDefaultAnswer: an option key when there are options, otherwise text.
        /// At most 4000 characters, or null.
        /// </summary>
        public string? DefaultAnswer { get; set; } = null;

        /// <summary>
        /// Seconds until the timeout action runs. Minimum 60, maximum 2592000 (30 days); 0 on input uses
        /// Escalations.DefaultTimeoutSeconds. Values out of range are clamped with a warning.
        /// </summary>
        public int TimeoutSeconds
        {
            get
            {
                return _TimeoutSeconds;
            }
            set
            {
                _TimeoutSeconds = value == 0 ? 0 : ValueClamp.Int(value, 60, 2592000, "timeoutSeconds", _ClampWarnings);
            }
        }

        /// <summary>
        /// When the timeout action runs, or null once it no longer applies (resolved, or escalated up).
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// What happens at the timeout. Default EscalateUp.
        /// </summary>
        public EscalationTimeoutActionEnum TimeoutAction { get; set; } = EscalationTimeoutActionEnum.EscalateUp;

        /// <summary>
        /// The escalation this one was escalated up from, or null.
        /// </summary>
        public string? ParentEscalationId { get; set; } = null;

        /// <summary>
        /// The escalation this one was escalated up to, or null. An escalated-up escalation stays Open until that one is
        /// resolved, and takes its answer.
        /// </summary>
        public string? EscalatedToId { get; set; } = null;

        /// <summary>
        /// The run started to answer it (Agent targets), or null.
        /// </summary>
        public string? RoutedRunId { get; set; } = null;

        /// <summary>
        /// The chosen option key, or null.
        /// </summary>
        public string? AnswerChoice { get; set; } = null;

        /// <summary>
        /// The answer text, or null. At most 8000 characters.
        /// </summary>
        public string? AnswerText { get; set; } = null;

        /// <summary>
        /// Who answered, cancelled, or withdrew it (a user email, credential, agent name, or "timeout"), or null.
        /// </summary>
        public string? ResolvedBy { get; set; } = null;

        /// <summary>
        /// Who resolved it, or null while Open.
        /// </summary>
        public EscalationResolutionSourceEnum? ResolutionSource { get; set; } = null;

        /// <summary>
        /// When it was resolved, or null while Open.
        /// </summary>
        public DateTime? ResolvedUtc { get; set; } = null;

        /// <summary>
        /// The keeper tick whose input carried the answer (AA-042), or null.
        /// </summary>
        public string? DeliveredTickId { get; set; } = null;

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

        private readonly List<FieldWarning> _ClampWarnings = new List<FieldWarning>();
        private string _Id = IdGenerator.NewEscalationId();
        private string _TenantId = String.Empty;
        private long _LeaseEpoch = 0;
        private string _Question = String.Empty;
        private List<EscalationOption> _Options = new List<EscalationOption>();
        private int _TimeoutSeconds = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with defaults.
        /// </summary>
        public Escalation()
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Record a server-side adjustment as a ValueClamped warning.
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
