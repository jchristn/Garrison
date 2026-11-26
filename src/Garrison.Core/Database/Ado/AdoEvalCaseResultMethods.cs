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
    /// Provider-neutral eval case result data access (AA9.2). Check results live in a child table keyed by result and
    /// position. Thread-safe.
    /// </summary>
    public class AdoEvalCaseResultMethods : IEvalCaseResultMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, evalrunid, caseid, resultorder, sourcerunid, runid, outputtext, score, passed, errormessage, costusd, createdutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Results;
        private readonly string _CheckResults;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoEvalCaseResultMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Results = driver.Table("eval_case_results");
            _CheckResults = driver.Table("eval_case_check_results");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<EvalCaseResult> CreateAsync(EvalCaseResult obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                List<string> existing = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT id FROM " + _Results + " WHERE tenantid = @tenantid AND evalrunid = @evalrunid AND resultorder = @resultorder;", command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "evalrunid", obj.EvalRunId);
                    AdoDatabaseDriver.Add(command, "resultorder", obj.Order);
                }, reader => AdoConverters.Str(reader, "id"), ct).ConfigureAwait(false);
                if (existing.Count > 0) throw new ConflictException("EvalResultExists", "Eval run " + obj.EvalRunId + " already has a result at order " + obj.Order.ToString(CultureInfo.InvariantCulture) + ".");
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Results + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), ct).ConfigureAwait(false);
                for (int i = 0; i < obj.CheckResults.Count; i++)
                {
                    EvalCaseCheckResult row = obj.CheckResults[i];
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _CheckResults + " (resultid, tenantid, position, scorer, weight, score, passed, judgerunid, note) VALUES (@resultid, @tenantid, @position, @scorer, @weight, @score, @passed, @judgerunid, @note);", command =>
                    {
                        AdoDatabaseDriver.Add(command, "resultid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", i);
                        AdoDatabaseDriver.Add(command, "scorer", row.Scorer.ToString());
                        AdoDatabaseDriver.Add(command, "weight", row.Weight);
                        AdoDatabaseDriver.Add(command, "score", row.Score);
                        AdoDatabaseDriver.Add(command, "passed", row.Passed);
                        AdoDatabaseDriver.Add(command, "judgerunid", row.JudgeRunId);
                        AdoDatabaseDriver.Add(command, "note", row.Note);
                    }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EvalCaseResult?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            };
            List<EvalCaseResult> found = await _Driver.QueryAsync("SELECT * FROM " + _Results + " WHERE id = @id AND tenantid = @tenantid;", bind, Map, token).ConfigureAwait(false);
            await LoadChecksAsync(found, "resultid = @id", bind, token).ConfigureAwait(false);
            return found.FirstOrDefault();
        }

        /// <inheritdoc />
        public async Task<EvalCaseResult?> ReadByOrderAsync(string tenantId, string evalRunId, int order, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(evalRunId)) throw new ArgumentNullException(nameof(evalRunId));
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "evalrunid", evalRunId);
                AdoDatabaseDriver.Add(command, "resultorder", order);
            };
            List<EvalCaseResult> found = await _Driver.QueryAsync("SELECT * FROM " + _Results + " WHERE tenantid = @tenantid AND evalrunid = @evalrunid AND resultorder = @resultorder;", bind, Map, token).ConfigureAwait(false);
            await LoadChecksAsync(found, "resultid IN (SELECT id FROM " + _Results + " WHERE tenantid = @tenantid AND evalrunid = @evalrunid AND resultorder = @resultorder)", bind, token).ConfigureAwait(false);
            return found.FirstOrDefault();
        }

        /// <inheritdoc />
        public async Task<List<EvalCaseResult>> ListByEvalRunAsync(string tenantId, string evalRunId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(evalRunId)) throw new ArgumentNullException(nameof(evalRunId));
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "evalrunid", evalRunId);
            };
            List<EvalCaseResult> results = await _Driver.QueryAsync("SELECT * FROM " + _Results + " WHERE tenantid = @tenantid AND evalrunid = @evalrunid ORDER BY resultorder ASC;", bind, Map, token).ConfigureAwait(false);
            await LoadChecksAsync(results, "resultid IN (SELECT id FROM " + _Results + " WHERE tenantid = @tenantid AND evalrunid = @evalrunid)", bind, token).ConfigureAwait(false);
            return results;
        }

        #endregion

        #region Private-Methods

        private static EvalCaseResult Map(DbDataReader reader)
        {
            EvalCaseResult obj = new EvalCaseResult();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.EvalRunId = AdoConverters.Str(reader, "evalrunid");
            obj.CaseId = AdoConverters.NullableStr(reader, "caseid");
            obj.Order = AdoConverters.Int(reader, "resultorder");
            obj.SourceRunId = AdoConverters.NullableStr(reader, "sourcerunid");
            obj.RunId = AdoConverters.NullableStr(reader, "runid");
            obj.OutputText = AdoConverters.NullableStr(reader, "outputtext");
            obj.Score = AdoConverters.Double(reader, "score");
            obj.Passed = AdoConverters.Bool(reader, "passed");
            obj.ErrorMessage = AdoConverters.NullableStr(reader, "errormessage");
            obj.CostUsd = AdoConverters.Double(reader, "costusd");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return obj;
        }

        private static void Bind(DbCommand command, EvalCaseResult obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "evalrunid", obj.EvalRunId);
            AdoDatabaseDriver.Add(command, "caseid", obj.CaseId);
            AdoDatabaseDriver.Add(command, "resultorder", obj.Order);
            AdoDatabaseDriver.Add(command, "sourcerunid", obj.SourceRunId);
            AdoDatabaseDriver.Add(command, "runid", obj.RunId);
            AdoDatabaseDriver.Add(command, "outputtext", obj.OutputText);
            AdoDatabaseDriver.Add(command, "score", obj.Score);
            AdoDatabaseDriver.Add(command, "passed", obj.Passed);
            AdoDatabaseDriver.Add(command, "errormessage", obj.ErrorMessage);
            AdoDatabaseDriver.Add(command, "costusd", obj.CostUsd);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
        }

        private async Task LoadChecksAsync(List<EvalCaseResult> results, string ownedClause, Action<DbCommand> bind, CancellationToken token)
        {
            if (results.Count == 0) return;
            Dictionary<string, EvalCaseResult> byId = results.ToDictionary(r => r.Id, StringComparer.Ordinal);
            List<EvalCaseCheckResultRow> rows = await _Driver.QueryAsync("SELECT resultid, scorer, weight, score, passed, judgerunid, note FROM " + _CheckResults + " WHERE tenantid = @tenantid AND " + ownedClause + " ORDER BY resultid, position;", bind, reader => new EvalCaseCheckResultRow
            {
                ResultId = AdoConverters.Str(reader, "resultid"),
                CheckResult = new EvalCaseCheckResult
                {
                    Scorer = AdoConverters.Enum(reader, "scorer", EvalScorerEnum.ExactMatch),
                    Weight = AdoConverters.Double(reader, "weight"),
                    Score = AdoConverters.Double(reader, "score"),
                    Passed = AdoConverters.Bool(reader, "passed"),
                    JudgeRunId = AdoConverters.NullableStr(reader, "judgerunid"),
                    Note = AdoConverters.NullableStr(reader, "note")
                }
            }, token).ConfigureAwait(false);
            foreach (EvalCaseCheckResultRow row in rows)
            {
                if (byId.TryGetValue(row.ResultId, out EvalCaseResult? owner)) owner.CheckResults.Add(row.CheckResult);
            }
        }

        #endregion
    }
}
