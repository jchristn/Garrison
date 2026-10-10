namespace Garrison.Worker.Reporting
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Protocol;
    using Garrison.Worker.Execution;

    /// <summary>
    /// Reporter that keeps events in memory. Used by tests and diagnostics. Thread-safe.
    /// </summary>
    public class InMemoryRunReporter : IRunReporter
    {
        #region Public-Members

        /// <summary>
        /// Process identifier reported at start, or null.
        /// </summary>
        public int? ProcessId { get; private set; } = null;

        /// <summary>
        /// Whether start was reported.
        /// </summary>
        public bool Started { get; private set; } = false;

        #endregion

        #region Private-Members

        private readonly List<RunEventReport> _Events = new List<RunEventReport>();
        private readonly object _Lock = new object();
        private long _Sequence = 0;

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task StartedAsync(int? processId, CancellationToken token)
        {
            ProcessId = processId;
            Started = true;
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public void Emit(RunEventReport report)
        {
            if (report == null) return;
            lock (_Lock)
            {
                report.Sequence = ++_Sequence;
                _Events.Add(report);
            }
        }

        /// <inheritdoc />
        public Task FlushAsync(CancellationToken token)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Snapshot of the events.
        /// </summary>
        /// <returns>Events in sequence order.</returns>
        public List<RunEventReport> Events()
        {
            lock (_Lock)
            {
                return new List<RunEventReport>(_Events);
            }
        }

        #endregion
    }
}
