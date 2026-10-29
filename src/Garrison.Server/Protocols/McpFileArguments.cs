namespace Garrison.Server.Protocols
{
    /// <summary>Typed conversation file tool arguments (AD3.5). A run token always uses its own tree's file space.</summary>
    public class McpFileArguments
    {
        /// <summary>File path inside the space, for read, write, and delete.</summary>
        public string? Path { get; set; } = null;

        /// <summary>Text content to write.</summary>
        public string? Content { get; set; } = null;

        /// <summary>Binary content to write, as base64.</summary>
        public string? ContentBase64 { get; set; } = null;

        /// <summary>Media type of a write; guessed from the extension when omitted.</summary>
        public string? MediaType { get; set; } = null;

        /// <summary>Version the writer read (0 for a new file); a stale base keeps the write under a conflict name. Omit to overwrite.</summary>
        public int? BaseVersion { get; set; } = null;

        /// <summary>Version to read; default the current version.</summary>
        public int? Version { get; set; } = null;

        /// <summary>Whether list includes deleted files.</summary>
        public bool IncludeDeleted { get; set; } = false;

        /// <summary>For users and credentials: the conversation whose space to use.</summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>For users and credentials: the run whose space to use (trees without a conversation).</summary>
        public string? RunId { get; set; } = null;
    }
}
