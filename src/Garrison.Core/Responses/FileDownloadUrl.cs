namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// A short-lived, download-only URL for one file version (AD3.6).
    /// </summary>
    public class FileDownloadUrl
    {
        /// <summary>
        /// URL. It authenticates only this download.
        /// </summary>
        public string Url { get; set; } = String.Empty;

        /// <summary>
        /// When the URL stops working, UTC.
        /// </summary>
        public DateTime ExpiresUtc { get; set; } = DateTime.UtcNow;
    }
}
