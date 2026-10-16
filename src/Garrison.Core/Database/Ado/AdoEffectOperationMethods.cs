namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>Structured effect journal. Every dispatch is guarded by an atomic lease predicate.</summary>
    public class AdoEffectOperationMethods : IEffectOperationMethods
    {
        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Runs;
        private readonly string _Checkpoints;

        /// <summary>Create journal persistence.</summary>
        /// <exception cref="ArgumentNullException">Driver is null.</exception>
        public AdoEffectOperationMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("effect_operations");
            _Runs = driver.Table("runs");
            _Checkpoints = driver.Table("effect_checkpoints");
        }

        /// <inheritdoc />
        public async Task<bool> AuthorizeAsync(EffectOperation operation, CancellationToken token = default)
        {
            if (operation == null) throw new ArgumentNullException(nameof(operation));
            if (operation.State != EffectOperationStateEnum.Authorized) throw new ArgumentException("New effect intents must be Authorized.", nameof(operation));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                int held = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Runs + " SET lastupdateutc=lastupdateutc WHERE id=@run AND " + ActiveLease(), command => Bind(command, operation.TenantId, operation.RunId, operation.LeaseEpoch), ct).ConfigureAwait(false);
                if (held != 1) return;
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Table + " (id,tenantid,runid,leaseepoch,tool,argumentdigest,state,resultreference,createdutc) SELECT @id,@tenant,@run,@epoch,@tool,@digest,'Authorized',NULL,@now WHERE " + ActiveLease(), command =>
                {
                    Bind(command, operation.TenantId, operation.RunId, operation.LeaseEpoch);
                    AdoDatabaseDriver.Add(command, "id", operation.Id);
                    AdoDatabaseDriver.Add(command, "tool", operation.Tool);
                    AdoDatabaseDriver.Add(command, "digest", operation.ArgumentDigest);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<bool> TransitionAsync(string tenantId, string runId, string operationId, long epoch, EffectOperationStateEnum expected, EffectOperationStateEnum next, string? resultReference = null, CancellationToken token = default)
        {
            bool allowed = expected == EffectOperationStateEnum.Authorized && next == EffectOperationStateEnum.Dispatched
                || expected == EffectOperationStateEnum.Dispatched && (next == EffectOperationStateEnum.Completed || next == EffectOperationStateEnum.Unknown);
            if (!allowed) throw new ArgumentException("Only Authorized to Dispatched and Dispatched to Completed or Unknown transitions are valid.", nameof(next));
            string fence = next == EffectOperationStateEnum.Dispatched ? " AND " + ActiveLease() : String.Empty;
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                if (next == EffectOperationStateEnum.Dispatched)
                {
                    int held = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Runs + " SET lastupdateutc=lastupdateutc WHERE id=@run AND " + ActiveLease(), command => Bind(command, tenantId, runId, epoch), ct).ConfigureAwait(false);
                    if (held != 1) return;
                }
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Table + " SET state=@next,resultreference=@result WHERE tenantid=@tenant AND runid=@run AND id=@id AND leaseepoch=@epoch AND state=@expected" + fence, command =>
            {
                Bind(command, tenantId, runId, epoch);
                AdoDatabaseDriver.Add(command, "id", operationId);
                AdoDatabaseDriver.Add(command, "expected", expected.ToString());
                AdoDatabaseDriver.Add(command, "next", next.ToString());
                AdoDatabaseDriver.Add(command, "result", resultReference);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public Task<List<EffectOperation>> ListAsync(string tenantId, string runId, CancellationToken token = default)
        {
            return _Driver.QueryAsync("SELECT * FROM " + _Table + " WHERE tenantid=@tenant AND runid=@run ORDER BY createdutc,id", command =>
            {
                AdoDatabaseDriver.Add(command, "tenant", tenantId);
                AdoDatabaseDriver.Add(command, "run", runId);
            }, Map, token);
        }

        /// <inheritdoc />
        public async Task<bool> HasUncertainAsync(string tenantId, string runId, long epoch, CancellationToken token = default)
        {
            List<EffectOperation> operations = await ListAsync(tenantId, runId, token).ConfigureAwait(false);
            return operations.Any(operation => operation.LeaseEpoch == epoch && (operation.State == EffectOperationStateEnum.Dispatched || operation.State == EffectOperationStateEnum.Unknown));
        }

        /// <inheritdoc />
        public async Task<bool> CheckpointAsync(string tenantId, string runId, long epoch, bool gatewayOnlyCoverage, CancellationToken token = default)
        {
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                // A checkpoint can be recorded only when no dispatched operation has an uncertain outcome.
                string safe = ActiveLease() + " AND NOT EXISTS (SELECT 1 FROM " + _Table + " WHERE tenantid=@tenant AND runid=@run AND leaseepoch=@epoch AND state IN ('Dispatched','Unknown'))";
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Checkpoints + " SET leaseepoch=@epoch,gatewayonly=@coverage,createdutc=@now WHERE tenantid=@tenant AND runid=@run AND " + safe, command =>
                {
                    Bind(command, tenantId, runId, epoch);
                    AdoDatabaseDriver.Add(command, "coverage", gatewayOnlyCoverage);
                }, ct).ConfigureAwait(false);
                if (affected == 0)
                {
                    affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Checkpoints + " (tenantid,runid,leaseepoch,gatewayonly,createdutc) SELECT @tenant,@run,@epoch,@coverage,@now WHERE " + safe + " AND NOT EXISTS (SELECT 1 FROM " + _Checkpoints + " WHERE runid=@run)", command =>
                    {
                        Bind(command, tenantId, runId, epoch);
                        AdoDatabaseDriver.Add(command, "coverage", gatewayOnlyCoverage);
                    }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<bool> RecoverySafeAsync(string tenantId, string runId, long epoch, CancellationToken token = default)
        {
            // A fenced, accepted durable session checkpoint records completed effects in resumable state. The suspend
            // transaction holds the same run-row lock as dispatch and refuses every unresolved operation before saving.
            string snapshots = _Driver.Table("run_checkpoints");
            List<int> snapshotsSafe = await _Driver.QueryAsync("SELECT 1 FROM " + snapshots + " c WHERE c.tenantid=@tenant AND c.runid=@run AND c.epoch=@epoch AND NOT EXISTS (SELECT 1 FROM " + _Table + " o WHERE o.tenantid=@tenant AND o.runid=@run AND (o.state IN ('Dispatched','Unknown') OR o.leaseepoch>c.epoch OR o.createdutc>c.createdutc))", command => Bind(command, tenantId, runId, epoch), reader => 1, token).ConfigureAwait(false);
            if (snapshotsSafe.Count == 1) return true;
            // Re-running a prompt is safe only before any effect was dispatched. A completed effect after a checkpoint
            // needs a session continuation with result replay, which this recovery decision deliberately does not infer.
            List<int> rows = await _Driver.QueryAsync("SELECT 1 FROM " + _Checkpoints + " WHERE tenantid=@tenant AND runid=@run AND leaseepoch=@epoch AND gatewayonly=@coverage AND NOT EXISTS (SELECT 1 FROM " + _Table + " WHERE tenantid=@tenant AND runid=@run AND ((leaseepoch=@epoch AND state <> 'Authorized') OR state IN ('Dispatched','Unknown')))", command =>
            {
                Bind(command, tenantId, runId, epoch);
                AdoDatabaseDriver.Add(command, "coverage", true);
            }, reader => 1, token).ConfigureAwait(false);
            return rows.Count == 1;
        }

        private string ActiveLease()
        {
            return "EXISTS (SELECT 1 FROM " + _Runs + " WHERE id=@run AND tenantid=@tenant AND leaseepoch=@epoch AND leaseexpiresutc>@now AND status IN ('Leased','Running') AND cancelrequested=" + _Driver.Dialect.BooleanLiteral(false) + ")";
        }

        private static void Bind(DbCommand command, string tenantId, string runId, long epoch)
        {
            if (String.IsNullOrWhiteSpace(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrWhiteSpace(runId)) throw new ArgumentNullException(nameof(runId));
            AdoDatabaseDriver.Add(command, "tenant", tenantId);
            AdoDatabaseDriver.Add(command, "run", runId);
            AdoDatabaseDriver.Add(command, "epoch", epoch);
            AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
        }

        private static EffectOperation Map(DbDataReader reader)
        {
            return new EffectOperation
            {
                Id = AdoConverters.Str(reader, "id"), TenantId = AdoConverters.Str(reader, "tenantid"),
                RunId = AdoConverters.Str(reader, "runid"), LeaseEpoch = AdoConverters.Long(reader, "leaseepoch"),
                Tool = AdoConverters.Str(reader, "tool"), ArgumentDigest = AdoConverters.Str(reader, "argumentdigest"),
                State = AdoConverters.Enum<EffectOperationStateEnum>(reader, "state", EffectOperationStateEnum.Unknown),
                ResultReference = AdoConverters.NullableStr(reader, "resultreference"),
                CreatedUtc = AdoConverters.Date(reader, "createdutc")
            };
        }
    }
}
