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
    /// Provider-neutral permission approval data access (P12.3). Thread-safe.
    /// </summary>
    public class AdoApprovalMethods : IApprovalMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private static readonly string _Columns = "id, tenantid, runid, rootrunid, agentid, agentname, deploymentid, leaseepoch, harnesstype, kind, toolname, toolcallid, inputpreview, summary, suggestedrule, status, decision, decisionsource, ruleid, rulepattern, rememberedruleid, decidedby, decidedbyid, reason, timeoutdecision, requestedutc, decidedutc, expiresutc, createdutc, lastupdateutc, inputdigest, resumeepoch";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoApprovalMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("approvals");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Approval?> TryConsumeResumeGrantAsync(string tenantId, string runId, long epoch, string tool, ApprovalKindEnum kind, string inputDigest, CancellationToken token = default)
        {
            Approval? granted = null;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                int active = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Driver.Table("runs") + " SET lastupdateutc = lastupdateutc WHERE tenantid = @tenant AND id = @run AND leaseepoch = @epoch AND status IN ('Leased','Running') AND leaseexpiresutc > @now AND cancelrequested = " + _Driver.Dialect.BooleanLiteral(false) + ";",
                    command => { AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "run", runId); AdoDatabaseDriver.Add(command, "epoch", epoch); AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow); }, ct).ConfigureAwait(false);
                if (active == 0) return;
                List<Approval> candidates = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                    "SELECT " + _Columns + " FROM " + _Table + " WHERE tenantid = @tenant AND runid = @run AND toolname = @tool AND kind = @kind AND inputdigest = @digest AND resumeepoch IS NULL AND decisionsource = 'User' AND status IN ('Approved','Denied') AND decision IN ('Allow','Deny') AND leaseepoch < @epoch AND leaseepoch = (SELECT epoch FROM " + _Driver.Table("run_checkpoints") + " WHERE tenantid = @tenant AND runid = @run) ORDER BY requestedutc;",
                    command => { AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "run", runId); AdoDatabaseDriver.Add(command, "epoch", epoch); AdoDatabaseDriver.Add(command, "tool", tool); AdoDatabaseDriver.Add(command, "kind", kind.ToString()); AdoDatabaseDriver.Add(command, "digest", inputDigest); }, Map, ct).ConfigureAwait(false);
                if (candidates.Count == 0) return;
                Approval candidate = candidates[0];
                int consumed = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Table + " SET resumeepoch = @epoch, lastupdateutc = @now WHERE tenantid = @tenant AND id = @id AND resumeepoch IS NULL;",
                    command => { AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "id", candidate.Id); AdoDatabaseDriver.Add(command, "epoch", epoch); AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow); }, ct).ConfigureAwait(false);
                if (consumed == 1) { candidate.ResumeEpoch = epoch; granted = candidate; }
            }, token).ConfigureAwait(false);
            return granted;
        }

        /// <inheritdoc />
        public async Task<Approval> CreateAsync(Approval obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.NonQueryAsync("INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "runid", obj.RunId);
                AdoDatabaseDriver.Add(command, "rootrunid", obj.RootRunId);
                AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
                AdoDatabaseDriver.Add(command, "agentname", Truncate(obj.AgentName, 128));
                AdoDatabaseDriver.Add(command, "deploymentid", obj.DeploymentId);
                AdoDatabaseDriver.Add(command, "leaseepoch", obj.LeaseEpoch);
                AdoDatabaseDriver.Add(command, "harnesstype", obj.HarnessType.ToString());
                AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
                AdoDatabaseDriver.Add(command, "toolname", Truncate(obj.ToolName, 256));
                AdoDatabaseDriver.Add(command, "toolcallid", Truncate(obj.ToolCallId, 256));
                AdoDatabaseDriver.Add(command, "inputpreview", obj.InputPreview);
                AdoDatabaseDriver.Add(command, "inputdigest", obj.InputDigest);
                AdoDatabaseDriver.Add(command, "resumeepoch", obj.ResumeEpoch);
                AdoDatabaseDriver.Add(command, "summary", obj.Summary);
                AdoDatabaseDriver.Add(command, "suggestedrule", Truncate(obj.SuggestedRule, 1024));
                AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
                AdoDatabaseDriver.Add(command, "decision", obj.Decision?.ToString());
                AdoDatabaseDriver.Add(command, "decisionsource", obj.DecisionSource?.ToString());
                AdoDatabaseDriver.Add(command, "ruleid", obj.RuleId);
                AdoDatabaseDriver.Add(command, "rulepattern", Truncate(obj.RulePattern, 1024));
                AdoDatabaseDriver.Add(command, "rememberedruleid", obj.RememberedRuleId);
                AdoDatabaseDriver.Add(command, "decidedby", Truncate(obj.DecidedBy, 256));
                AdoDatabaseDriver.Add(command, "decidedbyid", obj.DecidedById);
                AdoDatabaseDriver.Add(command, "reason", obj.Reason);
                AdoDatabaseDriver.Add(command, "timeoutdecision", obj.TimeoutDecision.ToString());
                AdoDatabaseDriver.Add(command, "requestedutc", obj.RequestedUtc);
                AdoDatabaseDriver.Add(command, "decidedutc", obj.DecidedUtc);
                AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Approval?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<Approval?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Approval>> EnumerateAsync(ApprovalFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(filter.TenantId)) clauses.Add("tenantid = @tenantid");
            if (filter.Status.HasValue) clauses.Add("status = @status");
            if (!String.IsNullOrEmpty(filter.RunId)) clauses.Add("runid = @runid");
            if (!String.IsNullOrEmpty(filter.RootRunId)) clauses.Add("(rootrunid = @rootrunid OR runid = @rootrunid)");
            if (!String.IsNullOrEmpty(filter.AgentId)) clauses.Add("agentid = @agentid");
            if (!String.IsNullOrEmpty(filter.DeploymentId)) clauses.Add("deploymentid = @deploymentid");
            if (filter.DecisionSource.HasValue) clauses.Add("decisionsource = @decisionsource");
            if (filter.FromUtc.HasValue) clauses.Add("createdutc >= @fromutc");
            if (filter.ToUtc.HasValue) clauses.Add("createdutc < @toutc");
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(filter.TenantId)) AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (filter.Status.HasValue) AdoDatabaseDriver.Add(command, "status", filter.Status.Value.ToString());
                if (!String.IsNullOrEmpty(filter.RunId)) AdoDatabaseDriver.Add(command, "runid", filter.RunId);
                if (!String.IsNullOrEmpty(filter.RootRunId)) AdoDatabaseDriver.Add(command, "rootrunid", filter.RootRunId);
                if (!String.IsNullOrEmpty(filter.AgentId)) AdoDatabaseDriver.Add(command, "agentid", filter.AgentId);
                if (!String.IsNullOrEmpty(filter.DeploymentId)) AdoDatabaseDriver.Add(command, "deploymentid", filter.DeploymentId);
                if (filter.DecisionSource.HasValue) AdoDatabaseDriver.Add(command, "decisionsource", filter.DecisionSource.Value.ToString());
                if (filter.FromUtc.HasValue) AdoDatabaseDriver.Add(command, "fromutc", filter.FromUtc.Value);
                if (filter.ToUtc.HasValue) AdoDatabaseDriver.Add(command, "toutc", filter.ToUtc.Value);
            };

            EnumerationQuery query = new EnumerationQuery();
            query.Skip = filter.Skip;
            query.MaxResults = filter.MaxResults;
            query.Ordering = filter.Ordering;

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<Approval> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                    AdoDatabaseDriver.Add(command, "skip", query.Skip);
                },
                Map,
                token).ConfigureAwait(false);
            return EnumerationResult<Approval>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<bool> ResolveAsync(ApprovalResolution resolution, CancellationToken token = default)
        {
            if (resolution == null) throw new ArgumentNullException(nameof(resolution));
            if (String.IsNullOrEmpty(resolution.ApprovalId)) throw new ArgumentNullException(nameof(resolution), "An approval identifier is required.");
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = @status, decision = @decision, decisionsource = @source, decidedby = @decidedby, decidedbyid = @decidedbyid, reason = @reason, decidedutc = @decidedutc, lastupdateutc = @decidedutc WHERE id = @id AND status = 'Pending';",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", resolution.ApprovalId);
                    AdoDatabaseDriver.Add(command, "status", resolution.Status.ToString());
                    AdoDatabaseDriver.Add(command, "decision", resolution.Decision.ToString());
                    AdoDatabaseDriver.Add(command, "source", resolution.Source.ToString());
                    AdoDatabaseDriver.Add(command, "decidedby", Truncate(resolution.DecidedBy, 256));
                    AdoDatabaseDriver.Add(command, "decidedbyid", resolution.DecidedById);
                    AdoDatabaseDriver.Add(command, "reason", resolution.Reason);
                    AdoDatabaseDriver.Add(command, "decidedutc", resolution.DecidedUtc);
                },
                token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task SetRememberedRuleAsync(string id, string ruleId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (String.IsNullOrEmpty(ruleId)) throw new ArgumentNullException(nameof(ruleId));
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET rememberedruleid = @ruleid, lastupdateutc = @now WHERE id = @id;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "ruleid", ruleId);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Approval>> ListPendingAsync(int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status = 'Pending' ORDER BY createdutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 10000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Approval>> ListByRunAsync(string runId, int limit, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            return await ListByRunsAsync(new List<string> { runId }, limit, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Approval>> ListByRunsAsync(List<string> runIds, int limit, CancellationToken token = default)
        {
            List<string> ids = (runIds ?? new List<string>()).Where(r => !String.IsNullOrEmpty(r)).Distinct(StringComparer.Ordinal).ToList();
            if (ids.Count == 0) return new List<Approval>();
            List<string> names = new List<string>();
            for (int i = 0; i < ids.Count; i++) names.Add("@r" + i);
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE runid IN (" + String.Join(", ", names) + ") ORDER BY createdutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    for (int i = 0; i < ids.Count; i++) AdoDatabaseDriver.Add(command, "r" + i, ids[i]);
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 10000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<long> CountPendingAsync(string? tenantId, CancellationToken token = default)
        {
            string where = String.IsNullOrEmpty(tenantId) ? " WHERE status = 'Pending'" : " WHERE status = 'Pending' AND tenantid = @tenantid";
            object? value = await _Driver.ScalarAsync(
                "SELECT COUNT(*) FROM " + _Table + where + ";",
                command =>
                {
                    if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                token).ConfigureAwait(false);
            return value == null ? 0 : Convert.ToInt64(value);
        }

        /// <summary>
        /// Map a row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static Approval Map(DbDataReader reader)
        {
            Approval obj = new Approval();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.RunId = AdoConverters.Str(reader, "runid");
            obj.RootRunId = AdoConverters.NullableStr(reader, "rootrunid");
            obj.AgentId = AdoConverters.Str(reader, "agentid");
            obj.AgentName = AdoConverters.Str(reader, "agentname");
            obj.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            obj.LeaseEpoch = AdoConverters.Long(reader, "leaseepoch");
            obj.HarnessType = AdoConverters.Enum<HarnessTypeEnum>(reader, "harnesstype", HarnessTypeEnum.Generic);
            obj.Kind = AdoConverters.Enum<ApprovalKindEnum>(reader, "kind", ApprovalKindEnum.Tool);
            obj.ToolName = AdoConverters.Str(reader, "toolname");
            obj.ToolCallId = AdoConverters.NullableStr(reader, "toolcallid");
            obj.InputPreview = AdoConverters.NullableStr(reader, "inputpreview");
            obj.InputDigest = AdoConverters.NullableStr(reader, "inputdigest");
            obj.ResumeEpoch = AdoConverters.NullableLong(reader, "resumeepoch");
            obj.Summary = AdoConverters.NullableStr(reader, "summary");
            obj.SuggestedRule = AdoConverters.NullableStr(reader, "suggestedrule");
            obj.Status = AdoConverters.Enum<ApprovalStatusEnum>(reader, "status", ApprovalStatusEnum.Pending);
            obj.Decision = AdoConverters.NullableEnum<ApprovalDecisionEnum>(reader, "decision");
            obj.DecisionSource = AdoConverters.NullableEnum<ApprovalSourceEnum>(reader, "decisionsource");
            obj.RuleId = AdoConverters.NullableStr(reader, "ruleid");
            obj.RulePattern = AdoConverters.NullableStr(reader, "rulepattern");
            obj.RememberedRuleId = AdoConverters.NullableStr(reader, "rememberedruleid");
            obj.DecidedBy = AdoConverters.NullableStr(reader, "decidedby");
            obj.DecidedById = AdoConverters.NullableStr(reader, "decidedbyid");
            obj.Reason = AdoConverters.NullableStr(reader, "reason");
            obj.TimeoutDecision = AdoConverters.Enum<ApprovalDecisionEnum>(reader, "timeoutdecision", ApprovalDecisionEnum.Deny);
            obj.RequestedUtc = AdoConverters.Date(reader, "requestedutc");
            obj.DecidedUtc = AdoConverters.NullableDate(reader, "decidedutc");
            obj.ExpiresUtc = AdoConverters.NullableDate(reader, "expiresutc");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static string? Truncate(string? value, int length)
        {
            if (value == null) return null;
            return value.Length > length ? value.Substring(0, length) : value;
        }

        #endregion
    }
}
