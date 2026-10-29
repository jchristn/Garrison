namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// An agent asset pinned by an agent revision.
    /// </summary>
    public class AgentRevisionAssetPin
    {
        #region Public-Members

        /// <summary>
        /// Agent asset identifier.
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
        /// Pinned asset version, or null to follow the asset's current version.
        /// </summary>
        public int? Version { get; set; } = null;

        #endregion

        #region Private-Members

        private string _AssetId = String.Empty;

        #endregion
    }
}
