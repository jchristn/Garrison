namespace Test.Shared.Infrastructure
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Evaluation;

    /// <summary>
    /// A judge runner that answers with a fixed reply and remembers the prompt it was given, for scorer unit tests.
    /// </summary>
    public class CannedJudge : IEvalJudgeRunner
    {
        #region Public-Members

        /// <summary>
        /// The last prompt the judge received, or null.
        /// </summary>
        public string? LastPrompt { get; private set; } = null;

        /// <summary>
        /// The last correlation key, or null.
        /// </summary>
        public string? LastKey { get; private set; } = null;

        #endregion

        #region Private-Members

        private readonly string? _Reply;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="reply">Reply text, or null for a judge run that fails.</param>
        public CannedJudge(string? reply)
        {
            _Reply = reply;
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task<EvalJudgeRunResult> RunAsync(string prompt, string? correlationKey, CancellationToken token = default)
        {
            if (prompt == null) throw new ArgumentNullException(nameof(prompt));
            token.ThrowIfCancellationRequested();
            LastPrompt = prompt;
            LastKey = correlationKey;
            EvalJudgeRunResult result = new EvalJudgeRunResult { RunId = "run_judge", CostUsd = 0.01 };
            if (_Reply == null) result.ErrorMessage = "the judge run ended Failed.";
            else result.Output = _Reply;
            return Task.FromResult(result);
        }

        #endregion
    }
}
