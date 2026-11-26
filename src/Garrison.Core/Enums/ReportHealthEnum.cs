namespace Garrison.Core.Enums
{
    /// <summary>
    /// The author's judgment of the health of its work when it filed a report (AA5).
    /// </summary>
    public enum ReportHealthEnum
    {
        /// <summary>
        /// The work is on track.
        /// </summary>
        Healthy,

        /// <summary>
        /// The work continues with problems that need watching.
        /// </summary>
        Degraded,

        /// <summary>
        /// The work is failing. Notification endpoints subscribed to ReportUnhealthy are notified.
        /// </summary>
        Unhealthy,

        /// <summary>
        /// The author cannot tell. Default.
        /// </summary>
        Unknown
    }
}
