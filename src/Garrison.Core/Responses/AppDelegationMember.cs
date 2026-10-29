namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// One member's delegation policy as the app graph requires it and as its latest published revision has it (AD6.3).
    /// </summary>
    public class AppDelegationMember
    {
        /// <summary>
        /// Member agent identifier.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Member agent name.
        /// </summary>
        public string AgentName { get; set; } = String.Empty;

        /// <summary>
        /// Mode the graph requires: AllowList when the member calls others, None otherwise.
        /// </summary>
        public DelegationModeEnum DesiredMode { get; set; } = DelegationModeEnum.None;

        /// <summary>
        /// Agents the member may call, from its edges, by name.
        /// </summary>
        public List<string> DesiredAllowList { get; set; } = new List<string>();

        /// <summary>
        /// The longest path of calls below the member.
        /// </summary>
        public int DesiredMaxDepth { get; set; } = 0;

        /// <summary>
        /// Mode of the member's latest published revision, or null when it has none.
        /// </summary>
        public DelegationModeEnum? PublishedMode { get; set; } = null;

        /// <summary>
        /// Allow list of the latest published revision.
        /// </summary>
        public List<string> PublishedAllowList { get; set; } = new List<string>();

        /// <summary>
        /// Maximum depth of the latest published revision, or null.
        /// </summary>
        public int? PublishedMaxDepth { get; set; } = null;

        /// <summary>
        /// Whether the published policy differs from the graph.
        /// </summary>
        public bool Drift { get; set; } = false;

        /// <summary>
        /// Draft revision written with the graph's policy, or null when none was written.
        /// </summary>
        public int? DraftRevisionNumber { get; set; } = null;

        /// <summary>
        /// Why no draft was written although the policy drifts, for example DraftConflict when the member's open draft
        /// already changes its delegation another way. Null otherwise.
        /// </summary>
        public string? SkippedReason { get; set; } = null;
    }
}
