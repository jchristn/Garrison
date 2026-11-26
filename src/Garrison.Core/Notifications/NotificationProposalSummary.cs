namespace Garrison.Core.Notifications
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Fields carried by OrgProposalApplied notifications (AA8.10): what was applied, for which unit, and under which
    /// change rules. The diff is not included; read the proposal for it.
    /// </summary>
    public class NotificationProposalSummary
    {
        #region Public-Members

        /// <summary>
        /// Draft identifier (sdr_).
        /// </summary>
        public string DraftId { get; set; } = String.Empty;

        /// <summary>
        /// Draft title.
        /// </summary>
        public string Title { get; set; } = String.Empty;

        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; set; } = String.Empty;

        /// <summary>
        /// Organization name, or null.
        /// </summary>
        public string? OrganizationName { get; set; } = null;

        /// <summary>
        /// The unit the executive leads.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// The unit's name, or null.
        /// </summary>
        public string? UnitName { get; set; } = null;

        /// <summary>
        /// The executive's agent.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// The executive's agent name, or null.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// The approval decided by the rules.
        /// </summary>
        public string ApprovalId { get; set; } = String.Empty;

        /// <summary>
        /// Change rules that covered the proposal.
        /// </summary>
        public List<string> RuleIds { get; set; } = new List<string>();

        /// <summary>
        /// When it was applied (UTC).
        /// </summary>
        public DateTime AppliedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Eval runs, shadow trials, and canary releases that tested the draft before it applied (AA9.10), or null.
        /// </summary>
        public ProposalEvidence? Evidence { get; set; } = null;

        #endregion
    }
}
