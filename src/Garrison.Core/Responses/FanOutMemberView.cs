namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// One member of a fan-out group as gather and the REST routes show it (AD5.3).
    /// </summary>
    public class FanOutMemberView
    {
        /// <summary>
        /// Label.
        /// </summary>
        public string Label { get; set; } = String.Empty;

        /// <summary>
        /// Agent name.
        /// </summary>
        public string Agent { get; set; } = String.Empty;

        /// <summary>
        /// Child run identifier.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Child run status.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Queued;

        /// <summary>
        /// Child run outcome once finished, or null.
        /// </summary>
        public RunOutcomeEnum? Outcome { get; set; } = null;

        /// <summary>
        /// Result text, cut at Delegation.GatherResultCharLimit, or null.
        /// </summary>
        public string? ResultText { get; set; } = null;

        /// <summary>
        /// Whether the result text was cut.
        /// </summary>
        public bool ResultTruncated { get; set; } = false;

        /// <summary>
        /// Structured output as JSON text, or null.
        /// </summary>
        public string? StructuredOutputJson { get; set; } = null;

        /// <summary>
        /// Error message of a failed member, or null.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// Paths the member wrote in the shared file space.
        /// </summary>
        public List<string> FilesWritten { get; set; } = new List<string>();

        /// <summary>
        /// Cost the member recorded in US dollars, or null.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Input plus output tokens the member recorded.
        /// </summary>
        public long Tokens { get; set; } = 0;
    }
}
