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
    /// Provider-neutral AuthSession data access. Thread-safe.
    /// </summary>
    public class AdoAuthSessionMethods : IAuthSessionMethods
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
        public AdoAuthSessionMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("authsessions");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<AuthSession> CreateAsync(AuthSession obj, CancellationToken token = default)
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
        public async Task<AuthSession?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            AuthSession? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<AuthSession?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            AuthSession? obj = await _Driver.QuerySingleAsync(
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
        public async Task<AuthSession> UpdateAsync(AuthSession obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, userid = @userid, credentialid = @credentialid, runid = @runid, originprincipaltype = @originprincipaltype, originprincipalid = @originprincipalid, leaseepoch = @leaseepoch, principaltype = @principaltype, authscheme = @authscheme, tokenid = @tokenid, sourceip = @sourceip, useragent = @useragent, expiresutc = @expiresutc, lastusedutc = @lastusedutc, revokedutc = @revokedutc, revocationreason = @revocationreason, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "userid", obj.UserId);
                    AdoDatabaseDriver.Add(command, "credentialid", obj.CredentialId);
                    AdoDatabaseDriver.Add(command, "runid", obj.RunId);
                    AdoDatabaseDriver.Add(command, "originprincipaltype", obj.OriginPrincipalType?.ToString());
                    AdoDatabaseDriver.Add(command, "originprincipalid", obj.OriginPrincipalId);
                    AdoDatabaseDriver.Add(command, "leaseepoch", obj.LeaseEpoch);
                    AdoDatabaseDriver.Add(command, "principaltype", obj.PrincipalType.ToString());
                    AdoDatabaseDriver.Add(command, "authscheme", obj.AuthScheme.ToString());
                    AdoDatabaseDriver.Add(command, "tokenid", obj.TokenId);
                    AdoDatabaseDriver.Add(command, "sourceip", obj.SourceIp);
                    AdoDatabaseDriver.Add(command, "useragent", obj.UserAgent);
                    AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
                    AdoDatabaseDriver.Add(command, "lastusedutc", obj.LastUsedUtc);
                    AdoDatabaseDriver.Add(command, "revokedutc", obj.RevokedUtc);
                    AdoDatabaseDriver.Add(command, "revocationreason", obj.RevocationReason);
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
        public async Task<EnumerationResult<AuthSession>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
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
            List<AuthSession> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            return EnumerationResult<AuthSession>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a AuthSession (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static AuthSession Map(DbDataReader reader)
        {
            AuthSession obj = new AuthSession();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.NullableStr(reader, "tenantid");
            obj.UserId = AdoConverters.NullableStr(reader, "userid");
            obj.CredentialId = AdoConverters.NullableStr(reader, "credentialid");
            obj.RunId = AdoConverters.NullableStr(reader, "runid");
            obj.OriginPrincipalType = AdoConverters.NullableEnum<PrincipalTypeEnum>(reader, "originprincipaltype");
            obj.OriginPrincipalId = AdoConverters.NullableStr(reader, "originprincipalid");
            obj.LeaseEpoch = AdoConverters.NullableLong(reader, "leaseepoch");
            obj.PrincipalType = AdoConverters.Enum<PrincipalTypeEnum>(reader, "principaltype", PrincipalTypeEnum.User);
            obj.AuthScheme = AdoConverters.Enum<AuthSchemeEnum>(reader, "authscheme", AuthSchemeEnum.BearerToken);
            obj.TokenId = AdoConverters.Str(reader, "tokenid");
            obj.SourceIp = AdoConverters.NullableStr(reader, "sourceip");
            obj.UserAgent = AdoConverters.NullableStr(reader, "useragent");
            obj.ExpiresUtc = AdoConverters.Date(reader, "expiresutc");
            obj.LastUsedUtc = AdoConverters.NullableDate(reader, "lastusedutc");
            obj.RevokedUtc = AdoConverters.NullableDate(reader, "revokedutc");
            obj.RevocationReason = AdoConverters.NullableStr(reader, "revocationreason");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <inheritdoc />
        public async Task<AuthSession?> ReadByTokenIdAsync(string tokenId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tokenId)) throw new ArgumentNullException(nameof(tokenId));

            return await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE tokenid = @tokenid;",
                command => AdoDatabaseDriver.Add(command, "tokenid", tokenId),
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> RevokeAsync(string id, string reason, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET revokedutc = @now, revocationreason = @reason, active = @inactive, lastupdateutc = @now WHERE id = @id AND revokedutc IS NULL;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "reason", reason);
                    AdoDatabaseDriver.Add(command, "inactive", false);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<int> RevokeByRunAsync(string runId, string reason, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));

            return await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET revokedutc = @now, revocationreason = @reason, active = @inactive, lastupdateutc = @now WHERE runid = @runid AND revokedutc IS NULL;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "runid", runId);
                    AdoDatabaseDriver.Add(command, "reason", reason);
                    AdoDatabaseDriver.Add(command, "inactive", false);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> RevokeByRunEpochAsync(string runId, long maxEpoch, string reason, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));

            return await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET revokedutc = @now, revocationreason = @reason, active = @inactive, lastupdateutc = @now WHERE runid = @runid AND revokedutc IS NULL AND (leaseepoch IS NULL OR leaseepoch <= @maxepoch);",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "runid", runId);
                    AdoDatabaseDriver.Add(command, "maxepoch", maxEpoch);
                    AdoDatabaseDriver.Add(command, "reason", reason);
                    AdoDatabaseDriver.Add(command, "inactive", false);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task TouchLastUsedAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET lastusedutc = @now WHERE id = @id;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> PruneExpiredAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync(
                "DELETE FROM " + _Table + " WHERE expiresutc < @cutoff;",
                command => AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc),
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> DeleteByUserAsync(string userId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(userId)) throw new ArgumentNullException(nameof(userId));
            return await _Driver.NonQueryAsync("DELETE FROM " + _Table + " WHERE userid = @id;", command => AdoDatabaseDriver.Add(command, "id", userId), token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> DeleteByCredentialAsync(string credentialId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(credentialId)) throw new ArgumentNullException(nameof(credentialId));
            return await _Driver.NonQueryAsync("DELETE FROM " + _Table + " WHERE credentialid = @id;", command => AdoDatabaseDriver.Add(command, "id", credentialId), token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, AuthSession obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, userid, credentialid, runid, originprincipaltype, originprincipalid, leaseepoch, principaltype, authscheme, tokenid, sourceip, useragent, expiresutc, lastusedutc, revokedutc, revocationreason, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @userid, @credentialid, @runid, @originprincipaltype, @originprincipalid, @leaseepoch, @principaltype, @authscheme, @tokenid, @sourceip, @useragent, @expiresutc, @lastusedutc, @revokedutc, @revocationreason, @active, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "userid", obj.UserId);
                AdoDatabaseDriver.Add(command, "credentialid", obj.CredentialId);
                AdoDatabaseDriver.Add(command, "runid", obj.RunId);
                AdoDatabaseDriver.Add(command, "originprincipaltype", obj.OriginPrincipalType?.ToString());
                AdoDatabaseDriver.Add(command, "originprincipalid", obj.OriginPrincipalId);
                    AdoDatabaseDriver.Add(command, "leaseepoch", obj.LeaseEpoch);
                AdoDatabaseDriver.Add(command, "principaltype", obj.PrincipalType.ToString());
                AdoDatabaseDriver.Add(command, "authscheme", obj.AuthScheme.ToString());
                AdoDatabaseDriver.Add(command, "tokenid", obj.TokenId);
                AdoDatabaseDriver.Add(command, "sourceip", obj.SourceIp);
                AdoDatabaseDriver.Add(command, "useragent", obj.UserAgent);
                AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
                AdoDatabaseDriver.Add(command, "lastusedutc", obj.LastUsedUtc);
                AdoDatabaseDriver.Add(command, "revokedutc", obj.RevokedUtc);
                AdoDatabaseDriver.Add(command, "revocationreason", obj.RevocationReason);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        #endregion
    }
}
