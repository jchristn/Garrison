namespace Garrison.LoadGen
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk;
    using Garrison.Sdk.Clients;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;

    /// <summary>
    /// Starts many fake-harness runs against Garrison, follows them to a terminal status, and records claim
    /// latency, throughput, and failures. Runs are created with an idempotency key, so a creation retried after a
    /// dropped connection (for example while a server replica restarts) never creates a duplicate run.
    /// Not thread-safe for concurrent RunAsync calls; create one instance per execution.
    /// </summary>
    public class LoadGenerator : IDisposable
    {
        #region Private-Members

        private readonly LoadGenOptions _Options;
        private readonly HttpClient _Http;
        private readonly GarrisonClient _Client;
        private readonly object _Lock = new object();
        private readonly ConcurrentDictionary<string, RunRecord> _ById = new ConcurrentDictionary<string, RunRecord>(StringComparer.Ordinal);
        private readonly List<RunRecord> _Records = new List<RunRecord>();
        private readonly string _TestId = DateTime.UtcNow.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture) + "-" + Guid.NewGuid().ToString("N").Substring(0, 6);
        private string? _AgentId = null;
        private int _SubmitsDone = 0;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="options">Options.</param>
        /// <exception cref="ArgumentNullException">Thrown when options is null.</exception>
        public LoadGenerator(LoadGenOptions options)
        {
            _Options = options ?? throw new ArgumentNullException(nameof(options));

            // Short-lived pooled connections: new connections spread over server replicas behind a Service, and a
            // connection to a replica that went away is replaced within seconds.
            SocketsHttpHandler sockets = new SocketsHttpHandler();
            sockets.PooledConnectionLifetime = TimeSpan.FromSeconds(10);
            sockets.PooledConnectionIdleTimeout = TimeSpan.FromSeconds(5);
            sockets.ConnectTimeout = TimeSpan.FromSeconds(5);
            sockets.MaxConnectionsPerServer = 512;
            _Http = new HttpClient(new IdempotencyHandler(sockets));
            _Http.Timeout = TimeSpan.FromSeconds(30);

            _Client = new GarrisonClient(_Options.Url, _Http);
            if (!String.IsNullOrEmpty(_Options.AdminKey)) _Client.UseAdminApiKey(_Options.AdminKey, _Options.Tenant);
            else _Client.UseAccessKey(_Options.AccessKey, _Options.SecretKey, _Options.Tenant);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Execute: wait for health, apply the load-test agent, start every run, follow them, and write the CSVs.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Summary.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the server never becomes healthy or setup fails.</exception>
        /// <exception cref="OperationCanceledException">Thrown when cancelled.</exception>
        public async Task<LoadGenSummary> RunAsync(CancellationToken token)
        {
            DateTime startedUtc = DateTime.UtcNow;
            await WaitForHealthAsync(token).ConfigureAwait(false);
            if (_Options.Setup) await SetupAsync(token).ConfigureAwait(false);

            for (int i = 0; i < _Options.Runs; i++)
            {
                RunRecord record = new RunRecord();
                record.Index = i;
                record.IdempotencyKey = "loadgen-" + _TestId + "-" + i.ToString(CultureInfo.InvariantCulture);
                _Records.Add(record);
            }

            Log("starting " + _Options.Runs + " runs (" + (_Options.Concurrency == 0 ? "all at once" : _Options.Concurrency + " creations in flight") + ", about " + _Options.RunMs + " ms each)");
            using (CancellationTokenSource pollStop = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                Task poller = PollLoopAsync(startedUtc, pollStop.Token);
                Task progress = ProgressLoopAsync(pollStop.Token);

                int width = _Options.Concurrency == 0 ? _Options.Runs : _Options.Concurrency;
                using (SemaphoreSlim gate = new SemaphoreSlim(width, width))
                {
                    List<Task> submits = new List<Task>();
                    foreach (RunRecord record in _Records)
                    {
                        await gate.WaitAsync(token).ConfigureAwait(false);
                        submits.Add(SubmitWithReleaseAsync(record, gate, token));
                    }
                    await Task.WhenAll(submits).ConfigureAwait(false);
                }
                Log("all creations finished; waiting up to " + _Options.TimeoutSeconds + " s for terminal status");

                DateTime deadline = DateTime.UtcNow.AddSeconds(_Options.TimeoutSeconds);
                while (DateTime.UtcNow < deadline)
                {
                    if (AllTerminal()) break;
                    await Task.Delay(500, token).ConfigureAwait(false);
                }

                pollStop.Cancel();
                await SwallowAsync(poller).ConfigureAwait(false);
                await SwallowAsync(progress).ConfigureAwait(false);
            }

            await PollOnceAsync(startedUtc, token).ConfigureAwait(false);
            await FillDetailsAsync(token).ConfigureAwait(false);

            LoadGenSummary summary = new LoadGenSummary(_Records, _Options);
            WriteRunsCsv();
            summary.AppendCsv(_Options.SummaryPath, _Options, startedUtc);
            return summary;
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                _Client.Dispose();
                _Http.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task WaitForHealthAsync(CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(120);
            string last = String.Empty;
            while (DateTime.UtcNow < deadline)
            {
                try
                {
                    await _Client.HealthAsync(token).ConfigureAwait(false);
                    return;
                }
                catch (Exception e) when (IsTransient(e, token))
                {
                    last = e.Message;
                }
                await Task.Delay(2000, token).ConfigureAwait(false);
            }
            throw new InvalidOperationException("Server at " + _Options.Url + " did not become healthy within 120 s: " + last);
        }

        private async Task SetupAsync(CancellationToken token)
        {
            // The fake harness answers "Echo: " plus the first 200 characters of the prompt in 16-character chunks
            // and sleeps delayMs between chunks, so about 13 chunks make up the run time.
            int delayMs = Math.Max(0, _Options.RunMs / 13);
            StringBuilder manifest = new StringBuilder();
            manifest.AppendLine("apiVersion: garrison/v1");
            manifest.AppendLine("kind: Agent");
            manifest.AppendLine("metadata:");
            manifest.AppendLine("  name: " + _Options.Agent);
            manifest.AppendLine("spec:");
            manifest.AppendLine("  displayName: Load Test Echo");
            manifest.AppendLine("  description: Fake-harness agent used by the Garrison scale tests (k8s/tests).");
            manifest.AppendLine("  exposure: { a2a: false, mcpTool: false }");
            manifest.AppendLine("---");
            manifest.AppendLine("apiVersion: garrison/v1");
            manifest.AppendLine("kind: Deployment");
            manifest.AppendLine("metadata:");
            manifest.AppendLine("  name: " + _Options.Agent + "-fake");
            manifest.AppendLine("spec:");
            manifest.AppendLine("  agent: " + _Options.Agent);
            manifest.AppendLine("  harnessProfile: builtin/fake");
            manifest.AppendLine("  prompts:");
            manifest.AppendLine("    System: builtin/default-system");
            manifest.AppendLine("    Task: builtin/default-task");
            manifest.AppendLine("  parameters:");
            manifest.AppendLine("    delayMs: \"" + delayMs.ToString(CultureInfo.InvariantCulture) + "\"");
            manifest.AppendLine("  timeoutSeconds: " + Math.Max(60, _Options.RunMs / 1000 * 4 + 60).ToString(CultureInfo.InvariantCulture));
            manifest.AppendLine("  maxAttempts: " + _Options.MaxAttempts.ToString(CultureInfo.InvariantCulture));
            manifest.AppendLine("  retryOnNodeLoss: " + (_Options.RetryOnNodeLoss ? "true" : "false"));
            manifest.AppendLine("  maxConcurrentRuns: 0");

            Exception? last = null;
            for (int attempt = 1; attempt <= 10; attempt++)
            {
                try
                {
                    ManifestApply apply = await _Client.Manifests.ApplyAsync(manifest.ToString(), false, false, token).ConfigureAwait(false);
                    if (apply.FailedCount > 0)
                    {
                        string messages = String.Join("; ", apply.Items.Where(i => i.Result == ManifestApplyResultEnum.Failed).Select(i => i.Kind + " " + i.Name + ": " + i.Message));
                        throw new InvalidOperationException("Load-test manifest apply failed: " + messages);
                    }
                    Log("applied agent " + _Options.Agent + " (fake harness, delayMs " + delayMs + ", maxAttempts " + _Options.MaxAttempts + ", retryOnNodeLoss " + _Options.RetryOnNodeLoss + ")");
                    return;
                }
                catch (Exception e) when (IsTransient(e, token))
                {
                    last = e;
                    await Task.Delay(2000, token).ConfigureAwait(false);
                }
            }
            throw new InvalidOperationException("Could not apply the load-test manifest: " + (last == null ? "unknown error" : last.Message), last);
        }

        private async Task SubmitWithReleaseAsync(RunRecord record, SemaphoreSlim gate, CancellationToken token)
        {
            try
            {
                await SubmitAsync(record, token).ConfigureAwait(false);
            }
            finally
            {
                gate.Release();
                Interlocked.Increment(ref _SubmitsDone);
            }
        }

        private async Task SubmitAsync(RunRecord record, CancellationToken token)
        {
            RunCreateRequest request = new RunCreateRequest();
            request.AgentName = _Options.Agent;
            request.Input = "Load test run " + record.Index.ToString(CultureInfo.InvariantCulture) + " of " + _TestId + ". " + new string('x', 160);
            request.Wait = false;

            record.SubmitStartUtc = DateTime.UtcNow;
            Stopwatch watch = Stopwatch.StartNew();
            IdempotencyHandler.SetKey(record.IdempotencyKey);
            try
            {
                for (int attempt = 1; attempt <= _Options.SubmitAttempts; attempt++)
                {
                    record.SubmitAttempts = attempt;
                    try
                    {
                        Run run = await _Client.Runs.CreateAsync(request, token).ConfigureAwait(false);
                        lock (_Lock)
                        {
                            record.RunId = run.Id;
                            record.SubmitMs = watch.ElapsedMilliseconds;
                            record.SubmitError = null;
                            if (record.Run == null) record.Run = run;
                            if (_AgentId == null) _AgentId = run.AgentId;
                        }
                        _ById[run.Id] = record;
                        return;
                    }
                    catch (Exception e) when (IsTransient(e, token))
                    {
                        record.SubmitError = Describe(e);
                        int backoff = Math.Min(5000, 250 * (1 << Math.Min(attempt, 5))) + Random.Shared.Next(0, 250);
                        await Task.Delay(backoff, token).ConfigureAwait(false);
                    }
                    catch (GarrisonException e)
                    {
                        record.SubmitError = Describe(e);
                        return;
                    }
                }
            }
            finally
            {
                IdempotencyHandler.SetKey(null);
            }
        }

        private async Task PollLoopAsync(DateTime startedUtc, CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await PollOnceAsync(startedUtc, token).ConfigureAwait(false);
                }
                catch (Exception e) when (IsTransient(e, token))
                {
                    Log("poll error (will retry): " + Describe(e));
                }
                await Task.Delay(_Options.PollMs, token).ConfigureAwait(false);
            }
        }

        private async Task PollOnceAsync(DateTime startedUtc, CancellationToken token)
        {
            string? agentId;
            lock (_Lock)
            {
                agentId = _AgentId;
            }
            if (agentId == null) return;

            int skip = 0;
            while (true)
            {
                RunFilter filter = new RunFilter();
                filter.AgentId = agentId;
                filter.FromUtc = startedUtc.AddMinutes(-5);
                filter.Ordering = EnumerationOrderEnum.CreatedAscending;
                filter.MaxResults = 1000;
                filter.Skip = skip;
                EnumerationResult<Run> page = await _Client.Runs.ListAsync(filter, token).ConfigureAwait(false);
                lock (_Lock)
                {
                    foreach (Run run in page.Objects)
                    {
                        if (!_ById.TryGetValue(run.Id, out RunRecord? record)) continue;
                        record.Run = run;
                        if (RunsClient.IsTerminal(run.Status) && record.ObservedTerminalUtc == null) record.ObservedTerminalUtc = DateTime.UtcNow;
                    }
                }
                if (page.EndOfResults || page.Objects.Count == 0) break;
                skip += page.Objects.Count;
            }
        }

        private async Task FillDetailsAsync(CancellationToken token)
        {
            // List responses may be projections without every timestamp; read those runs one by one. Also re-read
            // runs that look stuck, in case the last list poll missed their completion.
            List<RunRecord> missing;
            lock (_Lock)
            {
                missing = _Records.Where(r => r.RunId != null && (r.Run == null || !r.IsTerminal || r.Run.QueuedUtc == null || r.Run.LeasedUtc == null)).ToList();
            }
            if (missing.Count == 0) return;
            using (SemaphoreSlim gate = new SemaphoreSlim(16, 16))
            {
                List<Task> reads = new List<Task>();
                foreach (RunRecord record in missing)
                {
                    await gate.WaitAsync(token).ConfigureAwait(false);
                    reads.Add(ReadOneAsync(record, gate, token));
                }
                await Task.WhenAll(reads).ConfigureAwait(false);
            }
        }

        private async Task ReadOneAsync(RunRecord record, SemaphoreSlim gate, CancellationToken token)
        {
            try
            {
                Run run = await _Client.Runs.GetAsync(record.RunId!, token).ConfigureAwait(false);
                lock (_Lock)
                {
                    record.Run = run;
                    if (RunsClient.IsTerminal(run.Status) && record.ObservedTerminalUtc == null) record.ObservedTerminalUtc = DateTime.UtcNow;
                }
            }
            catch (Exception e) when (IsTransient(e, token) || e is GarrisonException)
            {
            }
            finally
            {
                gate.Release();
            }
        }

        private async Task ProgressLoopAsync(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                await Task.Delay(_Options.ProgressSeconds * 1000, token).ConfigureAwait(false);
                int created;
                int queued;
                int active;
                int succeeded;
                int failed;
                int requeued;
                lock (_Lock)
                {
                    created = _Records.Count(r => r.RunId != null);
                    queued = _Records.Count(r => r.Run != null && (r.Run.Status == RunStatusEnum.Queued || r.Run.Status == RunStatusEnum.Pending));
                    active = _Records.Count(r => r.Run != null && (r.Run.Status == RunStatusEnum.Leased || r.Run.Status == RunStatusEnum.Running || r.Run.Status == RunStatusEnum.Cancelling));
                    succeeded = _Records.Count(r => r.Run != null && r.Run.Status == RunStatusEnum.Succeeded);
                    failed = _Records.Count(r => r.IsTerminal && r.Run!.Status != RunStatusEnum.Succeeded);
                    requeued = _Records.Count(r => r.Run != null && r.Run.Attempt > 1);
                }
                Log("submitted " + Volatile.Read(ref _SubmitsDone) + "/" + _Options.Runs + ", created " + created + ", queued " + queued + ", active " + active + ", succeeded " + succeeded + ", failed " + failed + ", requeued " + requeued);
            }
        }

        private bool AllTerminal()
        {
            lock (_Lock)
            {
                return _Records.All(r => r.RunId == null || r.IsTerminal);
            }
        }

        private void WriteRunsCsv()
        {
            string? directory = Path.GetDirectoryName(Path.GetFullPath(_Options.CsvPath));
            if (!String.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
            using (StreamWriter writer = new StreamWriter(_Options.CsvPath, false, new UTF8Encoding(false)))
            {
                writer.WriteLine(RunRecord.CsvHeader());
                lock (_Lock)
                {
                    foreach (RunRecord record in _Records) writer.WriteLine(record.ToCsv());
                }
            }
        }

        private static bool IsTransient(Exception e, CancellationToken token)
        {
            if (token.IsCancellationRequested) return false;
            if (e is HttpRequestException) return true;
            if (e is TaskCanceledException) return true;
            if (e is IOException) return true;
            if (e is GarrisonException g) return g.StatusCode == 0 || g.StatusCode == 408 || g.StatusCode == 429 || g.StatusCode >= 500;
            return false;
        }

        private static string Describe(Exception e)
        {
            if (e is GarrisonException g) return "HTTP " + g.StatusCode + " " + (g.Error?.Message ?? g.Message);
            return e.GetType().Name + ": " + e.Message;
        }

        private static async Task SwallowAsync(Task task)
        {
            try
            {
                await task.ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
            }
        }

        private static void Log(string message)
        {
            Console.WriteLine("[loadgen " + DateTime.UtcNow.ToString("HH:mm:ss", CultureInfo.InvariantCulture) + "] " + message);
        }

        #endregion
    }
}
