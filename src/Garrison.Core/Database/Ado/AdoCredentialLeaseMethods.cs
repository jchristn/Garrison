namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Models;

    /// <summary>Provider-neutral metadata-only broker credential persistence.</summary>
    public class AdoCredentialLeaseMethods : ICredentialLeaseMethods
    {
        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Runs;

        /// <summary>Create persistence.</summary>
        public AdoCredentialLeaseMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("credential_leases");
            _Runs = driver.Table("runs");
        }

        /// <inheritdoc />
        public async Task<CredentialLease?> ReserveAsync(CredentialLease lease, CancellationToken token = default)
        {
            CredentialLease? result = null;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                int held = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Runs + " SET lastupdateutc=lastupdateutc WHERE id=@run AND tenantid=@tenant AND leaseepoch=@epoch AND leaseexpiresutc>@now AND status IN ('Leased','Running') AND cancelrequested=" + _Driver.Dialect.BooleanLiteral(false), command => Bind(command, lease), ct).ConfigureAwait(false);
                if (held != 1) return;
                List<CredentialLease> existing = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT * FROM " + _Table + " WHERE tenantid=@tenant AND runid=@run AND secretid=@secret AND leaseepoch=@epoch", command => Bind(command, lease), Map, ct).ConfigureAwait(false);
                result = existing.FirstOrDefault();
                if (result != null)
                {
                    if (!String.Equals(result.Resource, lease.Resource, StringComparison.Ordinal)
                        || !String.Equals(result.Audience, lease.Audience, StringComparison.Ordinal)
                        || result.ExpiresUtc.Ticks / 10 != lease.ExpiresUtc.Ticks / 10)
                        result = null;
                    return;
                }
                List<CredentialLease> older = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT * FROM " + _Table + " WHERE tenantid=@tenant AND runid=@run AND secretid=@secret AND leaseepoch<>@epoch AND state<>'Revoked' AND expiresutc>@now", command => Bind(command, lease), Map, ct).ConfigureAwait(false);
                if (older.Any()) return;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Table + " (id,tenantid,runid,secretid,leaseepoch,resource,audience,state,expiresutc,createdutc,revokeattempts) VALUES (@id,@tenant,@run,@secret,@epoch,@resource,@audience,'Authorized',@expiry,@now,0)", command =>
                {
                    Bind(command, lease);
                    AdoDatabaseDriver.Add(command, "id", lease.Id);
                    AdoDatabaseDriver.Add(command, "resource", lease.Resource);
                    AdoDatabaseDriver.Add(command, "audience", lease.Audience);
                    AdoDatabaseDriver.Add(command, "expiry", lease.ExpiresUtc);
                }, ct).ConfigureAwait(false);
                result = lease;
            }, token).ConfigureAwait(false);
            return result;
        }

        /// <inheritdoc />
        public Task<List<CredentialLease>> ListOutstandingAsync(string? tenantId = null, string? runId = null, CancellationToken token = default)
        {
            string sql = "SELECT * FROM " + _Table + " WHERE state<>'Revoked'";
            if (tenantId != null) sql += " AND tenantid=@tenant";
            if (runId != null) sql += " AND runid=@run";
            // Expired Authorized reservations must still be tombstoned: an in-flight provider issue may arrive late.
            sql += " ORDER BY revokeattempts,createdutc,id LIMIT 1000";
            return _Driver.QueryAsync(sql, command =>
            {
                if (tenantId != null) AdoDatabaseDriver.Add(command, "tenant", tenantId);
                if (runId != null) AdoDatabaseDriver.Add(command, "run", runId);
            }, Map, token);
        }

        /// <inheritdoc />
        public Task<List<CredentialLease>> ListRevocationCandidatesAsync(CancellationToken token = default)
        {
            string secrets = _Driver.Table("secrets");
            string yes = _Driver.Dialect.BooleanLiteral(true);
            string no = _Driver.Dialect.BooleanLiteral(false);
            string sql = "SELECT c.* FROM " + _Table + " c LEFT JOIN " + _Runs + " r ON r.id=c.runid AND r.tenantid=c.tenantid LEFT JOIN " + secrets + " s ON s.id=c.secretid AND s.tenantid=c.tenantid WHERE c.state<>'Revoked' AND (r.id IS NULL OR r.leaseepoch<>c.leaseepoch OR r.status NOT IN ('Leased','Running') OR r.cancelrequested=" + yes + " OR r.leaseexpiresutc IS NULL OR r.leaseexpiresutc<=@now OR c.expiresutc<=@now OR s.id IS NULL OR s.active=" + no + " OR s.kind<>'LeaseBroker' OR COALESCE(s.brokerresource,'')<>c.resource OR s.brokeraudience<>c.audience OR (s.brokeraudience IS NULL AND c.audience IS NOT NULL) OR (s.brokeraudience IS NOT NULL AND c.audience IS NULL) OR (s.expiresutc IS NOT NULL AND s.expiresutc<c.expiresutc)) ORDER BY c.revokeattempts,c.createdutc,c.id LIMIT 1000";
            return _Driver.QueryAsync(sql, command => AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow), Map, token);
        }

        /// <inheritdoc />
        public async Task PurgeRevokedOrphansAsync(CancellationToken token = default)
        {
            await _Driver.NonQueryAsync("DELETE FROM " + _Table + " WHERE state='Revoked' AND tenantid NOT IN (SELECT id FROM " + _Driver.Table("tenants") + ")", null, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> MarkIssuedAsync(CredentialLease lease, CancellationToken token = default)
        {
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                int held = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Runs + " SET lastupdateutc=lastupdateutc WHERE id=@run AND tenantid=@tenant AND leaseepoch=@epoch AND leaseexpiresutc>@now AND status IN ('Leased','Running') AND cancelrequested=" + _Driver.Dialect.BooleanLiteral(false), command => Bind(command, lease), ct).ConfigureAwait(false);
                if (held != 1) return;
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Table + " SET state='Issued' WHERE id=@id AND tenantid=@tenant AND runid=@run AND leaseepoch=@epoch AND state IN ('Authorized','Issued') AND EXISTS (SELECT 1 FROM " + _Runs + " WHERE id=@run AND tenantid=@tenant AND leaseepoch=@epoch AND leaseexpiresutc>@now AND status IN ('Leased','Running') AND cancelrequested=" + _Driver.Dialect.BooleanLiteral(false) + ")", command =>
            {
                Bind(command, lease);
                AdoDatabaseDriver.Add(command, "id", lease.Id);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task RecordRevocationAsync(CredentialLease lease, bool confirmed, CancellationToken token = default)
        {
            string sql = "UPDATE " + _Table + " SET revokeattempts=revokeattempts+" + (confirmed ? "0" : "1") + (confirmed ? ",state='Revoked',revokedutc=@now" : String.Empty) + " WHERE id=@id AND tenantid=@tenant AND runid=@run AND leaseepoch=@epoch";
            await _Driver.NonQueryAsync(sql, command =>
            {
                Bind(command, lease);
                AdoDatabaseDriver.Add(command, "id", lease.Id);
            }, token).ConfigureAwait(false);
        }

        private static void Bind(DbCommand command, CredentialLease lease)
        {
            AdoDatabaseDriver.Add(command, "tenant", lease.TenantId);
            AdoDatabaseDriver.Add(command, "run", lease.RunId);
            AdoDatabaseDriver.Add(command, "secret", lease.SecretId);
            AdoDatabaseDriver.Add(command, "epoch", lease.LeaseEpoch);
            AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
        }

        private static CredentialLease Map(DbDataReader reader)
        {
            return new CredentialLease
            {
                Id = AdoConverters.Str(reader, "id"), TenantId = AdoConverters.Str(reader, "tenantid"),
                RunId = AdoConverters.Str(reader, "runid"), SecretId = AdoConverters.Str(reader, "secretid"),
                LeaseEpoch = AdoConverters.Long(reader, "leaseepoch"), Resource = AdoConverters.Str(reader, "resource"),
                Audience = AdoConverters.NullableStr(reader, "audience"), State = AdoConverters.Str(reader, "state"),
                ExpiresUtc = AdoConverters.Date(reader, "expiresutc"), CreatedUtc = AdoConverters.Date(reader, "createdutc"),
                RevokedUtc = AdoConverters.NullableDate(reader, "revokedutc"), RevokeAttempts = AdoConverters.Int(reader, "revokeattempts")
            };
        }
    }
}
