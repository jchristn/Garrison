namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// How two steps of an activity trail are linked (LP1.3). Edges point from cause to effect, except Answered and
    /// Decided, which point back to the run that waited.
    /// </summary>
    public enum RunTrailEdgeKindEnum
    {
        /// <summary>
        /// A caller, trigger, keeper tick, or pipeline run started a run.
        /// </summary>
        Started,

        /// <summary>
        /// A run (or a fan-out group) started a child run.
        /// </summary>
        Spawned,

        /// <summary>
        /// A run started a fan-out group.
        /// </summary>
        FannedOut,

        /// <summary>
        /// A run was retried as a new run.
        /// </summary>
        Retried,

        /// <summary>
        /// A run (or a caller) sent a message.
        /// </summary>
        Sent,

        /// <summary>
        /// A message woke its recipient, starting a run.
        /// </summary>
        Woke,

        /// <summary>
        /// A run filed a report.
        /// </summary>
        Filed,

        /// <summary>
        /// A run raised an escalation.
        /// </summary>
        Raised,

        /// <summary>
        /// An escalation was routed to an agent, starting or reaching a run.
        /// </summary>
        Routed,

        /// <summary>
        /// An escalation was answered, and the answer went back to the run that raised it.
        /// </summary>
        Answered,

        /// <summary>
        /// A run requested a tool approval.
        /// </summary>
        Requested,

        /// <summary>
        /// An approval was decided, and the decision went back to the run that requested it.
        /// </summary>
        Decided,

        /// <summary>
        /// A run performed a state-changing tool call (an effect journal entry).
        /// </summary>
        Performed,

        /// <summary>
        /// The root run's result went back to the caller.
        /// </summary>
        Replied,

        /// <summary>
        /// A message reached a run that was already running (it read its inbox) instead of waking a new run.
        /// </summary>
        Delivered,

        /// <summary>
        /// A live run to a shadow copy of it that a shadow trial ran on the candidate deployment (LP-014).
        /// </summary>
        Shadowed
    }
}
