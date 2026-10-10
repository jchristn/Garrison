namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral CoordinationLease data access. Thread-safe.
    /// </summary>
    public class AdoCoordinationLeaseMethods : ICoordinationLeaseMethods
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
        public AdoCoordinationLeaseMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("coordination_leases");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<CoordinationLease> CreateAsync(CoordinationLease obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await InsertRowAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<CoordinationLease?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            CoordinationLease? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<CoordinationLease?> ReadByNameAsync(string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));

            CoordinationLease? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE name = @name;",
                command => AdoDatabaseDriver.Add(command, "name", name),
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<CoordinationLease> UpdateAsync(CoordinationLease obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET name = @name, holder = @holder, epoch = @epoch, acquiredutc = @acquiredutc, expiresutc = @expiresutc, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "name", obj.Name);
                    AdoDatabaseDriver.Add(command, "holder", obj.Holder);
                    AdoDatabaseDriver.Add(command, "epoch", obj.Epoch);
                    AdoDatabaseDriver.Add(command, "acquiredutc", obj.AcquiredUtc);
                    AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
                    AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
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
        public async Task<EnumerationResult<CoordinationLease>> EnumerateAsync(EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            string sql = "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";";
            List<CoordinationLease> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            return EnumerationResult<CoordinationLease>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a CoordinationLease (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static CoordinationLease Map(DbDataReader reader)
        {
            CoordinationLease obj = new CoordinationLease();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Holder = AdoConverters.NullableStr(reader, "holder");
            obj.Epoch = AdoConverters.Long(reader, "epoch");
            obj.AcquiredUtc = AdoConverters.NullableDate(reader, "acquiredutc");
            obj.ExpiresUtc = AdoConverters.NullableDate(reader, "expiresutc");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <inheritdoc />
        public async Task<long?> TryAcquireAsync(string name, string holder, int durationMs, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            if (String.IsNullOrEmpty(holder)) throw new ArgumentNullException(nameof(holder));

            DateTime now = DateTime.UtcNow;
            DateTime expires = now.AddMilliseconds(Math.Clamp(durationMs, 1000, 600000));

            int updated = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET epoch = CASE WHEN holder = @holder THEN epoch ELSE epoch + 1 END, " +
                "acquiredutc = CASE WHEN holder = @holder THEN acquiredutc ELSE @now END, holder = @holder, expiresutc = @expires, lastupdateutc = @now " +
                "WHERE name = @name AND (holder = @holder OR holder IS NULL OR expiresutc IS NULL OR expiresutc < @now);",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "name", name);
                    AdoDatabaseDriver.Add(command, "holder", holder);
                    AdoDatabaseDriver.Add(command, "now", now);
                    AdoDatabaseDriver.Add(command, "expires", expires);
                },
                token).ConfigureAwait(false);

            if (updated == 0)
            {
                object? exists = await _Driver.ScalarAsync("SELECT 1 FROM " + _Table + " WHERE name = @name;", command => AdoDatabaseDriver.Add(command, "name", name), token).ConfigureAwait(false);
                if (exists != null) return null;

                CoordinationLease lease = new CoordinationLease();
                lease.Name = name;
                lease.Holder = holder;
                lease.Epoch = 1;
                lease.AcquiredUtc = now;
                lease.ExpiresUtc = expires;
                try
                {
                    await CreateAsync(lease, token).ConfigureAwait(false);
                    return 1;
                }
                catch (System.Data.Common.DbException)
                {
                    return null;
                }
            }

            object? epoch = await _Driver.ScalarAsync(
                "SELECT epoch FROM " + _Table + " WHERE name = @name AND holder = @holder;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "name", name);
                    AdoDatabaseDriver.Add(command, "holder", holder);
                },
                token).ConfigureAwait(false);
            return epoch == null ? null : Convert.ToInt64(epoch);
        }

        /// <inheritdoc />
        public async Task<bool> ReleaseAsync(string name, string holder, CancellationToken token = default)
        {
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET holder = NULL, expiresutc = NULL, lastupdateutc = @now WHERE name = @name AND holder = @holder;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "name", name);
                    AdoDatabaseDriver.Add(command, "holder", holder);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
            return affected > 0;
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, CoordinationLease obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, name, holder, epoch, acquiredutc, expiresutc, createdutc, lastupdateutc) VALUES (@id, @name, @holder, @epoch, @acquiredutc, @expiresutc, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "name", obj.Name);
                AdoDatabaseDriver.Add(command, "holder", obj.Holder);
                AdoDatabaseDriver.Add(command, "epoch", obj.Epoch);
                AdoDatabaseDriver.Add(command, "acquiredutc", obj.AcquiredUtc);
                AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        #endregion
    }
}
