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
    using Garrison.Core.Requests;

    /// <summary>
    /// Provider-neutral pipeline run data access (P12.9). Pipeline run rows change only through compare-and-set updates
    /// on status and casVersion; stage executions are claimed with a compare-and-set on executions. Thread-safe.
    /// </summary>
    public class AdoPipelineRunMethods : IPipelineRunMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Stages;
        private readonly string _Parameters;
        private readonly string _Reviews;
        private readonly string _Runs;
        private static readonly string _Columns = "id, tenantid, pipelineid, pipelinename, pipelineversion, status, outcome, currentposition, stagecount, casversion, inputtext, inputcontenttype, callertype, callerid, callername, idempotencykey, priority, finalrunid, errormessage, deadlineutc, cancelrequested, traceparent, startedutc, completedutc, createdutc, lastupdateutc";
        private static readonly string _StageColumns = "id, pipelinerunid, tenantid, position, name, description, agentid, agentname, deploymentid, handofftemplateid, handofftemplateversion, outputcharlimit, maxattempts, continueonfailure, requiresreview, reviewtimeoutseconds, reviewtimeoutaction, maxrevisions, status, executions, attempts, revisions, currentrunid, lastrunid, blockedreason, nextattemptutc, startedutc, completedutc";
        private static readonly string _ActiveStatuses = "('Running', 'AwaitingReview', 'Cancelling')";
        private static readonly string _TerminalStatuses = "('Succeeded', 'Failed', 'Cancelled', 'TimedOut')";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoPipelineRunMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("pipeline_runs");
            _Stages = driver.Table("pipeline_run_stages");
            _Parameters = driver.Table("pipeline_run_stage_parameters");
            _Reviews = driver.Table("pipeline_reviews");
            _Runs = driver.Table("runs");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<PipelineRun> CreateAsync(PipelineRun obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            bool idempotent = !String.IsNullOrEmpty(obj.IdempotencyKey);
            string? lockSql = _Driver.Dialect.TransactionLockStatement();
            PipelineRun? existing = null;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                existing = null;
                if (idempotent)
                {
                    // Starts with one key can reach different replicas at the same moment; serialize them on the key so
                    // exactly one inserts and the others get its pipeline run.
                    if (lockSql != null)
                    {
                        long key = AdoDatabaseDriver.LockKey("pipeline-idempotency:" + _Table + ":" + obj.TenantId + ":" + (obj.CallerId ?? String.Empty) + ":" + obj.IdempotencyKey);
                        await AdoDatabaseDriver.ExecuteAsync(connection, transaction, lockSql, command => AdoDatabaseDriver.Add(command, "key", key), ct).ConfigureAwait(false);
                    }
                    List<PipelineRun> found = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                        "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND idempotencykey = @key AND " + (obj.CallerId == null ? "callerid IS NULL" : "callerid = @caller") + " ORDER BY createdutc DESC;",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                            AdoDatabaseDriver.Add(command, "key", obj.IdempotencyKey);
                            if (obj.CallerId != null) AdoDatabaseDriver.Add(command, "caller", obj.CallerId);
                        },
                        Map,
                        ct).ConfigureAwait(false);
                    if (found.Count > 0)
                    {
                        existing = found[0];
                        return;
                    }
                }

                string values = "@" + String.Join(", @", _Columns.Split(", "));
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), ct).ConfigureAwait(false);
                string stageValues = "@" + String.Join(", @", _StageColumns.Split(", "));
                foreach (PipelineRunStage stage in obj.Stages)
                {
                    stage.PipelineRunId = obj.Id;
                    stage.TenantId = obj.TenantId;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Stages + " (" + _StageColumns + ") VALUES (" + stageValues + ");", command => BindStage(command, stage), ct).ConfigureAwait(false);
                    for (int i = 0; i < stage.Parameters.Count; i++)
                    {
                        PipelineRunStageParameter parameter = stage.Parameters[i];
                        parameter.RunStageId = stage.Id;
                        parameter.TenantId = obj.TenantId;
                        await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                            "INSERT INTO " + _Parameters + " (id, runstageid, tenantid, position, name, value) VALUES (@id, @runstageid, @tenantid, @position, @name, @value);",
                            command =>
                            {
                                AdoDatabaseDriver.Add(command, "id", parameter.Id);
                                AdoDatabaseDriver.Add(command, "runstageid", parameter.RunStageId);
                                AdoDatabaseDriver.Add(command, "tenantid", parameter.TenantId);
                                AdoDatabaseDriver.Add(command, "position", i);
                                AdoDatabaseDriver.Add(command, "name", parameter.Name);
                                AdoDatabaseDriver.Add(command, "value", parameter.Value);
                            }, ct).ConfigureAwait(false);
                    }
                }
            }, token).ConfigureAwait(false);

            if (existing != null)
            {
                await LoadChildrenAsync(existing, token).ConfigureAwait(false);
                return existing;
            }
            return obj;
        }

        /// <inheritdoc />
        public async Task<PipelineRun?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            PipelineRun? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), Map, token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<PipelineRun?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            PipelineRun? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<PipelineRun?> ReadByIdempotencyKeyAsync(string tenantId, string? callerId, string idempotencyKey, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(idempotencyKey)) throw new ArgumentNullException(nameof(idempotencyKey));
            PipelineRun? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND idempotencykey = @key AND " + (callerId == null ? "callerid IS NULL" : "callerid = @caller") + " ORDER BY createdutc DESC;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "key", idempotencyKey);
                    if (callerId != null) AdoDatabaseDriver.Add(command, "caller", callerId);
                },
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<PipelineRun>> EnumerateAsync(PipelineRunFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(filter.TenantId)) clauses.Add("tenantid = @tenantid");
            if (!String.IsNullOrEmpty(filter.PipelineId)) clauses.Add("pipelineid = @pipelineid");
            if (filter.Status.HasValue) clauses.Add("status = @status");
            if (!String.IsNullOrEmpty(filter.CallerId)) clauses.Add("callerid = @callerid");
            if (filter.FromUtc.HasValue) clauses.Add("createdutc >= @fromutc");
            if (filter.ToUtc.HasValue) clauses.Add("createdutc < @toutc");
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;
            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(filter.TenantId)) AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (!String.IsNullOrEmpty(filter.PipelineId)) AdoDatabaseDriver.Add(command, "pipelineid", filter.PipelineId);
                if (filter.Status.HasValue) AdoDatabaseDriver.Add(command, "status", filter.Status.Value.ToString());
                if (!String.IsNullOrEmpty(filter.CallerId)) AdoDatabaseDriver.Add(command, "callerid", filter.CallerId);
                if (filter.FromUtc.HasValue) AdoDatabaseDriver.Add(command, "fromutc", filter.FromUtc.Value);
                if (filter.ToUtc.HasValue) AdoDatabaseDriver.Add(command, "toutc", filter.ToUtc.Value);
            };
            EnumerationQuery query = new EnumerationQuery();
            query.Skip = filter.Skip;
            query.MaxResults = filter.MaxResults;
            query.Ordering = filter.Ordering;
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<PipelineRun> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                    AdoDatabaseDriver.Add(command, "skip", query.Skip);
                },
                Map,
                token).ConfigureAwait(false);
            foreach (PipelineRun obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return EnumerationResult<PipelineRun>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<bool> TransitionAsync(PipelineRunTransition transition, CancellationToken token = default)
        {
            if (transition == null) throw new ArgumentNullException(nameof(transition));
            if (String.IsNullOrEmpty(transition.PipelineRunId)) throw new ArgumentNullException(nameof(transition), "A pipeline run identifier is required.");
            if (transition.FromStatuses.Count == 0) throw new ArgumentException("A pipeline run transition needs at least one source status.", nameof(transition));

            List<string> sets = new List<string> { "status = @tostatus", "casversion = casversion + 1", "lastupdateutc = @now" };
            if (transition.Outcome.HasValue) sets.Add("outcome = @outcome");
            if (transition.CurrentPosition.HasValue) sets.Add("currentposition = @position");
            if (transition.SetErrorMessage) sets.Add("errormessage = @errormessage");
            if (!String.IsNullOrEmpty(transition.FinalRunId)) sets.Add("finalrunid = @finalrunid");
            if (transition.SetCompleted) sets.Add("completedutc = @now");
            if (transition.ClearCompleted) sets.Add("completedutc = NULL");
            if (transition.SetDeadline) sets.Add("deadlineutc = @deadline");
            if (transition.CancelRequested.HasValue) sets.Add("cancelrequested = @cancel");

            List<string> from = new List<string>();
            for (int i = 0; i < transition.FromStatuses.Count; i++) from.Add("@from" + i);
            string sql = "UPDATE " + _Table + " SET " + String.Join(", ", sets) + " WHERE id = @id AND status IN (" + String.Join(", ", from) + ")" + (transition.ExpectedCasVersion.HasValue ? " AND casversion = @cas" : String.Empty) + ";";
            int affected = await _Driver.NonQueryAsync(sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", transition.PipelineRunId);
                AdoDatabaseDriver.Add(command, "tostatus", transition.ToStatus.ToString());
                AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                if (transition.Outcome.HasValue) AdoDatabaseDriver.Add(command, "outcome", transition.Outcome.Value.ToString());
                if (transition.CurrentPosition.HasValue) AdoDatabaseDriver.Add(command, "position", transition.CurrentPosition.Value);
                if (transition.SetErrorMessage) AdoDatabaseDriver.Add(command, "errormessage", transition.ErrorMessage);
                if (!String.IsNullOrEmpty(transition.FinalRunId)) AdoDatabaseDriver.Add(command, "finalrunid", transition.FinalRunId);
                if (transition.SetDeadline) AdoDatabaseDriver.Add(command, "deadline", transition.DeadlineUtc);
                if (transition.CancelRequested.HasValue) AdoDatabaseDriver.Add(command, "cancel", transition.CancelRequested.Value);
                for (int i = 0; i < transition.FromStatuses.Count; i++) AdoDatabaseDriver.Add(command, "from" + i, transition.FromStatuses[i].ToString());
                if (transition.ExpectedCasVersion.HasValue) AdoDatabaseDriver.Add(command, "cas", transition.ExpectedCasVersion.Value);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> ClaimExecutionAsync(PipelineStageClaim claim, CancellationToken token = default)
        {
            if (claim == null) throw new ArgumentNullException(nameof(claim));
            if (String.IsNullOrEmpty(claim.RunStageId)) throw new ArgumentNullException(nameof(claim), "A pipeline run stage identifier is required.");
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Stages + " SET executions = executions + 1, lastrunid = COALESCE(currentrunid, lastrunid), currentrunid = NULL, status = 'Running', attempts = @attempts, revisions = @revisions, blockedreason = @reason, nextattemptutc = @next, startedutc = COALESCE(startedutc, @now), completedutc = NULL WHERE id = @id AND executions = @executions;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", claim.RunStageId);
                    AdoDatabaseDriver.Add(command, "executions", claim.ExpectedExecutions);
                    AdoDatabaseDriver.Add(command, "attempts", Math.Max(1, claim.Attempts));
                    AdoDatabaseDriver.Add(command, "revisions", Math.Max(0, claim.Revisions));
                    AdoDatabaseDriver.Add(command, "reason", claim.BlockedReason);
                    AdoDatabaseDriver.Add(command, "next", claim.NextAttemptUtc);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> LinkRunAsync(string runStageId, int execution, string runId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runStageId)) throw new ArgumentNullException(nameof(runStageId));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Stages + " SET currentrunid = @runid, blockedreason = NULL, nextattemptutc = NULL WHERE id = @id AND executions = @execution AND currentrunid IS NULL;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", runStageId);
                    AdoDatabaseDriver.Add(command, "execution", execution);
                    AdoDatabaseDriver.Add(command, "runid", runId);
                },
                token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> BlockAsync(string runStageId, int execution, string reason, DateTime nextAttemptUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runStageId)) throw new ArgumentNullException(nameof(runStageId));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Stages + " SET blockedreason = @reason, nextattemptutc = @next WHERE id = @id AND executions = @execution AND currentrunid IS NULL;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", runStageId);
                    AdoDatabaseDriver.Add(command, "execution", execution);
                    AdoDatabaseDriver.Add(command, "reason", reason);
                    AdoDatabaseDriver.Add(command, "next", nextAttemptUtc);
                },
                token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> SetStageStatusAsync(string runStageId, int execution, PipelineStageStatusEnum status, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runStageId)) throw new ArgumentNullException(nameof(runStageId));
            bool finished = status == PipelineStageStatusEnum.Succeeded || status == PipelineStageStatusEnum.Failed || status == PipelineStageStatusEnum.Cancelled;
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Stages + " SET status = @status" + (finished ? ", completedutc = COALESCE(completedutc, @now)" : String.Empty) + " WHERE id = @id AND executions = @execution AND status <> @status;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", runStageId);
                    AdoDatabaseDriver.Add(command, "execution", execution);
                    AdoDatabaseDriver.Add(command, "status", status.ToString());
                    if (finished) AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<List<PipelineRun>> ListNeedingWorkAsync(DateTime nowUtc, string? afterId, int limit, CancellationToken token = default)
        {
            // Only active pipeline runs with something to do: a requested cancellation, a passed deadline, a current stage
            // that is missing, unclaimed, waiting for a due start, or whose run ended or vanished, and (for AwaitingReview)
            // no pending, unexpired review of the current stage execution. Runs parked on a live stage run or an open review
            // are skipped, so they never crowd out the ones that need work.
            string current = "s.pipelinerunid = p.id AND s.position = p.currentposition";
            string sql = "SELECT p.* FROM " + _Table + " p WHERE p.status IN " + _ActiveStatuses
                + (String.IsNullOrEmpty(afterId) ? String.Empty : " AND p.id > @after")
                + " AND ("
                + "p.status = 'Cancelling'"
                + " OR (p.deadlineutc IS NOT NULL AND p.deadlineutc <= @now)"
                + " OR NOT EXISTS (SELECT 1 FROM " + _Stages + " s WHERE " + current + ")"
                + " OR (p.status = 'Running' AND EXISTS (SELECT 1 FROM " + _Stages + " s WHERE " + current + " AND ("
                + "s.executions = 0"
                + " OR (s.currentrunid IS NULL AND (s.nextattemptutc IS NULL OR s.nextattemptutc <= @now))"
                + " OR (s.currentrunid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM " + _Runs + " r WHERE r.id = s.currentrunid AND r.status IN ('Pending', 'Queued', 'Leased', 'Running', 'Cancelling'))))))"
                + " OR (p.status = 'AwaitingReview' AND NOT EXISTS (SELECT 1 FROM " + _Stages + " s, " + _Reviews + " v WHERE " + current + " AND v.runstageid = s.id AND v.execution = s.executions AND v.status = 'Pending' AND (v.expiresutc IS NULL OR v.expiresutc > @now)))"
                + ") ORDER BY p.id ASC" + _Driver.Dialect.LimitOffsetClause() + ";";
            return await _Driver.QueryAsync(
                sql,
                command =>
                {
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    if (!String.IsNullOrEmpty(afterId)) AdoDatabaseDriver.Add(command, "after", afterId);
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 10000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<long> CountActiveAsync(string tenantId, string pipelineId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(pipelineId)) throw new ArgumentNullException(nameof(pipelineId));
            object? value = await _Driver.ScalarAsync(
                "SELECT COUNT(*) FROM " + _Table + " WHERE tenantid = @tenantid AND pipelineid = @pipelineid AND status IN " + _ActiveStatuses + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "pipelineid", pipelineId);
                },
                token).ConfigureAwait(false);
            return value == null ? 0 : Convert.ToInt64(value);
        }

        /// <inheritdoc />
        public async Task<List<string>> ListOrphanStageRunIdsAsync(int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT id FROM " + _Runs + " WHERE pipelinerunid IS NOT NULL AND status IN ('Pending', 'Queued', 'Leased', 'Running') AND pipelinerunid IN (SELECT id FROM " + _Table + " WHERE status IN " + _TerminalStatuses + ") ORDER BY createdutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 10000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                reader => AdoConverters.Str(reader, "id"),
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                affected = await DeleteOneAsync(connection, transaction, tenantId, id, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<int> PruneFinishedAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            List<PipelineRun> runs = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status IN " + _TerminalStatuses + " AND completedutc < @cutoff" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc);
                    AdoDatabaseDriver.Add(command, "max", 500);
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
            int deleted = 0;
            foreach (PipelineRun run in runs)
            {
                if (await DeleteAsync(run.TenantId, run.Id, token).ConfigureAwait(false)) deleted++;
            }
            return deleted;
        }

        /// <summary>
        /// Map a pipeline run row (stages not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static PipelineRun Map(DbDataReader reader)
        {
            PipelineRun obj = new PipelineRun();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.PipelineId = AdoConverters.Str(reader, "pipelineid");
            obj.PipelineName = AdoConverters.Str(reader, "pipelinename");
            obj.PipelineVersion = AdoConverters.Int(reader, "pipelineversion");
            obj.Status = AdoConverters.Enum<PipelineRunStatusEnum>(reader, "status", PipelineRunStatusEnum.Running);
            obj.Outcome = AdoConverters.Enum<PipelineRunOutcomeEnum>(reader, "outcome", PipelineRunOutcomeEnum.None);
            obj.CurrentPosition = AdoConverters.Int(reader, "currentposition");
            obj.StageCount = AdoConverters.Int(reader, "stagecount");
            obj.CasVersion = AdoConverters.Int(reader, "casversion");
            obj.InputText = AdoConverters.Str(reader, "inputtext");
            obj.InputContentType = AdoConverters.Str(reader, "inputcontenttype");
            obj.CallerType = AdoConverters.Enum<PrincipalTypeEnum>(reader, "callertype", PrincipalTypeEnum.User);
            obj.CallerId = AdoConverters.NullableStr(reader, "callerid");
            obj.CallerName = AdoConverters.NullableStr(reader, "callername");
            obj.IdempotencyKey = AdoConverters.NullableStr(reader, "idempotencykey");
            obj.Priority = AdoConverters.Int(reader, "priority");
            obj.FinalRunId = AdoConverters.NullableStr(reader, "finalrunid");
            obj.ErrorMessage = AdoConverters.NullableStr(reader, "errormessage");
            obj.DeadlineUtc = AdoConverters.NullableDate(reader, "deadlineutc");
            obj.CancelRequested = AdoConverters.Bool(reader, "cancelrequested");
            obj.TraceParent = AdoConverters.NullableStr(reader, "traceparent");
            obj.StartedUtc = AdoConverters.NullableDate(reader, "startedutc");
            obj.CompletedUtc = AdoConverters.NullableDate(reader, "completedutc");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private async Task<int> DeleteOneAsync(DbConnection connection, DbTransaction transaction, string tenantId, string id, CancellationToken token)
        {
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            };
            // The pipeline run row goes first and only while it is finished, so a retry that reopened it in the meantime
            // keeps the row and its children.
            int affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE tenantid = @tenantid AND id = @id AND status IN " + _TerminalStatuses + ";", bind, token).ConfigureAwait(false);
            if (affected == 0) return 0;
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Parameters + " WHERE tenantid = @tenantid AND runstageid IN (SELECT id FROM " + _Stages + " WHERE pipelinerunid = @id);", bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Stages + " WHERE tenantid = @tenantid AND pipelinerunid = @id;", bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Reviews + " WHERE tenantid = @tenantid AND pipelinerunid = @id;", bind, token).ConfigureAwait(false);
            return affected;
        }

        private static void Bind(DbCommand command, PipelineRun obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "pipelineid", obj.PipelineId);
            AdoDatabaseDriver.Add(command, "pipelinename", obj.PipelineName);
            AdoDatabaseDriver.Add(command, "pipelineversion", obj.PipelineVersion);
            AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
            AdoDatabaseDriver.Add(command, "outcome", obj.Outcome.ToString());
            AdoDatabaseDriver.Add(command, "currentposition", obj.CurrentPosition);
            AdoDatabaseDriver.Add(command, "stagecount", obj.StageCount);
            AdoDatabaseDriver.Add(command, "casversion", obj.CasVersion);
            AdoDatabaseDriver.Add(command, "inputtext", obj.InputText);
            AdoDatabaseDriver.Add(command, "inputcontenttype", obj.InputContentType);
            AdoDatabaseDriver.Add(command, "callertype", obj.CallerType.ToString());
            AdoDatabaseDriver.Add(command, "callerid", obj.CallerId);
            AdoDatabaseDriver.Add(command, "callername", Truncate(obj.CallerName, 256));
            AdoDatabaseDriver.Add(command, "idempotencykey", obj.IdempotencyKey);
            AdoDatabaseDriver.Add(command, "priority", obj.Priority);
            AdoDatabaseDriver.Add(command, "finalrunid", obj.FinalRunId);
            AdoDatabaseDriver.Add(command, "errormessage", obj.ErrorMessage);
            AdoDatabaseDriver.Add(command, "deadlineutc", obj.DeadlineUtc);
            AdoDatabaseDriver.Add(command, "cancelrequested", obj.CancelRequested);
            AdoDatabaseDriver.Add(command, "traceparent", Truncate(obj.TraceParent, 128));
            AdoDatabaseDriver.Add(command, "startedutc", obj.StartedUtc);
            AdoDatabaseDriver.Add(command, "completedutc", obj.CompletedUtc);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private static void BindStage(DbCommand command, PipelineRunStage stage)
        {
            AdoDatabaseDriver.Add(command, "id", stage.Id);
            AdoDatabaseDriver.Add(command, "pipelinerunid", stage.PipelineRunId);
            AdoDatabaseDriver.Add(command, "tenantid", stage.TenantId);
            AdoDatabaseDriver.Add(command, "position", stage.Position);
            AdoDatabaseDriver.Add(command, "name", stage.Name);
            AdoDatabaseDriver.Add(command, "description", stage.Description);
            AdoDatabaseDriver.Add(command, "agentid", stage.AgentId);
            AdoDatabaseDriver.Add(command, "agentname", Truncate(stage.AgentName, 256));
            AdoDatabaseDriver.Add(command, "deploymentid", stage.DeploymentId);
            AdoDatabaseDriver.Add(command, "handofftemplateid", stage.HandoffTemplateId);
            AdoDatabaseDriver.Add(command, "handofftemplateversion", stage.HandoffTemplateVersion);
            AdoDatabaseDriver.Add(command, "outputcharlimit", stage.OutputCharLimit);
            AdoDatabaseDriver.Add(command, "maxattempts", stage.MaxAttempts);
            AdoDatabaseDriver.Add(command, "continueonfailure", stage.ContinueOnFailure);
            AdoDatabaseDriver.Add(command, "requiresreview", stage.RequiresReview);
            AdoDatabaseDriver.Add(command, "reviewtimeoutseconds", stage.ReviewTimeoutSeconds);
            AdoDatabaseDriver.Add(command, "reviewtimeoutaction", stage.ReviewTimeoutAction.ToString());
            AdoDatabaseDriver.Add(command, "maxrevisions", stage.MaxRevisions);
            AdoDatabaseDriver.Add(command, "status", stage.Status.ToString());
            AdoDatabaseDriver.Add(command, "executions", stage.Executions);
            AdoDatabaseDriver.Add(command, "attempts", stage.Attempts);
            AdoDatabaseDriver.Add(command, "revisions", stage.Revisions);
            AdoDatabaseDriver.Add(command, "currentrunid", stage.CurrentRunId);
            AdoDatabaseDriver.Add(command, "lastrunid", stage.LastRunId);
            AdoDatabaseDriver.Add(command, "blockedreason", stage.BlockedReason);
            AdoDatabaseDriver.Add(command, "nextattemptutc", stage.NextAttemptUtc);
            AdoDatabaseDriver.Add(command, "startedutc", stage.StartedUtc);
            AdoDatabaseDriver.Add(command, "completedutc", stage.CompletedUtc);
        }

        private async Task LoadChildrenAsync(PipelineRun obj, CancellationToken token)
        {
            obj.Stages = await _Driver.QueryAsync("SELECT * FROM " + _Stages + " WHERE pipelinerunid = @id ORDER BY position ASC;", command => AdoDatabaseDriver.Add(command, "id", obj.Id), MapStage, token).ConfigureAwait(false);
            if (obj.Stages.Count == 0) return;
            List<PipelineRunStageParameter> parameters = await _Driver.QueryAsync(
                "SELECT * FROM " + _Parameters + " WHERE runstageid IN (SELECT id FROM " + _Stages + " WHERE pipelinerunid = @id) ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "id", obj.Id),
                reader => new PipelineRunStageParameter
                {
                    Id = AdoConverters.Str(reader, "id"),
                    RunStageId = AdoConverters.Str(reader, "runstageid"),
                    TenantId = AdoConverters.Str(reader, "tenantid"),
                    Name = AdoConverters.Str(reader, "name"),
                    Value = AdoConverters.Str(reader, "value")
                },
                token).ConfigureAwait(false);
            foreach (PipelineRunStage stage in obj.Stages) stage.Parameters = parameters.Where(p => p.RunStageId == stage.Id).ToList();
        }

        private static PipelineRunStage MapStage(DbDataReader reader)
        {
            PipelineRunStage stage = new PipelineRunStage();
            stage.Id = AdoConverters.Str(reader, "id");
            stage.PipelineRunId = AdoConverters.Str(reader, "pipelinerunid");
            stage.TenantId = AdoConverters.Str(reader, "tenantid");
            stage.Position = AdoConverters.Int(reader, "position");
            stage.Name = AdoConverters.Str(reader, "name");
            stage.Description = AdoConverters.NullableStr(reader, "description");
            stage.AgentId = AdoConverters.Str(reader, "agentid");
            stage.AgentName = AdoConverters.Str(reader, "agentname");
            stage.DeploymentId = AdoConverters.NullableStr(reader, "deploymentid");
            stage.HandoffTemplateId = AdoConverters.NullableStr(reader, "handofftemplateid");
            stage.HandoffTemplateVersion = AdoConverters.NullableInt(reader, "handofftemplateversion");
            stage.OutputCharLimit = AdoConverters.Int(reader, "outputcharlimit");
            stage.MaxAttempts = AdoConverters.Int(reader, "maxattempts");
            stage.ContinueOnFailure = AdoConverters.Bool(reader, "continueonfailure");
            stage.RequiresReview = AdoConverters.Bool(reader, "requiresreview");
            stage.ReviewTimeoutSeconds = AdoConverters.Int(reader, "reviewtimeoutseconds");
            stage.ReviewTimeoutAction = AdoConverters.Enum<PipelineReviewDecisionEnum>(reader, "reviewtimeoutaction", PipelineReviewDecisionEnum.Reject);
            stage.MaxRevisions = AdoConverters.Int(reader, "maxrevisions");
            stage.Status = AdoConverters.Enum<PipelineStageStatusEnum>(reader, "status", PipelineStageStatusEnum.Pending);
            stage.Executions = AdoConverters.Int(reader, "executions");
            stage.Attempts = AdoConverters.Int(reader, "attempts");
            stage.Revisions = AdoConverters.Int(reader, "revisions");
            stage.CurrentRunId = AdoConverters.NullableStr(reader, "currentrunid");
            stage.LastRunId = AdoConverters.NullableStr(reader, "lastrunid");
            stage.BlockedReason = AdoConverters.NullableStr(reader, "blockedreason");
            stage.NextAttemptUtc = AdoConverters.NullableDate(reader, "nextattemptutc");
            stage.StartedUtc = AdoConverters.NullableDate(reader, "startedutc");
            stage.CompletedUtc = AdoConverters.NullableDate(reader, "completedutc");
            return stage;
        }

        private static string? Truncate(string? value, int length)
        {
            if (value == null) return null;
            return value.Length > length ? value.Substring(0, length) : value;
        }

        #endregion
    }
}
