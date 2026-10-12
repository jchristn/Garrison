namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One permission approval rule of a deployment. The pattern uses Claude Code's rule syntax: a tool name
    /// (<c>Bash</c>, <c>Edit</c>, <c>WebFetch</c>, <c>mcp__server__tool</c>), optionally with a specifier in parentheses
    /// (<c>Bash(git status:*)</c>, <c>Bash(npm test)</c>, <c>WebFetch(domain:example.com)</c>, <c>Edit(src/**)</c>), or an
    /// MCP server wildcard (<c>mcp__github__*</c>). When several rules match a request, Deny beats Ask and Ask beats
    /// Allow; the position decides which matching rule is reported.
    /// </summary>
    public class DeploymentApprovalRule
    {
        #region Public-Members

        /// <summary>
        /// Identifier (dar_). Stable across updates; leave empty for a new rule and the server assigns one.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? String.Empty : value;
            }
        }

        /// <summary>
        /// Owning deployment identifier.
        /// </summary>
        public string DeploymentId
        {
            get
            {
                return _DeploymentId;
            }
            set
            {
                _DeploymentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// What happens when the rule matches. Default Ask.
        /// </summary>
        public ApprovalRuleActionEnum Action { get; set; } = ApprovalRuleActionEnum.Ask;

        /// <summary>
        /// Tool pattern in Claude Code rule syntax, for example <c>Bash(git status:*)</c> or <c>mcp__github__*</c>.
        /// Required; at most 1000 characters, one line.
        /// </summary>
        public string Pattern
        {
            get
            {
                return _Pattern;
            }
            set
            {
                _Pattern = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Optional .NET regular expression that must also match the tool input (the compact JSON text the harness
        /// sent) for the rule to apply. Null or empty matches any input. Evaluated with a one second timeout.
        /// </summary>
        public string? InputPattern { get; set; } = null;

        /// <summary>
        /// Optional note shown in the dashboard, for example why the rule exists or who added it.
        /// </summary>
        public string? Description { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _DeploymentId = String.Empty;
        private string _Pattern = String.Empty;

        #endregion
    }
}
