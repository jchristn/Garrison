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

    /// <summary>
    /// Provider-neutral freeze data access (AA3). Thread-safe.
    /// </summary>
    public class AdoFreezeMethods : IFreezeMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, targetkind, targetid, targetname, reason, cancelactiveruns, cancelledruncount, createdbyid, createdbyname, liftedbyid, liftedbyname, liftreason, liftedutc, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoFreezeMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("freezes");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Freeze> CreateAsync(Freeze obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            DateTime now = DateTime.UtcNow;
            obj.CreatedUtc = now;
            obj.LastUpdateUtc = now;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.NonQueryAsync("INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Freeze?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Freeze>> EnumerateAsync(FreezeFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            if (String.IsNullOrEmpty(filter.TenantId)) throw new ArgumentNullException(nameof(filter.TenantId));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (filter.TargetKind.HasValue) clauses.Add("targetkind = @targetkind");
            if (!String.IsNullOrEmpty(filter.TargetId)) clauses.Add("targetid = @targetid");
            if (filter.Active.HasValue) clauses.Add(filter.Active.Value ? "liftedutc IS NULL" : "liftedutc IS NOT NULL");
            if (filter.WithinTargetIds != null) clauses.Add(filter.WithinTargetIds.Count == 0 ? "1 = 0" : AdoInList.Clause("targetid", "within", filter.WithinTargetIds.Count));
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (filter.TargetKind.HasValue) AdoDatabaseDriver.Add(command, "targetkind", filter.TargetKind.Value.ToString());
                if (!String.IsNullOrEmpty(filter.TargetId)) AdoDatabaseDriver.Add(command, "targetid", filter.TargetId);
                if (filter.WithinTargetIds != null && filter.WithinTargetIds.Count > 0) AdoInList.Bind(command, "within", filter.WithinTargetIds);
            };
            EnumerationQuery query = new EnumerationQuery { MaxResults = filter.MaxResults, Skip = Math.Max(0, filter.Skip) };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<Freeze> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + where + " ORDER BY CASE WHEN liftedutc IS NULL THEN 0 ELSE 1 END, createdutc DESC, id DESC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                    AdoDatabaseDriver.Add(command, "skip", query.Skip);
                }, Map, token).ConfigureAwait(false);
            return EnumerationResult<Freeze>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<List<Freeze>> ListActiveAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            return await _Driver.QueryAsync("SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND liftedutc IS NULL ORDER BY createdutc ASC, id ASC;",
                command => AdoDatabaseDriver.Add(command, "tenantid", tenantId), Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<Freeze?> ReadActiveAsync(string tenantId, FreezeTargetKindEnum targetKind, string targetId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(targetId)) throw new ArgumentNullException(nameof(targetId));
            List<Freeze> rows = await _Driver.QueryAsync("SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND targetkind = @targetkind AND targetid = @targetid AND liftedutc IS NULL ORDER BY createdutc ASC, id ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "targetkind", targetKind.ToString());
                AdoDatabaseDriver.Add(command, "targetid", targetId);
            }, Map, token).ConfigureAwait(false);
            return rows.Count > 0 ? rows[0] : null;
        }

        /// <inheritdoc />
        public async Task<bool> TryLiftAsync(Freeze obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            if (!obj.LiftedUtc.HasValue) obj.LiftedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.LiftedUtc.Value;
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET liftedbyid = @liftedbyid, liftedbyname = @liftedbyname, liftreason = @liftreason, liftedutc = @liftedutc, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid AND liftedutc IS NULL;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "liftedbyid", obj.LiftedById);
                    AdoDatabaseDriver.Add(command, "liftedbyname", obj.LiftedByName);
                    AdoDatabaseDriver.Add(command, "liftreason", obj.LiftReason);
                    AdoDatabaseDriver.Add(command, "liftedutc", obj.LiftedUtc);
                    AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task SetCancelledRunCountAsync(string tenantId, string id, int count, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            await _Driver.NonQueryAsync("UPDATE " + _Table + " SET cancelledruncount = @count WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "count", Math.Max(0, count));
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Freeze>> ListChangedAsync(string tenantId, DateTime afterUtc, string afterId, int limit, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND (lastupdateutc > @after OR (lastupdateutc = @after AND id > @afterid)) ORDER BY lastupdateutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "after", afterUtc);
                    AdoDatabaseDriver.Add(command, "afterid", afterId ?? String.Empty);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map a freezes row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>Freeze.</returns>
        public static Freeze Map(DbDataReader reader)
        {
            Freeze obj = new Freeze();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.TargetKind = AdoConverters.Enum<FreezeTargetKindEnum>(reader, "targetkind", FreezeTargetKindEnum.Agent);
            obj.TargetId = AdoConverters.Str(reader, "targetid");
            obj.TargetName = AdoConverters.NullableStr(reader, "targetname");
            obj.Reason = AdoConverters.NullableStr(reader, "reason");
            obj.CancelActiveRuns = AdoConverters.Bool(reader, "cancelactiveruns");
            obj.CancelledRunCount = AdoConverters.Int(reader, "cancelledruncount");
            obj.CreatedById = AdoConverters.NullableStr(reader, "createdbyid");
            obj.CreatedByName = AdoConverters.NullableStr(reader, "createdbyname");
            obj.LiftedById = AdoConverters.NullableStr(reader, "liftedbyid");
            obj.LiftedByName = AdoConverters.NullableStr(reader, "liftedbyname");
            obj.LiftReason = AdoConverters.NullableStr(reader, "liftreason");
            obj.LiftedUtc = AdoConverters.NullableDate(reader, "liftedutc");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, Freeze obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "targetkind", obj.TargetKind.ToString());
            AdoDatabaseDriver.Add(command, "targetid", obj.TargetId);
            AdoDatabaseDriver.Add(command, "targetname", obj.TargetName);
            AdoDatabaseDriver.Add(command, "reason", obj.Reason);
            AdoDatabaseDriver.Add(command, "cancelactiveruns", obj.CancelActiveRuns);
            AdoDatabaseDriver.Add(command, "cancelledruncount", obj.CancelledRunCount);
            AdoDatabaseDriver.Add(command, "createdbyid", obj.CreatedById);
            AdoDatabaseDriver.Add(command, "createdbyname", obj.CreatedByName);
            AdoDatabaseDriver.Add(command, "liftedbyid", obj.LiftedById);
            AdoDatabaseDriver.Add(command, "liftedbyname", obj.LiftedByName);
            AdoDatabaseDriver.Add(command, "liftreason", obj.LiftReason);
            AdoDatabaseDriver.Add(command, "liftedutc", obj.LiftedUtc);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        #endregion
    }
}
