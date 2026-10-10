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
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral Node data access. Thread-safe.
    /// </summary>
    public class AdoNodeMethods : INodeMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _LabelsTable;
        private readonly string _CapabilitiesTable;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoNodeMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("nodes");
            _LabelsTable = driver.Table("node_labels");
            _CapabilitiesTable = driver.Table("node_capabilities");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Node> CreateAsync(Node obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await InsertRowAsync(connection, transaction, obj, ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<Node?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            Node? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Node?> ReadByNameAsync(string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));

            Node? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE name = @name;",
                command => AdoDatabaseDriver.Add(command, "name", name),
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Node> UpdateAsync(Node obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET name = @name, nodepoolid = @nodepoolid, address = @address, nodeversion = @nodeversion, status = @status, maxconcurrentruns = @maxconcurrentruns, activeruns = @activeruns, credentialid = @credentialid, lastheartbeatutc = @lastheartbeatutc, registeredutc = @registeredutc, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "name", obj.Name);
                    AdoDatabaseDriver.Add(command, "nodepoolid", obj.NodePoolId);
                    AdoDatabaseDriver.Add(command, "address", obj.Address);
                    AdoDatabaseDriver.Add(command, "nodeversion", obj.NodeVersion);
                    AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
                    AdoDatabaseDriver.Add(command, "maxconcurrentruns", obj.MaxConcurrentRuns);
                    AdoDatabaseDriver.Add(command, "activeruns", obj.ActiveRuns);
                    AdoDatabaseDriver.Add(command, "credentialid", obj.CredentialId);
                    AdoDatabaseDriver.Add(command, "lastheartbeatutc", obj.LastHeartbeatUtc);
                    AdoDatabaseDriver.Add(command, "registeredutc", obj.RegisteredUtc);
                    AdoDatabaseDriver.Add(command, "active", obj.Active);
                    AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                    AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
                }, ct).ConfigureAwait(false);

                await DeleteChildrenAsync(connection, transaction, obj.Id, ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
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
                await DeleteChildrenAsync(connection, transaction, id, ct).ConfigureAwait(false);
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
        public async Task<EnumerationResult<Node>> EnumerateAsync(EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            if (query.ActiveOnly) clauses.Add("active = " + _Driver.Dialect.BooleanLiteral(true));
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            string sql = "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";";
            List<Node> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            foreach (Node obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);

            return EnumerationResult<Node>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a Node (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static Node Map(DbDataReader reader)
        {
            Node obj = new Node();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.NodePoolId = AdoConverters.NullableStr(reader, "nodepoolid");
            obj.Address = AdoConverters.NullableStr(reader, "address");
            obj.NodeVersion = AdoConverters.NullableStr(reader, "nodeversion");
            obj.Status = AdoConverters.Enum<NodeStatusEnum>(reader, "status", NodeStatusEnum.Ready);
            obj.MaxConcurrentRuns = AdoConverters.Int(reader, "maxconcurrentruns");
            obj.ActiveRuns = AdoConverters.Int(reader, "activeruns");
            obj.CredentialId = AdoConverters.NullableStr(reader, "credentialid");
            obj.LastHeartbeatUtc = AdoConverters.NullableDate(reader, "lastheartbeatutc");
            obj.RegisteredUtc = AdoConverters.NullableDate(reader, "registeredutc");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <summary>
        /// Load child rows into a Node.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task LoadChildrenAsync(Node obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));

            obj.Labels = await _Driver.QueryAsync(
                "SELECT * FROM " + _LabelsTable + " WHERE nodeid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapLabels,
                token).ConfigureAwait(false);

            obj.Capabilities = await _Driver.QueryAsync(
                "SELECT * FROM " + _CapabilitiesTable + " WHERE nodeid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapCapabilities,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task TouchHeartbeatAsync(string nodeId, int activeRuns, CancellationToken token = default)
        {
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET lastheartbeatutc = @now, activeruns = @active, status = CASE WHEN status IN ('Lost', 'Offline') THEN 'Ready' ELSE status END WHERE id = @id;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", nodeId);
                    AdoDatabaseDriver.Add(command, "active", activeRuns);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Node>> ListStaleAsync(DateTime cutoffUtc, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status NOT IN ('Lost', 'Offline') AND lastheartbeatutc < @cutoff;",
                command => AdoDatabaseDriver.Add(command, "cutoff", cutoffUtc),
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> SetStatusAsync(string nodeId, NodeStatusEnum status, CancellationToken token = default)
        {
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = @status, lastupdateutc = @now WHERE id = @id;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", nodeId);
                    AdoDatabaseDriver.Add(command, "status", status.ToString());
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
            return affected > 0;
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, Node obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, name, nodepoolid, address, nodeversion, status, maxconcurrentruns, activeruns, credentialid, lastheartbeatutc, registeredutc, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @name, @nodepoolid, @address, @nodeversion, @status, @maxconcurrentruns, @activeruns, @credentialid, @lastheartbeatutc, @registeredutc, @active, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "name", obj.Name);
                AdoDatabaseDriver.Add(command, "nodepoolid", obj.NodePoolId);
                AdoDatabaseDriver.Add(command, "address", obj.Address);
                AdoDatabaseDriver.Add(command, "nodeversion", obj.NodeVersion);
                AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
                AdoDatabaseDriver.Add(command, "maxconcurrentruns", obj.MaxConcurrentRuns);
                AdoDatabaseDriver.Add(command, "activeruns", obj.ActiveRuns);
                AdoDatabaseDriver.Add(command, "credentialid", obj.CredentialId);
                AdoDatabaseDriver.Add(command, "lastheartbeatutc", obj.LastHeartbeatUtc);
                AdoDatabaseDriver.Add(command, "registeredutc", obj.RegisteredUtc);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, Node obj, CancellationToken token)
        {
            string batch = IdGenerator.NewChildRowId() + "_";
            for (int i = 0; i < obj.Labels.Count; i++)
            {
                NodeLabel child = obj.Labels[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "lab";
                child.NodeId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _LabelsTable + " (id, nodeid, key, value) VALUES (@id, @nodeid, @key, @value);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "nodeid", obj.Id);
                        AdoDatabaseDriver.Add(command, "key", child.Key);
                        AdoDatabaseDriver.Add(command, "value", child.Value);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.Capabilities.Count; i++)
            {
                NodeCapability child = obj.Capabilities[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "cap";
                child.NodeId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _CapabilitiesTable + " (id, nodeid, harnesstype, executable, detectedversion, available, detail) VALUES (@id, @nodeid, @harnesstype, @executable, @detectedversion, @available, @detail);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "nodeid", obj.Id);
                        AdoDatabaseDriver.Add(command, "harnesstype", child.HarnessType.ToString());
                        AdoDatabaseDriver.Add(command, "executable", child.Executable);
                        AdoDatabaseDriver.Add(command, "detectedversion", child.DetectedVersion);
                        AdoDatabaseDriver.Add(command, "available", child.Available);
                        AdoDatabaseDriver.Add(command, "detail", child.Detail);
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string parentId, CancellationToken token)
        {
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _LabelsTable + " WHERE nodeid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _CapabilitiesTable + " WHERE nodeid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
        }

        private static NodeLabel MapLabels(DbDataReader reader)
        {
            NodeLabel child = new NodeLabel();
            child.Id = AdoConverters.Str(reader, "id");
            child.NodeId = AdoConverters.Str(reader, "nodeid");
            child.Key = AdoConverters.Str(reader, "key");
            child.Value = AdoConverters.Str(reader, "value");
            return child;
        }

        private static NodeCapability MapCapabilities(DbDataReader reader)
        {
            NodeCapability child = new NodeCapability();
            child.Id = AdoConverters.Str(reader, "id");
            child.NodeId = AdoConverters.Str(reader, "nodeid");
            child.HarnessType = AdoConverters.Enum<HarnessTypeEnum>(reader, "harnesstype", HarnessTypeEnum.Generic);
            child.Executable = AdoConverters.NullableStr(reader, "executable");
            child.DetectedVersion = AdoConverters.NullableStr(reader, "detectedversion");
            child.Available = AdoConverters.Bool(reader, "available");
            child.Detail = AdoConverters.NullableStr(reader, "detail");
            return child;
        }

        #endregion
    }
}
