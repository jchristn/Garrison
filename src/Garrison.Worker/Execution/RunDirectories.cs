namespace Garrison.Worker.Execution
{
    using System;
    using System.IO;

    /// <summary>
    /// Per-run directory layout: &lt;WorkRoot&gt;/&lt;runId&gt;/{work,home,config}.
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

        #endregion

        #region Public-Methods

        /// <summary>
        /// Create every directory.
        /// </summary>
        public void Create()
        {
            Directory.CreateDirectory(Workspace);
            Directory.CreateDirectory(Home);
            Directory.CreateDirectory(Config);
        }

        #endregion
    }
}
