namespace Garrison.Server.Runtime
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Memory;

    /// <summary>
    /// The IAgentMemoryStore the server registers by default when agent memory is on (AA4): it reads and writes the Agent
    /// scope of scoped memory, so code written against the agent memory interface sees what the memory tools write and
    /// its writes get metadata and appear in listings. Thread-safe.
    /// </summary>
    public sealed class ScopedAgentMemoryStore : IAgentMemoryStore
    {
        #region Private-Members

        private readonly Func<MemoryService> _Memory;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="memory">Returns the memory service.</param>
        /// <exception cref="ArgumentNullException">Thrown when memory is null.</exception>
        public ScopedAgentMemoryStore(Func<MemoryService> memory)
        {
            _Memory = memory ?? throw new ArgumentNullException(nameof(memory));
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<string?> ReadAsync(string tenantId, string agentId, string key, CancellationToken token)
        {
            Validate(tenantId, agentId);
            MemoryReadResult result = await _Memory().ReadAsync(tenantId, MemoryScopeKindEnum.Agent, agentId, key, token).ConfigureAwait(false);
            return result.Value;
        }

        /// <inheritdoc />
        public async Task WriteAsync(string tenantId, string agentId, string key, string value, CancellationToken token)
        {
            Validate(tenantId, agentId);
            if (value == null) throw new ArgumentNullException(nameof(value));
            MemoryWriteRequest request = new MemoryWriteRequest();
            request.TenantId = tenantId;
            request.ScopeKind = MemoryScopeKindEnum.Agent;
            request.ScopeId = agentId;
            request.Key = key;
            request.Value = value;
            await _Memory().WriteAsync(request, Writer(), token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task DeleteAsync(string tenantId, string agentId, string key, CancellationToken token)
        {
            Validate(tenantId, agentId);
            await _Memory().DeleteAsync(tenantId, MemoryScopeKindEnum.Agent, agentId, key, null, Writer(), token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private static MemoryWriter Writer()
        {
            MemoryWriter writer = new MemoryWriter();
            writer.PrincipalType = PrincipalTypeEnum.Administrator;
            writer.Name = "agent memory interface";
            return writer;
        }

        private static void Validate(string tenantId, string agentId)
        {
            if (String.IsNullOrWhiteSpace(tenantId) || tenantId.Length > 256) throw new ArgumentException("Memory identifiers must contain 1 to 256 characters.", nameof(tenantId));
            if (String.IsNullOrWhiteSpace(agentId) || agentId.Length > 256) throw new ArgumentException("Memory identifiers must contain 1 to 256 characters.", nameof(agentId));
        }

        #endregion
    }
}
