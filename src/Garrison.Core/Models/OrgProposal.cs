namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Responses;

    /// <summary>
    /// An executive's draft seen from its organization (AA8.9): who proposed it, for which unit, where it stands, and how it
    /// was decided. Computed from the draft and its approval; nothing is stored apart from them. Not thread-safe.
    /// </summary>
    public class OrgProposal
    {
        #region Public-Members

        /// <summary>
        /// Draft identifier.
        /// </summary>
        public string DraftId { get; set; } = String.Empty;

        /// <summary>
        /// Draft title.
        /// </summary>
        public string Title { get; set; } = String.Empty;

        /// <summary>
        /// Draft status: Open (being written or reopened), PendingApproval (waiting for a person), or Applied.
        /// </summary>
        public StudioDraftStatusEnum Status { get; set; } = StudioDraftStatusEnum.Open;

        /// <summary>
        /// Draft version.
        /// </summary>
        public int Version { get; set; } = 1;

        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; set; } = String.Empty;

        /// <summary>
        /// The unit the executive leads.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// The unit's name, or null when it no longer exists.
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
        /// The run that wrote the draft, or null.
        /// </summary>
        public string? OriginRunId { get; set; } = null;

        /// <summary>
        /// The person the run acted for, or null.
        /// </summary>
        public string? OwnerName { get; set; } = null;

        /// <summary>
        /// The latest apply approval, or null when apply was never requested.
        /// </summary>
        public string? ApprovalId { get; set; } = null;

        /// <summary>
        /// The approval's status, or null.
        /// </summary>
        public ApprovalStatusEnum? ApprovalStatus { get; set; } = null;

        /// <summary>
        /// Who decided: Rule when change rules applied it, User when a person did, or null while undecided.
        /// </summary>
        public ApprovalSourceEnum? DecisionSource { get; set; } = null;

        /// <summary>
        /// Name of the deciding person, "change rules", or null.
        /// </summary>
        public string? DecidedBy { get; set; } = null;

        /// <summary>
        /// The decision's reason, or null.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// Change rules that applied the draft, in first-use order; empty unless DecisionSource is Rule.
        /// </summary>
        public List<string> RuleIds { get; set; } = new List<string>();

        /// <summary>
        /// The draft against live configuration with refusals and rule matches; filled only when one proposal is read and
        /// the draft is not applied.
        /// </summary>
        public StudioDraftDiff? Diff { get; set; } = null;

        /// <summary>
        /// Draft creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Draft last change time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion
    }
}
