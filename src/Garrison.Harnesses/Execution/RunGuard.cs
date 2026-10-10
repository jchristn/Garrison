namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Text;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;

    /// <summary>
    /// Watches a run's normalized events and decides when the worker must stop the harness (plan P3.15). Three guards:
    /// <list type="bullet">
    /// <item><description>Repetition (RepetitionDetected): the most recent <see cref="RunGuardOptions.RepetitionWindowChars"/>
    /// characters of assistant text are one unit of 1 to <see cref="RunGuardOptions.MaxRepeatUnitChars"/> characters
    /// repeated at least <see cref="RunGuardOptions.MinRepeats"/> times, or the last
    /// <see cref="RunGuardOptions.DegenerateChars"/> characters contain no letter or digit.</description></item>
    /// <item><description>Output size (OutputLimitExceeded): total assistant text passes
    /// <see cref="RunGuardOptions.MaxAssistantChars"/>.</description></item>
    /// <item><description>No progress (NoProgress): <see cref="RunGuardOptions.NoProgressSeconds"/> pass without
    /// progress while no tool call is open.</description></item>
    /// </list>
    /// Progress is any AssistantText, Thinking, ToolCall, or ToolResult event. A tool call is open from its ToolCall
    /// event until a ToolResult with the same tool call identifier (or, when either has no identifier, the oldest open
    /// call), or until assistant text or thinking arrives, which means the model is generating again. Lifecycle, usage,
    /// warning, error, stdout, and stderr events are not progress. The repetition window covers assistant text since the
    /// most recent tool call or tool result, so an agent that says the same short sentence between many tool calls is not
    /// a loop.
    /// Detection is incremental and bounded: per character it compares against the previous
    /// <see cref="RunGuardOptions.MaxRepeatUnitChars"/> characters only, keeping one counter per unit length, so memory
    /// does not grow with the output. Thread-safe; the first trip wins and later calls return it.
    /// </summary>
    public class RunGuard
    {
        #region Public-Members

        /// <summary>
        /// The trip that stopped the run, or null while the run is within its limits.
        /// </summary>
        public RunGuardTrip? Trip
        {
            get
            {
                lock (_Lock)
                {
                    return _Trip;
                }
            }
        }

        /// <summary>
        /// Total characters of assistant text observed.
        /// </summary>
        public long AssistantChars
        {
            get
            {
                lock (_Lock)
                {
                    return _AssistantChars;
                }
            }
        }

        /// <summary>
        /// Tool calls currently open (no result yet).
        /// </summary>
        public int OpenToolCalls
        {
            get
            {
                lock (_Lock)
                {
                    return _OpenIds.Count + _OpenAnonymous;
                }
            }
        }

        /// <summary>
        /// Most open tool calls tracked by identifier. Calls beyond this are counted without identifiers. Minimum 1,
        /// maximum 65,536, default 256.
        /// </summary>
        public int MaxTrackedToolCalls
        {
            get
            {
                return _MaxTrackedToolCalls;
            }
            set
            {
                _MaxTrackedToolCalls = Math.Clamp(value, 1, 65536);
            }
        }

        #endregion

        #region Private-Members

        private readonly object _Lock = new object();
        private readonly RunGuardOptions _Options;
        private readonly Func<long> _ClockMs;
        private readonly char[] _Recent;
        private readonly int[] _Matches;
        private readonly List<string> _OpenIds = new List<string>();
        private int _OpenAnonymous = 0;
        private int _MaxTrackedToolCalls = 256;
        private int _RecentPosition = 0;
        private long _WindowChars = 0;
        private int _DegenerateRun = 0;
        private long _AssistantChars = 0;
        private long _LastProgressMs = 0;
        private RunGuardTrip? _Trip = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with the monotonic process clock.
        /// </summary>
        /// <param name="options">Thresholds.</param>
        /// <exception cref="ArgumentNullException">Thrown when options is null.</exception>
        public RunGuard(RunGuardOptions options) : this(options, null)
        {
        }

        /// <summary>
        /// Instantiate with an explicit clock (used by tests).
        /// </summary>
        /// <param name="options">Thresholds.</param>
        /// <param name="clockMs">Returns monotonic milliseconds; null uses a stopwatch started now.</param>
        /// <exception cref="ArgumentNullException">Thrown when options is null.</exception>
        public RunGuard(RunGuardOptions options, Func<long>? clockMs)
        {
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            if (clockMs == null)
            {
                Stopwatch stopwatch = Stopwatch.StartNew();
                _ClockMs = () => stopwatch.ElapsedMilliseconds;
            }
            else
            {
                _ClockMs = clockMs;
            }
            int unit = Math.Min(_Options.MaxRepeatUnitChars, _Options.RepetitionWindowChars / 2);
            _Recent = new char[Math.Max(1, unit)];
            _Matches = new int[_Recent.Length + 1];
            _LastProgressMs = _ClockMs();
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Restart the no-progress clock, for example when the harness process starts.
        /// </summary>
        public void Start()
        {
            lock (_Lock)
            {
                _LastProgressMs = _ClockMs();
            }
        }

        /// <summary>
        /// Observe one normalized event.
        /// </summary>
        /// <param name="report">Event; null is ignored.</param>
        /// <returns>The trip when this event (or an earlier one) tripped a guard; otherwise null.</returns>
        public RunGuardTrip? Observe(RunEventReport? report)
        {
            if (report == null) return Trip;
            lock (_Lock)
            {
                if (_Trip != null) return _Trip;
                switch (report.EventType)
                {
                    case RunEventTypeEnum.AssistantText:
                        Progress();
                        CloseAllToolCalls();
                        AppendText(report.Text);
                        break;
                    case RunEventTypeEnum.Thinking:
                        Progress();
                        CloseAllToolCalls();
                        break;
                    case RunEventTypeEnum.ToolCall:
                        Progress();
                        OpenToolCall(report.ToolCallId);
                        ResetRepetition();
                        break;
                    case RunEventTypeEnum.ToolResult:
                        Progress();
                        CloseToolCall(report.ToolCallId);
                        ResetRepetition();
                        break;
                }
                return _Trip;
            }
        }

        /// <summary>
        /// Observe assistant text directly (equivalent to an AssistantText event).
        /// </summary>
        /// <param name="text">Text; null or empty still counts as progress.</param>
        /// <returns>The trip, or null.</returns>
        public RunGuardTrip? ObserveText(string? text)
        {
            RunEventReport report = new RunEventReport();
            report.EventType = RunEventTypeEnum.AssistantText;
            report.Text = text;
            return Observe(report);
        }

        /// <summary>
        /// Check the no-progress guard against the clock. Call periodically (the worker checks every second).
        /// </summary>
        /// <returns>The trip, or null.</returns>
        public RunGuardTrip? CheckIdle()
        {
            lock (_Lock)
            {
                if (_Trip != null) return _Trip;
                if (_Options.NoProgressSeconds <= 0) return null;
                if (_OpenIds.Count + _OpenAnonymous > 0) return null;
                long idleMs = _ClockMs() - _LastProgressMs;
                if (idleMs < (long)_Options.NoProgressSeconds * 1000) return null;
                _Trip = Make("noProgressSeconds", RunOutcomeEnum.NoProgress,
                    "The run made no progress for " + Number(idleMs / 1000) + " seconds (no assistant text, thinking, tool call, or tool result, and no tool call open); its noProgressSeconds limit is " + Number(_Options.NoProgressSeconds) + ".");
                return _Trip;
            }
        }

        #endregion

        #region Private-Methods

        private void Progress()
        {
            _LastProgressMs = _ClockMs();
        }

        private void OpenToolCall(string? id)
        {
            if (!String.IsNullOrEmpty(id) && _OpenIds.Count < _MaxTrackedToolCalls)
            {
                if (!_OpenIds.Contains(id)) _OpenIds.Add(id);
                return;
            }
            _OpenAnonymous++;
        }

        private void CloseToolCall(string? id)
        {
            if (!String.IsNullOrEmpty(id) && _OpenIds.Remove(id)) return;
            if (_OpenAnonymous > 0)
            {
                _OpenAnonymous--;
                return;
            }
            if (_OpenIds.Count > 0) _OpenIds.RemoveAt(0);
        }

        private void CloseAllToolCalls()
        {
            _OpenIds.Clear();
            _OpenAnonymous = 0;
        }

        private void ResetRepetition()
        {
            _WindowChars = 0;
            _RecentPosition = 0;
            _DegenerateRun = 0;
            Array.Clear(_Matches, 0, _Matches.Length);
        }

        private void AppendText(string? text)
        {
            if (String.IsNullOrEmpty(text)) return;
            _AssistantChars += text.Length;
            if (_Options.MaxAssistantChars > 0 && _AssistantChars > _Options.MaxAssistantChars)
            {
                _Trip = Make("maxAssistantChars", RunOutcomeEnum.OutputLimitExceeded,
                    "Assistant text passed the run's maxAssistantChars limit of " + Number(_Options.MaxAssistantChars) + " characters.");
                return;
            }
            if (!_Options.RepetitionGuard) return;

            int size = _Recent.Length;
            int window = _Options.RepetitionWindowChars;
            foreach (char c in text)
            {
                long available = Math.Min(_WindowChars, size);
                for (int p = 1; p <= size; p++)
                {
                    if (p > available)
                    {
                        _Matches[p] = 0;
                        continue;
                    }
                    char previous = _Recent[(_RecentPosition - p + size) % size];
                    _Matches[p] = previous == c ? _Matches[p] + 1 : 0;
                }
                _Recent[_RecentPosition] = c;
                _RecentPosition = (_RecentPosition + 1) % size;
                _WindowChars++;

                _DegenerateRun = Char.IsLetterOrDigit(c) ? 0 : _DegenerateRun + 1;
                if (_Options.DegenerateChars > 0 && _DegenerateRun >= _Options.DegenerateChars)
                {
                    _Trip = Make("repetitionGuard", RunOutcomeEnum.RepetitionDetected,
                        "Repetition guard: the last " + Number(_DegenerateRun) + " characters of assistant text contain no letters or digits (only whitespace, punctuation, or symbols), ending with \"" + Preview(LastChars(Math.Min(size, 24))) + "\".");
                    return;
                }

                if (_WindowChars < window) continue;
                for (int p = 1; p <= size; p++)
                {
                    // The whole window has period p when every character after its first p matches the one p back.
                    if (_Matches[p] < window - p) continue;
                    if (window / p < _Options.MinRepeats) continue;
                    _Trip = Make("repetitionGuard", RunOutcomeEnum.RepetitionDetected,
                        "Repetition guard: the last " + Number(window) + " characters of assistant text are the " + Number(p) + "-character unit \"" + Preview(LastChars(p)) + "\" repeated " + Number(window / p) + " times.");
                    return;
                }
            }
        }

        private string LastChars(int count)
        {
            int size = _Recent.Length;
            int length = (int)Math.Min(Math.Min(count, size), _WindowChars);
            StringBuilder builder = new StringBuilder(length);
            for (int i = length; i >= 1; i--) builder.Append(_Recent[(_RecentPosition - i + size) % size]);
            return builder.ToString();
        }

        private static string Preview(string unit)
        {
            StringBuilder builder = new StringBuilder();
            foreach (char c in unit)
            {
                switch (c)
                {
                    case '\n':
                        builder.Append("\\n");
                        break;
                    case '\r':
                        builder.Append("\\r");
                        break;
                    case '\t':
                        builder.Append("\\t");
                        break;
                    case '"':
                        builder.Append("\\\"");
                        break;
                    default:
                        if (Char.IsControl(c)) builder.Append("\\u" + ((int)c).ToString("x4", CultureInfo.InvariantCulture));
                        else builder.Append(c);
                        break;
                }
            }
            return builder.ToString();
        }

        private static string Number(long value)
        {
            return value.ToString("N0", CultureInfo.InvariantCulture);
        }

        private static RunGuardTrip Make(string guard, RunOutcomeEnum outcome, string reason)
        {
            RunGuardTrip trip = new RunGuardTrip();
            trip.Guard = guard;
            trip.Outcome = outcome;
            trip.Reason = reason;
            return trip;
        }

        #endregion
    }
}
