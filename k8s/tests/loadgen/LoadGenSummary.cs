namespace Garrison.LoadGen
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Text;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Aggregate results of one load generator execution, with the pass or fail decision.
    /// Immutable after construction; thread-safe for reads.
    /// </summary>
    public class LoadGenSummary
    {
        #region Public-Members

        /// <summary>
        /// Runs requested.
        /// </summary>
        public int Requested { get; }

        /// <summary>
        /// Runs created (creation acknowledged by the server).
        /// </summary>
        public int Created { get; }

        /// <summary>
        /// Creations that failed after every attempt.
        /// </summary>
        public int SubmitErrors { get; }

        /// <summary>
        /// Runs that ended Succeeded.
        /// </summary>
        public int Succeeded { get; }

        /// <summary>
        /// Runs that ended Failed, TimedOut, Cancelled, or Rejected, including allowed failures.
        /// </summary>
        public int Failed { get; }

        /// <summary>
        /// Failed runs whose outcome is accepted by policy (see LoadGenOptions.AllowedOutcomes).
        /// </summary>
        public int AllowedFailures { get; }

        /// <summary>
        /// Created runs that were not terminal when the wait timed out.
        /// </summary>
        public int Stuck { get; }

        /// <summary>
        /// Runs that needed more than one attempt (requeued after a lost lease or node).
        /// </summary>
        public int Requeued { get; }

        /// <summary>
        /// Failure counts by status and outcome, for example Failed/NodeLost.
        /// </summary>
        public Dictionary<string, int> FailuresByOutcome { get; }

        /// <summary>
        /// Claim latency percentiles in milliseconds (p50, p90, p99, max), or -1 when nothing was leased.
        /// </summary>
        public long ClaimP50 { get; }

        /// <summary>
        /// Claim latency p90 in milliseconds.
        /// </summary>
        public long ClaimP90 { get; }

        /// <summary>
        /// Claim latency p99 in milliseconds.
        /// </summary>
        public long ClaimP99 { get; }

        /// <summary>
        /// Maximum claim latency in milliseconds.
        /// </summary>
        public long ClaimMax { get; }

        /// <summary>
        /// Created-to-completed p50 in milliseconds.
        /// </summary>
        public long TotalP50 { get; }

        /// <summary>
        /// Created-to-completed p99 in milliseconds.
        /// </summary>
        public long TotalP99 { get; }

        /// <summary>
        /// Submission p50 in milliseconds (client side, including retries).
        /// </summary>
        public long SubmitP50 { get; }

        /// <summary>
        /// Submission p99 in milliseconds.
        /// </summary>
        public long SubmitP99 { get; }

        /// <summary>
        /// Seconds from the first created run to the last completed run, on the server clock.
        /// </summary>
        public double DurationSeconds { get; }

        /// <summary>
        /// Completed runs per second over DurationSeconds.
        /// </summary>
        public double Throughput { get; }

        /// <summary>
        /// Whether the execution met its criteria.
        /// </summary>
        public bool Passed { get; }

        /// <summary>
        /// Why it failed, or empty.
        /// </summary>
        public List<string> Reasons { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Compute a summary.
        /// </summary>
        /// <param name="records">Run records.</param>
        /// <param name="options">Options.</param>
        /// <exception cref="ArgumentNullException">Thrown when records or options is null.</exception>
        public LoadGenSummary(IReadOnlyList<RunRecord> records, LoadGenOptions options)
        {
            if (records == null) throw new ArgumentNullException(nameof(records));
            if (options == null) throw new ArgumentNullException(nameof(options));

            Requested = records.Count;
            Created = records.Count(r => r.RunId != null);
            SubmitErrors = records.Count(r => r.RunId == null);
            Succeeded = records.Count(r => r.Run != null && r.Run.Status == RunStatusEnum.Succeeded);
            Failed = records.Count(r => r.IsTerminal && r.Run!.Status != RunStatusEnum.Succeeded);
            AllowedFailures = records.Count(r => r.IsAllowedFailure(options));
            Stuck = records.Count(r => r.RunId != null && !r.IsTerminal);
            Requeued = records.Count(r => r.Run != null && r.Run.Attempt > 1);
            FailuresByOutcome = records
                .Where(r => r.IsTerminal && r.Run!.Status != RunStatusEnum.Succeeded)
                .GroupBy(r => r.Run!.Status + "/" + r.Run!.Outcome)
                .ToDictionary(g => g.Key, g => g.Count(), StringComparer.Ordinal);

            List<long> claims = records.Where(r => r.ClaimMs != null).Select(r => r.ClaimMs!.Value).OrderBy(v => v).ToList();
            ClaimP50 = Percentile(claims, 50);
            ClaimP90 = Percentile(claims, 90);
            ClaimP99 = Percentile(claims, 99);
            ClaimMax = claims.Count > 0 ? claims[claims.Count - 1] : -1;
            List<long> totals = records.Where(r => r.TotalMs != null).Select(r => r.TotalMs!.Value).OrderBy(v => v).ToList();
            TotalP50 = Percentile(totals, 50);
            TotalP99 = Percentile(totals, 99);
            List<long> submits = records.Where(r => r.SubmitMs >= 0).Select(r => r.SubmitMs).OrderBy(v => v).ToList();
            SubmitP50 = Percentile(submits, 50);
            SubmitP99 = Percentile(submits, 99);

            List<RunRecord> completed = records.Where(r => r.Run != null && r.Run.CompletedUtc != null).ToList();
            List<RunRecord> seen = records.Where(r => r.Run != null).ToList();
            if (completed.Any() && seen.Any())
            {
                DateTime first = seen.Min(r => r.Run!.CreatedUtc);
                DateTime last = completed.Max(r => r.Run!.CompletedUtc!.Value);
                DurationSeconds = Math.Max(0.001, (last - first).TotalSeconds);
                Throughput = completed.Count / DurationSeconds;
            }

            Reasons = new List<string>();
            if (SubmitErrors > 0) Reasons.Add(SubmitErrors + " run creation(s) failed after retries");
            if (Stuck > 0) Reasons.Add(Stuck + " run(s) not terminal within " + options.TimeoutSeconds + " s");
            int disallowed = Failed - AllowedFailures;
            if (disallowed > 0) Reasons.Add(disallowed + " run(s) ended without success" + (options.RequireSuccess ? "" : " with an outcome outside " + String.Join("/", options.AllowedOutcomes)));
            Passed = Reasons.Count == 0;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Human-readable report.
        /// </summary>
        /// <param name="options">Options.</param>
        /// <returns>Report text.</returns>
        /// <exception cref="ArgumentNullException">Thrown when options is null.</exception>
        public string ToReport(LoadGenOptions options)
        {
            if (options == null) throw new ArgumentNullException(nameof(options));
            StringBuilder sb = new StringBuilder();
            sb.AppendLine("== " + options.Label + " against " + options.Url);
            sb.AppendLine("runs requested " + Requested + ", created " + Created + ", submit errors " + SubmitErrors);
            sb.AppendLine("succeeded " + Succeeded + ", failed " + Failed + " (allowed by policy " + AllowedFailures + "), stuck " + Stuck + ", requeued " + Requeued);
            foreach (KeyValuePair<string, int> pair in FailuresByOutcome.OrderBy(p => p.Key, StringComparer.Ordinal)) sb.AppendLine("  " + pair.Key + ": " + pair.Value);
            sb.AppendLine("claim latency ms (queued to leased): p50 " + ClaimP50 + ", p90 " + ClaimP90 + ", p99 " + ClaimP99 + ", max " + ClaimMax);
            sb.AppendLine("run total ms (created to completed): p50 " + TotalP50 + ", p99 " + TotalP99 + "; submit ms p50 " + SubmitP50 + ", p99 " + SubmitP99);
            sb.AppendLine("throughput " + Throughput.ToString("F2", CultureInfo.InvariantCulture) + " runs/s over " + DurationSeconds.ToString("F1", CultureInfo.InvariantCulture) + " s");
            sb.Append(Passed ? "RESULT PASS" : "RESULT FAIL: " + String.Join("; ", Reasons));
            return sb.ToString();
        }

        /// <summary>
        /// Append one row to the summary CSV, writing the header when the file is new.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <param name="options">Options.</param>
        /// <param name="startedUtc">When the execution started.</param>
        /// <exception cref="ArgumentNullException">Thrown when path or options is null.</exception>
        public void AppendCsv(string path, LoadGenOptions options, DateTime startedUtc)
        {
            if (String.IsNullOrEmpty(path)) throw new ArgumentNullException(nameof(path));
            if (options == null) throw new ArgumentNullException(nameof(options));
            bool exists = File.Exists(path);
            string? directory = Path.GetDirectoryName(Path.GetFullPath(path));
            if (!String.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
            using (StreamWriter writer = new StreamWriter(path, true, new UTF8Encoding(false)))
            {
                if (!exists) writer.WriteLine("label,startedUtc,url,runs,concurrency,runMs,created,submitErrors,succeeded,failed,allowedFailures,stuck,requeued,claimP50Ms,claimP90Ms,claimP99Ms,claimMaxMs,totalP50Ms,totalP99Ms,durationSeconds,runsPerSecond,result");
                string[] cells = new string[]
                {
                    options.Label.Replace(',', ' '),
                    startedUtc.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture),
                    options.Url,
                    Requested.ToString(CultureInfo.InvariantCulture),
                    options.Concurrency.ToString(CultureInfo.InvariantCulture),
                    options.RunMs.ToString(CultureInfo.InvariantCulture),
                    Created.ToString(CultureInfo.InvariantCulture),
                    SubmitErrors.ToString(CultureInfo.InvariantCulture),
                    Succeeded.ToString(CultureInfo.InvariantCulture),
                    Failed.ToString(CultureInfo.InvariantCulture),
                    AllowedFailures.ToString(CultureInfo.InvariantCulture),
                    Stuck.ToString(CultureInfo.InvariantCulture),
                    Requeued.ToString(CultureInfo.InvariantCulture),
                    ClaimP50.ToString(CultureInfo.InvariantCulture),
                    ClaimP90.ToString(CultureInfo.InvariantCulture),
                    ClaimP99.ToString(CultureInfo.InvariantCulture),
                    ClaimMax.ToString(CultureInfo.InvariantCulture),
                    TotalP50.ToString(CultureInfo.InvariantCulture),
                    TotalP99.ToString(CultureInfo.InvariantCulture),
                    DurationSeconds.ToString("F1", CultureInfo.InvariantCulture),
                    Throughput.ToString("F2", CultureInfo.InvariantCulture),
                    Passed ? "PASS" : "FAIL"
                };
                writer.WriteLine(String.Join(",", cells));
            }
        }

        #endregion

        #region Private-Methods

        private static long Percentile(List<long> sorted, int percentile)
        {
            if (sorted.Count == 0) return -1;
            int rank = (int)Math.Ceiling(percentile / 100.0 * sorted.Count);
            return sorted[Math.Clamp(rank - 1, 0, sorted.Count - 1)];
        }

        #endregion
    }
}
