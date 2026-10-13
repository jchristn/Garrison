namespace Garrison.Core.Helpers
{
    using System;
    using System.Linq;
    using System.Text.RegularExpressions;

    /// <summary>Workspace-relative artifact patterns. Supports *, **, and ?; paths never select parent directories.</summary>
    public static class ArtifactGlob
    {
        /// <summary>Whether a pattern uses supported relative syntax.</summary>
        /// <param name="pattern">Operator-configured glob.</param>
        /// <returns>Whether the pattern can be used for collection.</returns>
        public static bool IsValid(string? pattern)
        {
            if (String.IsNullOrWhiteSpace(pattern) || pattern.Length > 512) return false;
            string normalized = pattern.Replace('\\', '/');
            return !normalized.StartsWith("/", StringComparison.Ordinal) && !normalized.Contains(':')
                && !normalized.Any(Char.IsControl) && !normalized.Any(c => c == '[' || c == ']' || c == '{' || c == '}')
                && normalized.Split('/').All(segment => segment.Length > 0 && segment != "." && segment != "..");
        }

        /// <summary>Match a workspace-relative file path using case-sensitive, slash-normalized glob semantics.</summary>
        /// <param name="pattern">Validated or untrusted glob.</param>
        /// <param name="relativePath">Relative file name.</param>
        /// <returns>Whether the file matches. Invalid patterns or paths never match.</returns>
        public static bool Matches(string pattern, string relativePath)
        {
            if (!IsValid(pattern) || String.IsNullOrWhiteSpace(relativePath) || relativePath.Length > 1024) return false;
            string path = relativePath.Replace('\\', '/');
            if (path.StartsWith("/", StringComparison.Ordinal) || path.Contains(':') || path.Any(Char.IsControl)
                || path.Split('/').Any(segment => segment.Length == 0 || segment == "." || segment == "..")) return false;
            string expression = Regex.Escape(pattern.Replace('\\', '/'))
                .Replace("\\*\\*/", "(?:.*/)?", StringComparison.Ordinal)
                .Replace("\\*\\*", ".*", StringComparison.Ordinal)
                .Replace("\\*", "[^/]*", StringComparison.Ordinal)
                .Replace("\\?", "[^/]", StringComparison.Ordinal);
            return Regex.IsMatch(relativePath.Replace('\\', '/'), "\\A" + expression + "\\z", RegexOptions.CultureInvariant | RegexOptions.NonBacktracking, TimeSpan.FromSeconds(1));
        }
    }
}
