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
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;

    /// <summary>
    /// Provider-neutral Run data access. Thread-safe.
    /// </summary>
    public class AdoRunMethods : IRunMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _ParametersTable;
        private readonly string _RequirementsTable;
        private readonly string _TemplateVersionsTable;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoRunMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("runs");
            _ParametersTable = driver.Table("run_parameters");
            _RequirementsTable = driver.Table("run_requirements");
            _TemplateVersionsTable = driver.Table("run_template_versions");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Run> CreateAsync(Run obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await InsertRowAsync(connection, transaction, obj, ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<Run?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            Run? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Run?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            Run? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Run> UpdateAsync(Run obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, agentid = @agentid, agentname = @agentname, deploymentid = @deploymentid, deploymentversion = @deploymentversion, harnesstype = @harnesstype, nodepoolid = @nodepoolid, kind = @kind, status = @status, outcome = @outcome, priority = @priority, inputtext = @inputtext, inputcontenttype = @inputcontenttype, callertype = @callertype, callerid = @callerid, callername = @callername, parentrunid = @parentrunid, rootrunid = @rootrunid, depth = @depth, callchain = @callchain, idempotencykey = @idempotencykey, retryofrunid = @retryofrunid, attempt = @attempt, maxattempts = @maxattempts, leasenodeid = @leasenodeid, leasenodename = @leasenodename, leaseepoch = @leaseepoch, leaseexpiresutc = @leaseexpiresutc, queuedutc = @queuedutc, leasedutc = @leasedutc, startedutc = @startedutc, completedutc = @completedutc, deadlineutc = @deadlineutc, cancelrequested = @cancelrequested, resulttext = @resulttext, structuredoutputjson = @structuredoutputjson, sessionid = @sessionid, servedmodel = @servedmodel, exitcode = @exitcode, stderrtail = @stderrtail, errormessage = @errormessage, inputtokens = @inputtokens, outputtokens = @outputtokens, cachedtokens = @cachedtokens, costusd = @costusd, costestimated = @costestimated, reasoningtokens = @reasoningtokens, toolcallcount = @toolcallcount, firsttokenutc = @firsttokenutc, lasttokenutc = @lasttokenutc, ttftms = @ttftms, streamingms = @streamingms, executionms = @executionms, queuems = @queuems, totalms = @totalms, lasteventsequence = @lasteventsequence, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
                    AdoDatabaseDriver.Add(command, "agentname", obj.AgentName);
                    AdoDatabaseDriver.Add(command, "deploymentid", obj.DeploymentId);
                    AdoDatabaseDriver.Add(command, "deploymentversion", obj.DeploymentVersion);
                    AdoDatabaseDriver.Add(command, "harnesstype", obj.HarnessType.ToString());
                    AdoDatabaseDriver.Add(command, "nodepoolid", obj.NodePoolId);
                    AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
                    AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
                    AdoDatabaseDriver.Add(command, "outcome", obj.Outcome.ToString());
                    AdoDatabaseDriver.Add(command, "priority", obj.Priority);
                    AdoDatabaseDriver.Add(command, "inputtext", obj.InputText);
                    AdoDatabaseDriver.Add(command, "inputcontenttype", obj.InputContentType);
                    AdoDatabaseDriver.Add(command, "callertype", obj.CallerType.ToString());
                    AdoDatabaseDriver.Add(command, "callerid", obj.CallerId);
                    AdoDatabaseDriver.Add(command, "callername", obj.CallerName);
                    AdoDatabaseDriver.Add(command, "parentrunid", obj.ParentRunId);
                    AdoDatabaseDriver.Add(command, "rootrunid", obj.RootRunId);
                    AdoDatabaseDriver.Add(command, "depth", obj.Depth);
                    AdoDatabaseDriver.Add(command, "callchain", obj.CallChain);
                    AdoDatabaseDriver.Add(command, "idempotencykey", obj.IdempotencyKey);
                    AdoDatabaseDriver.Add(command, "retryofrunid", obj.RetryOfRunId);
                    AdoDatabaseDriver.Add(command, "attempt", obj.Attempt);
                    AdoDatabaseDriver.Add(command, "maxattempts", obj.MaxAttempts);
                    AdoDatabaseDriver.Add(command, "leasenodeid", obj.LeaseNodeId);
                    AdoDatabaseDriver.Add(command, "leasenodename", obj.LeaseNodeName);
                    AdoDatabaseDriver.Add(command, "leaseepoch", obj.LeaseEpoch);
                    AdoDatabaseDriver.Add(command, "leaseexpiresutc", obj.LeaseExpiresUtc);
                    AdoDatabaseDriver.Add(command, "queuedutc", obj.QueuedUtc);
                    AdoDatabaseDriver.Add(command, "leasedutc", obj.LeasedUtc);
                    AdoDatabaseDriver.Add(command, "startedutc", obj.StartedUtc);
                    AdoDatabaseDriver.Add(command, "completedutc", obj.CompletedUtc);
                    AdoDatabaseDriver.Add(command, "deadlineutc", obj.DeadlineUtc);
                    AdoDatabaseDriver.Add(command, "cancelrequested", obj.CancelRequested);
                    AdoDatabaseDriver.Add(command, "resulttext", obj.ResultText);
                    AdoDatabaseDriver.Add(command, "structuredoutputjson", obj.StructuredOutputJson);
                    AdoDatabaseDriver.Add(command, "sessionid", obj.SessionId);
                    AdoDatabaseDriver.Add(command, "servedmodel", obj.ServedModel);
                    AdoDatabaseDriver.Add(command, "exitcode", obj.ExitCode);
                    AdoDatabaseDriver.Add(command, "stderrtail", obj.StderrTail);
                    AdoDatabaseDriver.Add(command, "errormessage", obj.ErrorMessage);
                    AdoDatabaseDriver.Add(command, "inputtokens", obj.InputTokens);
                    AdoDatabaseDriver.Add(command, "outputtokens", obj.OutputTokens);
                    AdoDatabaseDriver.Add(command, "cachedtokens", obj.CachedTokens);
                    AdoDatabaseDriver.Add(command, "costusd", obj.CostUsd);
                    AdoDatabaseDriver.Add(command, "costestimated", obj.CostEstimated);
                    AddTelemetry(command, obj);
                    AdoDatabaseDriver.Add(command, "lasteventsequence", obj.LastEventSequence);
                    AdoDatabaseDriver.Add(command, "active", obj.Active);
                    AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                    AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
                }, ct).ConfigureAwait(false);

                await DeleteChildrenAsync(connection, transaction, obj.Id, ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await DeleteChildrenAsync(connection, transaction, id, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> ExistsAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            object? result = await _Driver.ScalarAsync("SELECT 1 FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), token).ConfigureAwait(false);
            return result != null;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Run>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(tenantId))
            {
                clauses.Add("tenantid = @tenantid");
            }
            if (query.ActiveOnly) clauses.Add("active = " + _Driver.Dialect.BooleanLiteral(true));
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            };

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            string sql = "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";";
            List<Run> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            foreach (Run obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);

            return EnumerationResult<Run>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a Run (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static Run Map(DbDataReader reader)
        {
            Run obj = new Run();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.AgentId = AdoConverters.Str(reader, "agentid");
            obj.AgentName = AdoConverters.Str(reader, "agentname");
            obj.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            obj.DeploymentVersion = AdoConverters.Int(reader, "deploymentversion");
            obj.HarnessType = AdoConverters.Enum<HarnessTypeEnum>(reader, "harnesstype", HarnessTypeEnum.Generic);
            obj.NodePoolId = AdoConverters.NullableStr(reader, "nodepoolid");
            obj.Kind = AdoConverters.Enum<RunKindEnum>(reader, "kind", RunKindEnum.Invoke);
            obj.Status = AdoConverters.Enum<RunStatusEnum>(reader, "status", RunStatusEnum.Pending);
            obj.Outcome = AdoConverters.Enum<RunOutcomeEnum>(reader, "outcome", RunOutcomeEnum.None);
            obj.Priority = AdoConverters.Int(reader, "priority");
            obj.InputText = AdoConverters.NullableStr(reader, "inputtext");
            obj.InputContentType = AdoConverters.NullableStr(reader, "inputcontenttype");
            obj.CallerType = AdoConverters.Enum<PrincipalTypeEnum>(reader, "callertype", PrincipalTypeEnum.User);
            obj.CallerId = AdoConverters.NullableStr(reader, "callerid");
            obj.CallerName = AdoConverters.NullableStr(reader, "callername");
            obj.ParentRunId = AdoConverters.NullableStr(reader, "parentrunid");
            obj.RootRunId = AdoConverters.NullableStr(reader, "rootrunid");
            obj.Depth = AdoConverters.Int(reader, "depth");
            obj.CallChain = AdoConverters.NullableStr(reader, "callchain");
            obj.IdempotencyKey = AdoConverters.NullableStr(reader, "idempotencykey");
            obj.RetryOfRunId = AdoConverters.NullableStr(reader, "retryofrunid");
            obj.Attempt = AdoConverters.Int(reader, "attempt");
            obj.MaxAttempts = AdoConverters.Int(reader, "maxattempts");
            obj.LeaseNodeId = AdoConverters.NullableStr(reader, "leasenodeid");
            obj.LeaseNodeName = AdoConverters.NullableStr(reader, "leasenodename");
            obj.LeaseEpoch = AdoConverters.Long(reader, "leaseepoch");
            obj.LeaseExpiresUtc = AdoConverters.NullableDate(reader, "leaseexpiresutc");
            obj.QueuedUtc = AdoConverters.NullableDate(reader, "queuedutc");
            obj.LeasedUtc = AdoConverters.NullableDate(reader, "leasedutc");
            obj.StartedUtc = AdoConverters.NullableDate(reader, "startedutc");
            obj.CompletedUtc = AdoConverters.NullableDate(reader, "completedutc");
            obj.DeadlineUtc = AdoConverters.NullableDate(reader, "deadlineutc");
            obj.CancelRequested = AdoConverters.Bool(reader, "cancelrequested");
            obj.ResultText = AdoConverters.NullableStr(reader, "resulttext");
            obj.StructuredOutputJson = AdoConverters.NullableStr(reader, "structuredoutputjson");
            obj.SessionId = AdoConverters.NullableStr(reader, "sessionid");
            obj.ServedModel = AdoConverters.NullableStr(reader, "servedmodel");
            obj.ExitCode = AdoConverters.NullableInt(reader, "exitcode");
            obj.StderrTail = AdoConverters.NullableStr(reader, "stderrtail");
            obj.ErrorMessage = AdoConverters.NullableStr(reader, "errormessage");
            obj.InputTokens = AdoConverters.Long(reader, "inputtokens");
            obj.OutputTokens = AdoConverters.Long(reader, "outputtokens");
            obj.CachedTokens = AdoConverters.Long(reader, "cachedtokens");
            obj.CostUsd = AdoConverters.NullableDouble(reader, "costusd");
            obj.CostEstimated = AdoConverters.Bool(reader, "costestimated");
            MapTelemetry(reader, obj);
            obj.LastEventSequence = AdoConverters.Long(reader, "lasteventsequence");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <summary>
        /// Load child rows into a Run.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task LoadChildrenAsync(Run obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));

            obj.Parameters = await _Driver.QueryAsync(
                "SELECT * FROM " + _ParametersTable + " WHERE runid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapParameters,
                token).ConfigureAwait(false);

            obj.Requirements = await _Driver.QueryAsync(
                "SELECT * FROM " + _RequirementsTable + " WHERE runid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapRequirements,
                token).ConfigureAwait(false);

            obj.TemplateVersions = await _Driver.QueryAsync(
                "SELECT * FROM " + _TemplateVersionsTable + " WHERE runid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapTemplateVersions,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Run>> ListClaimCandidatesAsync(List<HarnessTypeEnum> harnessTypes, int limit, CancellationToken token = default)
        {
            if (harnessTypes == null) throw new ArgumentNullException(nameof(harnessTypes));
            if (harnessTypes.Count == 0) return new List<Run>();

            List<string> names = new List<string>();
            for (int i = 0; i < harnessTypes.Count; i++) names.Add("@h" + i);
            string sql = "SELECT * FROM " + _Table + " WHERE status = 'Queued' AND harnesstype IN (" + String.Join(", ", names) + ") ORDER BY priority DESC, createdutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";";
            List<Run> runs = await _Driver.QueryAsync(sql, command =>
            {
                for (int i = 0; i < harnessTypes.Count; i++) AdoDatabaseDriver.Add(command, "h" + i, harnessTypes[i].ToString());
                AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 500));
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, Map, token).ConfigureAwait(false);
            foreach (Run run in runs) await LoadChildrenAsync(run, token).ConfigureAwait(false);
            return runs;
        }

        /// <inheritdoc />
        public async Task<long?> TryClaimAsync(string runId, string nodeId, string nodeName, DateTime leaseExpiresUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            if (String.IsNullOrEmpty(nodeId)) throw new ArgumentNullException(nameof(nodeId));

            DateTime now = DateTime.UtcNow;
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = 'Leased', leasenodeid = @node, leasenodename = @nodename, leaseepoch = leaseepoch + 1, leaseexpiresutc = @expires, leasedutc = @now, lastupdateutc = @now WHERE id = @id AND status = 'Queued';",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", runId);
                    AdoDatabaseDriver.Add(command, "node", nodeId);
                    AdoDatabaseDriver.Add(command, "nodename", nodeName);
                    AdoDatabaseDriver.Add(command, "expires", leaseExpiresUtc);
                    AdoDatabaseDriver.Add(command, "now", now);
                },
                token).ConfigureAwait(false);
            if (affected != 1) return null;

            object? epoch = await _Driver.ScalarAsync("SELECT leaseepoch FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", runId), token).ConfigureAwait(false);
            return epoch == null ? null : Convert.ToInt64(epoch);
        }

        /// <inheritdoc />
        public async Task<long> CountActiveByDeploymentAsync(string deploymentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(deploymentId)) throw new ArgumentNullException(nameof(deploymentId));
            object? count = await _Driver.ScalarAsync(
                "SELECT COUNT(*) FROM " + _Table + " WHERE deploymentid = @deploymentid AND status IN ('Leased', 'Running', 'Cancelling');",
                command => AdoDatabaseDriver.Add(command, "deploymentid", deploymentId),
                token).ConfigureAwait(false);
            return count == null ? 0 : Convert.ToInt64(count);
        }

        /// <inheritdoc />
        public async Task<bool> TransitionAsync(RunTransition transition, CancellationToken token = default)
        {
            if (transition == null) throw new ArgumentNullException(nameof(transition));
            if (transition.FromStatuses.Count == 0) throw new ArgumentException("At least one from status is required.", nameof(transition));

            List<string> sets = new List<string> { "status = @to", "lastupdateutc = @now" };
            if (transition.Outcome.HasValue) sets.Add("outcome = @outcome");
            if (transition.ErrorMessage != null) sets.Add("errormessage = @error");
            if (transition.ClearLease) sets.Add("leasenodeid = NULL, leasenodename = NULL, leaseexpiresutc = NULL");
            if (transition.SetCompleted) sets.Add("completedutc = @now");
            if (transition.SetStarted) sets.Add("startedutc = @now");
            if (transition.SetQueued) sets.Add("queuedutc = @now, queuems = NULL, totalms = NULL");
            if (transition.IncrementAttempt) sets.Add("attempt = attempt + 1");
            if (transition.CancelRequested.HasValue) sets.Add("cancelrequested = @cancel");
            if (transition.DeadlineUtc.HasValue) sets.Add("deadlineutc = @deadline");

            List<string> from = new List<string>();
            for (int i = 0; i < transition.FromStatuses.Count; i++) from.Add("@f" + i);
            string where = "id = @id AND status IN (" + String.Join(", ", from) + ")";
            if (transition.Epoch.HasValue) where += " AND leaseepoch = @epoch";
            if (!String.IsNullOrEmpty(transition.NodeId)) where += " AND leasenodeid = @node";

            int affected = await _Driver.NonQueryAsync("UPDATE " + _Table + " SET " + String.Join(", ", sets) + " WHERE " + where + ";", command =>
            {
                AdoDatabaseDriver.Add(command, "id", transition.RunId);
                AdoDatabaseDriver.Add(command, "to", transition.ToStatus.ToString());
                AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                if (transition.Outcome.HasValue) AdoDatabaseDriver.Add(command, "outcome", transition.Outcome.Value.ToString());
                if (transition.ErrorMessage != null) AdoDatabaseDriver.Add(command, "error", transition.ErrorMessage);
                if (transition.CancelRequested.HasValue) AdoDatabaseDriver.Add(command, "cancel", transition.CancelRequested.Value);
                if (transition.DeadlineUtc.HasValue) AdoDatabaseDriver.Add(command, "deadline", transition.DeadlineUtc.Value);
                for (int i = 0; i < transition.FromStatuses.Count; i++) AdoDatabaseDriver.Add(command, "f" + i, transition.FromStatuses[i].ToString());
                if (transition.Epoch.HasValue) AdoDatabaseDriver.Add(command, "epoch", transition.Epoch.Value);
                if (!String.IsNullOrEmpty(transition.NodeId)) AdoDatabaseDriver.Add(command, "node", transition.NodeId);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> CompleteAsync(Run run, string nodeId, long epoch, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (String.IsNullOrEmpty(nodeId)) throw new ArgumentNullException(nameof(nodeId));

            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = @status, outcome = @outcome, completedutc = @completed, resulttext = @result, structuredoutputjson = @structured, " +
                "sessionid = @session, servedmodel = @model, exitcode = @exitcode, stderrtail = @stderr, errormessage = @error, inputtokens = @input, outputtokens = @output, " +
                "cachedtokens = @cached, costusd = @cost, costestimated = @estimated, reasoningtokens = @reasoningtokens, toolcallcount = @toolcallcount, " +
                "firsttokenutc = @firsttokenutc, lasttokenutc = @lasttokenutc, ttftms = @ttftms, streamingms = @streamingms, executionms = @executionms, " +
                "queuems = @queuems, totalms = @totalms, leaseexpiresutc = NULL, lastupdateutc = @now " +
                "WHERE id = @id AND leasenodeid = @node AND leaseepoch = @epoch AND status IN ('Leased', 'Running', 'Cancelling');",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", run.Id);
                    AdoDatabaseDriver.Add(command, "node", nodeId);
                    AdoDatabaseDriver.Add(command, "epoch", epoch);
                    AdoDatabaseDriver.Add(command, "status", run.Status.ToString());
                    AdoDatabaseDriver.Add(command, "outcome", run.Outcome.ToString());
                    AdoDatabaseDriver.Add(command, "completed", run.CompletedUtc ?? DateTime.UtcNow);
                    AdoDatabaseDriver.Add(command, "result", run.ResultText);
                    AdoDatabaseDriver.Add(command, "structured", run.StructuredOutputJson);
                    AdoDatabaseDriver.Add(command, "session", run.SessionId);
                    AdoDatabaseDriver.Add(command, "model", run.ServedModel);
                    AdoDatabaseDriver.Add(command, "exitcode", run.ExitCode);
                    AdoDatabaseDriver.Add(command, "stderr", run.StderrTail);
                    AdoDatabaseDriver.Add(command, "error", run.ErrorMessage);
                    AdoDatabaseDriver.Add(command, "input", run.InputTokens);
                    AdoDatabaseDriver.Add(command, "output", run.OutputTokens);
                    AdoDatabaseDriver.Add(command, "cached", run.CachedTokens);
                    AdoDatabaseDriver.Add(command, "cost", run.CostUsd);
                    AdoDatabaseDriver.Add(command, "estimated", run.CostEstimated);
                    AddTelemetry(command, run);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<bool> ExtendLeaseAsync(string runId, string nodeId, long epoch, DateTime leaseExpiresUtc, CancellationToken token = default)
        {
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET leaseexpiresutc = @expires WHERE id = @id AND leasenodeid = @node AND leaseepoch = @epoch AND status IN ('Leased', 'Running', 'Cancelling');",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", runId);
                    AdoDatabaseDriver.Add(command, "node", nodeId);
                    AdoDatabaseDriver.Add(command, "epoch", epoch);
                    AdoDatabaseDriver.Add(command, "expires", leaseExpiresUtc);
                },
                token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<List<Run>> ListExpiredLeasesAsync(DateTime nowUtc, int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status IN ('Leased', 'Running', 'Cancelling') AND leaseexpiresutc IS NOT NULL AND leaseexpiresutc < @now ORDER BY leaseexpiresutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 1000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Run>> ListActiveByNodeAsync(string nodeId, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE leasenodeid = @node AND status IN ('Leased', 'Running', 'Cancelling');",
                command => AdoDatabaseDriver.Add(command, "node", nodeId),
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<Run?> ReadByIdempotencyKeyAsync(string tenantId, string? callerId, string idempotencyKey, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(idempotencyKey)) throw new ArgumentNullException(nameof(idempotencyKey));

            Run? run = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND idempotencykey = @key AND " + (callerId == null ? "callerid IS NULL" : "callerid = @caller") + " AND createdutc > @since ORDER BY createdutc DESC;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "key", idempotencyKey);
                    if (callerId != null) AdoDatabaseDriver.Add(command, "caller", callerId);
                    AdoDatabaseDriver.Add(command, "since", DateTime.UtcNow.AddHours(-24));
                },
                Map,
                token).ConfigureAwait(false);
            if (run != null) await LoadChildrenAsync(run, token).ConfigureAwait(false);
            return run;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Run>> EnumerateAsync(RunFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(filter.TenantId)) clauses.Add("tenantid = @tenantid");
            if (filter.Status.HasValue) clauses.Add("status = @status");
            if (!String.IsNullOrEmpty(filter.AgentId)) clauses.Add("agentid = @agentid");
            if (!String.IsNullOrEmpty(filter.DeploymentId)) clauses.Add("deploymentid = @deploymentid");
            if (filter.HarnessType.HasValue) clauses.Add("harnesstype = @harnesstype");
            if (!String.IsNullOrEmpty(filter.NodeId)) clauses.Add("leasenodeid = @nodeid");
            if (!String.IsNullOrEmpty(filter.ParentRunId)) clauses.Add("parentrunid = @parentrunid");
            if (!String.IsNullOrEmpty(filter.RootRunId)) clauses.Add("rootrunid = @rootrunid");
            if (filter.Outcome.HasValue) clauses.Add("outcome = @outcome");
            if (!String.IsNullOrEmpty(filter.CallerId)) clauses.Add("callerid = @callerid");
            if (filter.FromUtc.HasValue) clauses.Add("createdutc >= @fromutc");
            if (filter.ToUtc.HasValue) clauses.Add("createdutc < @toutc");
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(filter.TenantId)) AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (filter.Status.HasValue) AdoDatabaseDriver.Add(command, "status", filter.Status.Value.ToString());
                if (!String.IsNullOrEmpty(filter.AgentId)) AdoDatabaseDriver.Add(command, "agentid", filter.AgentId);
                if (!String.IsNullOrEmpty(filter.DeploymentId)) AdoDatabaseDriver.Add(command, "deploymentid", filter.DeploymentId);
                if (filter.HarnessType.HasValue) AdoDatabaseDriver.Add(command, "harnesstype", filter.HarnessType.Value.ToString());
                if (!String.IsNullOrEmpty(filter.NodeId)) AdoDatabaseDriver.Add(command, "nodeid", filter.NodeId);
                if (!String.IsNullOrEmpty(filter.ParentRunId)) AdoDatabaseDriver.Add(command, "parentrunid", filter.ParentRunId);
                if (!String.IsNullOrEmpty(filter.RootRunId)) AdoDatabaseDriver.Add(command, "rootrunid", filter.RootRunId);
                if (filter.Outcome.HasValue) AdoDatabaseDriver.Add(command, "outcome", filter.Outcome.Value.ToString());
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
            List<Run> runs = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                    AdoDatabaseDriver.Add(command, "skip", query.Skip);
                },
                Map,
                token).ConfigureAwait(false);
            return EnumerationResult<Run>.Build(query, total, runs);
        }

        /// <inheritdoc />
        public async Task<List<Run>> ListForAnalyticsAsync(RunFilter filter, int limit, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            if (String.IsNullOrEmpty(filter.TenantId)) throw new ArgumentException("A tenant is required.", nameof(filter));

            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(filter.AgentId)) clauses.Add("agentid = @agentid");
            if (!String.IsNullOrEmpty(filter.DeploymentId)) clauses.Add("deploymentid = @deploymentid");
            if (filter.HarnessType.HasValue) clauses.Add("harnesstype = @harnesstype");
            bool unknownModel = String.Equals(filter.ServedModel, "unknown", StringComparison.OrdinalIgnoreCase);
            if (unknownModel) clauses.Add("(servedmodel IS NULL OR servedmodel = '')");
            else if (!String.IsNullOrEmpty(filter.ServedModel)) clauses.Add("servedmodel = @servedmodel");
            if (filter.FromUtc.HasValue) clauses.Add("createdutc >= @fromutc");
            if (filter.ToUtc.HasValue) clauses.Add("createdutc < @toutc");

            string sql = "SELECT id, tenantid, agentid, agentname, deploymentid, harnesstype, servedmodel, status, outcome, queuedutc, leasedutc, completedutc, " +
                "inputtokens, outputtokens, cachedtokens, costusd, reasoningtokens, toolcallcount, ttftms, streamingms, executionms, queuems, totalms, createdutc " +
                "FROM " + _Table + " WHERE " + String.Join(" AND ", clauses) + " ORDER BY createdutc DESC" + _Driver.Dialect.LimitOffsetClause() + ";";

            return await _Driver.QueryAsync(sql, command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (!String.IsNullOrEmpty(filter.AgentId)) AdoDatabaseDriver.Add(command, "agentid", filter.AgentId);
                if (!String.IsNullOrEmpty(filter.DeploymentId)) AdoDatabaseDriver.Add(command, "deploymentid", filter.DeploymentId);
                if (filter.HarnessType.HasValue) AdoDatabaseDriver.Add(command, "harnesstype", filter.HarnessType.Value.ToString());
                if (!unknownModel && !String.IsNullOrEmpty(filter.ServedModel)) AdoDatabaseDriver.Add(command, "servedmodel", filter.ServedModel);
                if (filter.FromUtc.HasValue) AdoDatabaseDriver.Add(command, "fromutc", filter.FromUtc.Value);
                if (filter.ToUtc.HasValue) AdoDatabaseDriver.Add(command, "toutc", filter.ToUtc.Value);
                AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, MapAnalytics, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<StatusCount>> CountByStatusAsync(string? tenantId, DateTime? sinceUtc, CancellationToken token = default)
        {
            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(tenantId)) clauses.Add("tenantid = @tenantid");
            if (sinceUtc.HasValue) clauses.Add("createdutc >= @since");
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;
            return await _Driver.QueryAsync(
                "SELECT status, COUNT(*) AS total FROM " + _Table + where + " GROUP BY status;",
                command =>
                {
                    if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    if (sinceUtc.HasValue) AdoDatabaseDriver.Add(command, "since", sinceUtc.Value);
                },
                reader =>
                {
                    StatusCount count = new StatusCount();
                    count.Status = AdoConverters.Str(reader, "status");
                    count.Count = AdoConverters.Long(reader, "total");
                    return count;
                },
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<QueueSummaryRow>> QueueSummaryAsync(string? tenantId, CancellationToken token = default)
        {
            string where = " WHERE status IN ('Queued', 'Leased', 'Running')" + (String.IsNullOrEmpty(tenantId) ? String.Empty : " AND tenantid = @tenantid");
            List<QueueSummaryRow> rows = new List<QueueSummaryRow>();
            List<QueueSummaryCell> cells = await _Driver.QueryAsync(
                "SELECT agentname, harnesstype, status, COUNT(*) AS total FROM " + _Table + where + " GROUP BY agentname, harnesstype, status;",
                command =>
                {
                    if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                reader =>
                {
                    QueueSummaryCell cell = new QueueSummaryCell();
                    cell.AgentName = AdoConverters.Str(reader, "agentname");
                    cell.HarnessType = AdoConverters.Enum<HarnessTypeEnum>(reader, "harnesstype", HarnessTypeEnum.Generic);
                    cell.Status = AdoConverters.Str(reader, "status");
                    cell.Count = AdoConverters.Long(reader, "total");
                    return cell;
                },
                token).ConfigureAwait(false);

            foreach (QueueSummaryCell cell in cells)
            {
                QueueSummaryRow? row = rows.Find(r => r.AgentName == cell.AgentName && r.HarnessType == cell.HarnessType);
                if (row == null)
                {
                    row = new QueueSummaryRow();
                    row.AgentName = cell.AgentName;
                    row.HarnessType = cell.HarnessType;
                    rows.Add(row);
                }
                if (cell.Status == "Queued") row.Queued += cell.Count;
                else if (cell.Status == "Leased") row.Leased += cell.Count;
                else row.Running += cell.Count;
            }
            return rows;
        }

        /// <inheritdoc />
        public async Task UpdateLastEventSequenceAsync(string runId, long sequence, CancellationToken token = default)
        {
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET lasteventsequence = @seq WHERE id = @id AND lasteventsequence < @seq;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", runId);
                    AdoDatabaseDriver.Add(command, "seq", sequence);
                },
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> PruneFinishedAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            List<string> ids = await _Driver.QueryAsync(
                "SELECT id FROM " + _Table + " WHERE status IN ('Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected') AND completedutc < @cutoff" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc);
                    AdoDatabaseDriver.Add(command, "max", 500);
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                reader => AdoConverters.Str(reader, "id"),
                token).ConfigureAwait(false);

            string events = _Driver.Table("run_events");
            foreach (string id in ids)
            {
                await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
                {
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + events + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                    await DeleteChildrenAsync(connection, transaction, id, ct).ConfigureAwait(false);
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                }, token).ConfigureAwait(false);
            }
            return ids.Count;
        }

        /// <inheritdoc />
        public async Task ReplaceTemplateVersionsAsync(Run run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _TemplateVersionsTable + " WHERE runid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", run.Id), ct).ConfigureAwait(false);
                foreach (RunTemplateVersion version in run.TemplateVersions)
                {
                    version.RunId = run.Id;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "INSERT INTO " + _TemplateVersionsTable + " (id, runid, tenantid, templateid, templatename, version) VALUES (@id, @runid, @tenantid, @templateid, @templatename, @version);",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "id", version.Id);
                            AdoDatabaseDriver.Add(command, "runid", run.Id);
                            AdoDatabaseDriver.Add(command, "tenantid", run.TenantId);
                            AdoDatabaseDriver.Add(command, "templateid", version.TemplateId);
                            AdoDatabaseDriver.Add(command, "templatename", version.TemplateName);
                            AdoDatabaseDriver.Add(command, "version", version.Version);
                        }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Run>> ListPastDeadlineAsync(DateTime nowUtc, int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status IN ('Leased', 'Running', 'Cancelling') AND deadlineutc IS NOT NULL AND deadlineutc < @now ORDER BY deadlineutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 1000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Run>> ListQueuedAsync(string? tenantId, int limit, CancellationToken token = default)
        {
            bool scoped = !String.IsNullOrEmpty(tenantId);
            List<Run> runs = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status = 'Queued'" + (scoped ? " AND tenantid = @tenantid" : String.Empty) + " ORDER BY createdutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    if (scoped) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 100000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
            if (runs.Count == 0) return runs;

            List<RunRequirement> requirements = await _Driver.QueryAsync(
                "SELECT q.* FROM " + _RequirementsTable + " q INNER JOIN " + _Table + " r ON r.id = q.runid WHERE r.status = 'Queued'" + (scoped ? " AND r.tenantid = @tenantid" : String.Empty) + " ORDER BY q.id ASC;",
                command =>
                {
                    if (scoped) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                MapRequirements,
                token).ConfigureAwait(false);

            Dictionary<string, Run> byId = new Dictionary<string, Run>(StringComparer.Ordinal);
            foreach (Run run in runs) byId[run.Id] = run;
            foreach (RunRequirement requirement in requirements)
            {
                if (byId.TryGetValue(requirement.RunId, out Run? owner)) owner.Requirements.Add(requirement);
            }
            return runs;
        }

        /// <inheritdoc />
        public async Task LoadRequirementsAsync(List<Run> runs, CancellationToken token = default)
        {
            if (runs == null) throw new ArgumentNullException(nameof(runs));
            Dictionary<string, Run> byId = new Dictionary<string, Run>(StringComparer.Ordinal);
            foreach (Run run in runs)
            {
                if (run == null) continue;
                run.Requirements = new List<RunRequirement>();
                byId[run.Id] = run;
            }
            List<string> ids = new List<string>(byId.Keys);
            for (int offset = 0; offset < ids.Count; offset += 500)
            {
                List<string> chunk = ids.GetRange(offset, Math.Min(500, ids.Count - offset));
                List<string> names = new List<string>();
                for (int i = 0; i < chunk.Count; i++) names.Add("@r" + i);
                List<RunRequirement> requirements = await _Driver.QueryAsync(
                    "SELECT * FROM " + _RequirementsTable + " WHERE runid IN (" + String.Join(", ", names) + ") ORDER BY id ASC;",
                    command =>
                    {
                        for (int i = 0; i < chunk.Count; i++) AdoDatabaseDriver.Add(command, "r" + i, chunk[i]);
                    },
                    MapRequirements,
                    token).ConfigureAwait(false);
                foreach (RunRequirement requirement in requirements)
                {
                    if (byId.TryGetValue(requirement.RunId, out Run? owner)) owner.Requirements.Add(requirement);
                }
            }
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, Run obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, agentid, agentname, deploymentid, deploymentversion, harnesstype, nodepoolid, kind, status, outcome, priority, inputtext, inputcontenttype, callertype, callerid, callername, parentrunid, rootrunid, depth, callchain, idempotencykey, retryofrunid, attempt, maxattempts, leasenodeid, leasenodename, leaseepoch, leaseexpiresutc, queuedutc, leasedutc, startedutc, completedutc, deadlineutc, cancelrequested, resulttext, structuredoutputjson, sessionid, servedmodel, exitcode, stderrtail, errormessage, inputtokens, outputtokens, cachedtokens, costusd, costestimated, reasoningtokens, toolcallcount, firsttokenutc, lasttokenutc, ttftms, streamingms, executionms, queuems, totalms, lasteventsequence, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @agentid, @agentname, @deploymentid, @deploymentversion, @harnesstype, @nodepoolid, @kind, @status, @outcome, @priority, @inputtext, @inputcontenttype, @callertype, @callerid, @callername, @parentrunid, @rootrunid, @depth, @callchain, @idempotencykey, @retryofrunid, @attempt, @maxattempts, @leasenodeid, @leasenodename, @leaseepoch, @leaseexpiresutc, @queuedutc, @leasedutc, @startedutc, @completedutc, @deadlineutc, @cancelrequested, @resulttext, @structuredoutputjson, @sessionid, @servedmodel, @exitcode, @stderrtail, @errormessage, @inputtokens, @outputtokens, @cachedtokens, @costusd, @costestimated, @reasoningtokens, @toolcallcount, @firsttokenutc, @lasttokenutc, @ttftms, @streamingms, @executionms, @queuems, @totalms, @lasteventsequence, @active, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
                AdoDatabaseDriver.Add(command, "agentname", obj.AgentName);
                AdoDatabaseDriver.Add(command, "deploymentid", obj.DeploymentId);
                AdoDatabaseDriver.Add(command, "deploymentversion", obj.DeploymentVersion);
                AdoDatabaseDriver.Add(command, "harnesstype", obj.HarnessType.ToString());
                AdoDatabaseDriver.Add(command, "nodepoolid", obj.NodePoolId);
                AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
                AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
                AdoDatabaseDriver.Add(command, "outcome", obj.Outcome.ToString());
                AdoDatabaseDriver.Add(command, "priority", obj.Priority);
                AdoDatabaseDriver.Add(command, "inputtext", obj.InputText);
                AdoDatabaseDriver.Add(command, "inputcontenttype", obj.InputContentType);
                AdoDatabaseDriver.Add(command, "callertype", obj.CallerType.ToString());
                AdoDatabaseDriver.Add(command, "callerid", obj.CallerId);
                AdoDatabaseDriver.Add(command, "callername", obj.CallerName);
                AdoDatabaseDriver.Add(command, "parentrunid", obj.ParentRunId);
                AdoDatabaseDriver.Add(command, "rootrunid", obj.RootRunId);
                AdoDatabaseDriver.Add(command, "depth", obj.Depth);
                AdoDatabaseDriver.Add(command, "callchain", obj.CallChain);
                AdoDatabaseDriver.Add(command, "idempotencykey", obj.IdempotencyKey);
                AdoDatabaseDriver.Add(command, "retryofrunid", obj.RetryOfRunId);
                AdoDatabaseDriver.Add(command, "attempt", obj.Attempt);
                AdoDatabaseDriver.Add(command, "maxattempts", obj.MaxAttempts);
                AdoDatabaseDriver.Add(command, "leasenodeid", obj.LeaseNodeId);
                AdoDatabaseDriver.Add(command, "leasenodename", obj.LeaseNodeName);
                AdoDatabaseDriver.Add(command, "leaseepoch", obj.LeaseEpoch);
                AdoDatabaseDriver.Add(command, "leaseexpiresutc", obj.LeaseExpiresUtc);
                AdoDatabaseDriver.Add(command, "queuedutc", obj.QueuedUtc);
                AdoDatabaseDriver.Add(command, "leasedutc", obj.LeasedUtc);
                AdoDatabaseDriver.Add(command, "startedutc", obj.StartedUtc);
                AdoDatabaseDriver.Add(command, "completedutc", obj.CompletedUtc);
                AdoDatabaseDriver.Add(command, "deadlineutc", obj.DeadlineUtc);
                AdoDatabaseDriver.Add(command, "cancelrequested", obj.CancelRequested);
                AdoDatabaseDriver.Add(command, "resulttext", obj.ResultText);
                AdoDatabaseDriver.Add(command, "structuredoutputjson", obj.StructuredOutputJson);
                AdoDatabaseDriver.Add(command, "sessionid", obj.SessionId);
                AdoDatabaseDriver.Add(command, "servedmodel", obj.ServedModel);
                AdoDatabaseDriver.Add(command, "exitcode", obj.ExitCode);
                AdoDatabaseDriver.Add(command, "stderrtail", obj.StderrTail);
                AdoDatabaseDriver.Add(command, "errormessage", obj.ErrorMessage);
                AdoDatabaseDriver.Add(command, "inputtokens", obj.InputTokens);
                AdoDatabaseDriver.Add(command, "outputtokens", obj.OutputTokens);
                AdoDatabaseDriver.Add(command, "cachedtokens", obj.CachedTokens);
                AdoDatabaseDriver.Add(command, "costusd", obj.CostUsd);
                AdoDatabaseDriver.Add(command, "costestimated", obj.CostEstimated);
                AddTelemetry(command, obj);
                AdoDatabaseDriver.Add(command, "lasteventsequence", obj.LastEventSequence);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, Run obj, CancellationToken token)
        {
            string batch = IdGenerator.NewChildRowId() + "_";
            for (int i = 0; i < obj.Parameters.Count; i++)
            {
                RunParameter child = obj.Parameters[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "par";
                child.RunId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _ParametersTable + " (id, runid, tenantid, name, value) VALUES (@id, @runid, @tenantid, @name, @value);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "runid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "name", child.Name);
                        AdoDatabaseDriver.Add(command, "value", child.Value);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.Requirements.Count; i++)
            {
                RunRequirement child = obj.Requirements[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "req";
                child.RunId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _RequirementsTable + " (id, runid, tenantid, key, value) VALUES (@id, @runid, @tenantid, @key, @value);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "runid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "key", child.Key);
                        AdoDatabaseDriver.Add(command, "value", child.Value);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.TemplateVersions.Count; i++)
            {
                RunTemplateVersion child = obj.TemplateVersions[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "tem";
                child.RunId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _TemplateVersionsTable + " (id, runid, tenantid, templateid, templatename, version) VALUES (@id, @runid, @tenantid, @templateid, @templatename, @version);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "runid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "templateid", child.TemplateId);
                        AdoDatabaseDriver.Add(command, "templatename", child.TemplateName);
                        AdoDatabaseDriver.Add(command, "version", child.Version);
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string parentId, CancellationToken token)
        {
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _ParametersTable + " WHERE runid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _RequirementsTable + " WHERE runid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _TemplateVersionsTable + " WHERE runid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
        }

        private static Run MapAnalytics(DbDataReader reader)
        {
            Run obj = new Run();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.AgentId = AdoConverters.Str(reader, "agentid");
            obj.AgentName = AdoConverters.Str(reader, "agentname");
            obj.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            obj.HarnessType = AdoConverters.Enum<HarnessTypeEnum>(reader, "harnesstype", HarnessTypeEnum.Generic);
            obj.ServedModel = AdoConverters.NullableStr(reader, "servedmodel");
            obj.Status = AdoConverters.Enum<RunStatusEnum>(reader, "status", RunStatusEnum.Pending);
            obj.Outcome = AdoConverters.Enum<RunOutcomeEnum>(reader, "outcome", RunOutcomeEnum.None);
            obj.QueuedUtc = AdoConverters.NullableDate(reader, "queuedutc");
            obj.LeasedUtc = AdoConverters.NullableDate(reader, "leasedutc");
            obj.CompletedUtc = AdoConverters.NullableDate(reader, "completedutc");
            obj.InputTokens = AdoConverters.Long(reader, "inputtokens");
            obj.OutputTokens = AdoConverters.Long(reader, "outputtokens");
            obj.CachedTokens = AdoConverters.Long(reader, "cachedtokens");
            obj.CostUsd = AdoConverters.NullableDouble(reader, "costusd");
            obj.ReasoningTokens = AdoConverters.Long(reader, "reasoningtokens");
            obj.ToolCallCount = AdoConverters.Int(reader, "toolcallcount");
            obj.TimeToFirstTokenMs = AdoConverters.NullableLong(reader, "ttftms");
            obj.StreamingMs = AdoConverters.NullableLong(reader, "streamingms");
            obj.ExecutionMs = AdoConverters.NullableLong(reader, "executionms");
            obj.QueueMs = AdoConverters.NullableLong(reader, "queuems") ?? Run.ElapsedMs(obj.QueuedUtc, obj.LeasedUtc);
            obj.TotalMs = AdoConverters.NullableLong(reader, "totalms") ?? Run.ElapsedMs(obj.QueuedUtc, obj.CompletedUtc);
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return obj;
        }

        private static void AddTelemetry(DbCommand command, Run obj)
        {
            AdoDatabaseDriver.Add(command, "reasoningtokens", obj.ReasoningTokens);
            AdoDatabaseDriver.Add(command, "toolcallcount", obj.ToolCallCount);
            AdoDatabaseDriver.Add(command, "firsttokenutc", obj.FirstTokenUtc);
            AdoDatabaseDriver.Add(command, "lasttokenutc", obj.LastTokenUtc);
            AdoDatabaseDriver.Add(command, "ttftms", obj.TimeToFirstTokenMs);
            AdoDatabaseDriver.Add(command, "streamingms", obj.StreamingMs);
            AdoDatabaseDriver.Add(command, "executionms", obj.ExecutionMs);
            AdoDatabaseDriver.Add(command, "queuems", obj.QueueMs);
            AdoDatabaseDriver.Add(command, "totalms", obj.TotalMs);
        }

        private static void MapTelemetry(DbDataReader reader, Run obj)
        {
            obj.ReasoningTokens = AdoConverters.Long(reader, "reasoningtokens");
            obj.ToolCallCount = AdoConverters.Int(reader, "toolcallcount");
            obj.FirstTokenUtc = AdoConverters.NullableDate(reader, "firsttokenutc");
            obj.LastTokenUtc = AdoConverters.NullableDate(reader, "lasttokenutc");
            obj.TimeToFirstTokenMs = AdoConverters.NullableLong(reader, "ttftms");
            obj.StreamingMs = AdoConverters.NullableLong(reader, "streamingms");
            obj.ExecutionMs = AdoConverters.NullableLong(reader, "executionms");

            // Runs that finished before migration 2, or ended without a worker completion report (cancelled while
            // queued, reaped, timed out by the server), have no stored durations; derive them from server timestamps.
            obj.QueueMs = AdoConverters.NullableLong(reader, "queuems") ?? Run.ElapsedMs(obj.QueuedUtc, obj.LeasedUtc);
            obj.TotalMs = AdoConverters.NullableLong(reader, "totalms") ?? Run.ElapsedMs(obj.QueuedUtc, obj.CompletedUtc);
        }

        private static RunParameter MapParameters(DbDataReader reader)
        {
            RunParameter child = new RunParameter();
            child.Id = AdoConverters.Str(reader, "id");
            child.RunId = AdoConverters.Str(reader, "runid");
            child.Name = AdoConverters.Str(reader, "name");
            child.Value = AdoConverters.Str(reader, "value");
            return child;
        }

        private static RunRequirement MapRequirements(DbDataReader reader)
        {
            RunRequirement child = new RunRequirement();
            child.Id = AdoConverters.Str(reader, "id");
            child.RunId = AdoConverters.Str(reader, "runid");
            child.Key = AdoConverters.Str(reader, "key");
            child.Value = AdoConverters.Str(reader, "value");
            return child;
        }

        private static RunTemplateVersion MapTemplateVersions(DbDataReader reader)
        {
            RunTemplateVersion child = new RunTemplateVersion();
            child.Id = AdoConverters.Str(reader, "id");
            child.RunId = AdoConverters.Str(reader, "runid");
            child.TemplateId = AdoConverters.Str(reader, "templateid");
            child.TemplateName = AdoConverters.Str(reader, "templatename");
            child.Version = AdoConverters.Int(reader, "version");
            return child;
        }

        #endregion
    }
}
