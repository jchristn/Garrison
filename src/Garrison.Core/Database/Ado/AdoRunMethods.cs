namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;

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
        public Task<Run> CreateAsync(Run obj, CancellationToken token = default)
        {
            return CreateAsync(obj, new QueueDepthLimits(), token);
        }

        /// <inheritdoc />
        public async Task<Run> CreateAsync(Run obj, QueueDepthLimits limits, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;

            bool idempotent = !String.IsNullOrEmpty(obj.IdempotencyKey);
            string? lockSql = _Driver.Dialect.TransactionLockStatement();
            Run? existing = null;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                existing = null;
                if (idempotent)
                {
                    // Retries with the same key can reach different replicas at the same moment; serialize them on the key
                    // so exactly one inserts and the others get its run.
                    if (lockSql != null)
                    {
                        long key = AdoDatabaseDriver.LockKey("run-idempotency:" + _Table + ":" + obj.TenantId + ":" + (obj.CallerId ?? String.Empty) + ":" + obj.IdempotencyKey);
                        await AdoDatabaseDriver.ExecuteAsync(connection, transaction, lockSql, command => AdoDatabaseDriver.Add(command, "key", key), ct).ConfigureAwait(false);
                    }
                    List<Run> found = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                        "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND idempotencykey = @key AND " + (obj.CallerId == null ? "callerid IS NULL" : "callerid = @caller") + " AND createdutc > @since ORDER BY createdutc DESC;",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                            AdoDatabaseDriver.Add(command, "key", obj.IdempotencyKey);
                            if (obj.CallerId != null) AdoDatabaseDriver.Add(command, "caller", obj.CallerId);
                            AdoDatabaseDriver.Add(command, "since", DateTime.UtcNow.AddHours(-24));
                        },
                        Map,
                        ct).ConfigureAwait(false);
                    if (found.Count > 0)
                    {
                        existing = found[0];
                        return;
                    }
                }
                await QueueAdmissionSql.CheckAsync(_Driver, connection, transaction, obj, limits, ct).ConfigureAwait(false);
                DateTime admittedUtc = DateTime.UtcNow;
                QuotaExceededException? refusal = await QuotaAccountingSql.LockAndCheckAsync(_Driver, connection, transaction, obj, true, ct, admittedUtc).ConfigureAwait(false);
                if (refusal != null) throw refusal;
                await InsertRowAsync(connection, transaction, obj, ct).ConfigureAwait(false);
                await QuotaAccountingSql.InsertLedgerAsync(_Driver, connection, transaction, obj.Id, ct, admittedUtc: admittedUtc).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            if (existing != null)
            {
                await LoadChildrenAsync(existing, token).ConfigureAwait(false);
                return existing;
            }
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
        public async Task<Run?> ReadRowAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
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

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, agentid = @agentid, agentname = @agentname, deploymentid = @deploymentid, deploymentversion = @deploymentversion, harnesstype = @harnesstype, nodepoolid = @nodepoolid, executor = @executor, capisolation = @capisolation, capegresscontrol = @capegresscontrol, capfilesystemsnapshot = @capfilesystemsnapshot, capsessioncontinuation = @capsessioncontinuation, capcrossnoderestore = @capcrossnoderestore, capcoldstartclass = @capcoldstartclass, trustlevel = @trustlevel, effectpolicy = @effectpolicy, kind = @kind, status = @status, outcome = @outcome, priority = @priority, inputtext = @inputtext, inputcontenttype = @inputcontenttype, callertype = @callertype, callerid = @callerid, callername = @callername, parentrunid = @parentrunid, rootrunid = @rootrunid, depth = @depth, callchain = @callchain, idempotencykey = @idempotencykey, retryofrunid = @retryofrunid, attempt = @attempt, maxattempts = @maxattempts, leasenodeid = @leasenodeid, leasenodename = @leasenodename, leaseepoch = @leaseepoch, leaseexpiresutc = @leaseexpiresutc, queuedutc = @queuedutc, leasedutc = @leasedutc, startedutc = @startedutc, completedutc = @completedutc, deadlineutc = @deadlineutc, cancelrequested = @cancelrequested, resulttext = @resulttext, structuredoutputjson = @structuredoutputjson, sessionid = @sessionid, servedmodel = @servedmodel, exitcode = @exitcode, stderrtail = @stderrtail, errormessage = @errormessage, inputtokens = @inputtokens, outputtokens = @outputtokens, cachedtokens = @cachedtokens, costusd = @costusd, costestimated = @costestimated, reasoningtokens = @reasoningtokens, toolcallcount = @toolcallcount, outputschemavalid = @outputschemavalid, schemavalidationerrors = @schemavalidationerrors, repairattempts = @repairattempts, firsttokenutc = @firsttokenutc, lasttokenutc = @lasttokenutc, ttftms = @ttftms, streamingms = @streamingms, executionms = @executionms, queuems = @queuems, totalms = @totalms, delegationwaitms = @delegationwaitms, ttftexcldelegationms = @ttftexcldelegationms, lasteventsequence = @lasteventsequence, conversationid = @conversationid, conversationturn = @conversationturn, resumesessionid = @resumesessionid, affinitynodeid = @affinitynodeid, affinityuntilutc = @affinityuntilutc, conversationfallbackreason = @conversationfallbackreason, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

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
                    AdoDatabaseDriver.Add(command, "executor", obj.Executor.ToString());
                    ExecutorCapabilitySql.Bind(command, obj.RequiredCapabilities);
                    AdoDatabaseDriver.Add(command, "trustlevel", obj.TrustLevel.ToString());
                    AdoDatabaseDriver.Add(command, "effectpolicy", obj.EffectPolicy.ToString());
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
                    AddConversation(command, obj);
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
            // Events go with the run; leaving them would orphan rows until event retention caught up.
            string events = _Driver.Table("run_events");
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await QuotaAccountingSql.SnapshotBeforeDeleteAsync(_Driver, connection, transaction, id, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + events + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Driver.Table("approvals") + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Driver.Table("effect_operations") + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Driver.Table("run_checkpoints") + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Driver.Table("effect_checkpoints") + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Driver.Table("run_database_usage") + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
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
            obj.Executor = AdoConverters.Enum<RunExecutorEnum>(reader, "executor", RunExecutorEnum.Process);
            obj.RequiredCapabilities = ExecutorCapabilitySql.Read(reader);
            obj.TrustLevel = AdoConverters.Enum<DeploymentTrustLevelEnum>(reader, "trustlevel", DeploymentTrustLevelEnum.Trusted);
            obj.EffectPolicy = AdoConverters.Enum<DeploymentEffectPolicyEnum>(reader, "effectpolicy", DeploymentEffectPolicyEnum.AtMostOnce);
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
            obj.TraceId = AdoConverters.NullableStr(reader, "traceid");
            obj.TraceParent = AdoConverters.NullableStr(reader, "traceparent");
            obj.ExitCode = AdoConverters.NullableInt(reader, "exitcode");
            obj.StderrTail = AdoConverters.NullableStr(reader, "stderrtail");
            obj.ErrorMessage = AdoConverters.NullableStr(reader, "errormessage");
            obj.InputTokens = AdoConverters.Long(reader, "inputtokens");
            obj.OutputTokens = AdoConverters.Long(reader, "outputtokens");
            obj.CachedTokens = AdoConverters.Long(reader, "cachedtokens");
            obj.CostUsd = AdoConverters.NullableDouble(reader, "costusd");
            obj.CostEstimated = AdoConverters.Bool(reader, "costestimated");
            MapTelemetry(reader, obj);
            MapConversation(reader, obj);
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
            ClaimCandidateFilter filter = new ClaimCandidateFilter();
            filter.HarnessTypes = harnessTypes;
            filter.IgnoreNodePool = true;
            filter.Limit = limit;
            return await ListClaimCandidatesAsync(filter, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Run>> ListClaimCandidatesAsync(ClaimCandidateFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            if (filter.HarnessTypes.Count == 0) return new List<Run>();

            List<string> harnessNames = new List<string>();
            for (int i = 0; i < filter.HarnessTypes.Count; i++) harnessNames.Add("@h" + i);
            List<string> clauses = new List<string>();
            clauses.Add("status = 'Queued'");
            clauses.Add("harnesstype IN (" + String.Join(", ", harnessNames) + ")");
            if (!filter.IgnoreNodePool)
            {
                if (String.IsNullOrEmpty(filter.NodePoolId)) clauses.Add("(nodepoolid IS NULL OR nodepoolid = '')");
                else clauses.Add("(nodepoolid IS NULL OR nodepoolid = '' OR nodepoolid = @pool)");
            }
            List<string> tenants = filter.AllowedTenantIds == null ? new List<string>() : filter.AllowedTenantIds.Where(t => !String.IsNullOrEmpty(t)).Distinct().ToList();
            List<string> tenantNames = new List<string>();
            for (int i = 0; i < tenants.Count; i++) tenantNames.Add("@t" + i);
            if (tenants.Count > 0) clauses.Add("tenantid IN (" + String.Join(", ", tenantNames) + ")");
            List<RunExecutorEnum> executors = new List<RunExecutorEnum>();
            if (filter.Executors != null)
            {
                executors = filter.Executors.Distinct().ToList();
                if (executors.Count == 0) executors.Add(RunExecutorEnum.Process);
                List<string> executorNames = new List<string>();
                for (int i = 0; i < executors.Count; i++) executorNames.Add("@x" + i);
                string match = "executor IN (" + String.Join(", ", executorNames) + ")";
                clauses.Add(executors.Contains(RunExecutorEnum.Process) ? "(executor IS NULL OR executor = '' OR " + match + ")" : match);
            }

            if (filter.ExecutorCapabilities.Count > 0)
            {
                List<string> matches = new List<string>();
                for (int i = 0; i < filter.ExecutorCapabilities.Count; i++)
                {
                    string prefix = "xc" + i;
                    matches.Add("((executor = @" + prefix + "executor OR ((executor IS NULL OR executor = '') AND @" + prefix + "executor = 'Process'))"
                        + " AND capisolation <= @" + prefix + "isolation"
                        + " AND (capegresscontrol = " + _Driver.Dialect.BooleanLiteral(false) + " OR @" + prefix + "egress = " + _Driver.Dialect.BooleanLiteral(true) + ")"
                        + " AND (capfilesystemsnapshot = " + _Driver.Dialect.BooleanLiteral(false) + " OR @" + prefix + "snapshot = " + _Driver.Dialect.BooleanLiteral(true) + ")"
                        + " AND (capsessioncontinuation = " + _Driver.Dialect.BooleanLiteral(false) + " OR @" + prefix + "session = " + _Driver.Dialect.BooleanLiteral(true) + ")"
                        + " AND (capcrossnoderestore = " + _Driver.Dialect.BooleanLiteral(false) + " OR @" + prefix + "restore = " + _Driver.Dialect.BooleanLiteral(true) + ")"
                        + " AND (capcoldstartclass IS NULL OR capcoldstartclass = @" + prefix + "cold OR (capcoldstartclass = 'Warm' AND @" + prefix + "warm = " + _Driver.Dialect.BooleanLiteral(true) + ")))");
                }
                clauses.Add("(" + String.Join(" OR ", matches) + ")");
            }

            if (filter.DelegatedOnly) clauses.Add("kind = 'Delegated'");
            if (filter.WaitedChildrenOnly) clauses.Add(ChildWaitSql.RunIsWaitedOn(_Driver, _Table + ".id"));

            string sql = "SELECT * FROM " + _Table + " WHERE " + String.Join(" AND ", clauses) + " ORDER BY priority DESC, createdutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";";
            if (filter.TenantFairWindow)
                sql = "SELECT * FROM (SELECT " + _Table + ".*, ROW_NUMBER() OVER (PARTITION BY tenantid ORDER BY priority DESC, createdutc ASC, id ASC) AS tenantposition FROM " + _Table + " WHERE " + String.Join(" AND ", clauses) + ") fairwindow ORDER BY tenantposition ASC, priority DESC, createdutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";";
            List<Run> runs = await _Driver.QueryAsync(sql, command =>
            {
                for (int i = 0; i < filter.HarnessTypes.Count; i++) AdoDatabaseDriver.Add(command, "h" + i, filter.HarnessTypes[i].ToString());
                if (!filter.IgnoreNodePool && !String.IsNullOrEmpty(filter.NodePoolId)) AdoDatabaseDriver.Add(command, "pool", filter.NodePoolId);
                for (int i = 0; i < tenants.Count; i++) AdoDatabaseDriver.Add(command, "t" + i, tenants[i]);
                for (int i = 0; i < executors.Count; i++) AdoDatabaseDriver.Add(command, "x" + i, executors[i].ToString());
                for (int i = 0; i < filter.ExecutorCapabilities.Count; i++)
                {
                    ExecutorCapabilities capability = filter.ExecutorCapabilities[i];
                    string prefix = "xc" + i;
                    AdoDatabaseDriver.Add(command, prefix + "executor", capability.Executor.ToString());
                    AdoDatabaseDriver.Add(command, prefix + "isolation", (int)capability.Isolation);
                    AdoDatabaseDriver.Add(command, prefix + "egress", capability.EgressControl);
                    AdoDatabaseDriver.Add(command, prefix + "snapshot", capability.FilesystemSnapshot);
                    AdoDatabaseDriver.Add(command, prefix + "session", capability.SessionContinuation);
                    AdoDatabaseDriver.Add(command, prefix + "restore", capability.CrossNodeRestore);
                    AdoDatabaseDriver.Add(command, prefix + "cold", capability.ColdStartClass?.ToString());
                    AdoDatabaseDriver.Add(command, prefix + "warm", capability.WarmStart);
                }
                AdoDatabaseDriver.Add(command, "max", filter.Limit);
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, Map, token).ConfigureAwait(false);
            await LoadRequirementsAsync(runs, token).ConfigureAwait(false);
            return runs;
        }

        /// <inheritdoc />
        public async Task<long?> TryClaimAsync(string runId, string nodeId, string nodeName, DateTime leaseExpiresUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            if (String.IsNullOrEmpty(nodeId)) throw new ArgumentNullException(nameof(nodeId));

            Run? run = await ReadAsync(runId, token).ConfigureAwait(false);
            if (run == null) return null;
            ClaimResult result = await TryClaimWithinLimitAsync(runId, nodeId, nodeName, leaseExpiresUtc, run.DeploymentId, 0, token).ConfigureAwait(false);
            return result.Epoch;
        }

        /// <inheritdoc />
        public async Task<ClaimResult> TryClaimWithinLimitAsync(string runId, string nodeId, string nodeName, DateTime leaseExpiresUtc, string deploymentId, int maxConcurrentRuns, CancellationToken token = default)
        {
            return await TryClaimWithinLimitAsync(runId, nodeId, nodeName, leaseExpiresUtc, deploymentId, maxConcurrentRuns, null, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<ClaimResult> TryClaimWithinLimitAsync(string runId, string nodeId, string nodeName, DateTime leaseExpiresUtc, string deploymentId, int maxConcurrentRuns, IReadOnlyCollection<string>? waitingAncestorIds, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            if (String.IsNullOrEmpty(nodeId)) throw new ArgumentNullException(nameof(nodeId));
            if (String.IsNullOrEmpty(deploymentId)) throw new ArgumentNullException(nameof(deploymentId));

            ClaimResult result = new ClaimResult();
            // Ancestors of this run in its deployment that wait on a descendant do not count against the limit (P12.38):
            // counting them could leave the deployment full of parents waiting on a child it can never start.
            List<string> ancestors = ChildWaitSql.Distinct(waitingAncestorIds);
            string? lockSql = _Driver.Dialect.TransactionLockStatement();
            long lockKey = AdoDatabaseDriver.LockKey("deployment-claims:" + _Table + ":" + deploymentId);
            string falseValue = _Driver.Dialect.BooleanLiteral(false);
            string trueValue = _Driver.Dialect.BooleanLiteral(true);
            string requirementsMatch = "((capisolation = 0 AND capegresscontrol = " + falseValue
                + " AND capfilesystemsnapshot = " + falseValue + " AND capsessioncontinuation = " + falseValue
                + " AND capcrossnoderestore = " + falseValue + " AND capcoldstartclass IS NULL) OR EXISTS (SELECT 1 FROM "
                + _Driver.Table("node_executors") + " nc WHERE nc.nodeid = @node AND nc.capreported = " + trueValue
                + " AND nc.executor = " + _Table + ".executor AND nc.capisolation >= " + _Table + ".capisolation"
                + " AND (" + _Table + ".capegresscontrol = " + falseValue + " OR nc.capegresscontrol = " + trueValue + ")"
                + " AND (" + _Table + ".capfilesystemsnapshot = " + falseValue + " OR nc.capfilesystemsnapshot = " + trueValue + ")"
                + " AND (" + _Table + ".capsessioncontinuation = " + falseValue + " OR nc.capsessioncontinuation = " + trueValue + ")"
                + " AND (" + _Table + ".capcrossnoderestore = " + falseValue + " OR nc.capcrossnoderestore = " + trueValue + ")"
                + " AND (" + _Table + ".capcoldstartclass IS NULL OR nc.capcoldstartclass = " + _Table + ".capcoldstartclass OR (" + _Table + ".capcoldstartclass = 'Warm' AND nc.capwarmstart = " + trueValue + "))))";
            string claimSql =
                "UPDATE " + _Table + " SET status = 'Leased', leasenodeid = @node, leasenodename = @nodename, leaseepoch = leaseepoch + 1, leaseexpiresutc = @expires, leasedutc = @now, lastupdateutc = @now " +
                "WHERE id = @id AND status = 'Queued' AND " + requirementsMatch + " AND (@max <= 0 OR (SELECT COUNT(*) FROM " + _Table + " a WHERE a.deploymentid = @deploymentid AND a.status IN ('Leased', 'Running', 'Cancelling')"
                + ChildWaitSql.ExcludeWaitingAncestors(_Driver, "a", ancestors.Count) + ") < @max);";

            // Postgresql locks the run row first and skips a row another claim holds (P10.24): concurrent claimers that read
            // the same candidate window move on to the next candidate at once instead of queueing behind the tenant and
            // deployment locks of a claim they are going to lose. Sqlite serializes writers already.
            string? skipLocked = _Driver.Dialect.SkipLockedClause();
            string candidateSql = "SELECT * FROM " + _Table + " WHERE id = @id AND status = 'Queued'" + (skipLocked ?? String.Empty) + ";";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                result = new ClaimResult();
                List<Run> candidates = await AdoDatabaseDriver.QueryAsync(connection, transaction, candidateSql, c => AdoDatabaseDriver.Add(c, "id", runId), Map, ct).ConfigureAwait(false);
                if (candidates.Count == 0) return;
                QuotaExceededException? refusal = await QuotaAccountingSql.LockAndCheckAsync(_Driver, connection, transaction, candidates[0], false, ct).ConfigureAwait(false);
                if (refusal != null)
                {
                    result.QuotaId = refusal.QuotaId;
                    result.QuotaLimit = refusal.LimitName;
                    return;
                }

                // Serialize claims for this deployment so the count below sees every committed claim (READ COMMITTED takes
                // a new snapshot per statement, after the lock is granted). Sqlite already has a single writer. A deployment
                // without a concurrency limit has no count to protect, so its claims do not wait on each other.
                if (lockSql != null && maxConcurrentRuns > 0)
                {
                    long lockStart = Stopwatch.GetTimestamp();
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, lockSql, command => AdoDatabaseDriver.Add(command, "key", lockKey), ct).ConfigureAwait(false);
                    GarrisonMetrics.Observe(GarrisonMetricCatalog.DeploymentLockWait, GarrisonMetrics.SecondsSince(lockStart));
                }

                DateTime now = DateTime.UtcNow;
                int affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, claimSql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", runId);
                    AdoDatabaseDriver.Add(command, "node", nodeId);
                    AdoDatabaseDriver.Add(command, "nodename", nodeName);
                    AdoDatabaseDriver.Add(command, "expires", leaseExpiresUtc);
                    AdoDatabaseDriver.Add(command, "now", now);
                    AdoDatabaseDriver.Add(command, "deploymentid", deploymentId);
                    AdoDatabaseDriver.Add(command, "max", maxConcurrentRuns);
                    ChildWaitSql.BindAncestors(command, ancestors);
                }, ct).ConfigureAwait(false);

                List<ClaimProbeRow> rows = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                    "SELECT status, leaseepoch FROM " + _Table + " WHERE id = @id;",
                    command => AdoDatabaseDriver.Add(command, "id", runId),
                    reader =>
                    {
                        ClaimProbeRow row = new ClaimProbeRow();
                        row.Status = AdoConverters.Str(reader, "status");
                        row.Epoch = AdoConverters.Long(reader, "leaseepoch");
                        return row;
                    },
                    ct).ConfigureAwait(false);

                if (affected == 1 && rows.Count > 0) result.Epoch = rows[0].Epoch;
                else if (rows.Count > 0 && rows[0].Status == "Queued") result.LimitReached = true;
            }, token).ConfigureAwait(false);
            return result;
        }

        /// <inheritdoc />
        public async Task<List<Run>> ListFinishedBeforeAsync(DateTime olderThanUtc, int limit, CancellationToken token = default)
        {
            List<Run> runs = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status IN ('Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected') AND completedutc < @cutoff AND (pipelinerunid IS NULL OR pipelinerunid NOT IN (SELECT id FROM " + _Driver.Table("pipeline_runs") + " WHERE status IN ('Running', 'AwaitingReview', 'Cancelling'))) ORDER BY completedutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 1000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
            foreach (Run run in runs) await LoadChildrenAsync(run, token).ConfigureAwait(false);
            return runs;
        }

        /// <inheritdoc />
        public async Task<bool> PurgeAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            string events = _Driver.Table("run_events");
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await QuotaAccountingSql.SnapshotBeforeDeleteAsync(_Driver, connection, transaction, id, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + events + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Driver.Table("approvals") + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Driver.Table("effect_operations") + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Driver.Table("run_checkpoints") + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Driver.Table("effect_checkpoints") + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Driver.Table("run_database_usage") + " WHERE runid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await DeleteChildrenAsync(connection, transaction, id, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<long> CountActiveByDeploymentAsync(string deploymentId, CancellationToken token = default)
        {
            return await CountActiveByDeploymentAsync(deploymentId, null, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<long> CountActiveByDeploymentAsync(string deploymentId, IReadOnlyCollection<string>? waitingAncestorIds, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(deploymentId)) throw new ArgumentNullException(nameof(deploymentId));
            List<string> ancestors = ChildWaitSql.Distinct(waitingAncestorIds);
            object? count = await _Driver.ScalarAsync(
                "SELECT COUNT(*) FROM " + _Table + " a WHERE a.deploymentid = @deploymentid AND a.status IN ('Leased', 'Running', 'Cancelling')" + ChildWaitSql.ExcludeWaitingAncestors(_Driver, "a", ancestors.Count) + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "deploymentid", deploymentId);
                    ChildWaitSql.BindAncestors(command, ancestors);
                },
                token).ConfigureAwait(false);
            return count == null ? 0 : Convert.ToInt64(count);
        }

        /// <inheritdoc />
        public async Task<ChildWaitAdmission> BeginChildWaitAsync(ChildWaitRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (String.IsNullOrEmpty(request.TenantId)) throw new ArgumentException("A tenant is required.", nameof(request));
            if (String.IsNullOrEmpty(request.ParentRunId)) throw new ArgumentException("A parent run is required.", nameof(request));
            if (String.IsNullOrEmpty(request.ChildRunId)) throw new ArgumentException("A child run is required.", nameof(request));
            return await ChildWaitSql.BeginAsync(_Driver, request, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> UpdateChildWaitAsync(string waitId, string childRunId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(waitId)) throw new ArgumentNullException(nameof(waitId));
            if (String.IsNullOrEmpty(childRunId)) throw new ArgumentNullException(nameof(childRunId));
            int affected = await _Driver.NonQueryAsync("UPDATE " + ChildWaitSql.Table(_Driver) + " SET childrunid = @child WHERE id = @id;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", waitId);
                AdoDatabaseDriver.Add(command, "child", childRunId);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> EndChildWaitAsync(string waitId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(waitId)) throw new ArgumentNullException(nameof(waitId));
            int affected = await _Driver.NonQueryAsync("DELETE FROM " + ChildWaitSql.Table(_Driver) + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", waitId), token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> IsWaitedChildAsync(string tenantId, string runId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            object? count = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + " WHERE tenantid = @tenant AND id = @id AND status = @queued AND " + ChildWaitSql.RunIsWaitedOn(_Driver, _Table + ".id") + ";", command =>
            {
                AdoDatabaseDriver.Add(command, "tenant", tenantId);
                AdoDatabaseDriver.Add(command, "id", runId);
                AdoDatabaseDriver.Add(command, "queued", RunStatusEnum.Queued.ToString());
            }, token).ConfigureAwait(false);
            return count != null && Convert.ToInt64(count) > 0;
        }

        /// <inheritdoc />
        public async Task<long> CountWaitingOnNodeAsync(string nodeId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(nodeId)) throw new ArgumentNullException(nameof(nodeId));
            object? count = await _Driver.ScalarAsync(ChildWaitSql.WaitingOnNodeQuery(_Driver), command => AdoDatabaseDriver.Add(command, "node", nodeId), token).ConfigureAwait(false);
            return count == null ? 0 : Convert.ToInt64(count);
        }

        /// <inheritdoc />
        public async Task<long> CountQueuedWaitedChildrenAsync(CancellationToken token = default)
        {
            object? count = await _Driver.ScalarAsync(ChildWaitSql.QueuedWaitedChildrenQuery(_Driver), null, token).ConfigureAwait(false);
            return count == null ? 0 : Convert.ToInt64(count);
        }

        /// <inheritdoc />
        public async Task<int> PruneChildWaitsAsync(DateTime orphanedBeforeUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync(ChildWaitSql.PruneStatement(_Driver), command => AdoDatabaseDriver.Add(command, "cutoff", orphanedBeforeUtc), token).ConfigureAwait(false);
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
            if (transition.ConversationFallback.HasValue) sets.Add("conversationfallbackreason = @fallback, resumesessionid = NULL, affinitynodeid = NULL, affinityuntilutc = NULL");

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
                if (transition.ConversationFallback.HasValue) AdoDatabaseDriver.Add(command, "fallback", transition.ConversationFallback.Value.ToString());
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
                "outputschemavalid = @outputschemavalid, schemavalidationerrors = @schemavalidationerrors, repairattempts = @repairattempts, " +
                "firsttokenutc = @firsttokenutc, lasttokenutc = @lasttokenutc, ttftms = @ttftms, streamingms = @streamingms, executionms = @executionms, " +
                "queuems = @queuems, totalms = @totalms, delegationwaitms = @delegationwaitms, ttftexcldelegationms = @ttftexcldelegationms, leaseexpiresutc = NULL, lastupdateutc = @now " +
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
        public async Task<bool> RecordRepairAsync(Run run, string nodeId, long epoch, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (String.IsNullOrEmpty(nodeId)) throw new ArgumentNullException(nameof(nodeId));

            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = 'Running', resulttext = @result, structuredoutputjson = @structured, sessionid = @session, servedmodel = @model, " +
                "exitcode = @exitcode, stderrtail = @stderr, inputtokens = @input, outputtokens = @output, cachedtokens = @cached, costusd = @cost, costestimated = @estimated, " +
                "reasoningtokens = @reasoningtokens, toolcallcount = @toolcallcount, outputschemavalid = @outputschemavalid, schemavalidationerrors = @schemavalidationerrors, " +
                "repairattempts = @repairattempts, firsttokenutc = @firsttokenutc, lasttokenutc = @lasttokenutc, ttftms = @ttftms, streamingms = @streamingms, " +
                "executionms = @executionms, queuems = @queuems, totalms = @totalms, delegationwaitms = @delegationwaitms, ttftexcldelegationms = @ttftexcldelegationms, deadlineutc = @deadline, lastupdateutc = @now " +
                "WHERE id = @id AND leasenodeid = @node AND leaseepoch = @epoch AND status IN ('Leased', 'Running') AND cancelrequested = @false;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", run.Id);
                    AdoDatabaseDriver.Add(command, "node", nodeId);
                    AdoDatabaseDriver.Add(command, "epoch", epoch);
                    AdoDatabaseDriver.Add(command, "false", false);
                    AdoDatabaseDriver.Add(command, "result", run.ResultText);
                    AdoDatabaseDriver.Add(command, "structured", run.StructuredOutputJson);
                    AdoDatabaseDriver.Add(command, "session", run.SessionId);
                    AdoDatabaseDriver.Add(command, "model", run.ServedModel);
                    AdoDatabaseDriver.Add(command, "exitcode", run.ExitCode);
                    AdoDatabaseDriver.Add(command, "stderr", run.StderrTail);
                    AdoDatabaseDriver.Add(command, "input", run.InputTokens);
                    AdoDatabaseDriver.Add(command, "output", run.OutputTokens);
                    AdoDatabaseDriver.Add(command, "cached", run.CachedTokens);
                    AdoDatabaseDriver.Add(command, "cost", run.CostUsd);
                    AdoDatabaseDriver.Add(command, "estimated", run.CostEstimated);
                    AddTelemetry(command, run);
                    AdoDatabaseDriver.Add(command, "deadline", run.DeadlineUtc);
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
        public async Task<bool> ExtendDeadlineAsync(string runId, long epoch, DateTime deadlineUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET deadlineutc = @deadline WHERE id = @id AND leaseepoch = @epoch AND status IN ('Leased', 'Running', 'Cancelling');",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", runId);
                    AdoDatabaseDriver.Add(command, "epoch", epoch);
                    AdoDatabaseDriver.Add(command, "deadline", deadlineUtc);
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
        public async Task<Run?> ReadByPipelineExecutionAsync(string tenantId, string pipelineRunId, int position, int execution, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(pipelineRunId)) throw new ArgumentNullException(nameof(pipelineRunId));

            Run? run = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND pipelinerunid = @pipelinerunid AND pipelineposition = @position AND pipelineexecution = @execution;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "pipelinerunid", pipelineRunId);
                    AdoDatabaseDriver.Add(command, "position", position);
                    AdoDatabaseDriver.Add(command, "execution", execution);
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
            if (!String.IsNullOrEmpty(filter.ConversationId)) clauses.Add("conversationid = @conversationid");
            if (!String.IsNullOrEmpty(filter.PipelineRunId)) clauses.Add("pipelinerunid = @pipelinerunid");
            if (!String.IsNullOrEmpty(filter.TriggerId)) clauses.Add("triggerid = @triggerid");
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
                if (!String.IsNullOrEmpty(filter.ConversationId)) AdoDatabaseDriver.Add(command, "conversationid", filter.ConversationId);
                if (!String.IsNullOrEmpty(filter.PipelineRunId)) AdoDatabaseDriver.Add(command, "pipelinerunid", filter.PipelineRunId);
                if (!String.IsNullOrEmpty(filter.TriggerId)) AdoDatabaseDriver.Add(command, "triggerid", filter.TriggerId);
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
                "inputtokens, outputtokens, cachedtokens, costusd, reasoningtokens, toolcallcount, ttftms, streamingms, executionms, queuems, totalms, delegationwaitms, ttftexcldelegationms, createdutc " +
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
        public async Task<List<StatusCount>> CountUnfinishedAsync(CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT status, COUNT(*) AS total FROM " + _Table + " WHERE status IN ('Pending', 'Queued', 'Leased', 'Running', 'Cancelling') GROUP BY status;",
                null,
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
        public async Task<List<RunGaugeRow>> CountUnfinishedByAgentAsync(CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT tenantid, agentname, harnesstype, status, COUNT(*) AS total FROM " + _Table + " WHERE status IN ('Pending', 'Queued', 'Leased', 'Running', 'Cancelling') GROUP BY tenantid, agentname, harnesstype, status;",
                null,
                reader =>
                {
                    RunGaugeRow row = new RunGaugeRow();
                    row.TenantId = AdoConverters.Str(reader, "tenantid");
                    row.AgentName = AdoConverters.Str(reader, "agentname");
                    row.HarnessType = AdoConverters.Enum<HarnessTypeEnum>(reader, "harnesstype", HarnessTypeEnum.Generic);
                    row.Status = AdoConverters.Str(reader, "status");
                    row.Count = AdoConverters.Long(reader, "total");
                    return row;
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
        public async Task<bool> AdjustPendingApprovalsAsync(string runId, int delta, long addWaitMs, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            string set = delta >= 0
                ? "pendingapprovals = pendingapprovals + @delta"
                : "pendingapprovals = CASE WHEN pendingapprovals + @delta < 0 THEN 0 ELSE pendingapprovals + @delta END";
            if (addWaitMs > 0) set += ", approvalwaitms = COALESCE(approvalwaitms, 0) + @wait";
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET " + set + " WHERE id = @id;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", runId);
                    AdoDatabaseDriver.Add(command, "delta", delta);
                    if (addWaitMs > 0) AdoDatabaseDriver.Add(command, "wait", addWaitMs);
                },
                token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<int> PruneFinishedAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            List<string> ids = await _Driver.QueryAsync(
                "SELECT id FROM " + _Table + " WHERE status IN ('Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected') AND completedutc < @cutoff AND (pipelinerunid IS NULL OR pipelinerunid NOT IN (SELECT id FROM " + _Driver.Table("pipeline_runs") + " WHERE status IN ('Running', 'AwaitingReview', 'Cancelling')))" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc);
                    AdoDatabaseDriver.Add(command, "max", 500);
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                reader => AdoConverters.Str(reader, "id"),
                token).ConfigureAwait(false);

            foreach (string id in ids) await PurgeAsync(id, token).ConfigureAwait(false);
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
        public async Task<List<Run>> ListActiveStartedBeforeAsync(DateTime startedBeforeUtc, int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status IN ('Leased', 'Running', 'Cancelling') AND COALESCE(startedutc, leasedutc) IS NOT NULL AND COALESCE(startedutc, leasedutc) < @before ORDER BY COALESCE(startedutc, leasedutc) ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "before", startedBeforeUtc);
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
            string sql = "INSERT INTO " + _Table + " (id, tenantid, agentid, agentname, deploymentid, deploymentversion, harnesstype, nodepoolid, executor, capisolation, capegresscontrol, capfilesystemsnapshot, capsessioncontinuation, capcrossnoderestore, capcoldstartclass, trustlevel, effectpolicy, kind, status, outcome, priority, inputtext, inputcontenttype, callertype, callerid, callername, parentrunid, rootrunid, depth, callchain, idempotencykey, retryofrunid, attempt, maxattempts, leasenodeid, leasenodename, leaseepoch, leaseexpiresutc, queuedutc, leasedutc, startedutc, completedutc, deadlineutc, cancelrequested, resulttext, structuredoutputjson, sessionid, servedmodel, exitcode, stderrtail, errormessage, inputtokens, outputtokens, cachedtokens, costusd, costestimated, reasoningtokens, toolcallcount, outputschemavalid, schemavalidationerrors, repairattempts, firsttokenutc, lasttokenutc, ttftms, streamingms, executionms, queuems, totalms, delegationwaitms, ttftexcldelegationms, lasteventsequence, active, isprotected, traceid, traceparent, conversationid, conversationturn, resumesessionid, affinitynodeid, affinityuntilutc, conversationfallbackreason, pipelinerunid, pipelineposition, pipelineexecution, triggerid, createdutc, lastupdateutc) VALUES (@id, @tenantid, @agentid, @agentname, @deploymentid, @deploymentversion, @harnesstype, @nodepoolid, @executor, @capisolation, @capegresscontrol, @capfilesystemsnapshot, @capsessioncontinuation, @capcrossnoderestore, @capcoldstartclass, @trustlevel, @effectpolicy, @kind, @status, @outcome, @priority, @inputtext, @inputcontenttype, @callertype, @callerid, @callername, @parentrunid, @rootrunid, @depth, @callchain, @idempotencykey, @retryofrunid, @attempt, @maxattempts, @leasenodeid, @leasenodename, @leaseepoch, @leaseexpiresutc, @queuedutc, @leasedutc, @startedutc, @completedutc, @deadlineutc, @cancelrequested, @resulttext, @structuredoutputjson, @sessionid, @servedmodel, @exitcode, @stderrtail, @errormessage, @inputtokens, @outputtokens, @cachedtokens, @costusd, @costestimated, @reasoningtokens, @toolcallcount, @outputschemavalid, @schemavalidationerrors, @repairattempts, @firsttokenutc, @lasttokenutc, @ttftms, @streamingms, @executionms, @queuems, @totalms, @delegationwaitms, @ttftexcldelegationms, @lasteventsequence, @active, @isprotected, @traceid, @traceparent, @conversationid, @conversationturn, @resumesessionid, @affinitynodeid, @affinityuntilutc, @conversationfallbackreason, @pipelinerunid, @pipelineposition, @pipelineexecution, @triggerid, @createdutc, @lastupdateutc);";
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
                AdoDatabaseDriver.Add(command, "executor", obj.Executor.ToString());
                ExecutorCapabilitySql.Bind(command, obj.RequiredCapabilities);
                AdoDatabaseDriver.Add(command, "trustlevel", obj.TrustLevel.ToString());
                AdoDatabaseDriver.Add(command, "effectpolicy", obj.EffectPolicy.ToString());
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
                AdoDatabaseDriver.Add(command, "traceid", obj.TraceId);
                AdoDatabaseDriver.Add(command, "traceparent", obj.TraceParent);
                AddConversation(command, obj);
                AdoDatabaseDriver.Add(command, "pipelinerunid", obj.PipelineRunId);
                AdoDatabaseDriver.Add(command, "pipelineposition", obj.PipelinePosition);
                AdoDatabaseDriver.Add(command, "pipelineexecution", obj.PipelineExecution);
                AdoDatabaseDriver.Add(command, "triggerid", obj.TriggerId);
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
            obj.DelegationWaitMs = AdoConverters.NullableLong(reader, "delegationwaitms");
            obj.TimeToFirstTokenExcludingDelegationMs = AdoConverters.NullableLong(reader, "ttftexcldelegationms");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return obj;
        }

        private static void AddTelemetry(DbCommand command, Run obj)
        {
            AdoDatabaseDriver.Add(command, "outputschemavalid", obj.OutputSchemaValid);
            AdoDatabaseDriver.Add(command, "schemavalidationerrors", obj.SchemaValidationErrors);
            AdoDatabaseDriver.Add(command, "repairattempts", obj.RepairAttempts);
            AdoDatabaseDriver.Add(command, "reasoningtokens", obj.ReasoningTokens);
            AdoDatabaseDriver.Add(command, "toolcallcount", obj.ToolCallCount);
            AdoDatabaseDriver.Add(command, "firsttokenutc", obj.FirstTokenUtc);
            AdoDatabaseDriver.Add(command, "lasttokenutc", obj.LastTokenUtc);
            AdoDatabaseDriver.Add(command, "ttftms", obj.TimeToFirstTokenMs);
            AdoDatabaseDriver.Add(command, "streamingms", obj.StreamingMs);
            AdoDatabaseDriver.Add(command, "executionms", obj.ExecutionMs);
            AdoDatabaseDriver.Add(command, "queuems", obj.QueueMs);
            AdoDatabaseDriver.Add(command, "totalms", obj.TotalMs);
            AdoDatabaseDriver.Add(command, "delegationwaitms", obj.DelegationWaitMs);
            AdoDatabaseDriver.Add(command, "ttftexcldelegationms", obj.TimeToFirstTokenExcludingDelegationMs);
        }

        private static void AddConversation(DbCommand command, Run obj)
        {
            AdoDatabaseDriver.Add(command, "conversationid", obj.ConversationId);
            AdoDatabaseDriver.Add(command, "conversationturn", obj.ConversationTurn);
            AdoDatabaseDriver.Add(command, "resumesessionid", obj.ResumeSessionId);
            AdoDatabaseDriver.Add(command, "affinitynodeid", obj.AffinityNodeId);
            AdoDatabaseDriver.Add(command, "affinityuntilutc", obj.AffinityUntilUtc);
            AdoDatabaseDriver.Add(command, "conversationfallbackreason", obj.ConversationFallbackReason?.ToString());
        }

        private static void MapConversation(DbDataReader reader, Run obj)
        {
            obj.ConversationId = AdoConverters.NullableStr(reader, "conversationid");
            obj.ConversationTurn = Math.Max(0, AdoConverters.Int(reader, "conversationturn"));
            obj.ResumeSessionId = AdoConverters.NullableStr(reader, "resumesessionid");
            obj.AffinityNodeId = AdoConverters.NullableStr(reader, "affinitynodeid");
            obj.AffinityUntilUtc = AdoConverters.NullableDate(reader, "affinityuntilutc");
            obj.ConversationFallbackReason = AdoConverters.NullableEnum<ConversationFallbackReasonEnum>(reader, "conversationfallbackreason");
            obj.PipelineRunId = AdoConverters.NullableStr(reader, "pipelinerunid");
            obj.PipelinePosition = Math.Max(0, AdoConverters.Int(reader, "pipelineposition"));
            obj.PipelineExecution = Math.Max(0, AdoConverters.Int(reader, "pipelineexecution"));
            obj.TriggerId = AdoConverters.NullableStr(reader, "triggerid");
        }

        private static void MapTelemetry(DbDataReader reader, Run obj)
        {
            obj.OutputSchemaValid = AdoConverters.NullableBool(reader, "outputschemavalid");
            obj.SchemaValidationErrors = AdoConverters.NullableStr(reader, "schemavalidationerrors");
            obj.RepairAttempts = Math.Max(0, AdoConverters.Int(reader, "repairattempts"));
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
            obj.DelegationWaitMs = AdoConverters.NullableLong(reader, "delegationwaitms");
            obj.TimeToFirstTokenExcludingDelegationMs = AdoConverters.NullableLong(reader, "ttftexcldelegationms");
            obj.PendingApprovals = AdoConverters.Int(reader, "pendingapprovals");
            obj.ApprovalWaitMs = AdoConverters.NullableLong(reader, "approvalwaitms");
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
