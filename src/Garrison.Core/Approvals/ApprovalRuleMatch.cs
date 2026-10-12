namespace Garrison.Core.Approvals
{
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// The result of evaluating a deployment's approval rules against one request (P12.3).
    /// </summary>
    public class ApprovalRuleMatch
    {
        #region Public-Members

        /// <summary>
        /// Action of the deciding rule, or null when no rule matched (the deployment default applies).
        /// </summary>
        public ApprovalRuleActionEnum? Action { get; set; } = null;

        /// <summary>
        /// The deciding rule (the first matching rule of the winning action), or null.
        /// </summary>
        public DeploymentApprovalRule? Rule { get; set; } = null;

        #endregion
    }
}
