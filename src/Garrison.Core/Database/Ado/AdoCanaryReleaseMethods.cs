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
    /// Provider-neutral canary release data access (AA9.2). Steps live in a child table keyed by release and position.
    /// Thread-safe.
    /// </summary>
    public class AdoCanaryReleaseMethods : ICanaryReleaseMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, agentid, candidatedeploymentid, baselinedeploymentid, baselineinitialweight, candidateinitialweight, currentstepindex, stepstartedutc, maxerrorratepercent, minevalscore, evalsetid, status, rollbackreason, createdbytype, createdbyid, createdbyname, createdutc, completedutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Releases;
        private readonly string _Steps;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoCanaryReleaseMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Releases = driver.Table("canary_releases");
            _Steps = driver.Table("canary_release_steps");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<CanaryRelease> CreateAsync(CanaryRelease obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                if (obj.Status == CanaryStatusEnum.Running)
                {
                    List<string> running = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT id FROM " + _Releases + " WHERE tenantid = @tenantid AND agentid = @agentid AND status = @running;", command =>
                    {
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
                        AdoDatabaseDriver.Add(command, "running", CanaryStatusEnum.Running.ToString());
                    }, reader => AdoConverters.Str(reader, "id"), ct).ConfigureAwait(false);
                    if (running.Count > 0) throw new ConflictException("CanaryAlreadyRunning", "Agent " + obj.AgentId + " already has a running canary release (" + running[0] + ").");
                }
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Releases + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), ct).ConfigureAwait(false);
                for (int i = 0; i < obj.Steps.Count; i++)
                {
                    CanaryReleaseStep step = obj.Steps[i];
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Steps + " (releaseid, tenantid, position, weightpercent, minimumruns, minimumminutes) VALUES (@releaseid, @tenantid, @position, @weightpercent, @minimumruns, @minimumminutes);", command =>
                    {
                        AdoDatabaseDriver.Add(command, "releaseid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", i);
                        AdoDatabaseDriver.Add(command, "weightpercent", step.WeightPercent);
                        AdoDatabaseDriver.Add(command, "minimumruns", step.MinimumRuns);
                        AdoDatabaseDriver.Add(command, "minimumminutes", step.MinimumMinutes);
                    }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<CanaryRelease?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            List<CanaryRelease> found = await ListAsync("SELECT * FROM " + _Releases + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, token).ConfigureAwait(false);
            return found.FirstOrDefault();
        }

        /// <inheritdoc />
        public async Task<CanaryRelease> UpdateAsync(CanaryRelease obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.NonQueryAsync(
                "UPDATE " + _Releases + " SET currentstepindex = @currentstepindex, stepstartedutc = @stepstartedutc, status = @status, rollbackreason = @rollbackreason, completedutc = @completedutc, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> AdvanceStepAsync(string tenantId, string id, int expectedIndex, DateTime utc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Releases + " SET currentstepindex = @next, stepstartedutc = @utc, lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid AND status = @running AND currentstepindex = @expected;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "next", expectedIndex + 1);
                    AdoDatabaseDriver.Add(command, "utc", utc);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "running", CanaryStatusEnum.Running.ToString());
                    AdoDatabaseDriver.Add(command, "expected", expectedIndex);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> TransitionAsync(string tenantId, string id, CanaryStatusEnum expected, CanaryStatusEnum next, string? rollbackReason, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            List<string> sets = new List<string> { "status = @next", "lastupdateutc = @now" };
            if (next != CanaryStatusEnum.Running) sets.Add("completedutc = @now");
            if (rollbackReason != null) sets.Add("rollbackreason = @rollbackreason");
            int affected = await _Driver.NonQueryAsync("UPDATE " + _Releases + " SET " + String.Join(", ", sets) + " WHERE id = @id AND tenantid = @tenantid AND status = @expected;", command =>
            {
                AdoDatabaseDriver.Add(command, "next", next.ToString());
                AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                if (rollbackReason != null) AdoDatabaseDriver.Add(command, "rollbackreason", rollbackReason);
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "expected", expected.ToString());
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<CanaryRelease>> EnumerateAsync(string tenantId, string? agentId, CanaryStatusEnum? status, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(agentId)) clauses.Add("agentid = @agentid");
            if (status.HasValue) clauses.Add("status = @status");
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(agentId)) AdoDatabaseDriver.Add(command, "agentid", agentId);
                if (status.HasValue) AdoDatabaseDriver.Add(command, "status", status.Value.ToString());
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Releases + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue, CultureInfo.InvariantCulture);
            List<CanaryRelease> releases = await ListAsync("SELECT * FROM " + _Releases + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, token).ConfigureAwait(false);
            return EnumerationResult<CanaryRelease>.Build(query, total, releases);
        }

        /// <inheritdoc />
        public async Task<CanaryRelease?> ReadRunningForAgentAsync(string tenantId, string agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            List<CanaryRelease> found = await ListAsync("SELECT * FROM " + _Releases + " WHERE tenantid = @tenantid AND agentid = @agentid AND status = @running ORDER BY createdutc ASC, id ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "agentid", agentId);
                AdoDatabaseDriver.Add(command, "running", CanaryStatusEnum.Running.ToString());
            }, token).ConfigureAwait(false);
            return found.FirstOrDefault();
        }

        /// <inheritdoc />
        public async Task<CanaryRelease?> ReadRunningForDeploymentAsync(string tenantId, string deploymentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(deploymentId)) throw new ArgumentNullException(nameof(deploymentId));
            List<CanaryRelease> found = await ListAsync("SELECT * FROM " + _Releases + " WHERE tenantid = @tenantid AND status = @running AND (candidatedeploymentid = @deploymentid OR baselinedeploymentid = @deploymentid) ORDER BY createdutc ASC, id ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "deploymentid", deploymentId);
                AdoDatabaseDriver.Add(command, "running", CanaryStatusEnum.Running.ToString());
            }, token).ConfigureAwait(false);
            return found.FirstOrDefault();
        }

        /// <inheritdoc />
        public async Task<List<CanaryRelease>> ListRunningAsync(int maxResults, CancellationToken token = default)
        {
            int max = Math.Clamp(maxResults, 1, 10000);
            List<CanaryRelease> releases = await _Driver.QueryAsync("SELECT * FROM " + _Releases + " WHERE status = @running ORDER BY createdutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                AdoDatabaseDriver.Add(command, "running", CanaryStatusEnum.Running.ToString());
                AdoDatabaseDriver.Add(command, "max", max);
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, Map, token).ConfigureAwait(false);
            foreach (IGrouping<string, CanaryRelease> tenant in releases.GroupBy(r => r.TenantId, StringComparer.Ordinal))
            {
                await LoadStepsAsync(tenant.ToList(), token).ConfigureAwait(false);
            }
            return releases;
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
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Steps + " WHERE releaseid = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Releases + " WHERE id = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        #endregion

        #region Private-Methods

        /// <summary>
        /// Map a canary_releases row, without its steps.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>Release.</returns>
        public static CanaryRelease Map(DbDataReader reader)
        {
            CanaryRelease obj = new CanaryRelease();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.AgentId = AdoConverters.Str(reader, "agentid");
            obj.CandidateDeploymentId = AdoConverters.Str(reader, "candidatedeploymentid");
            obj.BaselineDeploymentId = AdoConverters.Str(reader, "baselinedeploymentid");
            obj.BaselineInitialWeight = AdoConverters.Int(reader, "baselineinitialweight");
            obj.CandidateInitialWeight = AdoConverters.Int(reader, "candidateinitialweight");
            obj.CurrentStepIndex = AdoConverters.Int(reader, "currentstepindex");
            obj.StepStartedUtc = AdoConverters.NullableDate(reader, "stepstartedutc");
            obj.MaxErrorRatePercent = AdoConverters.Double(reader, "maxerrorratepercent");
            obj.MinEvalScore = AdoConverters.NullableDouble(reader, "minevalscore");
            obj.EvalSetId = AdoConverters.NullableStr(reader, "evalsetid");
            obj.Status = AdoConverters.Enum(reader, "status", CanaryStatusEnum.Running);
            obj.RollbackReason = AdoConverters.NullableStr(reader, "rollbackreason");
            obj.CreatedByType = AdoConverters.Enum(reader, "createdbytype", PrincipalTypeEnum.User);
            obj.CreatedById = AdoConverters.NullableStr(reader, "createdbyid");
            obj.CreatedByName = AdoConverters.NullableStr(reader, "createdbyname");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.CompletedUtc = AdoConverters.NullableDate(reader, "completedutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        private static void Bind(DbCommand command, CanaryRelease obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
            AdoDatabaseDriver.Add(command, "candidatedeploymentid", obj.CandidateDeploymentId);
            AdoDatabaseDriver.Add(command, "baselinedeploymentid", obj.BaselineDeploymentId);
            AdoDatabaseDriver.Add(command, "baselineinitialweight", obj.BaselineInitialWeight);
            AdoDatabaseDriver.Add(command, "candidateinitialweight", obj.CandidateInitialWeight);
            AdoDatabaseDriver.Add(command, "currentstepindex", obj.CurrentStepIndex);
            AdoDatabaseDriver.Add(command, "stepstartedutc", obj.StepStartedUtc);
            AdoDatabaseDriver.Add(command, "maxerrorratepercent", obj.MaxErrorRatePercent);
            AdoDatabaseDriver.Add(command, "minevalscore", obj.MinEvalScore);
            AdoDatabaseDriver.Add(command, "evalsetid", obj.EvalSetId);
            AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
            AdoDatabaseDriver.Add(command, "rollbackreason", obj.RollbackReason);
            AdoDatabaseDriver.Add(command, "createdbytype", obj.CreatedByType.ToString());
            AdoDatabaseDriver.Add(command, "createdbyid", obj.CreatedById);
            AdoDatabaseDriver.Add(command, "createdbyname", obj.CreatedByName);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "completedutc", obj.CompletedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private async Task<List<CanaryRelease>> ListAsync(string sql, Action<DbCommand> bind, CancellationToken token)
        {
            List<CanaryRelease> releases = await _Driver.QueryAsync(sql, bind, Map, token).ConfigureAwait(false);
            await LoadStepsAsync(releases, token).ConfigureAwait(false);
            return releases;
        }

        private async Task LoadStepsAsync(List<CanaryRelease> releases, CancellationToken token)
        {
            if (releases.Count == 0) return;
            Dictionary<string, CanaryRelease> byId = releases.ToDictionary(r => r.Id, StringComparer.Ordinal);
            for (int start = 0; start < releases.Count; start += 500)
            {
                List<CanaryRelease> chunk = releases.Skip(start).Take(500).ToList();
                List<string> names = new List<string>();
                for (int i = 0; i < chunk.Count; i++) names.Add("@r" + i.ToString(CultureInfo.InvariantCulture));
                List<CanaryReleaseStepRow> rows = await _Driver.QueryAsync("SELECT releaseid, weightpercent, minimumruns, minimumminutes FROM " + _Steps + " WHERE tenantid = @tenantid AND releaseid IN (" + String.Join(", ", names) + ") ORDER BY releaseid, position;", command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", chunk[0].TenantId);
                    for (int i = 0; i < chunk.Count; i++) AdoDatabaseDriver.Add(command, "r" + i.ToString(CultureInfo.InvariantCulture), chunk[i].Id);
                }, reader => new CanaryReleaseStepRow
                {
                    ReleaseId = AdoConverters.Str(reader, "releaseid"),
                    Step = new CanaryReleaseStep
                    {
                        WeightPercent = AdoConverters.Int(reader, "weightpercent"),
                        MinimumRuns = AdoConverters.Int(reader, "minimumruns"),
                        MinimumMinutes = AdoConverters.Int(reader, "minimumminutes")
                    }
                }, token).ConfigureAwait(false);
                foreach (CanaryReleaseStepRow row in rows)
                {
                    if (byId.TryGetValue(row.ReleaseId, out CanaryRelease? owner)) owner.Steps.Add(row.Step);
                }
            }
        }

        #endregion
    }
}
