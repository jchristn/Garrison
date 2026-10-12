namespace Garrison.Core.Approvals
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;

    /// <summary>
    /// Redacts secrets from approval previews (P12.3): the literal values of secrets the run's deployment binds, then
    /// common credential shapes (bearer tokens, OpenAI and Anthropic keys, GitHub tokens, AWS access key IDs, Slack tokens,
    /// private key blocks, and values assigned to names such as password, token, secret, or api_key). Previews are for
    /// people deciding; the tool input itself is never stored. Thread-safe once constructed.
    /// </summary>
    public class ApprovalRedactor
    {
        #region Public-Members

        /// <summary>
        /// Text that replaces a redacted value. Default <c>[REDACTED]</c>.
        /// </summary>
        public string Replacement
        {
            get
            {
                return _Replacement;
            }
            set
            {
                _Replacement = String.IsNullOrEmpty(value) ? "[REDACTED]" : value;
            }
        }

        #endregion

        #region Private-Members

        private string _Replacement = "[REDACTED]";
        private readonly List<string> _Values;
        private static readonly TimeSpan _Timeout = TimeSpan.FromSeconds(1);
        private static readonly Regex _PrivateKey = new Regex("-----BEGIN [A-Z ]*PRIVATE KEY-----[\\s\\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)", RegexOptions.CultureInvariant, _Timeout);
        private static readonly Regex _Bearer = new Regex("(?i)\\b(Bearer|Basic)\\s+[A-Za-z0-9._~+/=-]{8,}", RegexOptions.CultureInvariant, _Timeout);
        private static readonly Regex _Shapes = new Regex("\\b(sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})", RegexOptions.CultureInvariant, _Timeout);
        private static readonly Regex _Assignment = new Regex("(?i)((?:api[_-]?key|apikey|secret|token|password|passwd|pwd|access[_-]?key|private[_-]?key|client[_-]?secret|authorization)[A-Za-z0-9_-]*\\\\?\"?\\s*[=:]\\s*\\\\?\"?)([^\\s\"'\\\\,;&]{4,})", RegexOptions.CultureInvariant, _Timeout);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="values">Literal secret values to remove (values shorter than 4 characters are ignored), or null.</param>
        public ApprovalRedactor(IEnumerable<string>? values = null)
        {
            _Values = (values ?? Enumerable.Empty<string>())
                .Where(v => !String.IsNullOrEmpty(v) && v.Length >= 4)
                .Distinct(StringComparer.Ordinal)
                .OrderByDescending(v => v.Length)
                .ToList();
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Redact a text.
        /// </summary>
        /// <param name="text">Text, or null.</param>
        /// <returns>Redacted text, or null when the input is null.</returns>
        public string? Redact(string? text)
        {
            if (String.IsNullOrEmpty(text)) return text;
            string result = text;
            foreach (string value in _Values) result = result.Replace(value, _Replacement, StringComparison.Ordinal);
            result = Apply(_PrivateKey, result, m => _Replacement);
            result = Apply(_Bearer, result, m => m.Groups[1].Value + " " + _Replacement);
            result = Apply(_Shapes, result, m => _Replacement);
            result = Apply(_Assignment, result, m => m.Groups[1].Value + _Replacement);
            return result;
        }

        /// <summary>
        /// Redact and truncate a text.
        /// </summary>
        /// <param name="text">Text, or null.</param>
        /// <param name="maxLength">Maximum length; longer text is cut and ends with an ellipsis marker. Minimum 16.</param>
        /// <returns>Redacted text, or null when the input is null.</returns>
        public string? RedactAndClip(string? text, int maxLength)
        {
            string? redacted = Redact(text);
            if (redacted == null) return null;
            int max = Math.Max(16, maxLength);
            if (redacted.Length <= max) return redacted;
            return redacted.Substring(0, max - 15) + " ...[truncated]";
        }

        #endregion

        #region Private-Methods

        private static string Apply(Regex regex, string input, MatchEvaluator evaluator)
        {
            try
            {
                return regex.Replace(input, evaluator);
            }
            catch (RegexMatchTimeoutException)
            {
                // A pathological input is replaced whole rather than shown partly redacted.
                return "[REDACTED: the preview could not be checked for secrets]";
            }
        }

        #endregion
    }
}
