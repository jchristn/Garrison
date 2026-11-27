namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// Organization, org unit, and organization revision data access (AA7). Every read filters by tenant. Unit writes
    /// replace a unit's members, peer lines, and budgets in one transaction; revision snapshots are written once and never
    /// change. Implementations are thread-safe.
    /// </summary>
    public interface IOrganizationMethods
    {
        /// <summary>
        /// Insert an organization (its units are written separately).
        /// </summary>
        /// <param name="obj">Organization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored organization.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Organization> CreateAsync(Organization obj, CancellationToken token = default);

        /// <summary>
        /// Update an organization's name, description, mission, status, root unit, and live revision.
        /// </summary>
        /// <param name="obj">Organization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored organization.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Organization> UpdateAsync(Organization obj, CancellationToken token = default);

        /// <summary>
        /// Move an organization's last update time to now, so watchers see a change to its tree or revisions.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Organization identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task TouchAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read an organization in a tenant, without its units.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Organization identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The organization, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task<Organization?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read an organization by name in a tenant, without its units.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The organization, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or name is null or empty.</exception>
        Task<Organization?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Enumerate a tenant's organizations by name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="query">Paging and search (name).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or query is null.</exception>
        Task<EnumerationResult<Organization>> EnumerateAsync(string tenantId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Organizations with a live revision whose status is Active or Frozen, oldest first. The chain of command reads
        /// these.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Organizations.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        Task<List<Organization>> ListLiveAsync(string tenantId, CancellationToken token = default);

        /// <summary>
        /// Organizations with a live revision whose status is Active or Frozen, in every tenant, oldest first. The budget
        /// guard's sweep reads these (AA11.5).
        /// </summary>
        /// <param name="limit">Most organizations, 1 to 100000.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Organizations.</returns>
        Task<List<Organization>> ListLiveAcrossTenantsAsync(int limit, CancellationToken token = default);

        /// <summary>
        /// Delete an organization with its units and revisions.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Organization identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when it existed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Insert a unit with its members, peer lines, and budgets.
        /// </summary>
        /// <param name="unit">Unit.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored unit.</returns>
        /// <exception cref="ArgumentNullException">Thrown when unit is null.</exception>
        Task<OrgUnit> CreateUnitAsync(OrgUnit unit, CancellationToken token = default);

        /// <summary>
        /// Replace a unit and its members, peer lines, and budgets.
        /// </summary>
        /// <param name="unit">Unit.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored unit.</returns>
        /// <exception cref="ArgumentNullException">Thrown when unit is null.</exception>
        Task<OrgUnit> UpdateUnitAsync(OrgUnit unit, CancellationToken token = default);

        /// <summary>
        /// Read a unit of the working tree with its children and names.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="unitId">Unit identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The unit, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or unitId is null or empty.</exception>
        Task<OrgUnit?> ReadUnitAsync(string tenantId, string unitId, CancellationToken token = default);

        /// <summary>
        /// Every unit of an organization's working tree with its children and names, ordered by creation.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="organizationId">Organization identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Units.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or organizationId is null or empty.</exception>
        Task<List<OrgUnit>> ListUnitsAsync(string tenantId, string organizationId, CancellationToken token = default);

        /// <summary>
        /// How many units an agent leads in organizations that are not Retired, in their working trees (AA8.1).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        Task<int> CountLedUnitsAsync(string tenantId, string agentId, CancellationToken token = default);

        /// <summary>
        /// Delete a unit and every peer line that points at it.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="unitId">Unit identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when it existed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or unitId is null or empty.</exception>
        Task<bool> DeleteUnitAsync(string tenantId, string unitId, CancellationToken token = default);

        /// <summary>
        /// Replace an organization's whole working tree with the given units and set its root, in one transaction. Used by
        /// rollback and manifest apply.
        /// </summary>
        /// <param name="organization">Organization; its root unit is updated.</param>
        /// <param name="units">Units of the new tree.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization or units is null.</exception>
        Task ReplaceTreeAsync(Organization organization, List<OrgUnit> units, CancellationToken token = default);

        /// <summary>
        /// Insert a revision with its snapshot. Its number is one more than the organization's highest.
        /// </summary>
        /// <param name="revision">Revision with units and pinned mandates.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored revision with its number.</returns>
        /// <exception cref="ArgumentNullException">Thrown when revision is null.</exception>
        Task<OrgRevision> CreateRevisionAsync(OrgRevision revision, CancellationToken token = default);

        /// <summary>
        /// Read a revision with its snapshot and names.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="revisionId">Revision identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The revision, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or revisionId is null or empty.</exception>
        Task<OrgRevision?> ReadRevisionAsync(string tenantId, string revisionId, CancellationToken token = default);

        /// <summary>
        /// An organization's revisions, newest first, without snapshots.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="organizationId">Organization identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revisions.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or organizationId is null or empty.</exception>
        Task<List<OrgRevision>> ListRevisionsAsync(string tenantId, string organizationId, CancellationToken token = default);

        /// <summary>
        /// Make a draft revision live: the previous live revision becomes Superseded, this one Published, and the
        /// organization points at it (a Draft organization becomes Active). One transaction.
        /// </summary>
        /// <param name="organization">Organization; its live revision fields and status are updated.</param>
        /// <param name="revision">Draft revision of the organization; its state and publish time are updated.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>False when the revision was not a draft any more.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        Task<bool> PublishRevisionAsync(Organization organization, OrgRevision revision, CancellationToken token = default);
    }
}
