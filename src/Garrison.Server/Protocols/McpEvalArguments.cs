namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Arguments of the eval tools (AA9.12): garrison_run_eval, garrison_get_eval_run, garrison_list_eval_sets,
    /// garrison_create_eval_set, and garrison_approve_eval_set.
    /// </summary>
    public class McpEvalArguments
    {
        /// <summary>Eval set identifier or name.</summary>
        public string? Set { get; set; } = null;

        /// <summary>Set version when set is a name, or null for the latest approved version.</summary>
        public int? SetVersion { get; set; } = null;

        /// <summary>Agent identifier or name (agent revision target).</summary>
        public string? Agent { get; set; } = null;

        /// <summary>Agent revision identifier.</summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>Deployment identifier or name (deployment target).</summary>
        public string? Deployment { get; set; } = null;

        /// <summary>Studio draft to evaluate.</summary>
        public string? StudioDraftId { get; set; } = null;

        /// <summary>Cases or RecentInputs.</summary>
        public string? InputMode { get; set; } = null;

        /// <summary>Recent runs replayed in RecentInputs mode.</summary>
        public int? RecentInputCount { get; set; } = null;

        /// <summary>Score the run must reach to pass.</summary>
        public double? Threshold { get; set; } = null;

        /// <summary>Most USD the run may spend.</summary>
        public double? BudgetUsd { get; set; } = null;

        /// <summary>Eval run identifier.</summary>
        public string? EvalRunId { get; set; } = null;

        /// <summary>Whether garrison_get_eval_run includes case results (default true).</summary>
        public bool? IncludeResults { get; set; } = null;

        /// <summary>Set name.</summary>
        public string? Name { get; set; } = null;

        /// <summary>Set description.</summary>
        public string? Description { get; set; } = null;

        /// <summary>Human or Playground.</summary>
        public string? Origin { get; set; } = null;

        /// <summary>Judge agent identifier or name.</summary>
        public string? JudgeAgent { get; set; } = null;

        /// <summary>Tags.</summary>
        public List<string>? Tags { get; set; } = null;

        /// <summary>Cases of a new set.</summary>
        public List<EvalCase>? Cases { get; set; } = null;

        /// <summary>State filter (Draft or Approved).</summary>
        public string? State { get; set; } = null;

        /// <summary>Tag filter.</summary>
        public string? Tag { get; set; } = null;

        /// <summary>Only the newest version of each set.</summary>
        public bool? LatestOnly { get; set; } = null;

        /// <summary>Part of a set name.</summary>
        public string? Search { get; set; } = null;

        /// <summary>Records to skip.</summary>
        public int? Skip { get; set; } = null;

        /// <summary>Records to return.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
