namespace Garrison.Core.Memory
{
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>Replaceable durable agent memory. Implementations isolate tenant and agent scopes; values are opaque text.</summary>
    public interface IAgentMemoryStore
    {
        /// <summary>Read one key; return null when absent.</summary>
        /// <param name="tenantId">Authenticated tenant.</param><param name="agentId">Authorized agent.</param><param name="key">Memory key.</param><param name="token">Cancellation.</param>
        /// <returns>Stored text, or null.</returns>
        Task<string?> ReadAsync(string tenantId, string agentId, string key, CancellationToken token);

        /// <summary>Atomically replace one key. Repeating the same write is idempotent.</summary>
        /// <param name="tenantId">Authenticated tenant.</param><param name="agentId">Authorized agent.</param><param name="key">Memory key.</param><param name="value">Opaque memory text.</param><param name="token">Cancellation.</param>
        /// <returns>Completion.</returns>
        Task WriteAsync(string tenantId, string agentId, string key, string value, CancellationToken token);

        /// <summary>Delete one key. An absent key is a successful no-op.</summary>
        /// <param name="tenantId">Authenticated tenant.</param><param name="agentId">Authorized agent.</param><param name="key">Memory key.</param><param name="token">Cancellation.</param>
        /// <returns>Completion.</returns>
        Task DeleteAsync(string tenantId, string agentId, string key, CancellationToken token);
    }
}
