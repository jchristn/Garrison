namespace Garrison.Benchmark.Datasets
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Committed recipe of the live dataset (benchmarks/datasets/live/sources.json): which repository files make up the snapshot, the substitutions the bootstrap Job would make, and the probes.
    /// </summary>
    public class LiveSources
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
        /// Snapshot date (yyyy-MM-dd).
        /// </summary>
        public string SnapshotDate { get; set; } = String.Empty;

        /// <summary>
        /// Manifest files, relative to the repository root.
        /// </summary>
        public List<string> Files { get; set; } = new List<string>();

        /// <summary>
        /// Placeholder replacements, as the bootstrap Job makes them.
        /// </summary>
        public Dictionary<string, string> Substitutions { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Lines containing any of these are removed (optional placeholders the bootstrap deletes).
        /// </summary>
        public List<string> DropLinesContaining { get; set; } = new List<string>();

        /// <summary>
        /// Documents the bootstrap creates outside the manifests (for example secret declarations).
        /// </summary>
        public List<BenchmarkItem> ExtraItems { get; set; } = new List<BenchmarkItem>();

        /// <summary>
        /// Corpora; each receives every snapshot item and keeps its own probes.
        /// </summary>
        public List<BenchmarkCorpus> Corpora { get; set; } = new List<BenchmarkCorpus>();
    }
}
