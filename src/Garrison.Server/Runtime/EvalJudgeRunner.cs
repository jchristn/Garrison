namespace Garrison.Server.Runtime
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Runs the judge agent of one eval run (AA9.4): each judgement is a run of kind Eval of the set's judge agent, with
    /// EvalRunId set, the rendered eval-judge prompt as input, and the scoring's correlation key as its idempotency key,
    /// started as the person who started the eval run. Thread-safe.
    /// </summary>
    public class EvalJudgeRunner : IEvalJudgeRunner
    {
        #region Private-Members

        private readonly EvalRunner _Runner;
        private readonly EvalRun _EvalRun;
        private readonly Agent _Judge;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="runner">Eval runner that starts and waits for runs.</param>
        /// <param name="evalRun">Eval run the judgements belong to.</param>
        /// <param name="judge">Judge agent.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public EvalJudgeRunner(EvalRunner runner, EvalRun evalRun, Agent judge)
        {
            _Runner = runner ?? throw new ArgumentNullException(nameof(runner));
            _EvalRun = evalRun ?? throw new ArgumentNullException(nameof(evalRun));
            _Judge = judge ?? throw new ArgumentNullException(nameof(judge));
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<EvalJudgeRunResult> RunAsync(string prompt, string? correlationKey, CancellationToken token = default)
        {
            if (prompt == null) throw new ArgumentNullException(nameof(prompt));
            EvalJudgeRunResult result = new EvalJudgeRunResult();
            Run started;
            try
            {
                started = await _Runner.StartRunAsync(_EvalRun, _Judge, null, prompt, correlationKey ?? ("eval:" + _EvalRun.Id + ":judge:" + Guid.NewGuid().ToString("N")), token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is ConflictException || e is ValidationException || e is NotFoundException || e is AppAccessException)
            {
                result.ErrorMessage = "the judge run could not start: " + e.Message;
                return result;
            }
            result.RunId = started.Id;
            Run? finished = await _Runner.WaitAsync(_EvalRun, started.Id, token).ConfigureAwait(false);
            if (finished == null)
            {
                result.ErrorMessage = "the eval run stopped before the judge finished.";
                token.ThrowIfCancellationRequested();
                return result;
            }
            result.CostUsd = Math.Max(0, finished.CostUsd ?? 0);
            if (finished.Status != RunStatusEnum.Succeeded)
            {
                result.ErrorMessage = "the judge run ended " + finished.Status + (String.IsNullOrEmpty(finished.ErrorMessage) ? "." : ": " + finished.ErrorMessage);
                return result;
            }
            result.Output = finished.ResultText;
            result.StructuredOutputJson = finished.StructuredOutputJson;
            return result;
        }

        #endregion
    }
}
