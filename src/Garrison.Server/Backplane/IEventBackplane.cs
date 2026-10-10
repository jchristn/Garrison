namespace Garrison.Server.Backplane
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>
    /// Carries small messages between control-plane replicas: run changes (SSE, WebSocket, and A2A tail wake-ups), new
    /// work (lease long-poll wake-ups), and cache invalidations (P10.4, P10.5). Messages are hints that make a replica
    /// read the database sooner; every waiter still re-reads the database on its own interval, so a lost message costs
    /// latency, never correctness. Implementations are thread-safe.
    /// </summary>
    public interface IEventBackplane : IDisposable
    {
        /// <summary>
        /// Backplane name for logs and server info (Local, Polling, or PostgresNotify).
        /// </summary>
        string Name { get; }

        /// <summary>
        /// Identifier of this replica instance. Messages carry it as their origin, and a replica ignores its own.
        /// </summary>
        string InstanceId { get; }

        /// <summary>
        /// Messages sent by this replica.
        /// </summary>
        long Published { get; }

        /// <summary>
        /// Messages received from other replicas.
        /// </summary>
        long Received { get; }

        /// <summary>
        /// Raised for each message from another replica, on a background thread.
        /// </summary>
        event EventHandler<BackplaneMessage>? MessageReceived;

        /// <summary>
        /// Raised when messages may have been missed (for example after the backplane connection was re-established).
        /// Handlers should wake every waiter and drop every cache.
        /// </summary>
        event EventHandler? Resynchronized;

        /// <summary>
        /// Queue a message for the other replicas. Never blocks and never throws for delivery problems; messages are
        /// sent in small coalesced batches.
        /// </summary>
        /// <param name="message">Message.</param>
        /// <exception cref="ArgumentNullException">Thrown when message is null.</exception>
        void Publish(BackplaneMessage message);

        /// <summary>
        /// Start sending and receiving.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        Task StartAsync(CancellationToken token);

        /// <summary>
        /// Stop sending and receiving. Queued messages are sent first when possible.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        Task StopAsync(CancellationToken token);
    }
}
