namespace Garrison.Core.Enums
{
    /// <summary>
    /// What a step of an activity trail is (LP1.3). A trail is built from existing records; each node names one of them.
    /// </summary>
    public enum RunTrailNodeKindEnum
    {
        /// <summary>
        /// The person, API credential, or administrator whose request started the work. The node's identifier is the
        /// caller's principal identifier.
        /// </summary>
        Caller,

        /// <summary>
        /// A trigger (cron, webhook, or manual) that started the work. The node's identifier is the trigger's.
        /// </summary>
        Trigger,

        /// <summary>
        /// A keeper tick that started the work. The node's identifier is the mandate tick's.
        /// </summary>
        KeeperTick,

        /// <summary>
        /// A run of an agent.
        /// </summary>
        Run,

        /// <summary>
        /// A message from one agent (or a person) to another agent.
        /// </summary>
        Message,

        /// <summary>
        /// A report a run filed upward.
        /// </summary>
        Report,

        /// <summary>
        /// An escalation a run raised.
        /// </summary>
        Escalation,

        /// <summary>
        /// A tool approval a run requested.
        /// </summary>
        Approval,

        /// <summary>
        /// A state-changing Garrison tool call recorded in the effect journal.
        /// </summary>
        Effect,

        /// <summary>
        /// A fan-out group a run started; its members are child runs.
        /// </summary>
        FanOutGroup,

        /// <summary>
        /// A pipeline run whose stages are runs.
        /// </summary>
        PipelineRun,

        /// <summary>
        /// The answer going back to the caller: the root run reached a terminal state. Synthesized from the root run; no
        /// separate reply record exists.
        /// </summary>
        Reply,

        /// <summary>
        /// A step the caller may not read. Only its kind (in RedactedKind) and time are shown.
        /// </summary>
        Redacted
    }
}
