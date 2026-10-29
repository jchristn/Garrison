namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Whether a capability's cost and latency hints are computed from enough runs.
    /// </summary>
    public enum CapabilityHintStatusEnum
    {
        /// <summary>
        /// Not enough recent runs to compute hints.
        /// </summary>
        Unknown,

        /// <summary>
        /// Hints are computed from recent runs.
        /// </summary>
        Known
    }
}
