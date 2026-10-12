namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Concurrent;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Worker.Execution;

    /// <summary>
    /// Executor that records every launch (the point where a real executor would start the harness), then holds for
    /// <see cref="HoldMs"/> or until cancelled, and succeeds with its name as the result text. Used to count how many
    /// times a run executes across workers. Thread-safe.
    /// </summary>
    public sealed class HoldingExecutor : IRunExecutor
    {
        #region Public-Members

        /// <summary>
        /// Launches so far.
        /// </summary>
        public int Executed
        {
            get
            {
                return Volatile.Read(ref _Executed);
            }
        }

        /// <summary>
        /// Run identifiers launched, with the epoch of each launch.
        /// </summary>
        public ConcurrentQueue<string> Launches { get; } = new ConcurrentQueue<string>();

        /// <summary>
        /// Milliseconds each execution holds before succeeding. Minimum 0, default 0.
        /// </summary>
        public int HoldMs
        {
            get
            {
                return _HoldMs;
            }
            set
            {
                _HoldMs = Math.Max(0, value);
            }
        }

        #endregion

        #region Private-Members

        private readonly string _Name;
        private int _Executed = 0;
        private int _HoldMs = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="name">Name returned as the result text.</param>
        public HoldingExecutor(string name)
        {
            _Name = name ?? String.Empty;
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<RunCompleteRequest> ExecuteAsync(RunAssignment assignment, IRunReporter reporter, CancellationToken token)
        {
            Interlocked.Increment(ref _Executed);
            Launches.Enqueue(assignment.RunId + "@" + assignment.Epoch);
            RunCompleteRequest complete = new RunCompleteRequest();
            try
            {
                if (_HoldMs > 0) await Task.Delay(_HoldMs, token).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                complete.Status = RunStatusEnum.Cancelled;
                complete.Outcome = RunOutcomeEnum.Cancelled;
                return complete;
            }
            complete.Status = RunStatusEnum.Succeeded;
            complete.Outcome = RunOutcomeEnum.Succeeded;
            complete.ResultText = _Name;
            return complete;
        }

        /// <inheritdoc />
        public void Release(RunAssignment assignment, bool succeeded)
        {
        }

        #endregion
    }
}
