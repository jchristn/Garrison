namespace Garrison.Core.Requests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A compare-and-set decision on a pending approval (P12.3): applied only while the approval is still Pending, so a
    /// person, the timeout, and a cancellation can never both decide.
    /// </summary>
    public class ApprovalResolution
    {
        /// <summary>
        /// Approval identifier.
        /// </summary>
        public string ApprovalId { get; set; } = String.Empty;

        /// <summary>
        /// Final status (Approved, Denied, Expired, or Cancelled).
        /// </summary>
        public ApprovalStatusEnum Status { get; set; } = ApprovalStatusEnum.Denied;

        /// <summary>
        /// What the harness is told.
        /// </summary>
        public ApprovalDecisionEnum Decision { get; set; } = ApprovalDecisionEnum.Deny;

        /// <summary>
        /// Who or what decided.
        /// </summary>
        public ApprovalSourceEnum Source { get; set; } = ApprovalSourceEnum.User;

        /// <summary>
        /// Name of the deciding principal, or null.
        /// </summary>
        public string? DecidedBy { get; set; } = null;

        /// <summary>
        /// Identifier of the deciding user or credential, or null.
        /// </summary>
        public string? DecidedById { get; set; } = null;

        /// <summary>
        /// Reason, or null.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// Decision time (UTC).
        /// </summary>
        public DateTime DecidedUtc { get; set; } = DateTime.UtcNow;
    }
}
