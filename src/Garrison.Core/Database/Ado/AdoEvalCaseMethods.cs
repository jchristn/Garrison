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
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Provider-neutral eval case data access (AA9.2). Checks and files live in child tables keyed by case and position.
    /// Mutations check the set's state in the same transaction and refuse Approved sets. Thread-safe.
    /// </summary>
    public class AdoEvalCaseMethods : IEvalCaseMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, setid, caseorder, name, inputtext, hidden, expectedtext, sourcerunid, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Sets;
        private readonly string _Cases;
        private readonly string _Checks;
        private readonly string _Files;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoEvalCaseMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Sets = driver.Table("eval_sets");
            _Cases = driver.Table("eval_cases");
            _Checks = driver.Table("eval_case_checks");
            _Files = driver.Table("eval_case_files");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<EvalCase> CreateAsync(EvalCase obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await RequireDraftSetAsync(connection, transaction, obj.TenantId, obj.SetId, ct).ConfigureAwait(false);
                await InsertAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EvalCase> UpdateAsync(EvalCase obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                string? setId = await SetOfCaseAsync(connection, transaction, obj.TenantId, obj.Id, ct).ConfigureAwait(false);
                if (setId == null) throw new NotFoundException("Eval case " + obj.Id + " was not found.");
                obj.SetId = setId;
                await RequireDraftSetAsync(connection, transaction, obj.TenantId, setId, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Cases + " SET caseorder = @caseorder, name = @name, inputtext = @inputtext, hidden = @hidden, expectedtext = @expectedtext, sourcerunid = @sourcerunid, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                    command => Bind(command, obj), ct).ConfigureAwait(false);
                await DeleteChildrenAsync(connection, transaction, obj.TenantId, obj.Id, ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EvalCase?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            EvalCase? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Cases + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj == null) return null;
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "caseid", id);
            };
            await LoadChildrenAsync(new List<EvalCase> { obj }, "caseid = @caseid", bind, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<List<EvalCase>> ListBySetAsync(string tenantId, string setId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(setId)) throw new ArgumentNullException(nameof(setId));
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "setid", setId);
            };
            List<EvalCase> cases = await _Driver.QueryAsync("SELECT * FROM " + _Cases + " WHERE tenantid = @tenantid AND setid = @setid ORDER BY caseorder ASC, id ASC;", bind, Map, token).ConfigureAwait(false);
            await LoadChildrenAsync(cases, "caseid IN (SELECT id FROM " + _Cases + " WHERE tenantid = @tenantid AND setid = @setid)", bind, token).ConfigureAwait(false);
            return cases;
        }

        /// <inheritdoc />
        public async Task<int> CountBySetAsync(string tenantId, string setId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(setId)) throw new ArgumentNullException(nameof(setId));
            object? value = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Cases + " WHERE tenantid = @tenantid AND setid = @setid;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "setid", setId);
            }, token).ConfigureAwait(false);
            return value == null ? 0 : Convert.ToInt32(value, CultureInfo.InvariantCulture);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                affected = 0;
                string? setId = await SetOfCaseAsync(connection, transaction, tenantId, id, ct).ConfigureAwait(false);
                if (setId == null) return;
                await RequireDraftSetAsync(connection, transaction, tenantId, setId, ct).ConfigureAwait(false);
                await DeleteChildrenAsync(connection, transaction, tenantId, id, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Cases + " WHERE id = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <summary>
        /// Insert a case row with its checks and files inside an open transaction, without checking the set's state. Used
        /// by <see cref="CreateAsync"/> and by the eval set methods when a new version is created with its cases.
        /// </summary>
        /// <param name="connection">Open connection.</param>
        /// <param name="transaction">Open transaction.</param>
        /// <param name="obj">Case.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task InsertAsync(DbConnection connection, DbTransaction transaction, EvalCase obj, CancellationToken token = default)
        {
            if (connection == null) throw new ArgumentNullException(nameof(connection));
            if (transaction == null) throw new ArgumentNullException(nameof(transaction));
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Cases + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), token).ConfigureAwait(false);
            await InsertChildrenAsync(connection, transaction, obj, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Delete every case of a set version with its checks and files inside an open transaction, without checking the
        /// set's state. Used when a set version is deleted.
        /// </summary>
        /// <param name="connection">Open connection.</param>
        /// <param name="transaction">Open transaction.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="setId">Set identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Cases deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task<int> DeleteForSetAsync(DbConnection connection, DbTransaction transaction, string tenantId, string setId, CancellationToken token = default)
        {
            if (connection == null) throw new ArgumentNullException(nameof(connection));
            if (transaction == null) throw new ArgumentNullException(nameof(transaction));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(setId)) throw new ArgumentNullException(nameof(setId));
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "setid", setId);
            };
            string owned = "caseid IN (SELECT id FROM " + _Cases + " WHERE tenantid = @tenantid AND setid = @setid)";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Checks + " WHERE tenantid = @tenantid AND " + owned + ";", bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Files + " WHERE tenantid = @tenantid AND " + owned + ";", bind, token).ConfigureAwait(false);
            return await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Cases + " WHERE tenantid = @tenantid AND setid = @setid;", bind, token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private static EvalCase Map(DbDataReader reader)
        {
            EvalCase obj = new EvalCase();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.SetId = AdoConverters.Str(reader, "setid");
            obj.Order = AdoConverters.Int(reader, "caseorder");
            obj.Name = AdoConverters.NullableStr(reader, "name");
            obj.InputText = AdoConverters.Str(reader, "inputtext");
            obj.Hidden = AdoConverters.Bool(reader, "hidden");
            obj.ExpectedText = AdoConverters.NullableStr(reader, "expectedtext");
            obj.SourceRunId = AdoConverters.NullableStr(reader, "sourcerunid");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        private static void Bind(DbCommand command, EvalCase obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "setid", obj.SetId);
            AdoDatabaseDriver.Add(command, "caseorder", obj.Order);
            AdoDatabaseDriver.Add(command, "name", obj.Name);
            AdoDatabaseDriver.Add(command, "inputtext", obj.InputText);
            AdoDatabaseDriver.Add(command, "hidden", obj.Hidden);
            AdoDatabaseDriver.Add(command, "expectedtext", obj.ExpectedText);
            AdoDatabaseDriver.Add(command, "sourcerunid", obj.SourceRunId);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private async Task RequireDraftSetAsync(DbConnection connection, DbTransaction transaction, string tenantId, string setId, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(setId)) throw new NotFoundException("The eval case names no eval set.");
            List<string> states = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT state FROM " + _Sets + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", setId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, reader => AdoConverters.Str(reader, "state"), token).ConfigureAwait(false);
            if (states.Count == 0) throw new NotFoundException("Eval set " + setId + " was not found.");
            if (!String.Equals(states[0], EvalSetStateEnum.Draft.ToString(), StringComparison.Ordinal))
            {
                throw new ConflictException("EvalSetImmutable", "Eval set " + setId + " is approved and cannot change; edit it to create the next version as a draft.");
            }
        }

        private async Task<string?> SetOfCaseAsync(DbConnection connection, DbTransaction transaction, string tenantId, string caseId, CancellationToken token)
        {
            List<string> sets = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT setid FROM " + _Cases + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", caseId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, reader => AdoConverters.Str(reader, "setid"), token).ConfigureAwait(false);
            return sets.Count > 0 ? sets[0] : null;
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, EvalCase obj, CancellationToken token)
        {
            for (int i = 0; i < obj.Checks.Count; i++)
            {
                EvalCaseCheck row = obj.Checks[i];
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Checks + " (caseid, tenantid, position, scorer, argument, weight) VALUES (@caseid, @tenantid, @position, @scorer, @argument, @weight);", command =>
                {
                    AdoDatabaseDriver.Add(command, "caseid", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "position", i);
                    AdoDatabaseDriver.Add(command, "scorer", row.Scorer.ToString());
                    AdoDatabaseDriver.Add(command, "argument", row.Argument);
                    AdoDatabaseDriver.Add(command, "weight", row.Weight);
                }, token).ConfigureAwait(false);
            }
            for (int i = 0; i < obj.Files.Count; i++)
            {
                EvalCaseFile row = obj.Files[i];
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Files + " (caseid, tenantid, position, path, mediatype, contenttext, assetid, assetpath) VALUES (@caseid, @tenantid, @position, @path, @mediatype, @contenttext, @assetid, @assetpath);", command =>
                {
                    AdoDatabaseDriver.Add(command, "caseid", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "position", i);
                    AdoDatabaseDriver.Add(command, "path", row.Path);
                    AdoDatabaseDriver.Add(command, "mediatype", row.MediaType);
                    AdoDatabaseDriver.Add(command, "contenttext", row.ContentText);
                    AdoDatabaseDriver.Add(command, "assetid", row.AssetId);
                    AdoDatabaseDriver.Add(command, "assetpath", row.AssetPath);
                }, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string tenantId, string caseId, CancellationToken token)
        {
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "caseid", caseId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            };
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Checks + " WHERE caseid = @caseid AND tenantid = @tenantid;", bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Files + " WHERE caseid = @caseid AND tenantid = @tenantid;", bind, token).ConfigureAwait(false);
        }

        private async Task LoadChildrenAsync(List<EvalCase> cases, string ownedClause, Action<DbCommand> bind, CancellationToken token)
        {
            if (cases.Count == 0) return;
            Dictionary<string, EvalCase> byId = cases.ToDictionary(c => c.Id, StringComparer.Ordinal);
            string within = " WHERE tenantid = @tenantid AND " + ownedClause + " ORDER BY caseid, position;";
            List<EvalCaseChildRow> checks = await _Driver.QueryAsync("SELECT caseid, scorer, argument, weight FROM " + _Checks + within, bind, reader => new EvalCaseChildRow
            {
                CaseId = AdoConverters.Str(reader, "caseid"),
                Check = new EvalCaseCheck
                {
                    Scorer = AdoConverters.Enum(reader, "scorer", EvalScorerEnum.ExactMatch),
                    Argument = AdoConverters.NullableStr(reader, "argument"),
                    Weight = AdoConverters.Double(reader, "weight")
                }
            }, token).ConfigureAwait(false);
            List<EvalCaseChildRow> files = await _Driver.QueryAsync("SELECT caseid, path, mediatype, contenttext, assetid, assetpath FROM " + _Files + within, bind, reader => new EvalCaseChildRow
            {
                CaseId = AdoConverters.Str(reader, "caseid"),
                File = new EvalCaseFile
                {
                    Path = AdoConverters.Str(reader, "path"),
                    MediaType = AdoConverters.NullableStr(reader, "mediatype"),
                    ContentText = AdoConverters.NullableStr(reader, "contenttext"),
                    AssetId = AdoConverters.NullableStr(reader, "assetid"),
                    AssetPath = AdoConverters.NullableStr(reader, "assetpath")
                }
            }, token).ConfigureAwait(false);
            foreach (EvalCaseChildRow row in checks)
            {
                if (row.Check != null && byId.TryGetValue(row.CaseId, out EvalCase? owner)) owner.Checks.Add(row.Check);
            }
            foreach (EvalCaseChildRow row in files)
            {
                if (row.File != null && byId.TryGetValue(row.CaseId, out EvalCase? owner)) owner.Files.Add(row.File);
            }
        }

        #endregion
    }
}
