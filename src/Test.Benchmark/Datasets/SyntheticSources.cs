namespace Garrison.Benchmark.Datasets
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Committed sources of the synthetic dataset (benchmarks/datasets/synthetic/sources.json): hand-written corpora copied as they are, plus the specification of the generated ingest-at-scale corpus.
    /// </summary>
    public class SyntheticSources
    {
        /// <summary>
        /// Dataset name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Hand-written corpora.
        /// </summary>
        public List<BenchmarkCorpus> Corpora { get; set; } = new List<BenchmarkCorpus>();

        /// <summary>
        /// Generated ingest corpus.
        /// </summary>
        public IngestScaleSpec IngestScale { get; set; } = new IngestScaleSpec();
    }
}
