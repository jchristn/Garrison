namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Result of one keeper tick. The run reports Quiet, Acted, Attention, or Escalated with garrison_keeper_complete_tick; the scheduler records Failed, Skipped, and Unreported itself.
    /// </summary>
    public enum TickOutcomeEnum
    {
        /// <summary>
        /// Nothing needed attention. In Backoff mode the interval grows.
        /// </summary>
        Quiet,

        /// <summary>
        /// The keeper acted within its autonomy and things are fine. The interval stays the same.
        /// </summary>
        Acted,

        /// <summary>
        /// Something needs a closer watch. The interval returns to the minimum.
        /// </summary>
        Attention,

        /// <summary>
        /// The keeper raised an escalation. The interval returns to the minimum.
        /// </summary>
        Escalated,

        /// <summary>
        /// The tick's run failed or timed out, or could not be started. The interval returns to the minimum.
        /// </summary>
        Failed,

        /// <summary>
        /// The wake was not run, for example because the previous tick was still running. No run exists.
        /// </summary>
        Skipped,

        /// <summary>
        /// The run ended without calling garrison_keeper_complete_tick. The interval stays the same.
        /// </summary>
        Unreported
    }
}
