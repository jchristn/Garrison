namespace Garrison.Core.Evaluation
{
    using System;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>
    /// Default shadow comparer (AA9.7): two outputs agree when they are equal after normalization, which trims them,
    /// collapses every run of whitespace to one space, and (by default) ignores case. Two missing or empty outputs agree.
    /// Thread-safe.
    /// </summary>
    public class NormalizedTextShadowComparer : IShadowComparer
    {
        #region Public-Members

        /// <summary>
        /// Whether letter case is ignored. Default true.
        /// </summary>
        public bool IgnoreCase { get; set; } = true;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public NormalizedTextShadowComparer()
        {
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task<ShadowComparison> CompareAsync(ShadowTrial trial, string? sourceOutput, string? candidateOutput, CancellationToken token = default)
        {
            if (trial == null) throw new ArgumentNullException(nameof(trial));
            token.ThrowIfCancellationRequested();
            string source = Normalize(sourceOutput, IgnoreCase);
            string candidate = Normalize(candidateOutput, IgnoreCase);
            if (String.Equals(source, candidate, StringComparison.Ordinal))
            {
                return Task.FromResult(new ShadowComparison(true, "The outputs match after normalizing whitespace" + (IgnoreCase ? " and case." : ".")));
            }
            int at = FirstDifference(source, candidate);
            return Task.FromResult(new ShadowComparison(false, "The outputs differ at character " + at + " after normalizing (source " + source.Length + " characters, candidate " + candidate.Length + ")."));
        }

        /// <summary>
        /// Normalize text the way the comparer does: trim, collapse whitespace runs to one space, and optionally lower-case.
        /// </summary>
        /// <param name="value">Text, or null (treated as empty).</param>
        /// <param name="ignoreCase">Whether to lower-case with the invariant culture.</param>
        /// <returns>Normalized text; never null.</returns>
        public static string Normalize(string? value, bool ignoreCase)
        {
            if (String.IsNullOrEmpty(value)) return String.Empty;
            StringBuilder builder = new StringBuilder(value.Length);
            bool space = false;
            foreach (char c in value.Trim())
            {
                if (Char.IsWhiteSpace(c))
                {
                    space = true;
                    continue;
                }
                if (space && builder.Length > 0) builder.Append(' ');
                space = false;
                builder.Append(ignoreCase ? Char.ToLowerInvariant(c) : c);
            }
            return builder.ToString();
        }

        #endregion

        #region Private-Methods

        private static int FirstDifference(string a, string b)
        {
            int length = Math.Min(a.Length, b.Length);
            for (int i = 0; i < length; i++)
            {
                if (a[i] != b[i]) return i;
            }
            return length;
        }

        #endregion
    }
}
