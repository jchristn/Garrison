namespace Garrison.Core.Enums
{
    /// <summary>
    /// Why a run was created.
    /// </summary>
    public enum RunKindEnum
    {
        /// <summary>
        /// Invoke.
        /// </summary>
        Invoke,

        /// <summary>
        /// Delegated.
        /// </summary>
        Delegated,

        /// <summary>
        /// Test.
        /// </summary>
        Test,

        /// <summary>
        /// Retry.
        /// </summary>
        Retry,

        /// <summary>
        /// A stage of a pipeline run (P12.9). The run carries pipelineRunId, pipelinePosition, and pipelineExecution.
        /// </summary>
        Pipeline,

        /// <summary>
        /// Started by a trigger (P12.5): a cron schedule, a signed webhook, or a manual fire. The run carries triggerId.
        /// </summary>
        Trigger,

        /// <summary>
        /// A studio playground run (AD9.1): an agent's draft revision on an ephemeral deployment in the reserved draft
        /// environment. Left out of capability hints and never reachable from an app UI.
        /// </summary>
        Playground,

        /// <summary>
        /// One tick of a keeper (AA1): the wake scheduler started it for a mandate. The run carries mandateId and
        /// mandateTickId, and only these runs see garrison_keeper_context and garrison_keeper_complete_tick.
        /// </summary>
        Keeper,

        /// <summary>
        /// Started by an urgent message to an agent that has no active keeper (AA6). The run's input carries the queued
        /// messages through message-wake, and those messages are marked delivered to it.
        /// </summary>
        Message,

        /// <summary>
        /// One case of an eval run (AA9.3): the input of an eval case, or a replayed recent input, run against the eval
        /// run's target. The run carries evalRunId.
        /// </summary>
        Eval,

        /// <summary>
        /// A shadow copy of a source deployment's input run on a candidate deployment (AA9.7, AA-027). Tool approvals
        /// default to Deny and effects, messages, escalations, reports, memory writes, and drafts are refused. The run
        /// carries shadowTrialId.
        /// </summary>
        Shadow
    }
}
