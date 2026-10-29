namespace Garrison.Core.Manifests
{
    using System;

    /// <summary>
    /// One file of an AgentAsset manifest document (AD2.6): inline text, inline base64, or a reference to content the
    /// target tenant already holds (sha256 only).
    /// </summary>
    public class AgentAssetFileSpec
    {
        /// <summary>
        /// Path inside the asset.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Media type; guessed from the extension when omitted.
        /// </summary>
        public string? MediaType { get; set; } = null;

        /// <summary>
        /// Inline text content (UTF-8). Exports use it for text files up to 256 KiB.
        /// </summary>
        public string? Content { get; set; } = null;

        /// <summary>
        /// Inline binary content as base64.
        /// </summary>
        public string? ContentBase64 { get; set; } = null;

        /// <summary>
        /// SHA-256 of content that is not inline. Exports use it for binary files; applying such a document needs the
        /// asset's current version in the target tenant to hold the same content (AssetContentMissing otherwise).
        /// </summary>
        public string? Sha256 { get; set; } = null;

        /// <summary>
        /// Size in bytes of content that is not inline. Informational.
        /// </summary>
        public long? SizeBytes { get; set; } = null;

        /// <summary>
        /// Export note on a file exported by reference. Ignored on apply.
        /// </summary>
        public string? Note { get; set; } = null;
    }
}
