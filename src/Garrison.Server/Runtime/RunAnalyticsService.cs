namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;

    /// <summary>
    /// Time-bucketed run analytics (plan section 10.6). Reads a bounded set of runs for a tenant whose creation time
    /// falls in [from, to), then aggregates in process so averages and percentiles behave the same on every database
    /// provider. Buckets are aligned to UTC multiples of the bucket size (weeks start on Monday) and gap-filled.
    /// Thread-safe.
    /// </summary>
    public class RunAnalyticsService
    {
        #region Public-Members

        /// <summary>
        /// Maximum runs aggregated per request; the newest runs are kept when the cap is hit. Minimum 1, maximum
        /// 1000000, default 100000.
        /// </summary>
        public int MaxRuns
        {
            get
            {
                return _MaxRuns;
            }
            set
            {
                _MaxRuns = Math.Clamp(value, 1, 1000000);
            }
        }

        /// <summary>
        /// Maximum buckets per series; a range that needs more is rejected. Minimum 1, maximum 10000, default 400.
        /// </summary>
        public int MaxBuckets
        {
            get
            {
                return _MaxBuckets;
            }
            set
            {
                _MaxBuckets = Math.Clamp(value, 1, 10000);
            }
        }

        /// <summary>
        /// Default range length when the request gives no start. Minimum one minute, default 24 hours.
        /// </summary>
        public TimeSpan DefaultRange
        {
            get
            {
                return _DefaultRange;
            }
            set
            {
                _DefaultRange = value < TimeSpan.FromMinutes(1) ? TimeSpan.FromMinutes(1) : value;
            }
        }

        #endregion

        #region Private-Members

        private static readonly long[] _AutoLadderSeconds = new long[]
        {
            60, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400, 172800, 604800
        };

        private const long _Week = 604800;
        private static readonly DateTime _WeekOrigin = new DateTime(1970, 1, 5, 0, 0, 0, DateTimeKind.Utc);

        private readonly DatabaseDriverBase _Database;
        private int _MaxRuns = 100000;
        private int _MaxBuckets = 400;
        private TimeSpan _DefaultRange = TimeSpan.FromHours(24);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public RunAnalyticsService(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Aggregate runs for a tenant.
        /// </summary>
        /// <param name="query">Query; TenantId is required.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Analytics.</returns>
        /// <exception cref="ArgumentNullException">Thrown when query is null.</exception>
        /// <exception cref="ValidationException">Thrown when the range is empty or needs more than MaxBuckets buckets.</exception>
        public async Task<RunAnalyticsResponse> QueryAsync(RunAnalyticsQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));
            if (String.IsNullOrEmpty(query.TenantId)) throw new ArgumentException("A tenant is required.", nameof(query));

            DateTime toUtc = query.ToUtc.HasValue ? DateTime.SpecifyKind(query.ToUtc.Value, DateTimeKind.Utc) : DateTime.UtcNow;
            DateTime fromUtc = query.FromUtc.HasValue ? DateTime.SpecifyKind(query.FromUtc.Value, DateTimeKind.Utc) : toUtc - _DefaultRange;
            if (fromUtc >= toUtc)
            {
                throw new ValidationException("from must be earlier than to.", new Dictionary<string, string> { { "from", "Must be earlier than to." } });
            }

            long bucketSeconds = BucketSeconds(query.Interval, fromUtc, toUtc);
            DateTime firstStart = Align(fromUtc, bucketSeconds);
            long bucketCount = (long)Math.Ceiling((toUtc - firstStart).TotalSeconds / bucketSeconds);
            if (bucketCount < 1) bucketCount = 1;
            if (bucketCount > _MaxBuckets)
            {
                throw new ValidationException(
                    "The range needs " + bucketCount + " " + query.Interval.ToString().ToLowerInvariant() + " buckets; the maximum is " + _MaxBuckets + ". Use a shorter range or a larger interval.",
                    new Dictionary<string, string> { { "interval", "Too many buckets for the range." } });
            }

            RunFilter filter = new RunFilter();
            filter.TenantId = query.TenantId;
            filter.AgentId = String.IsNullOrEmpty(query.AgentId) ? null : query.AgentId;
            filter.DeploymentId = String.IsNullOrEmpty(query.DeploymentId) ? null : query.DeploymentId;
            filter.HarnessType = query.HarnessType;
            filter.ServedModel = String.IsNullOrEmpty(query.Model) ? null : query.Model;
            filter.FromUtc = fromUtc;
            filter.ToUtc = toUtc;
            List<Run> runs = await _Database.Runs.ListForAnalyticsAsync(filter, _MaxRuns + 1, token).ConfigureAwait(false);
            bool truncated = runs.Count > _MaxRuns;
            if (truncated) runs = runs.Take(_MaxRuns).ToList();
            token.ThrowIfCancellationRequested();

            RunAnalyticsResponse response = new RunAnalyticsResponse();
            response.FromUtc = fromUtc;
            response.ToUtc = toUtc;
            response.BucketSeconds = bucketSeconds;
            response.Interval = IntervalName(bucketSeconds);
            response.Truncated = truncated;

            RunAnalyticsAccumulator totals = new RunAnalyticsAccumulator();
            foreach (Run run in runs) totals.Add(run);
            totals.WriteTo(response.Totals);

            List<RunAnalyticsGroup> groups = Group(runs, query.GroupBy);
            foreach (RunAnalyticsGroup group in groups)
            {
                RunAnalyticsAccumulator[] accumulators = new RunAnalyticsAccumulator[bucketCount];
                for (long i = 0; i < bucketCount; i++) accumulators[i] = new RunAnalyticsAccumulator();
                foreach (Run run in group.Runs)
                {
                    long index = (long)Math.Floor((run.CreatedUtc - firstStart).TotalSeconds / bucketSeconds);
                    if (index < 0 || index >= bucketCount) continue;
                    accumulators[index].Add(run);
                }

                RunAnalyticsSeries series = new RunAnalyticsSeries();
                series.Key = group.Key;
                series.Label = group.Label;
                for (long i = 0; i < bucketCount; i++)
                {
                    RunAnalyticsBucket bucket = new RunAnalyticsBucket();
                    bucket.StartUtc = firstStart.AddSeconds(i * bucketSeconds);
                    accumulators[i].WriteTo(bucket);
                    series.Buckets.Add(bucket);
                }
                response.Series.Add(series);
            }

            return response;
        }

        /// <summary>
        /// Distinct agents, harnesses, deployments, and served models among a tenant's runs in a range.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="fromUtc">Inclusive start; null means DefaultRange before toUtc.</param>
        /// <param name="toUtc">Exclusive end; null means now.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Dimensions.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        /// <exception cref="ValidationException">Thrown when the range is empty.</exception>
        public async Task<RunAnalyticsDimensions> DimensionsAsync(string tenantId, DateTime? fromUtc, DateTime? toUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            DateTime to = toUtc.HasValue ? DateTime.SpecifyKind(toUtc.Value, DateTimeKind.Utc) : DateTime.UtcNow;
            DateTime from = fromUtc.HasValue ? DateTime.SpecifyKind(fromUtc.Value, DateTimeKind.Utc) : to - _DefaultRange;
            if (from >= to)
            {
                throw new ValidationException("from must be earlier than to.", new Dictionary<string, string> { { "from", "Must be earlier than to." } });
            }

            RunFilter filter = new RunFilter();
            filter.TenantId = tenantId;
            filter.FromUtc = from;
            filter.ToUtc = to;
            List<Run> runs = await _Database.Runs.ListForAnalyticsAsync(filter, _MaxRuns + 1, token).ConfigureAwait(false);

            RunAnalyticsDimensions result = new RunAnalyticsDimensions();
            result.Truncated = runs.Count > _MaxRuns;
            if (result.Truncated) runs = runs.Take(_MaxRuns).ToList();

            Dictionary<string, string> agents = new Dictionary<string, string>(StringComparer.Ordinal);
            Dictionary<string, string> deployments = new Dictionary<string, string>(StringComparer.Ordinal);
            HashSet<string> harnesses = new HashSet<string>(StringComparer.Ordinal);
            HashSet<string> models = new HashSet<string>(StringComparer.Ordinal);
            foreach (Run run in runs)
            {
                if (!agents.ContainsKey(run.AgentId)) agents[run.AgentId] = String.IsNullOrEmpty(run.AgentName) ? run.AgentId : run.AgentName;
                if (!String.IsNullOrEmpty(run.DeploymentId) && !deployments.ContainsKey(run.DeploymentId)) deployments[run.DeploymentId] = run.AgentId;
                harnesses.Add(run.HarnessType.ToString());
                models.Add(ModelOf(run));
            }

            foreach (KeyValuePair<string, string> agent in agents)
            {
                result.Agents.Add(new RunAnalyticsAgentDimension { Id = agent.Key, Name = agent.Value });
            }
            foreach (KeyValuePair<string, string> deployment in deployments)
            {
                token.ThrowIfCancellationRequested();
                Deployment? stored = await _Database.Deployments.ReadAsync(tenantId, deployment.Key, token).ConfigureAwait(false);
                result.Deployments.Add(new RunAnalyticsDeploymentDimension
                {
                    Id = deployment.Key,
                    Name = stored != null && !String.IsNullOrEmpty(stored.Name) ? stored.Name : deployment.Key,
                    AgentId = deployment.Value
                });
            }
            result.Agents = result.Agents.OrderBy(a => a.Name, StringComparer.OrdinalIgnoreCase).ToList();
            result.Deployments = result.Deployments.OrderBy(d => d.Name, StringComparer.OrdinalIgnoreCase).ToList();
            result.Harnesses = harnesses.OrderBy(h => h, StringComparer.OrdinalIgnoreCase).ToList();
            result.Models = models.OrderBy(m => m, StringComparer.OrdinalIgnoreCase).ToList();
            return result;
        }

        /// <summary>
        /// Bucket size for an interval and range. Auto picks the smallest size from a fixed ladder (1, 5, 10, 15, and
        /// 30 minutes; 1, 2, 3, 6, and 12 hours; 1 and 2 days; then whole weeks) that yields at most 96 buckets.
        /// </summary>
        /// <param name="interval">Interval.</param>
        /// <param name="fromUtc">Range start.</param>
        /// <param name="toUtc">Range end.</param>
        /// <returns>Seconds.</returns>
        public static long BucketSeconds(RunAnalyticsIntervalEnum interval, DateTime fromUtc, DateTime toUtc)
        {
            switch (interval)
            {
                case RunAnalyticsIntervalEnum.Minute:
                    return 60;
                case RunAnalyticsIntervalEnum.Hour:
                    return 3600;
                case RunAnalyticsIntervalEnum.Day:
                    return 86400;
                case RunAnalyticsIntervalEnum.Week:
                    return _Week;
                default:
                    double seconds = Math.Max(1, (toUtc - fromUtc).TotalSeconds);
                    foreach (long candidate in _AutoLadderSeconds)
                    {
                        if (seconds / candidate <= 96) return candidate;
                    }
                    long weeks = (long)Math.Ceiling(seconds / (96.0 * _Week));
                    return Math.Max(1, weeks) * _Week;
            }
        }

        /// <summary>
        /// Start of the bucket containing a time: a UTC multiple of the bucket size, with week-multiple buckets
        /// starting on Monday 00:00 UTC.
        /// </summary>
        /// <param name="timeUtc">Time.</param>
        /// <param name="bucketSeconds">Bucket size in seconds.</param>
        /// <returns>Bucket start.</returns>
        public static DateTime Align(DateTime timeUtc, long bucketSeconds)
        {
            DateTime origin = bucketSeconds % _Week == 0 ? _WeekOrigin : DateTime.UnixEpoch;
            long elapsed = (long)Math.Floor((timeUtc - origin).TotalSeconds);
            long start = (long)Math.Floor((double)elapsed / bucketSeconds) * bucketSeconds;
            return DateTime.SpecifyKind(origin.AddSeconds(start), DateTimeKind.Utc);
        }

        #endregion

        #region Private-Methods

        private static string IntervalName(long bucketSeconds)
        {
            switch (bucketSeconds)
            {
                case 60:
                    return "minute";
                case 3600:
                    return "hour";
                case 86400:
                    return "day";
                case _Week:
                    return "week";
                default:
                    return "auto";
            }
        }

        private static string ModelOf(Run run)
        {
            return String.IsNullOrWhiteSpace(run.ServedModel) ? "unknown" : run.ServedModel;
        }

        private static List<RunAnalyticsGroup> Group(List<Run> runs, RunAnalyticsGroupByEnum groupBy)
        {
            if (groupBy == RunAnalyticsGroupByEnum.None)
            {
                RunAnalyticsGroup all = new RunAnalyticsGroup("all", "All runs");
                all.Runs.AddRange(runs);
                return new List<RunAnalyticsGroup> { all };
            }

            Dictionary<string, RunAnalyticsGroup> groups = new Dictionary<string, RunAnalyticsGroup>(StringComparer.Ordinal);
            foreach (Run run in runs)
            {
                string model = ModelOf(run);
                string key;
                string label;
                switch (groupBy)
                {
                    case RunAnalyticsGroupByEnum.Agent:
                        key = run.AgentId;
                        // Runs arrive newest first, so an agent's label is its name on its most recent run.
                        label = String.IsNullOrEmpty(run.AgentName) ? run.AgentId : run.AgentName;
                        break;
                    case RunAnalyticsGroupByEnum.Model:
                        key = model;
                        label = model;
                        break;
                    case RunAnalyticsGroupByEnum.HarnessModel:
                        key = run.HarnessType.ToString() + "|" + model;
                        label = run.HarnessType.ToString() + " / " + model;
                        break;
                    default:
                        key = run.HarnessType.ToString();
                        label = key;
                        break;
                }
                if (!groups.TryGetValue(key, out RunAnalyticsGroup? group))
                {
                    group = new RunAnalyticsGroup(key, label);
                    groups[key] = group;
                }
                group.Runs.Add(run);
            }
            return groups.Values.OrderByDescending(g => g.Runs.Count).ThenBy(g => g.Key, StringComparer.Ordinal).ToList();
        }

        #endregion
    }
}
