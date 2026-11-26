namespace Garrison.Core.Evaluation
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;

    /// <summary>
    /// Scores one output (AA9.4). The same contract serves eval cases, where <see cref="EvalScoreRequest.Reference"/> is
    /// the case's expected text, and output comparisons, where it is a reference output such as the source deployment's
    /// answer in a shadow trial. Implementations are thread-safe and never throw for a poor or unparsable output: they
    /// return a zero score with a note.
    /// </summary>
    public interface IEvalScorer
    {
        /// <summary>
        /// The scorer this implementation provides.
        /// </summary>
        EvalScorerEnum Scorer { get; }

        /// <summary>
        /// Score an output.
        /// </summary>
        /// <param name="request">Input, output, reference, and the check's argument.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Score from 0 to 1, whether it passed, and a note.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="OperationCanceledException">Thrown when the token is cancelled.</exception>
        Task<EvalScore> ScoreAsync(EvalScoreRequest request, CancellationToken token = default);
    }
}
