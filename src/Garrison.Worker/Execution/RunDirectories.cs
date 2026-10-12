namespace Garrison.Worker.Execution
{
    using System;
    using System.IO;
    using Garrison.Core.Compilation;

    /// <summary>
    /// Per-run directory layout: &lt;WorkRoot&gt;/&lt;runId&gt;/{work,home,config}. A conversation turn uses
    /// &lt;WorkRoot&gt;/conversations/&lt;conversationId&gt;/{work,home,config} instead, so the next turn on the same node
    /// finds the harness session where the previous turn left it.
    /// </summary>
    public class RunDirectories
    {
        #region Public-Members

        /// <summary>
        /// Run root directory.
        /// </summary>
        public string Root { get; }

        /// <summary>
        /// Workspace directory (harness working directory).
        /// </summary>
        public string Workspace { get; }

        /// <summary>
        /// Home directory used when the profile isolates HOME.
        /// </summary>
        public string Home { get; }

        /// <summary>
        /// Config directory for system prompts, MCP configuration, and result files.
        /// </summary>
        public string Config { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="workRoot">Work root.</param>
        /// <param name="runId">Run identifier.</param>
        /// <exception cref="ArgumentException">Thrown when the run identifier contains path characters.</exception>
        public RunDirectories(string workRoot, string runId)
        {
            if (String.IsNullOrEmpty(runId) || runId.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0 || runId.Contains("..", StringComparison.Ordinal))
            {
                throw new ArgumentException("Run identifier '" + runId + "' is not a safe directory name.", nameof(runId));
            }
            Root = Path.Combine(Path.GetFullPath(workRoot), runId);
            Workspace = Path.Combine(Root, "work");
            Home = Path.Combine(Root, "home");
            Config = Path.Combine(Root, "config");
        }

        /// <summary>
        /// The directories a run uses: the conversation's when the spec is a conversation turn, otherwise the run's own.
        /// </summary>
        /// <param name="workRoot">Work root.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="spec">Execution spec, or null.</param>
        /// <returns>Directories.</returns>
        /// <exception cref="ArgumentException">Thrown when the run or conversation identifier contains path characters.</exception>
        public static RunDirectories For(string workRoot, string runId, ExecutionSpec? spec)
        {
            if (spec?.Conversation != null) return new RunDirectories(ConversationsRoot(workRoot), spec.Conversation.ConversationId);
            return new RunDirectories(workRoot, runId);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Parent directory of every conversation's directories: &lt;WorkRoot&gt;/conversations.
        /// </summary>
        /// <param name="workRoot">Work root.</param>
        /// <returns>Absolute path.</returns>
        public static string ConversationsRoot(string workRoot)
        {
            return Path.Combine(Path.GetFullPath(workRoot), "conversations");
        }

        /// <summary>
        /// Create every directory.
        /// </summary>
        public void Create()
        {
            Directory.CreateDirectory(Workspace);
            Directory.CreateDirectory(Home);
            Directory.CreateDirectory(Config);
        }

        /// <summary>
        /// Whether the workspace, home, and config directories all exist.
        /// </summary>
        /// <returns>True when all three exist.</returns>
        public bool Exists()
        {
            return Directory.Exists(Workspace) && Directory.Exists(Home) && Directory.Exists(Config);
        }

        /// <summary>
        /// Mark the root as used now (its last write time), which the conversation sweep reads. Does nothing when the root
        /// does not exist.
        /// </summary>
        public void Touch()
        {
            if (Directory.Exists(Root)) Directory.SetLastWriteTimeUtc(Root, DateTime.UtcNow);
        }

        #endregion
    }
}
