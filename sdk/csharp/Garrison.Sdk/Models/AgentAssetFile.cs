namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A file within an agent asset version.
    /// </summary>
    public class AgentAssetFile
    {
        #region Public-Members

        /// <summary>
        /// Relative path of the file within the asset, for example SKILL.md.
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
        /// Media type, or null to let the server infer it.
        /// </summary>
        public string? MediaType { get; set; } = null;

        /// <summary>
        /// Size in bytes.
        /// </summary>
        public long SizeBytes { get; set; } = 0;

        /// <summary>
        /// Lowercase hexadecimal SHA-256 digest of the file content.
        /// </summary>
        public string? Sha256 { get; set; } = null;

        /// <summary>
        /// Storage key assigned by the server.
        /// </summary>
        public string? StorageKey { get; set; } = null;

        /// <summary>
        /// Base64 file content; set only when uploading.
        /// </summary>
        public string? ContentBase64 { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Path = String.Empty;

        #endregion
    }
}
