namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// Redacts secret values from text. Values shorter than four characters are ignored to avoid mangling output.
    /// Thread-safe after construction.
    /// </summary>
    public class SecretScrubber
    {
        #region Public-Members

        /// <summary>
        /// Replacement text. Default [REDACTED].
        /// </summary>
        public string Replacement { get; set; } = "[REDACTED]";

        #endregion

        #region Private-Members

        private readonly List<string> _Values;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="values">Secret values.</param>
        public SecretScrubber(IEnumerable<string>? values)
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
        /// Redact secrets from text.
        /// </summary>
        /// <param name="text">Text.</param>
        /// <returns>Redacted text.</returns>
        public string? Scrub(string? text)
        {
            if (String.IsNullOrEmpty(text) || _Values.Count == 0) return text;
            string result = text;
            foreach (string value in _Values)
            {
                if (result.Contains(value, StringComparison.Ordinal)) result = result.Replace(value, Replacement, StringComparison.Ordinal);
            }
            return result;
        }

        #endregion
    }
}
