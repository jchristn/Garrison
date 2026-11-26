namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Provider-neutral eval set data access (AA9.2). Tags live in a child table keyed by set and position; reads add the
    /// version's case count. Updates and approvals are conditional on the Draft state, so an Approved version never
    /// changes. Thread-safe.
    /// </summary>
    public class AdoEvalSetMethods : IEvalSetMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, name, description, version, previousversionid, state, origin, approvedbyid, approvedbyname, approvedutc, authoringorgunitid, authoredbytype, authoredbyid, authoredbyname, authoredbyagentid, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly AdoEvalCaseMethods _CaseMethods;
        private readonly string _Sets;
        private readonly string _Tags;
        private readonly string _Cases;
        private readonly string _Select;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <param name="caseMethods">Case data access, used to write cases with a new version.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver or caseMethods is null.</exception>
        public AdoEvalSetMethods(AdoDatabaseDriver driver, AdoEvalCaseMethods caseMethods)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _CaseMethods = caseMethods ?? throw new ArgumentNullException(nameof(caseMethods));
            _Sets = driver.Table("eval_sets");
            _Tags = driver.Table("eval_set_tags");
            _Cases = driver.Table("eval_cases");
            _Select = "SELECT s.*, (SELECT COUNT(*) FROM " + _Cases + " c WHERE c.tenantid = s.tenantid AND c.setid = s.id) AS casecount FROM " + _Sets + " s";
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<EvalSet> CreateAsync(EvalSet obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            return await CreateWithCasesAsync(obj, new List<EvalCase>(), token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EvalSet> CreateWithCasesAsync(EvalSet obj, List<EvalCase> cases, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            if (cases == null) throw new ArgumentNullException(nameof(cases));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                List<string> existing = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT id FROM " + _Sets + " WHERE tenantid = @tenantid AND name = @name AND version = @version;", command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "name", obj.Name);
                    AdoDatabaseDriver.Add(command, "version", obj.Version);
                }, reader => AdoConverters.Str(reader, "id"), ct).ConfigureAwait(false);
                if (existing.Count > 0) throw new ConflictException("EvalSetVersionExists", "Eval set " + obj.Name + " already has version " + obj.Version.ToString(CultureInfo.InvariantCulture) + ".");
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Sets + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), ct).ConfigureAwait(false);
                await InsertTagsAsync(connection, transaction, obj, ct).ConfigureAwait(false);
                foreach (EvalCase item in cases)
                {
                    item.TenantId = obj.TenantId;
                    item.SetId = obj.Id;
                    await _CaseMethods.InsertAsync(connection, transaction, item, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            obj.CaseCount = cases.Count;
            return obj;
        }

        /// <inheritdoc />
        public async Task<EvalSet> UpdateAsync(EvalSet obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            DateTime now = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                List<string> states = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT state FROM " + _Sets + " WHERE id = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                }, reader => AdoConverters.Str(reader, "state"), ct).ConfigureAwait(false);
                if (states.Count == 0) throw new NotFoundException("Eval set " + obj.Id + " was not found.");
                if (!String.Equals(states[0], EvalSetStateEnum.Draft.ToString(), StringComparison.Ordinal))
                {
                    throw new ConflictException("EvalSetImmutable", "Eval set " + obj.Id + " is approved and cannot change; edit it to create the next version as a draft.");
                }
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Sets + " SET description = @description, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid AND state = @draft;",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "description", obj.Description);
                        AdoDatabaseDriver.Add(command, "lastupdateutc", now);
                        AdoDatabaseDriver.Add(command, "id", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "draft", EvalSetStateEnum.Draft.ToString());
                    }, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tags + " WHERE setid = @setid AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "setid", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                }, ct).ConfigureAwait(false);
                await InsertTagsAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            EvalSet? stored = await ReadAsync(obj.TenantId, obj.Id, token).ConfigureAwait(false);
            if (stored == null) throw new NotFoundException("Eval set " + obj.Id + " was not found.");
            return stored;
        }

        /// <inheritdoc />
        public async Task<bool> ApproveAsync(string tenantId, string id, string? approvedById, string? approvedByName, DateTime utc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Sets + " SET state = @approved, approvedbyid = @approvedbyid, approvedbyname = @approvedbyname, approvedutc = @approvedutc, lastupdateutc = @approvedutc WHERE id = @id AND tenantid = @tenantid AND state = @draft;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "approved", EvalSetStateEnum.Approved.ToString());
                    AdoDatabaseDriver.Add(command, "approvedbyid", approvedById);
                    AdoDatabaseDriver.Add(command, "approvedbyname", approvedByName);
                    AdoDatabaseDriver.Add(command, "approvedutc", utc);
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "draft", EvalSetStateEnum.Draft.ToString());
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<EvalSet?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await SingleAsync(" WHERE s.id = @id AND s.tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EvalSet?> ReadByNameAsync(string tenantId, string name, int version, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            return await SingleAsync(" WHERE s.tenantid = @tenantid AND s.name = @name AND s.version = @version;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "name", name);
                AdoDatabaseDriver.Add(command, "version", version);
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EvalSet?> ReadLatestAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            List<EvalSet> found = await ListAsync(" WHERE s.tenantid = @tenantid AND s.name = @name ORDER BY s.version DESC" + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "name", name);
                AdoDatabaseDriver.Add(command, "max", 1);
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, token).ConfigureAwait(false);
            return found.FirstOrDefault();
        }

        /// <inheritdoc />
        public async Task<EvalSet?> ReadLatestApprovedAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            List<EvalSet> found = await ListAsync(" WHERE s.tenantid = @tenantid AND s.name = @name AND s.state = @approved ORDER BY s.version DESC" + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "name", name);
                AdoDatabaseDriver.Add(command, "approved", EvalSetStateEnum.Approved.ToString());
                AdoDatabaseDriver.Add(command, "max", 1);
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, token).ConfigureAwait(false);
            return found.FirstOrDefault();
        }

        /// <inheritdoc />
        public async Task<List<EvalSet>> ListVersionsAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            return await ListAsync(" WHERE s.tenantid = @tenantid AND s.name = @name ORDER BY s.version ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "name", name);
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<EvalSet>> EnumerateAsync(string tenantId, EvalSetStateEnum? state, EvalSetOriginEnum? origin, string? tag, bool latestOnly, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "s.tenantid = @tenantid" };
            if (state.HasValue) clauses.Add("s.state = @state");
            if (origin.HasValue) clauses.Add("s.origin = @origin");
            if (!String.IsNullOrEmpty(tag)) clauses.Add("EXISTS (SELECT 1 FROM " + _Tags + " t WHERE t.tenantid = s.tenantid AND t.setid = s.id AND t.tag = @tag)");
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("s.name", "search"));
            if (latestOnly)
            {
                List<string> inner = new List<string> { "v.tenantid = s.tenantid", "v.name = s.name" };
                if (state.HasValue) inner.Add("v.state = @state");
                if (origin.HasValue) inner.Add("v.origin = @origin");
                clauses.Add("s.version = (SELECT MAX(v.version) FROM " + _Sets + " v WHERE " + String.Join(" AND ", inner) + ")");
            }
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (state.HasValue) AdoDatabaseDriver.Add(command, "state", state.Value.ToString());
                if (origin.HasValue) AdoDatabaseDriver.Add(command, "origin", origin.Value.ToString());
                if (!String.IsNullOrEmpty(tag)) AdoDatabaseDriver.Add(command, "tag", tag);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Sets + " s" + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue, CultureInfo.InvariantCulture);
            List<EvalSet> sets = await ListAsync(where + Order(query.Ordering) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, token).ConfigureAwait(false);
            return EnumerationResult<EvalSet>.Build(query, total, sets);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await _CaseMethods.DeleteForSetAsync(connection, transaction, tenantId, id, ct).ConfigureAwait(false);
                Action<DbCommand> bind = command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                };
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tags + " WHERE setid = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Sets + " WHERE id = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        #endregion

        #region Private-Methods

        private static string Order(EnumerationOrderEnum ordering)
        {
            switch (ordering)
            {
                case EnumerationOrderEnum.CreatedAscending:
                    return " ORDER BY s.createdutc ASC, s.id ASC";
                case EnumerationOrderEnum.NameAscending:
                    return " ORDER BY s.name ASC, s.version DESC";
                case EnumerationOrderEnum.NameDescending:
                    return " ORDER BY s.name DESC, s.version DESC";
                default:
                    return " ORDER BY s.createdutc DESC, s.id DESC";
            }
        }

        private static EvalSet Map(DbDataReader reader)
        {
            EvalSet obj = new EvalSet();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Version = AdoConverters.Int(reader, "version");
            obj.PreviousVersionId = AdoConverters.NullableStr(reader, "previousversionid");
            obj.State = AdoConverters.Enum(reader, "state", EvalSetStateEnum.Draft);
            obj.Origin = AdoConverters.Enum(reader, "origin", EvalSetOriginEnum.Human);
            obj.ApprovedById = AdoConverters.NullableStr(reader, "approvedbyid");
            obj.ApprovedByName = AdoConverters.NullableStr(reader, "approvedbyname");
            obj.ApprovedUtc = AdoConverters.NullableDate(reader, "approvedutc");
            obj.AuthoringOrgUnitId = AdoConverters.NullableStr(reader, "authoringorgunitid");
            obj.AuthoredByType = AdoConverters.Enum(reader, "authoredbytype", PrincipalTypeEnum.User);
            obj.AuthoredById = AdoConverters.NullableStr(reader, "authoredbyid");
            obj.AuthoredByName = AdoConverters.NullableStr(reader, "authoredbyname");
            obj.AuthoredByAgentId = AdoConverters.NullableStr(reader, "authoredbyagentid");
            obj.CaseCount = AdoConverters.Int(reader, "casecount");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        private static void Bind(DbCommand command, EvalSet obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "name", obj.Name);
            AdoDatabaseDriver.Add(command, "description", obj.Description);
            AdoDatabaseDriver.Add(command, "version", obj.Version);
            AdoDatabaseDriver.Add(command, "previousversionid", obj.PreviousVersionId);
            AdoDatabaseDriver.Add(command, "state", obj.State.ToString());
            AdoDatabaseDriver.Add(command, "origin", obj.Origin.ToString());
            AdoDatabaseDriver.Add(command, "approvedbyid", obj.ApprovedById);
            AdoDatabaseDriver.Add(command, "approvedbyname", obj.ApprovedByName);
            AdoDatabaseDriver.Add(command, "approvedutc", obj.ApprovedUtc);
            AdoDatabaseDriver.Add(command, "authoringorgunitid", obj.AuthoringOrgUnitId);
            AdoDatabaseDriver.Add(command, "authoredbytype", obj.AuthoredByType.ToString());
            AdoDatabaseDriver.Add(command, "authoredbyid", obj.AuthoredById);
            AdoDatabaseDriver.Add(command, "authoredbyname", obj.AuthoredByName);
            AdoDatabaseDriver.Add(command, "authoredbyagentid", obj.AuthoredByAgentId);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private async Task<EvalSet?> SingleAsync(string tail, Action<DbCommand> bind, CancellationToken token)
        {
            List<EvalSet> found = await ListAsync(tail, bind, token).ConfigureAwait(false);
            return found.FirstOrDefault();
        }

        private async Task<List<EvalSet>> ListAsync(string tail, Action<DbCommand> bind, CancellationToken token)
        {
            List<EvalSet> sets = await _Driver.QueryAsync(_Select + tail, bind, Map, token).ConfigureAwait(false);
            await LoadTagsAsync(sets, token).ConfigureAwait(false);
            return sets;
        }

        private async Task InsertTagsAsync(DbConnection connection, DbTransaction transaction, EvalSet obj, CancellationToken token)
        {
            for (int i = 0; i < obj.Tags.Count; i++)
            {
                string tag = obj.Tags[i];
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Tags + " (setid, tenantid, position, tag) VALUES (@setid, @tenantid, @position, @tag);", command =>
                {
                    AdoDatabaseDriver.Add(command, "setid", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "position", i);
                    AdoDatabaseDriver.Add(command, "tag", tag);
                }, token).ConfigureAwait(false);
            }
        }

        private async Task LoadTagsAsync(List<EvalSet> sets, CancellationToken token)
        {
            if (sets.Count == 0) return;
            Dictionary<string, EvalSet> byId = sets.ToDictionary(s => s.Id, StringComparer.Ordinal);
            for (int start = 0; start < sets.Count; start += 500)
            {
                List<EvalSet> chunk = sets.Skip(start).Take(500).ToList();
                List<string> names = new List<string>();
                for (int i = 0; i < chunk.Count; i++) names.Add("@s" + i.ToString(CultureInfo.InvariantCulture));
                List<EvalSetTagRow> rows = await _Driver.QueryAsync("SELECT setid, tag FROM " + _Tags + " WHERE tenantid = @tenantid AND setid IN (" + String.Join(", ", names) + ") ORDER BY setid, position;", command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", chunk[0].TenantId);
                    for (int i = 0; i < chunk.Count; i++) AdoDatabaseDriver.Add(command, "s" + i.ToString(CultureInfo.InvariantCulture), chunk[i].Id);
                }, reader => new EvalSetTagRow
                {
                    SetId = AdoConverters.Str(reader, "setid"),
                    Tag = AdoConverters.Str(reader, "tag")
                }, token).ConfigureAwait(false);
                foreach (EvalSetTagRow row in rows)
                {
                    if (byId.TryGetValue(row.SetId, out EvalSet? owner)) owner.Tags.Add(row.Tag);
                }
            }
        }

        #endregion
    }
}
