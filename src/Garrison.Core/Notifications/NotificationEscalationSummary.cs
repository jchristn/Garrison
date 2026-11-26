namespace Garrison.Core.Notifications
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Fields carried by EscalationRaised and EscalationExpired notifications (AA2.10). The question is included so a person
    /// can triage from the notification; the context and answer are not.
    /// </summary>
    public class NotificationEscalationSummary
    {
        #region Public-Members

        /// <summary>
        /// Escalation identifier (esc_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// The raising run, or null for an escalated-up escalation.
        /// </summary>
        public string? RaisingRunId { get; set; } = null;

        /// <summary>
        /// The raising agent's identifier, or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// The raising agent's name, or null.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// The keeper (mandate) that raised it, or null.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// Who it is addressed to.
        /// </summary>
        public EscalationTargetKindEnum TargetKind { get; set; } = EscalationTargetKindEnum.User;

        /// <summary>
        /// Target identifier, or null.
        /// </summary>
        public string? TargetId { get; set; } = null;

        /// <summary>
        /// Target name, or null.
        /// </summary>
        public string? TargetName { get; set; } = null;

        /// <summary>
        /// Severity.
        /// </summary>
        public EscalationSeverityEnum Severity { get; set; } = EscalationSeverityEnum.Warning;

        /// <summary>
        /// Blocking or NonBlocking.
        /// </summary>
        public EscalationModeEnum Mode { get; set; } = EscalationModeEnum.NonBlocking;

        /// <summary>
        /// Status at the time of the notification.
        /// </summary>
        public EscalationStatusEnum Status { get; set; } = EscalationStatusEnum.Open;

        /// <summary>
        /// The question, truncated to 2000 characters.
        /// </summary>
        public string Question { get; set; } = String.Empty;

        /// <summary>
        /// The escalation it was escalated up from, or null.
        /// </summary>
        public string? ParentEscalationId { get; set; } = null;

        /// <summary>
        /// When it was raised (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When its timeout runs or ran, or null.
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with defaults.
        /// </summary>
        public NotificationEscalationSummary()
        {
        }

        #endregion
    }
}
