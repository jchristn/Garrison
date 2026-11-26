namespace Garrison.Server.Protocols
{
    using System;

    /// <summary>
    /// Arguments of the shadow trial tools (AA9.12).
    /// </summary>
    public class McpShadowTrialArguments
    {
        /// <summary>Shadow trial identifier.</summary>
        public string? TrialId { get; set; } = null;

        /// <summary>Trial name.</summary>
        public string? Name { get; set; } = null;

        /// <summary>Source deployment identifier or name.</summary>
        public string? SourceDeployment { get; set; } = null;

        /// <summary>Candidate deployment identifier or name.</summary>
        public string? CandidateDeployment { get; set; } = null;

        /// <summary>Percent of the source's runs copied, 1 to 100.</summary>
        public int? SamplePercent { get; set; } = null;

        /// <summary>When the trial ends (UTC).</summary>
        public DateTime? EndsUtc { get; set; } = null;

        /// <summary>Eval set the outputs are compared with.</summary>
        public string? ComparisonEvalSetId { get; set; } = null;

        /// <summary>Whether a judge compares the outputs.</summary>
        public bool? UseJudge { get; set; } = null;

        /// <summary>Status filter.</summary>
        public string? Status { get; set; } = null;

        /// <summary>Why the trial stops.</summary>
        public string? Reason { get; set; } = null;

        /// <summary>Records to skip.</summary>
        public int? Skip { get; set; } = null;

        /// <summary>Most records to return.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
