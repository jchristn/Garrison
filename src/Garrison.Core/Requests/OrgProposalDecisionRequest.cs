namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// A person's decision on an executive's proposal waiting for approval (AA8.9).
    /// </summary>
    public class OrgProposalDecisionRequest
    {
        /// <summary>
        /// True to apply the proposal, false to send it back to the executive.
        /// </summary>
        public bool Allow { get; set; } = false;

        /// <summary>
        /// Why, at most 4000 characters, or null.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
