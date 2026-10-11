namespace Test.Shared.Infrastructure
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Worker.Execution;

    /// <summary>
    /// Executor that records calls and succeeds with its name as the result text. Thread-safe.
    /// </summary>
    public sealed class RecordingExecutor : IRunExecutor
    {
        #region Public-Members

        /// <summary>
        /// Executions so far.
        /// </summary>
        public int Executed
        {
            get
            {
                return Volatile.Read(ref _Executed);
            }
        }

        /// <summary>
        /// Releases so far.
        /// </summary>
        public int Released
        {
            get
            {
                return Volatile.Read(ref _Released);
            }
        }

        #endregion

        #region Private-Members

        private readonly string _Name;
        private int _Executed = 0;
        private int _Released = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="name">Name returned as the result text.</param>
        public RecordingExecutor(string name)
        {
            _Name = name ?? String.Empty;
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task<RunCompleteRequest> ExecuteAsync(RunAssignment assignment, IRunReporter reporter, CancellationToken token)
        {
            Interlocked.Increment(ref _Executed);
            RunCompleteRequest complete = new RunCompleteRequest();
            complete.Status = RunStatusEnum.Succeeded;
            complete.Outcome = RunOutcomeEnum.Succeeded;
            complete.ResultText = _Name;
            return Task.FromResult(complete);
        }

        /// <inheritdoc />
        public void Release(RunAssignment assignment, bool succeeded)
        {
            Interlocked.Increment(ref _Released);
        }

        #endregion
    }
}
