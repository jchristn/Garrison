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
    /// Provider-neutral Secret data access. Thread-safe.
    /// </summary>
    public class AdoSecretMethods : ISecretMethods
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
        public AdoSecretMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("secrets");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Secret> CreateAsync(Secret obj, CancellationToken token = default)
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
        public async Task<Secret?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            Secret? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Secret?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            Secret? obj = await _Driver.QuerySingleAsync(
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
        public async Task<Secret?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));

            string sql = "SELECT * FROM " + _Table + " WHERE name = @name AND tenantid = @tenantid;";
            Secret? obj = await _Driver.QuerySingleAsync(
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
        public async Task<Secret> UpdateAsync(Secret obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET brokerresource=@brokerresource, brokeraudience=@brokeraudience, tenantid = @tenantid, name = @name, description = @description, kind = @kind, valueencrypted = @valueencrypted, valuelast4 = @valuelast4, fingerprint = @fingerprint, keyversion = @keyversion, expiresutc = @expiresutc, rotatedutc = @rotatedutc, active = @active, isprotected = @isprotected, status = @status, statusmessage = @statusmessage, statusutc = @statusutc, refreshedutc = @refreshedutc, accesstokenexpiresutc = @accesstokenexpiresutc, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "name", obj.Name);
                    AdoDatabaseDriver.Add(command, "description", obj.Description);
                    AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
                    AdoDatabaseDriver.Add(command, "brokerresource", obj.BrokerResource);
                    AdoDatabaseDriver.Add(command, "brokeraudience", obj.BrokerAudience);
                    AdoDatabaseDriver.Add(command, "valueencrypted", obj.ValueEncrypted);
                    AdoDatabaseDriver.Add(command, "valuelast4", obj.ValueLast4);
                    AdoDatabaseDriver.Add(command, "fingerprint", obj.Fingerprint);
                    AdoDatabaseDriver.Add(command, "keyversion", obj.KeyVersion);
                    AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
                    AdoDatabaseDriver.Add(command, "rotatedutc", obj.RotatedUtc);
                    AdoDatabaseDriver.Add(command, "active", obj.Active);
                    AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                    AddCredentialState(command, obj);
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
        public async Task<EnumerationResult<Secret>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
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
            List<Secret> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            return EnumerationResult<Secret>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<bool> TryUpdateCredentialAsync(Secret obj, string? expectedValueEncrypted, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            DateTime now = DateTime.UtcNow;

            string guard = expectedValueEncrypted == null ? "valueencrypted IS NULL" : "valueencrypted = @expected";
            string sql = "UPDATE " + _Table + " SET valueencrypted = @valueencrypted, valuelast4 = @valuelast4, fingerprint = @fingerprint, keyversion = @keyversion, status = @status, statusmessage = @statusmessage, statusutc = @statusutc, refreshedutc = @refreshedutc, accesstokenexpiresutc = @accesstokenexpiresutc, lastupdateutc = @lastupdateutc WHERE id = @id AND " + guard + ";";

            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "valueencrypted", obj.ValueEncrypted);
                    AdoDatabaseDriver.Add(command, "valuelast4", obj.ValueLast4);
                    AdoDatabaseDriver.Add(command, "fingerprint", obj.Fingerprint);
                    AdoDatabaseDriver.Add(command, "keyversion", obj.KeyVersion);
                    AddCredentialState(command, obj);
                    AdoDatabaseDriver.Add(command, "lastupdateutc", now);
                    if (expectedValueEncrypted != null) AdoDatabaseDriver.Add(command, "expected", expectedValueEncrypted);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            if (affected > 0) obj.LastUpdateUtc = now;
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<List<Secret>> ReadActiveByKindAsync(SecretKindEnum kind, CancellationToken token = default)
        {
            List<Secret> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE kind = @kind AND active = " + _Driver.Dialect.BooleanLiteral(true) + " ORDER BY id;",
                command => AdoDatabaseDriver.Add(command, "kind", kind.ToString()),
                Map,
                token).ConfigureAwait(false);
            return objects;
        }

        /// <summary>
        /// Map a row to a Secret (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static Secret Map(DbDataReader reader)
        {
            Secret obj = new Secret();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Kind = AdoConverters.Enum<SecretKindEnum>(reader, "kind", SecretKindEnum.GenericEnv);
            obj.BrokerResource = AdoConverters.NullableStr(reader, "brokerresource");
            obj.BrokerAudience = AdoConverters.NullableStr(reader, "brokeraudience");
            obj.ValueEncrypted = AdoConverters.NullableStr(reader, "valueencrypted");
            obj.ValueLast4 = AdoConverters.NullableStr(reader, "valuelast4");
            obj.Fingerprint = AdoConverters.NullableStr(reader, "fingerprint");
            obj.KeyVersion = AdoConverters.Int(reader, "keyversion");
            obj.ExpiresUtc = AdoConverters.NullableDate(reader, "expiresutc");
            obj.RotatedUtc = AdoConverters.NullableDate(reader, "rotatedutc");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.Status = AdoConverters.Enum<SecretStatusEnum>(reader, "status", SecretStatusEnum.Ok);
            obj.StatusMessage = AdoConverters.NullableStr(reader, "statusmessage");
            obj.StatusUtc = AdoConverters.NullableDate(reader, "statusutc");
            obj.RefreshedUtc = AdoConverters.NullableDate(reader, "refreshedutc");
            obj.AccessTokenExpiresUtc = AdoConverters.NullableDate(reader, "accesstokenexpiresutc");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void AddCredentialState(DbCommand command, Secret obj)
        {
            AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
            AdoDatabaseDriver.Add(command, "statusmessage", obj.StatusMessage);
            AdoDatabaseDriver.Add(command, "statusutc", obj.StatusUtc);
            AdoDatabaseDriver.Add(command, "refreshedutc", obj.RefreshedUtc);
            AdoDatabaseDriver.Add(command, "accesstokenexpiresutc", obj.AccessTokenExpiresUtc);
        }

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, Secret obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (brokerresource, brokeraudience, id, tenantid, name, description, kind, valueencrypted, valuelast4, fingerprint, keyversion, expiresutc, rotatedutc, active, isprotected, status, statusmessage, statusutc, refreshedutc, accesstokenexpiresutc, createdutc, lastupdateutc) VALUES (@brokerresource, @brokeraudience, @id, @tenantid, @name, @description, @kind, @valueencrypted, @valuelast4, @fingerprint, @keyversion, @expiresutc, @rotatedutc, @active, @isprotected, @status, @statusmessage, @statusutc, @refreshedutc, @accesstokenexpiresutc, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "name", obj.Name);
                AdoDatabaseDriver.Add(command, "description", obj.Description);
                AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
                    AdoDatabaseDriver.Add(command, "brokerresource", obj.BrokerResource);
                    AdoDatabaseDriver.Add(command, "brokeraudience", obj.BrokerAudience);
                AdoDatabaseDriver.Add(command, "valueencrypted", obj.ValueEncrypted);
                AdoDatabaseDriver.Add(command, "valuelast4", obj.ValueLast4);
                AdoDatabaseDriver.Add(command, "fingerprint", obj.Fingerprint);
                AdoDatabaseDriver.Add(command, "keyversion", obj.KeyVersion);
                AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
                AdoDatabaseDriver.Add(command, "rotatedutc", obj.RotatedUtc);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AddCredentialState(command, obj);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        #endregion
    }
}
