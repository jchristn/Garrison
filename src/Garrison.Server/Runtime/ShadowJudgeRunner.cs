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
    /// Runs the judge agent for one shadow comparison (AA9.7, AA9.4): each judgement is a run of kind Eval of the
    /// comparison set's judge agent, with the rendered eval-judge prompt as input and the scoring's correlation key as its
    /// idempotency key, started as the person who started the trial. Thread-safe.
    /// </summary>
    public class ShadowJudgeRunner : IEvalJudgeRunner
    {
        #region Public-Members

        /// <summary>
        /// Longest wait for a judge run to finish, in seconds. Minimum 10, maximum 86400, default 900. A judge that takes
        /// longer stops the comparison with a <see cref="TimeoutException"/>, so the shadow run is left uncounted rather
        /// than counted as a divergence.
        /// </summary>
        public int MaxWaitSeconds
        {
            get
            {
                return _MaxWaitSeconds;
            }
            set
            {
                _MaxWaitSeconds = Math.Clamp(value, 10, 86400);
            }
        }

        /// <summary>
        /// How often the wait re-reads the judge run when no completion signal arrives, in milliseconds. Minimum 50,
        /// maximum 60000, default 1000.
        /// </summary>
        public int PollIntervalMs
        {
            get
            {
                return _PollIntervalMs;
            }
            set
            {
                _PollIntervalMs = Math.Clamp(value, 50, 60000);
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Server;
        private readonly RunService _Runs;
        private readonly RunSignals _Signals;
        private readonly ShadowTrial _Trial;
        private readonly Agent _Judge;
        private int _MaxWaitSeconds = 900;
        private int _PollIntervalMs = 1000;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="runs">Run service the judge runs are created through.</param>
        /// <param name="signals">Run signals (completion wakes the wait).</param>
        /// <param name="trial">Trial the judgements belong to.</param>
        /// <param name="judge">Judge agent.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public ShadowJudgeRunner(ServerContext server, RunService runs, RunSignals signals, ShadowTrial trial, Agent judge)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
            _Trial = trial ?? throw new ArgumentNullException(nameof(trial));
            _Judge = judge ?? throw new ArgumentNullException(nameof(judge));
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        /// <exception cref="TimeoutException">Thrown when the judge run does not finish within <see cref="MaxWaitSeconds"/>.</exception>
        public async Task<EvalJudgeRunResult> RunAsync(string prompt, string? correlationKey, CancellationToken token = default)
        {
            if (prompt == null) throw new ArgumentNullException(nameof(prompt));
            EvalJudgeRunResult result = new EvalJudgeRunResult();
            RunCreateContext create = new RunCreateContext();
            create.TenantId = _Trial.TenantId;
            create.Agent = _Judge;
            create.Input = prompt;
            create.InputContentType = "text/plain";
            create.Kind = RunKindEnum.Eval;
            create.CallerType = _Trial.CreatedByType;
            create.CallerId = _Trial.CreatedById;
            create.CallerName = "shadow:" + _Trial.Id;
            create.IdempotencyKey = correlationKey ?? ("shadow:" + _Trial.Id + ":judge:" + Guid.NewGuid().ToString("N"));
            create.Surface = "shadow";
            Run started;
            try
            {
                Run? existing = await _Server.Database.Runs.ReadByIdempotencyKeyAsync(_Trial.TenantId, _Trial.CreatedById, create.IdempotencyKey, token).ConfigureAwait(false);
                started = existing ?? await _Runs.CreateAsync(create, token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is ConflictException || e is ValidationException || e is NotFoundException || e is AppAccessException)
            {
                result.ErrorMessage = "the judge run could not start: " + e.Message;
                return result;
            }
            result.RunId = started.Id;
            Run finished = await WaitAsync(started.Id, token).ConfigureAwait(false);
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

        #region Private-Methods

        private async Task<Run> WaitAsync(string runId, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(_MaxWaitSeconds);
            using (RunSignalSubscription signal = _Signals.SubscribeCompletion(runId))
            {
                while (true)
                {
                    token.ThrowIfCancellationRequested();
                    Run? run = await _Server.Database.Runs.ReadAsync(_Trial.TenantId, runId, token).ConfigureAwait(false);
                    if (run == null) throw new NotFoundException("Judge run " + runId + " of shadow trial " + _Trial.Id + " no longer exists.");
                    if (RunService.IsTerminal(run.Status)) return run;
                    if (DateTime.UtcNow >= deadline) throw new TimeoutException("Judge run " + runId + " of shadow trial " + _Trial.Id + " did not finish within " + _MaxWaitSeconds + " seconds.");
                    await signal.WaitAsync(_PollIntervalMs, token).ConfigureAwait(false);
                }
            }
        }

        #endregion
    }
}
