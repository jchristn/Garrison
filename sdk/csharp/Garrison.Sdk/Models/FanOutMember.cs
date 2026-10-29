namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One member of a fan-out group: a child run with its current state and, once it finishes, its result. Not
    /// thread-safe.
    /// </summary>
    public class FanOutMember
    {
        #region Public-Members

        /// <summary>
        /// Label the parent gave the member, unique within the group.
        /// </summary>
        public string Label { get; set; } = String.Empty;

        /// <summary>
        /// Name of the agent the member runs.
        /// </summary>
        public string Agent { get; set; } = String.Empty;

        /// <summary>
        /// Identifier of the member's child run.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Child run status. Default Queued.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Queued;

        /// <summary>
        /// Child run outcome once it finishes, or null.
        /// </summary>
        public RunOutcomeEnum? Outcome { get; set; } = null;

        /// <summary>
        /// Result text, cut at the server's gather limit, or null.
        /// </summary>
        public string? ResultText { get; set; } = null;

        /// <summary>
        /// Whether the result text was cut. Default false.
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
        /// Paths the member wrote in the shared file space. Never null; assigning null stores an empty list.
        /// </summary>
        public List<string> FilesWritten
        {
            get
            {
                return _FilesWritten;
            }
            set
            {
                _FilesWritten = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Cost the member recorded in US dollars, or null when none was recorded.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Input plus output tokens the member recorded. Default 0.
        /// </summary>
        public long Tokens { get; set; } = 0;

        #endregion

        #region Private-Members

        private List<string> _FilesWritten = new List<string>();

        #endregion
    }
}
