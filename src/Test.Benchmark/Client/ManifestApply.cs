namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Result of a manifest apply (REST_API.md, ManifestApply).
    /// </summary>
    public class ManifestApply
    {
        /// <summary>
        /// Identifier.
        /// </summary>
        public string? Id { get; set; }

        /// <summary>
        /// Whether the apply was a dry run.
        /// </summary>
        public bool DryRun { get; set; }

        /// <summary>
        /// Documents submitted.
        /// </summary>
        public int DocumentCount { get; set; }

        /// <summary>
        /// Documents created.
        /// </summary>
        public int CreatedCount { get; set; }

        /// <summary>
        /// Documents updated.
        /// </summary>
        public int UpdatedCount { get; set; }

        /// <summary>
        /// Documents unchanged.
        /// </summary>
        public int UnchangedCount { get; set; }

        /// <summary>
        /// Documents failed.
        /// </summary>
        public int FailedCount { get; set; }

        /// <summary>
        /// Per-document results.
        /// </summary>
        public List<ManifestApplyItem> Items { get; set; } = new List<ManifestApplyItem>();
    }
}
