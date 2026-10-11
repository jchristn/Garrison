namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One measurement captured by <see cref="MetricCapture"/>.
    /// </summary>
    public class CapturedMeasurement
    {
        /// <summary>
        /// Instrument name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Value.
        /// </summary>
        public double Value { get; set; } = 0;

        /// <summary>
        /// Tags by key.
        /// </summary>
        public Dictionary<string, string> Tags { get; set; } = new Dictionary<string, string>(StringComparer.Ordinal);

        /// <summary>
        /// Tag value, or null.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>Value or null.</returns>
        public string? Tag(string key)
        {
            return Tags.TryGetValue(key, out string? value) ? value : null;
        }
    }
}
