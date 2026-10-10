namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Planning state for one manifest document during an apply.
    /// </summary>
    public class Planned
    {
        /// <summary>
        /// Document.
        /// </summary>
        public ManifestDocument Document { get; set; } = new ManifestDocument();

        /// <summary>
        /// Model to write.
        /// </summary>
        public object? Model { get; set; } = null;

        /// <summary>
        /// Resource identifier.
        /// </summary>
        public string? ResourceId { get; set; } = null;

        /// <summary>
        /// Planned or final result.
        /// </summary>
        public ManifestApplyResultEnum Result { get; set; } = ManifestApplyResultEnum.Validated;

        /// <summary>
        /// Message.
        /// </summary>
        public string? Message { get; set; } = null;

        /// <summary>
        /// For prompt templates, whether the content changed (a version is written).
        /// </summary>
        public bool ContentChanged { get; set; } = false;

        /// <summary>
        /// Field changes for an Updated document; empty otherwise.
        /// </summary>
        public List<ManifestFieldChange> Changes { get; set; } = new List<ManifestFieldChange>();
    }
}
