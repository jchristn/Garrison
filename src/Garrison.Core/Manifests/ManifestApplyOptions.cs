namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Options for a manifest apply.
    /// </summary>
    public class ManifestApplyOptions
    {
        /// <summary>
        /// Validate and report without writing.
        /// </summary>
        public bool DryRun { get; set; } = false;

        /// <summary>
        /// Accept secret values in Secret documents.
        /// </summary>
        public bool AllowSecretValues { get; set; } = false;

        /// <summary>
        /// Principal recorded on the apply.
        /// </summary>
        public string? PrincipalName { get; set; } = null;
    }
}
