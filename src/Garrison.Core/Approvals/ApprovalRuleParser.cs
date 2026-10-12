namespace Garrison.Core.Approvals
{
    using System;
    using System.Text.RegularExpressions;

    /// <summary>
    /// Parses approval rule patterns written in Claude Code's rule syntax (P12.3, D-025): <c>Tool</c>,
    /// <c>Tool(specifier)</c>, or <c>mcp__server__*</c>. Thread-safe (stateless).
    /// </summary>
    public static class ApprovalRuleParser
    {
        #region Public-Members

        /// <summary>
        /// Maximum pattern length in characters: 1000.
        /// </summary>
        public static int MaxPatternLength
        {
            get
            {
                return _MaxPatternLength;
            }
        }

        #endregion

        #region Private-Members

        private static readonly int _MaxPatternLength = 1000;
        private static readonly Regex _ToolName = new Regex("^[A-Za-z][A-Za-z0-9_.-]*(?:__\\*)?$", RegexOptions.CultureInvariant, TimeSpan.FromSeconds(1));

        #endregion

        #region Public-Methods

        /// <summary>
        /// Parse a pattern.
        /// </summary>
        /// <param name="pattern">Pattern.</param>
        /// <param name="rule">Parsed rule, or null when the pattern is invalid.</param>
        /// <param name="error">Why the pattern is invalid, or null.</param>
        /// <returns>True when the pattern is valid.</returns>
        public static bool TryParse(string? pattern, out ParsedApprovalRule? rule, out string? error)
        {
            rule = null;
            error = null;
            string text = (pattern ?? String.Empty).Trim();
            if (text.Length == 0)
            {
                error = "The pattern is empty.";
                return false;
            }
            if (text.Length > _MaxPatternLength)
            {
                error = "The pattern is longer than " + _MaxPatternLength + " characters.";
                return false;
            }
            if (text.Contains('\n') || text.Contains('\r'))
            {
                error = "The pattern must be one line.";
                return false;
            }

            string tool = text;
            string? specifier = null;
            int open = text.IndexOf('(');
            if (open >= 0)
            {
                if (!text.EndsWith(")", StringComparison.Ordinal))
                {
                    error = "A pattern with a specifier must end with ')', for example Bash(git status:*).";
                    return false;
                }
                tool = text.Substring(0, open).Trim();
                specifier = text.Substring(open + 1, text.Length - open - 2).Trim();
                if (specifier.Length == 0)
                {
                    error = "The specifier in parentheses is empty; write the tool name alone to match every call.";
                    return false;
                }
                if (specifier == "*") specifier = null;
            }

            if (!_ToolName.IsMatch(tool))
            {
                error = "'" + tool + "' is not a tool name. Use a name such as Bash, Edit, WebFetch, or mcp__server__tool.";
                return false;
            }
            if (tool.EndsWith("__*", StringComparison.Ordinal))
            {
                if (!tool.StartsWith("mcp__", StringComparison.Ordinal))
                {
                    error = "A trailing __* wildcard is only valid for MCP tools (mcp__server__*).";
                    return false;
                }
                if (specifier != null)
                {
                    error = "An MCP server wildcard (mcp__server__*) cannot have a specifier.";
                    return false;
                }
            }

            rule = new ParsedApprovalRule();
            rule.Tool = tool;
            rule.Specifier = specifier;
            rule.Raw = specifier == null ? tool : tool + "(" + specifier + ")";
            return true;
        }

        #endregion
    }
}
