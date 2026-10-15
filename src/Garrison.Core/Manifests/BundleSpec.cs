namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Spec of a <c>Bundle</c> manifest document (P12.21). An exported bundle starts with one; applying it writes nothing
    /// and checks that what the bundle needs from the target tenant exists, so a missing secret fails clearly with a
    /// field code before anything is written.
    /// </summary>
    public class BundleSpec
    {
        #region Public-Members

        /// <summary>
        /// When the bundle was exported (UTC), or null.
        /// </summary>
        public DateTime? ExportedUtc { get; set; } = null;

        /// <summary>
        /// Free text.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Secrets that must exist in the target tenant (or be defined in the same manifest). Never null.
        /// </summary>
        public List<BundleSecretRequirement> RequiredSecrets
        {
            get
            {
                return _RequiredSecrets;
            }
            set
            {
                _RequiredSecrets = value ?? new List<BundleSecretRequirement>();
            }
        }

        /// <summary>
        /// Artifact stores (by name) that must exist in the target tenant. Never null.
        /// </summary>
        public List<string> RequiredArtifactStores
        {
            get
            {
                return _RequiredArtifactStores;
            }
            set
            {
                _RequiredArtifactStores = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Built-in prompt templates and harness profiles the bundle references. Never null.
        /// </summary>
        public List<ManifestResourceReference> RequiredBuiltIns
        {
            get
            {
                return _RequiredBuiltIns;
            }
            set
            {
                _RequiredBuiltIns = value ?? new List<ManifestResourceReference>();
            }
        }

        #endregion

        #region Private-Members

        private List<BundleSecretRequirement> _RequiredSecrets = new List<BundleSecretRequirement>();
        private List<string> _RequiredArtifactStores = new List<string>();
        private List<ManifestResourceReference> _RequiredBuiltIns = new List<ManifestResourceReference>();

        #endregion
    }
}
