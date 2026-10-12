namespace Garrison.Core.Approvals
{
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>
    /// The fields of a tool input that approval rules look at (P12.3). Claude Code tools use command (Bash), url
    /// (WebFetch), file_path (Read, Edit, Write, MultiEdit), notebook_path (NotebookEdit), path and pattern (Glob, Grep,
    /// LS), and query (WebSearch); Codex approvals relayed by the worker use command and cwd, or paths. Unknown fields are
    /// ignored; every field may be null.
    /// </summary>
    public class ApprovalToolInput
    {
        #region Public-Members

        /// <summary>
        /// Shell command line.
        /// </summary>
        [JsonPropertyName("command")]
        public string? Command { get; set; } = null;

        /// <summary>
        /// Working directory of a command, when the harness reports one.
        /// </summary>
        [JsonPropertyName("cwd")]
        public string? Cwd { get; set; } = null;

        /// <summary>
        /// URL to fetch.
        /// </summary>
        [JsonPropertyName("url")]
        public string? Url { get; set; } = null;

        /// <summary>
        /// File path of a read or edit.
        /// </summary>
        [JsonPropertyName("file_path")]
        public string? FilePath { get; set; } = null;

        /// <summary>
        /// Notebook path of a notebook edit.
        /// </summary>
        [JsonPropertyName("notebook_path")]
        public string? NotebookPath { get; set; } = null;

        /// <summary>
        /// Directory of a search or listing.
        /// </summary>
        [JsonPropertyName("path")]
        public string? Path { get; set; } = null;

        /// <summary>
        /// Paths a file change touches (Codex file change approvals).
        /// </summary>
        [JsonPropertyName("paths")]
        public List<string>? Paths { get; set; } = null;

        /// <summary>
        /// Search pattern.
        /// </summary>
        [JsonPropertyName("pattern")]
        public string? Pattern { get; set; } = null;

        /// <summary>
        /// Search query.
        /// </summary>
        [JsonPropertyName("query")]
        public string? Query { get; set; } = null;

        #endregion
    }
}
