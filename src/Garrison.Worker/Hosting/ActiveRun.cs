namespace Garrison.Worker.Hosting
{
    using System;
    using System.Threading;
    using Garrison.Core.Protocol;
    using Garrison.Core.Telemetry;

    /// <summary>
    /// A run currently held by this worker. Thread-safe for the members it exposes.
    /// </summary>
    public sealed class ActiveRun : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; }

        /// <summary>
        /// Fencing epoch.
        /// </summary>
        public long Epoch { get; }

        /// <summary>
        /// Assignment.
        /// </summary>
        public RunAssignment Assignment { get; }

        /// <summary>
        /// Cancellation source for the harness process.
        /// </summary>
        public CancellationTokenSource Cancellation { get; } = new CancellationTokenSource();

        /// <summary>
        /// Whether the lease was lost; no completion report is sent.
        /// </summary>
        public bool Lost
        {
            get
            {
                return Volatile.Read(ref _Lost) == 1;
            }
        }

        /// <summary>
        /// Start time (UTC).
        /// </summary>
        public DateTime StartedUtc { get; } = DateTime.UtcNow;

        /// <summary>
        /// W3C trace ID of the run (from the execution spec's traceparent), or null when the spec carries none.
        /// </summary>
        public string? TraceId { get; }

        /// <summary>
        /// Log fields identifying the run: run=&lt;runId&gt; trace=&lt;traceId&gt;.
        /// </summary>
        public string LogFields
        {
            get
            {
                return RunTracing.LogFields(RunId, TraceId);
            }
        }

        #endregion

        #region Private-Members

        private int _Lost = 0;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="assignment">Assignment.</param>
        /// <exception cref="ArgumentNullException">Thrown when assignment is null.</exception>
        public ActiveRun(RunAssignment assignment)
        {
            Assignment = assignment ?? throw new ArgumentNullException(nameof(assignment));
            RunId = assignment.RunId;
            Epoch = assignment.Epoch;
            TraceId = RunTracing.TraceIdOf(assignment.Spec?.TraceParent);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Mark the lease as lost and cancel the process.
        /// </summary>
        public void MarkLost()
        {
            Interlocked.Exchange(ref _Lost, 1);
            Cancel();
        }

        /// <summary>
        /// Cancel the process.
        /// </summary>
        public void Cancel()
        {
            try
            {
                Cancellation.Cancel();
            }
            catch (ObjectDisposedException)
            {
            }
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            if (_Disposed) return;
            _Disposed = true;
            Cancellation.Dispose();
        }

        #endregion
    }
}
