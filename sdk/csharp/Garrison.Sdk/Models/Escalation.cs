namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A question a run raised for a person, a role, or another agent (AA2): its severity, options, default answer,
    /// timeout, and the answer once there is one. A Blocking escalation holds its run until it is resolved.
    /// </summary>
    public class Escalation
    {
        #region Public-Members


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
        /// The run that raised it, or null for one created by escalating up.
        /// </summary>
        public string? RaisingRunId { get; set; } = null;

        /// <summary>
        /// Lease epoch of the raising run when it raised the escalation. A Blocking wait belongs to that epoch.
        /// </summary>
        public long LeaseEpoch { get; set; } = 0;

        /// <summary>
        /// Agent of the raising run.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Agent name, for display.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Keeper mandate whose tick raised it, or null.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// Keeper tick that raised it, or null.
        /// </summary>
        public string? MandateTickId { get; set; } = null;

        /// <summary>
        /// Who it is addressed to: User, Role, Agent, or Manager.
        /// </summary>
        public EscalationTargetKindEnum TargetKind { get; set; } = EscalationTargetKindEnum.User;

        /// <summary>
        /// Target identifier: a user ID or email, a role ID or name, or an agent ID or name. Null for Manager.
        /// </summary>
        public string? TargetId { get; set; } = null;

        /// <summary>
        /// Target display name, resolved by the server.
        /// </summary>
        public string? TargetName { get; set; } = null;

        /// <summary>
        /// Severity. Default Warning.
        /// </summary>
        public EscalationSeverityEnum Severity { get; set; } = EscalationSeverityEnum.Warning;

        /// <summary>
        /// NonBlocking (default) lets the run continue; Blocking suspends it until the escalation is resolved.
        /// </summary>
        public EscalationModeEnum Mode { get; set; } = EscalationModeEnum.NonBlocking;

        /// <summary>
        /// Status.
        /// </summary>
        public EscalationStatusEnum Status { get; set; } = EscalationStatusEnum.Open;

        /// <summary>
        /// The question as the raising run wrote it.
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
        /// Context the raising run supplied, or null.
        /// </summary>
        public string? Context { get; set; } = null;

        /// <summary>
        /// Choices offered, in order; empty when the answer is free text.
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
        /// Default answer: an option key when there are options, otherwise text. Used by UseDefaultAnswer.
        /// </summary>
        public string? DefaultAnswer { get; set; } = null;

        /// <summary>
        /// Timeout in seconds, from 60 to 2592000 (30 days).
        /// </summary>
        public int TimeoutSeconds { get; set; } = 0;

        /// <summary>
        /// When the timeout action runs if nobody answers.
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// What happens at the timeout. Default EscalateUp.
        /// </summary>
        public EscalationTimeoutActionEnum TimeoutAction { get; set; } = EscalationTimeoutActionEnum.EscalateUp;

        /// <summary>
        /// The escalation that timed out and was passed up to this one, or null.
        /// </summary>
        public string? ParentEscalationId { get; set; } = null;

        /// <summary>
        /// The escalation this one was passed up to, or null. Answer that one instead.
        /// </summary>
        public string? EscalatedToId { get; set; } = null;

        /// <summary>
        /// Run started so a target agent could answer, or null.
        /// </summary>
        public string? RoutedRunId { get; set; } = null;

        /// <summary>
        /// Chosen option key, or null.
        /// </summary>
        public string? AnswerChoice { get; set; } = null;

        /// <summary>
        /// Answer text, or null.
        /// </summary>
        public string? AnswerText { get; set; } = null;

        /// <summary>
        /// Who answered or cancelled it.
        /// </summary>
        public string? ResolvedBy { get; set; } = null;

        /// <summary>
        /// What resolved it, or null while open.
        /// </summary>
        public EscalationResolutionSourceEnum? ResolutionSource { get; set; } = null;

        /// <summary>
        /// When it was resolved, or null while open.
        /// </summary>
        public DateTime? ResolvedUtc { get; set; } = null;

        /// <summary>
        /// Keeper tick that received the answer, or null.
        /// </summary>
        public string? DeliveredTickId { get; set; } = null;

        /// <summary>
        /// Created (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last updated (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Question = String.Empty;
        private List<EscalationOption> _Options = new List<EscalationOption>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public Escalation()
        {
        }

        #endregion
    }
}
