namespace Garrison.Core.Enums
{
    /// <summary>
    /// Whether a capability's cost and latency hints are backed by enough runs (AD4.5).
    /// </summary>
    public enum CapabilityHintStatusEnum
    {
        /// <summary>
        /// Too few runs in the hint window, or a kind Garrison does not measure. The hint values are null, never zero.
        /// </summary>
        Unknown,

        /// <summary>
        /// At least Capabilities.HintMinimumSamples runs finished in the window; the values summarize them.
        /// </summary>
        Known
    }
}
