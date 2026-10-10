namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Conditional run status transition (compare-and-set).
    /// </summary>
    public class RunTransition
    {
        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Statuses the run must currently be in.
        /// </summary>
        public List<RunStatusEnum> FromStatuses { get; set; } = new List<RunStatusEnum>();

        /// <summary>
        /// New status.
        /// </summary>
        public RunStatusEnum ToStatus { get; set; } = RunStatusEnum.Queued;

        /// <summary>
        /// Required current lease epoch, when fencing.
        /// </summary>
        public long? Epoch { get; set; } = null;

        /// <summary>
        /// Required current lease node, when fencing.
        /// </summary>
        public string? NodeId { get; set; } = null;

        /// <summary>
        /// Outcome to set.
        /// </summary>
        public RunOutcomeEnum? Outcome { get; set; } = null;

        /// <summary>
        /// Error message to set.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// Whether to clear the lease node and expiry.
        /// </summary>
        public bool ClearLease { get; set; } = false;

        /// <summary>
        /// Whether to set the completion time.
        /// </summary>
        public bool SetCompleted { get; set; } = false;

        /// <summary>
        /// Whether to set the start time.
        /// </summary>
        public bool SetStarted { get; set; } = false;

        /// <summary>
        /// Whether to set the queued time.
        /// </summary>
        public bool SetQueued { get; set; } = false;

        /// <summary>
        /// Whether to increment the attempt counter.
        /// </summary>
        public bool IncrementAttempt { get; set; } = false;

        /// <summary>
        /// Cancel-requested flag to set.
        /// </summary>
        public bool? CancelRequested { get; set; } = null;

        /// <summary>
        /// Deadline to set.
        /// </summary>
        public DateTime? DeadlineUtc { get; set; } = null;
    }
}
