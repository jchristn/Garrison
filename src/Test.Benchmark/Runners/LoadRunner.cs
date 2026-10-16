namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Datasets;
    using Garrison.Benchmark.Metrics;
    using Garrison.Benchmark.Reference;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The load command: throughput and latency per concurrency (closed loop) or arrival rate (open loop), per arm,
    /// optionally across worker counts (scale-out). Every level has an untimed warmup; at the deadline no new
    /// operation starts and in-flight ones drain; throughput counts successes over the time actually measured; open
    /// loop measures latency from the scheduled send time, so a stall shows up in the percentiles (no coordinated
    /// omission). The direct arm runs the fake harness on this machine at the same concurrency, the floor that shows
    /// the most the harness itself allows.
    /// </summary>
    public static class LoadRunner
    {
        #region Public-Methods

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
            string corpusId = context.Args.GetString("corpus", "load");
            string agent = context.Args.GetString("agent", "load-echo");
            List<string> arms = context.Args.GetList("arms", "garrison");
            string mode = context.Args.GetString("mode", "closed");
            List<int> concurrency = context.Args.GetIntList("concurrency", "1,4,8,16", 1, 10000);
            List<double> rates = context.Args.GetDoubleList("rates", "1,2,4", 0.01, 10000);
            List<int> scaleWorkers = context.Args.GetIntList("scale-workers", String.Empty, 1, 1000);
            int warmupSeconds = context.Args.GetInt("warmup-seconds", 5, 0, 3600);
            int durationSeconds = context.Args.GetInt("duration-seconds", 20, 1, 86400);
            int delayMs = context.Args.GetInt("delay-ms", 0, 0, 5000);
            int maxInFlight = context.Args.GetInt("max-in-flight", 2000, 1, 100000);
            bool databaseAttribution = context.Args.GetBool("database-attribution", false);
            int attributionSeconds = context.Args.GetInt("database-attribution-seconds", 10, 1, 300);
            int waitSeconds = context.Args.GetInt("wait-seconds", 300, 1, 600);
            string laneLabel = context.Args.GetString("lane-label", "bench.garrison.io/lane=alpha");
            string workerSet = context.Args.GetString("worker-statefulset", "garrison-worker");
            string inputText = context.Args.GetString("input", "load test run");
            string? tracePath = context.Args.GetOptional("trace");
            ArrivalTrace? trace = tracePath == null ? null : ArrivalTrace.Load(context.ResolvePath(tracePath));
            if (mode == "trace" && trace == null) throw new ArgumentException("--mode trace needs --trace with a prepared arrival trace.");
            if (mode == "trace" && trace != null && !trace.OffsetsMs.Any(offset => offset < durationSeconds * 1000.0))
                throw new ArgumentException("The trace has no arrivals inside --duration-seconds.");
            if (mode != "trace" && trace != null) throw new ArgumentException("--trace requires --mode trace.");
            if (mode != "closed" && mode != "open" && mode != "trace")
            {
                Console.Error.WriteLine("--mode must be closed, open, or trace.");
                return 2;
            }

            BenchmarkCorpus? corpus = loaded.Dataset.Corpora.FirstOrDefault(c => c.Id == corpusId);
            if (corpus == null)
            {
                Console.Error.WriteLine("Dataset " + loaded.Dataset.Name + " has no corpus " + corpusId + ".");
                return 1;
            }
            DirectInvoker? direct = null;
            if (arms.Contains("direct"))
            {
                string? dll = DirectInvoker.Locate(context.Root, context.Args.GetOptional("fake-harness"));
                if (dll == null)
                {
                    Console.Error.WriteLine("The direct arm needs garrison-fake-harness.dll; build src/Garrison.FakeHarness or pass --fake-harness.");
                    return 1;
                }
                direct = new DirectInvoker(dll);
            }
            if (scaleWorkers.Count > 0 && String.IsNullOrEmpty(context.Kubeconfig))
            {
                Console.Error.WriteLine("--scale-workers needs --kubeconfig and --context for the bench cluster.");
                return 2;
            }
            if (!await RunnerSupport.WaitReadyAsync(context.Client, TimeSpan.FromSeconds(context.Args.GetInt("ready-timeout-seconds", 120, 1, 3600)), token).ConfigureAwait(false)) return 1;

            DateTime startedUtc = DateTime.UtcNow;
            BenchmarkReport report = new BenchmarkReport();
            report.Kind = "load";
            if (trace != null)
            {
                report.Notes.Add("Trace source " + trace.Source + "; source SHA-256 " + trace.SourceSha256 + "; prepared trace SHA-256 " + DatasetLoader.Sha256Hex(System.IO.File.ReadAllBytes(context.ResolvePath(tracePath!))) + "; " + trace.OffsetsMs.Count + " arrivals; offsets beyond the measured duration are not sent; no looping or jitter.");
            }
            Provisioner provisioner = new Provisioner(context.Client);
            Workspace workspace;
            try
            {
                workspace = await provisioner.ProvisionAsync(loaded.Dataset.Name, corpus, context.Args.GetOptional("workspace-suffix"), token).ConfigureAwait(false);
            }
            catch (InvalidOperationException e)
            {
                report.Incomplete = true;
                report.IncompleteReason = "Incomplete load: the workload corpus did not provision (" + e.Message + ")";
                await RunnerSupport.FinishAsync(context, report, loaded.Dataset.Name, loaded.Sha256, loaded.Path, startedUtc, null, token).ConfigureAwait(false);
                return 3;
            }

            Dictionary<string, string> parameters = new Dictionary<string, string> { { "delayMs", delayMs.ToString(CultureInfo.InvariantCulture) } };
            List<int> sweep = scaleWorkers.Count > 0 ? scaleWorkers : new List<int> { 0 };
            PrometheusSnapshot first = PrometheusSnapshot.Parse(await context.Client.GetMetricsTextAsync(token).ConfigureAwait(false));
            foreach (int workers in sweep)
            {
                if (workers > 0) await ScaleAsync(context, workerSet, workers, laneLabel, token).ConfigureAwait(false);
                List<Node> lane = LaneNodes(await RunnerSupport.ReadyNodesAsync(context.Client, token).ConfigureAwait(false), laneLabel);
                int slots = lane.Sum(n => n.MaxConcurrentRuns);
                foreach (string arm in arms)
                {
                    if (arm == "direct" && workers > 0 && workers != sweep[0]) continue;
                    List<double> loads = mode == "trace" ? new List<double> { 0 } : mode == "closed" ? concurrency.Select(c => (double)c).ToList() : rates;
                    foreach (double load in loads)
                    {
                        token.ThrowIfCancellationRequested();
                        LevelSettings settings = new LevelSettings();
                        settings.Arm = arm;
                        settings.Mode = mode;
                        settings.ArrivalOffsetsMs = trace?.OffsetsMs;
                        settings.Concurrency = mode == "closed" ? (int)load : 0;
                        settings.Rate = mode == "trace" ? trace!.OffsetsMs.Count(offset => offset < durationSeconds * 1000.0) / (double)durationSeconds : mode == "open" ? load : 0;
                        settings.TenantId = workspace.TenantId;
                        settings.Agent = agent;
                        settings.Input = inputText;
                        settings.Parameters = parameters;
                        settings.DelayMs = delayMs;
                        settings.WaitSeconds = waitSeconds;
                        settings.MaxInFlight = maxInFlight;
                        settings.Direct = direct;

                        BenchmarkContext.Log("load " + arm + " " + mode + " " + (mode == "trace" ? "trace " + trace!.OffsetsMs.Count + " arrivals" : mode == "closed" ? "c" + settings.Concurrency : load.ToString("0.##", CultureInfo.InvariantCulture) + "/s") + ", " + lane.Count + " lane workers (" + slots + " slots): warmup " + warmupSeconds + " s");
                        if (warmupSeconds > 0) await RunWindowAsync(context.Client, settings, warmupSeconds, token).ConfigureAwait(false);
                        PrometheusSnapshot before = PrometheusSnapshot.Parse(await context.Client.GetMetricsTextAsync(token).ConfigureAwait(false));
                        WindowResult window = await RunWindowAsync(context.Client, settings, durationSeconds, token).ConfigureAwait(false);
                        PrometheusSnapshot after = PrometheusSnapshot.Parse(await context.Client.GetMetricsTextAsync(token).ConfigureAwait(false));
                        LoadLevelResult level = Summarize(window, settings, durationSeconds, context.Resamples, StableHash.Seed(context.Seed, arm + "/" + load.ToString(CultureInfo.InvariantCulture) + "/" + workers.ToString(CultureInfo.InvariantCulture)));
                        level.Workers = arm == "direct" ? 0 : lane.Count;
                        level.Slots = arm == "direct" ? 0 : slots;
                        if (arm != "direct")
                        {
                            List<StageDelta> allStages = after.Since(before, 1000);
                            level.Stages = allStages.Take(20).ToList();
                            if (level.Succeeded > 0)
                            {
                                List<StageDelta> database = after.Counts.Where(s => s.Key.StartsWith("garrison_db_operation_duration_seconds", StringComparison.Ordinal))
                                    .Select(s => new StageDelta { Series = s.Key, Count = Math.Max(0, s.Value - (before.Counts.TryGetValue(s.Key, out double prior) ? prior : 0)) }).ToList();
                                if (database.Count > 0)
                                {
                                    level.EstimatedDbStatementsPerSucceededRun = database.Sum(s => s.Count) / level.Succeeded;
                                    level.EstimatedRequestHistoryHeaderInsertsPerSucceededRun = database.Where(s => s.Series.Contains("table=\"request_history_headers\"", StringComparison.Ordinal) && s.Series.Contains("operation=\"insert\"", StringComparison.Ordinal)).Sum(s => s.Count) / level.Succeeded;
                                }
                            }
                        }
                        if (databaseAttribution && arm != "direct")
                            await CollectDatabaseUsageAsync(context.Client, workspace.TenantId, window, level, attributionSeconds, token).ConfigureAwait(false);
                        report.LoadLevels.Add(level);
                        BenchmarkContext.Log("  " + level.Succeeded + " ok, " + level.Failed + " failed, " + ReportWriter.N(level.Throughput, "F2") + " ops/s, p50 " + (level.Latency == null ? "n/a" : ReportWriter.N(level.Latency.P50, "F0")) + " ms, p95 " + (level.Latency == null ? "n/a" : ReportWriter.N(level.Latency.P95, "F0")) + " ms");
                    }
                }
            }
            PrometheusSnapshot last = PrometheusSnapshot.Parse(await context.Client.GetMetricsTextAsync(token).ConfigureAwait(false));
            report.Stages = last.Since(first, 25);
            report.Notes.Add("Closed loop hides stalls (coordinated omission); use --mode open for latency claims. Open loop measures from the scheduled send time.");
            if (arms.Contains("direct")) report.Notes.Add("The direct arm runs the fake harness on the machine that runs the benchmark harness, not inside a worker container.");
            await RunnerSupport.FinishAsync(context, report, loaded.Dataset.Name, loaded.Sha256, loaded.Path, startedUtc, null, token).ConfigureAwait(false);
            return RunnerSupport.ExitCode(context, report);
        }

        /// <summary>
        /// Nodes carrying a key=value label.
        /// </summary>
        /// <param name="nodes">Nodes.</param>
        /// <param name="label">key=value; empty matches all.</param>
        /// <returns>Matching nodes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when nodes is null.</exception>
        public static List<Node> LaneNodes(List<Node> nodes, string label)
        {
            if (nodes == null) throw new ArgumentNullException(nameof(nodes));
            if (String.IsNullOrEmpty(label) || !label.Contains('=')) return nodes;
            string key = label.Substring(0, label.IndexOf('='));
            string value = label.Substring(label.IndexOf('=') + 1);
            return nodes.Where(n => n.Labels.Any(l => l.Key == key && l.Value == value)).ToList();
        }

        /// <summary>
        /// Scale the worker StatefulSet and wait until that many lane workers are Ready (and no more).
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="statefulSet">StatefulSet name.</param>
        /// <param name="workers">Replicas.</param>
        /// <param name="laneLabel">Lane label of those workers.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="InvalidOperationException">Thrown when scaling fails or the workers do not become Ready.</exception>
        public static async Task ScaleAsync(BenchmarkContext context, string statefulSet, int workers, string laneLabel, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            BenchmarkContext.Log("scaling statefulset/" + statefulSet + " to " + workers);
            ProcessResult scale = await context.KubectlAsync(new string[] { "scale", "statefulset/" + statefulSet, "--replicas", workers.ToString(CultureInfo.InvariantCulture) }, 60000, token).ConfigureAwait(false);
            if (scale.ExitCode != 0) throw new InvalidOperationException("kubectl scale failed: " + scale.Stderr.Trim());
            DateTime deadline = DateTime.UtcNow.AddMinutes(10);
            while (DateTime.UtcNow < deadline)
            {
                List<Node> lane = LaneNodes(await RunnerSupport.ReadyNodesAsync(context.Client, token).ConfigureAwait(false), laneLabel);
                if (lane.Count == workers && lane.All(n => n.ActiveRuns == 0)) return;
                await Task.Delay(2000, token).ConfigureAwait(false);
            }
            throw new InvalidOperationException("Workers did not settle at " + workers + " Ready lane nodes within 10 minutes.");
        }

        #endregion

        #region Private-Methods

        private static async Task<WindowResult> RunWindowAsync(GarrisonClient client, LevelSettings settings, int seconds, CancellationToken token)
        {
            WindowResult result = new WindowResult();
            Stopwatch clock = Stopwatch.StartNew();
            double windowMs = seconds * 1000.0;
            int sequence = 0;
            if (settings.Mode == "closed")
            {
                List<Task> loops = new List<Task>();
                for (int w = 0; w < settings.Concurrency; w++)
                {
                    loops.Add(Task.Run(async () =>
                    {
                        while (clock.Elapsed.TotalMilliseconds < windowMs && !token.IsCancellationRequested)
                        {
                            int n = Interlocked.Increment(ref sequence);
                            LoadOperation op = await OneAsync(client, settings, clock, clock.Elapsed.TotalMilliseconds, n, token).ConfigureAwait(false);
                            result.Operations.Add(op);
                        }
                    }, token));
                }
                await Task.WhenAll(loops).ConfigureAwait(false);
            }
            else
            {
                List<Task> inFlight = new List<Task>();
                using (SemaphoreSlim gate = new SemaphoreSlim(settings.MaxInFlight, settings.MaxInFlight))
                {
                    double intervalMs = settings.Rate > 0 ? 1000.0 / settings.Rate : 0;
                    for (int i = 0; ; i++)
                    {
                        if (settings.ArrivalOffsetsMs != null && i >= settings.ArrivalOffsetsMs.Count) break;
                        double due = settings.ArrivalOffsetsMs == null ? i * intervalMs : settings.ArrivalOffsetsMs[i];
                        if (due >= windowMs) break;
                        double wait = due - clock.Elapsed.TotalMilliseconds;
                        if (wait > 1) await Task.Delay(TimeSpan.FromMilliseconds(wait), token).ConfigureAwait(false);
                        if (!await gate.WaitAsync(0, token).ConfigureAwait(false))
                        {
                            LoadOperation dropped = new LoadOperation();
                            dropped.ScheduledMs = due;
                            dropped.EndMs = clock.Elapsed.TotalMilliseconds;
                            dropped.FailureKind = "client: more than " + settings.MaxInFlight + " in flight";
                            result.Operations.Add(dropped);
                            continue;
                        }
                        int n = Interlocked.Increment(ref sequence);
                        double scheduled = due;
                        inFlight.Add(Task.Run(async () =>
                        {
                            try
                            {
                                LoadOperation op = await OneAsync(client, settings, clock, scheduled, n, token).ConfigureAwait(false);
                                result.Operations.Add(op);
                            }
                            finally
                            {
                                gate.Release();
                            }
                        }, token));
                    }
                    await Task.WhenAll(inFlight).ConfigureAwait(false);
                }
            }
            result.ElapsedMs = clock.Elapsed.TotalMilliseconds;
            return result;
        }

        private static async Task<LoadOperation> OneAsync(GarrisonClient client, LevelSettings settings, Stopwatch clock, double scheduledMs, int n, CancellationToken token)
        {
            LoadOperation op = new LoadOperation();
            op.ScheduledMs = scheduledMs;
            string input = settings.Input + " " + n.ToString(CultureInfo.InvariantCulture);
            if (settings.Arm == "direct" && settings.Direct != null)
            {
                List<string> arguments = new List<string> { "--format", "claude" };
                if (settings.DelayMs > 0)
                {
                    arguments.Add("--delay-ms");
                    arguments.Add(settings.DelayMs.ToString(CultureInfo.InvariantCulture));
                }
                DirectResult direct = await settings.Direct.RunAsync(arguments, input, settings.WaitSeconds * 1000, token).ConfigureAwait(false);
                op.EndMs = clock.Elapsed.TotalMilliseconds;
                op.Success = direct.ExitCode == 0 && !direct.IsError && direct.Error == null;
                if (!op.Success) op.FailureKind = direct.Error ?? "harness exit " + direct.ExitCode.ToString(CultureInfo.InvariantCulture);
            }
            else
            {
                RunCreateRequest request = new RunCreateRequest();
                request.Input = input;
                request.Parameters = settings.Parameters;
                request.Wait = true;
                request.WaitSeconds = settings.WaitSeconds;
                request.CancelOnDisconnect = false;
                ApiResponse<Run> response = await client.InvokeAsync(settings.TenantId, settings.Agent, request, token).ConfigureAwait(false);
                Run? run = response.Body;
                bool asynchronousFallback = response.StatusCode == 202 && run != null;
                if (asynchronousFallback)
                {
                    DateTime deadline = DateTime.UtcNow.AddSeconds(settings.WaitSeconds);
                    while (run != null && !Terminal(run.Status) && DateTime.UtcNow < deadline)
                    {
                        await Task.Delay(50, token).ConfigureAwait(false);
                        response = await client.GetRunAsync(settings.TenantId, run.Id, token).ConfigureAwait(false);
                        if (!response.IsSuccess || response.Body == null) break;
                        run = response.Body;
                    }
                }
                op.EndMs = clock.Elapsed.TotalMilliseconds;
                if (run != null)
                {
                    op.RunId = run.Id;
                    op.QueueMs = run.QueueMs;
                    op.ExecutionMs = run.ExecutionMs;
                    op.TotalMs = run.TotalMs;
                }
                op.Success = response.StatusCode == 200 && run != null && run.Status == "Succeeded";
                if (!op.Success)
                {
                    if (!response.IsSuccess) op.FailureKind = response.Describe();
                    else if (run == null) op.FailureKind = "no run in response";
                    else if (response.StatusCode == 202) op.FailureKind = "202: the wait ended before the run finished (status " + run.Status + ")";
                    else op.FailureKind = "run " + run.Status + "/" + run.Outcome;
                }
            }
            op.LatencyMs = op.EndMs - op.ScheduledMs;
            return op;
        }

        private static bool Terminal(string? status)
        {
            return status == "Succeeded" || status == "Failed" || status == "Cancelled" || status == "TimedOut" || status == "Rejected";
        }

        private static async Task CollectDatabaseUsageAsync(GarrisonClient client, string tenantId, WindowResult window, LoadLevelResult level, int budgetSeconds, CancellationToken token)
        {
            long statements = 0;
            long reads = 0;
            long writes = 0;
            List<LoadOperation> operations = window.Operations.Where(o => o.Success && !String.IsNullOrEmpty(o.RunId)).ToList();
            // One shared flush grace and one global collection budget, never a grace period per run.
            DateTime graceDeadline = DateTime.UtcNow.AddSeconds(Math.Min(3, budgetSeconds));
            using (CancellationTokenSource budget = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                budget.CancelAfter(TimeSpan.FromSeconds(budgetSeconds));
                try
                {
                    foreach (LoadOperation operation in operations)
                    {
                        budget.Token.ThrowIfCancellationRequested();
                        List<RunDatabaseUsage>? usage = null;
                        do
                        {
                            ApiResponse<List<RunDatabaseUsage>> response = await client.GetRunDatabaseUsageAsync(tenantId, operation.RunId!, budget.Token).ConfigureAwait(false);
                            usage = response.IsSuccess ? response.Body : null;
                            if (usage?.Any(u => u.Operation == "complete") == true || !response.IsSuccess || DateTime.UtcNow >= graceDeadline) break;
                            await Task.Delay(25, budget.Token).ConfigureAwait(false);
                        } while (DateTime.UtcNow < graceDeadline);
                        if (usage == null || !usage.Any(u => u.Operation == "complete")) continue;
                        level.ExactDbUsageRuns++;
                        statements += usage.Sum(u => u.Statements);
                        reads += usage.Sum(u => u.Reads);
                        writes += usage.Sum(u => u.Writes);
                    }
                }
                catch (OperationCanceledException) when (!token.IsCancellationRequested) { }
            }
            level.ExactDbUsageMissingRuns = operations.Count - level.ExactDbUsageRuns;
            if (level.ExactDbUsageRuns > 0)
            {
                level.ExactScopedDbStatementsPerRun = statements / (double)level.ExactDbUsageRuns;
                level.ExactScopedDbReadsPerRun = reads / (double)level.ExactDbUsageRuns;
                level.ExactScopedDbWritesPerRun = writes / (double)level.ExactDbUsageRuns;
            }
        }

        private static LoadLevelResult Summarize(WindowResult window, LevelSettings settings, int durationSeconds, int resamples, int seed)
        {
            List<LoadOperation> ops = window.Operations.ToList();
            LoadLevelResult level = new LoadLevelResult();
            level.Arm = settings.Arm;
            level.Mode = settings.Mode;
            level.Concurrency = settings.Concurrency;
            level.TargetRate = settings.Rate;
            level.Started = ops.Count;
            List<LoadOperation> ok = ops.Where(o => o.Success).ToList();
            level.Succeeded = ok.Count;
            level.Failed = ops.Count - ok.Count;
            foreach (IGrouping<string, LoadOperation> kind in ops.Where(o => !o.Success).GroupBy(o => o.FailureKind ?? "unknown"))
                level.FailuresByKind[kind.Key] = kind.Count();
            level.MeasuredSeconds = Math.Max(window.ElapsedMs, durationSeconds * 1000.0) / 1000.0;
            level.Throughput = level.MeasuredSeconds > 0 ? level.Succeeded / level.MeasuredSeconds : 0;
            int buckets = Math.Max(1, (int)Math.Ceiling(level.MeasuredSeconds));
            double[] perSecond = new double[buckets];
            foreach (LoadOperation op in ok)
            {
                int bucket = Math.Min(buckets - 1, Math.Max(0, (int)(op.EndMs / 1000.0)));
                perSecond[bucket]++;
            }
            level.PerSecond = perSecond.ToList();
            if (buckets >= 2) level.ThroughputCi = Bootstrap.MeanCi(level.PerSecond, resamples, seed);
            if (ok.Count > 0)
            {
                level.Latency = LatencyStatistics.From(ok.Select(o => o.LatencyMs), resamples, seed + 1);
                AddTiming(level, "queueMs", ok.Where(o => o.QueueMs.HasValue).Select(o => o.QueueMs!.Value).ToList(), resamples, seed + 2);
                AddTiming(level, "executionMs", ok.Where(o => o.ExecutionMs.HasValue).Select(o => o.ExecutionMs!.Value).ToList(), resamples, seed + 3);
                AddTiming(level, "totalMs", ok.Where(o => o.TotalMs.HasValue).Select(o => o.TotalMs!.Value).ToList(), resamples, seed + 4);
                AddTiming(level, "serverOverheadMs", ok.Where(o => o.TotalMs.HasValue && o.ExecutionMs.HasValue).Select(o => o.TotalMs!.Value - o.ExecutionMs!.Value).ToList(), resamples, seed + 5);
                AddTiming(level, "clientOverheadMs", ok.Where(o => o.ExecutionMs.HasValue).Select(o => o.LatencyMs - o.ExecutionMs!.Value).ToList(), resamples, seed + 6);
            }
            return level;
        }

        private static void AddTiming(LoadLevelResult level, string name, List<double> values, int resamples, int seed)
        {
            if (values.Count > 0) level.Timings[name] = LatencyStatistics.From(values, resamples, seed);
        }

        #endregion
    }
}
