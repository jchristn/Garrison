namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Globalization;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral eval run data access (AA9.2). Thread-safe.
    /// </summary>
    public class AdoEvalRunMethods : IEvalRunMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, setid, setname, setversion, targettype, agentid, agentrevisionid, deploymentid, studiodraftid, status, inputmode, recentinputcount, score, threshold, passed, budgetusd, costusd, totalcases, completedcases, passedcases, erroredcases, failurereason, startedbytype, startedbyid, startedbyname, originrunid, triggerid, judgeagentid, createdutc, startedutc, completedutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Runs;
        private readonly string _Results;
        private readonly string _CheckResults;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoEvalRunMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Runs = driver.Table("eval_runs");
            _Results = driver.Table("eval_case_results");
            _CheckResults = driver.Table("eval_case_check_results");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<EvalRun> CreateAsync(EvalRun obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.NonQueryAsync("INSERT INTO " + _Runs + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EvalRun?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Runs + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EvalRun> UpdateAsync(EvalRun obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.NonQueryAsync(
                "UPDATE " + _Runs + " SET status = @status, totalcases = @totalcases, completedcases = @completedcases, passedcases = @passedcases, erroredcases = @erroredcases, costusd = @costusd, score = @score, passed = @passed, failurereason = @failurereason, startedutc = @startedutc, completedutc = @completedutc, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> TransitionAsync(string tenantId, string id, EvalRunStatusEnum expected, EvalRunStatusEnum next, string? failureReason, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            DateTime now = DateTime.UtcNow;
            bool terminal = next == EvalRunStatusEnum.Completed || next == EvalRunStatusEnum.Failed || next == EvalRunStatusEnum.Cancelled;
            List<string> sets = new List<string> { "status = @next", "lastupdateutc = @now" };
            if (next == EvalRunStatusEnum.Running) sets.Add("startedutc = COALESCE(startedutc, @now)");
            if (terminal) sets.Add("completedutc = @now");
            if (failureReason != null) sets.Add("failurereason = @failurereason");
            int affected = await _Driver.NonQueryAsync("UPDATE " + _Runs + " SET " + String.Join(", ", sets) + " WHERE id = @id AND tenantid = @tenantid AND status = @expected;", command =>
            {
                AdoDatabaseDriver.Add(command, "next", next.ToString());
                AdoDatabaseDriver.Add(command, "now", now);
                if (failureReason != null) AdoDatabaseDriver.Add(command, "failurereason", failureReason);
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "expected", expected.ToString());
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> RecordCaseAsync(string tenantId, string id, bool passed, bool errored, double costUsd, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (costUsd < 0 || Double.IsNaN(costUsd)) throw new ArgumentOutOfRangeException(nameof(costUsd), "Cost must be 0 or more.");
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Runs + " SET completedcases = completedcases + 1, passedcases = passedcases + @passed, erroredcases = erroredcases + @errored, costusd = costusd + @cost, lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "passed", passed ? 1 : 0);
                    AdoDatabaseDriver.Add(command, "errored", errored ? 1 : 0);
                    AdoDatabaseDriver.Add(command, "cost", costUsd);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<EvalRun>> EnumerateAsync(string tenantId, string? setId, string? deploymentId, string? agentRevisionId, EvalRunStatusEnum? status, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(setId)) clauses.Add("setid = @setid");
            if (!String.IsNullOrEmpty(deploymentId)) clauses.Add("deploymentid = @deploymentid");
            if (!String.IsNullOrEmpty(agentRevisionId)) clauses.Add("agentrevisionid = @agentrevisionid");
            if (status.HasValue) clauses.Add("status = @status");
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(setId)) AdoDatabaseDriver.Add(command, "setid", setId);
                if (!String.IsNullOrEmpty(deploymentId)) AdoDatabaseDriver.Add(command, "deploymentid", deploymentId);
                if (!String.IsNullOrEmpty(agentRevisionId)) AdoDatabaseDriver.Add(command, "agentrevisionid", agentRevisionId);
                if (status.HasValue) AdoDatabaseDriver.Add(command, "status", status.Value.ToString());
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Runs + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue, CultureInfo.InvariantCulture);
            List<EvalRun> runs = await _Driver.QueryAsync("SELECT * FROM " + _Runs + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            return EnumerationResult<EvalRun>.Build(query, total, runs);
        }

        /// <inheritdoc />
        public async Task<List<EvalRun>> ListForDraftAsync(string tenantId, string studioDraftId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(studioDraftId)) throw new ArgumentNullException(nameof(studioDraftId));
            return await _Driver.QueryAsync("SELECT * FROM " + _Runs + " WHERE tenantid = @tenantid AND studiodraftid = @studiodraftid ORDER BY createdutc DESC, id DESC;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "studiodraftid", studioDraftId);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<EvalRun>> ListCompletedForDeploymentsAsync(string tenantId, List<string> deploymentIds, DateTime fromUtc, DateTime toUtc, int limit, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (deploymentIds == null) throw new ArgumentNullException(nameof(deploymentIds));
            if (deploymentIds.Count == 0) return new List<EvalRun>();
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Runs + " WHERE tenantid = @tenantid AND " + AdoInList.Clause("deploymentid", "d", deploymentIds.Count) +
                " AND status = 'Completed' AND createdutc >= @fromutc AND createdutc < @toutc ORDER BY createdutc DESC, id DESC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoInList.Bind(command, "d", deploymentIds);
                    AdoDatabaseDriver.Add(command, "fromutc", fromUtc);
                    AdoDatabaseDriver.Add(command, "toutc", toUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EvalRun?> ReadLatestByTriggerAsync(string tenantId, string triggerId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(triggerId)) throw new ArgumentNullException(nameof(triggerId));
            List<EvalRun> rows = await _Driver.QueryAsync(
                "SELECT * FROM " + _Runs + " WHERE tenantid = @tenantid AND triggerid = @triggerid ORDER BY createdutc DESC, id DESC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "triggerid", triggerId);
                    AdoDatabaseDriver.Add(command, "max", 1);
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
            return rows.Count > 0 ? rows[0] : null;
        }

        /// <inheritdoc />
        public async Task<List<EvalRun>> ListActiveAsync(int maxResults, CancellationToken token = default)
        {
            int max = Math.Clamp(maxResults, 1, 10000);
            return await _Driver.QueryAsync("SELECT * FROM " + _Runs + " WHERE status IN (@pending, @running) ORDER BY createdutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                AdoDatabaseDriver.Add(command, "pending", EvalRunStatusEnum.Pending.ToString());
                AdoDatabaseDriver.Add(command, "running", EvalRunStatusEnum.Running.ToString());
                AdoDatabaseDriver.Add(command, "max", max);
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                Action<DbCommand> bind = command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                };
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _CheckResults + " WHERE tenantid = @tenantid AND resultid IN (SELECT id FROM " + _Results + " WHERE tenantid = @tenantid AND evalrunid = @id);", bind, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Results + " WHERE tenantid = @tenantid AND evalrunid = @id;", bind, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Runs + " WHERE id = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        #endregion

        #region Private-Methods

        private static EvalRun Map(DbDataReader reader)
        {
            EvalRun obj = new EvalRun();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.SetId = AdoConverters.Str(reader, "setid");
            obj.SetName = AdoConverters.Str(reader, "setname");
            obj.SetVersion = AdoConverters.Int(reader, "setversion");
            obj.TargetType = AdoConverters.Enum(reader, "targettype", EvalRunTargetEnum.Deployment);
            obj.AgentId = AdoConverters.NullableStr(reader, "agentid");
            obj.AgentRevisionId = AdoConverters.NullableStr(reader, "agentrevisionid");
            obj.DeploymentId = AdoConverters.NullableStr(reader, "deploymentid");
            obj.StudioDraftId = AdoConverters.NullableStr(reader, "studiodraftid");
            obj.Status = AdoConverters.Enum(reader, "status", EvalRunStatusEnum.Pending);
            obj.InputMode = AdoConverters.Enum(reader, "inputmode", EvalRunInputModeEnum.Cases);
            obj.RecentInputCount = AdoConverters.Int(reader, "recentinputcount");
            obj.Score = AdoConverters.NullableDouble(reader, "score");
            obj.Threshold = AdoConverters.NullableDouble(reader, "threshold");
            obj.Passed = AdoConverters.NullableBool(reader, "passed");
            obj.BudgetUsd = AdoConverters.NullableDouble(reader, "budgetusd");
            obj.CostUsd = AdoConverters.Double(reader, "costusd");
            obj.TotalCases = AdoConverters.Int(reader, "totalcases");
            obj.CompletedCases = AdoConverters.Int(reader, "completedcases");
            obj.PassedCases = AdoConverters.Int(reader, "passedcases");
            obj.ErroredCases = AdoConverters.Int(reader, "erroredcases");
            obj.FailureReason = AdoConverters.NullableStr(reader, "failurereason");
            obj.StartedByType = AdoConverters.Enum(reader, "startedbytype", PrincipalTypeEnum.User);
            obj.StartedById = AdoConverters.NullableStr(reader, "startedbyid");
            obj.StartedByName = AdoConverters.NullableStr(reader, "startedbyname");
            obj.OriginRunId = AdoConverters.NullableStr(reader, "originrunid");
            obj.TriggerId = AdoConverters.NullableStr(reader, "triggerid");
            obj.JudgeAgentId = AdoConverters.NullableStr(reader, "judgeagentid");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.StartedUtc = AdoConverters.NullableDate(reader, "startedutc");
            obj.CompletedUtc = AdoConverters.NullableDate(reader, "completedutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        private static void Bind(DbCommand command, EvalRun obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "setid", obj.SetId);
            AdoDatabaseDriver.Add(command, "setname", obj.SetName);
            AdoDatabaseDriver.Add(command, "setversion", obj.SetVersion);
            AdoDatabaseDriver.Add(command, "targettype", obj.TargetType.ToString());
            AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
            AdoDatabaseDriver.Add(command, "agentrevisionid", obj.AgentRevisionId);
            AdoDatabaseDriver.Add(command, "deploymentid", obj.DeploymentId);
            AdoDatabaseDriver.Add(command, "studiodraftid", obj.StudioDraftId);
            AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
            AdoDatabaseDriver.Add(command, "inputmode", obj.InputMode.ToString());
            AdoDatabaseDriver.Add(command, "recentinputcount", obj.RecentInputCount);
            AdoDatabaseDriver.Add(command, "score", obj.Score);
            AdoDatabaseDriver.Add(command, "threshold", obj.Threshold);
            AdoDatabaseDriver.Add(command, "passed", obj.Passed);
            AdoDatabaseDriver.Add(command, "budgetusd", obj.BudgetUsd);
            AdoDatabaseDriver.Add(command, "costusd", obj.CostUsd);
            AdoDatabaseDriver.Add(command, "totalcases", obj.TotalCases);
            AdoDatabaseDriver.Add(command, "completedcases", obj.CompletedCases);
            AdoDatabaseDriver.Add(command, "passedcases", obj.PassedCases);
            AdoDatabaseDriver.Add(command, "erroredcases", obj.ErroredCases);
            AdoDatabaseDriver.Add(command, "failurereason", obj.FailureReason);
            AdoDatabaseDriver.Add(command, "startedbytype", obj.StartedByType.ToString());
            AdoDatabaseDriver.Add(command, "startedbyid", obj.StartedById);
            AdoDatabaseDriver.Add(command, "startedbyname", obj.StartedByName);
            AdoDatabaseDriver.Add(command, "originrunid", obj.OriginRunId);
            AdoDatabaseDriver.Add(command, "triggerid", obj.TriggerId);
            AdoDatabaseDriver.Add(command, "judgeagentid", obj.JudgeAgentId);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "startedutc", obj.StartedUtc);
            AdoDatabaseDriver.Add(command, "completedutc", obj.CompletedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        #endregion
    }
}
