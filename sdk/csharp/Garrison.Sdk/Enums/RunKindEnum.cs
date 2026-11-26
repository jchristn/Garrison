namespace Garrison.Sdk.Enums
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
        /// A stage of a pipeline run (PipelineRunId, PipelinePosition, and PipelineExecution are set).
        /// </summary>
        Pipeline,

        /// <summary>
        /// Started by a trigger (P12.5): a cron schedule, a signed webhook, or a manual fire. TriggerId is set.
        /// </summary>
        Trigger,

        /// <summary>
        /// A studio playground run (AD9.1): an agent's draft revision on an ephemeral deployment in the reserved draft
        /// environment. Left out of capability hints and never reachable from an app UI.
        /// </summary>
        Playground,

        /// <summary>
        /// A keeper tick (AA1): a run of a mandate's agent woken by the keeper scheduler. MandateId and MandateTickId are set.
        /// </summary>
        Keeper,

        /// <summary>
        /// Started by urgent mail to an agent without a keeper (AA6). Its input carries the agent's queued messages.
        /// </summary>
        Message,

        /// <summary>
        /// One case of an eval run (AA9.3): the input of an eval case, or a replayed recent input, run against the eval
        /// run's target. EvalRunId is set.
        /// </summary>
        Eval,

        /// <summary>
        /// A shadow copy of a source deployment's input run on a candidate deployment (AA9.7). Tool approvals default to
        /// Deny and effects, messages, escalations, reports, memory writes, and drafts are refused. ShadowTrialId is set.
        /// </summary>
        Shadow
    }
}
