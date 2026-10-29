namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral tenant environment list data access (AD1.3). Thread-safe.
    /// </summary>
    public class AdoTenantEnvironmentMethods : ITenantEnvironmentMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoTenantEnvironmentMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("tenant_environments");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task<List<TenantEnvironment>> ListAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            return _Driver.QueryAsync("SELECT * FROM " + _Table + " WHERE tenantid = @tenantid ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "tenantid", tenantId),
                reader =>
                {
                    TenantEnvironment environment = new TenantEnvironment();
                    environment.Name = AdoConverters.Str(reader, "name");
                    environment.Description = AdoConverters.NullableStr(reader, "description");
                    environment.Position = AdoConverters.Int(reader, "position");
                    return environment;
                }, token);
        }

        /// <inheritdoc />
        public async Task<List<TenantEnvironment>> ReplaceAsync(string tenantId, List<TenantEnvironment> environments, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (environments == null) throw new ArgumentNullException(nameof(environments));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE tenantid = @tenantid;", command => AdoDatabaseDriver.Add(command, "tenantid", tenantId), ct).ConfigureAwait(false);
                for (int i = 0; i < environments.Count; i++)
                {
                    TenantEnvironment environment = environments[i];
                    environment.Position = i;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "INSERT INTO " + _Table + " (id, tenantid, name, description, position) VALUES (@id, @tenantid, @name, @description, @position);",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "id", IdGenerator.NewChildRowId());
                            AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                            AdoDatabaseDriver.Add(command, "name", environment.Name);
                            AdoDatabaseDriver.Add(command, "description", environment.Description);
                            AdoDatabaseDriver.Add(command, "position", environment.Position);
                        }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            return environments;
        }

        #endregion
    }
}
