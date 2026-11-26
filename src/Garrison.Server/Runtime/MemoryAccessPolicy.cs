namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Memory;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;

    /// <summary>
    /// Who may use which memory scope (AA4.5, AA7.5). A run reads and writes its own agent's Agent scope and the App scopes
    /// of the apps its agent is a member of. In a live organization it reads and writes its own unit's OrgUnit scope, reads
    /// its ancestors' unit scopes, and, when it leads its unit, reads the unit scopes of its subtree; it reads its
    /// organization's Organization scope, which only the lead of the root unit (the CEO) writes. Nobody writes upward.
    /// People and API credentials need Read, Update, or Delete on Memory, checked by the caller. Thread-safe.
    /// </summary>
    public class MemoryAccessPolicy
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly ChainOfCommand? _Chain;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database driver.</param>
        /// <param name="chain">Chain of command for the OrgUnit and Organization scopes, or null to refuse them.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public MemoryAccessPolicy(DatabaseDriverBase database, ChainOfCommand? chain = null)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Chain = chain;
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
        /// The scopes a run may read, in order: its agent's scope first, then the App scopes of its agent's apps, then for
        /// each live organization its unit's scope, its ancestors' unit scopes, and the Organization scope.
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
            if (_Chain == null) return scopes;
            foreach (OrgTree tree in await _Chain.LiveTreesAsync(tenantId, token).ConfigureAwait(false))
            {
                OrgPosition? position = tree.PositionOf(agentId);
                if (position == null) continue;
                scopes.Add(new MemoryScopeRef(MemoryScopeKindEnum.OrgUnit, position.UnitId));
                foreach (OrgUnit ancestor in tree.Ancestors(position.UnitId)) scopes.Add(new MemoryScopeRef(MemoryScopeKindEnum.OrgUnit, ancestor.Id));
                scopes.Add(new MemoryScopeRef(MemoryScopeKindEnum.Organization, tree.Organization.Id));
            }
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
                case MemoryScopeKindEnum.OrgUnit:
                case MemoryScopeKindEnum.Organization:
                    if (!scopedEnabled) return MemoryAccessDecision.Deny("ScopedMemoryDisabled", "Shared memory scopes are turned off on this server (Memory.Scoped.Enabled).");
                    if (_Chain == null) return MemoryAccessDecision.Deny("OrganizationsUnavailable", scopeKind + " memory scopes need organizations, which are not wired on this server.");
                    return await CheckOrganizationAsync(tenantId, agentId, scopeKind, scopeId, write, token).ConfigureAwait(false);
                default:
                    return MemoryAccessDecision.Deny("Forbidden", "Unknown memory scope " + scopeKind + ".");
            }
        }

        #endregion

        #region Private-Methods

        private async Task<MemoryAccessDecision> CheckOrganizationAsync(string tenantId, string agentId, MemoryScopeKindEnum scopeKind, string scopeId, bool write, CancellationToken token)
        {
            foreach (OrgTree tree in await _Chain!.LiveTreesAsync(tenantId, token).ConfigureAwait(false))
            {
                OrgPosition? position = tree.PositionOf(agentId);
                if (position == null) continue;
                if (scopeKind == MemoryScopeKindEnum.Organization)
                {
                    if (tree.Organization.Id != scopeId) continue;
                    if (!write) return MemoryAccessDecision.Allow();
                    OrgUnit? root = tree.Root;
                    return root != null && position.IsLead && position.UnitId == root.Id
                        ? MemoryAccessDecision.Allow()
                        : MemoryAccessDecision.Deny("Forbidden", "Only the lead of the root unit writes the Organization scope; nobody writes upward.");
                }
                if (tree.Unit(scopeId) == null) continue;
                if (position.UnitId == scopeId) return MemoryAccessDecision.Allow();
                if (write) return MemoryAccessDecision.Deny("Forbidden", "A run writes only its own unit's OrgUnit scope; nobody writes upward or into another unit.");
                if (tree.InSubtree(position.UnitId, scopeId)) return MemoryAccessDecision.Allow();
                if (position.IsLead && tree.InSubtree(scopeId, position.UnitId)) return MemoryAccessDecision.Allow();
                return MemoryAccessDecision.Deny("Forbidden", "A run reads its own unit, the units above it, and, when it leads its unit, the units below it.");
            }
            return MemoryAccessDecision.Deny("Forbidden", "The run's agent holds no position in the organization that owns this " + scopeKind + " scope.");
        }

        #endregion
    }
}
