namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// An immutable version of an agent asset.
    /// </summary>
    public class AgentAssetVersion
    {
        #region Public-Members

        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

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
        /// Version number, starting at 1.
        /// </summary>
        public int Number { get; set; } = 0;

        /// <summary>
        /// Total size of all files, in bytes.
        /// </summary>
        public long TotalBytes { get; set; } = 0;

        /// <summary>
        /// Author display name.
        /// </summary>
        public string? AuthorName { get; set; } = null;

        /// <summary>
        /// Change note.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>
        /// Files in this version.
        /// </summary>
        public List<AgentAssetFile> Files
        {
            get
            {
                return _Files;
            }
            set
            {
                _Files = value ?? new List<AgentAssetFile>();
            }
        }

        /// <summary>
        /// Creation timestamp, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _AssetId = String.Empty;
        private List<AgentAssetFile> _Files = new List<AgentAssetFile>();

        #endregion
    }
}
