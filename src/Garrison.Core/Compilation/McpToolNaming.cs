namespace Garrison.Core.Compilation
{
    using System;
    using System.Text.RegularExpressions;

    /// <summary>
    /// How a harness names MCP tools to its model. A harness profile's <c>mcpToolNamePrefix</c> is the text the harness puts
    /// in front of each MCP tool name, with <c>{server}</c> standing for the server name: Claude Code shows Garrison's
    /// <c>garrison_get_run</c> as <c>mcp__garrison__garrison_get_run</c>, Mux as <c>garrison.garrison_get_run</c>. Thread-safe.
    /// </summary>
    public static class McpToolNaming
    {
        #region Public-Members

        /// <summary>
        /// The placeholder for the MCP server name in a prefix pattern.
        /// </summary>
        public static readonly string ServerPlaceholder = "{server}";

        /// <summary>
        /// Maximum length of a prefix pattern, in characters.
        /// </summary>
        public static readonly int MaxPatternLength = 128;

        /// <summary>
        /// Prompt role of the tool names fragment. A deployment binding for this role replaces the tenant and built-in
        /// templates for that deployment.
        /// </summary>
        public static readonly string Role = "McpToolNames";

        /// <summary>
        /// Override name of the fragment: mcp-tool-names (built-in builtin/mcp-tool-names, kind Fragment). The compiler adds
        /// it to the system prompt of a run whose harness profile sets a prefix and that carries the Garrison MCP server.
        /// </summary>
        public static readonly string TemplateName = "mcp-tool-names";

        #endregion

        #region Private-Members

        private static readonly Regex _Allowed = new Regex("^[A-Za-z0-9_.:-]*$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

        #endregion

        #region Public-Methods

        /// <summary>
        /// Check a prefix pattern.
        /// </summary>
        /// <param name="pattern">Pattern; null or empty is valid and means no prefix.</param>
        /// <returns>An error message, or null when the pattern is valid.</returns>
        public static string? Validate(string? pattern)
        {
            if (String.IsNullOrEmpty(pattern)) return null;
            if (pattern.Length > MaxPatternLength) return "The MCP tool name prefix may be at most " + MaxPatternLength + " characters.";
            string literal = pattern.Replace(ServerPlaceholder, String.Empty, StringComparison.Ordinal);
            if (!_Allowed.IsMatch(literal)) return "The MCP tool name prefix may contain only letters, digits, '_', '-', '.', ':', and the {server} placeholder.";
            return null;
        }

        /// <summary>
        /// Render the prefix a harness puts in front of a server's tool names.
        /// </summary>
        /// <param name="pattern">Prefix pattern from the harness profile; null or empty renders an empty prefix.</param>
        /// <param name="serverName">MCP server name.</param>
        /// <returns>The prefix, or an empty string when the harness shows tool names unchanged.</returns>
        /// <exception cref="ArgumentNullException">Thrown when serverName is null.</exception>
        public static string Prefix(string? pattern, string serverName)
        {
            if (serverName == null) throw new ArgumentNullException(nameof(serverName));
            if (String.IsNullOrEmpty(pattern)) return String.Empty;
            return pattern.Replace(ServerPlaceholder, serverName, StringComparison.Ordinal);
        }

        /// <summary>
        /// The name a harness shows for a server's tool.
        /// </summary>
        /// <param name="pattern">Prefix pattern from the harness profile.</param>
        /// <param name="serverName">MCP server name.</param>
        /// <param name="toolName">The tool's name on the MCP server.</param>
        /// <returns>The name the model sees.</returns>
        /// <exception cref="ArgumentNullException">Thrown when serverName or toolName is null.</exception>
        public static string ToolName(string? pattern, string serverName, string toolName)
        {
            if (toolName == null) throw new ArgumentNullException(nameof(toolName));
            return Prefix(pattern, serverName) + toolName;
        }

        #endregion
    }
}
