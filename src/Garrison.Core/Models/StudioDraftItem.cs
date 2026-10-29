namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One manifest document of a studio draft (AD7.1, AD-018), keyed by kind and name. The document text is
    /// user-authored YAML, kept as text like prompt template content.
    /// </summary>
    public class StudioDraftItem
    {
        /// <summary>
        /// Manifest kind, for example Agent, Deployment, AgenticApp.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Record name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Upsert or Delete.
        /// </summary>
        public StudioDraftOperationEnum Operation { get; set; } = StudioDraftOperationEnum.Upsert;

        /// <summary>
        /// The manifest document (YAML) for Upsert; empty for Delete.
        /// </summary>
        public string Document { get; set; } = String.Empty;

        /// <summary>
        /// SHA-256 of the live record's exported document when the item was based on it, or null for a new record. Apply
        /// refuses with DraftStale when live configuration moved since.
        /// </summary>
        public string? BaseHash { get; set; } = null;

        /// <summary>
        /// Last change (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;
    }
}
