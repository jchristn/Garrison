namespace Garrison.Core.Manifests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A secret a manifest bundle needs in the target tenant (P12.21). Bundles never carry secret values; the secret must
    /// exist before the bundle is applied.
    /// </summary>
    public class BundleSecretRequirement
    {
        #region Public-Members

        /// <summary>
        /// Secret name. Never null.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Secret kind in the source tenant, as a hint for whoever creates it, or null when unknown.
        /// </summary>
        public SecretKindEnum? Kind { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Name = String.Empty;

        #endregion
    }
}
