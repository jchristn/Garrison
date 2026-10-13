namespace Garrison.Core.Responses
{
    using System;

    /// <summary>Short-lived signed download link for one tenant artifact.</summary>
    public class ArtifactDownloadResponse
    {
        /// <summary>Absolute public URL with an opaque download-only ticket.</summary>
        public string Url { get; set; } = String.Empty;
        /// <summary>Ticket expiration, UTC.</summary>
        public DateTime ExpiresUtc { get; set; } = DateTime.UtcNow;
    }
}
