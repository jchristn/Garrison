namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// An immutable version of a conversation file. Not thread-safe.
    /// </summary>
    public class ConversationFileVersion
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
        /// Conversation file identifier.
        /// </summary>
        public string FileId
        {
            get
            {
                return _FileId;
            }
            set
            {
                _FileId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Version number, starting at 1.
        /// </summary>
        public int Number { get; set; } = 0;

        /// <summary>
        /// Size, in bytes.
        /// </summary>
        public long SizeBytes { get; set; } = 0;

        /// <summary>
        /// Lowercase hex SHA-256, or null.
        /// </summary>
        public string? Sha256 { get; set; } = null;

        /// <summary>
        /// Media type, or null when unknown.
        /// </summary>
        public string? MediaType { get; set; } = null;

        /// <summary>
        /// Run that wrote the version, or null when written through the API.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Lease epoch of the writing run; 0 when written through the API.
        /// </summary>
        public long LeaseEpoch { get; set; } = 0;

        /// <summary>
        /// Who wrote the version, or null.
        /// </summary>
        public string? WrittenBy { get; set; } = null;

        /// <summary>
        /// Storage key of the content, or null.
        /// </summary>
        public string? StorageKey { get; set; } = null;

        /// <summary>
        /// Creation timestamp, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _FileId = String.Empty;

        #endregion
    }
}
