namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// An asset an agent revision uses (AD2), optionally pinned to one version.
    /// </summary>
    public class AgentRevisionAssetPin
    {
        #region Public-Members

        /// <summary>
        /// Asset identifier.
        /// </summary>
        public string AssetId
        {
            get
            {
                return _AssetId;
            }
            set
            {
                _AssetId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pinned version, or null to use the asset's current version at compile time. For a SystemPrompt asset this is
        /// a version of its prompt template.
        /// </summary>
        public int? Version { get; set; } = null;

        #endregion

        #region Private-Members

        private string _AssetId = String.Empty;

        #endregion
    }
}
