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
    /// Provider-neutral McpServer data access. Thread-safe.
    /// </summary>
    public class AdoMcpServerMethods : IMcpServerMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _ArgumentsTable;
        private readonly string _EnvironmentTable;
        private readonly string _HeadersTable;
        private readonly string _RequiredToolsTable;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoMcpServerMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("mcp_servers");
            _ArgumentsTable = driver.Table("mcp_server_args");
            _EnvironmentTable = driver.Table("mcp_server_env");
            _HeadersTable = driver.Table("mcp_server_headers");
            _RequiredToolsTable = driver.Table("mcp_server_required_tools");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<McpServer> CreateAsync(McpServer obj, CancellationToken token = default)
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
        public async Task<McpServer?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            McpServer? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<McpServer?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            McpServer? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<McpServer?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));

            string sql = "SELECT * FROM " + _Table + " WHERE name = @name AND tenantid = @tenantid;";
            McpServer? obj = await _Driver.QuerySingleAsync(
                sql,
                command =>
                {
                    AdoDatabaseDriver.Add(command, "name", name);
                    if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<McpServer> UpdateAsync(McpServer obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, name = @name, description = @description, transport = @transport, url = @url, path = @path, command = @command, tooltimeoutseconds = @tooltimeoutseconds, required = @required, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "name", obj.Name);
                    AdoDatabaseDriver.Add(command, "description", obj.Description);
                    AdoDatabaseDriver.Add(command, "transport", obj.Transport.ToString());
                    AdoDatabaseDriver.Add(command, "url", obj.Url);
                    AdoDatabaseDriver.Add(command, "path", obj.Path);
                    AdoDatabaseDriver.Add(command, "command", obj.Command);
                    AdoDatabaseDriver.Add(command, "tooltimeoutseconds", obj.ToolTimeoutSeconds);
                    AdoDatabaseDriver.Add(command, "required", obj.Required);
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
        public async Task<EnumerationResult<McpServer>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
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
            List<McpServer> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            foreach (McpServer obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);

            return EnumerationResult<McpServer>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a McpServer (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static McpServer Map(DbDataReader reader)
        {
            McpServer obj = new McpServer();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Transport = AdoConverters.Enum<McpTransportEnum>(reader, "transport", McpTransportEnum.Http);
            obj.Url = AdoConverters.NullableStr(reader, "url");
            obj.Path = AdoConverters.NullableStr(reader, "path");
            obj.Command = AdoConverters.NullableStr(reader, "command");
            obj.ToolTimeoutSeconds = AdoConverters.Int(reader, "tooltimeoutseconds");
            obj.Required = AdoConverters.Bool(reader, "required");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <summary>
        /// Load child rows into a McpServer.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task LoadChildrenAsync(McpServer obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));

            obj.Arguments = await _Driver.QueryAsync(
                "SELECT * FROM " + _ArgumentsTable + " WHERE mcpserverid = @parentid ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                reader => AdoConverters.Str(reader, "argument"),
                token).ConfigureAwait(false);

            obj.Environment = await _Driver.QueryAsync(
                "SELECT * FROM " + _EnvironmentTable + " WHERE mcpserverid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapEnvironment,
                token).ConfigureAwait(false);

            obj.Headers = await _Driver.QueryAsync(
                "SELECT * FROM " + _HeadersTable + " WHERE mcpserverid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapHeaders,
                token).ConfigureAwait(false);

            obj.RequiredTools = await _Driver.QueryAsync(
                "SELECT * FROM " + _RequiredToolsTable + " WHERE mcpserverid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                reader => AdoConverters.Str(reader, "toolname"),
                token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, McpServer obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, name, description, transport, url, path, command, tooltimeoutseconds, required, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @name, @description, @transport, @url, @path, @command, @tooltimeoutseconds, @required, @active, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "name", obj.Name);
                AdoDatabaseDriver.Add(command, "description", obj.Description);
                AdoDatabaseDriver.Add(command, "transport", obj.Transport.ToString());
                AdoDatabaseDriver.Add(command, "url", obj.Url);
                AdoDatabaseDriver.Add(command, "path", obj.Path);
                AdoDatabaseDriver.Add(command, "command", obj.Command);
                AdoDatabaseDriver.Add(command, "tooltimeoutseconds", obj.ToolTimeoutSeconds);
                AdoDatabaseDriver.Add(command, "required", obj.Required);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, McpServer obj, CancellationToken token)
        {
            string batch = IdGenerator.NewChildRowId() + "_";
            for (int i = 0; i < obj.Arguments.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _ArgumentsTable + " (id, mcpserverid, tenantid, position, argument) VALUES (@id, @mcpserverid, @tenantid, @position, @argument);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + position.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "s");
                        AdoDatabaseDriver.Add(command, "mcpserverid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "argument", obj.Arguments[position]);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.Environment.Count; i++)
            {
                McpServerVariable child = obj.Environment[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "env";
                child.McpServerId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _EnvironmentTable + " (id, mcpserverid, tenantid, name, valuetemplate) VALUES (@id, @mcpserverid, @tenantid, @name, @valuetemplate);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "mcpserverid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "name", child.Name);
                        AdoDatabaseDriver.Add(command, "valuetemplate", child.ValueTemplate);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.Headers.Count; i++)
            {
                McpServerHeader child = obj.Headers[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "hea";
                child.McpServerId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _HeadersTable + " (id, mcpserverid, tenantid, name, valuetemplate) VALUES (@id, @mcpserverid, @tenantid, @name, @valuetemplate);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "mcpserverid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "name", child.Name);
                        AdoDatabaseDriver.Add(command, "valuetemplate", child.ValueTemplate);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.RequiredTools.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _RequiredToolsTable + " (id, mcpserverid, tenantid, toolname) VALUES (@id, @mcpserverid, @tenantid, @toolname);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + position.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "s");
                        AdoDatabaseDriver.Add(command, "mcpserverid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "toolname", obj.RequiredTools[position]);
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string parentId, CancellationToken token)
        {
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _ArgumentsTable + " WHERE mcpserverid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _EnvironmentTable + " WHERE mcpserverid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _HeadersTable + " WHERE mcpserverid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _RequiredToolsTable + " WHERE mcpserverid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
        }

        private static McpServerVariable MapEnvironment(DbDataReader reader)
        {
            McpServerVariable child = new McpServerVariable();
            child.Id = AdoConverters.Str(reader, "id");
            child.McpServerId = AdoConverters.Str(reader, "mcpserverid");
            child.Name = AdoConverters.Str(reader, "name");
            child.ValueTemplate = AdoConverters.Str(reader, "valuetemplate");
            return child;
        }

        private static McpServerHeader MapHeaders(DbDataReader reader)
        {
            McpServerHeader child = new McpServerHeader();
            child.Id = AdoConverters.Str(reader, "id");
            child.McpServerId = AdoConverters.Str(reader, "mcpserverid");
            child.Name = AdoConverters.Str(reader, "name");
            child.ValueTemplate = AdoConverters.Str(reader, "valuetemplate");
            return child;
        }

        #endregion
    }
}
