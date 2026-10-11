namespace Garrison.Benchmark.Datasets
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Specification of the generated ingest-at-scale corpus: a fictional fleet of agents, deployments, and shared prompt templates, with Zipf-distributed template popularity.
    /// </summary>
    public class IngestScaleSpec
    {
        /// <summary>
        /// Corpus identifier.
        /// </summary>
        public string CorpusId { get; set; } = "fleet";

        /// <summary>
        /// Agents (each with one deployment). Default 200, minimum 1, maximum 100000.
        /// </summary>
        public int Agents { get; set; } = 200;

        /// <summary>
        /// Shared Task prompt templates. Default 40, minimum 1, maximum 10000.
        /// </summary>
        public int Templates { get; set; } = 40;

        /// <summary>
        /// Zipf exponent of template popularity. Default 1.1.
        /// </summary>
        public double ZipfExponent { get; set; } = 1.1;

        /// <summary>
        /// Generator seed. Default 20261011.
        /// </summary>
        public int Seed { get; set; } = 20261011;

        /// <summary>
        /// Words that make up fictional names and descriptions.
        /// </summary>
        public List<string> Words { get; set; } = new List<string>();

        /// <summary>
        /// Worker lanes deployments are pinned to by node selector.
        /// </summary>
        public List<string> Lanes { get; set; } = new List<string>();

        /// <summary>
        /// Probes of the generated corpus.
        /// </summary>
        public List<BenchmarkProbe> Probes { get; set; } = new List<BenchmarkProbe>();
    }
}
