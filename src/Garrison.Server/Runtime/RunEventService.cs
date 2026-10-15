namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Radiant;
    using SyslogLogging;

    /// <summary>
    /// Fenced ingestion of worker reports (started, events, complete) and event reads. Thread-safe.
    /// </summary>
    public class RunEventService
    {
        #region Public-Members

        /// <summary>
        /// Structured output validation and repair. When null, completion reports are recorded without validating
        /// output against the agent's output schema. Default null; the runtime module sets it.
        /// </summary>
        public StructuredOutputService? StructuredOutput
        {
            get
            {
                return _StructuredOutput;
            }
            set
            {
                _StructuredOutput = value;
            }
        }

        /// <summary>
        /// Permission approvals (P12.3); pending approvals of runs that stop here are cancelled. Null (the default)
        /// leaves them to the leader's sweep.
        /// </summary>
        public ApprovalService? Approvals { get; set; } = null;

        /// <summary>
        /// Logging for run lifecycle lines (each carries run=&lt;runId&gt; trace=&lt;traceId&gt;). Null disables them.
        /// Default null; the runtime module sets it.
        /// </summary>
        public LoggingModule? Logging
        {
            get
            {
                return _Logging;
            }
            set
            {
                _Logging = value;
            }
        }

        /// <summary>
        /// Conversation service: a successful conversation turn records its harness session and node, and a turn whose
        /// worker found the conversation's directories gone is requeued as a fallback. Null records reports without
        /// conversation handling. Default null; the runtime module sets it.
        /// </summary>
        public ConversationService? Conversations { get; set; } = null;

        #endregion

        /// <summary>Optional model-price estimator, configured by the runtime module.</summary>
        public RunCostEstimationService? CostEstimation { get; set; } = null;

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RunSignals _Signals;
        private readonly GarrisonTelemetry _Telemetry;
        private StructuredOutputService? _StructuredOutput = null;
        private LoggingModule? _Logging = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="signals">Run signals.</param>
        /// <param name="telemetry">Telemetry.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public RunEventService(DatabaseDriverBase database, RunSignals signals, GarrisonTelemetry telemetry)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
            _Telemetry = telemetry ?? throw new ArgumentNullException(nameof(telemetry));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Record that the harness started.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="request">Report.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ConflictException">Thrown with code StaleLease when the node no longer holds the lease.</exception>
        public async Task StartedAsync(string runId, RunStartedRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            RunTransition transition = new RunTransition();
            transition.RunId = runId;
            transition.FromStatuses.Add(RunStatusEnum.Leased);
            transition.ToStatus = RunStatusEnum.Running;
            transition.Epoch = request.Epoch;
            transition.NodeId = request.NodeId;
            transition.SetStarted = true;
            if (await _Database.Runs.TransitionAsync(transition, token).ConfigureAwait(false))
            {
                _Signals.Notify(runId);
                return;
            }

            Run? run = await _Database.Runs.ReadRowAsync(runId, token).ConfigureAwait(false);
            bool alreadyRunning = run != null && run.LeaseNodeId == request.NodeId && run.LeaseEpoch == request.Epoch && (run.Status == RunStatusEnum.Running || run.Status == RunStatusEnum.Cancelling);
            if (!alreadyRunning) throw new ConflictException("StaleLease", "Run " + runId + " is not leased to node " + request.NodeId + " at epoch " + request.Epoch + ".");
        }

        /// <summary>
        /// Ingest a batch of events. Duplicate sequences are ignored.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="request">Batch.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Events inserted.</returns>
        /// <exception cref="ConflictException">Thrown with code StaleLease when the node no longer holds the lease.</exception>
        public async Task<int> IngestAsync(string runId, RunEventsRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            // Event batches arrive several times per run; the fencing check needs only the run's row.
            Run run = await RequireLeaseAsync(runId, request.NodeId, request.Epoch, false, token).ConfigureAwait(false);
            if (request.Events.Count == 0) return 0;

            List<RunEvent> events = request.Events.Where(e => e.Sequence > 0).Select(e =>
            {
                RunEvent evt = new RunEvent();
                evt.TenantId = run.TenantId;
                evt.RunId = run.Id;
                evt.Sequence = e.Sequence;
                evt.EventType = e.EventType;
                evt.TimestampUtc = e.TimestampUtc;
                evt.Text = e.Text;
                evt.Code = e.Code;
                evt.ToolName = e.ToolName;
                evt.ToolCallId = e.ToolCallId;
                evt.Success = e.Success;
                evt.InputTokens = e.InputTokens;
                evt.OutputTokens = e.OutputTokens;
                evt.RawEventJson = e.RawEventJson;
                return evt;
            }).ToList();

            int inserted = await _Database.RunEvents.InsertBatchAsync(events, token).ConfigureAwait(false);
            if (events.Count > 0) await _Database.Runs.UpdateLastEventSequenceAsync(run.Id, events.Max(e => e.Sequence), token).ConfigureAwait(false);
            GarrisonMetrics.Observe(GarrisonMetricCatalog.EventBatchSize, events.Count);
            if (GarrisonMetrics.Enabled(GarrisonMetricCatalog.RunEvents))
            {
                foreach (RunEvent evt in events) GarrisonMetrics.Count(GarrisonMetricCatalog.RunEvents, "type", evt.EventType.ToString());
            }
            _Signals.Notify(run.Id);
            return inserted;
        }

        /// <summary>
        /// Record a completion report. When the run's agent has an output schema, the output of a successful execution
        /// is validated first. A failed validation either answers with a structured output repair (the run stays
        /// active and the worker runs the repair in the same lease) or fails the run with SchemaValidationFailed.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="request">Completion report.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response for the worker; carries the repair spec when a repair starts.</returns>
        /// <exception cref="ConflictException">Thrown with code StaleLease when the node no longer holds the lease.</exception>
        public async Task<RunCompleteResponse> CompleteAsync(string runId, RunCompleteRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            Run run = await RequireLeaseAsync(runId, request.NodeId, request.Epoch, true, token).ConfigureAwait(false);

            if (request.RepairAttempt < run.RepairAttempts && _StructuredOutput != null && !String.IsNullOrEmpty(run.SessionId))
            {
                // A retried report of an execution the control plane already answered with a repair: answer again.
                CompilationRepair again = new CompilationRepair();
                again.Attempt = run.RepairAttempts;
                again.SessionId = run.SessionId!;
                again.Error = run.SchemaValidationErrors ?? String.Empty;
                again.PreviousOutput = run.StructuredOutputJson ?? run.ResultText;
                try
                {
                    return await _StructuredOutput.BuildRepairAsync(run, again, run.LastEventSequence, token).ConfigureAwait(false);
                }
                catch (CompilationException e)
                {
                    return await FinishAsync(run, request, RunStatusEnum.Failed, RunOutcomeEnum.CompileFailed, "Structured output repair could not be compiled: " + e.Code + " " + e.Message, token).ConfigureAwait(false);
                }
            }

            // A conversation turn that could not resume because its directories were gone on this node runs again as a
            // fresh session seeded with the transcript, on any capable node (P12.1).
            if (Conversations != null && await Conversations.RequeueLostStateAsync(run, request, token).ConfigureAwait(false))
            {
                _Logging?.Info("[Runs] run " + run.Id + " requeued as a conversation fallback: node " + request.NodeId + " no longer has conversation " + run.ConversationId + " " + RunTracing.LogFields(run.Id, run.TraceId));
                RunCompleteResponse requeued = new RunCompleteResponse();
                requeued.Message = "Requeued as a conversation fallback (WorkspaceLost).";
                return requeued;
            }

            RunStatusEnum status = request.Status;
            if (!RunService.IsTerminal(status) || status == RunStatusEnum.Rejected) status = RunStatusEnum.Failed;
            if (run.CancelRequested && status != RunStatusEnum.Succeeded) status = RunStatusEnum.Cancelled;
            RunOutcomeEnum outcome = status == RunStatusEnum.Succeeded ? RunOutcomeEnum.Succeeded : (status == RunStatusEnum.Cancelled ? RunOutcomeEnum.Cancelled : request.Outcome);
            string? errorMessage = request.ErrorMessage;

            if (CostEstimation != null) await CostEstimation.ApplyAsync(run, request, token).ConfigureAwait(false);

            bool repairReport = request.RepairAttempt > 0 && run.RepairAttempts > 0;
            Apply(run, request, repairReport);

            StructuredOutputCheck? check = null;
            if (status == RunStatusEnum.Succeeded && _StructuredOutput != null)
            {
                check = await _StructuredOutput.CheckAsync(run, request, token).ConfigureAwait(false);
            }

            if (check != null)
            {
                if (check.Validation.Valid)
                {
                    run.OutputSchemaValid = true;
                    run.SchemaValidationErrors = null;
                    run.StructuredOutputJson = check.Validation.Json;
                }
                else
                {
                    run.OutputSchemaValid = false;
                    run.SchemaValidationErrors = check.Validation.Summary();
                    if (check.Validation.Json != null) run.StructuredOutputJson = check.Validation.Json;

                    if (check.CanRepair)
                    {
                        RunCompleteResponse? repair = await StartRepairAsync(run, request, check, token).ConfigureAwait(false);
                        if (repair != null) return repair;
                    }

                    await _StructuredOutput!.AppendWarningAsync(run, request.RepairAttempt, check.Validation, check.NoRepairReason ?? "the repair could not be compiled", token).ConfigureAwait(false);
                    status = RunStatusEnum.Failed;
                    outcome = RunOutcomeEnum.SchemaValidationFailed;
                    errorMessage = StructuredOutputService.FailureMessage(check.Validation, request.RepairAttempt, check.NoRepairReason ?? "the repair could not be compiled");
                }
            }

            return await FinishAsync(run, request, status, outcome, errorMessage, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Read events after a sequence.
        /// </summary>
        /// <param name="run">Run (already authorized).</param>
        /// <param name="afterSequence">Exclusive lower bound.</param>
        /// <param name="limit">Maximum events.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Events response.</returns>
        public async Task<Garrison.Core.Responses.RunEventsResponse> ReadAsync(Run run, long afterSequence, int limit, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            int bounded = Math.Clamp(limit, 1, 5000);
            List<RunEvent> events = await _Database.RunEvents.ListAfterAsync(run.Id, afterSequence, bounded, token).ConfigureAwait(false);
            Garrison.Core.Responses.RunEventsResponse response = new Garrison.Core.Responses.RunEventsResponse();
            response.RunId = run.Id;
            response.Status = run.Status;
            response.Events = events;
            response.LastSequence = events.Count > 0 ? events[events.Count - 1].Sequence : afterSequence;
            response.HasMore = events.Count == bounded;
            return response;
        }

        #endregion

        #region Private-Methods

        private static void Apply(Run run, RunCompleteRequest request, bool accumulate)
        {
            // A repair report adds its usage and timing to what the original execution recorded; otherwise the report
            // replaces the run's result fields.
            run.ResultText = request.ResultText;
            run.StructuredOutputJson = request.StructuredOutputJson;
            run.SessionId = String.IsNullOrEmpty(request.SessionId) && accumulate ? run.SessionId : request.SessionId;
            run.ServedModel = String.IsNullOrEmpty(request.ServedModel) && accumulate ? run.ServedModel : request.ServedModel;
            run.ExitCode = request.ExitCode;
            run.StderrTail = request.StderrTail;
            if (accumulate)
            {
                run.InputTokens += request.InputTokens;
                run.OutputTokens += request.OutputTokens;
                run.CachedTokens += request.CachedTokens;
                run.CostUsd = run.CostUsd.HasValue || request.CostUsd.HasValue ? (run.CostUsd ?? 0) + (request.CostUsd ?? 0) : null;
                run.CostEstimated = run.CostEstimated || request.CostEstimated;
                run.ReasoningTokens += Math.Max(0, request.ReasoningTokens);
                run.ToolCallCount += Math.Max(0, request.ToolCallCount);
                run.FirstTokenUtc = run.FirstTokenUtc ?? request.FirstTokenUtc;
                run.LastTokenUtc = request.LastTokenUtc ?? run.LastTokenUtc;
                run.TimeToFirstTokenMs = run.TimeToFirstTokenMs ?? NonNegative(request.TimeToFirstTokenMs);
                run.StreamingMs = Sum(run.StreamingMs, NonNegative(request.StreamingMs));
                run.ExecutionMs = Sum(run.ExecutionMs, NonNegative(request.ExecutionMs));
            }
            else
            {
                run.InputTokens = request.InputTokens;
                run.OutputTokens = request.OutputTokens;
                run.CachedTokens = request.CachedTokens;
                run.CostUsd = request.CostUsd;
                run.CostEstimated = request.CostEstimated;
                run.ReasoningTokens = Math.Max(0, request.ReasoningTokens);
                run.ToolCallCount = Math.Max(0, request.ToolCallCount);
                run.FirstTokenUtc = request.FirstTokenUtc;
                run.LastTokenUtc = request.LastTokenUtc;
                run.TimeToFirstTokenMs = NonNegative(request.TimeToFirstTokenMs);
                run.StreamingMs = NonNegative(request.StreamingMs);
                run.ExecutionMs = NonNegative(request.ExecutionMs);
            }
        }

        private async Task ApplyDelegationWaitAsync(Run run, DateTime receivedUtc, CancellationToken token)
        {
            // Child runs (parentRunId equals this run) on the server clock; the worker's clock is not used.
            List<Run> children = new List<Run>();
            RunFilter filter = new RunFilter();
            filter.TenantId = run.TenantId;
            filter.ParentRunId = run.Id;
            filter.MaxResults = 1000;
            filter.Ordering = EnumerationOrderEnum.CreatedAscending;
            for (int page = 0; page < 10; page++)
            {
                token.ThrowIfCancellationRequested();
                filter.Skip = page * filter.MaxResults;
                EnumerationResult<Run> result = await _Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
                children.AddRange(result.Objects);
                if (result.Objects.Count < filter.MaxResults) break;
            }

            DateTime windowStart = run.StartedUtc ?? run.LeasedUtc ?? run.CreatedUtc;
            DelegationWaitResult wait = DelegationWaitCalculator.Compute(windowStart, receivedUtc, run.TimeToFirstTokenMs, children);
            run.DelegationWaitMs = wait.DelegationWaitMs;
            run.TimeToFirstTokenExcludingDelegationMs = wait.TimeToFirstTokenExcludingDelegationMs;
        }

        private static long? Sum(long? first, long? second)
        {
            if (!first.HasValue) return second;
            if (!second.HasValue) return first;
            return first.Value + second.Value;
        }

        private async Task<RunCompleteResponse?> StartRepairAsync(Run run, RunCompleteRequest request, StructuredOutputCheck check, CancellationToken token)
        {
            CompilationRepair repair = new CompilationRepair();
            repair.Attempt = 1;
            repair.SessionId = request.SessionId!;
            repair.Error = check.Validation.Summary();
            repair.PreviousOutput = check.Validation.Json ?? request.StructuredOutputJson ?? request.ResultText;

            run.RepairAttempts = repair.Attempt;
            RunCompleteResponse response;
            try
            {
                response = await _StructuredOutput!.BuildRepairAsync(run, repair, run.LastEventSequence, token).ConfigureAwait(false);
            }
            catch (CompilationException e)
            {
                run.RepairAttempts = 0;
                check.NoRepairReason = "the repair could not be compiled (" + e.Code + ": " + e.Message + ")";
                return null;
            }

            // Queue and total time are only final when the run finishes.
            run.QueueMs = Run.ElapsedMs(run.QueuedUtc, run.LeasedUtc);
            if (!await _Database.Runs.RecordRepairAsync(run, request.NodeId, request.Epoch, token).ConfigureAwait(false))
            {
                throw new ConflictException("StaleLease", "Run " + run.Id + " is not leased to node " + request.NodeId + " at epoch " + request.Epoch + ".");
            }

            response.EventSequenceStart = await _StructuredOutput.AppendWarningAsync(run, request.RepairAttempt, check.Validation, null, token).ConfigureAwait(false);
            _Signals.Notify(run.Id);
            _Logging?.Info("[Runs] run " + run.Id + " output failed schema validation; repair attempt " + repair.Attempt + " sent to node " + request.NodeId + " " + RunTracing.LogFields(run.Id, run.TraceId));
            return response;
        }

        private async Task<RunCompleteResponse> FinishAsync(Run run, RunCompleteRequest request, RunStatusEnum status, RunOutcomeEnum outcome, string? errorMessage, CancellationToken token)
        {
            run.Status = status;
            run.Outcome = outcome;
            run.ErrorMessage = errorMessage;
            run.CompletedUtc = request.CompletedUtc == default ? DateTime.UtcNow : request.CompletedUtc;

            // Queue and total time come from this server's clock only; the worker's clock may differ.
            DateTime receivedUtc = DateTime.UtcNow;
            run.QueueMs = Run.ElapsedMs(run.QueuedUtc, run.LeasedUtc);
            run.TotalMs = Run.ElapsedMs(run.QueuedUtc, receivedUtc);
            await ApplyDelegationWaitAsync(run, receivedUtc, token).ConfigureAwait(false);

            // Recorded before the run is marked finished, so the next turn (allowed once this run is terminal) already sees
            // the session to resume and the node that holds it.
            if (Conversations != null && run.Status == RunStatusEnum.Succeeded && !String.IsNullOrEmpty(run.ConversationId))
            {
                await Conversations.RecordSuccessAsync(run, request.NodeId, token).ConfigureAwait(false);
            }

            if (!await _Database.Runs.CompleteAsync(run, request.NodeId, request.Epoch, token).ConfigureAwait(false))
            {
                throw new ConflictException("StaleLease", "Run " + run.Id + " is not leased to node " + request.NodeId + " at epoch " + request.Epoch + ".");
            }

            await _Database.Sessions.RevokeByRunAsync(run.Id, "Run finished.", token).ConfigureAwait(false);
            if (Approvals != null && run.PendingApprovals > 0) await Approvals.CancelPendingAsync(run.Id, "The run finished (" + status + ").", token).ConfigureAwait(false);
            RunMetricLabels labels = await RunTelemetry.LabelsAsync(_Database, run, token).ConfigureAwait(false);
            RunTelemetry.Finished(run, labels);
            _Signals.Complete(run.Id);
            _Logging?.Info("[Runs] run " + run.Id + " finished " + run.Status + " (" + run.Outcome + ") on " + (run.LeaseNodeName ?? request.NodeId) + (run.TotalMs.HasValue ? " in " + run.TotalMs.Value + " ms" : String.Empty) + " " + RunTracing.LogFields(run.Id, run.TraceId)
                + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "agent", run.AgentName, "deployment", labels.Deployment, "model", run.ServedModel, "node", run.LeaseNodeName ?? request.NodeId, "outcome", run.Outcome.ToString()));

            RunCompleteResponse response = new RunCompleteResponse();
            response.Message = run.Status + " (" + run.Outcome + ")";
            return response;
        }

        private static long? NonNegative(long? value)
        {
            if (!value.HasValue) return null;
            return Math.Max(0, value.Value);
        }

        private async Task<Run> RequireLeaseAsync(string runId, string nodeId, long epoch, bool withChildren, CancellationToken token)
        {
            Run? run = withChildren ? await _Database.Runs.ReadAsync(runId, token).ConfigureAwait(false) : await _Database.Runs.ReadRowAsync(runId, token).ConfigureAwait(false);
            if (run == null) throw new NotFoundException("Run " + runId + " not found.");
            bool active = run.Status == RunStatusEnum.Leased || run.Status == RunStatusEnum.Running || run.Status == RunStatusEnum.Cancelling;
            if (!active || run.LeaseNodeId != nodeId || run.LeaseEpoch != epoch)
            {
                throw new ConflictException("StaleLease", "Run " + runId + " is not leased to node " + nodeId + " at epoch " + epoch + ".");
            }
            return run;
        }

        #endregion
    }
}
