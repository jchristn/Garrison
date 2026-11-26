namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// The author's judgment of the health of its work (AA5).
    /// </summary>
    public enum ReportHealthEnum
    {
        /// <summary>
        /// On track.
        /// </summary>
        Healthy,

        /// <summary>
        /// Continuing with problems that need watching.
        /// </summary>
        Degraded,

        /// <summary>
        /// Failing. Endpoints subscribed to ReportUnhealthy are notified.
        /// </summary>
        Unhealthy,

        /// <summary>
        /// The author cannot tell.
        /// </summary>
        Unknown
    }
}
