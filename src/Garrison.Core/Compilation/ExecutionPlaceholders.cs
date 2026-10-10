namespace Garrison.Core.Compilation
{
    /// <summary>
    /// Worker-side placeholders. The compiler cannot know the worker's directories, so it emits these exact tokens and
    /// the worker substitutes its per-run absolute paths in ExecutionSpec.Executable, Arguments, Environment values,
    /// Files paths and content, Stdin, and McpPreflight before launch. Substitution is plain text replacement.
    /// </summary>
    public static class ExecutionPlaceholders
    {
        /// <summary>
        /// Per-run configuration directory (system prompt file, MCP config, harness config files, result files).
        /// </summary>
        public const string ConfigDir = "$GARRISON_CONFIG_DIR";

        /// <summary>
        /// Per-run workspace directory (the harness working directory).
        /// </summary>
        public const string WorkspaceDir = "$GARRISON_WORKSPACE_DIR";

        /// <summary>
        /// Per-run home directory (HOME when the profile isolates home).
        /// </summary>
        public const string HomeDir = "$GARRISON_HOME_DIR";
    }
}
