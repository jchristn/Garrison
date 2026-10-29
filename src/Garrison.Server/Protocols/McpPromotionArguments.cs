namespace Garrison.Server.Protocols
{
    /// <summary>Typed promotion tool arguments (AD1.6). Tenant identity comes from the authenticated caller.</summary>
    public class McpPromotionArguments
    {
        /// <summary>Agent identifier or name, for garrison_promote.</summary>
        public string? AgentId { get; set; } = null;

        /// <summary>Source environment, for garrison_promote.</summary>
        public string? SourceEnvironment { get; set; } = null;

        /// <summary>Target environment, for garrison_promote. Default: the next environment.</summary>
        public string? TargetEnvironment { get; set; } = null;

        /// <summary>Revision to promote, for garrison_promote. Default: what the source environment runs.</summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>Allow skipping environments, for garrison_promote. Default false.</summary>
        public bool AllowSkip { get; set; } = false;

        /// <summary>Promotion record identifier, for garrison_rollback_promotion.</summary>
        public string? PromotionId { get; set; } = null;

        /// <summary>Optional note, at most 2000 characters.</summary>
        public string? Note { get; set; } = null;
    }
}
