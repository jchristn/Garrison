namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Lifecycle of an eval run (AA9.3).
    /// </summary>
    public enum EvalRunStatusEnum
    {
        /// <summary>
        /// Created; no case has started yet.
        /// </summary>
        Pending,

        /// <summary>
        /// Cases are running.
        /// </summary>
        Running,

        /// <summary>
        /// Every case finished and the run has a score. Passed says whether the score met the threshold.
        /// </summary>
        Completed,

        /// <summary>
        /// The run could not finish (budget exhausted, target missing, internal error); see failureReason.
        /// </summary>
        Failed,

        /// <summary>
        /// A person or the system cancelled the run before it finished.
        /// </summary>
        Cancelled
    }
}
