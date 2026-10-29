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
    /// Provider-neutral capability descriptor data access (AD4). Shared descriptors have a null tenant and the scope key
    /// "*", so the unique (scope, source) index covers them too. Thread-safe.
    /// </summary>
    public class AdoCapabilityMethods : ICapabilityMethods
    {
        #region Private-Members

        private const string _SharedScope = "*";
        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Tags;
        private readonly string _Requirements;
        private readonly string _Runs;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoCapabilityMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("capability_descriptors");
            _Tags = driver.Table("capability_descriptor_tags");
            _Requirements = driver.Table("capability_descriptor_requirements");
            _Runs = driver.Table("runs");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<CapabilityDescriptor> CreateAsync(CapabilityDescriptor obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Table + " (id, tenantid, scopekey, name, kind, origin, sourcekey, sourceagentid, sourcerevisionid, sourcemcpserverid, sourcetoolname, sourceharnessprofileid, sourceharnesstype, summary, inputschemajson, outputschemajson, " +
                    "hintstatus, hintsamplesize, hintmediandurationms, hintp90durationms, hintmeancostusd, hintwindowdays, hintcomputedutc, refreshwarning, lastrefreshedutc, createdutc, lastupdateutc) VALUES " +
                    "(@id, @tenantid, @scopekey, @name, @kind, @origin, @sourcekey, @sourceagentid, @sourcerevisionid, @sourcemcpserverid, @sourcetoolname, @sourceharnessprofileid, @sourceharnesstype, @summary, @inputschemajson, @outputschemajson, " +
                    "@hintstatus, @hintsamplesize, @hintmediandurationms, @hintp90durationms, @hintmeancostusd, @hintwindowdays, @hintcomputedutc, @refreshwarning, @lastrefreshedutc, @createdutc, @lastupdateutc);",
                    command => Bind(command, obj), ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<CapabilityDescriptor> UpdateAsync(CapabilityDescriptor obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Table + " SET name = @name, kind = @kind, origin = @origin, sourcekey = @sourcekey, sourceagentid = @sourceagentid, sourcerevisionid = @sourcerevisionid, sourcemcpserverid = @sourcemcpserverid, " +
                    "sourcetoolname = @sourcetoolname, sourceharnessprofileid = @sourceharnessprofileid, sourceharnesstype = @sourceharnesstype, summary = @summary, inputschemajson = @inputschemajson, outputschemajson = @outputschemajson, " +
                    "hintstatus = @hintstatus, hintsamplesize = @hintsamplesize, hintmediandurationms = @hintmediandurationms, hintp90durationms = @hintp90durationms, hintmeancostusd = @hintmeancostusd, hintwindowdays = @hintwindowdays, " +
                    "hintcomputedutc = @hintcomputedutc, refreshwarning = @refreshwarning, lastrefreshedutc = @lastrefreshedutc, lastupdateutc = @lastupdateutc WHERE id = @id AND scopekey = @scopekey;",
                    command => Bind(command, obj), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tags + " WHERE capabilityid = @id;", command => AdoDatabaseDriver.Add(command, "id", obj.Id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Requirements + " WHERE capabilityid = @id;", command => AdoDatabaseDriver.Add(command, "id", obj.Id), ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<CapabilityDescriptor?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            CapabilityDescriptor? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND (tenantid = @tenantid OR tenantid IS NULL);", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(new List<CapabilityDescriptor> { obj }, "capabilityid = @id", command => AdoDatabaseDriver.Add(command, "id", obj.Id), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<CapabilityDescriptor?> ReadBySourceAsync(string? tenantId, string sourceKey, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(sourceKey)) throw new ArgumentNullException(nameof(sourceKey));
            CapabilityDescriptor? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE scopekey = @scopekey AND sourcekey = @sourcekey;", command =>
            {
                AdoDatabaseDriver.Add(command, "scopekey", Scope(tenantId));
                AdoDatabaseDriver.Add(command, "sourcekey", sourceKey);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(new List<CapabilityDescriptor> { obj }, "capabilityid = @id", command => AdoDatabaseDriver.Add(command, "id", obj.Id), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<List<CapabilityDescriptor>> ListAsync(string tenantId, CapabilityKindEnum? kind, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            string kindFilter = kind.HasValue ? " AND kind = @kind" : String.Empty;
            List<CapabilityDescriptor> list = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE (tenantid = @tenantid OR tenantid IS NULL)" + kindFilter + " ORDER BY kind ASC, name ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "max", 5000);
                    AdoDatabaseDriver.Add(command, "skip", 0);
                    if (kind.HasValue) AdoDatabaseDriver.Add(command, "kind", kind.Value.ToString());
                }, Map, token).ConfigureAwait(false);
            if (list.Count > 0)
            {
                await LoadChildrenAsync(list, "(tenantid = @tenantid OR tenantid IS NULL)", command => AdoDatabaseDriver.Add(command, "tenantid", tenantId), token).ConfigureAwait(false);
            }
            return list;
        }

        /// <inheritdoc />
        public Task<List<CapabilityDescriptor>> ListInScopeAsync(string? tenantId, CapabilityKindEnum kind, CapabilityOriginEnum origin, CancellationToken token = default)
        {
            return _Driver.QueryAsync("SELECT * FROM " + _Table + " WHERE scopekey = @scopekey AND kind = @kind AND origin = @origin ORDER BY id ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "scopekey", Scope(tenantId));
                AdoDatabaseDriver.Add(command, "kind", kind.ToString());
                AdoDatabaseDriver.Add(command, "origin", origin.ToString());
            }, Map, token);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string? tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int deleted = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                deleted = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id AND scopekey = @scopekey;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "scopekey", Scope(tenantId));
                }, ct).ConfigureAwait(false);
                if (deleted == 0) return;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tags + " WHERE capabilityid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Requirements + " WHERE capabilityid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return deleted > 0;
        }

        /// <inheritdoc />
        public async Task UpdateHintsAsync(string id, CapabilityHints hints, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (hints == null) throw new ArgumentNullException(nameof(hints));
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET hintstatus = @hintstatus, hintsamplesize = @hintsamplesize, hintmediandurationms = @hintmediandurationms, hintp90durationms = @hintp90durationms, hintmeancostusd = @hintmeancostusd, " +
                "hintwindowdays = @hintwindowdays, hintcomputedutc = @hintcomputedutc WHERE id = @id;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    BindHints(command, hints);
                }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public Task<int> SetServerWarningAsync(string tenantId, string mcpServerId, string? warning, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(mcpServerId)) throw new ArgumentNullException(nameof(mcpServerId));
            return _Driver.NonQueryAsync("UPDATE " + _Table + " SET refreshwarning = @warning WHERE tenantid = @tenantid AND sourcemcpserverid = @serverid AND origin = @origin;", command =>
            {
                AdoDatabaseDriver.Add(command, "warning", warning);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "serverid", mcpServerId);
                AdoDatabaseDriver.Add(command, "origin", CapabilityOriginEnum.Derived.ToString());
            }, token);
        }

        /// <inheritdoc />
        public async Task<List<CapabilityRunSample>> RunSamplesAsync(string tenantId, string agentId, DateTime sinceUtc, int max, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            List<CapabilityRunSample> samples = await _Driver.QueryAsync(
                "SELECT startedutc, completedutc, costusd FROM " + _Runs + " WHERE tenantid = @tenantid AND agentid = @agentid AND status IN ('Succeeded', 'Failed') " +
                "AND startedutc IS NOT NULL AND completedutc IS NOT NULL AND completedutc >= @since ORDER BY completedutc DESC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "agentid", agentId);
                    AdoDatabaseDriver.Add(command, "since", sinceUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(max, 1, 100000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                reader =>
                {
                    DateTime started = AdoConverters.Date(reader, "startedutc");
                    DateTime completed = AdoConverters.Date(reader, "completedutc");
                    return new CapabilityRunSample { DurationMs = Math.Max(0L, (long)(completed - started).TotalMilliseconds), CostUsd = AdoConverters.NullableDouble(reader, "costusd") };
                }, token).ConfigureAwait(false);
            return samples;
        }

        #endregion

        #region Private-Methods

        private static string Scope(string? tenantId)
        {
            return String.IsNullOrEmpty(tenantId) ? _SharedScope : tenantId;
        }

        private static void Bind(DbCommand command, CapabilityDescriptor obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", String.IsNullOrEmpty(obj.TenantId) ? null : obj.TenantId);
            AdoDatabaseDriver.Add(command, "scopekey", Scope(obj.TenantId));
            AdoDatabaseDriver.Add(command, "name", obj.Name);
            AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
            AdoDatabaseDriver.Add(command, "origin", obj.Origin.ToString());
            AdoDatabaseDriver.Add(command, "sourcekey", obj.SourceKey);
            AdoDatabaseDriver.Add(command, "sourceagentid", obj.SourceAgentId);
            AdoDatabaseDriver.Add(command, "sourcerevisionid", obj.SourceRevisionId);
            AdoDatabaseDriver.Add(command, "sourcemcpserverid", obj.SourceMcpServerId);
            AdoDatabaseDriver.Add(command, "sourcetoolname", obj.SourceToolName);
            AdoDatabaseDriver.Add(command, "sourceharnessprofileid", obj.SourceHarnessProfileId);
            AdoDatabaseDriver.Add(command, "sourceharnesstype", obj.SourceHarnessType?.ToString());
            AdoDatabaseDriver.Add(command, "summary", obj.Summary);
            AdoDatabaseDriver.Add(command, "inputschemajson", obj.InputSchemaJson);
            AdoDatabaseDriver.Add(command, "outputschemajson", obj.OutputSchemaJson);
            BindHints(command, obj.Hints);
            AdoDatabaseDriver.Add(command, "refreshwarning", obj.RefreshWarning);
            AdoDatabaseDriver.Add(command, "lastrefreshedutc", obj.LastRefreshedUtc);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private static void BindHints(DbCommand command, CapabilityHints hints)
        {
            AdoDatabaseDriver.Add(command, "hintstatus", hints.Status.ToString());
            AdoDatabaseDriver.Add(command, "hintsamplesize", hints.SampleSize);
            AdoDatabaseDriver.Add(command, "hintmediandurationms", hints.MedianDurationMs);
            AdoDatabaseDriver.Add(command, "hintp90durationms", hints.P90DurationMs);
            AdoDatabaseDriver.Add(command, "hintmeancostusd", hints.MeanCostUsd);
            AdoDatabaseDriver.Add(command, "hintwindowdays", hints.WindowDays);
            AdoDatabaseDriver.Add(command, "hintcomputedutc", hints.ComputedUtc);
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, CapabilityDescriptor obj, CancellationToken token)
        {
            string batch = obj.Id + "_";
            for (int i = 0; i < obj.Tags.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Tags + " (id, capabilityid, tenantid, position, tag) VALUES (@id, @capabilityid, @tenantid, @position, @tag);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + "t" + position.ToString("D4", System.Globalization.CultureInfo.InvariantCulture));
                        AdoDatabaseDriver.Add(command, "capabilityid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", String.IsNullOrEmpty(obj.TenantId) ? null : obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "tag", obj.Tags[position]);
                    }, token).ConfigureAwait(false);
            }
            for (int i = 0; i < obj.Requirements.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Requirements + " (id, capabilityid, tenantid, position, labelkey, labelvalue) VALUES (@id, @capabilityid, @tenantid, @position, @labelkey, @labelvalue);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + "r" + position.ToString("D4", System.Globalization.CultureInfo.InvariantCulture));
                        AdoDatabaseDriver.Add(command, "capabilityid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", String.IsNullOrEmpty(obj.TenantId) ? null : obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "labelkey", obj.Requirements[position].Key);
                        AdoDatabaseDriver.Add(command, "labelvalue", obj.Requirements[position].Value);
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task LoadChildrenAsync(List<CapabilityDescriptor> list, string where, Action<DbCommand> bind, CancellationToken token)
        {
            Dictionary<string, CapabilityDescriptor> byId = list.ToDictionary(d => d.Id, StringComparer.Ordinal);
            List<CapabilityChildRow> tags = await _Driver.QueryAsync("SELECT capabilityid, tag FROM " + _Tags + " WHERE " + where + " ORDER BY capabilityid ASC, position ASC;", bind,
                reader => new CapabilityChildRow { CapabilityId = AdoConverters.Str(reader, "capabilityid"), Key = AdoConverters.Str(reader, "tag") }, token).ConfigureAwait(false);
            foreach (CapabilityChildRow row in tags)
            {
                if (byId.TryGetValue(row.CapabilityId, out CapabilityDescriptor? owner)) owner.Tags.Add(row.Key);
            }
            List<CapabilityChildRow> requirements = await _Driver.QueryAsync("SELECT capabilityid, labelkey, labelvalue FROM " + _Requirements + " WHERE " + where + " ORDER BY capabilityid ASC, position ASC;", bind,
                reader => new CapabilityChildRow { CapabilityId = AdoConverters.Str(reader, "capabilityid"), Key = AdoConverters.Str(reader, "labelkey"), Value = AdoConverters.Str(reader, "labelvalue") }, token).ConfigureAwait(false);
            foreach (CapabilityChildRow row in requirements)
            {
                if (byId.TryGetValue(row.CapabilityId, out CapabilityDescriptor? owner)) owner.Requirements.Add(new CapabilityRequirement { Key = row.Key, Value = row.Value });
            }
        }

        private static CapabilityDescriptor Map(DbDataReader reader)
        {
            CapabilityDescriptor obj = new CapabilityDescriptor();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.NullableStr(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Kind = AdoConverters.Enum(reader, "kind", CapabilityKindEnum.Agent);
            obj.Origin = AdoConverters.Enum(reader, "origin", CapabilityOriginEnum.Manual);
            obj.SourceKey = AdoConverters.Str(reader, "sourcekey");
            obj.SourceAgentId = AdoConverters.NullableStr(reader, "sourceagentid");
            obj.SourceRevisionId = AdoConverters.NullableStr(reader, "sourcerevisionid");
            obj.SourceMcpServerId = AdoConverters.NullableStr(reader, "sourcemcpserverid");
            obj.SourceToolName = AdoConverters.NullableStr(reader, "sourcetoolname");
            obj.SourceHarnessProfileId = AdoConverters.NullableStr(reader, "sourceharnessprofileid");
            obj.SourceHarnessType = AdoConverters.NullableEnum<HarnessTypeEnum>(reader, "sourceharnesstype");
            obj.Summary = AdoConverters.NullableStr(reader, "summary");
            obj.InputSchemaJson = AdoConverters.NullableStr(reader, "inputschemajson");
            obj.OutputSchemaJson = AdoConverters.NullableStr(reader, "outputschemajson");
            CapabilityHints hints = new CapabilityHints();
            hints.Status = AdoConverters.Enum(reader, "hintstatus", CapabilityHintStatusEnum.Unknown);
            hints.SampleSize = AdoConverters.Int(reader, "hintsamplesize");
            hints.MedianDurationMs = AdoConverters.NullableLong(reader, "hintmediandurationms");
            hints.P90DurationMs = AdoConverters.NullableLong(reader, "hintp90durationms");
            hints.MeanCostUsd = AdoConverters.NullableDouble(reader, "hintmeancostusd");
            hints.WindowDays = AdoConverters.Int(reader, "hintwindowdays");
            hints.ComputedUtc = AdoConverters.NullableDate(reader, "hintcomputedutc");
            obj.Hints = hints;
            obj.RefreshWarning = AdoConverters.NullableStr(reader, "refreshwarning");
            obj.LastRefreshedUtc = AdoConverters.NullableDate(reader, "lastrefreshedutc");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion
    }
}
