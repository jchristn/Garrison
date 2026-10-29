namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One immutable version of an agent asset (AD2): its files with their hashes. A skill is a directory, so a version
    /// can hold several files.
    /// </summary>
    public class AgentAssetVersion
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix aav_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewAgentAssetVersionId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Asset identifier.
        /// </summary>
        public string AssetId { get; set; } = String.Empty;

        /// <summary>
        /// Version number, per asset, starting at 1.
        /// </summary>
        public int Number { get; set; } = 1;

        /// <summary>
        /// Total bytes of all files.
        /// </summary>
        public long TotalBytes { get; set; } = 0;

        /// <summary>
        /// Author display name.
        /// </summary>
        public string? AuthorName { get; set; } = null;

        /// <summary>
        /// Optional change note, at most 2000 characters.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>
        /// Files, ordered by path.
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

        private string _Id = IdGenerator.NewAgentAssetVersionId();
        private List<AgentAssetFile> _Files = new List<AgentAssetFile>();

        #endregion
    }
}
