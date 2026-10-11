namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Datasets;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// Steps every measuring command shares: load and validate the dataset, wait for the server, finish the report
    /// (provenance, summaries, baselines), write it, and turn it into an exit code. Stateless and thread-safe.
    /// </summary>
    public static class RunnerSupport
    {
        #region Public-Methods

        /// <summary>
        /// Load and validate a dataset.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="defaultPath">Default dataset path relative to the root.</param>
        /// <returns>The dataset, or null after printing why it cannot be used.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static LoadedDataset? LoadDataset(BenchmarkContext context, string defaultPath)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            string path = context.ResolvePath(context.Args.GetString("dataset", defaultPath));
            LoadedDataset loaded;
            try
            {
                loaded = DatasetLoader.Load(path);
            }
            catch (Exception e) when (e is FileNotFoundException || e is InvalidDataException)
            {
                Console.Error.WriteLine(e.Message);
                return null;
            }
            List<ValidationIssue> issues = DatasetValidator.Validate(loaded.Dataset);
            if (issues.Count > 0)
            {
                Console.Error.WriteLine("Dataset " + context.Relative(loaded.Path) + " is invalid (run the validate command for the full list):");
                foreach (ValidationIssue issue in issues.Take(20)) Console.Error.WriteLine("  " + issue);
                return null;
            }
            return loaded;
        }

        /// <summary>
        /// Wait until the server answers readiness.
        /// </summary>
        /// <param name="client">Client.</param>
        /// <param name="timeout">Longest wait.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when ready.</returns>
        /// <exception cref="ArgumentNullException">Thrown when client is null.</exception>
        public static async Task<bool> WaitReadyAsync(GarrisonClient client, TimeSpan timeout, CancellationToken token)
        {
            if (client == null) throw new ArgumentNullException(nameof(client));
            DateTime deadline = DateTime.UtcNow + timeout;
            ApiResponse<object> last = new ApiResponse<object>();
            while (DateTime.UtcNow < deadline)
            {
                last = await client.ReadyAsync(token).ConfigureAwait(false);
                if (last.IsSuccess) return true;
                await Task.Delay(1000, token).ConfigureAwait(false);
            }
            Console.Error.WriteLine("The server at " + client.BaseUrl + " is not ready (" + last.Describe() + "). Start the bench stack first: benchmarks/stack-up.sh, or benchmarks/start-bench-server.sh for the local stack.");
            return false;
        }

        /// <summary>
        /// Count Ready worker nodes and their slots.
        /// </summary>
        /// <param name="client">Client.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Ready nodes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when client is null.</exception>
        public static async Task<List<Node>> ReadyNodesAsync(GarrisonClient client, CancellationToken token)
        {
            if (client == null) throw new ArgumentNullException(nameof(client));
            ApiResponse<EnumerationResult<Node>> nodes = await client.ListNodesAsync(token).ConfigureAwait(false);
            if (nodes.Body == null) return new List<Node>();
            return nodes.Body.Objects.Where(n => n.Status == "Ready").ToList();
        }

        /// <summary>
        /// Finish a report: provenance, options, summaries, baselines; then write it and print where.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="report">Report.</param>
        /// <param name="dataset">Dataset name.</param>
        /// <param name="sha256">Dataset hash.</param>
        /// <param name="path">Dataset path, or null.</param>
        /// <param name="startedUtc">Start time.</param>
        /// <param name="armDescriptions">Arm descriptions, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Path of the JSON report.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context or report is null.</exception>
        public static async Task<string> FinishAsync(BenchmarkContext context, BenchmarkReport report, string dataset, string sha256, string? path, DateTime startedUtc, IDictionary<string, string>? armDescriptions, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (report == null) throw new ArgumentNullException(nameof(report));
            report.Dataset = dataset;
            report.Label = context.Label;
            report.Provenance = await context.ProvenanceAsync(dataset, sha256, path, startedUtc, token).ConfigureAwait(false);
            ReportSummarizer.Summarize(report, context.Resamples, context.Seed, armDescriptions);
            BaselineMatcher.Apply(report, BaselineMatcher.Load(Path.Combine(context.Root, "benchmarks", "baselines.json")));
            report.Options = context.Args.Used;
            if (!String.IsNullOrEmpty(report.Provenance.SharedMachine)) report.Notes.Add("Shared machine: " + report.Provenance.SharedMachine + ". Latency and throughput are indicative.");
            string written = await ReportWriter.WriteAsync(report, context.ResultsDirectory, token).ConfigureAwait(false);
            PrintSummary(report);
            BenchmarkContext.Log("report: " + context.Relative(written) + " and .md");
            return written;
        }

        /// <summary>
        /// Exit code of a measuring command: 3 when incomplete, 1 when --require-pass is set and a probe failed,
        /// otherwise 0.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="report">Report.</param>
        /// <returns>Exit code.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static int ExitCode(BenchmarkContext context, BenchmarkReport report)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (report == null) throw new ArgumentNullException(nameof(report));
            bool requirePass = context.Args.GetBool("require-pass", false);
            if (report.Incomplete)
            {
                Console.Error.WriteLine("INCOMPLETE: " + report.IncompleteReason + ". These results are not comparable.");
                return 3;
            }
            if (requirePass && report.Outcomes.Any(o => !o.Passed)) return 1;
            return 0;
        }

        #endregion

        #region Private-Methods

        private static void PrintSummary(BenchmarkReport report)
        {
            foreach (ArmSummary arm in report.Arms)
            {
                string line = arm.Name + ": " + arm.Passed + "/" + arm.Probes + " passed, " + arm.Errors + " errors";
                if (arm.PassRate != null) line += ", pass rate " + arm.PassRate.Format("F3");
                if (arm.Latency != null) line += ", latency p50 " + ReportWriter.N(arm.Latency.P50, "F1") + " ms, p95 " + ReportWriter.N(arm.Latency.P95, "F1") + " ms";
                BenchmarkContext.Log(line);
            }
            foreach (ProbeOutcome miss in report.Outcomes.Where(o => !o.Passed).Take(10))
                BenchmarkContext.Log("  miss " + miss.Arm + " " + miss.Corpus + "/" + miss.ProbeId + "#" + miss.Repeat + ": " + String.Join("; ", miss.Failures));
        }

        #endregion
    }
}
