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
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral mandate revision data access (AA1). Signals live in a child table keyed by revision and position.
    /// Thread-safe.
    /// </summary>
    public class AdoMandateRevisionMethods : IMandateRevisionMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, mandateid, number, state, objective, healthydefinition, autonomy, escalationpolicy, direction, wakemode, minintervalseconds, maxintervalseconds, backofffactor, jitterpercent, budgetpertickusd, budgetperdayusd, maxtokenspertick, escalationtargetkind, escalationtargetid, source, author, changenote, createdutc, publishedutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Signals;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoMandateRevisionMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("mandate_revisions");
            _Signals = driver.Table("mandate_revision_signals");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<MandateRevision> CreateAsync(MandateRevision obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), ct).ConfigureAwait(false);
                await InsertSignalsAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<MandateRevision?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            MandateRevision? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj == null) return null;
            await LoadSignalsAsync(new List<MandateRevision> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> UpdateDraftAsync(MandateRevision obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Table + " SET objective = @objective, healthydefinition = @healthydefinition, autonomy = @autonomy, escalationpolicy = @escalationpolicy, direction = @direction, wakemode = @wakemode, minintervalseconds = @minintervalseconds, maxintervalseconds = @maxintervalseconds, backofffactor = @backofffactor, jitterpercent = @jitterpercent, budgetpertickusd = @budgetpertickusd, budgetperdayusd = @budgetperdayusd, maxtokenspertick = @maxtokenspertick, escalationtargetkind = @escalationtargetkind, escalationtargetid = @escalationtargetid, changenote = @changenote WHERE id = @id AND tenantid = @tenantid AND state = 'Draft';",
                    command => Bind(command, obj), ct).ConfigureAwait(false);
                if (affected == 0) return;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Signals + " WHERE revisionid = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                }, ct).ConfigureAwait(false);
                await InsertSignalsAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> PublishAsync(string tenantId, string id, DateTime publishedUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync("UPDATE " + _Table + " SET state = 'Published', publishedutc = @published WHERE id = @id AND tenantid = @tenantid AND state = 'Draft';", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "published", publishedUtc);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<int> NextNumberAsync(string mandateId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(mandateId)) throw new ArgumentNullException(nameof(mandateId));
            object? value = await _Driver.ScalarAsync("SELECT MAX(number) FROM " + _Table + " WHERE mandateid = @mandateid;", command => AdoDatabaseDriver.Add(command, "mandateid", mandateId), token).ConfigureAwait(false);
            if (value == null || value is DBNull) return 1;
            return Convert.ToInt32(value) + 1;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<MandateRevision>> EnumerateAsync(string tenantId, string mandateId, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(mandateId)) throw new ArgumentNullException(nameof(mandateId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            string where = " WHERE tenantid = @tenantid AND mandateid = @mandateid";
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "mandateid", mandateId);
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            string order = query.Ordering == EnumerationOrderEnum.CreatedAscending ? " ORDER BY number ASC" : " ORDER BY number DESC";
            List<MandateRevision> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + order + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            await LoadSignalsAsync(objects, token).ConfigureAwait(false);
            return EnumerationResult<MandateRevision>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a revision row (without signals).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static MandateRevision Map(DbDataReader reader)
        {
            MandateRevision obj = new MandateRevision();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.MandateId = AdoConverters.Str(reader, "mandateid");
            obj.Number = AdoConverters.Int(reader, "number");
            obj.State = AdoConverters.Enum<MandateRevisionStateEnum>(reader, "state", MandateRevisionStateEnum.Draft);
            obj.Objective = AdoConverters.Str(reader, "objective");
            obj.HealthyDefinition = AdoConverters.NullableStr(reader, "healthydefinition");
            obj.Autonomy = AdoConverters.NullableStr(reader, "autonomy");
            obj.EscalationPolicy = AdoConverters.NullableStr(reader, "escalationpolicy");
            obj.Direction = AdoConverters.NullableStr(reader, "direction");
            obj.WakeMode = AdoConverters.Enum<WakeModeEnum>(reader, "wakemode", WakeModeEnum.Backoff);
            obj.MinIntervalSeconds = AdoConverters.Int(reader, "minintervalseconds");
            obj.MaxIntervalSeconds = AdoConverters.Int(reader, "maxintervalseconds");
            obj.BackoffFactor = AdoConverters.Double(reader, "backofffactor");
            obj.JitterPercent = AdoConverters.NullableInt(reader, "jitterpercent");
            obj.BudgetPerTickUsd = AdoConverters.NullableDouble(reader, "budgetpertickusd");
            obj.BudgetPerDayUsd = AdoConverters.NullableDouble(reader, "budgetperdayusd");
            obj.MaxTokensPerTick = AdoConverters.NullableLong(reader, "maxtokenspertick");
            obj.EscalationTargetKind = AdoConverters.NullableEnum<EscalationTargetKindEnum>(reader, "escalationtargetkind");
            obj.EscalationTargetId = AdoConverters.NullableStr(reader, "escalationtargetid");
            obj.Source = AdoConverters.Enum<MandateRevisionSourceEnum>(reader, "source", MandateRevisionSourceEnum.Human);
            obj.Author = AdoConverters.NullableStr(reader, "author");
            obj.ChangeNote = AdoConverters.NullableStr(reader, "changenote");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.PublishedUtc = AdoConverters.NullableDate(reader, "publishedutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private async Task InsertSignalsAsync(DbConnection connection, DbTransaction transaction, MandateRevision obj, CancellationToken token)
        {
            for (int i = 0; i < obj.Signals.Count; i++)
            {
                MandateRevisionSignal signal = obj.Signals[i];
                signal.Order = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Signals + " (revisionid, tenantid, position, name, description) VALUES (@revisionid, @tenantid, @position, @name, @description);", command =>
                {
                    AdoDatabaseDriver.Add(command, "revisionid", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "position", i);
                    AdoDatabaseDriver.Add(command, "name", signal.Name);
                    AdoDatabaseDriver.Add(command, "description", signal.Description);
                }, token).ConfigureAwait(false);
            }
        }

        private async Task LoadSignalsAsync(List<MandateRevision> revisions, CancellationToken token)
        {
            if (revisions.Count == 0) return;
            Dictionary<string, MandateRevision> byId = revisions.ToDictionary(r => r.Id, StringComparer.Ordinal);
            List<string> names = new List<string>();
            for (int i = 0; i < revisions.Count; i++) names.Add("@r" + i);
            List<MandateRevisionSignalRow> rows = await _Driver.QueryAsync(
                "SELECT revisionid, position, name, description FROM " + _Signals + " WHERE tenantid = @tenantid AND revisionid IN (" + String.Join(", ", names) + ") ORDER BY revisionid, position;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", revisions[0].TenantId);
                    for (int i = 0; i < revisions.Count; i++) AdoDatabaseDriver.Add(command, "r" + i, revisions[i].Id);
                },
                reader => new MandateRevisionSignalRow
                {
                    RevisionId = AdoConverters.Str(reader, "revisionid"),
                    Signal = new MandateRevisionSignal
                    {
                        Name = AdoConverters.Str(reader, "name"),
                        Description = AdoConverters.NullableStr(reader, "description"),
                        Order = AdoConverters.Int(reader, "position")
                    }
                },
                token).ConfigureAwait(false);
            foreach (MandateRevisionSignalRow row in rows)
            {
                if (!byId.TryGetValue(row.RevisionId, out MandateRevision? revision)) continue;
                revision.Signals.Add(row.Signal);
            }
        }

        private static void Bind(DbCommand command, MandateRevision obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "mandateid", obj.MandateId);
            AdoDatabaseDriver.Add(command, "number", obj.Number);
            AdoDatabaseDriver.Add(command, "state", obj.State.ToString());
            AdoDatabaseDriver.Add(command, "objective", obj.Objective);
            AdoDatabaseDriver.Add(command, "healthydefinition", obj.HealthyDefinition);
            AdoDatabaseDriver.Add(command, "autonomy", obj.Autonomy);
            AdoDatabaseDriver.Add(command, "escalationpolicy", obj.EscalationPolicy);
            AdoDatabaseDriver.Add(command, "direction", obj.Direction);
            AdoDatabaseDriver.Add(command, "wakemode", obj.WakeMode.ToString());
            AdoDatabaseDriver.Add(command, "minintervalseconds", obj.MinIntervalSeconds);
            AdoDatabaseDriver.Add(command, "maxintervalseconds", obj.MaxIntervalSeconds);
            AdoDatabaseDriver.Add(command, "backofffactor", obj.BackoffFactor);
            AdoDatabaseDriver.Add(command, "jitterpercent", obj.JitterPercent);
            AdoDatabaseDriver.Add(command, "budgetpertickusd", obj.BudgetPerTickUsd);
            AdoDatabaseDriver.Add(command, "budgetperdayusd", obj.BudgetPerDayUsd);
            AdoDatabaseDriver.Add(command, "maxtokenspertick", obj.MaxTokensPerTick);
            AdoDatabaseDriver.Add(command, "escalationtargetkind", obj.EscalationTargetKind?.ToString());
            AdoDatabaseDriver.Add(command, "escalationtargetid", obj.EscalationTargetId);
            AdoDatabaseDriver.Add(command, "source", obj.Source.ToString());
            AdoDatabaseDriver.Add(command, "author", obj.Author);
            AdoDatabaseDriver.Add(command, "changenote", obj.ChangeNote);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "publishedutc", obj.PublishedUtc);
        }

        #endregion
    }
}
