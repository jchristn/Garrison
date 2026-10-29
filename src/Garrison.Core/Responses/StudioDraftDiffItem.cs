namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// What applying one draft item would do to live configuration (AD7.2).
    /// </summary>
    public class StudioDraftDiffItem
    {
        /// <summary>
        /// Kind.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Create, Update, Delete, Unchanged, or Failed.
        /// </summary>
        public string Change { get; set; } = "Unchanged";

        /// <summary>
        /// Field changes of an Update, as the manifest dry run reports them.
        /// </summary>
        public List<ManifestFieldChange> Changes { get; set; } = new List<ManifestFieldChange>();

        /// <summary>
        /// Why the item failed validation, or a note, or null.
        /// </summary>
        public string? Message { get; set; } = null;

        /// <summary>
        /// Error code of a failed item, or null.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// Whether the live record changed since the item was based on it.
        /// </summary>
        public bool Stale { get; set; } = false;
    }
}
