namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;

    /// <summary>
    /// Environment list defaults and lookup (AD1.3, AD-013). Stateless and thread-safe.
    /// </summary>
    public static class EnvironmentDefaults
    {
        #region Public-Members

        /// <summary>
        /// Environments of a tenant that has never stored a list, in promotion order: dev, staging, prod.
        /// </summary>
        public static readonly IReadOnlyList<string> Names = new List<string> { "dev", "staging", "prod" };

        /// <summary>
        /// Environment reserved for playground runs (AD9.1); never part of a tenant's list.
        /// </summary>
        public static readonly string Draft = "draft";

        #endregion

        #region Public-Methods

        /// <summary>
        /// The tenant's environments in promotion order: the stored list, or the defaults when none is stored.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Environments.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static async Task<List<TenantEnvironment>> ListAsync(DatabaseDriverBase database, string tenantId, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<TenantEnvironment> stored = await database.Environments.ListAsync(tenantId, token).ConfigureAwait(false);
            if (stored.Count > 0) return stored;
            List<TenantEnvironment> defaults = new List<TenantEnvironment>();
            for (int i = 0; i < Names.Count; i++) defaults.Add(new TenantEnvironment { Name = Names[i], Position = i });
            return defaults;
        }

        #endregion
    }
}
