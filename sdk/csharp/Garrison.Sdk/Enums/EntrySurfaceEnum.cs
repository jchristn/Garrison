namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// How a run came in (LP-013, LP1.12): the protocol or internal path that asked for it. Recorded once, when the run is
    /// created, and shown on the activity trail's Caller node and on the runs that start a leg of the work.
    /// </summary>
    public enum EntrySurfaceEnum
    {
        /// <summary>
        /// The REST API: an invoke, a run created directly, a conversation turn, a retry, a board message, or a playground
        /// run. The dashboard calls the REST API too, so its requests are recorded as Rest.
        /// </summary>
        Rest,

        /// <summary>
        /// The MCP server: garrison_invoke_agent, garrison_start_run, or garrison_fan_out, by a person or by a run.
        /// </summary>
        Mcp,

        /// <summary>
        /// The A2A gateway.
        /// </summary>
        A2a,

        /// <summary>
        /// The app gateway an agentic app's end users chat through.
        /// </summary>
        App,

        /// <summary>
        /// The dashboard. Reserved: the dashboard calls the REST API with the same credentials as any client, so nothing
        /// tells its requests apart and they are recorded as Rest.
        /// </summary>
        Dashboard,

        /// <summary>
        /// A trigger fire (cron, webhook, or manual).
        /// </summary>
        Trigger,

        /// <summary>
        /// A keeper tick.
        /// </summary>
        Keeper,

        /// <summary>
        /// A message that woke its recipient.
        /// </summary>
        Message,

        /// <summary>
        /// An escalation routed to an agent.
        /// </summary>
        Escalation,

        /// <summary>
        /// An eval case or an eval judge.
        /// </summary>
        Eval,

        /// <summary>
        /// A shadow copy or a shadow judge.
        /// </summary>
        Shadow,

        /// <summary>
        /// Started by Garrison itself on behalf of other work, such as a pipeline stage.
        /// </summary>
        Internal
    }
}
