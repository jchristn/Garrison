namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;

    /// <summary>
    /// Freeze data access (AA3). Every read filters by tenant. Implementations are thread-safe.
    /// </summary>
    public interface IFreezeMethods
    {
        /// <summary>
        /// Insert a freeze.
        /// </summary>
        /// <param name="obj">Freeze.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored freeze.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Freeze> CreateAsync(Freeze obj, CancellationToken token = default);

        /// <summary>
        /// Read a freeze in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Freeze identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The freeze, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task<Freeze?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate freezes, active first, then newest first.
        /// </summary>
        /// <param name="filter">Filter with the tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter or its tenant is null.</exception>
        Task<EnumerationResult<Freeze>> EnumerateAsync(FreezeFilter filter, CancellationToken token = default);

        /// <summary>
        /// Every active freeze of a tenant, oldest first. Used to fill the admission cache.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Active freezes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        Task<List<Freeze>> ListActiveAsync(string tenantId, CancellationToken token = default);

        /// <summary>
        /// The oldest active freeze on one target, or null.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="targetKind">Target kind.</param>
        /// <param name="targetId">Target identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The freeze, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or targetId is null or empty.</exception>
        Task<Freeze?> ReadActiveAsync(string tenantId, FreezeTargetKindEnum targetKind, string targetId, CancellationToken token = default);

        /// <summary>
        /// Lift an active freeze: compare-and-set on liftedutc being null, so two lifts cannot both win.
        /// </summary>
        /// <param name="obj">Freeze with LiftedById, LiftedByName, LiftReason, and LiftedUtc set.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call lifted it.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<bool> TryLiftAsync(Freeze obj, CancellationToken token = default);

        /// <summary>
        /// Record how many runs applying the freeze cancelled.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Freeze identifier.</param>
        /// <param name="count">Cancelled runs. Minimum 0.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task SetCancelledRunCountAsync(string tenantId, string id, int count, CancellationToken token = default);

        /// <summary>
        /// Freezes of a tenant applied or lifted after a position, ordered by (lastupdateutc, id). Feeds the freezes channel.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="afterUtc">Position timestamp (UTC).</param>
        /// <param name="afterId">Position identifier; empty starts at the timestamp.</param>
        /// <param name="limit">Most records. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Freezes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        Task<List<Freeze>> ListChangedAsync(string tenantId, DateTime afterUtc, string afterId, int limit, CancellationToken token = default);
    }
}
