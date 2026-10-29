namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A file in a conversation file space. Not thread-safe.
    /// </summary>
    public class ConversationFile
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
        /// File space identifier.
        /// </summary>
        public string FileSpaceId
        {
            get
            {
                return _FileSpaceId;
            }
            set
            {
                _FileSpaceId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Relative path within the file space, for example notes/a.md.
        /// </summary>
        public string Path
        {
            get
            {
                return _Path;
            }
            set
            {
                _Path = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Current version number, starting at 1.
        /// </summary>
        public int CurrentVersion { get; set; } = 0;

        /// <summary>
        /// Size of the current version, in bytes.
        /// </summary>
        public long SizeBytes { get; set; } = 0;

        /// <summary>
        /// Lowercase hex SHA-256 of the current version, or null.
        /// </summary>
        public string? Sha256 { get; set; } = null;

        /// <summary>
        /// Media type, or null when unknown.
        /// </summary>
        public string? MediaType { get; set; } = null;

        /// <summary>
        /// Whether the file is deleted. Deleted files are listed only when includeDeleted is true.
        /// </summary>
        public bool Deleted { get; set; } = false;

        /// <summary>
        /// Creation timestamp, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update timestamp, UTC.
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _FileSpaceId = String.Empty;
        private string _Path = String.Empty;

        #endregion
    }
}
