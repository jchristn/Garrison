namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One version of a conversation file (AD3): its content hash, size, and who wrote it.
    /// </summary>
    public class ConversationFileVersion
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix cfv_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewFileSpaceVersionId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// File identifier.
        /// </summary>
        public string FileId { get; set; } = String.Empty;

        /// <summary>
        /// Version number, per file, starting at 1.
        /// </summary>
        public int Number { get; set; } = 1;

        /// <summary>
        /// Size in bytes.
        /// </summary>
        public long SizeBytes { get; set; } = 0;

        /// <summary>
        /// SHA-256, lowercase hex.
        /// </summary>
        public string Sha256 { get; set; } = String.Empty;

        /// <summary>
        /// Media type.
        /// </summary>
        public string MediaType { get; set; } = "application/octet-stream";

        /// <summary>
        /// Run that wrote the version, or null for a user upload.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Lease epoch of the run when it wrote the version, or null for a user upload.
        /// </summary>
        public long? LeaseEpoch { get; set; } = null;

        /// <summary>
        /// Display name of the writer (user, credential, or agent name).
        /// </summary>
        public string? WrittenBy { get; set; } = null;

        /// <summary>
        /// Storage key under the reserved .garrison-files/ prefix. Set by the server.
        /// </summary>
        public string StorageKey { get; set; } = String.Empty;

        /// <summary>
        /// Creation timestamp, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewFileSpaceVersionId();

        #endregion
    }
}
