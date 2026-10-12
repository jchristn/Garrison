namespace Garrison.Worker.Hosting
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using Garrison.Core.Compilation;
    using Garrison.Core.Protocol;
    using Garrison.Core.Telemetry;
    using Garrison.Worker.Execution;

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
        /// Log fields identifying the run: run=&lt;runId&gt; trace=&lt;traceId&gt; tenant=... agent=... deployment=... (P13.26).
        /// </summary>
        public string LogFields
        {
            get
            {
                ExecutionSpec spec = Assignment.Spec ?? new ExecutionSpec();
                return RunTracing.LogFields(RunId, TraceId) + " " + GarrisonTracing.LogFields("tenant", spec.TenantId, "agent", spec.AgentName, "deployment", String.IsNullOrEmpty(spec.DeploymentName) ? spec.DeploymentId : spec.DeploymentName);
            }
        }

        /// <summary>
        /// Event reporter of the run once it is executing, or null. Approval notices from the watch are recorded through it.
        /// </summary>
        public IRunReporter? Reporter
        {
            get
            {
                return Volatile.Read(ref _Reporter);
            }
            set
            {
                Volatile.Write(ref _Reporter, value);
            }
        }

        /// <summary>
        /// Approval notice keys (approvalId:Status) already recorded for this run (P12.3).
        /// </summary>
        public List<string> KnownApprovals
        {
            get
            {
                lock (_ApprovalLock)
                {
                    return _KnownApprovals.ToList();
                }
            }
        }

        #endregion

        #region Private-Members

        private IRunReporter? _Reporter = null;
        private readonly HashSet<string> _KnownApprovals = new HashSet<string>(StringComparer.Ordinal);
        private readonly object _ApprovalLock = new object();
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
        /// Remember an approval notice key.
        /// </summary>
        /// <param name="key">Key (approvalId:Status).</param>
        /// <returns>True when the key is new and the notice should be recorded.</returns>
        public bool AddApproval(string key)
        {
            if (String.IsNullOrEmpty(key)) return false;
            lock (_ApprovalLock)
            {
                return _KnownApprovals.Add(key);
            }
        }

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
