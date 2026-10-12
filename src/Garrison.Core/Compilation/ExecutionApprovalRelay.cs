namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// Where a worker relays permission requests a harness raises outside Garrison's MCP server (P12.3): Codex app-server
    /// command and file change approvals. The worker calls the Garrison MCP tool <see cref="ToolName"/> with the run token,
    /// the same path Claude Code takes through <c>--permission-prompt-tool</c>, so the request is fenced by the run token's
    /// lease epoch and works from run pods, which have no node credentials. Null on specs without approvals.
    /// </summary>
    public class ExecutionApprovalRelay
    {
        #region Public-Members

        /// <summary>
        /// Garrison MCP base URL as runs reach it, for example http://garrison-server:8701.
        /// </summary>
        public string McpUrl { get; set; } = String.Empty;

        /// <summary>
        /// Garrison MCP path. Default /mcp.
        /// </summary>
        public string McpPath { get; set; } = "/mcp";

        /// <summary>
        /// Run token sent as a bearer token. Secret; scrubbed from output and redacted in previews.
        /// </summary>
        public string BearerToken { get; set; } = String.Empty;

        /// <summary>
        /// MCP tool that decides permission requests. Default garrison_permission_prompt.
        /// </summary>
        public string ToolName { get; set; } = "garrison_permission_prompt";

        /// <summary>
        /// Seconds the worker waits for one decision before it declines on its own: the deployment's approval timeout
        /// plus a margin. Minimum 10, maximum 7200, default 420.
        /// </summary>
        public int TimeoutSeconds
        {
            get
            {
                return _TimeoutSeconds;
            }
            set
            {
                _TimeoutSeconds = Math.Clamp(value, 10, 7200);
            }
        }

        #endregion

        #region Private-Members

        private int _TimeoutSeconds = 420;

        #endregion
    }
}
