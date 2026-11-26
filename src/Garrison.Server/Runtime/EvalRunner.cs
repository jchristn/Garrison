namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Keepers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Services;
    using SyslogLogging;

    /// <summary>
    /// The eval runner (AA9.3, AA9.11): runs every case of an eval run as a run of kind Eval with EvalRunId set, against a
    /// deployment or against an agent revision (on an ephemeral copy in the draft environment), at most
    /// Evaluation.MaxConcurrentCases at a time, scores each output with its checks, records one result per case, and
    /// finishes the run with the weighted score and passed (score at least threshold). It stops starting cases once the
    /// spend reaches the run's budget and fails the run with BudgetExhausted.
    /// <para>
    /// Only the control-plane leader drives eval runs. Its maintenance pass calls <see cref="SweepAsync"/>, which picks up
    /// Pending and Running eval runs (so a run a former leader was driving resumes), and creating an eval run kicks it at
    /// once. Several replicas never double-run a case: each case run and judge run carries an idempotency key derived
    /// from the eval run and the case order, a case result is unique per eval run and order, and status changes are
    /// compare-and-set. Cancelling an eval run stops its driver and cancels its unfinished case runs. Thread-safe.
    /// </para>
    /// </summary>
    public class EvalRunner : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Milliseconds between checks while a case run is in flight (cancel, leadership, and the run's status; run
        /// completion wakes the wait sooner). Minimum 50, maximum 60000, default 1000.
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

        /// <summary>
        /// Active eval runs one sweep looks at. Minimum 1, maximum 10000, default 100.
        /// </summary>
        public int MaxActivePerSweep
        {
            get
            {
                return _MaxActivePerSweep;
            }
            set
            {
                _MaxActivePerSweep = Math.Clamp(value, 1, 10000);
            }
        }

        /// <summary>
        /// Evaluation options (MaxConcurrentCases), refreshed from the cluster settings.
        /// </summary>
        public EvaluationOptions Options
        {
            get
            {
                return _Options;
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Server;
        private readonly EvaluationOptions _Options;
        private readonly Func<bool> _IsLeader;
        private readonly RunService _Runs;
        private readonly RunSignals _Signals;
        private readonly LoggingModule _Logging;
        private readonly string _Header = "[Evals] ";
        private readonly Dictionary<string, Task> _Drivers = new Dictionary<string, Task>(StringComparer.Ordinal);
        private readonly object _DriversLock = new object();
        private readonly CancellationTokenSource _Stopping = new CancellationTokenSource();
        private int _PollIntervalMs = 1000;
        private int _MaxActivePerSweep = 100;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="options">Evaluation options.</param>
        /// <param name="isLeader">Whether this replica is the control-plane leader.</param>
        /// <param name="runs">Run service.</param>
        /// <param name="signals">Run signals (completion wakes waits).</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public EvalRunner(ServerContext server, EvaluationOptions options, Func<bool> isLeader, RunService runs, RunSignals signals, LoggingModule logging)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _IsLeader = isLeader ?? throw new ArgumentNullException(nameof(isLeader));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The leader's maintenance step: start a driver for each Pending or Running eval run this replica is not already
        /// driving. Drivers run in the background.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a driver started.</returns>
        public async Task<bool> SweepAsync(CancellationToken token)
        {
            if (!_IsLeader() || _Stopping.IsCancellationRequested) return false;
            List<EvalRun> active = await _Server.Database.EvalRuns.ListActiveAsync(_MaxActivePerSweep, token).ConfigureAwait(false);
            bool started = false;
            foreach (EvalRun run in active)
            {
                if (Start(run.TenantId, run.Id)) started = true;
            }
            return started;
        }

        /// <summary>
        /// Start driving an eval run now when this replica is the leader (called when one is created). Otherwise the
        /// leader's next sweep picks it up.
        /// </summary>
        /// <param name="run">Eval run.</param>
        /// <returns>True when a driver started here.</returns>
        public bool Kick(EvalRun run)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (!_IsLeader()) return false;
            return Start(run.TenantId, run.Id);
        }

        /// <summary>
        /// Drive one eval run until it finishes, is cancelled, or leadership moves. A second call for a run this replica is
        /// already driving waits for that driver instead of starting another.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="evalRunId">Eval run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The eval run as stored afterwards, or null when it does not exist.</returns>
        public async Task<EvalRun?> DriveAsync(string tenantId, string evalRunId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(evalRunId)) throw new ArgumentNullException(nameof(evalRunId));
            Start(tenantId, evalRunId, true);
            Task? driver;
            lock (_DriversLock)
            {
                _Drivers.TryGetValue(evalRunId, out driver);
            }
            if (driver != null) await driver.WaitAsync(token).ConfigureAwait(false);
            return await _Server.Database.EvalRuns.ReadAsync(tenantId, evalRunId, token).ConfigureAwait(false);
        }

        /// <summary>
        /// The work items of an eval run: the set version's cases in order, or in RecentInputs mode the inputs of the
        /// target deployment's last RecentInputCount succeeded runs created before the eval run (newest first; eval,
        /// shadow, and playground runs are left out). Recent inputs have no expected text and are scored by the set's
        /// distinct Judge checks, or by one default Judge check when the set has none (AA9.11).
        /// </summary>
        /// <param name="run">Eval run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Work items.</returns>
        /// <exception cref="NotFoundException">Thrown when the set version no longer exists.</exception>
        public async Task<List<EvalWorkItem>> WorkItemsAsync(EvalRun run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            List<EvalCase> cases = await _Server.Database.EvalCases.ListBySetAsync(run.TenantId, run.SetId, token).ConfigureAwait(false);
            List<EvalWorkItem> items = new List<EvalWorkItem>();
            if (run.InputMode == EvalRunInputModeEnum.Cases)
            {
                for (int i = 0; i < cases.Count; i++)
                {
                    EvalCase item = cases[i];
                    items.Add(new EvalWorkItem { Order = i, CaseId = item.Id, Name = item.Name, InputText = item.InputText, ExpectedText = item.ExpectedText, Hidden = item.Hidden, Checks = item.Checks, SourceRunId = item.SourceRunId });
                }
                return items;
            }

            List<EvalCaseCheck> judges = cases.SelectMany(c => c.Checks).Where(c => c.Scorer == EvalScorerEnum.Judge)
                .GroupBy(c => (c.Argument ?? String.Empty) + "\u0001" + c.Weight.ToString(CultureInfo.InvariantCulture), StringComparer.Ordinal)
                .Select(g => new EvalCaseCheck { Scorer = EvalScorerEnum.Judge, Argument = g.First().Argument, Weight = g.First().Weight }).ToList();
            if (String.IsNullOrEmpty(run.DeploymentId)) return items;
            RunFilter filter = new RunFilter { TenantId = run.TenantId, DeploymentId = run.DeploymentId, Status = RunStatusEnum.Succeeded, ToUtc = run.CreatedUtc, MaxResults = 200, Ordering = EnumerationOrderEnum.CreatedDescending };
            while (items.Count < run.RecentInputCount)
            {
                EnumerationResult<Run> page = await _Server.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
                foreach (Run source in page.Objects)
                {
                    if (source.Kind == RunKindEnum.Eval || source.Kind == RunKindEnum.Shadow || source.Kind == RunKindEnum.Playground) continue;
                    if (String.IsNullOrWhiteSpace(source.InputText)) continue;
                    items.Add(new EvalWorkItem { Order = items.Count, InputText = source.InputText, SourceRunId = source.Id, Checks = judges.Select(j => new EvalCaseCheck { Scorer = j.Scorer, Argument = j.Argument, Weight = j.Weight }).ToList() });
                    if (items.Count >= run.RecentInputCount) break;
                }
                if (page.EndOfResults || page.Objects.Count == 0) break;
                filter.Skip += page.Objects.Count;
            }
            return items;
        }

        /// <summary>
        /// Stop every driver on this replica (shutdown). Eval runs stay Running; the next leader resumes them.
        /// </summary>
        /// <returns>Task.</returns>
        public async Task StopAsync()
        {
            _Stopping.Cancel();
            List<Task> drivers;
            lock (_DriversLock)
            {
                drivers = _Drivers.Values.ToList();
            }
            foreach (Task driver in drivers)
            {
                try
                {
                    await driver.ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                }
            }
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Internal-Methods

        /// <summary>
        /// Start (or, after a restart, find again) one run of an eval run: a case run or a judge run.
        /// </summary>
        /// <param name="run">Eval run.</param>
        /// <param name="agent">Agent to run.</param>
        /// <param name="deploymentId">Deployment, or null for the agent's routing.</param>
        /// <param name="input">Input.</param>
        /// <param name="key">Idempotency key, unique within the eval run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The run.</returns>
        internal async Task<Run> StartRunAsync(EvalRun run, Agent agent, string? deploymentId, string input, string key, CancellationToken token)
        {
            RunCreateContext create = new RunCreateContext();
            create.TenantId = run.TenantId;
            create.Agent = agent;
            create.DeploymentId = deploymentId;
            create.Input = input;
            create.InputContentType = "text/plain";
            create.Kind = RunKindEnum.Eval;
            create.EvalRunId = run.Id;
            create.StudioDraftId = run.StudioDraftId;
            create.CallerType = run.StartedByType;
            create.CallerId = run.StartedById;
            create.CallerName = "eval:" + run.Id;
            create.IdempotencyKey = key;
            create.Surface = "eval";
            return await _Runs.CreateAsync(create, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Wait for a run of an eval run to finish. Returns null without waiting further when the eval run is cancelled
        /// (the run is cancelled too), when this replica stops being the leader, or when the runner stops.
        /// </summary>
        /// <param name="evalRun">Eval run.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The finished run, or null.</returns>
        internal async Task<Run?> WaitAsync(EvalRun evalRun, string runId, CancellationToken token)
        {
            using (RunSignalSubscription signal = _Signals.SubscribeCompletion(runId))
            {
                while (true)
                {
                    token.ThrowIfCancellationRequested();
                    Run? run = await _Server.Database.Runs.ReadAsync(evalRun.TenantId, runId, token).ConfigureAwait(false);
                    if (run == null) return null;
                    if (RunService.IsTerminal(run.Status)) return run;
                    if (!_IsLeader()) return null;
                    EvalRun? current = await _Server.Database.EvalRuns.ReadAsync(evalRun.TenantId, evalRun.Id, token).ConfigureAwait(false);
                    if (current == null || current.Status != EvalRunStatusEnum.Running)
                    {
                        if (current == null || current.Status == EvalRunStatusEnum.Cancelled || current.Status == EvalRunStatusEnum.Failed) await CancelQuietlyAsync(run).ConfigureAwait(false);
                        return null;
                    }
                    await signal.WaitAsync(_PollIntervalMs, token).ConfigureAwait(false);
                }
            }
        }

        #endregion

        #region Private-Methods

        /// <summary>
        /// Dispose.
        /// </summary>
        /// <param name="disposing">Disposing.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                _Stopping.Cancel();
                _Stopping.Dispose();
            }
            _Disposed = true;
        }

        private bool Start(string tenantId, string evalRunId, bool force = false)
        {
            if (_Stopping.IsCancellationRequested) return false;
            if (!force && !_IsLeader()) return false;
            lock (_DriversLock)
            {
                // One driver per eval run on this replica; the driver waits until it is registered, so its removal can
                // never run before its registration.
                if (_Drivers.ContainsKey(evalRunId)) return false;
                TaskCompletionSource<bool> registered = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
                Task driver = Task.Run(async () =>
                {
                    await registered.Task.ConfigureAwait(false);
                    try
                    {
                        await DriveCoreAsync(tenantId, evalRunId, _Stopping.Token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException) when (_Stopping.IsCancellationRequested)
                    {
                    }
                    catch (Exception e)
                    {
                        _Logging.Warn(_Header + "eval run " + evalRunId + " stopped on an error; the next sweep resumes it: " + e.Message);
                    }
                    finally
                    {
                        lock (_DriversLock)
                        {
                            _Drivers.Remove(evalRunId);
                        }
                    }
                });
                _Drivers[evalRunId] = driver;
                registered.SetResult(true);
                return true;
            }
        }

        private async Task DriveCoreAsync(string tenantId, string evalRunId, CancellationToken token)
        {
            EvalRun? run = await _Server.Database.EvalRuns.ReadAsync(tenantId, evalRunId, token).ConfigureAwait(false);
            if (run == null || IsTerminal(run.Status)) return;
            using (Activity? span = GarrisonTracing.Start("eval run", ActivityKind.Internal))
            {
                span?.SetTag("garrison.eval_run_id", run.Id);
                span?.SetTag("garrison.eval_set", run.SetName);
                span?.SetTag("garrison.eval_target", run.TargetType.ToString());
                if (run.Status == EvalRunStatusEnum.Pending)
                {
                    await _Server.Database.EvalRuns.TransitionAsync(tenantId, run.Id, EvalRunStatusEnum.Pending, EvalRunStatusEnum.Running, null, token).ConfigureAwait(false);
                    run = await _Server.Database.EvalRuns.ReadAsync(tenantId, evalRunId, token).ConfigureAwait(false);
                    if (run == null || run.Status != EvalRunStatusEnum.Running) return;
                    _Logging.Info(_Header + "eval run " + run.Id + " started: set " + run.SetName + " version " + run.SetVersion + ", " + run.TotalCases + " case(s)");
                }
                if (run.Status != EvalRunStatusEnum.Running) return;

                EvalRunContext context;
                try
                {
                    context = await PrepareAsync(run, token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is ConflictException || e is ValidationException || e is NotFoundException || e is AppAccessException || e is Garrison.Core.Templates.TemplateException)
                {
                    await FailAsync(run, "TargetUnavailable: " + e.Message, span, token).ConfigureAwait(false);
                    return;
                }

                HashSet<int> done = new HashSet<int>((await _Server.Database.EvalCaseResults.ListByEvalRunAsync(tenantId, run.Id, token).ConfigureAwait(false)).Select(r => r.Order));
                Dictionary<string, Run> started = await RunsByKeyAsync(run, token).ConfigureAwait(false);
                string? stop = null;
                bool abandoned = false;
                List<Task> cases = new List<Task>();
                using (SemaphoreSlim slots = new SemaphoreSlim(_Options.MaxConcurrentCases, _Options.MaxConcurrentCases))
                {
                    foreach (EvalWorkItem item in context.Items.Where(i => !done.Contains(i.Order)))
                    {
                        await slots.WaitAsync(token).ConfigureAwait(false);
                        if (!_IsLeader())
                        {
                            slots.Release();
                            abandoned = true;
                            break;
                        }
                        EvalRun? current = await _Server.Database.EvalRuns.ReadAsync(tenantId, run.Id, token).ConfigureAwait(false);
                        if (current == null || current.Status != EvalRunStatusEnum.Running)
                        {
                            slots.Release();
                            abandoned = true;
                            break;
                        }
                        if (current.BudgetUsd.HasValue && current.CostUsd >= current.BudgetUsd.Value)
                        {
                            slots.Release();
                            stop = "BudgetExhausted: the run spent " + current.CostUsd.ToString("0.####", CultureInfo.InvariantCulture) + " USD of its " + current.BudgetUsd.Value.ToString("0.####", CultureInfo.InvariantCulture) + " USD budget; " + (context.Items.Count - current.CompletedCases) + " case(s) did not run.";
                            break;
                        }
                        started.TryGetValue(CaseKey(run.Id, item.Order), out Run? existing);
                        cases.Add(Task.Run(async () =>
                        {
                            try
                            {
                                await CaseAsync(context, item, existing, token).ConfigureAwait(false);
                            }
                            finally
                            {
                                slots.Release();
                            }
                        }, token));
                    }
                    await Task.WhenAll(cases).ConfigureAwait(false);
                }
                if (abandoned) return;
                EvalRun? latest = await _Server.Database.EvalRuns.ReadAsync(tenantId, run.Id, token).ConfigureAwait(false);
                if (latest == null || latest.Status != EvalRunStatusEnum.Running) return;
                if (stop != null)
                {
                    await FailAsync(latest, stop, span, token).ConfigureAwait(false);
                    return;
                }
                List<EvalCaseResult> results = await _Server.Database.EvalCaseResults.ListByEvalRunAsync(tenantId, run.Id, token).ConfigureAwait(false);
                if (results.Count < context.Items.Count) return;
                await CompleteAsync(latest, results, span, token).ConfigureAwait(false);
            }
        }

        private async Task<EvalRunContext> PrepareAsync(EvalRun run, CancellationToken token)
        {
            EvalRunContext context = new EvalRunContext();
            context.Run = run;
            EvalSet set = await _Server.Database.EvalSets.ReadAsync(run.TenantId, run.SetId, token).ConfigureAwait(false)
                ?? throw new NotFoundException("Eval set " + run.SetName + " version " + run.SetVersion + " no longer exists.");
            context.Items = await WorkItemsAsync(run, token).ConfigureAwait(false);
            if (String.IsNullOrEmpty(run.AgentId)) throw new NotFoundException("The eval run names no agent.");
            context.Agent = await _Server.Database.Agents.ReadAsync(run.TenantId, run.AgentId, token).ConfigureAwait(false)
                ?? throw new NotFoundException("The eval run's agent no longer exists.");
            if (run.TargetType == EvalRunTargetEnum.Deployment)
            {
                if (String.IsNullOrEmpty(run.DeploymentId)) throw new NotFoundException("The eval run names no deployment.");
                Deployment deployment = await _Server.Database.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false)
                    ?? throw new NotFoundException("The eval run's deployment no longer exists.");
                context.DeploymentId = deployment.Id;
            }
            else
            {
                if (String.IsNullOrEmpty(run.AgentRevisionId)) throw new NotFoundException("The eval run names no agent revision.");
                AgentRevision revision = await _Server.Database.AgentRevisions.ReadAsync(run.TenantId, run.AgentRevisionId, token).ConfigureAwait(false)
                    ?? throw new NotFoundException("The eval run's agent revision no longer exists.");
                context.DeploymentId = (await _Server.Get<PlaygroundService>().EvalDeploymentAsync(run.TenantId, context.Agent, revision, token).ConfigureAwait(false)).Id;
            }
            IEvalScorer? judge = null;
            if (!String.IsNullOrWhiteSpace(set.JudgeAgent))
            {
                Agent judgeAgent = await _Server.Database.Agents.ReadAsync(run.TenantId, set.JudgeAgent, token).ConfigureAwait(false)
                    ?? await _Server.Database.Agents.ReadByNameAsync(run.TenantId, set.JudgeAgent, token).ConfigureAwait(false)
                    ?? throw new NotFoundException("Judge agent " + set.JudgeAgent + " of eval set " + set.Name + " was not found.");
                PromptTemplate template = await new KeeperTemplateResolver(_Server.Database).ResolveAsync(run.TenantId, EvalJudgePrompt.TemplateName, PromptTemplateKindEnum.Task, token).ConfigureAwait(false);
                judge = new JudgeScorer(new EvalJudgeRunner(this, run, judgeAgent), template);
            }
            context.Scorers = new EvalScorers(judge);
            return context;
        }

        private async Task CaseAsync(EvalRunContext context, EvalWorkItem item, Run? existing, CancellationToken token)
        {
            EvalRun run = context.Run;
            long startedAt = Stopwatch.GetTimestamp();
            using (Activity? span = GarrisonTracing.Start("eval case", ActivityKind.Internal))
            {
                span?.SetTag("garrison.eval_run_id", run.Id);
                span?.SetTag("garrison.eval_case_order", item.Order);
                EvalCaseResult result = new EvalCaseResult();
                result.TenantId = run.TenantId;
                result.EvalRunId = run.Id;
                result.CaseId = item.CaseId;
                result.Order = item.Order;
                result.SourceRunId = item.SourceRunId;
                Run? caseRun = existing;
                if (caseRun == null)
                {
                    try
                    {
                        caseRun = await StartRunAsync(run, context.Agent, context.DeploymentId, item.InputText, CaseKey(run.Id, item.Order), token).ConfigureAwait(false);
                    }
                    catch (Exception e) when (e is ConflictException || e is ValidationException || e is NotFoundException || e is AppAccessException)
                    {
                        result.ErrorMessage = "The case run could not start: " + e.Message;
                    }
                }
                if (caseRun != null)
                {
                    span?.SetTag("garrison.run_id", caseRun.Id);
                    Run? finished = await WaitAsync(run, caseRun.Id, token).ConfigureAwait(false);
                    if (finished == null) return;
                    result.RunId = finished.Id;
                    result.CostUsd = Math.Max(0, finished.CostUsd ?? 0);
                    if (finished.Status == RunStatusEnum.Succeeded)
                    {
                        result.OutputText = finished.ResultText;
                        await EvalCaseScoring.ScoreAsync(context.Scorers, item, finished.ResultText, run.TenantId, CaseKey(run.Id, item.Order) + ":judge", result, token).ConfigureAwait(false);
                        // A judge stopped by a cancel, or by leadership moving, leaves the case for the next driver.
                        EvalRun? after = await _Server.Database.EvalRuns.ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
                        if (after == null || after.Status != EvalRunStatusEnum.Running || !_IsLeader()) return;
                    }
                    else
                    {
                        result.ErrorMessage = "The case run ended " + finished.Status + (String.IsNullOrEmpty(finished.ErrorMessage) ? "." : ": " + finished.ErrorMessage);
                    }
                }
                if (result.ErrorMessage != null)
                {
                    result.Score = 0;
                    result.Passed = false;
                    span?.SetStatus(ActivityStatusCode.Error, result.ErrorMessage);
                }
                try
                {
                    await _Server.Database.EvalCaseResults.CreateAsync(result, token).ConfigureAwait(false);
                }
                catch (ConflictException e) when (e.Code == "EvalResultExists")
                {
                    // Another driver (a former leader) recorded this case already.
                    return;
                }
                await _Server.Database.EvalRuns.RecordCaseAsync(run.TenantId, run.Id, result.Passed, result.ErrorMessage != null, result.CostUsd, token).ConfigureAwait(false);
                string scorer = result.CheckResults.Count > 0 ? result.CheckResults[0].Scorer.ToString() : "None";
                GarrisonMetrics.Observe(GarrisonMetricCatalog.EvalCaseDuration, GarrisonMetrics.SecondsSince(startedAt), "scorer", scorer);
            }
        }

        private async Task CompleteAsync(EvalRun run, List<EvalCaseResult> results, Activity? span, CancellationToken token)
        {
            EvalRunTally tally = EvalRunTally.Compute(results, run.Threshold);
            run.Score = tally.Score;
            run.Passed = tally.Passed;
            run.CompletedCases = tally.CompletedCases;
            run.PassedCases = tally.PassedCases;
            run.ErroredCases = tally.ErroredCases;
            run.CostUsd = tally.CostUsd;
            await _Server.Database.EvalRuns.UpdateAsync(run, token).ConfigureAwait(false);
            if (!await _Server.Database.EvalRuns.TransitionAsync(run.TenantId, run.Id, EvalRunStatusEnum.Running, EvalRunStatusEnum.Completed, null, token).ConfigureAwait(false)) return;
            string outcome = tally.Passed == true ? "passed" : tally.Passed == false ? "failed" : "completed";
            GarrisonMetrics.Count(GarrisonMetricCatalog.EvalRuns, "outcome", outcome);
            span?.SetTag("garrison.eval_score", tally.Score);
            span?.SetTag("garrison.eval_outcome", outcome);
            _Logging.Info(_Header + "eval run " + run.Id + " completed: score " + tally.Score.ToString("0.###", CultureInfo.InvariantCulture) + ", " + tally.PassedCases + " of " + tally.CompletedCases + " case(s) passed" + (tally.Passed.HasValue ? ", " + outcome : String.Empty));
        }

        private async Task FailAsync(EvalRun run, string reason, Activity? span, CancellationToken token)
        {
            if (!await _Server.Database.EvalRuns.TransitionAsync(run.TenantId, run.Id, EvalRunStatusEnum.Running, EvalRunStatusEnum.Failed, reason, token).ConfigureAwait(false)) return;
            List<EvalCaseResult> results = await _Server.Database.EvalCaseResults.ListByEvalRunAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
            if (results.Count > 0)
            {
                // A partial score for the cases that ran; a failed run never passes.
                EvalRun? stored = await _Server.Database.EvalRuns.ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
                if (stored != null)
                {
                    stored.Score = EvalRunTally.Compute(results, null).Score;
                    stored.Passed = stored.Threshold.HasValue ? false : null;
                    await _Server.Database.EvalRuns.UpdateAsync(stored, token).ConfigureAwait(false);
                }
            }
            GarrisonMetrics.Count(GarrisonMetricCatalog.EvalRuns, "outcome", "error");
            span?.SetStatus(ActivityStatusCode.Error, reason);
            _Logging.Warn(_Header + "eval run " + run.Id + " failed: " + reason);
        }

        private async Task<Dictionary<string, Run>> RunsByKeyAsync(EvalRun run, CancellationToken token)
        {
            Dictionary<string, Run> byKey = new Dictionary<string, Run>(StringComparer.Ordinal);
            RunFilter filter = new RunFilter { TenantId = run.TenantId, EvalRunId = run.Id, MaxResults = 1000, Ordering = EnumerationOrderEnum.CreatedAscending };
            while (true)
            {
                EnumerationResult<Run> page = await _Server.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
                foreach (Run item in page.Objects)
                {
                    if (!String.IsNullOrEmpty(item.IdempotencyKey) && !byKey.ContainsKey(item.IdempotencyKey)) byKey[item.IdempotencyKey] = item;
                }
                if (page.EndOfResults || page.Objects.Count == 0) return byKey;
                filter.Skip += page.Objects.Count;
            }
        }

        private async Task CancelQuietlyAsync(Run run)
        {
            try
            {
                if (!RunService.IsTerminal(run.Status)) await _Runs.CancelAsync(run, CancellationToken.None).ConfigureAwait(false);
            }
            catch (ConflictException)
            {
                // The run finished meanwhile.
            }
        }

        private static string CaseKey(string evalRunId, int order)
        {
            return "eval:" + evalRunId + ":" + order.ToString(CultureInfo.InvariantCulture);
        }

        private static bool IsTerminal(EvalRunStatusEnum status)
        {
            return status == EvalRunStatusEnum.Completed || status == EvalRunStatusEnum.Failed || status == EvalRunStatusEnum.Cancelled;
        }

        #endregion
    }
}
