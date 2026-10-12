namespace Garrison.Core.Approvals
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Text.RegularExpressions;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Evaluates a deployment's approval rules against a permission request (P12.3) with the semantics recorded in
    /// D-025, ported from Armada's matcher:
    /// <list type="bullet">
    /// <item>Deny beats Ask, and Ask beats Allow. Within one action the first matching rule in list order is reported.</item>
    /// <item>A rule without a specifier matches every call of its tool. <c>mcp__server__*</c> and <c>mcp__server</c> match
    /// every tool of that MCP server. A rule named <c>Edit</c> also covers Write, MultiEdit, and NotebookEdit; a rule named
    /// <c>Read</c> also covers Glob, Grep, and LS.</item>
    /// <item>For Bash, an allow rule must cover every simple command of the line (split on <c>;</c>, <c>&amp;&amp;</c>,
    /// <c>||</c>, <c>|</c>, <c>&amp;</c>, and new lines), and a line with command or process substitution or an open quote
    /// is never allowed by a rule. Deny and Ask rules match when any simple command, or the whole line, matches.</item>
    /// <item>Bash specifiers: <c>prefix:*</c> (the command is the prefix or starts with the prefix and a space; for Deny
    /// and Ask any command starting with the prefix), a glob with <c>*</c>, or an exact command.</item>
    /// <item><c>WebFetch(domain:host)</c> matches the URL host; <c>domain:*.host</c> matches subdomains only.</item>
    /// <item>Read and Edit specifiers are gitignore-style paths: <c>//abs/path</c> is absolute, <c>~/path</c> is under the
    /// run's home directory, anything else is relative to the run's working directory; a trailing <c>/</c> means
    /// everything below. <c>*</c> matches within one path segment and <c>**</c> across segments. Without a known working
    /// directory, relative Allow rules never match and relative Deny and Ask rules match any path ending with them.</item>
    /// <item>An optional input pattern (a regular expression over the input JSON) must also match.</item>
    /// </list>
    /// Thread-safe (stateless).
    /// </summary>
    public static class ApprovalRuleMatcher
    {
        #region Private-Members

        private static readonly HashSet<string> _EditTools = new HashSet<string>(StringComparer.Ordinal) { "Edit", "Write", "MultiEdit", "NotebookEdit" };
        private static readonly HashSet<string> _ReadTools = new HashSet<string>(StringComparer.Ordinal) { "Read", "Glob", "Grep", "LS" };
        private static readonly TimeSpan _RegexTimeout = TimeSpan.FromSeconds(1);
        private static readonly Regex _PlainWord = new Regex("^[A-Za-z0-9][A-Za-z0-9._-]*$", RegexOptions.CultureInvariant, TimeSpan.FromSeconds(1));

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether a tool name is evaluated as a shell command line (input field command).
        /// </summary>
        /// <param name="toolName">Tool name.</param>
        /// <returns>True for Bash.</returns>
        public static bool IsShellTool(string? toolName)
        {
            return String.Equals(toolName, "Bash", StringComparison.Ordinal);
        }

        /// <summary>
        /// Whether a tool name is a file tool whose specifier is a path (the Read and Edit families).
        /// </summary>
        /// <param name="toolName">Tool name.</param>
        /// <returns>True for Read, Glob, Grep, LS, Edit, Write, MultiEdit, and NotebookEdit.</returns>
        public static bool IsFileTool(string? toolName)
        {
            return toolName != null && (_EditTools.Contains(toolName) || _ReadTools.Contains(toolName));
        }

        /// <summary>
        /// Whether the tool part of a rule covers a tool name.
        /// </summary>
        /// <param name="ruleTool">Tool part of a parsed rule.</param>
        /// <param name="toolName">Requested tool name.</param>
        /// <returns>True when the rule's tool part covers the tool.</returns>
        public static bool ToolMatches(string ruleTool, string toolName)
        {
            if (String.IsNullOrEmpty(ruleTool) || String.IsNullOrEmpty(toolName)) return false;
            if (ruleTool.EndsWith("__*", StringComparison.Ordinal)) return toolName.StartsWith(ruleTool.Substring(0, ruleTool.Length - 1), StringComparison.Ordinal);
            if (ruleTool.StartsWith("mcp__", StringComparison.Ordinal))
            {
                string rest = ruleTool.Substring(5);
                if (rest.Length > 0 && !rest.Contains("__", StringComparison.Ordinal)) return toolName.StartsWith(ruleTool + "__", StringComparison.Ordinal);
                return String.Equals(ruleTool, toolName, StringComparison.Ordinal);
            }
            if (String.Equals(ruleTool, toolName, StringComparison.Ordinal)) return true;
            if (ruleTool == "Edit" && _EditTools.Contains(toolName)) return true;
            if (ruleTool == "Read" && _ReadTools.Contains(toolName)) return true;
            return false;
        }

        /// <summary>
        /// Evaluate rules against a request.
        /// </summary>
        /// <param name="rules">Rules in list order; invalid patterns are skipped.</param>
        /// <param name="toolName">Requested tool name.</param>
        /// <param name="input">Typed fields of the tool input, or null.</param>
        /// <param name="inputJson">Compact tool input JSON for input patterns, or null.</param>
        /// <param name="workingDirectory">The run's working directory for relative path rules, or null when unknown.</param>
        /// <returns>The match; Action is null when no rule applies.</returns>
        public static ApprovalRuleMatch Evaluate(IEnumerable<DeploymentApprovalRule>? rules, string toolName, ApprovalToolInput? input, string? inputJson, string? workingDirectory)
        {
            ApprovalRuleMatch match = new ApprovalRuleMatch();
            if (rules == null || String.IsNullOrEmpty(toolName)) return match;

            List<DeploymentApprovalRule> denies = new List<DeploymentApprovalRule>();
            List<DeploymentApprovalRule> asks = new List<DeploymentApprovalRule>();
            List<DeploymentApprovalRule> allows = new List<DeploymentApprovalRule>();
            Dictionary<string, ParsedApprovalRule> parsed = new Dictionary<string, ParsedApprovalRule>(StringComparer.Ordinal);
            foreach (DeploymentApprovalRule rule in rules)
            {
                if (rule == null) continue;
                if (!ApprovalRuleParser.TryParse(rule.Pattern, out ParsedApprovalRule? parsedRule, out string? _) || parsedRule == null) continue;
                if (!ToolMatches(parsedRule.Tool, toolName)) continue;
                if (!InputMatches(rule.InputPattern, inputJson, rule.Action != ApprovalRuleActionEnum.Allow)) continue;
                parsed[rule.Id] = parsedRule;
                if (rule.Action == ApprovalRuleActionEnum.Deny) denies.Add(rule);
                else if (rule.Action == ApprovalRuleActionEnum.Ask) asks.Add(rule);
                else allows.Add(rule);
            }

            bool shell = IsShellTool(toolName);
            string line = (input?.Command ?? String.Empty).Trim();
            ShellSplitResult split = shell ? ShellCommandSplitter.Split(line) : new ShellSplitResult();
            List<string> paths = Paths(input);

            foreach (DeploymentApprovalRule rule in denies)
            {
                if (BroadMatches(parsed[rule.Id], toolName, shell, line, split, input, paths, workingDirectory)) return Decided(match, ApprovalRuleActionEnum.Deny, rule);
            }
            foreach (DeploymentApprovalRule rule in asks)
            {
                if (BroadMatches(parsed[rule.Id], toolName, shell, line, split, input, paths, workingDirectory)) return Decided(match, ApprovalRuleActionEnum.Ask, rule);
            }

            DeploymentApprovalRule? bare = allows.FirstOrDefault(r => parsed[r.Id].Specifier == null);
            if (bare != null) return Decided(match, ApprovalRuleActionEnum.Allow, bare);

            if (shell)
            {
                if (split.Unbalanced || split.HasSubstitution || split.Commands.Count == 0) return match;
                DeploymentApprovalRule? first = null;
                foreach (string command in split.Commands)
                {
                    DeploymentApprovalRule? covering = allows.FirstOrDefault(r => BashSpecifierMatches(parsed[r.Id].Specifier!, command, false));
                    if (covering == null) return match;
                    if (first == null) first = covering;
                }
                return first == null ? match : Decided(match, ApprovalRuleActionEnum.Allow, first);
            }

            foreach (DeploymentApprovalRule rule in allows)
            {
                if (SpecifierMatches(parsed[rule.Id].Specifier!, toolName, input, paths, workingDirectory, false)) return Decided(match, ApprovalRuleActionEnum.Allow, rule);
            }
            return match;
        }

        /// <summary>
        /// Whether a Bash specifier covers one simple command.
        /// </summary>
        /// <param name="specifier">Specifier (the text inside Bash(...)).</param>
        /// <param name="command">Simple command.</param>
        /// <param name="broad">True for Deny and Ask rules: a prefix matches without a following space and an exact
        /// specifier also matches the command with more arguments.</param>
        /// <returns>True when covered.</returns>
        public static bool BashSpecifierMatches(string specifier, string command, bool broad)
        {
            if (specifier == null || command == null) return false;
            string cmd = command.Trim();
            string spec = specifier.Trim();
            if (spec.EndsWith(":*", StringComparison.Ordinal))
            {
                string prefix = spec.Substring(0, spec.Length - 2).TrimEnd();
                if (prefix.Length == 0) return true;
                if (broad) return cmd.StartsWith(prefix, StringComparison.Ordinal);
                return cmd == prefix || cmd.StartsWith(prefix + " ", StringComparison.Ordinal);
            }
            if (spec.Contains('*'))
            {
                return SafeIsMatch(cmd, "^" + String.Join(".*", spec.Split('*').Select(Regex.Escape)) + "$", RegexOptions.Singleline);
            }
            if (cmd == spec) return true;
            return broad && cmd.StartsWith(spec + " ", StringComparison.Ordinal);
        }

        /// <summary>
        /// Suggest a rule pattern that covers a request, for "remember as rule".
        /// </summary>
        /// <param name="toolName">Tool name.</param>
        /// <param name="input">Typed tool input, or null.</param>
        /// <param name="workingDirectory">The run's working directory, or null.</param>
        /// <returns>Pattern.</returns>
        public static string SuggestRule(string toolName, ApprovalToolInput? input, string? workingDirectory)
        {
            if (String.IsNullOrEmpty(toolName)) return String.Empty;
            if (IsShellTool(toolName))
            {
                ShellSplitResult split = ShellCommandSplitter.Split((input?.Command ?? String.Empty).Trim());
                if (split.Commands.Count == 0) return toolName;
                string[] tokens = split.Commands[0].Split(new char[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
                if (tokens.Length == 0) return toolName;
                if (tokens.Length >= 2 && !tokens[1].StartsWith("-", StringComparison.Ordinal) && SafeIsMatch(tokens[1], _PlainWord)) return toolName + "(" + tokens[0] + " " + tokens[1] + ":*)";
                return toolName + "(" + tokens[0] + ":*)";
            }
            if (toolName == "WebFetch" && Uri.TryCreate(input?.Url, UriKind.Absolute, out Uri? uri) && !String.IsNullOrEmpty(uri.Host))
            {
                return "WebFetch(domain:" + uri.Host.ToLowerInvariant() + ")";
            }
            if (IsFileTool(toolName))
            {
                string family = _EditTools.Contains(toolName) ? "Edit" : "Read";
                string? path = Paths(input).FirstOrDefault();
                if (String.IsNullOrEmpty(path)) return family;
                string target = Absolute(path, workingDirectory);
                string? cwd = NormalizePath(workingDirectory);
                if (!String.IsNullOrEmpty(cwd) && target.StartsWith(cwd.TrimEnd('/') + "/", StringComparison.Ordinal)) return family + "(" + target.Substring(cwd.TrimEnd('/').Length + 1) + ")";
                return family + "(/" + (target.StartsWith("/", StringComparison.Ordinal) ? target : "/" + target) + ")";
            }
            return toolName;
        }

        /// <summary>
        /// Whether a pattern allows every shell command (<c>Bash</c>, <c>Bash(*)</c>, or <c>Bash(:*)</c>), which is the same
        /// as no approval for the shell. Used to warn before such a rule is saved.
        /// </summary>
        /// <param name="pattern">Pattern.</param>
        /// <returns>True when the pattern covers every command.</returns>
        public static bool IsUnrestrictedShellRule(string? pattern)
        {
            if (!ApprovalRuleParser.TryParse(pattern, out ParsedApprovalRule? parsed, out string? _) || parsed == null) return false;
            if (!IsShellTool(parsed.Tool)) return false;
            if (parsed.Specifier == null) return true;
            string spec = parsed.Specifier.Trim();
            return spec == ":*" || spec.Trim('*').Length == 0;
        }

        /// <summary>
        /// Paths named by a tool input (file_path, notebook_path, path, and paths), in that order.
        /// </summary>
        /// <param name="input">Tool input, or null.</param>
        /// <returns>Paths; never null.</returns>
        public static List<string> Paths(ApprovalToolInput? input)
        {
            List<string> paths = new List<string>();
            if (input == null) return paths;
            if (!String.IsNullOrWhiteSpace(input.FilePath)) paths.Add(input.FilePath!);
            if (!String.IsNullOrWhiteSpace(input.NotebookPath)) paths.Add(input.NotebookPath!);
            if (!String.IsNullOrWhiteSpace(input.Path)) paths.Add(input.Path!);
            if (input.Paths != null) paths.AddRange(input.Paths.Where(p => !String.IsNullOrWhiteSpace(p)));
            return paths;
        }

        #endregion

        #region Private-Methods

        private static ApprovalRuleMatch Decided(ApprovalRuleMatch match, ApprovalRuleActionEnum action, DeploymentApprovalRule rule)
        {
            match.Action = action;
            match.Rule = rule;
            return match;
        }

        private static bool InputMatches(string? inputPattern, string? inputJson, bool failClosed)
        {
            if (String.IsNullOrWhiteSpace(inputPattern)) return true;
            try
            {
                return Regex.IsMatch(inputJson ?? String.Empty, inputPattern!, RegexOptions.CultureInvariant, _RegexTimeout);
            }
            catch (RegexMatchTimeoutException)
            {
                // A pattern that runs too long counts as matching for Deny and Ask, so a slow regex never loosens policy.
                return failClosed;
            }
            catch (ArgumentException)
            {
                return false;
            }
        }

        private static bool BroadMatches(ParsedApprovalRule rule, string toolName, bool shell, string line, ShellSplitResult split, ApprovalToolInput? input, List<string> paths, string? workingDirectory)
        {
            if (rule.Specifier == null) return true;
            if (shell)
            {
                if (BashSpecifierMatches(rule.Specifier, line, true)) return true;
                return split.Commands.Any(c => BashSpecifierMatches(rule.Specifier, c, true));
            }
            return SpecifierMatches(rule.Specifier, toolName, input, paths, workingDirectory, true);
        }

        private static bool SpecifierMatches(string specifier, string toolName, ApprovalToolInput? input, List<string> paths, string? workingDirectory, bool broad)
        {
            if (toolName == "WebFetch" && specifier.StartsWith("domain:", StringComparison.Ordinal))
            {
                if (!Uri.TryCreate(input?.Url, UriKind.Absolute, out Uri? uri) || String.IsNullOrEmpty(uri.Host)) return false;
                string host = uri.Host.ToLowerInvariant();
                string domain = specifier.Substring(7).Trim().ToLowerInvariant();
                if (domain.StartsWith("*.", StringComparison.Ordinal))
                {
                    string parent = domain.Substring(1);
                    return host.EndsWith(parent, StringComparison.Ordinal) && host.Length > parent.Length;
                }
                return host == domain;
            }
            if (IsFileTool(toolName))
            {
                if (paths.Count == 0) return false;
                if (broad) return paths.Any(p => PathMatches(specifier, p, workingDirectory, true));
                return paths.All(p => PathMatches(specifier, p, workingDirectory, false));
            }
            return false;
        }

        private static bool PathMatches(string specifier, string path, string? workingDirectory, bool broad)
        {
            string target = Absolute(path, workingDirectory);
            string? cwd = NormalizePath(workingDirectory);
            string spec = specifier.Trim();
            string? anchored = null;
            string relative;
            if (spec.StartsWith("//", StringComparison.Ordinal))
            {
                anchored = "/" + spec.Substring(2);
                relative = spec.Substring(2);
            }
            else if (spec.StartsWith("~/", StringComparison.Ordinal))
            {
                relative = spec.Substring(2);
                if (!String.IsNullOrEmpty(cwd)) anchored = HomeOf(cwd) + "/" + relative;
            }
            else
            {
                relative = spec.StartsWith("./", StringComparison.Ordinal) ? spec.Substring(2) : spec.TrimStart('/');
                if (!String.IsNullOrEmpty(cwd)) anchored = cwd.TrimEnd('/') + "/" + relative;
            }

            if (anchored != null)
            {
                if (anchored.EndsWith("/", StringComparison.Ordinal)) anchored += "**";
                return SafeIsMatch(target, "^" + Glob(anchored) + "$", RegexOptions.None);
            }
            if (!broad) return false;
            if (relative.EndsWith("/", StringComparison.Ordinal)) relative += "**";
            return SafeIsMatch(target, "(^|/)" + Glob(relative) + "$", RegexOptions.None);
        }

        private static string HomeOf(string cwd)
        {
            // Run directories are <workRoot>/<runId>/work and <workRoot>/<runId>/home.
            string trimmed = cwd.TrimEnd('/');
            int slash = trimmed.LastIndexOf('/');
            return slash <= 0 ? trimmed : trimmed.Substring(0, slash) + "/home";
        }

        private static string Absolute(string path, string? workingDirectory)
        {
            string normalized = NormalizePath(path) ?? String.Empty;
            if (normalized.StartsWith("/", StringComparison.Ordinal)) return normalized;
            string? cwd = NormalizePath(workingDirectory);
            if (String.IsNullOrEmpty(cwd)) return normalized;
            return NormalizePath(cwd.TrimEnd('/') + "/" + normalized) ?? normalized;
        }

        private static string? NormalizePath(string? path)
        {
            if (String.IsNullOrWhiteSpace(path)) return null;
            string text = path.Trim().Replace('\\', '/');
            bool absolute = text.StartsWith("/", StringComparison.Ordinal);
            List<string> parts = new List<string>();
            foreach (string part in text.Split('/', StringSplitOptions.RemoveEmptyEntries))
            {
                if (part == ".") continue;
                if (part == "..")
                {
                    if (parts.Count > 0) parts.RemoveAt(parts.Count - 1);
                    continue;
                }
                parts.Add(part);
            }
            return (absolute ? "/" : String.Empty) + String.Join("/", parts);
        }

        private static string Glob(string pattern)
        {
            StringBuilder regex = new StringBuilder();
            int i = 0;
            while (i < pattern.Length)
            {
                char c = pattern[i];
                if (c == '*')
                {
                    bool doubleStar = i + 1 < pattern.Length && pattern[i + 1] == '*';
                    if (doubleStar && i + 2 < pattern.Length && pattern[i + 2] == '/')
                    {
                        regex.Append("(?:.*/)?");
                        i += 3;
                        continue;
                    }
                    if (doubleStar)
                    {
                        regex.Append(".*");
                        i += 2;
                        continue;
                    }
                    regex.Append("[^/]*");
                    i++;
                    continue;
                }
                if (c == '?')
                {
                    regex.Append("[^/]");
                    i++;
                    continue;
                }
                regex.Append(Regex.Escape(c.ToString()));
                i++;
            }
            return regex.ToString();
        }

        private static bool SafeIsMatch(string input, string pattern, RegexOptions options)
        {
            try
            {
                return Regex.IsMatch(input, pattern, options | RegexOptions.CultureInvariant, _RegexTimeout);
            }
            catch (RegexMatchTimeoutException)
            {
                return false;
            }
        }

        private static bool SafeIsMatch(string input, Regex regex)
        {
            try
            {
                return regex.IsMatch(input);
            }
            catch (RegexMatchTimeoutException)
            {
                return false;
            }
        }

        #endregion
    }
}
