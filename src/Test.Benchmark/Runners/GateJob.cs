namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One command the CI gate runs.
    /// </summary>
    public class GateJob
    {
        /// <summary>
        /// Report kind.
        /// </summary>
        public string Kind { get; }

        /// <summary>
        /// Dataset name.
        /// </summary>
        public string Dataset { get; }

        /// <summary>
        /// Command and options.
        /// </summary>
        public List<string> Arguments { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="kind">Report kind.</param>
        /// <param name="dataset">Dataset name.</param>
        /// <param name="arguments">Command and options.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public GateJob(string kind, string dataset, List<string> arguments)
        {
            Kind = kind ?? throw new ArgumentNullException(nameof(kind));
            Dataset = dataset ?? throw new ArgumentNullException(nameof(dataset));
            Arguments = arguments ?? throw new ArgumentNullException(nameof(arguments));
        }
    }
}
