namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// Result of writing a file to a file space. Not thread-safe.
    /// </summary>
    public class FileSpaceUploadResult
    {
        #region Public-Members

        /// <summary>
        /// Path the caller asked to write.
        /// </summary>
        public string RequestedPath
        {
            get
            {
                return _RequestedPath;
            }
            set
            {
                _RequestedPath = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Path actually written; differs from RequestedPath when Conflict is true.
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
        /// Version number written.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// True when baseVersion was stale and the content was written under a conflict name.
        /// </summary>
        public bool Conflict { get; set; } = false;

        /// <summary>
        /// Lowercase hex SHA-256 of the written content, or null.
        /// </summary>
        public string? Sha256 { get; set; } = null;

        #endregion

        #region Private-Members

        private string _RequestedPath = String.Empty;
        private string _Path = String.Empty;

        #endregion
    }
}
