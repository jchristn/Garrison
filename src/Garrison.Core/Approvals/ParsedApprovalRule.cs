namespace Garrison.Core.Approvals
{
    using System;

    /// <summary>
    /// An approval rule pattern split into its tool part and specifier (P12.3).
    /// </summary>
    public class ParsedApprovalRule
    {
        #region Public-Members

        /// <summary>
        /// Canonical form of the pattern, for example <c>Bash(git status:*)</c>.
        /// </summary>
        public string Raw { get; set; } = String.Empty;

        /// <summary>
        /// Tool part, for example <c>Bash</c>, <c>mcp__github__create_issue</c>, or <c>mcp__github__*</c>.
        /// </summary>
        public string Tool { get; set; } = String.Empty;

        /// <summary>
        /// Text inside the parentheses, trimmed, or null when the rule names only a tool (or uses <c>Tool(*)</c>).
        /// </summary>
        public string? Specifier { get; set; } = null;

        #endregion
    }
}
