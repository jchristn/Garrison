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

    /// <summary>
    /// Provider-neutral fan-out group data access (AD5). Thread-safe.
    /// </summary>
    public class AdoFanOutMethods : IFanOutMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Groups;
        private readonly string _Members;
        private readonly string _Runs;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoFanOutMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Groups = driver.Table("fan_out_groups");
            _Members = driver.Table("fan_out_group_members");
            _Runs = driver.Table("runs");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<FanOutGroup> CreateAsync(FanOutGroup group, CancellationToken token = default)
        {
            if (group == null) throw new ArgumentNullException(nameof(group));
            group.CreatedUtc = DateTime.UtcNow;
            group.LastUpdateUtc = group.CreatedUtc;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Groups + " (id, tenantid, parentrunid, rootrunid, joinpolicy, quorum, timeoutseconds, deadlineutc, maxcostusd, maxtokens, cancelremaining, status, statusreason, costusd, tokens, requestdigest, createdutc, completedutc, lastupdateutc) " +
                    "VALUES (@id, @tenantid, @parentrunid, @rootrunid, @joinpolicy, @quorum, @timeoutseconds, @deadlineutc, @maxcostusd, @maxtokens, @cancelremaining, @status, @statusreason, @costusd, @tokens, @requestdigest, @createdutc, @completedutc, @lastupdateutc);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", group.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", group.TenantId);
                        AdoDatabaseDriver.Add(command, "parentrunid", group.ParentRunId);
                        AdoDatabaseDriver.Add(command, "rootrunid", group.RootRunId);
                        AdoDatabaseDriver.Add(command, "joinpolicy", group.JoinPolicy.ToString());
                        AdoDatabaseDriver.Add(command, "quorum", group.Quorum);
                        AdoDatabaseDriver.Add(command, "timeoutseconds", group.TimeoutSeconds);
                        AdoDatabaseDriver.Add(command, "deadlineutc", group.DeadlineUtc);
                        AdoDatabaseDriver.Add(command, "maxcostusd", group.MaxCostUsd);
                        AdoDatabaseDriver.Add(command, "maxtokens", group.MaxTokens);
                        AdoDatabaseDriver.Add(command, "cancelremaining", group.CancelRemaining);
                        AdoDatabaseDriver.Add(command, "status", group.Status.ToString());
                        AdoDatabaseDriver.Add(command, "statusreason", group.StatusReason);
                        AdoDatabaseDriver.Add(command, "costusd", group.CostUsd);
                        AdoDatabaseDriver.Add(command, "tokens", group.Tokens);
                        AdoDatabaseDriver.Add(command, "requestdigest", group.RequestDigest);
                        AdoDatabaseDriver.Add(command, "createdutc", group.CreatedUtc);
                        AdoDatabaseDriver.Add(command, "completedutc", group.CompletedUtc);
                        AdoDatabaseDriver.Add(command, "lastupdateutc", group.LastUpdateUtc);
                    }, ct).ConfigureAwait(false);
                foreach (FanOutGroupMember member in group.Members)
                {
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "INSERT INTO " + _Members + " (id, tenantid, groupid, position, label, agentname, childrunid) VALUES (@id, @tenantid, @groupid, @position, @label, @agentname, @childrunid);",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "id", member.Id);
                            AdoDatabaseDriver.Add(command, "tenantid", group.TenantId);
                            AdoDatabaseDriver.Add(command, "groupid", group.Id);
                            AdoDatabaseDriver.Add(command, "position", member.Position);
                            AdoDatabaseDriver.Add(command, "label", member.Label);
                            AdoDatabaseDriver.Add(command, "agentname", member.AgentName);
                            AdoDatabaseDriver.Add(command, "childrunid", member.ChildRunId);
                        }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            return group;
        }

        /// <inheritdoc />
        public async Task<FanOutGroup?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            FanOutGroup? group = await _Driver.QuerySingleAsync("SELECT * FROM " + _Groups + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (group != null) await LoadMembersAsync(new List<FanOutGroup> { group }, token).ConfigureAwait(false);
            return group;
        }

        /// <inheritdoc />
        public async Task<FanOutGroup?> ReadByDigestAsync(string tenantId, string parentRunId, string requestDigest, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(parentRunId)) throw new ArgumentNullException(nameof(parentRunId));
            FanOutGroup? group = await _Driver.QuerySingleAsync("SELECT * FROM " + _Groups + " WHERE tenantid = @tenantid AND parentrunid = @parent AND requestdigest = @digest;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "parent", parentRunId);
                AdoDatabaseDriver.Add(command, "digest", requestDigest);
            }, Map, token).ConfigureAwait(false);
            if (group != null) await LoadMembersAsync(new List<FanOutGroup> { group }, token).ConfigureAwait(false);
            return group;
        }

        /// <inheritdoc />
        public async Task<List<FanOutGroup>> ListByParentAsync(string tenantId, string parentRunId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(parentRunId)) throw new ArgumentNullException(nameof(parentRunId));
            List<FanOutGroup> groups = await _Driver.QueryAsync("SELECT * FROM " + _Groups + " WHERE tenantid = @tenantid AND parentrunid = @parent ORDER BY createdutc ASC, id ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "parent", parentRunId);
            }, Map, token).ConfigureAwait(false);
            await LoadMembersAsync(groups, token).ConfigureAwait(false);
            return groups;
        }

        /// <inheritdoc />
        public Task<List<FanOutGroup>> ListRunningAsync(int max, CancellationToken token = default)
        {
            return _Driver.QueryAsync("SELECT * FROM " + _Groups + " WHERE status = @status ORDER BY createdutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                AdoDatabaseDriver.Add(command, "status", FanOutGroupStatusEnum.Running.ToString());
                AdoDatabaseDriver.Add(command, "max", Math.Clamp(max, 1, 10000));
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, Map, token);
        }

        /// <inheritdoc />
        public async Task UpdateUsageAsync(string id, double costUsd, long tokens, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            await _Driver.NonQueryAsync("UPDATE " + _Groups + " SET costusd = @cost, tokens = @tokens, lastupdateutc = @now WHERE id = @id;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "cost", costUsd);
                AdoDatabaseDriver.Add(command, "tokens", tokens);
                AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> EndAsync(string id, FanOutGroupStatusEnum status, string reason, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (status == FanOutGroupStatusEnum.Running) throw new ArgumentException("A group ends in a final status.", nameof(status));
            DateTime now = DateTime.UtcNow;
            int affected = await _Driver.NonQueryAsync("UPDATE " + _Groups + " SET status = @status, statusreason = @reason, completedutc = @now, lastupdateutc = @now WHERE id = @id AND status = @running;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "status", status.ToString());
                AdoDatabaseDriver.Add(command, "reason", reason);
                AdoDatabaseDriver.Add(command, "now", now);
                AdoDatabaseDriver.Add(command, "running", FanOutGroupStatusEnum.Running.ToString());
            }, token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<int> RemoveOrphansAsync(CancellationToken token = default)
        {
            int removed = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                string orphan = "SELECT g.id FROM " + _Groups + " g WHERE NOT EXISTS (SELECT 1 FROM " + _Runs + " r WHERE r.id = g.parentrunid)";
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Members + " WHERE groupid IN (" + orphan + ");", null, ct).ConfigureAwait(false);
                removed = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Groups + " WHERE id IN (" + orphan.Replace(" g ", " o ").Replace("g.", "o.") + ");", null, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return removed;
        }

        #endregion

        #region Private-Methods

        private async Task LoadMembersAsync(List<FanOutGroup> groups, CancellationToken token)
        {
            if (groups.Count == 0) return;
            Dictionary<string, FanOutGroup> byId = groups.ToDictionary(g => g.Id, StringComparer.Ordinal);
            List<string> ids = groups.Select(g => g.Id).ToList();
            List<KeyValuePair<string, FanOutGroupMember>> rows = await _Driver.QueryAsync(
                "SELECT * FROM " + _Members + " WHERE groupid IN (" + String.Join(", ", ids.Select((g, i) => "@g" + i)) + ") ORDER BY groupid ASC, position ASC;",
                command =>
                {
                    for (int i = 0; i < ids.Count; i++) AdoDatabaseDriver.Add(command, "g" + i, ids[i]);
                },
                reader => new KeyValuePair<string, FanOutGroupMember>(AdoConverters.Str(reader, "groupid"), new FanOutGroupMember
                {
                    Id = AdoConverters.Str(reader, "id"),
                    Position = AdoConverters.Int(reader, "position"),
                    Label = AdoConverters.Str(reader, "label"),
                    AgentName = AdoConverters.Str(reader, "agentname"),
                    ChildRunId = AdoConverters.Str(reader, "childrunid")
                }), token).ConfigureAwait(false);
            foreach (KeyValuePair<string, FanOutGroupMember> row in rows)
            {
                if (byId.TryGetValue(row.Key, out FanOutGroup? group)) group.Members.Add(row.Value);
            }
        }

        private static FanOutGroup Map(DbDataReader reader)
        {
            FanOutGroup group = new FanOutGroup();
            group.Id = AdoConverters.Str(reader, "id");
            group.TenantId = AdoConverters.Str(reader, "tenantid");
            group.ParentRunId = AdoConverters.Str(reader, "parentrunid");
            group.RootRunId = AdoConverters.Str(reader, "rootrunid");
            group.JoinPolicy = AdoConverters.Enum(reader, "joinpolicy", FanOutJoinPolicyEnum.All);
            group.Quorum = AdoConverters.Int(reader, "quorum");
            group.TimeoutSeconds = AdoConverters.Int(reader, "timeoutseconds");
            group.DeadlineUtc = AdoConverters.NullableDate(reader, "deadlineutc");
            group.MaxCostUsd = AdoConverters.NullableDouble(reader, "maxcostusd");
            group.MaxTokens = AdoConverters.NullableLong(reader, "maxtokens");
            group.CancelRemaining = AdoConverters.Bool(reader, "cancelremaining");
            group.Status = AdoConverters.Enum(reader, "status", FanOutGroupStatusEnum.Running);
            group.StatusReason = AdoConverters.NullableStr(reader, "statusreason");
            group.CostUsd = AdoConverters.Double(reader, "costusd");
            group.Tokens = AdoConverters.Long(reader, "tokens");
            group.RequestDigest = AdoConverters.Str(reader, "requestdigest");
            group.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            group.CompletedUtc = AdoConverters.NullableDate(reader, "completedutc");
            group.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return group;
        }

        #endregion
    }
}
