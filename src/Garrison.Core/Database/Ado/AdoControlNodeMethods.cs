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
    using Garrison.Core.Responses;

    /// <summary>
    /// Provider-neutral control-plane replica data access (P10.19). Thread-safe.
    /// </summary>
    public class AdoControlNodeMethods : IControlNodeMethods
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
        public AdoControlNodeMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("control_nodes");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<ControlNode> UpsertAsync(ControlNode obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            if (String.IsNullOrEmpty(obj.Id)) throw new ArgumentNullException(nameof(obj), "A control node needs an identifier.");

            string sql = "INSERT INTO " + _Table + " (id, name, hostname, address, version, schemaversion, backplane, status, startedutc, lastheartbeatutc, activerequests, openstreams, heldlongpolls) " +
                "VALUES (@id, @name, @hostname, @address, @version, @schemaversion, @backplane, @status, @startedutc, @lastheartbeatutc, @activerequests, @openstreams, @heldlongpolls) " +
                "ON CONFLICT (id) DO UPDATE SET name = @name, hostname = @hostname, address = @address, version = @version, schemaversion = @schemaversion, backplane = @backplane, status = @status, startedutc = @startedutc, lastheartbeatutc = @lastheartbeatutc, activerequests = @activerequests, openstreams = @openstreams, heldlongpolls = @heldlongpolls;";
            await _Driver.NonQueryAsync(sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", Truncate(obj.Id, 256));
                AdoDatabaseDriver.Add(command, "name", Truncate(obj.Name, 256));
                AdoDatabaseDriver.Add(command, "hostname", Truncate(obj.Hostname, 256));
                AdoDatabaseDriver.Add(command, "address", Truncate(obj.Address, 256));
                AdoDatabaseDriver.Add(command, "version", Truncate(obj.Version, 64));
                AdoDatabaseDriver.Add(command, "schemaversion", obj.SchemaVersion);
                AdoDatabaseDriver.Add(command, "backplane", Truncate(obj.Backplane, 64));
                AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
                AdoDatabaseDriver.Add(command, "startedutc", obj.StartedUtc);
                AdoDatabaseDriver.Add(command, "lastheartbeatutc", obj.LastHeartbeatUtc);
                AdoDatabaseDriver.Add(command, "activerequests", obj.ActiveRequests);
                AdoDatabaseDriver.Add(command, "openstreams", obj.OpenStreams);
                AdoDatabaseDriver.Add(command, "heldlongpolls", obj.HeldLongPolls);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<ControlNode?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<ControlNode>> EnumerateAsync(EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));

            string where = String.IsNullOrEmpty(query.Search) ? String.Empty : " WHERE " + _Driver.Dialect.CaseInsensitiveLike("name", "search");
            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            string orderBy = AdoEnumerationSql.OrderBy(query.Ordering, true).Replace("createdutc", "startedutc", StringComparison.Ordinal);
            string sql = "SELECT * FROM " + _Table + where + orderBy + _Driver.Dialect.LimitOffsetClause() + ";";
            List<ControlNode> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            return EnumerationResult<ControlNode>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<bool> SetStatusAsync(string id, ControlNodeStatusEnum status, DateTime nowUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = @status, lastheartbeatutc = @now WHERE id = @id;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "status", status.ToString());
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                },
                token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<List<string>> MarkSilentOfflineAsync(DateTime cutoffUtc, CancellationToken token = default)
        {
            List<string> silent = await _Driver.QueryAsync(
                "SELECT id FROM " + _Table + " WHERE status <> 'Offline' AND lastheartbeatutc < @cutoff;",
                command => AdoDatabaseDriver.Add(command, "cutoff", cutoffUtc),
                reader => AdoConverters.Str(reader, "id"),
                token).ConfigureAwait(false);

            List<string> marked = new List<string>();
            foreach (string id in silent)
            {
                // Re-check the heartbeat in the update, so a replica that heartbeated in between keeps its status.
                int affected = await _Driver.NonQueryAsync(
                    "UPDATE " + _Table + " SET status = 'Offline', activerequests = 0, openstreams = 0, heldlongpolls = 0 WHERE id = @id AND status <> 'Offline' AND lastheartbeatutc < @cutoff;",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", id);
                        AdoDatabaseDriver.Add(command, "cutoff", cutoffUtc);
                    },
                    token).ConfigureAwait(false);
                if (affected > 0) marked.Add(id);
            }
            return marked;
        }

        /// <inheritdoc />
        public async Task<int> DeleteOfflineAsync(DateTime cutoffUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync(
                "DELETE FROM " + _Table + " WHERE status = 'Offline' AND lastheartbeatutc < @cutoff;",
                command => AdoDatabaseDriver.Add(command, "cutoff", cutoffUtc),
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync(
                "DELETE FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<List<StatusCount>> CountByStatusAsync(CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT status, COUNT(*) AS total FROM " + _Table + " GROUP BY status;",
                null,
                reader =>
                {
                    StatusCount count = new StatusCount();
                    count.Status = AdoConverters.Str(reader, "status");
                    count.Count = AdoConverters.Long(reader, "total");
                    return count;
                },
                token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map a row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static ControlNode Map(DbDataReader reader)
        {
            ControlNode obj = new ControlNode();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Hostname = AdoConverters.NullableStr(reader, "hostname");
            obj.Address = AdoConverters.NullableStr(reader, "address");
            obj.Version = AdoConverters.NullableStr(reader, "version");
            obj.SchemaVersion = AdoConverters.Int(reader, "schemaversion");
            obj.Backplane = AdoConverters.NullableStr(reader, "backplane");
            obj.Status = AdoConverters.Enum<ControlNodeStatusEnum>(reader, "status", ControlNodeStatusEnum.Offline);
            obj.StartedUtc = AdoConverters.Date(reader, "startedutc");
            obj.LastHeartbeatUtc = AdoConverters.Date(reader, "lastheartbeatutc");
            obj.ActiveRequests = AdoConverters.Int(reader, "activerequests");
            obj.OpenStreams = AdoConverters.Int(reader, "openstreams");
            obj.HeldLongPolls = AdoConverters.Int(reader, "heldlongpolls");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static string? Truncate(string? value, int length)
        {
            if (value == null) return null;
            return value.Length > length ? value.Substring(0, length) : value;
        }

        #endregion
    }
}
