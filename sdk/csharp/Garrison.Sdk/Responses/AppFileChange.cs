namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// One changed file in a files.changed event of an app conversation. Not thread-safe.
    /// </summary>
    public class AppFileChange
    {
        /// <summary>
        /// File path inside the conversation's file space. Never null.
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
        /// Current version number.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// True when the file was deleted.
        /// </summary>
        public bool Deleted { get; set; } = false;

        /// <summary>
        /// SHA-256 of the current version, or null.
        /// </summary>
        public string? Sha256 { get; set; } = null;

        /// <summary>
        /// Size of the current version in bytes.
        /// </summary>
        public long SizeBytes { get; set; } = 0;

        private string _Path = String.Empty;
    }
}
