namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral UsageQuota data access. Thread-safe.
    /// </summary>
    public class AdoUsageQuotaMethods : IUsageQuotaMethods
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
        public AdoUsageQuotaMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("usage_quotas");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<UsageQuota> CreateAsync(UsageQuota obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await QuotaAccountingSql.LockTenantAsync(_Driver, connection, transaction, obj.TenantId, ct).ConfigureAwait(false);
                await InsertRowAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<UsageQuota?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            UsageQuota? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<UsageQuota?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            UsageQuota? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<UsageQuota?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));

            string sql = "SELECT * FROM " + _Table + " WHERE name = @name AND tenantid = @tenantid;";
            UsageQuota? obj = await _Driver.QuerySingleAsync(
                sql,
                command =>
                {
                    AdoDatabaseDriver.Add(command, "name", name);
                    if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<UsageQuota?> ReadByResourceAsync(string tenantId, UsageQuotaScopeEnum scope, string resourceId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(resourceId)) throw new ArgumentNullException(nameof(resourceId));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND scope = @scope AND resourceid = @resourceid;", c =>
            {
                AdoDatabaseDriver.Add(c, "tenantid", tenantId);
                AdoDatabaseDriver.Add(c, "scope", scope.ToString());
                AdoDatabaseDriver.Add(c, "resourceid", resourceId);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<UsageQuota>> ListForRunAsync(Run run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            return await _Driver.QueryAsync(QuotaAccountingSql.MatchingQuery(_Driver), c => QuotaAccountingSql.BindMatching(c, run), Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<UsageQuotaUsage> ReadUsageAsync(UsageQuota quota, DateTime utc, CancellationToken token = default)
        {
            if (quota == null) throw new ArgumentNullException(nameof(quota));
            return await _Driver.QuerySingleAsync(QuotaAccountingSql.UsageQuery(_Driver, quota), c => QuotaAccountingSql.BindUsage(c, quota, utc), r => QuotaAccountingSql.MapUsage(r, quota, utc), token).ConfigureAwait(false) ?? new UsageQuotaUsage();
        }

        /// <inheritdoc />
        public async Task<UsageQuota> UpdateAsync(UsageQuota obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, name = @name, description = @description, scope = @scope, resourceid = @resourceid, dailyrunlimit = @dailyrunlimit, dailytokenlimit = @dailytokenlimit, dailycostusdlimit = @dailycostusdlimit, maxconcurrentruns = @maxconcurrentruns, active = @active, enforcementenabled = @enforcementenabled, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await QuotaAccountingSql.LockTenantAsync(_Driver, connection, transaction, obj.TenantId, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "name", obj.Name);
                    AdoDatabaseDriver.Add(command, "description", obj.Description);
                AdoDatabaseDriver.Add(command, "scope", obj.Scope.ToString());
                AdoDatabaseDriver.Add(command, "resourceid", obj.ResourceId);
                AdoDatabaseDriver.Add(command, "dailyrunlimit", obj.DailyRunLimit);
                AdoDatabaseDriver.Add(command, "dailytokenlimit", obj.DailyTokenLimit);
                AdoDatabaseDriver.Add(command, "dailycostusdlimit", obj.DailyCostUsdLimit);
                AdoDatabaseDriver.Add(command, "maxconcurrentruns", obj.MaxConcurrentRuns);
                                                    AdoDatabaseDriver.Add(command, "active", obj.Active);
                                                    AdoDatabaseDriver.Add(command, "enforcementenabled", obj.EnforcementEnabled);
                    AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                    AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            UsageQuota? existing = await ReadAsync(id, token).ConfigureAwait(false);
            if (existing == null) return false;
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await QuotaAccountingSql.LockTenantAsync(_Driver, connection, transaction, existing.TenantId, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> ExistsAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            object? result = await _Driver.ScalarAsync("SELECT 1 FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), token).ConfigureAwait(false);
            return result != null;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<UsageQuota>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(tenantId))
            {
                clauses.Add("tenantid = @tenantid");
            }
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            if (query.ActiveOnly) clauses.Add("active = " + _Driver.Dialect.BooleanLiteral(true));
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            string sql = "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";";
            List<UsageQuota> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            return EnumerationResult<UsageQuota>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a UsageQuota.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static UsageQuota Map(DbDataReader reader)
        {
            UsageQuota obj = new UsageQuota();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Scope = AdoConverters.Enum<UsageQuotaScopeEnum>(reader, "scope", UsageQuotaScopeEnum.Tenant);
            obj.ResourceId = AdoConverters.Str(reader, "resourceid");
            obj.DailyRunLimit = AdoConverters.NullableLong(reader, "dailyrunlimit");
            obj.DailyTokenLimit = AdoConverters.NullableLong(reader, "dailytokenlimit");
            obj.DailyCostUsdLimit = AdoConverters.NullableDouble(reader, "dailycostusdlimit");
            obj.MaxConcurrentRuns = AdoConverters.NullableInt(reader, "maxconcurrentruns");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.EnforcementEnabled = AdoConverters.Bool(reader, "enforcementenabled");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, UsageQuota obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, name, description, scope, resourceid, dailyrunlimit, dailytokenlimit, dailycostusdlimit, maxconcurrentruns, active, enforcementenabled, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @name, @description, @scope, @resourceid, @dailyrunlimit, @dailytokenlimit, @dailycostusdlimit, @maxconcurrentruns, @active, @enforcementenabled, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "name", obj.Name);
                AdoDatabaseDriver.Add(command, "description", obj.Description);
                AdoDatabaseDriver.Add(command, "scope", obj.Scope.ToString());
                AdoDatabaseDriver.Add(command, "resourceid", obj.ResourceId);
                AdoDatabaseDriver.Add(command, "dailyrunlimit", obj.DailyRunLimit);
                AdoDatabaseDriver.Add(command, "dailytokenlimit", obj.DailyTokenLimit);
                AdoDatabaseDriver.Add(command, "dailycostusdlimit", obj.DailyCostUsdLimit);
                AdoDatabaseDriver.Add(command, "maxconcurrentruns", obj.MaxConcurrentRuns);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "enforcementenabled", obj.EnforcementEnabled);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        #endregion
    }
}
