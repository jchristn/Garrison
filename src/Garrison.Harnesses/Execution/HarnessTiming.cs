namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Diagnostics;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;

    /// <summary>
    /// Measures run timing on a monotonic clock (<see cref="Stopwatch"/>) anchored at harness process start: time to
    /// the first model output (assistant text or thinking), time of the last model output, and process exit. Also
    /// counts tool call events. Wall-clock timestamps are derived from the start time plus monotonic offsets, so they
    /// are consistent with the durations. Thread-safe: the stdout reader and the process waiter may call it
    /// concurrently.
    /// </summary>
    public class HarnessTiming
    {
        #region Public-Members

        /// <summary>
        /// Wall-clock time the process started, or null before <see cref="Start"/>.
        /// </summary>
        public DateTime? StartedUtc
        {
            get
            {
                lock (_Lock)
                {
                    return _StartedUtc;
                }
            }
        }

        /// <summary>
        /// Time of the first model output event, or null when none was seen.
        /// </summary>
        public DateTime? FirstTokenUtc
        {
            get
            {
                lock (_Lock)
                {
                    return Offset(_FirstTokenTicks);
                }
            }
        }

        /// <summary>
        /// Time of the last model output event, or null when none was seen.
        /// </summary>
        public DateTime? LastTokenUtc
        {
            get
            {
                lock (_Lock)
                {
                    return Offset(_LastTokenTicks);
                }
            }
        }

        /// <summary>
        /// Milliseconds from process start to the first model output (includes harness startup), or null when none
        /// was seen.
        /// </summary>
        public long? TimeToFirstTokenMs
        {
            get
            {
                lock (_Lock)
                {
                    return Milliseconds(_FirstTokenTicks);
                }
            }
        }

        /// <summary>
        /// Milliseconds from the first to the last model output, or null when none was seen. 0 when only one model
        /// output event arrived.
        /// </summary>
        public long? StreamingMs
        {
            get
            {
                lock (_Lock)
                {
                    if (!_FirstTokenTicks.HasValue || !_LastTokenTicks.HasValue) return null;
                    return ToMilliseconds(_LastTokenTicks.Value - _FirstTokenTicks.Value);
                }
            }
        }

        /// <summary>
        /// Milliseconds from process start to process exit, or null when the exit was not observed.
        /// </summary>
        public long? ExecutionMs
        {
            get
            {
                lock (_Lock)
                {
                    return Milliseconds(_ExitTicks);
                }
            }
        }

        /// <summary>
        /// Number of tool call events observed. Minimum 0.
        /// </summary>
        public int ToolCallCount
        {
            get
            {
                lock (_Lock)
                {
                    return _ToolCallCount;
                }
            }
        }

        #endregion

        #region Private-Members

        private readonly object _Lock = new object();
        private readonly Stopwatch _Stopwatch = new Stopwatch();
        private DateTime? _StartedUtc = null;
        private long? _FirstTokenTicks = null;
        private long? _LastTokenTicks = null;
        private long? _ExitTicks = null;
        private int _ToolCallCount = 0;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Mark the harness process start. Later calls are ignored.
        /// </summary>
        public void Start()
        {
            lock (_Lock)
            {
                if (_StartedUtc.HasValue) return;
                _StartedUtc = DateTime.UtcNow;
                _Stopwatch.Start();
            }
        }

        /// <summary>
        /// Observe a normalized event as it is produced from a stdout line. Assistant text and thinking events mark
        /// model output; tool call events are counted. Events observed before <see cref="Start"/> or after
        /// <see cref="MarkExited"/> do not move the model output marks.
        /// </summary>
        /// <param name="report">Event; null is ignored.</param>
        public void Observe(RunEventReport? report)
        {
            if (report == null) return;
            lock (_Lock)
            {
                if (report.EventType == RunEventTypeEnum.ToolCall)
                {
                    _ToolCallCount++;
                    return;
                }
                if (report.EventType != RunEventTypeEnum.AssistantText && report.EventType != RunEventTypeEnum.Thinking) return;
                if (!_StartedUtc.HasValue || _ExitTicks.HasValue) return;
                long now = _Stopwatch.Elapsed.Ticks;
                if (!_FirstTokenTicks.HasValue) _FirstTokenTicks = now;
                _LastTokenTicks = now;
            }
        }

        /// <summary>
        /// Mark the process exit. Later calls are ignored.
        /// </summary>
        public void MarkExited()
        {
            lock (_Lock)
            {
                if (!_StartedUtc.HasValue || _ExitTicks.HasValue) return;
                _ExitTicks = _Stopwatch.Elapsed.Ticks;
                _Stopwatch.Stop();
            }
        }

        /// <summary>
        /// Copy the measurements onto a completion report.
        /// </summary>
        /// <param name="complete">Completion report.</param>
        /// <exception cref="ArgumentNullException">Thrown when complete is null.</exception>
        public void ApplyTo(RunCompleteRequest complete)
        {
            if (complete == null) throw new ArgumentNullException(nameof(complete));
            complete.FirstTokenUtc = FirstTokenUtc;
            complete.LastTokenUtc = LastTokenUtc;
            complete.TimeToFirstTokenMs = TimeToFirstTokenMs;
            complete.StreamingMs = StreamingMs;
            complete.ExecutionMs = ExecutionMs;
            complete.ToolCallCount = ToolCallCount;
        }

        #endregion

        #region Private-Methods

        private DateTime? Offset(long? ticks)
        {
            if (!_StartedUtc.HasValue || !ticks.HasValue) return null;
            return DateTime.SpecifyKind(_StartedUtc.Value.AddTicks(ticks.Value), DateTimeKind.Utc);
        }

        private static long? Milliseconds(long? ticks)
        {
            if (!ticks.HasValue) return null;
            return ToMilliseconds(ticks.Value);
        }

        private static long ToMilliseconds(long ticks)
        {
            return Math.Max(0, ticks / TimeSpan.TicksPerMillisecond);
        }

        #endregion
    }
}
