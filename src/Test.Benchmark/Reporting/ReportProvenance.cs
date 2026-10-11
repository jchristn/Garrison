namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Everything needed to tell what produced a report and to rerun it.
    /// </summary>
    public class ReportProvenance
    {
        /// <summary>
        /// Start (UTC).
        /// </summary>
        public DateTime StartedUtc { get; set; }

        /// <summary>
        /// Finish (UTC).
        /// </summary>
        public DateTime FinishedUtc { get; set; }

        /// <summary>
        /// System under test URL. Scrubbed to the host kind in committed copies.
        /// </summary>
        public string SutUrl { get; set; } = String.Empty;

        /// <summary>
        /// Version the server reported.
        /// </summary>
        public string? SutVersion { get; set; }

        /// <summary>
        /// Stack: k3d (the isolated K3S in Docker stack), local (processes from the working tree), or external.
        /// </summary>
        public string Stack { get; set; } = String.Empty;

        /// <summary>
        /// Stack details: cluster, replicas, workers, slots.
        /// </summary>
        public string? StackDetails { get; set; }

        /// <summary>
        /// Commit of the product under test, with -dirty when the working tree has any change, including untracked files.
        /// </summary>
        public string ProductCommit { get; set; } = String.Empty;

        /// <summary>
        /// Changed or untracked paths in the product working tree.
        /// </summary>
        public int ProductDirtyFiles { get; set; }

        /// <summary>
        /// Harness version.
        /// </summary>
        public string HarnessVersion { get; set; } = String.Empty;

        /// <summary>
        /// Last commit that touched src/Test.Benchmark, with -dirty when it has uncommitted or untracked changes.
        /// </summary>
        public string HarnessCommit { get; set; } = String.Empty;

        /// <summary>
        /// Machine name.
        /// </summary>
        public string MachineName { get; set; } = String.Empty;

        /// <summary>
        /// Operating system.
        /// </summary>
        public string Os { get; set; } = String.Empty;

        /// <summary>
        /// Processor description.
        /// </summary>
        public string Cpu { get; set; } = String.Empty;

        /// <summary>
        /// Logical processors.
        /// </summary>
        public int Cores { get; set; }

        /// <summary>
        /// .NET runtime of the harness.
        /// </summary>
        public string Runtime { get; set; } = String.Empty;

        /// <summary>
        /// HTTP client settings.
        /// </summary>
        public string HttpClient { get; set; } = String.Empty;

        /// <summary>
        /// Image digests of every container in the bench stack.
        /// </summary>
        public List<ImageDigest> Images { get; set; } = new List<ImageDigest>();

        /// <summary>
        /// External models or services this run used (the fake harness needs none).
        /// </summary>
        public List<string> ExternalServices { get; set; } = new List<string>();

        /// <summary>
        /// Dataset name.
        /// </summary>
        public string DatasetName { get; set; } = String.Empty;

        /// <summary>
        /// SHA-256 of the dataset file.
        /// </summary>
        public string DatasetSha256 { get; set; } = String.Empty;

        /// <summary>
        /// Dataset path relative to the repository root.
        /// </summary>
        public string? DatasetPath { get; set; }

        /// <summary>
        /// The complete command line.
        /// </summary>
        public string CommandLine { get; set; } = String.Empty;

        /// <summary>
        /// Base seed.
        /// </summary>
        public int Seed { get; set; } = 42;

        /// <summary>
        /// What else ran on the machine during the run, from --shared-note.
        /// </summary>
        public string? SharedMachine { get; set; }
    }
}
