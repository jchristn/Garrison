namespace Garrison.Core.Evaluation
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;

    /// <summary>
    /// ExactMatch (AA9.4): the output equals the expected text, which is the check's argument when it has one and the
    /// reference (the case's expected text) otherwise. Both sides are compared after trimming surrounding white space and
    /// turning CRLF line endings into LF. Score 1 and passed on a match, 0 otherwise. Thread-safe.
    /// </summary>
    public class ExactMatchScorer : IEvalScorer
    {
        #region Public-Members

        /// <inheritdoc />
        public EvalScorerEnum Scorer
        {
            get
            {
                return EvalScorerEnum.ExactMatch;
            }
        }

        /// <summary>
        /// Whether letter case is ignored. Default false (ordinal comparison).
        /// </summary>
        public bool IgnoreCase { get; set; } = false;

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task<EvalScore> ScoreAsync(EvalScoreRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            token.ThrowIfCancellationRequested();
            string? expected = request.Argument ?? request.Reference;
            if (expected == null) return Task.FromResult(new EvalScore(0, false, "There is no expected text: give the case expected text or the check an argument."));
            if (request.Output == null) return Task.FromResult(new EvalScore(0, false, "There was no output."));
            bool match = String.Equals(Normalize(request.Output), Normalize(expected), IgnoreCase ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal);
            return Task.FromResult(new EvalScore(match ? 1 : 0, match, match ? "The output matches the expected text." : "The output differs from the expected text."));
        }

        #endregion

        #region Private-Methods

        private static string Normalize(string text)
        {
            return text.Replace("\r\n", "\n", StringComparison.Ordinal).Trim();
        }

        #endregion
    }
}
