namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>
    /// Messages of the polling event backplane (P10.4).
    /// </summary>
    public interface IBackplaneMessageMethods
    {
        /// <summary>
        /// Append messages. The database assigns ascending sequences.
        /// </summary>
        /// <param name="messages">Messages.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when messages is null.</exception>
        Task InsertAsync(List<BackplaneMessage> messages, CancellationToken token = default);

        /// <summary>
        /// Messages with a sequence above a value, ascending.
        /// </summary>
        /// <param name="afterSequence">Exclusive lower bound.</param>
        /// <param name="limit">Maximum messages (1 to 10000).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Messages.</returns>
        Task<List<BackplaneMessage>> ListAfterAsync(long afterSequence, int limit, CancellationToken token = default);

        /// <summary>
        /// Highest sequence assigned so far, or 0.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Sequence.</returns>
        Task<long> MaxSequenceAsync(CancellationToken token = default);

        /// <summary>
        /// Delete messages created before a cutoff.
        /// </summary>
        /// <param name="olderThanUtc">Cutoff.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows deleted.</returns>
        Task<int> PruneAsync(DateTime olderThanUtc, CancellationToken token = default);
    }
}
