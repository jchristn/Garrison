namespace Garrison.Worker.Reporting
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Core.Telemetry;
    using Garrison.Worker.Execution;
    using Garrison.Worker.Protocol;

    /// <summary>
    /// Ships one run's events to the control plane in ordered batches. Events get sequence numbers starting at 1 and
    /// stay buffered (bounded) while the control plane is unreachable, then replay with their original sequences
    /// (plan D-024). When the buffer overflows the oldest text-like events are dropped and a warning is added.
    /// Consecutive text deltas merge only inside a flush window; selected batches are sealed before delivery. A 409
    /// marks the lease stale and invokes the stale callback. Thread-safe.
    /// </summary>
    public class RunEventShipper : IRunReporter, IAsyncDisposable
    {
        #region Public-Members

        /// <summary>
        /// Whether the control plane reported the lease as stale.
        /// </summary>
        public bool Stale
        {
            get
            {
                return Volatile.Read(ref _Stale) == 1;
            }
        }

        /// <summary>
        /// Events dropped because of buffer overflow.
        /// </summary>
        public long Dropped
        {
            get
            {
                return Interlocked.Read(ref _Dropped);
            }
        }

        #endregion

        #region Private-Members

        private static readonly HashSet<RunEventTypeEnum> _Droppable = new HashSet<RunEventTypeEnum>
        {
            RunEventTypeEnum.AssistantText,
            RunEventTypeEnum.Thinking,
            RunEventTypeEnum.Stdout,
            RunEventTypeEnum.Stderr,
            RunEventTypeEnum.Progress
        };

        private readonly NodeProtocolClient _Client;
        private readonly string _NodeId;
        private readonly string _RunId;
        private readonly long _Epoch;
        private readonly int _BatchSize;
        private readonly int _MaxBuffered;
        private readonly int _FlushIntervalMs;
        private readonly int _TextCoalesceMaxChars;
        private RunEventReport? _Coalescible = null;
        private long _WindowStarted = Stopwatch.GetTimestamp();
        private readonly Action<string>? _OnStale;
        private readonly Action<string>? _Log;
        private readonly List<RunEventReport> _Buffer = new List<RunEventReport>();
        private readonly object _Lock = new object();
        private readonly SemaphoreSlim _SendLock = new SemaphoreSlim(1, 1);
        private readonly CancellationTokenSource _Stop = new CancellationTokenSource();
        private readonly Task _Loop;
        private long _Sequence = 0;
        private long _Dropped = 0;
        private long _DroppedReported = 0;
        private int _Stale = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate and start the background flush loop.
        /// </summary>
        /// <param name="client">Protocol client.</param>
        /// <param name="nodeId">Node identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="epoch">Fencing epoch.</param>
        /// <param name="batchSize">Events per batch.</param>
        /// <param name="maxBuffered">Maximum buffered events.</param>
        /// <param name="flushIntervalMs">Flush interval in milliseconds.</param>
        /// <param name="onStale">Called once with the run identifier when the lease is stale.</param>
        /// <param name="log">Optional log callback.</param>
        /// <param name="sequenceStart">Highest event sequence already recorded for the run (from the assignment); events are numbered after it. Minimum 0, default 0.</param>
        /// <param name="textCoalesceMaxChars">Maximum merged AssistantText/Thinking length; 0 disables merging. Default 2048.</param>
        /// <exception cref="ArgumentNullException">Thrown when client is null.</exception>
        public RunEventShipper(NodeProtocolClient client, string nodeId, string runId, long epoch, int batchSize, int maxBuffered, int flushIntervalMs, Action<string>? onStale, Action<string>? log, long sequenceStart = 0, int textCoalesceMaxChars = 2048)
        {
            _Sequence = Math.Max(0, sequenceStart);
            _Client = client ?? throw new ArgumentNullException(nameof(client));
            _NodeId = nodeId;
            _RunId = runId;
            _Epoch = epoch;
            _BatchSize = Math.Max(1, batchSize);
            _MaxBuffered = Math.Max(10, maxBuffered);
            _FlushIntervalMs = Math.Max(20, flushIntervalMs);
            _TextCoalesceMaxChars = Math.Clamp(textCoalesceMaxChars, 0, 1048576);
            _OnStale = onStale;
            _Log = log;
            _Loop = Task.Run(() => LoopAsync(_Stop.Token));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start gate (P10.20): ask the control plane to acknowledge the start of this attempt, which moves the run from
        /// Leased to Running at this lease epoch. The worker launches the harness only after this returns true, so a
        /// run whose lease expires before the acknowledgement is requeued without having started anywhere, and a run
        /// that did start follows the deployment's retryOnNodeLoss rule. Retries with backoff while the control plane is
        /// unreachable, until it acknowledges, reports the lease stale (409), or <paramref name="deadlineUtc"/> passes
        /// (normally the assignment's lease expiry, after which the run can no longer be acknowledged for this epoch).
        /// At least three attempts are made.
        /// </summary>
        /// <param name="deadlineUtc">Stop retrying after this time (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the control plane acknowledged the start; false when it refused or could not be reached.</returns>
        /// <exception cref="OperationCanceledException">Thrown when the token is cancelled.</exception>
        public async Task<bool> AcknowledgeStartAsync(DateTime deadlineUtc, CancellationToken token)
        {
            RunStartedRequest request = new RunStartedRequest();
            request.NodeId = _NodeId;
            request.Epoch = _Epoch;
            request.ProcessId = null;
            request.StartedUtc = DateTime.UtcNow;
            int attempt = 0;
            while (!Stale)
            {
                token.ThrowIfCancellationRequested();
                try
                {
                    await _Client.StartedAsync(_RunId, request, token).ConfigureAwait(false);
                    return true;
                }
                catch (StaleLeaseException)
                {
                    MarkStale();
                    return false;
                }
                catch (NodeProtocolException e)
                {
                    _Log?.Invoke("start acknowledgement for " + _RunId + " failed (attempt " + (attempt + 1) + "): " + e.Message);
                }
                attempt++;
                DateTime now = DateTime.UtcNow;
                if (now >= deadlineUtc && attempt >= 3) break;
                int delay = Backoff(attempt);
                if (now < deadlineUtc) delay = (int)Math.Min(delay, Math.Max(50, (deadlineUtc - now).TotalMilliseconds));
                await Task.Delay(delay, token).ConfigureAwait(false);
            }
            return false;
        }

        /// <inheritdoc />
        public async Task StartedAsync(int? processId, CancellationToken token)
        {
            RunStartedRequest request = new RunStartedRequest();
            request.NodeId = _NodeId;
            request.Epoch = _Epoch;
            request.ProcessId = processId;
            request.StartedUtc = DateTime.UtcNow;
            for (int attempt = 0; attempt < 5 && !Stale; attempt++)
            {
                try
                {
                    await _Client.StartedAsync(_RunId, request, token).ConfigureAwait(false);
                    return;
                }
                catch (StaleLeaseException)
                {
                    MarkStale();
                    return;
                }
                catch (NodeProtocolException e)
                {
                    _Log?.Invoke("started report for " + _RunId + " failed: " + e.Message);
                    await Task.Delay(Backoff(attempt), token).ConfigureAwait(false);
                }
            }
        }

        /// <inheritdoc />
        public void Emit(RunEventReport report)
        {
            if (report == null || Stale) return;
            lock (_Lock)
            {
                if (Stopwatch.GetElapsedTime(_WindowStarted).TotalMilliseconds >= _FlushIntervalMs) SealWindow();
                if (CanMerge(report))
                {
                    _Coalescible!.Text += report.Text;
                    if (!String.IsNullOrEmpty(report.RawEventJson))
                        _Coalescible.RawEventJson = String.IsNullOrEmpty(_Coalescible.RawEventJson) ? report.RawEventJson : _Coalescible.RawEventJson + "\n" + report.RawEventJson;
                    if (report.TimestampUtc < _Coalescible.TimestampUtc) _Coalescible.TimestampUtc = report.TimestampUtc;
                    return;
                }
                // Own the buffered object: callers and a later merge cannot alter a serialized/replayed batch.
                RunEventReport owned = Copy(report);
                owned.Sequence = ++_Sequence;
                report.Sequence = owned.Sequence;
                _Buffer.Add(owned);
                _Coalescible = owned;
                while (_Buffer.Count > _MaxBuffered)
                {
                    int index = _Buffer.FindIndex(e => _Droppable.Contains(e.EventType));
                    if (index < 0) index = 0;
                    _Buffer.RemoveAt(index);
                    Interlocked.Increment(ref _Dropped);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerEvents, "result", "dropped");
                }
            }
        }

        /// <summary>
        /// Continue numbering events after a sequence the control plane already used (for example the validation
        /// warning written before a structured output repair). Never moves the sequence backwards.
        /// </summary>
        /// <param name="sequence">Last used sequence.</param>
        public void AdvanceSequence(long sequence)
        {
            lock (_Lock)
            {
                SealWindow();
                if (sequence > _Sequence) _Sequence = sequence;
            }
        }

        /// <inheritdoc />
        public async Task FlushAsync(CancellationToken token)
        {
            lock (_Lock) SealWindow();
            int attempt = 0;
            while (!Stale)
            {
                token.ThrowIfCancellationRequested();
                bool empty;
                lock (_Lock)
                {
                    empty = _Buffer.Count == 0 && Interlocked.Read(ref _Dropped) == _DroppedReported;
                }
                if (empty) return;
                bool sent = await SendOnceAsync(token).ConfigureAwait(false);
                if (sent) attempt = 0;
                else await Task.Delay(Backoff(attempt++), token).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// Stop the background loop. Does not flush; call <see cref="FlushAsync"/> first.
        /// </summary>
        /// <returns>Value task.</returns>
        public async ValueTask DisposeAsync()
        {
            _Stop.Cancel();
            try
            {
                await _Loop.ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
            }
            _Stop.Dispose();
            _SendLock.Dispose();
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Private-Methods

        private async Task LoopAsync(CancellationToken token)
        {
            int attempt = 0;
            while (!token.IsCancellationRequested && !Stale)
            {
                try
                {
                    await Task.Delay(_FlushIntervalMs, token).ConfigureAwait(false);
                    bool pending;
                    lock (_Lock)
                    {
                        pending = _Buffer.Count > 0;
                    }
                    if (!pending) continue;
                    bool sent = await SendOnceAsync(token).ConfigureAwait(false);
                    if (sent) attempt = 0;
                    else await Task.Delay(Backoff(attempt++), token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    return;
                }
            }
        }

        private async Task<bool> SendOnceAsync(CancellationToken token)
        {
            await _SendLock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                List<RunEventReport> batch;
                lock (_Lock)
                {
                    SealWindow();
                    long dropped = Interlocked.Read(ref _Dropped);
                    if (dropped > _DroppedReported)
                    {
                        RunEventReport warning = new RunEventReport();
                        warning.EventType = RunEventTypeEnum.Warning;
                        warning.Code = "EventsDropped";
                        warning.Text = (dropped - _DroppedReported) + " event(s) were dropped because the control plane was unreachable and the worker buffer was full.";
                        warning.Sequence = ++_Sequence;
                        _Buffer.Add(warning);
                        _DroppedReported = dropped;
                    }
                    batch = _Buffer.Take(_BatchSize).ToList();
                }
                if (batch.Count == 0) return true;

                RunEventsRequest request = new RunEventsRequest();
                request.NodeId = _NodeId;
                request.Epoch = _Epoch;
                request.Events = batch;
                try
                {
                    await _Client.EventsAsync(_RunId, request, token).ConfigureAwait(false);
                }
                catch (StaleLeaseException)
                {
                    MarkStale();
                    return false;
                }
                catch (NodeProtocolException e)
                {
                    _Log?.Invoke("event delivery for " + _RunId + " failed (will retry): " + e.Message);
                    return false;
                }

                lock (_Lock)
                {
                    HashSet<long> sent = new HashSet<long>(batch.Select(b => b.Sequence));
                    _Buffer.RemoveAll(e => sent.Contains(e.Sequence));
                }
                GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerEvents, batch.Count, GarrisonMetrics.Tags("result", "shipped"));
                return true;
            }
            finally
            {
                _SendLock.Release();
            }
        }

        private bool CanMerge(RunEventReport report)
        {
            RunEventReport? previous = _Coalescible;
            return _TextCoalesceMaxChars > 0 && previous != null && _Buffer.Count > 0
                && ReferenceEquals(_Buffer[_Buffer.Count - 1], previous)
                && (report.EventType == RunEventTypeEnum.AssistantText || report.EventType == RunEventTypeEnum.Thinking)
                && previous.EventType == report.EventType && previous.Text != null && report.Text != null
                && (long)previous.Text.Length + report.Text.Length <= _TextCoalesceMaxChars
                && previous.Code == report.Code && previous.ToolName == report.ToolName && previous.ToolCallId == report.ToolCallId
                && previous.Success == report.Success && previous.InputTokens == null && report.InputTokens == null
                && previous.OutputTokens == null && report.OutputTokens == null;
        }

        private void SealWindow()
        {
            _Coalescible = null;
            _WindowStarted = Stopwatch.GetTimestamp();
        }

        private static RunEventReport Copy(RunEventReport report)
        {
            return new RunEventReport
            {
                EventType = report.EventType,
                TimestampUtc = report.TimestampUtc,
                Code = report.Code,
                Text = report.Text,
                ToolName = report.ToolName,
                ToolCallId = report.ToolCallId,
                Success = report.Success,
                InputTokens = report.InputTokens,
                OutputTokens = report.OutputTokens,
                RawEventJson = report.RawEventJson
            };
        }

        private void MarkStale()
        {
            if (Interlocked.Exchange(ref _Stale, 1) == 1) return;
            lock (_Lock)
            {
                _Buffer.Clear();
            }
            _OnStale?.Invoke(_RunId);
        }

        private static int Backoff(int attempt)
        {
            int baseMs = Math.Min(30000, 250 * (1 << Math.Min(attempt, 7)));
            return baseMs + Random.Shared.Next(0, 250);
        }

        #endregion
    }
}
