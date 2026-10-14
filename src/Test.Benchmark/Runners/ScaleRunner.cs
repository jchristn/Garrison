namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Datasets;
    using Garrison.Benchmark.Metrics;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The scale command (P14.15): load the control plane to failure. Each level submits K runs of the paced fake
    /// harness, spread round robin across every server replica, either at an offered rate without waiting (open loop)
    /// or from C clients that each invoke and wait (closed loop); waits for them to finish; then measures throughput,
    /// claim and end-to-end latency from the run records, and event inserts, queue wakeups, lease renewals, deployment
    /// lock contention, and database operations per run from the servers' metrics. Levels step up until one crosses a
    /// breaking threshold (error rate, claim or end-to-end latency, or a throughput plateau), and the report names the
    /// subsystem with the strongest saturation evidence.
    /// </summary>
    public static class ScaleRunner
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
            ScaleSettings settings = ReadSettings(context);
            if (settings.Mode != "open" && settings.Mode != "closed")
            {
                Console.Error.WriteLine("--mode must be open or closed.");
                return 2;
            }
            List<string> urls = context.Args.GetList("urls", context.Client.BaseUrl);
            string workloadPath = context.ResolvePath(context.Args.GetString("workload", "benchmarks/config/scale-workload.yaml"));
            if (!File.Exists(workloadPath))
            {
                Console.Error.WriteLine("Workload manifest not found: " + workloadPath);
                return 1;
            }
            byte[] workloadBytes = await File.ReadAllBytesAsync(workloadPath, token).ConfigureAwait(false);
            string workload = Encoding.UTF8.GetString(workloadBytes);
            string workloadSha = DatasetLoader.Sha256Hex(workloadBytes);
            string adminKey = context.Args.GetString("admin-key", BenchmarkContext.DefaultAdminKey, "GARRISON_BENCH_ADMIN_KEY");
            int connections = context.Args.GetInt("max-connections", 1024, 1, 65535);
            int requestTimeout = context.Args.GetInt("request-timeout-seconds", 660, 1, 3600);
            int readyTimeout = context.Args.GetInt("ready-timeout-seconds", 120, 1, 3600);
            string? suffix = context.Args.GetOptional("workspace-suffix");

            using (ScaleCluster cluster = new ScaleCluster(urls, adminKey, connections, requestTimeout))
            {
                for (int i = 0; i < cluster.Count; i++)
                {
                    if (!await RunnerSupport.WaitReadyAsync(cluster.Client(i), TimeSpan.FromSeconds(readyTimeout), token).ConfigureAwait(false)) return 1;
                }

                DateTime startedUtc = DateTime.UtcNow;
                BenchmarkReport report = new BenchmarkReport();
                report.Kind = "scale";
                ScaleSummary summary = new ScaleSummary();
                report.Scale = summary;
                summary.Tier = settings.Tier;
                summary.Servers = cluster.Count;
                summary.ServerUrls = cluster.Urls.ToList();
                summary.RunsPerLevel = settings.RunsPerLevel;
                summary.RunEventsPerSecond = settings.EventsPerSecond;
                summary.RunDurationMs = settings.DurationMs;
                summary.Thresholds["maxErrorRate"] = settings.MaxErrorRate.ToString("R", CultureInfo.InvariantCulture);
                summary.Thresholds["maxClaimP95Ms"] = settings.MaxClaimP95Ms.ToString("R", CultureInfo.InvariantCulture);
                summary.Thresholds["maxEndToEndP95Ms"] = settings.EndToEndThresholdMs.ToString("R", CultureInfo.InvariantCulture);
                summary.Thresholds["plateauRatio"] = settings.PlateauRatio.ToString("R", CultureInfo.InvariantCulture);

                GarrisonClient admin = cluster.Client(0);
                Workspace workspace;
                string agentId;
                try
                {
                    workspace = await ProvisionAsync(admin, workload, suffix, token).ConfigureAwait(false);
                    ApiResponse<Agent> agent = await admin.GetAgentAsync(workspace.TenantId, settings.Agent, token).ConfigureAwait(false);
                    if (agent.Body == null) throw new InvalidOperationException("agent " + settings.Agent + " is not in the workload (" + agent.Describe() + ")");
                    agentId = agent.Body.Id;
                }
                catch (InvalidOperationException e)
                {
                    report.Incomplete = true;
                    report.IncompleteReason = "Incomplete scale run: the workload did not provision (" + e.Message + ")";
                    await RunnerSupport.FinishAsync(context, report, "scale-workload", workloadSha, workloadPath, startedUtc, null, token).ConfigureAwait(false);
                    return 3;
                }

                List<Node> nodes = await RunnerSupport.ReadyNodesAsync(admin, token).ConfigureAwait(false);
                summary.Workers = nodes.Count;
                summary.Slots = nodes.Sum(n => n.MaxConcurrentRuns);
                summary.SlotCapacityRunsPerSecond = settings.DurationMs > 0 ? summary.Slots / (settings.DurationMs / 1000.0) : 0;
                BenchmarkContext.Log("scale " + settings.Tier + ": " + cluster.Count + " servers, " + summary.Workers + " workers, " + summary.Slots + " slots (about " + summary.SlotCapacityRunsPerSecond.ToString("F0", CultureInfo.InvariantCulture) + " runs/s of slot capacity at " + settings.DurationMs + " ms per run), " + settings.RunsPerLevel + " runs per level");

                List<double> loads = settings.Mode == "open" ? settings.Rates : settings.Concurrency.Select(c => (double)c).ToList();
                ScaleLevelResult? previous = null;
                for (int index = 0; index < loads.Count; index++)
                {
                    token.ThrowIfCancellationRequested();
                    if (index > 0 && settings.SettleSeconds > 0) await Task.Delay(TimeSpan.FromSeconds(settings.SettleSeconds), token).ConfigureAwait(false);
                    ScaleLevelResult level = new ScaleLevelResult();
                    level.Index = index + 1;
                    level.Mode = settings.Mode;
                    level.OfferedRate = settings.Mode == "open" ? loads[index] : 0;
                    level.Concurrency = settings.Mode == "closed" ? (int)loads[index] : 0;
                    List<Node> ready = await RunnerSupport.ReadyNodesAsync(admin, token).ConfigureAwait(false);
                    level.Workers = ready.Count;
                    level.Slots = ready.Sum(n => n.MaxConcurrentRuns);

                    await RunLevelAsync(cluster, settings, level, workspace.TenantId, agentId, token).ConfigureAwait(false);
                    ScaleAnalyzer.Judge(level, previous, settings);
                    level.Signals = ScaleAnalyzer.Signals(level, summary.Levels.Count > 0 ? summary.Levels[0] : level, settings);
                    summary.Levels.Add(level);
                    LogLevel(level);
                    previous = level;
                    if (level.Broken && settings.StopOnBreak) break;
                }

                Summarize(summary);
                report.Notes.Add("Throughput is the rate at which successful runs completed, from the first completion to the last in each level. Claim latency is queued to leased; end-to-end is created to completed; both come from the run records.");
                report.Notes.Add("Subsystem counters are summed over every server replica's /metrics and include background work (heartbeats, maintenance, gauges) during the level; per-run values divide by the runs that finished.");
                report.Notes.Add("The saturation attribution is a heuristic that compares each level with the first; read the evidence column. Worker capacity and the load generator are not part of the control plane: when either saturates first, the control plane's ceiling is above the measured numbers.");
                if (summary.SaturatedInControlPlane == false) report.Notes.Add("This sweep saturated outside the control plane (" + summary.SaturatedSubsystem + "); add slots or shorten runs to push the control plane further.");
                report.Notes.Add("Servers, workers, every fake harness process, and the load generator share one machine, so host CPU is part of what saturates; HostLoadAverage records the one-minute load average after each level.");
                await RunnerSupport.FinishAsync(context, report, "scale-workload", workloadSha, workloadPath, startedUtc, null, token).ConfigureAwait(false);
                PrintVerdict(summary);
                return RunnerSupport.ExitCode(context, report);
            }
        }

        #endregion

        #region Private-Methods

        private static ScaleSettings ReadSettings(BenchmarkContext context)
        {
            ScaleSettings settings = new ScaleSettings();
            settings.Mode = context.Args.GetString("mode", "open");
            settings.Rates = context.Args.GetDoubleList("rates", "25,50,100,200,400", 0.1, 100000);
            settings.Concurrency = context.Args.GetIntList("concurrency", "50,100,200,400,800", 1, 100000);
            settings.RunsPerLevel = context.Args.GetInt("runs", 1000, 1, 1000000);
            settings.Agent = context.Args.GetString("agent", "scale-echo");
            settings.EventsPerSecond = context.Args.GetInt("events-per-second", 10, 0, 10000);
            settings.DurationMs = context.Args.GetInt("duration-ms", 2000, 0, 600000);
            settings.SubmitConcurrency = context.Args.GetInt("submit-concurrency", 512, 1, 100000);
            settings.WaitSeconds = context.Args.GetInt("wait-seconds", 300, 1, 600);
            settings.DrainSeconds = context.Args.GetInt("drain-seconds", 300, 1, 86400);
            settings.SettleSeconds = context.Args.GetInt("settle-seconds", 5, 0, 3600);
            settings.MaxErrorRate = context.Args.GetDouble("max-error-rate", 0.01, 0, 1);
            settings.MaxClaimP95Ms = context.Args.GetDouble("max-claim-p95-ms", 5000, 1, 86400000);
            settings.MaxEndToEndP95Ms = context.Args.GetDouble("max-e2e-p95-ms", 0, 0, 86400000);
            settings.PlateauRatio = context.Args.GetDouble("plateau-ratio", 0.9, 0.01, 1);
            settings.StopOnBreak = context.Args.GetBool("stop-on-break", true);
            settings.Tier = context.Args.GetString("tier", "custom");
            return settings;
        }

        private static async Task<Workspace> ProvisionAsync(GarrisonClient client, string workload, string? suffix, CancellationToken token)
        {
            string name = "bench-scale-" + StableHash.Hex(workload, 8);
            if (!String.IsNullOrEmpty(suffix)) name += "-" + suffix;
            Provisioner provisioner = new Provisioner(client);
            Workspace workspace = await provisioner.EnsureTenantAsync(name, "Scale workload (Garrison.Benchmark scale, P14.15).", token).ConfigureAwait(false);
            ApiResponse<ManifestApply> apply = await client.ApplyManifestAsync(workspace.TenantId, workload, false, token).ConfigureAwait(false);
            if (!apply.IsSuccess || apply.Body == null || apply.Body.FailedCount > 0)
            {
                string failures = apply.Body == null ? Provisioner.Excerpt(apply.RawBody) : String.Join("; ", apply.Body.Items.Where(i => i.Result == "Failed").Select(i => i.Kind + " " + i.Name + ": " + i.Message));
                throw new InvalidOperationException("applying the scale workload into " + name + " failed (" + apply.Describe() + "): " + failures);
            }
            return workspace;
        }

        private static async Task RunLevelAsync(ScaleCluster cluster, ScaleSettings settings, ScaleLevelResult level, string tenantId, string agentId, CancellationToken token)
        {
            PrometheusSamples before = await cluster.ScrapeAsync(token).ConfigureAwait(false);
            double finishedBase = FinishedRuns(before, settings.Agent);
            DateTime levelStartUtc = DateTime.UtcNow;
            Stopwatch clock = Stopwatch.StartNew();
            BenchmarkContext.Log("level " + level.Index + " (" + ScaleAnalyzer.LoadText(level) + "): submitting " + settings.RunsPerLevel + " runs");

            List<ScaleSubmission> submissions = settings.Mode == "open"
                ? await SubmitOpenAsync(cluster, settings, level.OfferedRate, tenantId, token).ConfigureAwait(false)
                : await SubmitClosedAsync(cluster, settings, level.Concurrency, tenantId, token).ConfigureAwait(false);
            level.SubmitSeconds = clock.Elapsed.TotalSeconds;
            int accepted = submissions.Count(s => s.RunId != null);
            level.AchievedSubmitRate = level.SubmitSeconds > 0 ? accepted / level.SubmitSeconds : 0;

            double peakConnections = 0;
            PrometheusSamples after = before;
            DateTime drainDeadline = DateTime.UtcNow.AddSeconds(settings.DrainSeconds);
            DateTime lastLog = DateTime.UtcNow;
            while (true)
            {
                after = await cluster.ScrapeAsync(token).ConfigureAwait(false);
                peakConnections = Math.Max(peakConnections, after.Sum("garrison_db_connections_in_use"));
                double finished = FinishedRuns(after, settings.Agent) - finishedBase;
                if (finished >= accepted || DateTime.UtcNow >= drainDeadline || after.Scrapes == 0) break;
                if ((DateTime.UtcNow - lastLog).TotalSeconds >= 10)
                {
                    BenchmarkContext.Log("  draining: " + finished.ToString("F0", CultureInfo.InvariantCulture) + " of " + accepted + " finished");
                    lastLog = DateTime.UtcNow;
                }
                await Task.Delay(1000, token).ConfigureAwait(false);
            }
            level.WallSeconds = clock.Elapsed.TotalSeconds;

            Dictionary<string, Run> runs = await FetchRunsAsync(cluster.Client(0), tenantId, agentId, levelStartUtc.AddSeconds(-5), submissions, token).ConfigureAwait(false);
            ScaleAnalyzer.MeasureRuns(level, submissions, runs);
            level.Subsystems = ScaleAnalyzer.Subsystems(before, after, settings.Agent, peakConnections);
            level.EventsPerSecond = level.WallSeconds > 0 ? level.Subsystems.EventsReceived / level.WallSeconds : 0;
            level.EventsPerRun = level.Subsystems.RunsFinished > 0 ? level.Subsystems.EventsReceived / level.Subsystems.RunsFinished : 0;
            level.HostLoadAverage = await LoadAverageAsync(token).ConfigureAwait(false);
        }

        private static async Task<List<ScaleSubmission>> SubmitOpenAsync(ScaleCluster cluster, ScaleSettings settings, double rate, string tenantId, CancellationToken token)
        {
            ConcurrentBag<ScaleSubmission> results = new ConcurrentBag<ScaleSubmission>();
            List<Task> inFlight = new List<Task>();
            Stopwatch clock = Stopwatch.StartNew();
            double intervalMs = 1000.0 / rate;
            using (SemaphoreSlim gate = new SemaphoreSlim(settings.SubmitConcurrency, settings.SubmitConcurrency))
            {
                for (int i = 0; i < settings.RunsPerLevel; i++)
                {
                    token.ThrowIfCancellationRequested();
                    double due = i * intervalMs;
                    double wait = due - clock.Elapsed.TotalMilliseconds;
                    if (wait > 1) await Task.Delay(TimeSpan.FromMilliseconds(wait), token).ConfigureAwait(false);
                    int sequence = i + 1;
                    if (!await gate.WaitAsync(0, token).ConfigureAwait(false))
                    {
                        ScaleSubmission dropped = new ScaleSubmission();
                        dropped.Sequence = sequence;
                        dropped.Server = i % cluster.Count;
                        dropped.FailureKind = "client: more than " + settings.SubmitConcurrency + " submissions in flight";
                        results.Add(dropped);
                        continue;
                    }
                    inFlight.Add(Task.Run(async () =>
                    {
                        try
                        {
                            results.Add(await CreateAsync(cluster, settings, tenantId, sequence, token).ConfigureAwait(false));
                        }
                        finally
                        {
                            gate.Release();
                        }
                    }, token));
                }
                await Task.WhenAll(inFlight).ConfigureAwait(false);
            }
            return results.OrderBy(r => r.Sequence).ToList();
        }

        private static async Task<List<ScaleSubmission>> SubmitClosedAsync(ScaleCluster cluster, ScaleSettings settings, int concurrency, string tenantId, CancellationToken token)
        {
            ConcurrentBag<ScaleSubmission> results = new ConcurrentBag<ScaleSubmission>();
            int next = 0;
            List<Task> clients = new List<Task>();
            for (int c = 0; c < concurrency; c++)
            {
                clients.Add(Task.Run(async () =>
                {
                    while (!token.IsCancellationRequested)
                    {
                        int sequence = Interlocked.Increment(ref next);
                        if (sequence > settings.RunsPerLevel) return;
                        results.Add(await InvokeAsync(cluster, settings, tenantId, sequence, token).ConfigureAwait(false));
                    }
                }, token));
            }
            await Task.WhenAll(clients).ConfigureAwait(false);
            return results.OrderBy(r => r.Sequence).ToList();
        }

        private static async Task<ScaleSubmission> CreateAsync(ScaleCluster cluster, ScaleSettings settings, string tenantId, int sequence, CancellationToken token)
        {
            ScaleSubmission submission = new ScaleSubmission();
            submission.Sequence = sequence;
            submission.Server = sequence % cluster.Count;
            RunCreateRequest request = Request(settings, sequence);
            request.AgentName = settings.Agent;
            request.Wait = false;
            ApiResponse<Run> response = await cluster.Client(submission.Server).CreateRunAsync(tenantId, request, null, token).ConfigureAwait(false);
            submission.LatencyMs = response.ElapsedMs;
            if (response.IsSuccess && response.Body != null && !String.IsNullOrEmpty(response.Body.Id)) submission.RunId = response.Body.Id;
            else submission.FailureKind = response.Describe();
            return submission;
        }

        private static async Task<ScaleSubmission> InvokeAsync(ScaleCluster cluster, ScaleSettings settings, string tenantId, int sequence, CancellationToken token)
        {
            ScaleSubmission submission = new ScaleSubmission();
            submission.Sequence = sequence;
            submission.Server = sequence % cluster.Count;
            RunCreateRequest request = Request(settings, sequence);
            request.Wait = true;
            request.WaitSeconds = settings.WaitSeconds;
            request.CancelOnDisconnect = false;
            ApiResponse<Run> response = await cluster.Client(submission.Server).InvokeAsync(tenantId, settings.Agent, request, token).ConfigureAwait(false);
            submission.LatencyMs = response.ElapsedMs;
            if (response.IsSuccess && response.Body != null && !String.IsNullOrEmpty(response.Body.Id)) submission.RunId = response.Body.Id;
            else submission.FailureKind = response.Describe();
            return submission;
        }

        private static RunCreateRequest Request(ScaleSettings settings, int sequence)
        {
            RunCreateRequest request = new RunCreateRequest();
            request.Input = "scale run " + sequence.ToString(CultureInfo.InvariantCulture);
            request.Parameters = new Dictionary<string, string>
            {
                { "eventsPerSecond", settings.EventsPerSecond.ToString(CultureInfo.InvariantCulture) },
                { "durationMs", settings.DurationMs.ToString(CultureInfo.InvariantCulture) }
            };
            return request;
        }

        private static double FinishedRuns(PrometheusSamples samples, string agent)
        {
            return samples.Sum("garrison_runs_finished_total", s => s.Label("agent") == agent);
        }

        private static async Task<Dictionary<string, Run>> FetchRunsAsync(GarrisonClient client, string tenantId, string agentId, DateTime fromUtc, List<ScaleSubmission> submissions, CancellationToken token)
        {
            HashSet<string> wanted = new HashSet<string>(submissions.Where(s => s.RunId != null).Select(s => s.RunId!), StringComparer.Ordinal);
            Dictionary<string, Run> runs = new Dictionary<string, Run>(StringComparer.Ordinal);
            int skip = 0;
            for (int page = 0; page < 10000 && runs.Count < wanted.Count; page++)
            {
                ApiResponse<EnumerationResult<Run>> response = await client.ListRunsAsync(tenantId, agentId, fromUtc, skip, token).ConfigureAwait(false);
                if (response.Body == null || response.Body.Objects.Count == 0) break;
                foreach (Run run in response.Body.Objects)
                {
                    if (wanted.Contains(run.Id)) runs[run.Id] = run;
                }
                skip += response.Body.Objects.Count;
                if (response.Body.EndOfResults) break;
            }
            return runs;
        }

        private static async Task<double?> LoadAverageAsync(CancellationToken token)
        {
            try
            {
                string? text = null;
                if (OperatingSystem.IsMacOS())
                {
                    ProcessResult result = await ExternalProcess.RunAsync("sysctl", new string[] { "-n", "vm.loadavg" }, null, null, 5000, token).ConfigureAwait(false);
                    if (result.ExitCode == 0) text = result.Stdout.Replace("{", String.Empty, StringComparison.Ordinal).Trim();
                }
                else if (OperatingSystem.IsLinux() && File.Exists("/proc/loadavg"))
                {
                    text = await File.ReadAllTextAsync("/proc/loadavg", token).ConfigureAwait(false);
                }
                if (String.IsNullOrWhiteSpace(text)) return null;
                string first = text.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries)[0];
                if (Double.TryParse(first, NumberStyles.Float, CultureInfo.InvariantCulture, out double load)) return load;
            }
            catch (Exception e) when (e is IOException || e is InvalidOperationException || e is System.ComponentModel.Win32Exception)
            {
            }
            return null;
        }

        private static void Summarize(ScaleSummary summary)
        {
            ScaleLevelResult? best = summary.Levels.Where(l => !l.Broken).OrderByDescending(l => l.RunsPerSecond).FirstOrDefault();
            if (best != null)
            {
                summary.MaxSustainedRunsPerSecond = best.RunsPerSecond;
                summary.MaxSustainedEventsPerSecond = best.EventsPerSecond;
                summary.MaxSustainedLevel = best.Index;
            }
            ScaleLevelResult? broken = summary.Levels.FirstOrDefault(l => l.Broken);
            if (broken != null)
            {
                summary.BreakingLevel = broken.Index;
                summary.BreakingLoad = ScaleAnalyzer.LoadText(broken);
                summary.BreakReasons = broken.BreakReasons.ToList();
                SaturationSignal? top = broken.Signals.FirstOrDefault();
                if (top != null)
                {
                    summary.SaturatedSubsystem = top.Subsystem;
                    summary.SaturatedInControlPlane = top.ControlPlane;
                }
            }
        }

        private static void LogLevel(ScaleLevelResult level)
        {
            StringBuilder line = new StringBuilder();
            line.Append("  level ").Append(level.Index).Append(' ').Append(ScaleAnalyzer.LoadText(level)).Append(": ")
                .Append(level.Succeeded).Append('/').Append(level.Submitted).Append(" ok, ")
                .Append(level.RunsPerSecond.ToString("F1", CultureInfo.InvariantCulture)).Append(" runs/s, ")
                .Append(level.EventsPerSecond.ToString("F0", CultureInfo.InvariantCulture)).Append(" events/s, claim p95 ")
                .Append(level.ClaimLatency == null ? "n/a" : level.ClaimLatency.P95.ToString("F0", CultureInfo.InvariantCulture)).Append(" ms, e2e p95 ")
                .Append(level.EndToEndLatency == null ? "n/a" : level.EndToEndLatency.P95.ToString("F0", CultureInfo.InvariantCulture)).Append(" ms, db ops/run ")
                .Append(level.Subsystems.DbStatementsPerRun.ToString("F1", CultureInfo.InvariantCulture));
            if (level.Broken) line.Append(" BROKE: ").Append(String.Join("; ", level.BreakReasons));
            BenchmarkContext.Log(line.ToString());
        }

        private static void PrintVerdict(ScaleSummary summary)
        {
            BenchmarkContext.Log("max sustained: " + summary.MaxSustainedRunsPerSecond.ToString("F1", CultureInfo.InvariantCulture) + " runs/s, " + summary.MaxSustainedEventsPerSecond.ToString("F0", CultureInfo.InvariantCulture) + " events/s (level " + summary.MaxSustainedLevel + ")");
            if (summary.BreakingLevel > 0)
                BenchmarkContext.Log("broke at level " + summary.BreakingLevel + " (" + summary.BreakingLoad + "): " + String.Join("; ", summary.BreakReasons) + "; saturated: " + (summary.SaturatedSubsystem ?? "no clear signal"));
            else
                BenchmarkContext.Log("no level broke; raise --rates or --concurrency to find the ceiling");
        }

        #endregion
    }
}
