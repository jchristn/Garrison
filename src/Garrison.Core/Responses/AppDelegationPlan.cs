namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Every member's delegation policy derived from an app's graph (AD6.3, AD-005d), with drift against what is
    /// published.
    /// </summary>
    public class AppDelegationPlan
    {
        /// <summary>
        /// App identifier.
        /// </summary>
        public string AppId { get; set; } = String.Empty;

        /// <summary>
        /// Whether drafts were written (apply) or only reported.
        /// </summary>
        public bool Applied { get; set; } = false;

        /// <summary>
        /// Members, in app order.
        /// </summary>
        public List<AppDelegationMember> Members { get; set; } = new List<AppDelegationMember>();
    }
}
