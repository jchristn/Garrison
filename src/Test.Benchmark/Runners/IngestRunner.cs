namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Datasets;
    using Garrison.Benchmark.Metrics;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The ingest command: manifest apply at scale. For each ingest corpus it times a dry run of the whole corpus, the
    /// apply in batches, and an identical re-apply (which must report every document Unchanged), checks that every
    /// agent is readable by name afterwards (reachability), and runs the corpus's apply probes (invalid documents that
    /// must be refused cleanly). Ingest always uses a fresh workspace so the load path creates every record; a run with
    /// failed documents or failed applies is incomplete and exits 3.
    /// </summary>
    public static class IngestRunner
    {
        /// <summary>
        /// Run the command.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Exit code.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static async Task<int> RunAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            LoadedDataset? loaded = RunnerSupport.LoadDataset(context, "benchmarks/datasets/synthetic-fleet.json");
            if (loaded == null) return 1;
            List<string> corpusFilter = context.Args.GetList("corpus", String.Empty);
            int batchSize = context.Args.GetInt("batch-size", 50, 1, 10000);
            bool dryRun = context.Args.GetBool("dry-run", true);
            bool reapply = context.Args.GetBool("reapply", true);
            bool deterministic = context.Args.GetBool("deterministic", false);
            int pollMs = context.Args.GetInt("poll-ms", 100, 10, 10000);
            if (!await RunnerSupport.WaitReadyAsync(context.Client, TimeSpan.FromSeconds(context.Args.GetInt("ready-timeout-seconds", 120, 1, 3600)), token).ConfigureAwait(false)) return 1;

            List<BenchmarkCorpus> corpora = loaded.Dataset.Corpora.Where(c => corpusFilter.Count > 0 ? corpusFilter.Contains(c.Id) : c.Command == "ingest").ToList();
            if (corpora.Count == 0)
            {
                Console.Error.WriteLine("Dataset " + loaded.Dataset.Name + " has no ingest corpus" + (corpusFilter.Count > 0 ? " named " + String.Join(",", corpusFilter) : String.Empty) + ".");
                return 1;
            }

            DateTime startedUtc = DateTime.UtcNow;
            BenchmarkReport report = new BenchmarkReport();
            report.Kind = "ingest";
            report.Deterministic = deterministic;
            IngestSummary summary = new IngestSummary();
            summary.BatchSize = batchSize;
            List<double> applyLatencies = new List<double>();
            List<double> reapplyLatencies = new List<double>();
            double applySeconds = 0;
            int reapplyUnchanged = 0;
            int reapplyDocuments = 0;
            Provisioner provisioner = new Provisioner(context.Client);
            ProbeExecutor executor = new ProbeExecutor(context.Client, pollMs, null);
            Metrics.PrometheusSnapshot before = Metrics.PrometheusSnapshot.Parse(await context.Client.GetMetricsTextAsync(token).ConfigureAwait(false));

            foreach (BenchmarkCorpus corpus in corpora)
            {
                string stamp = startedUtc.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture);
                string name = Provisioner.WorkspaceName(loaded.Dataset.Name, corpus, "i" + stamp);
                Workspace workspace = await provisioner.EnsureTenantAsync(name, "Benchmark ingest workspace for " + loaded.Dataset.Name + "/" + corpus.Id + ".", token).ConfigureAwait(false);
                BenchmarkContext.Log("ingest " + corpus.Id + ": " + corpus.Items.Count + " documents into " + name + " in batches of " + batchSize);
                summary.Documents += corpus.Items.Count;
                summary.AgentDocuments += corpus.Items.Count(i => i.Kind == "Agent");

                if (dryRun)
                {
                    ApiResponse<ManifestApply> dry = await context.Client.ApplyManifestAsync(workspace.TenantId, Provisioner.Join(corpus.Items), true, token).ConfigureAwait(false);
                    summary.DryRunMs += dry.ElapsedMs;
                    if (!dry.IsSuccess) report.Notes.Add("Dry run of " + corpus.Id + " answered " + dry.Describe() + ".");
                }

                // Dependencies first: Garrison resolves references within one apply in kind order, so a batch boundary
                // must never put a deployment before the agent or template it names.
                List<BenchmarkItem> ordered = corpus.Items.OrderBy(i => DatasetValidator.Kinds.ToList().IndexOf(i.Kind)).ToList();
                for (int offset = 0; offset < ordered.Count; offset += batchSize)
                {
                    token.ThrowIfCancellationRequested();
                    List<BenchmarkItem> batch = ordered.Skip(offset).Take(batchSize).ToList();
                    Stopwatch watch = Stopwatch.StartNew();
                    ApiResponse<ManifestApply> apply = await context.Client.ApplyManifestAsync(workspace.TenantId, Provisioner.Join(batch), false, token).ConfigureAwait(false);
                    watch.Stop();
                    applySeconds += watch.Elapsed.TotalSeconds;
                    applyLatencies.Add(apply.ElapsedMs);
                    summary.Applies++;
                    if (apply.Body == null)
                    {
                        summary.RequestErrors++;
                        summary.Failed += batch.Count;
                        report.Notes.Add("Apply of " + corpus.Id + " documents " + offset + " to " + (offset + batch.Count - 1) + " returned no result: " + apply.Describe() + " " + Provisioner.Excerpt(apply.RawBody));
                        continue;
                    }
                    summary.Created += apply.Body.CreatedCount;
                    summary.Updated += apply.Body.UpdatedCount;
                    summary.Unchanged += apply.Body.UnchangedCount;
                    int failed = apply.Body.FailedCount > 0 ? batch.Count - apply.Body.CreatedCount - apply.Body.UpdatedCount - apply.Body.UnchangedCount : 0;
                    summary.Failed += failed;
                    foreach (ManifestApplyItem item in apply.Body.Items.Where(i => i.Result == "Failed").Take(3))
                        report.Notes.Add("Failed document in " + corpus.Id + ": " + item.Kind + " " + item.Name + ": " + item.Message);
                }

                if (reapply)
                {
                    for (int offset = 0; offset < ordered.Count; offset += batchSize)
                    {
                        List<BenchmarkItem> batch = ordered.Skip(offset).Take(batchSize).ToList();
                        ApiResponse<ManifestApply> again = await context.Client.ApplyManifestAsync(workspace.TenantId, Provisioner.Join(batch), false, token).ConfigureAwait(false);
                        reapplyLatencies.Add(again.ElapsedMs);
                        reapplyDocuments += batch.Count;
                        if (again.Body != null) reapplyUnchanged += again.Body.UnchangedCount;
                    }
                }

                foreach (BenchmarkProbe probe in corpus.Probes)
                {
                    ProbeOutcome outcome = await executor.ExecuteAsync(workspace.TenantId, corpus, probe, 0, token).ConfigureAwait(false);
                    report.Outcomes.Add(outcome);
                    if (probe.Action == "reachable" && outcome.Timings.TryGetValue("reachable", out double reachable)) summary.Reachable += (int)reachable;
                }
                if (!corpus.Probes.Any(p => p.Action == "reachable"))
                {
                    BenchmarkProbe implicitProbe = new BenchmarkProbe();
                    implicitProbe.Id = "reachable-all";
                    implicitProbe.Type = "reachability";
                    implicitProbe.Category = "load-path";
                    implicitProbe.Action = "reachable";
                    ProbeOutcome outcome = await executor.ExecuteAsync(workspace.TenantId, corpus, implicitProbe, 0, token).ConfigureAwait(false);
                    report.Outcomes.Add(outcome);
                    if (outcome.Timings.TryGetValue("reachable", out double reachable)) summary.Reachable += (int)reachable;
                }
            }

            Metrics.PrometheusSnapshot after = Metrics.PrometheusSnapshot.Parse(await context.Client.GetMetricsTextAsync(token).ConfigureAwait(false));
            report.Stages = after.Since(before, 25);
            summary.DocumentsPerSecond = applySeconds > 0 ? summary.Documents / applySeconds : 0;
            summary.ApplyLatency = applyLatencies.Count > 0 ? LatencyStatistics.From(applyLatencies, context.Resamples, context.Seed) : null;
            summary.ReapplyLatency = reapplyLatencies.Count > 0 ? LatencyStatistics.From(reapplyLatencies, context.Resamples, context.Seed + 1) : null;
            summary.ReapplyUnchangedRate = reapplyDocuments > 0 ? (double)reapplyUnchanged / reapplyDocuments : 0;
            summary.Reachability = summary.AgentDocuments > 0 ? (double)summary.Reachable / summary.AgentDocuments : 1;
            report.Ingest = summary;
            if (summary.Failed > 0 || summary.RequestErrors > 0)
            {
                report.Incomplete = true;
                report.IncompleteReason = "Incomplete ingest: " + summary.Failed + " documents failed and " + summary.RequestErrors + " applies returned no result";
            }
            await RunnerSupport.FinishAsync(context, report, loaded.Dataset.Name, loaded.Sha256, loaded.Path, startedUtc, null, token).ConfigureAwait(false);
            return RunnerSupport.ExitCode(context, report);
        }
    }
}
