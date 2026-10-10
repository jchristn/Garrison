namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>
    /// Cluster MCP sessions (G-1).
    /// </summary>
    public interface IMcpSessionMethods
    {
        /// <summary>
        /// Create a session.
        /// </summary>
        /// <param name="session">Session.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The session.</returns>
        /// <exception cref="ArgumentNullException">Thrown when session is null.</exception>
        Task<McpSession> CreateAsync(McpSession session, CancellationToken token = default);

        /// <summary>
        /// Read a session that has not expired.
        /// </summary>
        /// <param name="id">Session identifier.</param>
        /// <param name="nowUtc">Current time.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Session or null.</returns>
        Task<McpSession?> ReadActiveAsync(string id, DateTime nowUtc, CancellationToken token = default);

        /// <summary>
        /// Record use of a session that has not expired and push its expiry out.
        /// </summary>
        /// <param name="id">Session identifier.</param>
        /// <param name="nowUtc">Current time.</param>
        /// <param name="expiresUtc">New expiry.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>False when the session is gone or expired.</returns>
        Task<bool> TouchAsync(string id, DateTime nowUtc, DateTime expiresUtc, CancellationToken token = default);

        /// <summary>
        /// Delete a session.
        /// </summary>
        /// <param name="id">Session identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a row was deleted.</returns>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Delete expired sessions.
        /// </summary>
        /// <param name="nowUtc">Current time.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows deleted.</returns>
        Task<int> PruneExpiredAsync(DateTime nowUtc, CancellationToken token = default);
    }
}
