namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// An exported manifest bundle (P12.21): the YAML text and what it needs from the target tenant.
    /// </summary>
    public class ManifestExportResult
    {
        #region Public-Members

        /// <summary>
        /// Multi-document YAML, starting with header comments and a Bundle document. Never null.
        /// </summary>
        public string Yaml
        {
            get
            {
                return _Yaml;
            }
            set
            {
                _Yaml = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Resource documents in the bundle, not counting the Bundle document.
        /// </summary>
        public int DocumentCount { get; set; } = 0;

        /// <summary>
        /// Requirements written to the Bundle document. Never null.
        /// </summary>
        public BundleSpec Bundle
        {
            get
            {
                return _Bundle;
            }
            set
            {
                _Bundle = value ?? new BundleSpec();
            }
        }

        #endregion

        #region Private-Members

        private string _Yaml = String.Empty;
        private BundleSpec _Bundle = new BundleSpec();

        #endregion
    }
}
