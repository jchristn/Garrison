namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Arguments of the change rule and proposal tools (AA8.9).
    /// </summary>
    public class McpChangeRuleArguments
    {
        /// <summary>Organization identifier or name.</summary>
        public string? Organization { get; set; } = null;

        /// <summary>Unit identifier or name within the organization.</summary>
        public string? Unit { get; set; } = null;

        /// <summary>Change rule identifier.</summary>
        public string? RuleId { get; set; } = null;

        /// <summary>Rule name.</summary>
        public string? Name { get; set; } = null;

        /// <summary>Rule description.</summary>
        public string? Description { get; set; } = null;

        /// <summary>Whether the rule is in force.</summary>
        public bool? Active { get; set; } = null;

        /// <summary>When the rule stops applying (UTC).</summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>Change classes the rule covers.</summary>
        public List<string>? Classes { get; set; } = null;

        /// <summary>Limits on the changes the rule covers.</summary>
        public List<ChangeRuleLimit>? Limits { get; set; } = null;

        /// <summary>Only active rules.</summary>
        public bool? ActiveOnly { get; set; } = null;

        /// <summary>Part of a rule name.</summary>
        public string? Search { get; set; } = null;

        /// <summary>Proposal (draft) identifier.</summary>
        public string? DraftId { get; set; } = null;

        /// <summary>Proposal status filter.</summary>
        public string? Status { get; set; } = null;

        /// <summary>Whether to apply a proposal.</summary>
        public bool? Allow { get; set; } = null;

        /// <summary>Why.</summary>
        public string? Reason { get; set; } = null;

        /// <summary>Records to skip.</summary>
        public int? Skip { get; set; } = null;

        /// <summary>Records to return.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
