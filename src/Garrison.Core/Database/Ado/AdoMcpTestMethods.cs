namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;

    /// <summary>Bounded diagnostic queue using atomic SQL and structured tool child rows. Thread-safe.</summary>
    public class AdoMcpTestMethods : IMcpTestMethods
    {
        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Tools;
        private readonly string _Nodes;

        /// <summary>Construct queue persistence.</summary>
        /// <param name="driver">Owning database.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoMcpTestMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("mcp_tests");
            _Tools = driver.Table("mcp_test_tools");
            _Nodes = driver.Table("nodes");
        }

        /// <inheritdoc />
        public async Task<McpTestQueueEntry> CreateAsync(McpTestQueueEntry entry, CancellationToken token = default)
        {
            if (entry == null) throw new ArgumentNullException(nameof(entry));
            await _Driver.NonQueryAsync("INSERT INTO " + _Table + " (id,tenantid,serverid,nodeid,noderegisteredutc,serverupdatedutc,expiresutc,started,finished,success,durationms,timeoutms) VALUES (@id,@tenant,@server,@node,@registration,@revision,@expires,@no,@no,@no,0,@timeout);", command =>
            {
                AdoDatabaseDriver.Add(command, "id", entry.Id); AdoDatabaseDriver.Add(command, "tenant", entry.TenantId);
                AdoDatabaseDriver.Add(command, "server", entry.ServerId); AdoDatabaseDriver.Add(command, "node", entry.NodeId);
                AdoDatabaseDriver.Add(command, "registration", entry.NodeRegisteredUtc); AdoDatabaseDriver.Add(command, "revision", entry.ServerUpdatedUtc);
                AdoDatabaseDriver.Add(command, "timeout", entry.TimeoutMs); AdoDatabaseDriver.Add(command, "expires", entry.ExpiresUtc); AdoDatabaseDriver.Add(command, "no", false);
            }, token).ConfigureAwait(false);
            return entry;
        }

        /// <inheritdoc />
        public async Task<McpTestQueueEntry?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            McpTestQueueEntry? entry = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE tenantid=@tenant AND id=@id;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "id", id);
            }, Map, token).ConfigureAwait(false);
            if (entry == null || !entry.Finished) return entry;
            await _Driver.QueryAsync("SELECT kind,name FROM " + _Tools + " WHERE tenantid=@tenant AND testid=@id ORDER BY position;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "id", id);
            }, reader =>
            {
                string name = AdoConverters.Str(reader, "name");
                if (AdoConverters.Str(reader, "kind") == "Listed") entry.Result.Tools.Add(name);
                else entry.Result.MissingRequiredTools.Add(name);
                return name;
            }, token).ConfigureAwait(false);
            return entry;
        }

        /// <inheritdoc />
        public async Task<McpTestQueueEntry?> ClaimAsync(string nodeId, DateTime registeredUtc, CancellationToken token = default)
        {
            McpTestQueueEntry? candidate = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE nodeid=@node AND noderegisteredutc=@registration AND started=@no AND expiresutc>@now AND EXISTS (SELECT 1 FROM " + _Nodes + " node WHERE node.id=@node AND node.registeredutc=@registration AND node.active<>@no AND node.supportsmcptests<>@no AND node.status='Ready');", command =>
            {
                AdoDatabaseDriver.Add(command, "node", nodeId); AdoDatabaseDriver.Add(command, "registration", registeredUtc);
                AdoDatabaseDriver.Add(command, "no", false); AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
            }, Map, token).ConfigureAwait(false);
            if (candidate == null) return null;
            int changed = await _Driver.NonQueryAsync("UPDATE " + _Table + " SET started=@yes WHERE id=@id AND nodeid=@node AND noderegisteredutc=@registration AND started=@no AND expiresutc>@now AND EXISTS (SELECT 1 FROM " + _Nodes + " node WHERE node.id=@node AND node.registeredutc=@registration AND node.active<>@no AND node.supportsmcptests<>@no AND node.status='Ready');", command =>
            {
                AdoDatabaseDriver.Add(command, "id", candidate.Id); AdoDatabaseDriver.Add(command, "yes", true); AdoDatabaseDriver.Add(command, "no", false);
                AdoDatabaseDriver.Add(command, "node", nodeId); AdoDatabaseDriver.Add(command, "registration", registeredUtc); AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
            }, token).ConfigureAwait(false);
            if (changed == 0) return null;
            candidate.Started = true;
            return candidate;
        }

        /// <inheritdoc />
        public async Task<bool> CompleteAsync(string nodeId, DateTime registeredUtc, string id, McpServerTestResponse result, CancellationToken token = default)
        {
            if (result == null) throw new ArgumentNullException(nameof(result));
            bool changed = false;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                int updated = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Table + " SET finished=@yes,success=@success,durationms=@duration,error=@error WHERE id=@id AND nodeid=@node AND noderegisteredutc=@registration AND started=@yes AND finished=@no AND expiresutc>@now AND EXISTS (SELECT 1 FROM " + _Nodes + " node WHERE node.id=@node AND node.registeredutc=@registration);", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id); AdoDatabaseDriver.Add(command, "node", nodeId); AdoDatabaseDriver.Add(command, "registration", registeredUtc);
                    AdoDatabaseDriver.Add(command, "yes", true); AdoDatabaseDriver.Add(command, "no", false); AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                    AdoDatabaseDriver.Add(command, "success", result.Success); AdoDatabaseDriver.Add(command, "duration", result.DurationMs); AdoDatabaseDriver.Add(command, "error", result.Error);
                }, ct).ConfigureAwait(false);
                if (updated == 0) return;
                changed = true;
                McpTestQueueEntry? entry = (await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT * FROM " + _Table + " WHERE id=@id;", command => AdoDatabaseDriver.Add(command, "id", id), Map, ct).ConfigureAwait(false)).Find(e => e.Id == id);
                if (entry == null) return;
                int position = 0;
                foreach (string name in result.Tools) await ToolAsync(connection, transaction, entry, "Listed", name, position++, ct).ConfigureAwait(false);
                foreach (string name in result.MissingRequiredTools) await ToolAsync(connection, transaction, entry, "Missing", name, position++, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return changed;
        }

        /// <inheritdoc />
        public async Task DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                foreach (string table in new[] { _Tools, _Table }) await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + table + " WHERE tenantid=@tenant AND " + (table == _Table ? "id" : "testid") + "=@id;", command =>
                {
                    AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "id", id);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> RemoveFinishedByNodeAsync(string nodeId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(nodeId)) throw new ArgumentNullException(nameof(nodeId));
            int removed = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tools + " WHERE testid IN (SELECT id FROM " + _Table + " WHERE nodeid=@node AND finished=@yes);", command =>
                {
                    AdoDatabaseDriver.Add(command, "node", nodeId); AdoDatabaseDriver.Add(command, "yes", true);
                }, ct).ConfigureAwait(false);
                removed = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE nodeid=@node AND finished=@yes;", command =>
                {
                    AdoDatabaseDriver.Add(command, "node", nodeId); AdoDatabaseDriver.Add(command, "yes", true);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return removed;
        }

        /// <inheritdoc />
        public async Task RemoveExpiredAsync(CancellationToken token = default)
        {
            DateTime now = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tools + " WHERE testid IN (SELECT id FROM " + _Table + " WHERE expiresutc<@now);", command => AdoDatabaseDriver.Add(command, "now", now), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE expiresutc<@now;", command => AdoDatabaseDriver.Add(command, "now", now), ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
        }

        private async Task ToolAsync(DbConnection connection, DbTransaction transaction, McpTestQueueEntry entry, string kind, string name, int position, CancellationToken token)
        {
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Tools + " (id,tenantid,testid,kind,name,position) VALUES (@id,@tenant,@test,@kind,@name,@position);", command =>
            {
                AdoDatabaseDriver.Add(command, "id", IdGenerator.New(Garrison.Core.Constants.McpTestToolIdPrefix)); AdoDatabaseDriver.Add(command, "tenant", entry.TenantId);
                AdoDatabaseDriver.Add(command, "test", entry.Id); AdoDatabaseDriver.Add(command, "kind", kind);
                AdoDatabaseDriver.Add(command, "name", name); AdoDatabaseDriver.Add(command, "position", position);
            }, token).ConfigureAwait(false);
        }

        private static McpTestQueueEntry Map(DbDataReader reader)
        {
            return new McpTestQueueEntry
            {
                Id = AdoConverters.Str(reader, "id"), TenantId = AdoConverters.Str(reader, "tenantid"), ServerId = AdoConverters.Str(reader, "serverid"), NodeId = AdoConverters.Str(reader, "nodeid"),
                NodeRegisteredUtc = AdoConverters.Date(reader, "noderegisteredutc"), ServerUpdatedUtc = AdoConverters.Date(reader, "serverupdatedutc"), ExpiresUtc = AdoConverters.Date(reader, "expiresutc"),
                TimeoutMs = AdoConverters.Int(reader, "timeoutms"), Started = AdoConverters.Bool(reader, "started"), Finished = AdoConverters.Bool(reader, "finished"),
                Result = new McpServerTestResponse { Success = AdoConverters.Bool(reader, "success"), DurationMs = AdoConverters.Long(reader, "durationms"), Error = AdoConverters.NullableStr(reader, "error") }
            };
        }
    }
}
