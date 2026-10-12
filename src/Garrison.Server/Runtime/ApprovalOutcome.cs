namespace Garrison.Server.Runtime
{
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// The answer to a permission request (P12.3): what the harness is told and the recorded approval.
    /// </summary>
    public class ApprovalOutcome
    {
        #region Public-Members

        /// <summary>
        /// Allow or Deny.
        /// </summary>
        public ApprovalDecisionEnum Decision { get; set; } = ApprovalDecisionEnum.Deny;

        /// <summary>
        /// Message for the harness when denied (rendered from the approval-denied prompt template), otherwise null.
        /// </summary>
        public string? Message { get; set; } = null;

        /// <summary>
        /// The recorded approval, or null when nothing could be recorded.
        /// </summary>
        public Approval? Approval { get; set; } = null;

        #endregion
    }
}
