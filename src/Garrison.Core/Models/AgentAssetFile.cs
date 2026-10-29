namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// One file of an agent asset version (AD2).
    /// </summary>
    public class AgentAssetFile
    {
        #region Public-Members

        /// <summary>
        /// Path inside the asset, relative, with forward slashes, for example SKILL.md or templates/report.docx. No
        /// leading slash, no backslash, no "." or ".." segments; at most 512 characters.
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
        /// Media type, for example text/markdown. On upload, an empty value is guessed from the file extension, falling
        /// back to application/octet-stream.
        /// </summary>
        public string MediaType { get; set; } = String.Empty;

        /// <summary>
        /// Size in bytes.
        /// </summary>
        public long SizeBytes { get; set; } = 0;

        /// <summary>
        /// SHA-256 of the content, lowercase hex.
        /// </summary>
        public string Sha256 { get; set; } = String.Empty;

        /// <summary>
        /// Storage key inside the asset's store, under the reserved .garrison-assets/ prefix. Set by the server; never
        /// accepted from clients.
        /// </summary>
        public string StorageKey { get; set; } = String.Empty;

        /// <summary>
        /// Content as base64, only on upload requests and never returned in responses.
        /// </summary>
        public string? ContentBase64 { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Path = String.Empty;

        #endregion
    }
}
