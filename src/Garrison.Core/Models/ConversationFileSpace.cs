namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A file area shared by every turn of one conversation and every run in its delegation trees (AD3, AD-014). A
    /// pipeline run's stages share their pipeline run's space, and a root run without a conversation or pipeline owns
    /// its own space. Content lives under the reserved .garrison-files/ prefix of the owner's deployment artifact store,
    /// or in the Garrison database. File spaces are not artifacts.
    /// </summary>
    public class ConversationFileSpace
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix cfs_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewFileSpaceId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Owner key, unique per tenant: cnv:{conversationId}, plr:{pipelineRunId}, or run:{rootRunId}.
        /// </summary>
        public string OwnerKey { get; set; } = String.Empty;

        /// <summary>
        /// Conversation that owns the space, or null.
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// Pipeline run that owns the space, or null.
        /// </summary>
        public string? PipelineRunId { get; set; } = null;

        /// <summary>
        /// Root run that owns the space when there is no conversation or pipeline run, or null.
        /// </summary>
        public string? RootRunId { get; set; } = null;

        /// <summary>
        /// Artifact store holding the content, or null for the Garrison database. Taken from the owner's deployment when
        /// the space is created.
        /// </summary>
        public string? ArtifactStoreId { get; set; } = null;

        /// <summary>
        /// Number of files that are not deleted.
        /// </summary>
        public int FileCount { get; set; } = 0;

        /// <summary>
        /// Bytes of the current versions of files that are not deleted.
        /// </summary>
        public long TotalBytes { get; set; } = 0;

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

        private string _Id = IdGenerator.NewFileSpaceId();

        #endregion
    }
}
