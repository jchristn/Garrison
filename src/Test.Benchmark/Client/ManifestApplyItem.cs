namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Per-document result of a manifest apply.
    /// </summary>
    public class ManifestApplyItem
    {
        /// <summary>
        /// Zero-based position in the submitted manifest.
        /// </summary>
        public int Position { get; set; }

        /// <summary>
        /// Document kind.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Document name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Result: Created, Updated, Unchanged, Validated, or Failed.
        /// </summary>
        public string? Result { get; set; }

        /// <summary>
        /// What the apply does or would do.
        /// </summary>
        public string? PlannedResult { get; set; }

        /// <summary>
        /// Resulting resource identifier.
        /// </summary>
        public string? ResourceId { get; set; }

        /// <summary>
        /// Message.
        /// </summary>
        public string? Message { get; set; }
    }
}
