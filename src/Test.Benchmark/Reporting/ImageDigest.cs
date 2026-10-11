namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Image of one container in the bench stack, by digest.
    /// </summary>
    public class ImageDigest
    {
        /// <summary>
        /// Pod name.
        /// </summary>
        public string Pod { get; set; } = String.Empty;

        /// <summary>
        /// Container name.
        /// </summary>
        public string Container { get; set; } = String.Empty;

        /// <summary>
        /// Image reference as deployed.
        /// </summary>
        public string Image { get; set; } = String.Empty;

        /// <summary>
        /// Image identifier (digest) the container runs.
        /// </summary>
        public string ImageId { get; set; } = String.Empty;
    }
}
