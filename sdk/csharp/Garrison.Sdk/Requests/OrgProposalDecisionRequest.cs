namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// A person's decision on an executive's proposal waiting for approval (AA8.9).
    /// </summary>
    public class OrgProposalDecisionRequest
    {
        /// <summary>
        /// True to apply the proposal (recorded as an org revision), false to send it back to the executive. Default false.
        /// </summary>
        public bool Allow { get; set; } = false;

        /// <summary>
        /// Why, at most 4000 characters, or null.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
