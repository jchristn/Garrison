namespace Garrison.Core.Memory
{
    using System;

    /// <summary>
    /// One agent memory file written before scopes existed (AA4.7). Only the hash of its key is known. Not thread-safe.
    /// </summary>
    public class LegacyMemoryFile
    {
        #region Public-Members

        /// <summary>
        /// Uppercase hexadecimal SHA-256 of the key.
        /// </summary>
        public string KeyHash
        {
            get
            {
                return _KeyHash;
            }
            set
            {
                _KeyHash = value ?? String.Empty;
            }
        }

        /// <summary>
        /// File size in bytes. Minimum 0.
        /// </summary>
        public long Bytes
        {
            get
            {
                return _Bytes;
            }
            set
            {
                _Bytes = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Last write time of the file (UTC).
        /// </summary>
        public DateTime LastWriteUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _KeyHash = String.Empty;
        private long _Bytes = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public LegacyMemoryFile()
        {
        }

        #endregion
    }
}
