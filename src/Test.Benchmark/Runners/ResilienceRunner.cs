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
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The resilience command: behavior under injected failure. Harness-level scenarios (a failing harness, a harness
    /// that overruns its deadline) run on any stack. Infrastructure scenarios (a worker pod killed mid-run, a server pod
    /// killed under load, the database restarted under load) need the k3d stack and inject the fault with kubectl.
    /// Each scenario records lost runs (created but never finished), duplicate runs (one idempotency key, two runs),
    /// client-visible errors and whether they were clean JSON, and the recovery time.
    /// </summary>
    public static class ResilienceRunner
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
            List<string> scenarios = context.Args.GetList("scenarios", "harness-failure,harness-timeout,worker-kill,server-kill,database-restart");
            int concurrency = context.Args.GetInt("concurrency", 4, 1, 1000);
            int durationSeconds = context.Args.GetInt("duration-seconds", 30, 5, 3600);
            int faultAfterSeconds = context.Args.GetInt("fault-after-seconds", 8, 1, 3600);
            int runTimeoutSeconds = context.Args.GetInt("run-timeout-seconds", 300, 10, 3600);
            int delayMs = context.Args.GetInt("delay-ms", 300, 0, 5000);
            string faultMode = context.Args.GetString("fault-mode", "crash");
            string k3dNode = context.Args.GetString("k3d-node", "k3d-garrison-bench-server-0");
            if (faultMode != "crash" && faultMode != "delete")
            {
                Console.Error.WriteLine("--fault-mode must be crash or delete.");
                return 2;
            }
            string corpusId = context.Args.GetString("corpus", "load");
            BenchmarkCorpus? corpus = loaded.Dataset.Corpora.FirstOrDefault(c => c.Id == corpusId);
            if (corpus == null)
            {
                Console.Error.WriteLine("Dataset " + loaded.Dataset.Name + " has no corpus " + corpusId + ".");
                return 1;
            }
            if (!await RunnerSupport.WaitReadyAsync(context.Client, TimeSpan.FromSeconds(120), token).ConfigureAwait(false)) return 1;

            DateTime startedUtc = DateTime.UtcNow;
            BenchmarkReport report = new BenchmarkReport();
            report.Kind = "resilience";
            Workspace workspace = await new Provisioner(context.Client).ProvisionAsync(loaded.Dataset.Name, corpus, context.Args.GetOptional("workspace-suffix"), token).ConfigureAwait(false);
            ScenarioSettings settings = new ScenarioSettings();
            settings.TenantId = workspace.TenantId;
            settings.Concurrency = concurrency;
            settings.DurationSeconds = durationSeconds;
            settings.FaultAfterSeconds = faultAfterSeconds;
            settings.RunTimeoutSeconds = runTimeoutSeconds;
            settings.Parameters = new Dictionary<string, string> { { "delayMs", delayMs.ToString(CultureInfo.InvariantCulture) } };
            settings.FaultMode = faultMode;
            settings.K3dNode = k3dNode;

            foreach (string name in scenarios)
            {
                token.ThrowIfCancellationRequested();
                BenchmarkContext.Log("resilience scenario " + name);
                ResilienceScenarioResult result;
                switch (name)
                {
                    case "harness-failure":
                        result = await HarnessScenarioAsync(context, workspace.TenantId, "fail-echo", name, "A harness that reports failure and exits 1 on every run (fake harness --fail).", "Failed", "HarnessFailed", 10, 120, token).ConfigureAwait(false);
                        break;
                    case "harness-timeout":
                        result = await HarnessScenarioAsync(context, workspace.TenantId, "slow-echo", name, "A harness that would run about 13 s against a 3 s deadline (fake harness --delay-ms 1000, timeoutSeconds 3).", "TimedOut", "TimedOut", 3, 60, token).ConfigureAwait(false);
                        break;
                    case "worker-kill":
                        result = await FaultScenarioAsync(context, settings, name, "One lane worker's process is killed with SIGKILL while runs are in flight (--fault-mode crash; delete removes the pod instead, which lets it drain). Kubernetes restarts the container under the same node name. The load-echo deployment allows 3 attempts and retries on node loss.", "worker", "app.kubernetes.io/name=garrison-worker,bench.garrison.io/lane=alpha", token).ConfigureAwait(false);
                        break;
                    case "server-kill":
                        result = await FaultScenarioAsync(context, settings, name, "One control-plane process is killed with SIGKILL under load (--fault-mode crash) and Kubernetes restarts it; clients retry creations with the same idempotency key.", "server", "app.kubernetes.io/name=garrison-server", token).ConfigureAwait(false);
                        break;
                    case "database-restart":
                        result = await FaultScenarioAsync(context, settings, name, "The PostgreSQL process is killed with SIGKILL under load (--fault-mode crash) and restarts from its volume.", "postgres", "app.kubernetes.io/name=garrison-postgres", token).ConfigureAwait(false);
                        break;
                    default:
                        result = new ResilienceScenarioResult();
                        result.Name = name;
                        result.Skipped = true;
                        result.SkipReason = "unknown scenario";
                        break;
                }
                report.Scenarios.Add(result);
                BenchmarkContext.Log("  " + (result.Skipped ? "skipped: " + result.SkipReason : (result.Passed ? "pass" : "FAIL") + ", " + String.Join("; ", result.Criteria)));
                bool infrastructure = result.Name.EndsWith("kill", StringComparison.Ordinal) || result.Name == "database-restart";
                if (!result.Skipped && infrastructure)
                {
                    await RunnerSupport.WaitReadyAsync(context.Client, TimeSpan.FromMinutes(5), token).ConfigureAwait(false);
                    await Task.Delay(TimeSpan.FromSeconds(15), token).ConfigureAwait(false);
                }
            }
            foreach (ResilienceScenarioResult scenario in report.Scenarios.Where(s => !s.Skipped))
            {
                ProbeOutcome outcome = new ProbeOutcome();
                outcome.Corpus = "resilience";
                outcome.ProbeId = scenario.Name;
                outcome.Arm = "garrison";
                outcome.Type = scenario.Name;
                outcome.Category = scenario.Name.StartsWith("harness", StringComparison.Ordinal) ? "harness" : "infrastructure";
                outcome.Negative = true;
                outcome.Passed = scenario.Passed;
                outcome.Score = scenario.Passed ? 1 : 0;
                if (!scenario.Passed) outcome.Failures.AddRange(scenario.Criteria.Where(c => c.StartsWith("FAIL", StringComparison.Ordinal)));
                outcome.Observed = String.Join(", ", scenario.Outcomes.Select(o => o.Key + " " + o.Value));
                if (scenario.RecoverySeconds >= 0) outcome.Timings["recoverySeconds"] = scenario.RecoverySeconds;
                report.Outcomes.Add(outcome);
            }
            if (report.Scenarios.Any(s => !s.Skipped && s.RunsLost > 0))
            {
                report.Incomplete = true;
                report.IncompleteReason = "Lost runs: " + report.Scenarios.Sum(s => s.RunsLost) + " runs never reached a terminal status";
            }
            await RunnerSupport.FinishAsync(context, report, loaded.Dataset.Name, loaded.Sha256, loaded.Path, startedUtc, null, token).ConfigureAwait(false);
            return RunnerSupport.ExitCode(context, report);
        }

        #endregion

        #region Private-Methods

        private static async Task<ResilienceScenarioResult> HarnessScenarioAsync(BenchmarkContext context, string tenantId, string agent, string name, string description, string status, string outcomeCode, int runs, int waitSeconds, CancellationToken token)
        {
            ResilienceScenarioResult result = new ResilienceScenarioResult();
            result.Name = name;
            result.Description = description;
            List<Task<ApiResponse<Run>>> calls = new List<Task<ApiResponse<Run>>>();
            for (int i = 0; i < runs; i++)
            {
                RunCreateRequest request = new RunCreateRequest();
                // Long enough that the fake harness streams many chunks: with --delay-ms 1000 this input takes about 13 s.
                request.Input = name + " " + i.ToString(CultureInfo.InvariantCulture) + ": " + new string('x', 200);
                request.Wait = true;
                request.WaitSeconds = waitSeconds;
                request.CancelOnDisconnect = false;
                calls.Add(context.Client.InvokeAsync(tenantId, agent, request, token));
            }
            ApiResponse<Run>[] responses = await Task.WhenAll(calls).ConfigureAwait(false);
            result.RunsSubmitted = responses.Length;
            int matching = 0;
            foreach (ApiResponse<Run> response in responses)
            {
                if (!response.IsSuccess)
                {
                    Count(result.ClientErrors, Kind(response));
                    if (response.IsUncleanError) result.UncleanErrors++;
                    continue;
                }
                Run? run = response.Body;
                if (run == null) continue;
                if (!RunFollower.IsTerminal(run.Status))
                {
                    Run? followed = await new RunFollower(context.Client).WaitTerminalAsync(tenantId, run.Id, TimeSpan.FromSeconds(waitSeconds), token).ConfigureAwait(false);
                    if (followed != null) run = followed;
                }
                Count(result.Outcomes, run.Status + "/" + run.Outcome);
                if (!RunFollower.IsTerminal(run.Status)) result.RunsLost++;
                if (run.Status == "Succeeded") result.RunsSucceeded++;
                if (run.Status == status && run.Outcome == outcomeCode) matching++;
            }
            result.RecoverySeconds = -1;
            Criterion(result, matching == runs, "every run ended " + status + "/" + outcomeCode + " (" + matching + " of " + runs + ")");
            Criterion(result, result.ClientErrors.Count == 0, "no client-visible errors (" + result.ClientErrors.Values.Sum() + ")");
            Criterion(result, result.RunsLost == 0, "no run left unfinished (" + result.RunsLost + ")");
            return result;
        }

        private static async Task<ResilienceScenarioResult> FaultScenarioAsync(BenchmarkContext context, ScenarioSettings settings, string name, string description, string container, string selector, CancellationToken token)
        {
            ResilienceScenarioResult result = new ResilienceScenarioResult();
            result.Name = name;
            result.Description = description;
            if (String.IsNullOrEmpty(context.Kubeconfig))
            {
                result.Skipped = true;
                result.SkipReason = "needs the k3d stack (--kubeconfig and --context) to inject the fault";
                return result;
            }

            string runPrefix = "bench-" + name + "-" + Guid.NewGuid().ToString("N").Substring(0, 8) + "-";
            ConcurrentBag<ScenarioRun> runs = new ConcurrentBag<ScenarioRun>();
            ConcurrentQueue<ClientEvent> events = new ConcurrentQueue<ClientEvent>();
            Stopwatch clock = Stopwatch.StartNew();
            int sequence = 0;
            double injectedMs = -1;
            DateTime injectedUtc = DateTime.MinValue;
            string injected = String.Empty;

            Task fault = Task.Run(async () =>
            {
                await Task.Delay(TimeSpan.FromSeconds(settings.FaultAfterSeconds), token).ConfigureAwait(false);
                ProcessResult pods = await context.KubectlAsync(new string[] { "get", "pods", "-l", selector, "--field-selector=status.phase=Running", "-o", "jsonpath={.items[0].metadata.name}" }, 30000, token).ConfigureAwait(false);
                string pod = pods.Stdout.Trim();
                if (pod.Length == 0)
                {
                    injected = "no running pod matched " + selector;
                    return;
                }
                if (settings.FaultMode == "delete")
                {
                    injectedMs = clock.Elapsed.TotalMilliseconds;
                    injectedUtc = DateTime.UtcNow;
                    ProcessResult delete = await context.KubectlAsync(new string[] { "delete", "pod", pod, "--grace-period=0", "--force", "--wait=false" }, 60000, token).ConfigureAwait(false);
                    injected = "deleted pod " + pod + " at " + (injectedMs / 1000.0).ToString("F1", CultureInfo.InvariantCulture) + " s (" + (delete.ExitCode == 0 ? "ok" : delete.Stderr.Trim()) + ")";
                    return;
                }
                // A crash, not a shutdown: find the container's process on the k3d node and SIGKILL it, so nothing
                // drains, flushes, or says goodbye.
                ProcessResult id = await ExternalProcess.RunAsync("docker", new string[] { "exec", settings.K3dNode, "crictl", "ps", "-q", "--label", "io.kubernetes.pod.name=" + pod, "--name", container }, null, null, 30000, token).ConfigureAwait(false);
                string containerId = id.Stdout.Trim().Split('\n')[0].Trim();
                if (containerId.Length == 0)
                {
                    injected = "could not find container " + container + " of " + pod + " on " + settings.K3dNode + ": " + id.Stderr.Trim();
                    return;
                }
                ProcessResult pid = await ExternalProcess.RunAsync("docker", new string[] { "exec", settings.K3dNode, "crictl", "inspect", "--output", "go-template", "--template", "{{.info.pid}}", containerId }, null, null, 30000, token).ConfigureAwait(false);
                string hostPid = pid.Stdout.Trim();
                injectedMs = clock.Elapsed.TotalMilliseconds;
                injectedUtc = DateTime.UtcNow;
                ProcessResult kill = await ExternalProcess.RunAsync("docker", new string[] { "exec", settings.K3dNode, "kill", "-9", hostPid }, null, null, 30000, token).ConfigureAwait(false);
                injected = "SIGKILL to " + container + " in " + pod + " (pid " + hostPid + ") at " + (injectedMs / 1000.0).ToString("F1", CultureInfo.InvariantCulture) + " s (" + (kill.ExitCode == 0 ? "ok" : kill.Stderr.Trim()) + ")";
            }, token);

            List<Task> loops = new List<Task>();
            for (int w = 0; w < settings.Concurrency; w++)
            {
                loops.Add(Task.Run(async () =>
                {
                    while (clock.Elapsed.TotalSeconds < settings.DurationSeconds && !token.IsCancellationRequested)
                    {
                        int n = Interlocked.Increment(ref sequence);
                        ScenarioRun run = new ScenarioRun();
                        run.Key = runPrefix + n.ToString(CultureInfo.InvariantCulture);
                        runs.Add(run);
                        await CreateWithRetryAsync(context.Client, settings, run, clock, events, token).ConfigureAwait(false);
                        if (run.RunId != null) await FollowAsync(context.Client, settings, run, clock, events, token).ConfigureAwait(false);
                    }
                }, token));
            }
            await Task.WhenAll(loops).ConfigureAwait(false);
            await fault.ConfigureAwait(false);

            List<ScenarioRun> all = runs.ToList();
            result.RunsSubmitted = all.Count(r => r.RunId != null);
            result.RunsSucceeded = all.Count(r => r.Final != null && r.Final.Status == "Succeeded");
            result.RunsLost = all.Count(r => r.RunId != null && (r.Final == null || !RunFollower.IsTerminal(r.Final.Status)));
            int neverCreated = all.Count(r => r.RunId == null);
            foreach (ScenarioRun run in all.Where(r => r.Final != null)) Count(result.Outcomes, run.Final!.Status + "/" + run.Final.Outcome + (run.Final.Attempt > 1 ? " (attempt " + run.Final.Attempt + ")" : String.Empty));
            foreach (ClientEvent e in events.Where(e => !e.Success))
            {
                Count(result.ClientErrors, e.Kind);
                if (e.Unclean) result.UncleanErrors++;
            }
            result.DuplicateRuns = await DuplicatesAsync(context.Client, settings.TenantId, runPrefix, token).ConfigureAwait(false);

            List<ClientEvent> timeline = events.OrderBy(e => e.AtMs).ToList();
            if (injectedMs < 0) result.RecoverySeconds = -1;
            else
            {
                ClientEvent? lastFailure = timeline.LastOrDefault(e => !e.Success && e.AtMs >= injectedMs);
                if (lastFailure == null) result.RecoverySeconds = 0;
                else
                {
                    ClientEvent? recovered = timeline.FirstOrDefault(e => e.Success && e.Create && e.AtMs > lastFailure.AtMs);
                    result.RecoverySeconds = recovered == null ? -1 : (recovered.AtMs - injectedMs) / 1000.0;
                }
            }

            List<ScenarioRun> requeued = all.Where(r => r.Final != null && r.Final.Attempt > 1).ToList();
            if (requeued.Count > 0 && injectedUtc > DateTime.MinValue)
            {
                double lastSeconds = requeued.Max(r => ((r.Final!.CompletedUtc ?? DateTime.UtcNow) - injectedUtc).TotalSeconds);
                result.RecoverySeconds = Math.Max(result.RecoverySeconds, lastSeconds);
                result.Criteria.Add("info: " + requeued.Count + " runs needed another attempt; the last finished " + lastSeconds.ToString("F1", CultureInfo.InvariantCulture) + " s after the fault (server clock)");
            }
            result.Criteria.Add("fault: " + (injected.Length == 0 ? "not injected" : injected));
            Criterion(result, injectedMs >= 0, "the fault was injected");
            Criterion(result, result.RunsLost == 0, "no created run was lost (" + result.RunsLost + " of " + result.RunsSubmitted + ")");
            Criterion(result, result.DuplicateRuns == 0, "no idempotency key produced two runs (" + result.DuplicateRuns + ")");
            Criterion(result, neverCreated == 0, "every creation eventually succeeded after retries (" + neverCreated + " gave up)");
            Criterion(result, result.UncleanErrors == 0, "every error response carried a JSON error body (" + result.UncleanErrors + " did not)");
            int failedRuns = all.Count(r => r.Final != null && r.Final.Status != "Succeeded");
            Criterion(result, failedRuns == 0, "every finished run Succeeded (" + failedRuns + " did not)");
            return result;
        }

        private static async Task CreateWithRetryAsync(GarrisonClient client, ScenarioSettings settings, ScenarioRun run, Stopwatch clock, ConcurrentQueue<ClientEvent> events, CancellationToken token)
        {
            RunCreateRequest request = new RunCreateRequest();
            request.AgentName = "load-echo";
            request.Input = "resilience " + run.Key;
            request.Parameters = settings.Parameters;
            for (int attempt = 1; attempt <= 30; attempt++)
            {
                double at = clock.Elapsed.TotalMilliseconds;
                ApiResponse<Run> response = await client.CreateRunAsync(settings.TenantId, request, run.Key, token).ConfigureAwait(false);
                ClientEvent e = new ClientEvent();
                e.AtMs = at;
                e.Create = true;
                e.Success = response.IsSuccess && response.Body != null;
                e.Kind = e.Success ? "ok" : Kind(response);
                e.Unclean = response.IsUncleanError;
                events.Enqueue(e);
                if (e.Success)
                {
                    run.RunId = response.Body!.Id;
                    return;
                }
                if (response.StatusCode >= 400 && response.StatusCode < 500 && response.StatusCode != 429) return;
                await Task.Delay(Math.Min(5000, 250 * attempt), token).ConfigureAwait(false);
            }
        }

        private static async Task FollowAsync(GarrisonClient client, ScenarioSettings settings, ScenarioRun run, Stopwatch clock, ConcurrentQueue<ClientEvent> events, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(settings.RunTimeoutSeconds);
            while (DateTime.UtcNow < deadline)
            {
                double at = clock.Elapsed.TotalMilliseconds;
                ApiResponse<Run> response = await client.GetRunAsync(settings.TenantId, run.RunId!, token).ConfigureAwait(false);
                ClientEvent e = new ClientEvent();
                e.AtMs = at;
                e.Success = response.IsSuccess && response.Body != null;
                e.Kind = e.Success ? "ok" : "read " + Kind(response);
                e.Unclean = response.IsUncleanError;
                events.Enqueue(e);
                if (e.Success)
                {
                    run.Final = response.Body;
                    if (RunFollower.IsTerminal(run.Final!.Status)) return;
                }
                await Task.Delay(250, token).ConfigureAwait(false);
            }
        }

        private static async Task<int> DuplicatesAsync(GarrisonClient client, string tenantId, string prefix, CancellationToken token)
        {
            ApiResponse<Agent> agent = await client.GetAgentAsync(tenantId, "load-echo", token).ConfigureAwait(false);
            if (agent.Body == null) return 0;
            Dictionary<string, int> keys = new Dictionary<string, int>(StringComparer.Ordinal);
            int skip = 0;
            for (int page = 0; page < 100; page++)
            {
                ApiResponse<EnumerationResult<Run>> list = await client.ListRunsAsync(tenantId, agent.Body.Id, DateTime.UtcNow.AddHours(-2), skip, token).ConfigureAwait(false);
                if (list.Body == null) break;
                foreach (Run run in list.Body.Objects.Where(r => r.IdempotencyKey != null && r.IdempotencyKey.StartsWith(prefix, StringComparison.Ordinal)))
                {
                    keys.TryGetValue(run.IdempotencyKey!, out int count);
                    keys[run.IdempotencyKey!] = count + 1;
                }
                if (list.Body.EndOfResults || list.Body.Objects.Count == 0) break;
                skip += list.Body.Objects.Count;
            }
            return keys.Values.Count(v => v > 1);
        }

        private static string Kind<T>(ApiResponse<T> response)
        {
            string kind = response.Describe();
            if (response.IsUncleanError) kind += " (" + (String.IsNullOrEmpty(response.ContentType) ? "no content type" : response.ContentType) + ", body: " + (response.RawBody.Length == 0 ? "empty" : Provisioner.Excerpt(response.RawBody.Length > 80 ? response.RawBody.Substring(0, 80) : response.RawBody)) + ")";
            return kind;
        }

        private static void Criterion(ResilienceScenarioResult result, bool held, string text)
        {
            result.Criteria.Add((held ? "pass: " : "FAIL: ") + text);
            result.Passed = result.Criteria.All(c => !c.StartsWith("FAIL", StringComparison.Ordinal));
        }

        private static void Count(SortedDictionary<string, int> counts, string key)
        {
            counts.TryGetValue(key, out int count);
            counts[key] = count + 1;
        }

        #endregion
    }
}
