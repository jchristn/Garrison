namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;

    /// <summary>
    /// Follows runs to a terminal status by polling GET run. Stateless apart from its settings; thread-safe.
    /// </summary>
    public class RunFollower
    {
        #region Public-Members

        /// <summary>
        /// Terminal run statuses.
        /// </summary>
        public static readonly IReadOnlyList<string> TerminalStatuses = new List<string> { "Succeeded", "Failed", "Cancelled", "TimedOut", "Rejected" };

        /// <summary>
        /// Poll interval in milliseconds. Default 100, minimum 10, maximum 10000.
        /// </summary>
        public int PollMs
        {
            get
            {
                return _PollMs;
            }
            set
            {
                if (value < 10 || value > 10000) throw new ArgumentOutOfRangeException(nameof(PollMs));
                _PollMs = value;
            }
        }

        #endregion

        #region Private-Members

        private readonly GarrisonClient _Client;
        private int _PollMs = 100;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="client">Client.</param>
        /// <exception cref="ArgumentNullException">Thrown when client is null.</exception>
        public RunFollower(GarrisonClient client)
        {
            _Client = client ?? throw new ArgumentNullException(nameof(client));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether a status is terminal.
        /// </summary>
        /// <param name="status">Status.</param>
        /// <returns>True when terminal.</returns>
        public static bool IsTerminal(string? status)
        {
            return status != null && TerminalStatuses.Contains(status);
        }

        /// <summary>
        /// Poll a run until it is terminal or the timeout passes.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="runId">Run.</param>
        /// <param name="timeout">Longest wait.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The last run read (terminal unless the timeout passed), or null when it could never be read.</returns>
        public async Task<Run?> WaitTerminalAsync(string tenantId, string runId, TimeSpan timeout, CancellationToken token)
        {
            return await WaitUntilAsync(tenantId, runId, timeout, r => IsTerminal(r.Status), token).ConfigureAwait(false);
        }

        /// <summary>
        /// Poll a run until a condition holds or the timeout passes.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="runId">Run.</param>
        /// <param name="timeout">Longest wait.</param>
        /// <param name="condition">Condition on the run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The last run read, or null when it could never be read.</returns>
        /// <exception cref="ArgumentNullException">Thrown when condition is null.</exception>
        public async Task<Run?> WaitUntilAsync(string tenantId, string runId, TimeSpan timeout, Func<Run, bool> condition, CancellationToken token)
        {
            if (condition == null) throw new ArgumentNullException(nameof(condition));
            DateTime deadline = DateTime.UtcNow + timeout;
            Run? last = null;
            while (true)
            {
                token.ThrowIfCancellationRequested();
                ApiResponse<Run> response = await _Client.GetRunAsync(tenantId, runId, token).ConfigureAwait(false);
                if (response.Body != null)
                {
                    last = response.Body;
                    if (condition(last)) return last;
                    if (IsTerminal(last.Status)) return last;
                }
                if (DateTime.UtcNow >= deadline) return last;
                await Task.Delay(_PollMs, token).ConfigureAwait(false);
            }
        }

        #endregion
    }
}
