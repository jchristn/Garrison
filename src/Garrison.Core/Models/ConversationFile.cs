namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A file in a conversation file space (AD3) with its current version. Deleting a file marks it deleted; its
    /// versions stay until the space is removed.
    /// </summary>
    public class ConversationFile
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix cff_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewFileSpaceFileId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// File space identifier.
        /// </summary>
        public string FileSpaceId { get; set; } = String.Empty;

        /// <summary>
        /// Path inside the space, relative with forward slashes, for example notes/source-1.md.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Current version number, starting at 1.
        /// </summary>
        public int CurrentVersion { get; set; } = 0;

        /// <summary>
        /// Size of the current version.
        /// </summary>
        public long SizeBytes { get; set; } = 0;

        /// <summary>
        /// SHA-256 of the current version, lowercase hex.
        /// </summary>
        public string Sha256 { get; set; } = String.Empty;

        /// <summary>
        /// Media type of the current version.
        /// </summary>
        public string MediaType { get; set; } = "application/octet-stream";

        /// <summary>
        /// Whether the file is deleted.
        /// </summary>
        public bool Deleted { get; set; } = false;

        /// <summary>
        /// Creation timestamp, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last change, UTC.
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewFileSpaceFileId();

        #endregion
    }
}
