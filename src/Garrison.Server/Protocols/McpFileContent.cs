namespace Garrison.Server.Protocols
{
    using System;

    /// <summary>One file version as garrison_files_read returns it (AD3.5).</summary>
    public class McpFileContent
    {
        /// <summary>Path.</summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>Version number.</summary>
        public int Version { get; set; } = 0;

        /// <summary>SHA-256.</summary>
        public string Sha256 { get; set; } = String.Empty;

        /// <summary>Media type.</summary>
        public string MediaType { get; set; } = String.Empty;

        /// <summary>Size in bytes.</summary>
        public long SizeBytes { get; set; } = 0;

        /// <summary>Text content, for text media types.</summary>
        public string? Content { get; set; } = null;

        /// <summary>Binary content as base64, for other media types.</summary>
        public string? ContentBase64 { get; set; } = null;
    }
}
