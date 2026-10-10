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
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;

    /// <summary>
    /// Provider-neutral AuditRecord data access. Thread-safe.
    /// </summary>
    public class AdoAuditRecordMethods : IAuditRecordMethods
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
        public AdoAuditRecordMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("audit_records");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<AuditRecord> CreateAsync(AuditRecord obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await InsertRowAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<AuditRecord?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            AuditRecord? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<AuditRecord?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            AuditRecord? obj = await _Driver.QuerySingleAsync(
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
        public async Task<AuditRecord> UpdateAsync(AuditRecord obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, eventtype = @eventtype, requestid = @requestid, correlationid = @correlationid, traceid = @traceid, authscheme = @authscheme, principaltype = @principaltype, principalid = @principalid, principalname = @principalname, sessionid = @sessionid, resourcetype = @resourcetype, resourceid = @resourceid, operation = @operation, requesttype = @requesttype, method = @method, path = @path, sourceip = @sourceip, authresult = @authresult, authorizationresult = @authorizationresult, reason = @reason, bypassreason = @bypassreason, statuscode = @statuscode, description = @description, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "eventtype", obj.EventType.ToString());
                    AdoDatabaseDriver.Add(command, "requestid", obj.RequestId);
                    AdoDatabaseDriver.Add(command, "correlationid", obj.CorrelationId);
                    AdoDatabaseDriver.Add(command, "traceid", obj.TraceId);
                    AdoDatabaseDriver.Add(command, "authscheme", obj.AuthScheme?.ToString());
                    AdoDatabaseDriver.Add(command, "principaltype", obj.PrincipalType?.ToString());
                    AdoDatabaseDriver.Add(command, "principalid", obj.PrincipalId);
                    AdoDatabaseDriver.Add(command, "principalname", obj.PrincipalName);
                    AdoDatabaseDriver.Add(command, "sessionid", obj.SessionId);
                    AdoDatabaseDriver.Add(command, "resourcetype", obj.ResourceType);
                    AdoDatabaseDriver.Add(command, "resourceid", obj.ResourceId);
                    AdoDatabaseDriver.Add(command, "operation", obj.Operation);
                    AdoDatabaseDriver.Add(command, "requesttype", obj.RequestType);
                    AdoDatabaseDriver.Add(command, "method", obj.Method);
                    AdoDatabaseDriver.Add(command, "path", obj.Path);
                    AdoDatabaseDriver.Add(command, "sourceip", obj.SourceIp);
                    AdoDatabaseDriver.Add(command, "authresult", obj.AuthResult?.ToString());
                    AdoDatabaseDriver.Add(command, "authorizationresult", obj.AuthorizationResult?.ToString());
                    AdoDatabaseDriver.Add(command, "reason", obj.Reason);
                    AdoDatabaseDriver.Add(command, "bypassreason", obj.BypassReason);
                    AdoDatabaseDriver.Add(command, "statuscode", obj.StatusCode);
                    AdoDatabaseDriver.Add(command, "description", obj.Description);
                    AdoDatabaseDriver.Add(command, "active", obj.Active);
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
        public async Task<EnumerationResult<AuditRecord>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(tenantId))
            {
                clauses.Add("tenantid = @tenantid");
            }
            if (query.ActiveOnly) clauses.Add("active = " + _Driver.Dialect.BooleanLiteral(true));
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            };

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            string sql = "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";";
            List<AuditRecord> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            return EnumerationResult<AuditRecord>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a AuditRecord (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static AuditRecord Map(DbDataReader reader)
        {
            AuditRecord obj = new AuditRecord();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.NullableStr(reader, "tenantid");
            obj.EventType = AdoConverters.Enum<AuditEventTypeEnum>(reader, "eventtype", AuditEventTypeEnum.ConfigurationChanged);
            obj.RequestId = AdoConverters.NullableStr(reader, "requestid");
            obj.CorrelationId = AdoConverters.NullableStr(reader, "correlationid");
            obj.TraceId = AdoConverters.NullableStr(reader, "traceid");
            obj.AuthScheme = AdoConverters.NullableEnum<AuthSchemeEnum>(reader, "authscheme");
            obj.PrincipalType = AdoConverters.NullableEnum<PrincipalTypeEnum>(reader, "principaltype");
            obj.PrincipalId = AdoConverters.NullableStr(reader, "principalid");
            obj.PrincipalName = AdoConverters.NullableStr(reader, "principalname");
            obj.SessionId = AdoConverters.NullableStr(reader, "sessionid");
            obj.ResourceType = AdoConverters.NullableStr(reader, "resourcetype");
            obj.ResourceId = AdoConverters.NullableStr(reader, "resourceid");
            obj.Operation = AdoConverters.NullableStr(reader, "operation");
            obj.RequestType = AdoConverters.NullableStr(reader, "requesttype");
            obj.Method = AdoConverters.NullableStr(reader, "method");
            obj.Path = AdoConverters.NullableStr(reader, "path");
            obj.SourceIp = AdoConverters.NullableStr(reader, "sourceip");
            obj.AuthResult = AdoConverters.NullableEnum<AuthResultEnum>(reader, "authresult");
            obj.AuthorizationResult = AdoConverters.NullableEnum<AuthorizationResultEnum>(reader, "authorizationresult");
            obj.Reason = AdoConverters.NullableStr(reader, "reason");
            obj.BypassReason = AdoConverters.NullableStr(reader, "bypassreason");
            obj.StatusCode = AdoConverters.Int(reader, "statuscode");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <inheritdoc />
        public async Task<AuditPage> EnumerateAsync(AuditFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            int pageSize = Math.Clamp(filter.PageSize, 1, 1000);
            int pageNumber = Math.Max(1, filter.PageNumber);
            List<string> clauses = new List<string>();
            Action<DbCommand> bind = BuildFilter(filter, clauses);
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<AuditRecord> rows = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + where + " ORDER BY createdutc DESC, id DESC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "max", pageSize);
                    AdoDatabaseDriver.Add(command, "skip", (pageNumber - 1) * pageSize);
                },
                Map,
                token).ConfigureAwait(false);

            AuditPage page = new AuditPage();
            page.PageNumber = pageNumber;
            page.PageSize = pageSize;
            page.TotalCount = total;
            page.TotalPages = (int)((total + pageSize - 1) / pageSize);
            page.Objects = rows;
            return page;
        }

        /// <inheritdoc />
        public async Task<int> DeleteManyAsync(AuditFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            List<string> clauses = new List<string>();
            Action<DbCommand> bind = BuildFilter(filter, clauses);
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;
            return await _Driver.NonQueryAsync("DELETE FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> PruneAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync("DELETE FROM " + _Table + " WHERE createdutc < @cutoff;", command => AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc), token).ConfigureAwait(false);
        }

        private static Action<DbCommand> BuildFilter(AuditFilter filter, List<string> clauses)
        {
            if (!String.IsNullOrEmpty(filter.TenantId)) clauses.Add("tenantid = @tenantid");
            if (filter.EventType.HasValue) clauses.Add("eventtype = @eventtype");
            if (!String.IsNullOrEmpty(filter.PrincipalId)) clauses.Add("principalid = @principalid");
            if (filter.Result.HasValue) clauses.Add("authorizationresult = @result");
            if (filter.FromUtc.HasValue) clauses.Add("createdutc >= @fromutc");
            if (filter.ToUtc.HasValue) clauses.Add("createdutc < @toutc");
            return command =>
            {
                if (!String.IsNullOrEmpty(filter.TenantId)) AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (filter.EventType.HasValue) AdoDatabaseDriver.Add(command, "eventtype", filter.EventType.Value.ToString());
                if (!String.IsNullOrEmpty(filter.PrincipalId)) AdoDatabaseDriver.Add(command, "principalid", filter.PrincipalId);
                if (filter.Result.HasValue) AdoDatabaseDriver.Add(command, "result", filter.Result.Value.ToString());
                if (filter.FromUtc.HasValue) AdoDatabaseDriver.Add(command, "fromutc", filter.FromUtc.Value);
                if (filter.ToUtc.HasValue) AdoDatabaseDriver.Add(command, "toutc", filter.ToUtc.Value);
            };
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, AuditRecord obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, eventtype, requestid, correlationid, traceid, authscheme, principaltype, principalid, principalname, sessionid, resourcetype, resourceid, operation, requesttype, method, path, sourceip, authresult, authorizationresult, reason, bypassreason, statuscode, description, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @eventtype, @requestid, @correlationid, @traceid, @authscheme, @principaltype, @principalid, @principalname, @sessionid, @resourcetype, @resourceid, @operation, @requesttype, @method, @path, @sourceip, @authresult, @authorizationresult, @reason, @bypassreason, @statuscode, @description, @active, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "eventtype", obj.EventType.ToString());
                AdoDatabaseDriver.Add(command, "requestid", obj.RequestId);
                AdoDatabaseDriver.Add(command, "correlationid", obj.CorrelationId);
                AdoDatabaseDriver.Add(command, "traceid", obj.TraceId);
                AdoDatabaseDriver.Add(command, "authscheme", obj.AuthScheme?.ToString());
                AdoDatabaseDriver.Add(command, "principaltype", obj.PrincipalType?.ToString());
                AdoDatabaseDriver.Add(command, "principalid", obj.PrincipalId);
                AdoDatabaseDriver.Add(command, "principalname", obj.PrincipalName);
                AdoDatabaseDriver.Add(command, "sessionid", obj.SessionId);
                AdoDatabaseDriver.Add(command, "resourcetype", obj.ResourceType);
                AdoDatabaseDriver.Add(command, "resourceid", obj.ResourceId);
                AdoDatabaseDriver.Add(command, "operation", obj.Operation);
                AdoDatabaseDriver.Add(command, "requesttype", obj.RequestType);
                AdoDatabaseDriver.Add(command, "method", obj.Method);
                AdoDatabaseDriver.Add(command, "path", obj.Path);
                AdoDatabaseDriver.Add(command, "sourceip", obj.SourceIp);
                AdoDatabaseDriver.Add(command, "authresult", obj.AuthResult?.ToString());
                AdoDatabaseDriver.Add(command, "authorizationresult", obj.AuthorizationResult?.ToString());
                AdoDatabaseDriver.Add(command, "reason", obj.Reason);
                AdoDatabaseDriver.Add(command, "bypassreason", obj.BypassReason);
                AdoDatabaseDriver.Add(command, "statuscode", obj.StatusCode);
                AdoDatabaseDriver.Add(command, "description", obj.Description);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        #endregion
    }
}
