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
    /// Provider-neutral shadow trial data access (AA9.2). Thread-safe.
    /// </summary>
    public class AdoShadowTrialMethods : IShadowTrialMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, name, agentid, sourcedeploymentid, candidatedeploymentid, samplepercent, endsutc, comparisonevalsetid, usejudge, status, stopreason, comparedcount, agreedcount, divergedcount, candidatefailurecount, createdbytype, createdbyid, createdbyname, createdutc, completedutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Trials;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoShadowTrialMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Trials = driver.Table("shadow_trials");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<ShadowTrial> CreateAsync(ShadowTrial obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.NonQueryAsync("INSERT INTO " + _Trials + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<ShadowTrial?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Trials + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<ShadowTrial> UpdateAsync(ShadowTrial obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.NonQueryAsync(
                "UPDATE " + _Trials + " SET name = @name, endsutc = @endsutc, comparisonevalsetid = @comparisonevalsetid, usejudge = @usejudge, status = @status, stopreason = @stopreason, completedutc = @completedutc, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> TransitionAsync(string tenantId, string id, ShadowTrialStatusEnum expected, ShadowTrialStatusEnum next, string? stopReason, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            List<string> sets = new List<string> { "status = @next", "lastupdateutc = @now" };
            if (next != ShadowTrialStatusEnum.Running) sets.Add("completedutc = @now");
            if (stopReason != null) sets.Add("stopreason = @stopreason");
            int affected = await _Driver.NonQueryAsync("UPDATE " + _Trials + " SET " + String.Join(", ", sets) + " WHERE id = @id AND tenantid = @tenantid AND status = @expected;", command =>
            {
                AdoDatabaseDriver.Add(command, "next", next.ToString());
                AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                if (stopReason != null) AdoDatabaseDriver.Add(command, "stopreason", stopReason);
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "expected", expected.ToString());
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> IncrementCountsAsync(string tenantId, string id, long compared, long agreed, long diverged, long candidateFailures, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (compared < 0) throw new ArgumentOutOfRangeException(nameof(compared), "Deltas are 0 or more.");
            if (agreed < 0) throw new ArgumentOutOfRangeException(nameof(agreed), "Deltas are 0 or more.");
            if (diverged < 0) throw new ArgumentOutOfRangeException(nameof(diverged), "Deltas are 0 or more.");
            if (candidateFailures < 0) throw new ArgumentOutOfRangeException(nameof(candidateFailures), "Deltas are 0 or more.");
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Trials + " SET comparedcount = comparedcount + @compared, agreedcount = agreedcount + @agreed, divergedcount = divergedcount + @diverged, candidatefailurecount = candidatefailurecount + @failures, lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "compared", compared);
                    AdoDatabaseDriver.Add(command, "agreed", agreed);
                    AdoDatabaseDriver.Add(command, "diverged", diverged);
                    AdoDatabaseDriver.Add(command, "failures", candidateFailures);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<ShadowTrial>> EnumerateAsync(string tenantId, string? sourceDeploymentId, string? candidateDeploymentId, ShadowTrialStatusEnum? status, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(sourceDeploymentId)) clauses.Add("sourcedeploymentid = @sourcedeploymentid");
            if (!String.IsNullOrEmpty(candidateDeploymentId)) clauses.Add("candidatedeploymentid = @candidatedeploymentid");
            if (status.HasValue) clauses.Add("status = @status");
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(sourceDeploymentId)) AdoDatabaseDriver.Add(command, "sourcedeploymentid", sourceDeploymentId);
                if (!String.IsNullOrEmpty(candidateDeploymentId)) AdoDatabaseDriver.Add(command, "candidatedeploymentid", candidateDeploymentId);
                if (status.HasValue) AdoDatabaseDriver.Add(command, "status", status.Value.ToString());
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Trials + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue, CultureInfo.InvariantCulture);
            List<ShadowTrial> trials = await _Driver.QueryAsync("SELECT * FROM " + _Trials + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            return EnumerationResult<ShadowTrial>.Build(query, total, trials);
        }

        /// <inheritdoc />
        public async Task<List<ShadowTrial>> ListRunningBySourceDeploymentAsync(string tenantId, string sourceDeploymentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(sourceDeploymentId)) throw new ArgumentNullException(nameof(sourceDeploymentId));
            return await _Driver.QueryAsync("SELECT * FROM " + _Trials + " WHERE tenantid = @tenantid AND sourcedeploymentid = @sourcedeploymentid AND status = @running ORDER BY createdutc ASC, id ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "sourcedeploymentid", sourceDeploymentId);
                AdoDatabaseDriver.Add(command, "running", ShadowTrialStatusEnum.Running.ToString());
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<ShadowTrial>> ListRunningAsync(int maxResults, CancellationToken token = default)
        {
            int max = Math.Clamp(maxResults, 1, 10000);
            return await _Driver.QueryAsync("SELECT * FROM " + _Trials + " WHERE status = @running ORDER BY createdutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                AdoDatabaseDriver.Add(command, "running", ShadowTrialStatusEnum.Running.ToString());
                AdoDatabaseDriver.Add(command, "max", max);
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync("DELETE FROM " + _Trials + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        #endregion

        #region Private-Methods

        private static ShadowTrial Map(DbDataReader reader)
        {
            ShadowTrial obj = new ShadowTrial();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.NullableStr(reader, "name");
            obj.AgentId = AdoConverters.NullableStr(reader, "agentid");
            obj.SourceDeploymentId = AdoConverters.Str(reader, "sourcedeploymentid");
            obj.CandidateDeploymentId = AdoConverters.Str(reader, "candidatedeploymentid");
            obj.SamplePercent = AdoConverters.Int(reader, "samplepercent");
            obj.EndsUtc = AdoConverters.NullableDate(reader, "endsutc");
            obj.ComparisonEvalSetId = AdoConverters.NullableStr(reader, "comparisonevalsetid");
            obj.UseJudge = AdoConverters.Bool(reader, "usejudge");
            obj.Status = AdoConverters.Enum(reader, "status", ShadowTrialStatusEnum.Running);
            obj.StopReason = AdoConverters.NullableStr(reader, "stopreason");
            obj.ComparedCount = AdoConverters.Long(reader, "comparedcount");
            obj.AgreedCount = AdoConverters.Long(reader, "agreedcount");
            obj.DivergedCount = AdoConverters.Long(reader, "divergedcount");
            obj.CandidateFailureCount = AdoConverters.Long(reader, "candidatefailurecount");
            obj.CreatedByType = AdoConverters.Enum(reader, "createdbytype", PrincipalTypeEnum.User);
            obj.CreatedById = AdoConverters.NullableStr(reader, "createdbyid");
            obj.CreatedByName = AdoConverters.NullableStr(reader, "createdbyname");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.CompletedUtc = AdoConverters.NullableDate(reader, "completedutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        private static void Bind(DbCommand command, ShadowTrial obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "name", obj.Name);
            AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
            AdoDatabaseDriver.Add(command, "sourcedeploymentid", obj.SourceDeploymentId);
            AdoDatabaseDriver.Add(command, "candidatedeploymentid", obj.CandidateDeploymentId);
            AdoDatabaseDriver.Add(command, "samplepercent", obj.SamplePercent);
            AdoDatabaseDriver.Add(command, "endsutc", obj.EndsUtc);
            AdoDatabaseDriver.Add(command, "comparisonevalsetid", obj.ComparisonEvalSetId);
            AdoDatabaseDriver.Add(command, "usejudge", obj.UseJudge);
            AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
            AdoDatabaseDriver.Add(command, "stopreason", obj.StopReason);
            AdoDatabaseDriver.Add(command, "comparedcount", obj.ComparedCount);
            AdoDatabaseDriver.Add(command, "agreedcount", obj.AgreedCount);
            AdoDatabaseDriver.Add(command, "divergedcount", obj.DivergedCount);
            AdoDatabaseDriver.Add(command, "candidatefailurecount", obj.CandidateFailureCount);
            AdoDatabaseDriver.Add(command, "createdbytype", obj.CreatedByType.ToString());
            AdoDatabaseDriver.Add(command, "createdbyid", obj.CreatedById);
            AdoDatabaseDriver.Add(command, "createdbyname", obj.CreatedByName);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "completedutc", obj.CompletedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        #endregion
    }
}
