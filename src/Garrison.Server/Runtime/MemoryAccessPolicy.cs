namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Memory;

    /// <summary>
    /// Who may use which memory scope (AA4.5). A run reads and writes its own agent's Agent scope and the App scopes of
    /// the apps its agent is a member of. OrgUnit and Organization scopes are refused until organizations exist (AA7),
    /// when a run will read and write its unit's scope, read its ancestors' unit scopes and its organization's scope, and
    /// leads will read their subtree's unit scopes; nobody writes upward. People and API credentials need Read, Update,
    /// or Delete on Memory, checked by the caller. Thread-safe.
    /// </summary>
    public class MemoryAccessPolicy
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public MemoryAccessPolicy(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The Read, Update, or Delete permission on Memory a person or credential needs for an operation.
        /// </summary>
        /// <param name="operation">read, list, search, write, or delete.</param>
        /// <returns>Operation type.</returns>
        public static OperationTypeEnum PermissionFor(string operation)
        {
            if (String.Equals(operation, "write", StringComparison.OrdinalIgnoreCase)) return OperationTypeEnum.Update;
            if (String.Equals(operation, "delete", StringComparison.OrdinalIgnoreCase)) return OperationTypeEnum.Delete;
            return OperationTypeEnum.Read;
        }

        /// <summary>
        /// The scopes a run may read, in order: its agent's scope first, then the App scopes of its agent's apps.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">The run's agent.</param>
        /// <param name="scopedEnabled">Whether the shared scopes are turned on (Memory.Scoped.Enabled).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Readable scopes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or agentId is null or empty.</exception>
        public async Task<List<MemoryScopeRef>> ReadableScopesAsync(string tenantId, string agentId, bool scopedEnabled, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            List<MemoryScopeRef> scopes = new List<MemoryScopeRef> { new MemoryScopeRef(MemoryScopeKindEnum.Agent, agentId) };
            if (!scopedEnabled) return scopes;
            foreach (string appId in await _Database.Apps.AppIdsWithMemberAsync(tenantId, agentId, token).ConfigureAwait(false))
                scopes.Add(new MemoryScopeRef(MemoryScopeKindEnum.App, appId));
            return scopes;
        }

        /// <summary>
        /// Decide whether a run of an agent may use a scope.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">The run's agent.</param>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <param name="write">True for writes and deletes, false for reads, lists, and searches.</param>
        /// <param name="scopedEnabled">Whether the shared scopes are turned on (Memory.Scoped.Enabled).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Decision; Code is Forbidden, OrganizationsUnavailable, or ScopedMemoryDisabled when refused.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId, agentId, or scopeId is null or empty.</exception>
        public async Task<MemoryAccessDecision> CheckRunAsync(string tenantId, string agentId, MemoryScopeKindEnum scopeKind, string scopeId, bool write, bool scopedEnabled, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            if (String.IsNullOrEmpty(scopeId)) throw new ArgumentNullException(nameof(scopeId));
            switch (scopeKind)
            {
                case MemoryScopeKindEnum.Agent:
                    return String.Equals(scopeId, agentId, StringComparison.Ordinal)
                        ? MemoryAccessDecision.Allow()
                        : MemoryAccessDecision.Deny("Forbidden", "A run uses only its own agent's Agent scope.");
                case MemoryScopeKindEnum.App:
                    if (!scopedEnabled) return MemoryAccessDecision.Deny("ScopedMemoryDisabled", "Shared memory scopes are turned off on this server (Memory.Scoped.Enabled).");
                    List<string> apps = await _Database.Apps.AppIdsWithMemberAsync(tenantId, agentId, token).ConfigureAwait(false);
                    return apps.Contains(scopeId)
                        ? MemoryAccessDecision.Allow()
                        : MemoryAccessDecision.Deny("Forbidden", "A run uses only the App scopes of apps its agent is a member of.");
                default:
                    return MemoryAccessDecision.Deny("OrganizationsUnavailable", scopeKind + " memory scopes arrive with organizations; use the Agent or App scope instead.");
            }
        }

        #endregion
    }
}
