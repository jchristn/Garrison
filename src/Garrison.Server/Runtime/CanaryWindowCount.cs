namespace Garrison.Server.Runtime
{
    /// <summary>
    /// Candidate runs that finished during a canary step (AA9.8). Not thread-safe.
    /// </summary>
    public class CanaryWindowCount
    {
        /// <summary>
        /// Runs that succeeded, failed, or timed out. Minimum 0.
        /// </summary>
        public long Finished { get; set; } = 0;

        /// <summary>
        /// Of those, runs that failed or timed out. Minimum 0.
        /// </summary>
        public long Failed { get; set; } = 0;
    }
}
