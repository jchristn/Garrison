namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A short-lived download-only URL for a file version. The URL needs no credentials. Not thread-safe.
    /// </summary>
    public class FileDownloadUrl
    {
        #region Public-Members

        /// <summary>
        /// Absolute download URL.
        /// </summary>
        public string Url
        {
            get
            {
                return _Url;
            }
            set
            {
                _Url = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Expiry timestamp, UTC.
        /// </summary>
        public DateTime ExpiresUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Url = String.Empty;

        #endregion
    }
}
