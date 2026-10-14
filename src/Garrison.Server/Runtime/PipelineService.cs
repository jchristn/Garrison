namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Diagnostics.Metrics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Channels;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Starts, advances, cancels, retries, and reviews pipeline runs (P12.9). Advancement is idempotent: every step is a
    /// compare-and-set (a stage execution claim on the stage's executions, a link of the created run while the stage has
    /// none, and a pipeline run change on its status and casVersion), and every stage run is created with the idempotency
    /// key pipeline:{pipelineRunId}:{position}:{execution}. A local completion hook (stage runs that finish on this
    /// replica) and the leader's sweep (everything else, including crashes between steps) both call
    /// <see cref="AdvanceAsync"/>, on any number of replicas at once, without creating a stage run twice. Prompts are never
    /// written here: stage runs receive the caller's input, and the earlier stages' outputs reach them only through the
    /// PipelineStage prompt template at compile time (<see cref="CompilationInputsAsync"/>). Thread-safe.
    /// </summary>
    public class PipelineService : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Whether stage runs that finish on this replica advance their pipeline run at once (the completion hook). When
        /// false, only the leader's sweep advances pipeline runs. Default true.
        /// </summary>
        public bool HookEnabled { get; set; } = true;

        /// <summary>
        /// Whether this replica is the leader; only the leader reports the pending review gauge. Null reports always.
        /// </summary>
        public Func<bool>? IsLeader { get; set; } = null;

        /// <summary>
        /// Delay before a stage start refused for a transient reason (for example QuotaExceeded) is tried again, in
        /// milliseconds. Minimum 100, maximum 3600000, default 5000.
        /// </summary>
        public int BlockedRetryMs
        {
            get
            {
                return _BlockedRetryMs;
            }
            set
            {
                _BlockedRetryMs = Math.Clamp(value, 100, 3600000);
            }
        }

        /// <summary>
        /// Most pipeline runs one sweep page reads. The sweep only reads pipeline runs that need work (see
        /// <see cref="IPipelineRunMethods.ListNeedingWorkAsync"/>) and continues from where the previous page or sweep
        /// stopped, so every such pipeline run is visited even when more than this many need work. Minimum 1, maximum
        /// 10000, default 500.
        /// </summary>
        public int SweepBatchSize
        {
            get
            {
                return _SweepBatchSize;
            }
            set
            {
                _SweepBatchSize = Math.Clamp(value, 1, 10000);
            }
        }

        /// <summary>
        /// Most time one sweep spends, in milliseconds. When it runs out, the sweep stops after the current item and the
        /// next sweep continues from there, so a large backlog cannot hold up the leader's other maintenance steps.
        /// Minimum 100, maximum 600000, default 2000.
        /// </summary>
        public int SweepBudgetMs
        {
            get
            {
                return _SweepBudgetMs;
            }
            set
            {
                _SweepBudgetMs = Math.Clamp(value, 100, 600000);
            }
        }

        /// <summary>
        /// Clock that measures the sweep's time budget (<see cref="SweepBudgetMs"/>). Default
        /// <see cref="TimeProvider.System"/>; tests use a manual clock. Deadlines, review expiry, and start backoff use
        /// the system time.
        /// </summary>
        /// <exception cref="ArgumentNullException">Thrown when set to null.</exception>
        public TimeProvider Clock
        {
            get
            {
                return _Clock;
            }
            set
            {
                _Clock = value ?? throw new ArgumentNullException(nameof(value));
            }
        }

        /// <summary>
        /// Completions waiting for the hook consumer.
        /// </summary>
        public int PendingCompletions
        {
            get
            {
                return _Completions.Reader.CanCount ? _Completions.Reader.Count : 0;
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RunService _Runs;
        private readonly RunSignals _Signals;
        private readonly RuntimeOptions _Options;
        private readonly Func<InvocationCompiler> _Compiler;
        private readonly AuditService _Audit;
        private readonly LoggingModule _Logging;
        private readonly Channel<string> _Completions;
        private readonly GaugeRegistration _PendingGauge;
        private readonly string _Header = "[Pipelines] ";
        private CancellationTokenSource? _Cts = null;
        private Task? _Consumer = null;
        private long _PendingReviews = 0;
        private int _BlockedRetryMs = 5000;
        private int _SweepBatchSize = 500;
        private int _SweepBudgetMs = 2000;
        private TimeProvider _Clock = TimeProvider.System;
        private string? _SweepCursor = null;
        private bool _Subscribed = false;
        private bool _Disposed = false;

        private static readonly string _QuotaExceededPrefix = "QuotaExceeded:";

        private static readonly HashSet<PipelineRunStatusEnum> _Terminal = new HashSet<PipelineRunStatusEnum>
        {
            PipelineRunStatusEnum.Succeeded,
            PipelineRunStatusEnum.Failed,
            PipelineRunStatusEnum.Cancelled,
            PipelineRunStatusEnum.TimedOut
        };

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="runs">Run service (stage runs are created and cancelled through it).</param>
        /// <param name="signals">Run signals (the completion hook and pipeline run waiters).</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="compiler">Compiler factory (previews).</param>
        /// <param name="audit">Audit service.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public PipelineService(DatabaseDriverBase database, RunService runs, RunSignals signals, RuntimeOptions options, Func<InvocationCompiler> compiler, AuditService audit, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Compiler = compiler ?? throw new ArgumentNullException(nameof(compiler));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            BoundedChannelOptions channel = new BoundedChannelOptions(10000);
            channel.FullMode = BoundedChannelFullMode.DropWrite;
            channel.SingleReader = true;
            _Completions = Channel.CreateBounded<string>(channel);
            _PendingGauge = GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.PipelineReviewsPending, ObservePending);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether a pipeline run status is terminal.
        /// </summary>
        /// <param name="status">Status.</param>
        /// <returns>True for Succeeded, Failed, Cancelled, and TimedOut.</returns>
        public static bool IsTerminal(PipelineRunStatusEnum status)
        {
            return _Terminal.Contains(status);
        }

        /// <summary>
        /// Whether a finished stage run failed for a reason that clears with time, so its stage waits and starts a new
        /// execution instead of failing the pipeline run: a quota (for example the daily cost allowance) that ran out
        /// between admission and compilation. The scheduler records such a run as CompileFailed with an error message that
        /// starts with "QuotaExceeded:".
        /// </summary>
        /// <param name="stageRun">Finished stage run.</param>
        /// <returns>True for a transient start failure.</returns>
        /// <exception cref="ArgumentNullException">Thrown when stageRun is null.</exception>
        public static bool IsTransientStartFailure(Run stageRun)
        {
            if (stageRun == null) throw new ArgumentNullException(nameof(stageRun));
            return stageRun.Status == RunStatusEnum.Failed
                && stageRun.Outcome == RunOutcomeEnum.CompileFailed
                && (stageRun.ErrorMessage ?? String.Empty).StartsWith(_QuotaExceededPrefix, StringComparison.Ordinal);
        }

        /// <summary>
        /// Subscribe to local run completions and start the hook consumer.
        /// </summary>
        /// <param name="token">Cancellation token that stops the consumer.</param>
        public void Start(CancellationToken token)
        {
            if (_Consumer != null) return;
            _Cts = CancellationTokenSource.CreateLinkedTokenSource(token);
            _Signals.LocalCompleted += OnLocalCompleted;
            _Subscribed = true;
            _Consumer = Task.Run(() => ConsumeAsync(_Cts.Token));
        }

        /// <summary>
        /// Stop the hook consumer.
        /// </summary>
        /// <returns>Task.</returns>
        public async Task StopAsync()
        {
            if (_Subscribed)
            {
                _Signals.LocalCompleted -= OnLocalCompleted;
                _Subscribed = false;
            }
            _Cts?.Cancel();
            if (_Consumer != null)
            {
                try
                {
                    await _Consumer.ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                }
            }
            _Consumer = null;
        }

        /// <summary>
        /// Start a pipeline: snapshot its stages into a new pipeline run and create the first stage run. A repeated
        /// idempotency key returns the existing pipeline run (the same pipeline and input) instead of starting another.
        /// The caller authorizes Pipeline Execute and Agent Execute on every stage agent first.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="pipeline">Pipeline (with stages).</param>
        /// <param name="request">Start request.</param>
        /// <param name="idempotencyKey">Idempotency key, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The pipeline run with stages, reviews, and stage run summaries.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        /// <exception cref="ConflictException">Thrown with PipelineInactive when the pipeline is inactive, or PipelineEmpty when it has no stages.</exception>
        /// <exception cref="IdempotencyConflictException">Thrown when the key belongs to a pipeline run with different content.</exception>
        public async Task<PipelineRun> StartAsync(RequestContext ctx, Pipeline pipeline, PipelineStartRequest request, string? idempotencyKey, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (pipeline == null) throw new ArgumentNullException(nameof(pipeline));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (!pipeline.Active) throw new ConflictException("PipelineInactive", "Pipeline " + pipeline.Name + " is inactive. Activate it before starting it.");
            if (pipeline.Stages.Count == 0) throw new ConflictException("PipelineEmpty", "Pipeline " + pipeline.Name + " has no stages.");

            PipelineRun run = new PipelineRun();
            run.TenantId = pipeline.TenantId;
            run.PipelineId = pipeline.Id;
            run.PipelineName = pipeline.Name;
            run.PipelineVersion = pipeline.Version;
            run.Status = PipelineRunStatusEnum.Running;
            run.Outcome = PipelineRunOutcomeEnum.None;
            run.CurrentPosition = 1;
            run.StageCount = pipeline.Stages.Count;
            run.InputText = request.Input ?? String.Empty;
            run.InputContentType = String.IsNullOrEmpty(request.InputContentType) ? "text/plain" : request.InputContentType;
            ApplyCaller(ctx, run);
            run.IdempotencyKey = String.IsNullOrWhiteSpace(idempotencyKey) ? null : idempotencyKey.Trim();
            run.Priority = request.Priority;
            run.StartedUtc = DateTime.UtcNow;
            run.DeadlineUtc = pipeline.MaxDurationSeconds > 0 ? run.StartedUtc.Value.AddSeconds(pipeline.MaxDurationSeconds) : null;
            run.TraceParent = Activity.Current?.Id;

            if (run.IdempotencyKey != null)
            {
                PipelineRun? existing = await _Database.PipelineRuns.ReadByIdempotencyKeyAsync(run.TenantId, run.CallerId, run.IdempotencyKey, token).ConfigureAwait(false);
                if (existing != null) return await DetailAsync(SameContent(existing, run), token).ConfigureAwait(false);
            }

            foreach (PipelineStage stage in pipeline.Stages.OrderBy(s => s.Position))
            {
                Agent? agent = await _Database.Agents.ReadAsync(pipeline.TenantId, stage.AgentId, token).ConfigureAwait(false);
                PipelineRunStage snapshot = new PipelineRunStage();
                snapshot.Position = run.Stages.Count + 1;
                snapshot.Name = stage.Name;
                snapshot.Description = stage.Description;
                snapshot.AgentId = stage.AgentId;
                snapshot.AgentName = agent?.Name ?? stage.AgentId;
                snapshot.DeploymentId = stage.DeploymentId;
                snapshot.HandoffTemplateId = stage.HandoffTemplateId;
                snapshot.HandoffTemplateVersion = stage.HandoffTemplateVersion;
                snapshot.OutputCharLimit = stage.OutputCharLimit;
                snapshot.MaxAttempts = stage.MaxAttempts;
                snapshot.ContinueOnFailure = stage.ContinueOnFailure;
                snapshot.RequiresReview = stage.RequiresReview;
                snapshot.ReviewTimeoutSeconds = stage.ReviewTimeoutSeconds;
                snapshot.ReviewTimeoutAction = stage.ReviewTimeoutAction;
                snapshot.MaxRevisions = stage.MaxRevisions;
                snapshot.Status = PipelineStageStatusEnum.Pending;
                foreach (PipelineStageParameter parameter in stage.Parameters)
                {
                    snapshot.Parameters.Add(new PipelineRunStageParameter { Name = parameter.Name, Value = parameter.Value });
                }
                run.Stages.Add(snapshot);
            }

            PipelineRun stored = await _Database.PipelineRuns.CreateAsync(run, token).ConfigureAwait(false);
            if (!String.Equals(stored.Id, run.Id, StringComparison.Ordinal))
            {
                // A start with the same key that raced this one (possibly on another replica) created the pipeline run.
                return await DetailAsync(SameContent(stored, run), token).ConfigureAwait(false);
            }

            GarrisonMetrics.Count(GarrisonMetricCatalog.PipelinesStarted, "tenant", run.TenantId, "pipeline", run.PipelineName);
            _Logging.Info(_Header + "pipeline run " + run.Id + " of " + run.PipelineName + " (version " + run.PipelineVersion + ", " + run.StageCount + " stages) started by " + (run.CallerName ?? run.CallerId ?? "unknown") + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "pipeline", run.PipelineName));
            await AdvanceAsync(run.TenantId, run.Id, "api", token).ConfigureAwait(false);
            if (request.Wait)
            {
                PipelineRun? waited = await WaitAsync(run.TenantId, run.Id, request.WaitSeconds, token).ConfigureAwait(false);
                if (waited != null) return await DetailAsync(waited, token).ConfigureAwait(false);
            }
            PipelineRun current = await _Database.PipelineRuns.ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false) ?? run;
            return await DetailAsync(current, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Advance a pipeline run as far as it can go now: claim and create stage runs, react to finished stage runs
        /// (retry, continue, fail, request a review, apply a review decision, move to the next stage, or finish), finish a
        /// requested cancellation, and enforce the deadline. Idempotent and safe to call concurrently from any replica.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="pipelineRunId">Pipeline run identifier.</param>
        /// <param name="trigger">What called it, for metrics: hook, sweep, or api.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call changed the pipeline run or one of its stages.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an identifier is null or empty.</exception>
        public async Task<bool> AdvanceAsync(string tenantId, string pipelineRunId, string trigger, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(pipelineRunId)) throw new ArgumentNullException(nameof(pipelineRunId));
            bool changed = false;
            int limit = 16;
            for (int pass = 0; pass < limit; pass++)
            {
                token.ThrowIfCancellationRequested();
                PipelineRun? run = await _Database.PipelineRuns.ReadAsync(tenantId, pipelineRunId, token).ConfigureAwait(false);
                if (run == null) break;
                limit = Math.Min(400, 16 + run.StageCount * 6);
                if (!await StepAsync(run, token).ConfigureAwait(false)) break;
                changed = true;
            }
            GarrisonMetrics.Count(GarrisonMetricCatalog.PipelineAdvances, "trigger", trigger, "result", changed ? "changed" : "unchanged");
            if (changed) _Signals.Notify(pipelineRunId);
            return changed;
        }

        /// <summary>
        /// Cancel an active pipeline run: it moves to Cancelling, its pending review is cancelled, its current stage run
        /// (with its delegated children) is cancelled, and it ends Cancelled.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="run">Pipeline run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The pipeline run detail.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ConflictException">Thrown with PipelineRunFinished when the pipeline run already ended.</exception>
        public async Task<PipelineRun> CancelAsync(RequestContext ctx, PipelineRun run, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (IsTerminal(run.Status)) throw new ConflictException("PipelineRunFinished", "Pipeline run " + run.Id + " already ended with status " + run.Status + ".");
            if (run.Status != PipelineRunStatusEnum.Cancelling)
            {
                PipelineRunTransition cancelling = new PipelineRunTransition();
                cancelling.PipelineRunId = run.Id;
                cancelling.FromStatuses.Add(PipelineRunStatusEnum.Running);
                cancelling.FromStatuses.Add(PipelineRunStatusEnum.AwaitingReview);
                cancelling.ToStatus = PipelineRunStatusEnum.Cancelling;
                cancelling.CancelRequested = true;
                cancelling.SetErrorMessage = true;
                cancelling.ErrorMessage = "Cancelled by " + (ctx.PrincipalName ?? ctx.PrincipalId ?? "a caller") + ".";
                if (!await _Database.PipelineRuns.TransitionAsync(cancelling, token).ConfigureAwait(false))
                {
                    PipelineRun? now = await _Database.PipelineRuns.ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
                    if (now == null || IsTerminal(now.Status)) throw new ConflictException("PipelineRunFinished", "Pipeline run " + run.Id + " already ended with status " + (now?.Status.ToString() ?? "deleted") + ".");
                }
                else
                {
                    await _Audit.WriteAsync(ctx, AuditEventTypeEnum.PipelineRunCancelled, "PipelineRun", run.Id, "Cancelled pipeline run " + run.Id + " of " + run.PipelineName + " at stage " + run.CurrentPosition + ".", run.TenantId, token).ConfigureAwait(false);
                }
            }
            await AdvanceAsync(run.TenantId, run.Id, "api", token).ConfigureAwait(false);
            PipelineRun current = await _Database.PipelineRuns.ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false) ?? run;
            return await DetailAsync(current, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Resume a Failed, TimedOut, or Cancelled pipeline run at the stage where it stopped, with a new execution of that
        /// stage (attempts start over; earlier stages keep their outputs). The deadline restarts from now.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="run">Pipeline run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The pipeline run detail.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ConflictException">Thrown with PipelineRunNotRetryable when the pipeline run is active or succeeded, PipelineHistoryPruned when the run of an earlier stage no longer exists (retention removed it), or PipelineRunChanged when another request resumed it first.</exception>
        public async Task<PipelineRun> RetryAsync(RequestContext ctx, PipelineRun run, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (run.Status != PipelineRunStatusEnum.Failed && run.Status != PipelineRunStatusEnum.TimedOut && run.Status != PipelineRunStatusEnum.Cancelled)
            {
                throw new ConflictException("PipelineRunNotRetryable", "Only Failed, TimedOut, or Cancelled pipeline runs can be retried; pipeline run " + run.Id + " is " + run.Status + ".");
            }
            PipelineRunStage stage = run.Stages.FirstOrDefault(s => s.Position == run.CurrentPosition)
                ?? throw new ConflictException("PipelineRunNotRetryable", "Pipeline run " + run.Id + " has no stage at position " + run.CurrentPosition + ".");

            // The resumed stage receives the earlier stages' outputs; when retention already removed one of their runs,
            // resuming would silently hand it an empty output.
            foreach (PipelineRunStage earlier in run.Stages.Where(s => s.Position < stage.Position && !String.IsNullOrEmpty(s.CurrentRunId)).OrderBy(s => s.Position))
            {
                if (await _Database.Runs.ReadAsync(run.TenantId, earlier.CurrentRunId!, token).ConfigureAwait(false) == null)
                {
                    throw new ConflictException("PipelineHistoryPruned", "Pipeline run " + run.Id + " cannot be resumed: run " + earlier.CurrentRunId + " of stage " + earlier.Position + " (" + earlier.Name + ") no longer exists, so its output cannot reach stage " + stage.Position + ". Start the pipeline again instead.");
                }
            }

            // Claim the new execution first, while the pipeline run is still terminal, so no advancer acts on the stopped
            // execution; then reopen the pipeline run. The claim also makes a concurrent retry lose.
            PipelineStageClaim claim = new PipelineStageClaim();
            claim.RunStageId = stage.Id;
            claim.ExpectedExecutions = stage.Executions;
            claim.Attempts = 1;
            claim.Revisions = stage.Revisions;
            if (!await _Database.PipelineRuns.ClaimExecutionAsync(claim, token).ConfigureAwait(false))
            {
                throw new ConflictException("PipelineRunChanged", "Pipeline run " + run.Id + " changed while it was being retried. Read it and try again.");
            }

            Pipeline? pipeline = await _Database.Pipelines.ReadAsync(run.TenantId, run.PipelineId, token).ConfigureAwait(false);
            PipelineRunTransition reopen = new PipelineRunTransition();
            reopen.PipelineRunId = run.Id;
            reopen.ExpectedCasVersion = run.CasVersion;
            reopen.FromStatuses.Add(run.Status);
            reopen.ToStatus = PipelineRunStatusEnum.Running;
            reopen.Outcome = PipelineRunOutcomeEnum.None;
            reopen.SetErrorMessage = true;
            reopen.ErrorMessage = null;
            reopen.ClearCompleted = true;
            reopen.CancelRequested = false;
            reopen.SetDeadline = true;
            reopen.DeadlineUtc = pipeline != null && pipeline.MaxDurationSeconds > 0 ? DateTime.UtcNow.AddSeconds(pipeline.MaxDurationSeconds) : run.DeadlineUtc.HasValue && run.StartedUtc.HasValue ? DateTime.UtcNow.Add(run.DeadlineUtc.Value - run.StartedUtc.Value) : null;
            if (!await _Database.PipelineRuns.TransitionAsync(reopen, token).ConfigureAwait(false))
            {
                throw new ConflictException("PipelineRunChanged", "Pipeline run " + run.Id + " changed while it was being retried. Read it and try again.");
            }
            GarrisonMetrics.Count(GarrisonMetricCatalog.PipelineStageExecutions, "tenant", run.TenantId, "pipeline", run.PipelineName, "mode", "resume");
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "PipelineRun", run.Id, "Resumed pipeline run " + run.Id + " of " + run.PipelineName + " at stage " + stage.Position + " (" + stage.Name + ").", run.TenantId, token).ConfigureAwait(false);
            _Logging.Info(_Header + "pipeline run " + run.Id + " resumed at stage " + stage.Position + " by " + (ctx.PrincipalName ?? ctx.PrincipalId ?? "unknown") + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "pipeline", run.PipelineName));
            await AdvanceAsync(run.TenantId, run.Id, "api", token).ConfigureAwait(false);
            PipelineRun current = await _Database.PipelineRuns.ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false) ?? run;
            return await DetailAsync(current, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Decide a pending stage review: Approve (optional notes for the next stage), RequestChanges (comment required;
        /// the stage runs again with the feedback, at most maxRevisions times), or Reject (the pipeline run fails). The
        /// decision is a compare-and-set from Pending; the pipeline run then advances.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="review">Review.</param>
        /// <param name="request">Decision.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The decided review.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the decision is missing, the comment is too long, or RequestChanges has no comment.</exception>
        /// <exception cref="ConflictException">Thrown with ReviewNotPending when the review was already decided, or RevisionLimitReached when the stage used all its revisions.</exception>
        public async Task<PipelineReview> DecideAsync(RequestContext ctx, PipelineReview review, PipelineReviewDecideRequest request, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (review == null) throw new ArgumentNullException(nameof(review));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (!request.Decision.HasValue) throw new ValidationException("decision is required (Approve, RequestChanges, or Reject).", new Dictionary<string, string> { { "decision", "Approve, RequestChanges, or Reject." } });
            string? comment = String.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment!.Trim();
            if (comment != null && comment.Length > 8000) throw new ValidationException("The comment is longer than 8000 characters.", new Dictionary<string, string> { { "comment", "At most 8000 characters." } });
            PipelineReviewDecisionEnum decision = request.Decision.Value;
            if (decision == PipelineReviewDecisionEnum.RequestChanges && comment == null)
            {
                throw new ValidationException("RequestChanges needs a comment: the feedback the stage runs again with.", new Dictionary<string, string> { { "comment", "Required for RequestChanges." } });
            }
            if (review.Status != PipelineReviewStatusEnum.Pending) throw new ConflictException("ReviewNotPending", "Review " + review.Id + " is no longer pending; it is " + review.Status + ".");

            PipelineRun run = await _Database.PipelineRuns.ReadAsync(review.TenantId, review.PipelineRunId, token).ConfigureAwait(false)
                ?? throw new NotFoundException("Pipeline run " + review.PipelineRunId + " of review " + review.Id + " was not found.");
            if (IsTerminal(run.Status) || run.Status == PipelineRunStatusEnum.Cancelling)
            {
                throw new ConflictException("ReviewNotPending", "Review " + review.Id + " can no longer be decided because pipeline run " + run.Id + " is " + run.Status + ".");
            }
            PipelineRunStage? stage = run.Stages.FirstOrDefault(s => s.Id == review.RunStageId);
            if (decision == PipelineReviewDecisionEnum.RequestChanges && stage != null && stage.Revisions >= stage.MaxRevisions)
            {
                throw new ConflictException("RevisionLimitReached", "Stage " + stage.Position + " (" + stage.Name + ") already used its " + stage.MaxRevisions + " revision(s). Approve or reject it instead.");
            }

            PipelineReviewResolution resolution = new PipelineReviewResolution();
            resolution.ReviewId = review.Id;
            resolution.Status = decision == PipelineReviewDecisionEnum.Approve ? PipelineReviewStatusEnum.Approved : decision == PipelineReviewDecisionEnum.RequestChanges ? PipelineReviewStatusEnum.ChangesRequested : PipelineReviewStatusEnum.Rejected;
            resolution.Decision = decision;
            resolution.Source = PipelineReviewSourceEnum.User;
            resolution.Comment = comment;
            resolution.DecidedBy = ctx.PrincipalName ?? ctx.UserId ?? ctx.CredentialId ?? "unknown";
            resolution.DecidedById = ctx.CredentialId ?? ctx.UserId;
            resolution.DecidedUtc = DateTime.UtcNow;
            if (!await ResolveAsync(review, resolution, token).ConfigureAwait(false))
            {
                PipelineReview? latest = await _Database.PipelineReviews.ReadAsync(review.TenantId, review.Id, token).ConfigureAwait(false);
                throw new ConflictException("ReviewNotPending", "Review " + review.Id + " is no longer pending; it is " + (latest?.Status.ToString() ?? "gone") + ".");
            }
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.PipelineReviewDecided, "PipelineReview", review.Id, decision + " stage " + review.Position + " (" + review.StageName + ") of pipeline run " + review.PipelineRunId + (comment == null ? "." : ": " + comment), review.TenantId, token).ConfigureAwait(false);
            _Logging.Info(_Header + "review " + review.Id + " of pipeline run " + review.PipelineRunId + " stage " + review.Position + ": " + decision + " by " + resolution.DecidedBy + " " + GarrisonTracing.LogFields("tenant", review.TenantId, "pipeline", review.PipelineName));
            await AdvanceAsync(review.TenantId, review.PipelineRunId, "api", token).ConfigureAwait(false);
            return await _Database.PipelineReviews.ReadAsync(review.TenantId, review.Id, token).ConfigureAwait(false) ?? review;
        }

        /// <summary>
        /// Wait until a pipeline run ends or waits for a review, or the timeout elapses, then return it.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="pipelineRunId">Pipeline run identifier.</param>
        /// <param name="waitSeconds">Most seconds to wait (0 to 600).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The pipeline run, or null when it no longer exists.</returns>
        public async Task<PipelineRun?> WaitAsync(string tenantId, string pipelineRunId, int waitSeconds, CancellationToken token = default)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(Math.Clamp(waitSeconds, 0, 600));
            using (RunSignalSubscription signal = _Signals.SubscribeCompletion(pipelineRunId))
            {
                while (true)
                {
                    PipelineRun? run = await _Database.PipelineRuns.ReadAsync(tenantId, pipelineRunId, token).ConfigureAwait(false);
                    if (run == null || IsTerminal(run.Status) || run.Status == PipelineRunStatusEnum.AwaitingReview) return run;
                    int remaining = (int)(deadline - DateTime.UtcNow).TotalMilliseconds;
                    if (remaining <= 0) return run;
                    await signal.WaitAsync(Math.Min(remaining, _Options.InvocationWaitPollMs), token).ConfigureAwait(false);
                }
            }
        }

        /// <summary>
        /// Fill in a pipeline run's reviews and stage run summaries (the detail read).
        /// </summary>
        /// <param name="run">Pipeline run (with stages).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The same pipeline run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public async Task<PipelineRun> DetailAsync(PipelineRun run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            run.Reviews = await _Database.PipelineReviews.ListByPipelineRunAsync(run.Id, token).ConfigureAwait(false);
            RunFilter filter = new RunFilter();
            filter.TenantId = run.TenantId;
            filter.PipelineRunId = run.Id;
            filter.MaxResults = 1000;
            filter.Ordering = EnumerationOrderEnum.CreatedAscending;
            EnumerationResult<Run> runs = await _Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
            List<PipelineStageRunSummary> summaries = new List<PipelineStageRunSummary>();
            foreach (Run stageRun in runs.Objects.OrderBy(r => r.PipelinePosition).ThenBy(r => r.PipelineExecution))
            {
                PipelineStageRunSummary summary = new PipelineStageRunSummary();
                summary.RunId = stageRun.Id;
                summary.Position = stageRun.PipelinePosition;
                summary.Execution = stageRun.PipelineExecution;
                summary.AgentName = stageRun.AgentName;
                summary.Status = stageRun.Status;
                summary.Outcome = RunService.IsTerminal(stageRun.Status) ? stageRun.Outcome : null;
                summary.ErrorMessage = stageRun.ErrorMessage;
                summary.CreatedUtc = stageRun.CreatedUtc;
                summary.CompletedUtc = stageRun.CompletedUtc;
                summaries.Add(summary);
            }
            run.Runs = summaries;
            return run;
        }

        /// <summary>
        /// Build the pipeline inputs of a stage run for the compiler (the pipeline.* template root): the earlier stages'
        /// outputs cut to the stage's outputCharLimit, their structured output and artifact references, the approving
        /// reviewer's notes, and the review feedback when this execution is a revision. Called at claim time.
        /// </summary>
        /// <param name="run">Stage run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pipeline inputs, or null for a run outside a pipeline (or whose pipeline run was deleted).</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public async Task<CompilationPipeline?> CompilationInputsAsync(Run run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (String.IsNullOrEmpty(run.PipelineRunId)) return null;
            PipelineRun? pipelineRun = await _Database.PipelineRuns.ReadAsync(run.TenantId, run.PipelineRunId, token).ConfigureAwait(false);
            if (pipelineRun == null) return null;
            PipelineRunStage? stage = pipelineRun.Stages.FirstOrDefault(s => s.Position == run.PipelinePosition);
            if (stage == null) return null;

            CompilationPipeline pipeline = new CompilationPipeline();
            pipeline.PipelineId = pipelineRun.PipelineId;
            pipeline.PipelineName = pipelineRun.PipelineName;
            pipeline.PipelineRunId = pipelineRun.Id;
            pipeline.Position = stage.Position;
            pipeline.StageName = stage.Name;
            pipeline.StageCount = pipelineRun.StageCount;
            pipeline.HandoffTemplateId = stage.HandoffTemplateId;
            pipeline.HandoffTemplateVersion = stage.HandoffTemplateVersion;

            int limit = stage.OutputCharLimit;
            foreach (PipelineRunStage earlier in pipelineRun.Stages.Where(s => s.Position < stage.Position).OrderBy(s => s.Position))
            {
                Run? output = String.IsNullOrEmpty(earlier.CurrentRunId) ? null : await _Database.Runs.ReadAsync(run.TenantId, earlier.CurrentRunId, token).ConfigureAwait(false);
                pipeline.Stages.Add(await StageOutputAsync(earlier, output, limit, token).ConfigureAwait(false));
            }
            pipeline.Previous = pipeline.Stages.Count > 0 ? pipeline.Stages[pipeline.Stages.Count - 1] : null;

            List<PipelineReview> reviews = await _Database.PipelineReviews.ListByPipelineRunAsync(pipelineRun.Id, token).ConfigureAwait(false);
            PipelineRunStage? previousStage = pipelineRun.Stages.FirstOrDefault(s => s.Position == stage.Position - 1);
            if (previousStage != null && previousStage.RequiresReview)
            {
                PipelineReview? approval = reviews.Where(r => r.RunStageId == previousStage.Id && r.Status == PipelineReviewStatusEnum.Approved).OrderByDescending(r => r.Execution).FirstOrDefault();
                if (approval != null && !String.IsNullOrWhiteSpace(approval.Comment)) pipeline.ReviewNotes = approval.Comment;
            }

            // The revision context comes from the latest decided review of this stage below this execution: changes
            // requested, or a rejection (with a comment) followed by a resume of the pipeline run. An approval, an expiry
            // without feedback, or no decision at all means there is nothing to revise.
            List<PipelineReview> decided = reviews
                .Where(r => r.RunStageId == stage.Id && r.Execution < run.PipelineExecution)
                .Where(r => r.Status == PipelineReviewStatusEnum.Approved || r.Status == PipelineReviewStatusEnum.ChangesRequested || r.Status == PipelineReviewStatusEnum.Rejected || r.Status == PipelineReviewStatusEnum.Expired)
                .OrderBy(r => r.Execution)
                .ToList();
            PipelineReview? latest = decided.Count > 0 ? decided[decided.Count - 1] : null;
            if (latest != null && latest.Status != PipelineReviewStatusEnum.Approved && !String.IsNullOrWhiteSpace(latest.Comment))
            {
                Run? reviewed = await _Database.Runs.ReadAsync(run.TenantId, latest.RunId, token).ConfigureAwait(false);
                string previousOutput = reviewed?.ResultText ?? String.Empty;
                CompilationPipelineRevision revision = new CompilationPipelineRevision();
                revision.Number = Math.Max(1, decided.Count(r => r.Status == PipelineReviewStatusEnum.ChangesRequested || r.Status == PipelineReviewStatusEnum.Rejected));
                revision.Feedback = latest.Comment ?? String.Empty;
                revision.Reviewer = latest.DecidedBy;
                revision.PreviousOutputTruncated = previousOutput.Length > limit;
                revision.PreviousOutput = revision.PreviousOutputTruncated ? previousOutput.Substring(0, limit) : previousOutput;
                pipeline.Revision = revision;
            }
            return pipeline;
        }

        /// <summary>
        /// Render the task prompt of every stage of a pipeline from sample input and sample stage outputs, without creating
        /// anything. Each stage uses its own deployment, else the agent's first active deployment with a weight above zero.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="pipeline">Pipeline (with stages).</param>
        /// <param name="request">Sample input and outputs.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Preview.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public async Task<PipelinePreviewResponse> PreviewAsync(string tenantId, Pipeline pipeline, PipelinePreviewRequest request, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (pipeline == null) throw new ArgumentNullException(nameof(pipeline));
            if (request == null) throw new ArgumentNullException(nameof(request));
            PipelinePreviewResponse response = new PipelinePreviewResponse();
            response.PipelineId = pipeline.Id;
            response.PipelineName = pipeline.Name;
            List<CompilationPipelineStage> earlier = new List<CompilationPipelineStage>();
            foreach (PipelineStage stage in pipeline.Stages.OrderBy(s => s.Position))
            {
                token.ThrowIfCancellationRequested();
                PipelinePreviewStage preview = new PipelinePreviewStage();
                preview.Position = stage.Position;
                preview.StageName = stage.Name;
                Agent? agent = await _Database.Agents.ReadAsync(tenantId, stage.AgentId, token).ConfigureAwait(false);
                preview.AgentName = agent?.Name ?? stage.AgentId;
                Deployment? deployment = null;
                if (!String.IsNullOrEmpty(stage.DeploymentId)) deployment = await _Database.Deployments.ReadAsync(tenantId, stage.DeploymentId, token).ConfigureAwait(false);
                else if (agent != null) deployment = (await _Database.Deployments.ListByAgentAsync(tenantId, agent.Id, token).ConfigureAwait(false)).Where(d => d.Active && d.Weight > 0).OrderBy(d => d.Name, StringComparer.Ordinal).FirstOrDefault();
                preview.DeploymentId = deployment?.Id;
                preview.DeploymentName = deployment?.Name;

                CompilationPipeline sample = new CompilationPipeline();
                sample.PipelineId = pipeline.Id;
                sample.PipelineName = pipeline.Name;
                sample.PipelineRunId = "plr_preview";
                sample.Position = stage.Position;
                sample.StageName = stage.Name;
                sample.StageCount = pipeline.Stages.Count;
                sample.HandoffTemplateId = stage.HandoffTemplateId;
                sample.HandoffTemplateVersion = stage.HandoffTemplateVersion;
                sample.Stages = new List<CompilationPipelineStage>(earlier);
                sample.Previous = earlier.Count > 0 ? earlier[earlier.Count - 1] : null;

                if (agent == null || deployment == null)
                {
                    preview.Success = false;
                    preview.ErrorCode = agent == null ? "AgentNotFound" : "NoActiveDeployment";
                    preview.ErrorMessage = agent == null ? "Agent " + stage.AgentId + " was not found." : "Agent " + agent.Name + " has no active deployment with a weight above zero.";
                }
                else
                {
                    try
                    {
                        Dictionary<string, string> parameters = new Dictionary<string, string>(StringComparer.Ordinal);
                        foreach (PipelineStageParameter parameter in stage.Parameters) parameters[parameter.Name] = parameter.Value;
                        CompilationResult result = await _Compiler().PreviewAsync(tenantId, deployment.Id, request.Input ?? String.Empty, parameters, sample, token).ConfigureAwait(false);
                        preview.Prompt = result.TaskPrompt;
                    }
                    catch (CompilationException e)
                    {
                        preview.Success = false;
                        preview.ErrorCode = e.Code;
                        preview.ErrorMessage = e.Message;
                    }
                }
                response.Stages.Add(preview);

                string output = request.SampleOutputs.Count >= stage.Position ? request.SampleOutputs[stage.Position - 1] ?? String.Empty : String.Empty;
                CompilationPipelineStage done = new CompilationPipelineStage();
                done.Position = stage.Position;
                done.StageName = stage.Name;
                done.AgentName = preview.AgentName;
                done.Status = RunStatusEnum.Succeeded.ToString();
                done.Outcome = RunOutcomeEnum.Succeeded.ToString();
                done.OutputTruncated = output.Length > stage.OutputCharLimit;
                done.Output = done.OutputTruncated ? output.Substring(0, stage.OutputCharLimit) : output;
                earlier.Add(done);
            }
            return response;
        }

        /// <summary>
        /// Leader sweep: apply review timeouts, advance the pipeline runs that need work (stage runs that finished without a
        /// local hook, claimed executions without a linked run, blocked stage starts that are due, requested cancellations,
        /// deadlines, and AwaitingReview runs without a pending review), cancel stage runs and pending reviews left under
        /// finished pipeline runs, and refresh the pending review gauge. One failing item is logged and skipped. The sweep
        /// stops early when <see cref="SweepBudgetMs"/> runs out; the next sweep continues where it stopped.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when anything changed.</returns>
        public async Task<bool> SweepAsync(CancellationToken token = default)
        {
            bool any = false;
            DateTime budgetEnd = _Clock.GetUtcNow().UtcDateTime.AddMilliseconds(_SweepBudgetMs);
            foreach (PipelineReview review in await _Database.PipelineReviews.ListExpiredAsync(DateTime.UtcNow, 500, token).ConfigureAwait(false))
            {
                token.ThrowIfCancellationRequested();
                if (OverBudget(budgetEnd)) return any;
                try
                {
                    any |= await ApplyTimeoutAsync(review, token).ConfigureAwait(false);
                    any |= await AdvanceAsync(review.TenantId, review.PipelineRunId, "sweep", token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Warn(_Header + "sweep could not time out review " + review.Id + ": " + e.Message);
                }
            }

            // Page through the pipeline runs that need work after the cursor; at the end, start over from the beginning
            // once and stop at the first pipeline run this sweep already visited, so every pipeline run that needs work is
            // reached within a sweep or, when the budget runs out, a later one.
            string? cursor = Volatile.Read(ref _SweepCursor);
            bool wrapped = cursor == null;
            HashSet<string> visited = new HashSet<string>(StringComparer.Ordinal);
            bool done = false;
            while (!done)
            {
                List<PipelineRun> page = await _Database.PipelineRuns.ListNeedingWorkAsync(DateTime.UtcNow, cursor, _SweepBatchSize, token).ConfigureAwait(false);
                foreach (PipelineRun run in page)
                {
                    token.ThrowIfCancellationRequested();
                    if (!visited.Add(run.Id))
                    {
                        done = true;
                        break;
                    }
                    if (OverBudget(budgetEnd))
                    {
                        Volatile.Write(ref _SweepCursor, cursor);
                        return any;
                    }
                    try
                    {
                        any |= await AdvanceAsync(run.TenantId, run.Id, "sweep", token).ConfigureAwait(false);
                    }
                    catch (Exception e) when (e is not OperationCanceledException)
                    {
                        _Logging.Warn(_Header + "sweep could not advance pipeline run " + run.Id + ": " + e.Message);
                    }
                    cursor = run.Id;
                }
                if (done || page.Count >= _SweepBatchSize) continue;
                if (wrapped) break;
                wrapped = true;
                cursor = null;
            }
            Volatile.Write(ref _SweepCursor, null);

            foreach (string runId in await _Database.PipelineRuns.ListOrphanStageRunIdsAsync(500, token).ConfigureAwait(false))
            {
                token.ThrowIfCancellationRequested();
                if (OverBudget(budgetEnd)) return any;
                try
                {
                    Run? orphan = await _Database.Runs.ReadAsync(runId, token).ConfigureAwait(false);
                    if (orphan != null && await _Runs.CancelForPipelineAsync(orphan, token).ConfigureAwait(false)) any = true;
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Warn(_Header + "sweep could not cancel stage run " + runId + " of a finished pipeline run: " + e.Message);
                }
            }

            foreach (PipelineReview review in await _Database.PipelineReviews.ListOrphanedAsync(500, token).ConfigureAwait(false))
            {
                token.ThrowIfCancellationRequested();
                if (OverBudget(budgetEnd)) return any;
                try
                {
                    any |= await ResolveAsync(review, Cancellation(review, "The pipeline run ended before the review was decided."), token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Warn(_Header + "sweep could not cancel review " + review.Id + " of a finished pipeline run: " + e.Message);
                }
            }

            Interlocked.Exchange(ref _PendingReviews, await _Database.PipelineReviews.CountPendingAsync(null, token).ConfigureAwait(false));
            return any;
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

        #region Protected-Methods

        /// <summary>
        /// Dispose pattern implementation.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                if (_Subscribed)
                {
                    _Signals.LocalCompleted -= OnLocalCompleted;
                    _Subscribed = false;
                }
                _Cts?.Cancel();
                _Cts?.Dispose();
                _PendingGauge.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private bool OverBudget(DateTime budgetEnd)
        {
            if (_Clock.GetUtcNow().UtcDateTime < budgetEnd) return false;
            _Logging.Debug(_Header + "sweep used its " + _SweepBudgetMs + " ms budget; the next sweep continues");
            return true;
        }

        private void OnLocalCompleted(object? sender, string id)
        {
            // Only runs can be pipeline stages; pipeline run completions (plr_) are signals for waiters, not work.
            if (!HookEnabled || String.IsNullOrEmpty(id) || !id.StartsWith("run_", StringComparison.Ordinal)) return;
            _Completions.Writer.TryWrite(id);
        }

        private async Task ConsumeAsync(CancellationToken token)
        {
            try
            {
                while (await _Completions.Reader.WaitToReadAsync(token).ConfigureAwait(false))
                {
                    while (_Completions.Reader.TryRead(out string? runId))
                    {
                        try
                        {
                            Run? run = await _Database.Runs.ReadAsync(runId, token).ConfigureAwait(false);
                            if (run == null || String.IsNullOrEmpty(run.PipelineRunId)) continue;
                            await AdvanceAsync(run.TenantId, run.PipelineRunId, "hook", token).ConfigureAwait(false);
                        }
                        catch (Exception e) when (e is not OperationCanceledException)
                        {
                            // The sweep advances the pipeline run later.
                            _Logging.Warn(_Header + "completion hook for run " + runId + " failed: " + e.Message);
                        }
                    }
                }
            }
            catch (OperationCanceledException)
            {
            }
        }

        private IEnumerable<Measurement<double>> ObservePending()
        {
            if (IsLeader != null && !IsLeader()) return Array.Empty<Measurement<double>>();
            return new Measurement<double>[] { new Measurement<double>(Interlocked.Read(ref _PendingReviews)) };
        }

        /// <summary>
        /// One advancement step on a pipeline run as read (internal for tests that hand it a stale copy).
        /// </summary>
        /// <param name="run">Pipeline run with stages.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the caller should read the pipeline run again and take another step.</returns>
        internal async Task<bool> StepAsync(PipelineRun run, CancellationToken token)
        {
            if (IsTerminal(run.Status)) return false;
            if (run.Status == PipelineRunStatusEnum.Cancelling) return await FinalizeCancelAsync(run, token).ConfigureAwait(false);
            if (run.DeadlineUtc.HasValue && DateTime.UtcNow >= run.DeadlineUtc.Value) return await TimeOutAsync(run, token).ConfigureAwait(false);

            PipelineRunStage? stage = run.Stages.FirstOrDefault(s => s.Position == run.CurrentPosition);
            if (stage == null) return await FinishAsync(run, PipelineRunStatusEnum.Failed, PipelineRunOutcomeEnum.InternalError, "Pipeline run " + run.Id + " has no stage at position " + run.CurrentPosition + ".", null, token).ConfigureAwait(false);

            if (run.Status == PipelineRunStatusEnum.AwaitingReview && stage.Executions > 0)
            {
                // AwaitingReview always has a review of the current execution (it is created before the move). Without one,
                // an advancer stopped between claiming a revision and moving the pipeline run back to Running: finish that.
                PipelineReview? gate = await _Database.PipelineReviews.ReadByExecutionAsync(stage.Id, stage.Executions, token).ConfigureAwait(false);
                if (gate == null)
                {
                    PipelineRunTransition repair = new PipelineRunTransition();
                    repair.PipelineRunId = run.Id;
                    repair.ExpectedCasVersion = run.CasVersion;
                    repair.FromStatuses.Add(PipelineRunStatusEnum.AwaitingReview);
                    repair.ToStatus = PipelineRunStatusEnum.Running;
                    if (await _Database.PipelineRuns.TransitionAsync(repair, token).ConfigureAwait(false))
                    {
                        _Logging.Info(_Header + "pipeline run " + run.Id + " was AwaitingReview without a review of stage " + stage.Position + " execution " + stage.Executions + "; moved back to Running " + GarrisonTracing.LogFields("tenant", run.TenantId, "pipeline", run.PipelineName));
                    }
                    return true;
                }
            }

            if (stage.Executions == 0)
            {
                PipelineStageClaim first = new PipelineStageClaim();
                first.RunStageId = stage.Id;
                first.ExpectedExecutions = 0;
                first.Attempts = 1;
                first.Revisions = 0;
                if (await _Database.PipelineRuns.ClaimExecutionAsync(first, token).ConfigureAwait(false))
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.PipelineStageExecutions, "tenant", run.TenantId, "pipeline", run.PipelineName, "mode", "first");
                }
                return true;
            }

            if (String.IsNullOrEmpty(stage.CurrentRunId))
            {
                if (stage.NextAttemptUtc.HasValue && DateTime.UtcNow < stage.NextAttemptUtc.Value) return false;
                return await CreateStageRunAsync(run, stage, token).ConfigureAwait(false);
            }

            Run? stageRun = await _Database.Runs.ReadAsync(run.TenantId, stage.CurrentRunId, token).ConfigureAwait(false);
            if (stageRun == null)
            {
                return await FinishAsync(run, PipelineRunStatusEnum.Failed, PipelineRunOutcomeEnum.InternalError, "Run " + stage.CurrentRunId + " of stage " + stage.Position + " (" + stage.Name + ") was deleted.", null, token).ConfigureAwait(false);
            }
            if (!RunService.IsTerminal(stageRun.Status)) return false;
            return await OnStageRunFinishedAsync(run, stage, stageRun, token).ConfigureAwait(false);
        }

        private async Task<bool> CreateStageRunAsync(PipelineRun run, PipelineRunStage stage, CancellationToken token)
        {
            int execution = stage.Executions;

            // A run created for this execution before a crash (or by a concurrent advancer) is linked, never duplicated. The
            // lookup has no time window, unlike the run idempotency key, and a unique index backs it.
            Run? previous = await _Database.Runs.ReadByPipelineExecutionAsync(run.TenantId, run.Id, stage.Position, execution, token).ConfigureAwait(false);
            if (previous != null) return await LinkStageRunAsync(run, stage, execution, previous, token).ConfigureAwait(false);

            Agent? agent = await _Database.Agents.ReadAsync(run.TenantId, stage.AgentId, token).ConfigureAwait(false);
            if (agent == null) return await FailStartAsync(run, stage, "AgentNotFound: agent " + stage.AgentName + " of stage " + stage.Position + " (" + stage.Name + ") was not found.", token).ConfigureAwait(false);

            RunCreateContext create = new RunCreateContext();
            create.TenantId = run.TenantId;
            create.Agent = agent;
            create.DeploymentId = stage.DeploymentId;
            create.Input = run.InputText;
            create.InputContentType = run.InputContentType;
            foreach (PipelineRunStageParameter parameter in stage.Parameters) create.Parameters[parameter.Name] = parameter.Value;
            create.Priority = run.Priority;
            create.Kind = RunKindEnum.Pipeline;
            create.CallerType = run.CallerType;
            create.CallerId = run.CallerId;
            create.CallerName = run.CallerName;
            create.IdempotencyKey = "pipeline:" + run.Id + ":" + stage.Position + ":" + execution;
            create.Surface = "pipeline";
            create.PipelineRunId = run.Id;
            create.PipelinePosition = stage.Position;
            create.PipelineExecution = execution;

            Run created;
            try
            {
                created = await _Runs.CreateAsync(create, token).ConfigureAwait(false);
            }
            catch (QuotaExceededException e)
            {
                return await BlockAsync(run, stage, execution, e.Code + ": " + e.Message, token).ConfigureAwait(false);
            }
            catch (Exception e) when (DatabaseFailures.IsUniqueViolation(e))
            {
                // Another advancer inserted the run of this execution between the lookup and the insert.
                Run? winner = await _Database.Runs.ReadByPipelineExecutionAsync(run.TenantId, run.Id, stage.Position, execution, token).ConfigureAwait(false);
                if (winner == null) return await BlockAsync(run, stage, execution, "Unavailable: " + e.Message, token).ConfigureAwait(false);
                return await LinkStageRunAsync(run, stage, execution, winner, token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is NotFoundException || e is ValidationException || e is ConflictException)
            {
                string code = e is ConflictException conflict ? conflict.Code : e is ValidationException validation ? validation.Code : "NotFound";
                return await FailStartAsync(run, stage, code + ": " + e.Message, token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                // A database or transport problem: try again later rather than failing the pipeline.
                return await BlockAsync(run, stage, execution, "Unavailable: " + e.Message, token).ConfigureAwait(false);
            }

            return await LinkStageRunAsync(run, stage, execution, created, token).ConfigureAwait(false);
        }

        private async Task<bool> LinkStageRunAsync(PipelineRun run, PipelineRunStage stage, int execution, Run created, CancellationToken token)
        {
            await _Database.PipelineRuns.LinkRunAsync(stage.Id, execution, created.Id, token).ConfigureAwait(false);

            // Touch the pipeline run with a compare-and-set: losing to a cancellation or deadline here means the new stage
            // run must not keep running (the sweep also cancels such runs after a crash).
            PipelineRunTransition touch = new PipelineRunTransition();
            touch.PipelineRunId = run.Id;
            touch.ExpectedCasVersion = run.CasVersion;
            touch.FromStatuses.Add(run.Status);
            touch.ToStatus = run.Status;
            if (!await _Database.PipelineRuns.TransitionAsync(touch, token).ConfigureAwait(false))
            {
                PipelineRun? current = await _Database.PipelineRuns.ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
                if (current == null || (current.Status != PipelineRunStatusEnum.Running && current.Status != PipelineRunStatusEnum.AwaitingReview))
                {
                    await _Runs.CancelForPipelineAsync(created, token).ConfigureAwait(false);
                }
            }
            return true;
        }

        private async Task<bool> BlockAsync(PipelineRun run, PipelineRunStage stage, int execution, string reason, CancellationToken token)
        {
            GarrisonMetrics.Count(GarrisonMetricCatalog.PipelineStageStartFailures, "tenant", run.TenantId, "pipeline", run.PipelineName, "kind", "transient");
            await _Database.PipelineRuns.BlockAsync(stage.Id, execution, reason, DateTime.UtcNow.AddMilliseconds(_BlockedRetryMs), token).ConfigureAwait(false);
            _Logging.Info(_Header + "pipeline run " + run.Id + " stage " + stage.Position + " could not start yet (" + reason + "); retrying in " + _BlockedRetryMs + " ms " + GarrisonTracing.LogFields("tenant", run.TenantId, "pipeline", run.PipelineName));
            return false;
        }

        private async Task<bool> FailStartAsync(PipelineRun run, PipelineRunStage stage, string message, CancellationToken token)
        {
            GarrisonMetrics.Count(GarrisonMetricCatalog.PipelineStageStartFailures, "tenant", run.TenantId, "pipeline", run.PipelineName, "kind", "permanent");
            await _Database.PipelineRuns.SetStageStatusAsync(stage.Id, stage.Executions, PipelineStageStatusEnum.Failed, token).ConfigureAwait(false);
            return await FinishAsync(run, PipelineRunStatusEnum.Failed, PipelineRunOutcomeEnum.StageStartFailed, "Stage " + stage.Position + " (" + stage.Name + ") could not start: " + message, null, token).ConfigureAwait(false);
        }

        private async Task<bool> OnStageRunFinishedAsync(PipelineRun run, PipelineRunStage stage, Run stageRun, CancellationToken token)
        {
            int execution = stage.Executions;
            if (stageRun.Status == RunStatusEnum.Cancelled)
            {
                // Cancelling a stage run directly cancels its pipeline run.
                await _Database.PipelineRuns.SetStageStatusAsync(stage.Id, execution, PipelineStageStatusEnum.Cancelled, token).ConfigureAwait(false);
                return await FinishAsync(run, PipelineRunStatusEnum.Cancelled, PipelineRunOutcomeEnum.Cancelled, "Stage run " + stageRun.Id + " of stage " + stage.Position + " (" + stage.Name + ") was cancelled.", null, token).ConfigureAwait(false);
            }

            bool succeeded = stageRun.Status == RunStatusEnum.Succeeded;
            if (!succeeded)
            {
                if (IsTransientStartFailure(stageRun))
                {
                    // A quota ran out between admission and compilation: wait and start a new execution, like a refusal at
                    // admission, without using up an attempt.
                    PipelineStageClaim wait = new PipelineStageClaim();
                    wait.RunStageId = stage.Id;
                    wait.ExpectedExecutions = execution;
                    wait.Attempts = stage.Attempts;
                    wait.Revisions = stage.Revisions;
                    wait.BlockedReason = stageRun.ErrorMessage;
                    wait.NextAttemptUtc = DateTime.UtcNow.AddMilliseconds(_BlockedRetryMs);
                    if (await _Database.PipelineRuns.ClaimExecutionAsync(wait, token).ConfigureAwait(false))
                    {
                        GarrisonMetrics.Count(GarrisonMetricCatalog.PipelineStageStartFailures, "tenant", run.TenantId, "pipeline", run.PipelineName, "kind", "transient");
                        _Logging.Info(_Header + "pipeline run " + run.Id + " stage " + stage.Position + " run " + stageRun.Id + " could not start (" + stageRun.ErrorMessage + "); retrying in " + _BlockedRetryMs + " ms " + GarrisonTracing.LogFields("tenant", run.TenantId, "pipeline", run.PipelineName));
                    }
                    return true;
                }
                bool startFailure = stageRun.Status == RunStatusEnum.Rejected || stageRun.Outcome == RunOutcomeEnum.CompileFailed || stageRun.Outcome == RunOutcomeEnum.Rejected;
                if (startFailure) return await FailStartAsync(run, stage, (stageRun.ErrorMessage ?? stageRun.Outcome.ToString()), token).ConfigureAwait(false);
                if (stage.Attempts < stage.MaxAttempts)
                {
                    PipelineStageClaim retry = new PipelineStageClaim();
                    retry.RunStageId = stage.Id;
                    retry.ExpectedExecutions = execution;
                    retry.Attempts = stage.Attempts + 1;
                    retry.Revisions = stage.Revisions;
                    if (await _Database.PipelineRuns.ClaimExecutionAsync(retry, token).ConfigureAwait(false))
                    {
                        GarrisonMetrics.Count(GarrisonMetricCatalog.PipelineStageExecutions, "tenant", run.TenantId, "pipeline", run.PipelineName, "mode", "retry");
                        _Logging.Info(_Header + "pipeline run " + run.Id + " stage " + stage.Position + " attempt " + stage.Attempts + " ended " + stageRun.Status + "; starting attempt " + retry.Attempts + " of " + stage.MaxAttempts + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "pipeline", run.PipelineName));
                    }
                    return true;
                }
                if (!stage.ContinueOnFailure)
                {
                    await _Database.PipelineRuns.SetStageStatusAsync(stage.Id, execution, PipelineStageStatusEnum.Failed, token).ConfigureAwait(false);
                    return await FinishAsync(run, PipelineRunStatusEnum.Failed, PipelineRunOutcomeEnum.StageFailed, "Stage " + stage.Position + " (" + stage.Name + ") failed after " + stage.Attempts + " attempt(s): " + (stageRun.ErrorMessage ?? stageRun.Outcome.ToString()), null, token).ConfigureAwait(false);
                }
            }

            if (!stage.RequiresReview) return await CompleteStageAsync(run, stage, stageRun, succeeded, token).ConfigureAwait(false);

            PipelineReview? review = await _Database.PipelineReviews.ReadByExecutionAsync(stage.Id, execution, token).ConfigureAwait(false);
            if (review == null)
            {
                review = new PipelineReview();
                review.TenantId = run.TenantId;
                review.PipelineRunId = run.Id;
                review.PipelineId = run.PipelineId;
                review.PipelineName = run.PipelineName;
                review.RunStageId = stage.Id;
                review.Position = stage.Position;
                review.StageName = stage.Name;
                review.RunId = stageRun.Id;
                review.Execution = execution;
                review.Status = PipelineReviewStatusEnum.Pending;
                review.TimeoutAction = stage.ReviewTimeoutAction;
                review.RequestedUtc = DateTime.UtcNow;
                review.ExpiresUtc = stage.ReviewTimeoutSeconds > 0 ? review.RequestedUtc.AddSeconds(stage.ReviewTimeoutSeconds) : null;
                if (await _Database.PipelineReviews.CreateIfAbsentAsync(review, token).ConfigureAwait(false))
                {
                    _Logging.Info(_Header + "pipeline run " + run.Id + " stage " + stage.Position + " (" + stage.Name + ") waits for review " + review.Id + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "pipeline", run.PipelineName));
                }
                return true;
            }

            switch (review.Status)
            {
                case PipelineReviewStatusEnum.Pending:
                    if (review.ExpiresUtc.HasValue && DateTime.UtcNow >= review.ExpiresUtc.Value) return await ApplyTimeoutAsync(review, token).ConfigureAwait(false);
                    if (run.Status == PipelineRunStatusEnum.AwaitingReview) return false;
                    await _Database.PipelineRuns.SetStageStatusAsync(stage.Id, execution, PipelineStageStatusEnum.AwaitingReview, token).ConfigureAwait(false);
                    PipelineRunTransition awaiting = new PipelineRunTransition();
                    awaiting.PipelineRunId = run.Id;
                    awaiting.ExpectedCasVersion = run.CasVersion;
                    awaiting.FromStatuses.Add(PipelineRunStatusEnum.Running);
                    awaiting.ToStatus = PipelineRunStatusEnum.AwaitingReview;
                    bool waiting = await _Database.PipelineRuns.TransitionAsync(awaiting, token).ConfigureAwait(false);
                    if (waiting) _Signals.Complete(run.Id);
                    return true;
                case PipelineReviewStatusEnum.Approved:
                    return await CompleteStageAsync(run, stage, stageRun, succeeded, token).ConfigureAwait(false);
                case PipelineReviewStatusEnum.ChangesRequested:
                    PipelineStageClaim revision = new PipelineStageClaim();
                    revision.RunStageId = stage.Id;
                    revision.ExpectedExecutions = execution;
                    revision.Attempts = 1;
                    revision.Revisions = stage.Revisions + 1;
                    if (await _Database.PipelineRuns.ClaimExecutionAsync(revision, token).ConfigureAwait(false))
                    {
                        GarrisonMetrics.Count(GarrisonMetricCatalog.PipelineStageExecutions, "tenant", run.TenantId, "pipeline", run.PipelineName, "mode", "revision");
                    }
                    // A crash between the claim and this move leaves AwaitingReview without a review of the new execution;
                    // StepAsync repairs that.
                    PipelineRunTransition resume = new PipelineRunTransition();
                    resume.PipelineRunId = run.Id;
                    resume.ExpectedCasVersion = run.CasVersion;
                    resume.FromStatuses.Add(PipelineRunStatusEnum.AwaitingReview);
                    resume.ToStatus = PipelineRunStatusEnum.Running;
                    await _Database.PipelineRuns.TransitionAsync(resume, token).ConfigureAwait(false);
                    return true;
                case PipelineReviewStatusEnum.Rejected:
                    await _Database.PipelineRuns.SetStageStatusAsync(stage.Id, execution, PipelineStageStatusEnum.Failed, token).ConfigureAwait(false);
                    return await FinishAsync(run, PipelineRunStatusEnum.Failed, PipelineRunOutcomeEnum.ReviewRejected, (review.DecidedBy ?? "A reviewer") + " rejected stage " + stage.Position + " (" + stage.Name + ")" + (String.IsNullOrEmpty(review.Comment) ? "." : ": " + review.Comment), null, token).ConfigureAwait(false);
                case PipelineReviewStatusEnum.Expired:
                    await _Database.PipelineRuns.SetStageStatusAsync(stage.Id, execution, PipelineStageStatusEnum.Failed, token).ConfigureAwait(false);
                    return await FinishAsync(run, PipelineRunStatusEnum.Failed, PipelineRunOutcomeEnum.ReviewExpired, "The review of stage " + stage.Position + " (" + stage.Name + ") timed out after " + stage.ReviewTimeoutSeconds + " seconds and its timeout action is Reject.", null, token).ConfigureAwait(false);
                default:
                    return false;
            }
        }

        private async Task<bool> CompleteStageAsync(PipelineRun run, PipelineRunStage stage, Run stageRun, bool succeeded, CancellationToken token)
        {
            await _Database.PipelineRuns.SetStageStatusAsync(stage.Id, stage.Executions, succeeded ? PipelineStageStatusEnum.Succeeded : PipelineStageStatusEnum.Failed, token).ConfigureAwait(false);
            if (stage.Position >= run.StageCount)
            {
                if (succeeded) return await FinishAsync(run, PipelineRunStatusEnum.Succeeded, PipelineRunOutcomeEnum.Succeeded, null, stageRun.Id, token).ConfigureAwait(false);
                return await FinishAsync(run, PipelineRunStatusEnum.Failed, PipelineRunOutcomeEnum.StageFailed, "The last stage, " + stage.Position + " (" + stage.Name + "), failed: " + (stageRun.ErrorMessage ?? stageRun.Outcome.ToString()), null, token).ConfigureAwait(false);
            }
            PipelineRunTransition next = new PipelineRunTransition();
            next.PipelineRunId = run.Id;
            next.ExpectedCasVersion = run.CasVersion;
            next.FromStatuses.Add(PipelineRunStatusEnum.Running);
            next.FromStatuses.Add(PipelineRunStatusEnum.AwaitingReview);
            next.ToStatus = PipelineRunStatusEnum.Running;
            next.CurrentPosition = stage.Position + 1;
            if (await _Database.PipelineRuns.TransitionAsync(next, token).ConfigureAwait(false))
            {
                _Logging.Info(_Header + "pipeline run " + run.Id + " stage " + stage.Position + " (" + stage.Name + ") " + (succeeded ? "succeeded" : "failed and continues") + "; moving to stage " + next.CurrentPosition + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "pipeline", run.PipelineName));
            }
            return true;
        }

        private async Task<bool> FinalizeCancelAsync(PipelineRun run, CancellationToken token)
        {
            await CancelPendingReviewsAsync(run, "The pipeline run was cancelled.", token).ConfigureAwait(false);
            PipelineRunStage? stage = run.Stages.FirstOrDefault(s => s.Position == run.CurrentPosition);
            if (stage != null)
            {
                await CancelStageRunAsync(run, stage, token).ConfigureAwait(false);
                if (stage.Status != PipelineStageStatusEnum.Succeeded && stage.Status != PipelineStageStatusEnum.Failed && stage.Status != PipelineStageStatusEnum.Pending)
                {
                    await _Database.PipelineRuns.SetStageStatusAsync(stage.Id, stage.Executions, PipelineStageStatusEnum.Cancelled, token).ConfigureAwait(false);
                }
            }
            return await FinishAsync(run, PipelineRunStatusEnum.Cancelled, PipelineRunOutcomeEnum.Cancelled, run.ErrorMessage ?? "The pipeline run was cancelled.", null, token).ConfigureAwait(false);
        }

        private async Task<bool> TimeOutAsync(PipelineRun run, CancellationToken token)
        {
            // End the pipeline run first, so the cancelled stage run's completion cannot be read as a direct cancellation.
            string message = "The pipeline run passed its deadline (" + run.DeadlineUtc!.Value.ToString("yyyy-MM-ddTHH:mm:ssZ", System.Globalization.CultureInfo.InvariantCulture) + ").";
            // Only the advancer whose transition applied cancels anything: a loser read a stale copy (a retry may already
            // have reopened the pipeline run with a new execution and deadline).
            if (!await TryFinishAsync(run, PipelineRunStatusEnum.TimedOut, PipelineRunOutcomeEnum.TimedOut, message, null, token).ConfigureAwait(false)) return true;
            await CancelPendingReviewsAsync(run, message, token).ConfigureAwait(false);
            PipelineRunStage? stage = run.Stages.FirstOrDefault(s => s.Position == run.CurrentPosition);
            if (stage != null)
            {
                await CancelStageRunAsync(run, stage, token).ConfigureAwait(false);
                if (stage.Status == PipelineStageStatusEnum.Running || stage.Status == PipelineStageStatusEnum.AwaitingReview)
                {
                    await _Database.PipelineRuns.SetStageStatusAsync(stage.Id, stage.Executions, PipelineStageStatusEnum.Cancelled, token).ConfigureAwait(false);
                }
            }
            return true;
        }

        private async Task CancelStageRunAsync(PipelineRun run, PipelineRunStage stage, CancellationToken token)
        {
            if (String.IsNullOrEmpty(stage.CurrentRunId)) return;
            Run? stageRun = await _Database.Runs.ReadAsync(run.TenantId, stage.CurrentRunId, token).ConfigureAwait(false);
            if (stageRun != null) await _Runs.CancelForPipelineAsync(stageRun, token).ConfigureAwait(false);
        }

        private async Task CancelPendingReviewsAsync(PipelineRun run, string reason, CancellationToken token)
        {
            foreach (PipelineReview review in await _Database.PipelineReviews.ListByPipelineRunAsync(run.Id, token).ConfigureAwait(false))
            {
                if (review.Status == PipelineReviewStatusEnum.Pending) await ResolveAsync(review, Cancellation(review, reason), token).ConfigureAwait(false);
            }
        }

        private async Task<bool> FinishAsync(PipelineRun run, PipelineRunStatusEnum status, PipelineRunOutcomeEnum outcome, string? message, string? finalRunId, CancellationToken token)
        {
            // Whether or not the transition applied, the caller reads the pipeline run again.
            await TryFinishAsync(run, status, outcome, message, finalRunId, token).ConfigureAwait(false);
            return true;
        }

        private async Task<bool> TryFinishAsync(PipelineRun run, PipelineRunStatusEnum status, PipelineRunOutcomeEnum outcome, string? message, string? finalRunId, CancellationToken token)
        {
            PipelineRunTransition finish = new PipelineRunTransition();
            finish.PipelineRunId = run.Id;
            finish.ExpectedCasVersion = run.CasVersion;
            finish.FromStatuses.Add(run.Status);
            finish.ToStatus = status;
            finish.Outcome = outcome;
            finish.SetErrorMessage = true;
            finish.ErrorMessage = message;
            finish.FinalRunId = finalRunId;
            finish.SetCompleted = true;
            if (!await _Database.PipelineRuns.TransitionAsync(finish, token).ConfigureAwait(false)) return false;

            GarrisonMetrics.Count(GarrisonMetricCatalog.PipelinesFinished, "tenant", run.TenantId, "pipeline", run.PipelineName, "outcome", outcome.ToString());
            _Logging.Info(_Header + "pipeline run " + run.Id + " of " + run.PipelineName + " ended " + status + " (" + outcome + ")" + (message == null ? String.Empty : ": " + message) + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "pipeline", run.PipelineName));
            if (status != PipelineRunStatusEnum.Cancelled && status != PipelineRunStatusEnum.TimedOut) await CancelPendingReviewsAsync(run, "The pipeline run ended.", token).ConfigureAwait(false);
            _Signals.Complete(run.Id);
            return true;
        }

        private async Task<bool> ApplyTimeoutAsync(PipelineReview review, CancellationToken token)
        {
            bool approve = review.TimeoutAction == PipelineReviewDecisionEnum.Approve;
            PipelineReviewResolution resolution = new PipelineReviewResolution();
            resolution.ReviewId = review.Id;
            resolution.Status = approve ? PipelineReviewStatusEnum.Approved : PipelineReviewStatusEnum.Expired;
            resolution.Decision = approve ? PipelineReviewDecisionEnum.Approve : PipelineReviewDecisionEnum.Reject;
            resolution.Source = PipelineReviewSourceEnum.Timeout;
            resolution.DecidedBy = "timeout";
            resolution.DecidedUtc = DateTime.UtcNow;
            return await ResolveAsync(review, resolution, token).ConfigureAwait(false);
        }

        private static PipelineReviewResolution Cancellation(PipelineReview review, string reason)
        {
            PipelineReviewResolution resolution = new PipelineReviewResolution();
            resolution.ReviewId = review.Id;
            resolution.Status = PipelineReviewStatusEnum.Cancelled;
            resolution.Decision = null;
            resolution.Source = PipelineReviewSourceEnum.Cancelled;
            resolution.Comment = reason;
            resolution.DecidedBy = "system";
            resolution.DecidedUtc = DateTime.UtcNow;
            return resolution;
        }

        private async Task<bool> ResolveAsync(PipelineReview review, PipelineReviewResolution resolution, CancellationToken token)
        {
            if (!await _Database.PipelineReviews.ResolveAsync(resolution, token).ConfigureAwait(false)) return false;
            string source = resolution.Source.ToString().ToLowerInvariant();
            string decision = resolution.Decision?.ToString().ToLowerInvariant() ?? "none";
            GarrisonMetrics.Count(GarrisonMetricCatalog.PipelineReviewsDecided, 1, GarrisonMetrics.Tags("tenant", review.TenantId, "pipeline", review.PipelineName, "source", source, "decision", decision));
            GarrisonMetrics.Observe(GarrisonMetricCatalog.PipelineReviewWait, Math.Max(0, (resolution.DecidedUtc - review.RequestedUtc).TotalSeconds), "source", source, "decision", decision);
            if (Interlocked.Decrement(ref _PendingReviews) < 0) Interlocked.Exchange(ref _PendingReviews, 0);
            if (resolution.Source != PipelineReviewSourceEnum.User)
            {
                _Logging.Info(_Header + "review " + review.Id + " of pipeline run " + review.PipelineRunId + " " + resolution.Status.ToString().ToLowerInvariant() + " (" + source + ") " + GarrisonTracing.LogFields("tenant", review.TenantId, "pipeline", review.PipelineName));
            }
            _Signals.Notify(review.PipelineRunId);
            return true;
        }

        private async Task<CompilationPipelineStage> StageOutputAsync(PipelineRunStage stage, Run? output, int limit, CancellationToken token)
        {
            CompilationPipelineStage item = new CompilationPipelineStage();
            item.Position = stage.Position;
            item.StageName = stage.Name;
            item.AgentName = output?.AgentName ?? stage.AgentName;
            item.Status = output?.Status.ToString() ?? stage.Status.ToString();
            item.Outcome = output != null && RunService.IsTerminal(output.Status) ? output.Outcome.ToString() : null;
            string text = output?.ResultText ?? String.Empty;
            item.OutputTruncated = text.Length > limit;
            item.Output = item.OutputTruncated ? text.Substring(0, limit) : text;
            item.Structured = output != null && !String.IsNullOrWhiteSpace(output.StructuredOutputJson) && output.StructuredOutputJson!.Length <= limit ? output.StructuredOutputJson : null;
            if (output != null)
            {
                EnumerationQuery query = new EnumerationQuery();
                query.MaxResults = 100;
                query.Ordering = EnumerationOrderEnum.CreatedAscending;
                EnumerationResult<Artifact> artifacts = await _Database.Artifacts.EnumerateAsync(output.TenantId, query, output.Id, null, token).ConfigureAwait(false);
                foreach (Artifact artifact in artifacts.Objects)
                {
                    CompilationPipelineArtifact reference = new CompilationPipelineArtifact();
                    reference.Id = artifact.Id;
                    reference.Name = artifact.Name;
                    reference.MediaType = artifact.MediaType;
                    reference.SizeBytes = artifact.SizeBytes;
                    item.Artifacts.Add(reference);
                }
            }
            return item;
        }

        private static PipelineRun SameContent(PipelineRun existing, PipelineRun requested)
        {
            if (existing.PipelineId == requested.PipelineId && String.Equals(existing.InputText, requested.InputText, StringComparison.Ordinal)) return existing;
            string key = requested.IdempotencyKey ?? String.Empty;
            throw new IdempotencyConflictException(key, existing.Id,
                "Idempotency key " + key + " was already used for pipeline run " + existing.Id + " with a different pipeline or input. Use a new key for a new request; resend identical content to get the existing pipeline run.");
        }

        private static void ApplyCaller(RequestContext ctx, PipelineRun run)
        {
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                run.CallerType = ctx.OriginPrincipalType ?? PrincipalTypeEnum.User;
                run.CallerId = ctx.OriginPrincipalId;
                run.CallerName = ctx.PrincipalName;
                return;
            }
            run.CallerType = ctx.PrincipalType;
            run.CallerId = ctx.PrincipalId;
            run.CallerName = ctx.PrincipalName;
        }

        #endregion
    }
}
