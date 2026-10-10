namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Classified outcome of a harness run.
    /// </summary>
    public class HarnessOutcome
    {
        /// <summary>
        /// Terminal status.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Failed;

        /// <summary>
        /// Outcome code.
        /// </summary>
        public RunOutcomeEnum Outcome { get; set; } = RunOutcomeEnum.HarnessFailed;

        /// <summary>
        /// Error message for failed runs.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;
    }
}
