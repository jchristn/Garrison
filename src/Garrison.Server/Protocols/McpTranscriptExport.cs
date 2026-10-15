namespace Garrison.Server.Protocols
{
    using System;
    using Garrison.Core.Transcripts;

    /// <summary>Result of the transcript tools (P12.27): Markdown text or the typed JSON transcript.</summary>
    public class McpTranscriptExport
    {
        /// <summary>markdown or json.</summary>
        public string Format { get; set; } = "markdown";

        /// <summary>Media type of the content.</summary>
        public string MediaType { get; set; } = "text/markdown";

        /// <summary>Suggested file name.</summary>
        public string FileName { get; set; } = String.Empty;

        /// <summary>Whether the transcript was cut by the size or turn limits.</summary>
        public bool Truncated { get; set; } = false;

        /// <summary>Markdown text, for the markdown format.</summary>
        public string? Markdown { get; set; } = null;

        /// <summary>Typed transcript, for the json format.</summary>
        public Transcript? Transcript { get; set; } = null;
    }
}
