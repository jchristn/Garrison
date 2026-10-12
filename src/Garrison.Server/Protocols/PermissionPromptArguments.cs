namespace Garrison.Server.Protocols
{
    using System;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Arguments Claude Code passes to its <c>--permission-prompt-tool</c> (P12.3): the tool it wants to run and that
    /// tool's input. The input is opaque here; it is relayed as JSON text and echoed back unchanged on allow.
    /// </summary>
    public class PermissionPromptArguments
    {
        #region Public-Members

        /// <summary>
        /// Tool name, for example Bash or mcp__github__create_issue.
        /// </summary>
        [JsonPropertyName("tool_name")]
        public string? ToolName { get; set; } = null;

        /// <summary>
        /// Tool input object, passed through without interpretation.
        /// </summary>
        [JsonPropertyName("input")]
        public JsonElement? Input { get; set; } = null;

        /// <summary>
        /// Claude's tool use identifier, or null.
        /// </summary>
        [JsonPropertyName("tool_use_id")]
        public string? ToolUseId { get; set; } = null;

        /// <summary>
        /// Garrison's kind of request (Tool, Command, FileChange); set by the worker when it relays Codex app-server
        /// approvals, absent from Claude Code calls.
        /// </summary>
        [JsonPropertyName("garrison_kind")]
        public string? Kind { get; set; } = null;

        #endregion
    }
}
