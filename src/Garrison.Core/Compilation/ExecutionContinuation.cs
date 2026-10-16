namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>Portable checkpoint settings. URLs and bearer tokens are secrets and must be redacted in previews.</summary>
    public class ExecutionContinuation
    {
        /// <summary>Pinned harness session format contract.</summary>
        public string SessionFormat { get; set; } = String.Empty;
        /// <summary>Expected saved session identity when restoring.</summary>
        public string? SessionId { get; set; } = null;
        /// <summary>Signed snapshot download URL, or null on the first execution.</summary>
        public string? DownloadUrl { get; set; } = null;
        /// <summary>Expected SHA-256 of the archive, or null on first execution.</summary>
        public string? Sha256 { get; set; } = null;
    }
}
