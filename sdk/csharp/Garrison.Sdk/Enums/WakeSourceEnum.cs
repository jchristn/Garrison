namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Why a keeper tick started.
    /// </summary>
    public enum WakeSourceEnum
    {
        /// <summary>
        /// The mandate's schedule came due.
        /// </summary>
        Timer,

        /// <summary>
        /// A person asked for a wake now (REST, MCP, dashboard, or SDK).
        /// </summary>
        Manual,

        /// <summary>
        /// An urgent message arrived.
        /// </summary>
        Message,

        /// <summary>
        /// An escalation the keeper raised was answered.
        /// </summary>
        EscalationAnswer,

        /// <summary>
        /// A webhook asked for a wake.
        /// </summary>
        Webhook,

        /// <summary>
        /// A subordinate filed a report that asks its manager to wake.
        /// </summary>
        Report
    }
}
