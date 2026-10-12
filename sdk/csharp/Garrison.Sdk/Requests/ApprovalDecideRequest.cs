namespace Garrison.Sdk.Requests
{
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A person's decision on a pending approval.
    /// </summary>
    public class ApprovalDecideRequest
    {
        /// <summary>
        /// Allow or Deny. Required.
        /// </summary>
        public ApprovalDecisionEnum? Decision { get; set; } = null;

        /// <summary>
        /// Optional reason, shown to the harness when denying and kept on the approval. At most 4000 characters.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// Also add a rule to the approval's deployment so the same request is decided the same way next time (Allow
        /// adds an Allow rule, Deny a Deny rule). Needs permission to update the deployment. Default false.
        /// </summary>
        public bool Remember { get; set; } = false;

        /// <summary>
        /// Pattern of the remembered rule, or null for the approval's suggested rule.
        /// </summary>
        public string? RulePattern { get; set; } = null;
    }
}
