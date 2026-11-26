namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Arguments of the canary release tools (AA9.12).
    /// </summary>
    public class McpCanaryArguments
    {
        /// <summary>Canary release identifier.</summary>
        public string? ReleaseId { get; set; } = null;

        /// <summary>Agent identifier or name.</summary>
        public string? Agent { get; set; } = null;

        /// <summary>Candidate deployment identifier or name.</summary>
        public string? CandidateDeployment { get; set; } = null;

        /// <summary>Baseline deployment identifier or name.</summary>
        public string? BaselineDeployment { get; set; } = null;

        /// <summary>Steps of the release.</summary>
        public List<CanaryReleaseStep>? Steps { get; set; } = null;

        /// <summary>Highest error rate percent a step may reach.</summary>
        public double? MaxErrorRatePercent { get; set; } = null;

        /// <summary>Lowest eval score each step needs.</summary>
        public double? MinEvalScore { get; set; } = null;

        /// <summary>Eval set the gate reads.</summary>
        public string? EvalSetId { get; set; } = null;

        /// <summary>Status filter.</summary>
        public string? Status { get; set; } = null;

        /// <summary>Why the release is aborted.</summary>
        public string? Reason { get; set; } = null;

        /// <summary>Records to skip.</summary>
        public int? Skip { get; set; } = null;

        /// <summary>Most records to return.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
