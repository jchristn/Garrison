namespace Garrison.Core.Evaluation
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;

    /// <summary>
    /// Contains (AA9.4): the output contains the check's argument, or the reference (the case's expected text) when the
    /// check has no argument. Score 1 and passed when found, 0 otherwise. Thread-safe.
    /// </summary>
    public class ContainsScorer : IEvalScorer
    {
        #region Public-Members

        /// <inheritdoc />
        public EvalScorerEnum Scorer
        {
            get
            {
                return EvalScorerEnum.Contains;
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
            string? needle = request.Argument ?? request.Reference;
            if (String.IsNullOrEmpty(needle)) return Task.FromResult(new EvalScore(0, false, "There is no text to look for: give the check an argument or the case expected text."));
            if (request.Output == null) return Task.FromResult(new EvalScore(0, false, "There was no output."));
            bool found = request.Output.Contains(needle, IgnoreCase ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal);
            return Task.FromResult(new EvalScore(found ? 1 : 0, found, found ? "The output contains the expected text." : "The output does not contain the expected text."));
        }

        #endregion
    }
}
