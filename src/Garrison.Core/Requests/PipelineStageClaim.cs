namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Claim the next execution of a pipeline run stage (P12.9): applied only while the stage's executions equals
    /// ExpectedExecutions, so exactly one advancer on any replica claims each execution.
    /// </summary>
    public class PipelineStageClaim
    {
        #region Public-Members

        /// <summary>
        /// Pipeline run stage.
        /// </summary>
        public string RunStageId
        {
            get
            {
                return _RunStageId;
            }
            set
            {
                _RunStageId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Executions the stage must have now; the claim sets it to this value plus one.
        /// </summary>
        public int ExpectedExecutions { get; set; } = 0;

        /// <summary>
        /// Attempt number of the claimed execution within its retry cycle (1 or more).
        /// </summary>
        public int Attempts { get; set; } = 1;

        /// <summary>
        /// Revisions after the claim.
        /// </summary>
        public int Revisions { get; set; } = 0;

        /// <summary>
        /// Why the claimed execution must wait before its run is created (for example a QuotaExceeded refusal at compile
        /// time), recorded with the claim. Null (the default) claims an execution that starts at once.
        /// </summary>
        public string? BlockedReason { get; set; } = null;

        /// <summary>
        /// Earliest time (UTC) the claimed execution's run may be created; set together with <see cref="BlockedReason"/>.
        /// Null (the default) means at once.
        /// </summary>
        public DateTime? NextAttemptUtc { get; set; } = null;

        #endregion

        #region Private-Members

        private string _RunStageId = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineStageClaim()
        {
        }

        #endregion
    }
}
