namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Radiant;

    /// <summary>
    /// Fenced ingestion of worker reports (started, events, complete) and event reads. Thread-safe.
    /// </summary>
    public class RunEventService
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RunSignals _Signals;
        private readonly GarrisonTelemetry _Telemetry;

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

            Run? run = await _Database.Runs.ReadAsync(runId, token).ConfigureAwait(false);
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
            Run run = await RequireLeaseAsync(runId, request.NodeId, request.Epoch, token).ConfigureAwait(false);
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
            _Telemetry.Record("garrison.event.batch.size", events.Count);
            _Signals.Notify(run.Id);
            return inserted;
        }

        /// <summary>
        /// Record a terminal result.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="request">Completion report.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The finished run.</returns>
        /// <exception cref="ConflictException">Thrown with code StaleLease when the node no longer holds the lease.</exception>
        public async Task<Run> CompleteAsync(string runId, RunCompleteRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            Run run = await RequireLeaseAsync(runId, request.NodeId, request.Epoch, token).ConfigureAwait(false);

            RunStatusEnum status = request.Status;
            if (!RunService.IsTerminal(status) || status == RunStatusEnum.Rejected) status = RunStatusEnum.Failed;
            if (run.CancelRequested && status != RunStatusEnum.Succeeded) status = RunStatusEnum.Cancelled;

            run.Status = status;
            run.Outcome = status == RunStatusEnum.Succeeded ? RunOutcomeEnum.Succeeded : (status == RunStatusEnum.Cancelled ? RunOutcomeEnum.Cancelled : request.Outcome);
            run.CompletedUtc = request.CompletedUtc == default ? DateTime.UtcNow : request.CompletedUtc;
            run.ResultText = request.ResultText;
            run.StructuredOutputJson = request.StructuredOutputJson;
            run.SessionId = request.SessionId;
            run.ServedModel = request.ServedModel;
            run.ExitCode = request.ExitCode;
            run.StderrTail = request.StderrTail;
            run.ErrorMessage = request.ErrorMessage;
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

            // Queue and total time come from this server's clock only; the worker's clock may differ.
            DateTime receivedUtc = DateTime.UtcNow;
            run.QueueMs = Run.ElapsedMs(run.QueuedUtc, run.LeasedUtc);
            run.TotalMs = Run.ElapsedMs(run.QueuedUtc, receivedUtc);

            if (!await _Database.Runs.CompleteAsync(run, request.NodeId, request.Epoch, token).ConfigureAwait(false))
            {
                throw new ConflictException("StaleLease", "Run " + runId + " is not leased to node " + request.NodeId + " at epoch " + request.Epoch + ".");
            }

            await _Database.Sessions.RevokeByRunAsync(run.Id, "Run finished.", token).ConfigureAwait(false);
            _Telemetry.Increment("garrison.runs.finished", new RadiantTag("outcome", run.Outcome.ToString()), new RadiantTag("harness", run.HarnessType.ToString()));
            if (run.InputTokens > 0) _Telemetry.Record("garrison.harness.tokens", run.InputTokens, new RadiantTag("harness", run.HarnessType.ToString()), new RadiantTag("direction", "input"));
            if (run.OutputTokens > 0) _Telemetry.Record("garrison.harness.tokens", run.OutputTokens, new RadiantTag("harness", run.HarnessType.ToString()), new RadiantTag("direction", "output"));
            if (run.StartedUtc.HasValue && run.CompletedUtc.HasValue) _Telemetry.Record("garrison.run.stage.duration", (run.CompletedUtc.Value - run.StartedUtc.Value).TotalSeconds, new RadiantTag("stage", "execution"), new RadiantTag("harness", run.HarnessType.ToString()));
            if (run.QueueMs.HasValue) _Telemetry.Record("garrison.run.stage.duration", run.QueueMs.Value / 1000.0, new RadiantTag("stage", "queue"), new RadiantTag("harness", run.HarnessType.ToString()));
            if (run.TimeToFirstTokenMs.HasValue) _Telemetry.Record("garrison.run.stage.duration", run.TimeToFirstTokenMs.Value / 1000.0, new RadiantTag("stage", "first_token"), new RadiantTag("harness", run.HarnessType.ToString()));
            if (run.ReasoningTokens > 0) _Telemetry.Record("garrison.harness.tokens", run.ReasoningTokens, new RadiantTag("harness", run.HarnessType.ToString()), new RadiantTag("direction", "reasoning"));
            _Signals.Complete(run.Id);
            return run;
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

        private static long? NonNegative(long? value)
        {
            if (!value.HasValue) return null;
            return Math.Max(0, value.Value);
        }

        private async Task<Run> RequireLeaseAsync(string runId, string nodeId, long epoch, CancellationToken token)
        {
            Run? run = await _Database.Runs.ReadAsync(runId, token).ConfigureAwait(false);
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
