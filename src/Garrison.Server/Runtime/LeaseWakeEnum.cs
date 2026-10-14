namespace Garrison.Server.Runtime
{
    /// <summary>
    /// Why a waiting lease long poll looks for work again (P10.24). Reported as the source label of
    /// garrison_scheduler_queue_wakeups_total.
    /// </summary>
    public enum LeaseWakeEnum
    {
        /// <summary>
        /// A queue notice for a run this poll could take woke it.
        /// </summary>
        Notify,

        /// <summary>
        /// Another poll that could not take a run handed the run's notice to this one.
        /// </summary>
        Handoff,

        /// <summary>
        /// A notice arrived while this poll was looking for work, so it looks again instead of sleeping.
        /// </summary>
        Pending,

        /// <summary>
        /// Every waiting poll was woken: the backplane may have dropped messages, a replica that predates targeted
        /// wakeups sent the notice, or Scheduling.QueueWakeFanout is 0.
        /// </summary>
        Broadcast,

        /// <summary>
        /// The fallback poll interval passed without a notice.
        /// </summary>
        Poll
    }
}
