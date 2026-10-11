namespace Garrison.Benchmark.Datasets
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One corpus: the manifest documents loaded into one workspace and the probes run against it.
    /// </summary>
    public class BenchmarkCorpus
    {
        /// <summary>
        /// Corpus identifier, unique in the dataset.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Command whose probes these are: ingest, routing, or e2e.
        /// </summary>
        public string Command { get; set; } = String.Empty;

        /// <summary>
        /// Manifest documents loaded into the workspace, in order.
        /// </summary>
        public List<BenchmarkItem> Items { get; set; } = new List<BenchmarkItem>();

        /// <summary>
        /// Probes.
        /// </summary>
        public List<BenchmarkProbe> Probes { get; set; } = new List<BenchmarkProbe>();
    }
}
