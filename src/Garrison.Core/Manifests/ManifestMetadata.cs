namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Manifest document metadata.
    /// </summary>
    public class ManifestMetadata
    {
        /// <summary>
        /// Resource name, unique per tenant and kind.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Optional description; overrides spec.description when present.
        /// </summary>
        public string? Description { get; set; } = null;
    }
}
