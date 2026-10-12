namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Action of a deployment approval rule and of the deployment's default (P12.3). When several rules match, Deny
    /// beats Ask and Ask beats Allow (D-025).
    /// </summary>
    public enum ApprovalRuleActionEnum
    {
        /// <summary>
        /// Allow the tool call without asking; the decision is recorded.
        /// </summary>
        Allow,

        /// <summary>
        /// Deny the tool call without asking; the decision is recorded.
        /// </summary>
        Deny,

        /// <summary>
        /// Create a pending approval and wait for a person to decide.
        /// </summary>
        Ask
    }
}
