namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Metrics;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The memory command (AA12.4): memory operation latency. It writes --keys entries into one agent's Agent scope
    /// over the management MCP endpoint, as a person calls the garrison_memory_* tools, and then times each operation
    /// in turn with --concurrency sessions: create (expectedVersion 0), read, compare-and-set update, a stale write that
    /// must be refused with MemoryVersionConflict, list, search by tag, the REST list and content routes the dashboard
    /// uses, delete (expectedVersion 2), and a read of a deleted key. Calls are paced open loop at --rate per second
    /// (default 80) to stay under the MCP endpoint's per-client limit of 100 tool calls per second. Every call's result
    /// is checked, so a phase that answers fast with the wrong text fails its invariant probe. The server must run with
    /// AgentMemory.Enabled.
    /// </summary>
    public static class MemoryRunner
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
            int keys = context.Args.GetInt("keys", 200, 10, 10000);
            int concurrency = context.Args.GetInt("concurrency", 8, 1, 64);
            int valueBytes = context.Args.GetInt("value-bytes", 1024, 1, 65536);
            double rate = context.Args.GetDouble("rate", 80, 0, 100000);
            bool deterministic = context.Args.GetBool("deterministic", false);
            string agentName = context.Args.GetString("agent", "memory-bench");
            string adminKey = context.Args.GetString("admin-key", BenchmarkContext.DefaultAdminKey, "GARRISON_BENCH_ADMIN_KEY");
            string mcpUrl = AutonomySupport.McpUrl(context);

            AutonomyWorkload? workload = await AutonomyWorkload.LoadAsync(context, token).ConfigureAwait(false);
            if (workload == null) return 1;
            if (!await RunnerSupport.WaitReadyAsync(context.Client, TimeSpan.FromSeconds(30), token).ConfigureAwait(false)) return 1;
            GarrisonClient client = context.Client;

            DateTime startedUtc = DateTime.UtcNow;
            BenchmarkReport report = new BenchmarkReport();
            report.Kind = "memory";
            report.Deterministic = deterministic;
            Workspace workspace;
            string agentId;
            try
            {
                workspace = await AutonomySupport.ProvisionAsync(client, "memory", workload, null, startedUtc, token).ConfigureAwait(false);
                ApiResponse<Agent> agent = await client.GetAgentAsync(workspace.TenantId, agentName, token).ConfigureAwait(false);
                agentId = agent.Body?.Id ?? throw new InvalidOperationException("agent " + agentName + " is not in the workload (" + agent.Describe() + ")");
            }
            catch (InvalidOperationException e)
            {
                report.Incomplete = true;
                report.IncompleteReason = "the workload did not provision (" + e.Message + ")";
                await RunnerSupport.FinishAsync(context, report, AutonomyWorkload.DatasetName, workload.Sha256, workload.Path, startedUtc, null, token).ConfigureAwait(false);
                return RunnerSupport.ExitCode(context, report);
            }
            string tenantId = workspace.TenantId;

            List<McpClient> sessions = new List<McpClient>();
            try
            {
                for (int i = 0; i < concurrency; i++)
                {
                    McpClient session = new McpClient(mcpUrl, adminKey, tenantId, 60);
                    sessions.Add(session);
                    string? problem = await session.ConnectAsync(token).ConfigureAwait(false);
                    if (problem != null) throw new InvalidOperationException("MCP session " + i + " at " + mcpUrl + ": " + problem);
                }
                McpCallResult probe = await sessions[0].CallToolAsync("garrison_memory_read", Args(agentId, "probe", null, null, null), token).ConfigureAwait(false);
                if (!probe.Success) throw new InvalidOperationException("garrison_memory_read failed (" + probe.Text + "); is AgentMemory.Enabled set on the server?");
            }
            catch (InvalidOperationException e)
            {
                foreach (McpClient session in sessions) session.Dispose();
                report.Incomplete = true;
                report.IncompleteReason = e.Message;
                await RunnerSupport.FinishAsync(context, report, AutonomyWorkload.DatasetName, workload.Sha256, workload.Path, startedUtc, null, token).ConfigureAwait(false);
                return RunnerSupport.ExitCode(context, report);
            }

            BenchmarkContext.Log("memory: tenant " + workspace.Name + ", " + keys + " keys of " + valueBytes + " bytes, " + concurrency + " MCP sessions at " + mcpUrl + ", " + (rate > 0 ? ReportWriter.N(rate, "0.##") + " calls/s" : "unpaced"));
            PrometheusSnapshot before = PrometheusSnapshot.Parse(await client.GetMetricsTextAsync(token).ConfigureAwait(false));
            string[] entryIds = new string[keys];
            int sample = Math.Max(1, keys / 10);
            int needles = Enumerable.Range(0, keys).Count(IsNeedle);
            try
            {
                await PhaseAsync(context, report, rate, "write", keys, concurrency, async (i, w, t) =>
                {
                    MemoryToolArguments args = Args(agentId, Key(i), Value(i, 1, valueBytes), 0, null);
                    args.Tags = IsNeedle(i) ? new List<string> { "bench", "needle" } : new List<string> { "bench" };
                    McpCallResult result = await sessions[w].CallToolAsync("garrison_memory_write", args, t).ConfigureAwait(false);
                    MemoryToolResult? written = McpClient.Parse<MemoryToolResult>(result);
                    if (written?.Entry != null) entryIds[i] = written.Entry.Id;
                    return new MeasuredOperation(written != null && written.Version == 1, result.ElapsedMs, Key(i) + ": " + result.Text);
                }, token).ConfigureAwait(false);

                await PhaseAsync(context, report, rate, "read", keys, concurrency, async (i, w, t) =>
                {
                    McpCallResult result = await sessions[w].CallToolAsync("garrison_memory_read", Args(agentId, Key(i), null, null, null), t).ConfigureAwait(false);
                    MemoryToolResult? read = McpClient.Parse<MemoryToolResult>(result);
                    return new MeasuredOperation(read != null && read.Found && read.Value == Value(i, 1, valueBytes), result.ElapsedMs, Key(i) + ": " + (read == null ? result.Text : "value or version differs"));
                }, token).ConfigureAwait(false);

                await PhaseAsync(context, report, rate, "update-cas", keys, concurrency, async (i, w, t) =>
                {
                    McpCallResult result = await sessions[w].CallToolAsync("garrison_memory_write", Args(agentId, Key(i), Value(i, 2, valueBytes), 1, null), t).ConfigureAwait(false);
                    MemoryToolResult? written = McpClient.Parse<MemoryToolResult>(result);
                    return new MeasuredOperation(written != null && written.Version == 2, result.ElapsedMs, Key(i) + ": " + result.Text);
                }, token).ConfigureAwait(false);

                await PhaseAsync(context, report, rate, "stale-write-refused", sample, concurrency, async (i, w, t) =>
                {
                    McpCallResult result = await sessions[w].CallToolAsync("garrison_memory_write", Args(agentId, Key(i), "stale", 1, null), t).ConfigureAwait(false);
                    bool refused = result.ToolError && result.Text.StartsWith("MemoryVersionConflict", StringComparison.Ordinal);
                    return new MeasuredOperation(refused, result.ElapsedMs, Key(i) + ": expected MemoryVersionConflict, got " + (result.Success ? "success" : result.Text));
                }, token).ConfigureAwait(false);

                await PhaseAsync(context, report, rate, "list", sample, concurrency, async (i, w, t) =>
                {
                    MemoryToolArguments args = Args(agentId, null, null, null, null);
                    args.MaxResults = 100;
                    args.Skip = (i * 100) % keys;
                    McpCallResult result = await sessions[w].CallToolAsync("garrison_memory_list", args, t).ConfigureAwait(false);
                    MemoryListResult? list = McpClient.Parse<MemoryListResult>(result);
                    return new MeasuredOperation(list != null && list.TotalCount == keys && list.Entries.Count == Math.Min(100, keys - args.Skip.Value), result.ElapsedMs, "list skip " + args.Skip + ": " + (list == null ? result.Text : list.TotalCount + " total, " + list.Entries.Count + " on the page"));
                }, token).ConfigureAwait(false);

                await PhaseAsync(context, report, rate, "search-tag", sample, concurrency, async (i, w, t) =>
                {
                    MemoryToolArguments args = Args(agentId, null, null, null, "needle");
                    args.MaxResults = 100;
                    McpCallResult result = await sessions[w].CallToolAsync("garrison_memory_search", args, t).ConfigureAwait(false);
                    MemorySearchResult? found = McpClient.Parse<MemorySearchResult>(result);
                    return new MeasuredOperation(found != null && found.Hits.Count == Math.Min(100, needles), result.ElapsedMs, "search: " + (found == null ? result.Text : found.Hits.Count + " hits, expected " + Math.Min(100, needles)));
                }, token).ConfigureAwait(false);

                await PhaseAsync(context, report, rate, "rest-list", sample, concurrency, async (i, w, t) =>
                {
                    int skip = (i * 100) % keys;
                    ApiResponse<EnumerationResult<MemoryEntry>> list = await client.ListMemoryEntriesAsync(tenantId, agentId, skip, t).ConfigureAwait(false);
                    return new MeasuredOperation(list.IsSuccess && list.Body != null && list.Body.TotalRecords == keys, list.ElapsedMs, "rest list skip " + skip + ": " + list.Describe() + (list.Body == null ? String.Empty : " " + list.Body.TotalRecords + " total"));
                }, token).ConfigureAwait(false);

                await PhaseAsync(context, report, rate, "rest-content", sample, concurrency, async (i, w, t) =>
                {
                    int index = (i * 7919) % keys;
                    if (String.IsNullOrEmpty(entryIds[index])) return new MeasuredOperation(false, 0, Key(index) + ": no entry id from the write");
                    ApiResponse<MemoryContent> content = await client.GetMemoryContentAsync(tenantId, entryIds[index], t).ConfigureAwait(false);
                    return new MeasuredOperation(content.IsSuccess && content.Body != null && content.Body.Value == Value(index, 2, valueBytes), content.ElapsedMs, Key(index) + ": " + content.Describe());
                }, token).ConfigureAwait(false);

                await PhaseAsync(context, report, rate, "delete-cas", keys, concurrency, async (i, w, t) =>
                {
                    McpCallResult result = await sessions[w].CallToolAsync("garrison_memory_delete", Args(agentId, Key(i), null, 2, null), t).ConfigureAwait(false);
                    MemoryToolResult? deleted = McpClient.Parse<MemoryToolResult>(result);
                    return new MeasuredOperation(deleted != null && deleted.Found, result.ElapsedMs, Key(i) + ": " + result.Text);
                }, token).ConfigureAwait(false);

                await PhaseAsync(context, report, rate, "read-deleted", sample, concurrency, async (i, w, t) =>
                {
                    McpCallResult result = await sessions[w].CallToolAsync("garrison_memory_read", Args(agentId, Key(i), null, null, null), t).ConfigureAwait(false);
                    MemoryToolResult? read = McpClient.Parse<MemoryToolResult>(result);
                    return new MeasuredOperation(read != null && !read.Found, result.ElapsedMs, Key(i) + ": " + (read == null ? result.Text : "still found"));
                }, token).ConfigureAwait(false);
            }
            finally
            {
                foreach (McpClient session in sessions) session.Dispose();
            }

            PrometheusSnapshot after = PrometheusSnapshot.Parse(await client.GetMetricsTextAsync(token).ConfigureAwait(false));
            report.Stages = after.Since(before, 25);
            report.Notes.Add("MCP calls authenticate with the system administrator key and a tenant header, as a person calling the tools would; a run token takes the same path plus the effect journal for writes and deletes. Each MCP call is one HTTP request, and the server closes the connection after each answer, so latency includes a loopback TCP connect.");
            report.Notes.Add("Calls are paced open loop at --rate per second across all sessions (0 runs closed loop), because the MCP endpoint refuses more than 100 tools/call requests per second from one client (the Voltaic McpRateLimits.ToolCallsPerSecond default, which Garrison does not change). Latency is measured from the send.");
            report.Notes.Add("Values are deterministic text of --value-bytes bytes; every tenth key is also tagged needle, which search-tag looks for.");
            await RunnerSupport.FinishAsync(context, report, AutonomyWorkload.DatasetName, workload.Sha256, workload.Path, startedUtc, null, token).ConfigureAwait(false);
            return RunnerSupport.ExitCode(context, report);
        }

        #endregion

        #region Private-Methods

        private static async Task PhaseAsync(BenchmarkContext context, BenchmarkReport report, double rate, string name, int count, int concurrency, Func<int, int, CancellationToken, Task<MeasuredOperation>> operation, CancellationToken token)
        {
            ConcurrentBag<MeasuredOperation> results = new ConcurrentBag<MeasuredOperation>();
            Stopwatch watch = Stopwatch.StartNew();
            await AutonomySupport.ForEachPacedAsync(count, concurrency, rate, async (i, w, t) =>
            {
                results.Add(await operation(i, w, t).ConfigureAwait(false));
            }, token).ConfigureAwait(false);
            watch.Stop();

            AutonomyPhaseResult phase = new AutonomyPhaseResult();
            phase.Scenario = "memory";
            phase.Name = name;
            phase.Level = count;
            phase.Operations = results.Count;
            phase.Succeeded = results.Count(r => r.Passed);
            phase.Failed = results.Count(r => !r.Passed);
            phase.WindowSeconds = watch.Elapsed.TotalSeconds;
            phase.Throughput = phase.WindowSeconds > 0 ? phase.Succeeded / phase.WindowSeconds : 0;
            AutonomySupport.AddTiming(context, phase, "latencyMs", results.Where(r => r.Passed).Select(r => r.LatencyMs).ToList());
            report.AutonomyPhases.Add(phase);
            List<string> problems = results.Where(r => !r.Passed).Select(r => r.Problem ?? "failed").OrderBy(p => p, StringComparer.Ordinal).ToList();
            report.Outcomes.Add(AutonomySupport.Probe("memory", name, name, "memory", problems, phase.Succeeded + " of " + phase.Operations + " correct"));
            LatencyStatistics? stats = phase.Timings.TryGetValue("latencyMs", out LatencyStatistics? found) ? found : null;
            BenchmarkContext.Log("memory " + name + ": " + phase.Succeeded + "/" + phase.Operations + " correct, p50 " + (stats == null ? "n/a" : ReportWriter.N(stats.P50, "F1")) + " ms, p95 " + (stats == null ? "n/a" : ReportWriter.N(stats.P95, "F1")) + " ms, p99 " + (stats == null ? "n/a" : ReportWriter.N(stats.P99, "F1")) + " ms");
        }

        private static MemoryToolArguments Args(string agentId, string? key, string? value, int? expectedVersion, string? query)
        {
            MemoryToolArguments args = new MemoryToolArguments();
            args.Agent = agentId;
            args.Key = key;
            args.Value = value;
            args.ExpectedVersion = expectedVersion;
            args.Query = query;
            return args;
        }

        private static string Key(int index)
        {
            return "bench-" + index.ToString("00000", CultureInfo.InvariantCulture);
        }

        private static bool IsNeedle(int index)
        {
            return index % 10 == 0;
        }

        private static string Value(int index, int version, int bytes)
        {
            StringBuilder text = new StringBuilder();
            text.Append("entry ").Append(index.ToString(CultureInfo.InvariantCulture)).Append(" version ").Append(version.ToString(CultureInfo.InvariantCulture)).Append(". ");
            while (text.Length < bytes) text.Append("Benchmark memory text that a keeper might keep between ticks. ");
            return text.ToString(0, bytes);
        }

        #endregion
    }
}
