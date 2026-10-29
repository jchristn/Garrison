namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// Promote an agent revision from one environment to another (AD1.4).
    /// </summary>
    public class PromotionRequest
    {
        /// <summary>
        /// Agent identifier or name. Required.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Environment the revision comes from. Required.
        /// </summary>
        public string SourceEnvironment { get; set; } = String.Empty;

        /// <summary>
        /// Environment to promote to. Default: the next environment after the source in the tenant's ordered list.
        /// </summary>
        public string? TargetEnvironment { get; set; } = null;

        /// <summary>
        /// Revision to promote. Default: the revision the source environment's deployments run (their common pin, or the
        /// agent's latest published revision when they are unpinned). A draft revision is refused.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>
        /// Allow a target that is not the next environment in order. Default false; when false such a promotion is refused
        /// with PromotionOrderViolation.
        /// </summary>
        public bool AllowSkip { get; set; } = false;

        /// <summary>
        /// Optional note, at most 2000 characters.
        /// </summary>
        public string? Note { get; set; } = null;
    }
}
