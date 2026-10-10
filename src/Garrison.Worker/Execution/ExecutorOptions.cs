namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Options for <see cref="ProcessRunExecutor"/>.
    /// </summary>
    public class ExecutorOptions
    {
        #region Public-Members

        /// <summary>
        /// Root directory for per-run directories.
        /// </summary>
        public string WorkRoot { get; set; } = "workspaces";

        /// <summary>
        /// Variables copied from the worker environment into every harness process.
        /// </summary>
        public List<string> EnvironmentAllowlist { get; set; } = new List<string> { "PATH", "LANG", "TZ", "DOTNET_ROOT" };

        /// <summary>
        /// MCP pre-flight timeout per server in milliseconds. Minimum 1000, maximum 300000, default 20000.
        /// </summary>
        public int McpPreflightTimeoutMs
        {
            get
            {
                return _McpPreflightTimeoutMs;
            }
            set
            {
                _McpPreflightTimeoutMs = Math.Clamp(value, 1000, 300000);
            }
        }

        #endregion

        #region Private-Members

        private int _McpPreflightTimeoutMs = 20000;

        #endregion
    }
}
