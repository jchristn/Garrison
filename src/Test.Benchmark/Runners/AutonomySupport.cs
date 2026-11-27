namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Metrics;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// Steps the autonomy benchmarks (scheduler, messaging, memory) share: a fresh workspace per run, bounded parallel
    /// loops, paged reads of mandates and ticks, cleanup, and invariant probes. Stateless and thread-safe.
    /// </summary>
    public static class AutonomySupport
    {
        #region Public-Methods

        /// <summary>
        /// Create a fresh tenant for one run and apply the workload (plus any extra documents) into it. Autonomy state
        /// (keepers, inboxes, urgent-wake counts) would leak between runs of a reused tenant, so each run gets its own,
        /// named bench-autonomy-&lt;scenario&gt;-&lt;workload hash&gt;-&lt;UTC timestamp&gt;.
        /// </summary>
        /// <param name="client">Client.</param>
        /// <param name="scenario">Scenario name.</param>
        /// <param name="workload">Workload.</param>
        /// <param name="extraYaml">Extra manifest documents, or null.</param>
        /// <param name="startedUtc">Run start, used in the tenant name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Workspace.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the tenant or the apply fails.</exception>
        public static async Task<Workspace> ProvisionAsync(GarrisonClient client, string scenario, AutonomyWorkload workload, string? extraYaml, DateTime startedUtc, CancellationToken token)
        {
            if (client == null) throw new ArgumentNullException(nameof(client));
            if (scenario == null) throw new ArgumentNullException(nameof(scenario));
            if (workload == null) throw new ArgumentNullException(nameof(workload));
            string manifest = String.IsNullOrEmpty(extraYaml) ? workload.Text : workload.Text.TrimEnd() + "\n---\n" + extraYaml;
            string name = "bench-autonomy-" + scenario + "-" + StableHash.Hex(manifest, 8) + "-" + startedUtc.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture);
            Provisioner provisioner = new Provisioner(client);
            Workspace workspace = await provisioner.EnsureTenantAsync(name, "Autonomy benchmark workspace (Garrison.Benchmark " + scenario + ", AA12.4).", token).ConfigureAwait(false);
            ApiResponse<ManifestApply> apply = await client.ApplyManifestAsync(workspace.TenantId, manifest, false, token).ConfigureAwait(false);
            if (!apply.IsSuccess || apply.Body == null || apply.Body.FailedCount > 0)
            {
                string failures = apply.Body == null ? Provisioner.Excerpt(apply.RawBody) : String.Join("; ", apply.Body.Items.Where(i => i.Result == "Failed").Select(i => i.Kind + " " + i.Name + ": " + i.Message));
                throw new InvalidOperationException("Applying the autonomy workload into " + name + " failed (" + apply.Describe() + "): " + failures);
            }
            return workspace;
        }

        /// <summary>
        /// Run body(i) for i in 0..count-1 with at most concurrency calls in flight.
        /// </summary>
        /// <param name="count">Number of items, 0 or more.</param>
        /// <param name="concurrency">Calls in flight, 1 or more.</param>
        /// <param name="body">Work for one item: (index, worker, token).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when body is null.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when count or concurrency is out of range.</exception>
        public static async Task ForEachAsync(int count, int concurrency, Func<int, int, CancellationToken, Task> body, CancellationToken token)
        {
            if (body == null) throw new ArgumentNullException(nameof(body));
            if (count < 0) throw new ArgumentOutOfRangeException(nameof(count));
            if (concurrency < 1) throw new ArgumentOutOfRangeException(nameof(concurrency));
            int next = -1;
            List<Task> workers = new List<Task>();
            for (int w = 0; w < Math.Min(concurrency, Math.Max(1, count)); w++)
            {
                int worker = w;
                workers.Add(Task.Run(async () =>
                {
                    while (true)
                    {
                        token.ThrowIfCancellationRequested();
                        int index = Interlocked.Increment(ref next);
                        if (index >= count) return;
                        await body(index, worker, token).ConfigureAwait(false);
                    }
                }, token));
            }
            await Task.WhenAll(workers).ConfigureAwait(false);
        }

        /// <summary>
        /// Run body(i) for i in 0..count-1 on an open-loop schedule: item i is not started before start + i / rate
        /// seconds, with at most concurrency calls in flight. A rate of 0 runs unpaced, as ForEachAsync does.
        /// </summary>
        /// <param name="count">Number of items, 0 or more.</param>
        /// <param name="concurrency">Calls in flight, 1 or more.</param>
        /// <param name="ratePerSecond">Items started per second, 0 for unpaced.</param>
        /// <param name="body">Work for one item: (index, worker, token).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when body is null.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when an argument is out of range.</exception>
        public static Task ForEachPacedAsync(int count, int concurrency, double ratePerSecond, Func<int, int, CancellationToken, Task> body, CancellationToken token)
        {
            if (body == null) throw new ArgumentNullException(nameof(body));
            if (ratePerSecond < 0) throw new ArgumentOutOfRangeException(nameof(ratePerSecond));
            if (ratePerSecond == 0) return ForEachAsync(count, concurrency, body, token);
            DateTime start = DateTime.UtcNow;
            return ForEachAsync(count, concurrency, async (i, w, t) =>
            {
                TimeSpan wait = start.AddSeconds(i / ratePerSecond) - DateTime.UtcNow;
                if (wait > TimeSpan.Zero) await Task.Delay(wait, t).ConfigureAwait(false);
                await body(i, w, t).ConfigureAwait(false);
            }, token);
        }

        /// <summary>
        /// Every mandate in a tenant, read 1000 per page.
        /// </summary>
        /// <param name="client">Client.</param>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Mandates, or null when a page could not be read.</returns>
        /// <exception cref="ArgumentNullException">Thrown when client is null.</exception>
        public static async Task<List<Mandate>?> ListAllMandatesAsync(GarrisonClient client, string tenantId, CancellationToken token)
        {
            if (client == null) throw new ArgumentNullException(nameof(client));
            List<Mandate> all = new List<Mandate>();
            while (true)
            {
                ApiResponse<EnumerationResult<Mandate>> page = await client.ListMandatesAsync(tenantId, all.Count, token).ConfigureAwait(false);
                if (!page.IsSuccess || page.Body == null) return null;
                all.AddRange(page.Body.Objects);
                if (page.Body.EndOfResults || page.Body.Objects.Count == 0) return all;
            }
        }

        /// <summary>
        /// Every tick of one mandate, read 1000 per page.
        /// </summary>
        /// <param name="client">Client.</param>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="mandateId">Mandate.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Ticks, or null when a page could not be read.</returns>
        /// <exception cref="ArgumentNullException">Thrown when client is null.</exception>
        public static async Task<List<MandateTick>?> ListAllTicksAsync(GarrisonClient client, string tenantId, string mandateId, CancellationToken token)
        {
            if (client == null) throw new ArgumentNullException(nameof(client));
            List<MandateTick> all = new List<MandateTick>();
            while (true)
            {
                ApiResponse<EnumerationResult<MandateTick>> page = await client.ListTicksAsync(tenantId, mandateId, all.Count, token).ConfigureAwait(false);
                if (!page.IsSuccess || page.Body == null) return null;
                all.AddRange(page.Body.Objects);
                if (page.Body.EndOfResults || page.Body.Objects.Count == 0) return all;
            }
        }

        /// <summary>
        /// Delete mandates with force=true (a running tick's run is cancelled), so they stop ticking after the run.
        /// </summary>
        /// <param name="client">Client.</param>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="mandateIds">Mandates.</param>
        /// <param name="concurrency">Requests in flight.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Deletes that failed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when client or mandateIds is null.</exception>
        public static async Task<int> DeleteMandatesAsync(GarrisonClient client, string tenantId, IReadOnlyList<string> mandateIds, int concurrency, CancellationToken token)
        {
            if (client == null) throw new ArgumentNullException(nameof(client));
            if (mandateIds == null) throw new ArgumentNullException(nameof(mandateIds));
            int failed = 0;
            await ForEachAsync(mandateIds.Count, concurrency, async (i, w, t) =>
            {
                ApiResponse<object> deleted = await client.DeleteMandateAsync(tenantId, mandateIds[i], true, t).ConfigureAwait(false);
                if (!deleted.IsSuccess && deleted.StatusCode != 404) Interlocked.Increment(ref failed);
            }, token).ConfigureAwait(false);
            return failed;
        }

        /// <summary>
        /// Distribution of a sample with bootstrap intervals, or null for an empty sample.
        /// </summary>
        /// <param name="context">Context (resamples and seed).</param>
        /// <param name="values">Values.</param>
        /// <param name="salt">Seed salt, unique per distribution.</param>
        /// <returns>Statistics, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context or values is null.</exception>
        public static LatencyStatistics? Stats(BenchmarkContext context, IReadOnlyCollection<double> values, string salt)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (values == null) throw new ArgumentNullException(nameof(values));
            if (values.Count == 0) return null;
            return LatencyStatistics.From(values, context.Resamples, StableHash.Seed(context.Seed, salt));
        }

        /// <summary>
        /// Add a distribution to a phase when the sample is not empty.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="phase">Phase.</param>
        /// <param name="name">Distribution name.</param>
        /// <param name="values">Values (ms).</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static void AddTiming(BenchmarkContext context, AutonomyPhaseResult phase, string name, IReadOnlyCollection<double> values)
        {
            if (phase == null) throw new ArgumentNullException(nameof(phase));
            if (name == null) throw new ArgumentNullException(nameof(name));
            LatencyStatistics? stats = Stats(context, values, phase.Scenario + "/" + phase.Name + "/" + name);
            if (stats != null) phase.Timings[name] = stats;
        }

        /// <summary>
        /// An invariant probe: one outcome that passes when the invariant held over the whole phase.
        /// </summary>
        /// <param name="scenario">Scenario (the corpus).</param>
        /// <param name="probeId">Probe identifier, stable across runs with the same options.</param>
        /// <param name="type">Invariant name (the probe type).</param>
        /// <param name="category">Category, for example the level.</param>
        /// <param name="failures">Violations; empty when the invariant held.</param>
        /// <param name="observed">What was observed.</param>
        /// <returns>Outcome.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static ProbeOutcome Probe(string scenario, string probeId, string type, string category, List<string> failures, string observed)
        {
            if (failures == null) throw new ArgumentNullException(nameof(failures));
            ProbeOutcome outcome = new ProbeOutcome();
            outcome.Arm = "garrison";
            outcome.Corpus = scenario ?? throw new ArgumentNullException(nameof(scenario));
            outcome.ProbeId = probeId ?? throw new ArgumentNullException(nameof(probeId));
            outcome.Type = type ?? throw new ArgumentNullException(nameof(type));
            outcome.Category = category ?? throw new ArgumentNullException(nameof(category));
            outcome.Passed = failures.Count == 0;
            outcome.Score = outcome.Passed ? 1 : 0;
            outcome.Failures = failures.Take(5).ToList();
            if (failures.Count > 5) outcome.Failures.Add("and " + (failures.Count - 5).ToString(CultureInfo.InvariantCulture) + " more");
            outcome.Observed = observed;
            return outcome;
        }

        /// <summary>
        /// The MCP endpoint: --mcp-url, or the REST URL's host with the REST port plus one and the path /mcp (the
        /// layout of every bench stack: 37800 and 37801 locally, 37870 and 37871 on k3d).
        /// </summary>
        /// <param name="context">Context.</param>
        /// <returns>URL.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static string McpUrl(BenchmarkContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            string? explicitUrl = context.Args.GetOptional("mcp-url", "GARRISON_BENCH_MCP_URL");
            if (!String.IsNullOrEmpty(explicitUrl)) return explicitUrl;
            Uri rest = new Uri(context.Client.BaseUrl);
            UriBuilder builder = new UriBuilder(rest.Scheme, rest.Host, rest.Port + 1, "/mcp");
            return builder.Uri.ToString();
        }

        /// <summary>
        /// Milliseconds between two instants.
        /// </summary>
        /// <param name="fromUtc">Earlier instant.</param>
        /// <param name="toUtc">Later instant.</param>
        /// <returns>Milliseconds, never negative.</returns>
        public static double Ms(DateTime fromUtc, DateTime toUtc)
        {
            return Math.Max(0, (toUtc - fromUtc).TotalMilliseconds);
        }

        #endregion
    }
}
