namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;

    /// <summary>
    /// The chain of command (AA7.5): where an agent sits in each organization's live revision, its manager, the chain
    /// above it, its direct reports, its subtree, and whether a reporting or peer line joins two agents. Escalations,
    /// reports, memory, messaging, freezes, and budgets all ask this class, so they agree. Organizations that are Draft
    /// or Retired, and working trees that were never published, do not count. Published snapshots never change, so their
    /// units are cached by revision; the list of live organizations is read on every call. Thread-safe.
    /// </summary>
    public class ChainOfCommand
    {
        #region Public-Members

        /// <summary>
        /// Most revision snapshots kept in memory before the cache is emptied. Default 256, minimum 1.
        /// </summary>
        public int MaxCachedRevisions
        {
            get
            {
                return _MaxCachedRevisions;
            }
            set
            {
                _MaxCachedRevisions = Math.Max(1, value);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly ConcurrentDictionary<string, List<OrgUnit>> _Snapshots = new ConcurrentDictionary<string, List<OrgUnit>>(StringComparer.Ordinal);
        private int _MaxCachedRevisions = 256;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public ChainOfCommand(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The live tree of every Active or Frozen organization in a tenant, oldest organization first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Trees.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<List<OrgTree>> LiveTreesAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<OrgTree> trees = new List<OrgTree>();
            foreach (Organization organization in await _Database.Organizations.ListLiveAsync(tenantId, token).ConfigureAwait(false))
            {
                OrgTree? tree = await TreeAsync(organization, token).ConfigureAwait(false);
                if (tree != null) trees.Add(tree);
            }
            return trees;
        }

        /// <summary>
        /// The live tree of one organization, or null when it has no live revision or is Draft or Retired.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="organizationId">Organization identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tree or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<OrgTree?> LiveTreeAsync(string tenantId, string? organizationId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(organizationId)) return null;
            Organization? organization = await _Database.Organizations.ReadAsync(tenantId, organizationId, token).ConfigureAwait(false);
            if (organization == null || !IsLive(organization)) return null;
            return await TreeAsync(organization, token).ConfigureAwait(false);
        }

        /// <summary>
        /// The live tree that contains a unit, or null.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="unitId">Unit identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tree or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<OrgTree?> TreeOfUnitAsync(string tenantId, string? unitId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(unitId)) return null;
            foreach (OrgTree tree in await LiveTreesAsync(tenantId, token).ConfigureAwait(false))
            {
                if (tree.Unit(unitId) != null) return tree;
            }
            return null;
        }

        /// <summary>
        /// Every position an agent holds in live organizations, oldest organization first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Positions; empty when the agent belongs to no live organization.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<List<OrgPosition>> PositionsAsync(string tenantId, string? agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<OrgPosition> result = new List<OrgPosition>();
            if (String.IsNullOrEmpty(agentId)) return result;
            foreach (OrgTree tree in await LiveTreesAsync(tenantId, token).ConfigureAwait(false))
            {
                OrgPosition? position = tree.PositionOf(agentId);
                if (position != null) result.Add(position);
            }
            return result;
        }

        /// <summary>
        /// The managers of an agent across live organizations: the agents directly above it. An agent at the top of an
        /// organization has the board as its manager there, which adds no agent; see <see cref="BoardManagesAsync"/>.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Distinct manager agent identifiers.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<List<string>> ManagersAsync(string tenantId, string? agentId, CancellationToken token = default)
        {
            List<string> result = new List<string>();
            foreach (OrgPosition position in await PositionsAsync(tenantId, agentId, token).ConfigureAwait(false))
            {
                if (!position.ManagerIsBoard && !result.Contains(position.ManagerAgentId!)) result.Add(position.ManagerAgentId!);
            }
            return result;
        }

        /// <summary>
        /// Whether the board (people) is the agent's manager in at least one live organization: it leads a root unit, or
        /// no lead sits above it.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the board is above the agent somewhere.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<bool> BoardManagesAsync(string tenantId, string? agentId, CancellationToken token = default)
        {
            List<OrgPosition> positions = await PositionsAsync(tenantId, agentId, token).ConfigureAwait(false);
            return positions.Any(p => p.ManagerIsBoard);
        }

        /// <summary>
        /// The leads above an agent in every live organization, nearest first within each organization.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Distinct agent identifiers.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<List<string>> ChainAsync(string tenantId, string? agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<string> result = new List<string>();
            if (String.IsNullOrEmpty(agentId)) return result;
            foreach (OrgTree tree in await LiveTreesAsync(tenantId, token).ConfigureAwait(false))
            {
                foreach (string id in tree.Chain(agentId))
                {
                    if (!result.Contains(id)) result.Add(id);
                }
            }
            return result;
        }

        /// <summary>
        /// The agents that report directly to an agent in every live organization.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Distinct agent identifiers.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<List<string>> DirectReportsAsync(string tenantId, string? agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<string> result = new List<string>();
            if (String.IsNullOrEmpty(agentId)) return result;
            foreach (OrgTree tree in await LiveTreesAsync(tenantId, token).ConfigureAwait(false))
            {
                foreach (string id in tree.DirectReports(agentId))
                {
                    if (!result.Contains(id)) result.Add(id);
                }
            }
            return result;
        }

        /// <summary>
        /// Every agent below an agent: for each unit it leads in a live organization, the leads and members of that unit's
        /// subtree, without the agent itself.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Agent identifiers.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<HashSet<string>> SubordinatesAsync(string tenantId, string? agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            HashSet<string> result = new HashSet<string>(StringComparer.Ordinal);
            if (String.IsNullOrEmpty(agentId)) return result;
            foreach (OrgTree tree in await LiveTreesAsync(tenantId, token).ConfigureAwait(false))
            {
                OrgPosition? position = tree.PositionOf(agentId);
                if (position == null || !position.IsLead) continue;
                result.UnionWith(tree.SubtreeAgentIds(position.UnitId));
            }
            result.Remove(agentId);
            return result;
        }

        /// <summary>
        /// Leads and members of a unit's subtree in its organization's live revision.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="unitId">Unit identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Agent identifiers; empty when the unit is not in a live revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<HashSet<string>> SubtreeAgentIdsAsync(string tenantId, string? unitId, CancellationToken token = default)
        {
            OrgTree? tree = await TreeOfUnitAsync(tenantId, unitId, token).ConfigureAwait(false);
            return tree == null ? new HashSet<string>(StringComparer.Ordinal) : tree.SubtreeAgentIds(unitId!);
        }

        /// <summary>
        /// How the second agent stands to the first in any live organization: Manager when it is the first agent's
        /// manager, DirectReport when it reports to the first agent, Peer when their units share a peer line, otherwise
        /// None. A reporting line wins over a peer line.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="firstAgentId">First agent.</param>
        /// <param name="secondAgentId">Second agent.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Relation.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<OrgRelationEnum> RelationAsync(string tenantId, string? firstAgentId, string? secondAgentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(firstAgentId) || String.IsNullOrEmpty(secondAgentId) || firstAgentId == secondAgentId) return OrgRelationEnum.None;
            bool peer = false;
            foreach (OrgTree tree in await LiveTreesAsync(tenantId, token).ConfigureAwait(false))
            {
                OrgPosition? first = tree.PositionOf(firstAgentId);
                OrgPosition? second = tree.PositionOf(secondAgentId);
                if (first == null || second == null) continue;
                if (first.ManagerAgentId == secondAgentId) return OrgRelationEnum.Manager;
                if (second.ManagerAgentId == firstAgentId) return OrgRelationEnum.DirectReport;
                if (tree.PeerLine(firstAgentId, secondAgentId)) peer = true;
            }
            return peer ? OrgRelationEnum.Peer : OrgRelationEnum.None;
        }

        /// <summary>
        /// Build a tree for an organization from its live revision, using the snapshot cache.
        /// </summary>
        /// <param name="organization">Organization with a live revision.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tree, or null when the organization has no live revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization is null.</exception>
        public async Task<OrgTree?> TreeAsync(Organization organization, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (String.IsNullOrEmpty(organization.CurrentRevisionId)) return null;
            string revisionId = organization.CurrentRevisionId;
            if (!_Snapshots.TryGetValue(revisionId, out List<OrgUnit>? units))
            {
                OrgRevision? revision = await _Database.Organizations.ReadRevisionAsync(organization.TenantId, revisionId, token).ConfigureAwait(false);
                if (revision == null) return null;
                units = revision.Units;
                if (_Snapshots.Count >= _MaxCachedRevisions) _Snapshots.Clear();
                _Snapshots[revisionId] = units;
            }
            return new OrgTree(organization, units, revisionId);
        }

        #endregion

        #region Private-Methods

        private static bool IsLive(Organization organization)
        {
            return !String.IsNullOrEmpty(organization.CurrentRevisionId)
                && (organization.Status == OrganizationStatusEnum.Active || organization.Status == OrganizationStatusEnum.Frozen);
        }

        #endregion
    }
}
