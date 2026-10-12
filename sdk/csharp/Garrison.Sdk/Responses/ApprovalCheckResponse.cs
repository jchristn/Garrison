namespace Garrison.Sdk.Responses
{
    using Garrison.Sdk.Enums;

    /// <summary>
    /// What a deployment's approval rules would do with a request.
    /// </summary>
    public class ApprovalCheckResponse
    {
        /// <summary>
        /// Allow, Deny, or Ask.
        /// </summary>
        public ApprovalRuleActionEnum Action { get; set; } = ApprovalRuleActionEnum.Ask;

        /// <summary>
        /// Rule when a rule matched, Default when the deployment default applied.
        /// </summary>
        public ApprovalSourceEnum Source { get; set; } = ApprovalSourceEnum.Default;

        /// <summary>
        /// Matching rule identifier, or null.
        /// </summary>
        public string? RuleId { get; set; } = null;

        /// <summary>
        /// Matching rule pattern, or null.
        /// </summary>
        public string? RulePattern { get; set; } = null;

        /// <summary>
        /// A rule pattern that would cover the request.
        /// </summary>
        public string? SuggestedRule { get; set; } = null;

        /// <summary>
        /// Whether approvals are enabled on the deployment; when false the rules are not consulted for runs.
        /// </summary>
        public bool ApprovalsEnabled { get; set; } = false;
    }
}
