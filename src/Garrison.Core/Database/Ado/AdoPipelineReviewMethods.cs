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
    using Garrison.Core.Models;
    using Garrison.Core.Requests;

    /// <summary>
    /// Provider-neutral pipeline review data access (P12.9). One review per stage execution (insert with ON CONFLICT DO
    /// NOTHING on the unique stage and execution); decisions are compare-and-set updates from Pending. Thread-safe.
    /// </summary>
    public class AdoPipelineReviewMethods : IPipelineReviewMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private static readonly string _Columns = "id, tenantid, pipelinerunid, pipelineid, pipelinename, runstageid, position, stagename, runid, execution, status, decision, decisionsource, comment, decidedby, decidedbyid, timeoutaction, requestedutc, expiresutc, decidedutc, createdutc, lastupdateutc";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoPipelineReviewMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("pipeline_reviews");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<bool> CreateIfAbsentAsync(PipelineReview obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            int affected = await _Driver.NonQueryAsync("INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ") ON CONFLICT (runstageid, execution) DO NOTHING;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "pipelinerunid", obj.PipelineRunId);
                AdoDatabaseDriver.Add(command, "pipelineid", obj.PipelineId);
                AdoDatabaseDriver.Add(command, "pipelinename", obj.PipelineName);
                AdoDatabaseDriver.Add(command, "runstageid", obj.RunStageId);
                AdoDatabaseDriver.Add(command, "position", obj.Position);
                AdoDatabaseDriver.Add(command, "stagename", obj.StageName);
                AdoDatabaseDriver.Add(command, "runid", obj.RunId);
                AdoDatabaseDriver.Add(command, "execution", obj.Execution);
                AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
                AdoDatabaseDriver.Add(command, "decision", obj.Decision?.ToString());
                AdoDatabaseDriver.Add(command, "decisionsource", obj.DecisionSource?.ToString());
                AdoDatabaseDriver.Add(command, "comment", obj.Comment);
                AdoDatabaseDriver.Add(command, "decidedby", Truncate(obj.DecidedBy, 256));
                AdoDatabaseDriver.Add(command, "decidedbyid", obj.DecidedById);
                AdoDatabaseDriver.Add(command, "timeoutaction", obj.TimeoutAction.ToString());
                AdoDatabaseDriver.Add(command, "requestedutc", obj.RequestedUtc);
                AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
                AdoDatabaseDriver.Add(command, "decidedutc", obj.DecidedUtc);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<PipelineReview?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<PipelineReview?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<PipelineReview?> ReadByExecutionAsync(string runStageId, int execution, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runStageId)) throw new ArgumentNullException(nameof(runStageId));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE runstageid = @stage AND execution = @execution;", command =>
            {
                AdoDatabaseDriver.Add(command, "stage", runStageId);
                AdoDatabaseDriver.Add(command, "execution", execution);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<PipelineReview>> ListByPipelineRunAsync(string pipelineRunId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(pipelineRunId)) throw new ArgumentNullException(nameof(pipelineRunId));
            return await _Driver.QueryAsync("SELECT * FROM " + _Table + " WHERE pipelinerunid = @id ORDER BY position ASC, execution ASC;", command => AdoDatabaseDriver.Add(command, "id", pipelineRunId), Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<PipelineReview>> EnumerateAsync(PipelineReviewFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(filter.TenantId)) clauses.Add("tenantid = @tenantid");
            if (filter.Status.HasValue) clauses.Add("status = @status");
            if (!String.IsNullOrEmpty(filter.PipelineRunId)) clauses.Add("pipelinerunid = @pipelinerunid");
            if (!String.IsNullOrEmpty(filter.PipelineId)) clauses.Add("pipelineid = @pipelineid");
            if (!String.IsNullOrEmpty(filter.RunId)) clauses.Add("runid = @runid");
            if (filter.DecisionSource.HasValue) clauses.Add("decisionsource = @decisionsource");
            if (filter.FromUtc.HasValue) clauses.Add("createdutc >= @fromutc");
            if (filter.ToUtc.HasValue) clauses.Add("createdutc < @toutc");
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;
            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(filter.TenantId)) AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (filter.Status.HasValue) AdoDatabaseDriver.Add(command, "status", filter.Status.Value.ToString());
                if (!String.IsNullOrEmpty(filter.PipelineRunId)) AdoDatabaseDriver.Add(command, "pipelinerunid", filter.PipelineRunId);
                if (!String.IsNullOrEmpty(filter.PipelineId)) AdoDatabaseDriver.Add(command, "pipelineid", filter.PipelineId);
                if (!String.IsNullOrEmpty(filter.RunId)) AdoDatabaseDriver.Add(command, "runid", filter.RunId);
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
            List<PipelineReview> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                    AdoDatabaseDriver.Add(command, "skip", query.Skip);
                },
                Map,
                token).ConfigureAwait(false);
            return EnumerationResult<PipelineReview>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<bool> ResolveAsync(PipelineReviewResolution resolution, CancellationToken token = default)
        {
            if (resolution == null) throw new ArgumentNullException(nameof(resolution));
            if (String.IsNullOrEmpty(resolution.ReviewId)) throw new ArgumentNullException(nameof(resolution), "A review identifier is required.");
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = @status, decision = @decision, decisionsource = @source, comment = @comment, decidedby = @decidedby, decidedbyid = @decidedbyid, decidedutc = @decidedutc, lastupdateutc = @decidedutc WHERE id = @id AND status = 'Pending';",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", resolution.ReviewId);
                    AdoDatabaseDriver.Add(command, "status", resolution.Status.ToString());
                    AdoDatabaseDriver.Add(command, "decision", resolution.Decision?.ToString());
                    AdoDatabaseDriver.Add(command, "source", resolution.Source.ToString());
                    AdoDatabaseDriver.Add(command, "comment", resolution.Comment);
                    AdoDatabaseDriver.Add(command, "decidedby", Truncate(resolution.DecidedBy, 256));
                    AdoDatabaseDriver.Add(command, "decidedbyid", resolution.DecidedById);
                    AdoDatabaseDriver.Add(command, "decidedutc", resolution.DecidedUtc);
                },
                token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<List<PipelineReview>> ListExpiredAsync(DateTime nowUtc, int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status = 'Pending' AND expiresutc IS NOT NULL AND expiresutc <= @now ORDER BY expiresutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Clamp(limit, 1, 10000));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<PipelineReview>> ListOrphanedAsync(int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status = 'Pending' AND pipelinerunid IN (SELECT id FROM " + _Driver.Table("pipeline_runs") + " WHERE status IN ('Succeeded', 'Failed', 'Cancelled', 'TimedOut')) ORDER BY createdutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
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
            object? value = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", command =>
            {
                if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, token).ConfigureAwait(false);
            return value == null ? 0 : Convert.ToInt64(value);
        }

        /// <summary>
        /// Map a row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static PipelineReview Map(DbDataReader reader)
        {
            PipelineReview obj = new PipelineReview();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.PipelineRunId = AdoConverters.Str(reader, "pipelinerunid");
            obj.PipelineId = AdoConverters.Str(reader, "pipelineid");
            obj.PipelineName = AdoConverters.Str(reader, "pipelinename");
            obj.RunStageId = AdoConverters.Str(reader, "runstageid");
            obj.Position = AdoConverters.Int(reader, "position");
            obj.StageName = AdoConverters.Str(reader, "stagename");
            obj.RunId = AdoConverters.Str(reader, "runid");
            obj.Execution = AdoConverters.Int(reader, "execution");
            obj.Status = AdoConverters.Enum<PipelineReviewStatusEnum>(reader, "status", PipelineReviewStatusEnum.Pending);
            obj.Decision = AdoConverters.NullableEnum<PipelineReviewDecisionEnum>(reader, "decision");
            obj.DecisionSource = AdoConverters.NullableEnum<PipelineReviewSourceEnum>(reader, "decisionsource");
            obj.Comment = AdoConverters.NullableStr(reader, "comment");
            obj.DecidedBy = AdoConverters.NullableStr(reader, "decidedby");
            obj.DecidedById = AdoConverters.NullableStr(reader, "decidedbyid");
            obj.TimeoutAction = AdoConverters.Enum<PipelineReviewDecisionEnum>(reader, "timeoutaction", PipelineReviewDecisionEnum.Reject);
            obj.RequestedUtc = AdoConverters.Date(reader, "requestedutc");
            obj.ExpiresUtc = AdoConverters.NullableDate(reader, "expiresutc");
            obj.DecidedUtc = AdoConverters.NullableDate(reader, "decidedutc");
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
