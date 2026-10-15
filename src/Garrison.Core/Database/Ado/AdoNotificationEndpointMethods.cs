namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral notification endpoint data access (P12.14). Subscribed events are a child table replaced with the
    /// endpoint in one transaction. Thread-safe.
    /// </summary>
    public class AdoNotificationEndpointMethods : INotificationEndpointMethods
    {
        #region Private-Members

        private static readonly HashSet<string> _ReferenceColumns = new HashSet<string>(StringComparer.Ordinal) { "agentid", "deploymentid" };
        private static readonly string _Columns = "id, tenantid, name, description, url, agentid, deploymentid, includeresulttext, resulttextmaxchars, active, secretencrypted, secretkeyversion, secretlast4, secretrotatedutc, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Events;
        private readonly string _Deliveries;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoNotificationEndpointMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("notification_endpoints");
            _Events = driver.Table("notification_endpoint_events");
            _Deliveries = driver.Table("notification_deliveries");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<NotificationEndpoint> CreateAsync(NotificationEndpoint obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), ct).ConfigureAwait(false);
                await InsertEventsAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<NotificationEndpoint?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            NotificationEndpoint? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadEventsAsync(new List<NotificationEndpoint> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<NotificationEndpoint?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            NotificationEndpoint? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE name = @name AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "name", name);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadEventsAsync(new List<NotificationEndpoint> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<NotificationEndpoint> UpdateAsync(NotificationEndpoint obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Table + " SET name = @name, description = @description, url = @url, agentid = @agentid, deploymentid = @deploymentid, includeresulttext = @includeresulttext, resulttextmaxchars = @resulttextmaxchars, active = @active, secretencrypted = @secretencrypted, secretkeyversion = @secretkeyversion, secretlast4 = @secretlast4, secretrotatedutc = @secretrotatedutc, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                    command => Bind(command, obj), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Events + " WHERE endpointid = @id;", command => AdoDatabaseDriver.Add(command, "id", obj.Id), ct).ConfigureAwait(false);
                await InsertEventsAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                Action<DbCommand> bind = command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                };
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Deliveries + " WHERE endpointid = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Events + " WHERE endpointid = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<NotificationEndpoint>> EnumerateAsync(string tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            if (query.ActiveOnly) clauses.Add("active = " + _Driver.Dialect.BooleanLiteral(true));
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<NotificationEndpoint> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            await LoadEventsAsync(objects, token).ConfigureAwait(false);
            return EnumerationResult<NotificationEndpoint>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<List<NotificationEndpoint>> ListActiveAsync(CancellationToken token = default)
        {
            List<NotificationEndpoint> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + " WHERE active = " + _Driver.Dialect.BooleanLiteral(true) + " ORDER BY id;", null, Map, token).ConfigureAwait(false);
            await LoadEventsAsync(objects, token).ConfigureAwait(false);
            return objects;
        }

        /// <inheritdoc />
        public async Task<List<string>> NamesReferencingAsync(string tenantId, string column, string resourceId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(resourceId)) throw new ArgumentNullException(nameof(resourceId));
            if (column == null || !_ReferenceColumns.Contains(column)) throw new ArgumentException("Column must be agentid or deploymentid.", nameof(column));
            return await _Driver.QueryAsync(
                "SELECT name FROM " + _Table + " WHERE tenantid = @tenantid AND " + column + " = @value ORDER BY name;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "value", resourceId);
                },
                reader => AdoConverters.Str(reader, "name"),
                token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map an endpoint row (events not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static NotificationEndpoint Map(DbDataReader reader)
        {
            NotificationEndpoint obj = new NotificationEndpoint();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Url = AdoConverters.Str(reader, "url");
            obj.AgentId = AdoConverters.NullableStr(reader, "agentid");
            obj.DeploymentId = AdoConverters.NullableStr(reader, "deploymentid");
            obj.IncludeResultText = AdoConverters.Bool(reader, "includeresulttext");
            obj.ResultTextMaxChars = AdoConverters.Int(reader, "resulttextmaxchars");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.SecretEncrypted = AdoConverters.NullableStr(reader, "secretencrypted");
            obj.SecretKeyVersion = AdoConverters.Int(reader, "secretkeyversion");
            obj.SigningSecretLast4 = AdoConverters.NullableStr(reader, "secretlast4");
            obj.SigningSecretRotatedUtc = AdoConverters.NullableDate(reader, "secretrotatedutc");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, NotificationEndpoint obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "name", obj.Name);
            AdoDatabaseDriver.Add(command, "description", obj.Description);
            AdoDatabaseDriver.Add(command, "url", obj.Url);
            AdoDatabaseDriver.Add(command, "agentid", String.IsNullOrEmpty(obj.AgentId) ? null : obj.AgentId);
            AdoDatabaseDriver.Add(command, "deploymentid", String.IsNullOrEmpty(obj.DeploymentId) ? null : obj.DeploymentId);
            AdoDatabaseDriver.Add(command, "includeresulttext", obj.IncludeResultText);
            AdoDatabaseDriver.Add(command, "resulttextmaxchars", obj.ResultTextMaxChars);
            AdoDatabaseDriver.Add(command, "active", obj.Active);
            AdoDatabaseDriver.Add(command, "secretencrypted", obj.SecretEncrypted);
            AdoDatabaseDriver.Add(command, "secretkeyversion", obj.SecretKeyVersion);
            AdoDatabaseDriver.Add(command, "secretlast4", obj.SigningSecretLast4);
            AdoDatabaseDriver.Add(command, "secretrotatedutc", obj.SigningSecretRotatedUtc);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private async Task InsertEventsAsync(DbConnection connection, DbTransaction transaction, NotificationEndpoint obj, CancellationToken token)
        {
            for (int i = 0; i < obj.Events.Count; i++)
            {
                NotificationEventEnum value = obj.Events[i];
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Events + " (id, endpointid, tenantid, position, eventname) VALUES (@id, @endpointid, @tenantid, @position, @eventname);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", IdGenerator.NewNotificationEndpointEventId());
                        AdoDatabaseDriver.Add(command, "endpointid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "eventname", value.ToString());
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task LoadEventsAsync(List<NotificationEndpoint> endpoints, CancellationToken token)
        {
            // One query per page of endpoints rather than one per endpoint.
            for (int offset = 0; offset < endpoints.Count; offset += 200)
            {
                List<NotificationEndpoint> page = endpoints.Skip(offset).Take(200).ToList();
                List<string> names = new List<string>();
                for (int i = 0; i < page.Count; i++) names.Add("@e" + i);
                List<EndpointEventRow> rows = await _Driver.QueryAsync(
                    "SELECT endpointid, eventname FROM " + _Events + " WHERE endpointid IN (" + String.Join(", ", names) + ") ORDER BY endpointid, position ASC;",
                    command =>
                    {
                        for (int i = 0; i < page.Count; i++) AdoDatabaseDriver.Add(command, "e" + i, page[i].Id);
                    },
                    reader => new EndpointEventRow(AdoConverters.Str(reader, "endpointid"), AdoConverters.Enum<NotificationEventEnum>(reader, "eventname", NotificationEventEnum.Test)),
                    token).ConfigureAwait(false);
                foreach (NotificationEndpoint endpoint in page)
                {
                    endpoint.Events = rows.Where(r => r.EndpointId == endpoint.Id && r.Event != NotificationEventEnum.Test).Select(r => r.Event).Distinct().ToList();
                }
            }
        }

        #endregion
    }
}
