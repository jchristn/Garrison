namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>
    /// A tenant's ordered environment list (AD1.3, AD-013).
    /// </summary>
    public interface ITenantEnvironmentMethods
    {
        /// <summary>
        /// The tenant's stored environments in promotion order. Empty when the tenant has never set a list; callers use
        /// the default list (dev, staging, prod) in that case.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Environments.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        Task<List<TenantEnvironment>> ListAsync(string tenantId, CancellationToken token = default);

        /// <summary>
        /// Replace the tenant's environment list. Positions are taken from the list order.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="environments">Environments in promotion order.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored list.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<List<TenantEnvironment>> ReplaceAsync(string tenantId, List<TenantEnvironment> environments, CancellationToken token = default);
    }
}
