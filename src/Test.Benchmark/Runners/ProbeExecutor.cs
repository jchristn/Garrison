namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Datasets;
    using Garrison.Benchmark.Metrics;
    using Garrison.Benchmark.Reference;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// Carries out one probe against a provisioned workspace and scores it against its oracle. Every failure is a
    /// result: a probe that could not be carried out scores 0 and is flagged as errored, never dropped. Probes are run
    /// one at a time by the runners; the executor itself is thread-safe apart from its node cache, which is guarded.
    /// </summary>
    public class ProbeExecutor
    {
        #region Public-Members

        /// <summary>
        /// Follow each run's server-sent event stream and measure delivery latency (create mode only). Default true.
        /// </summary>
        public bool Stream { get; set; } = true;

        /// <summary>
        /// Tenant used for cross-tenant probes (a tenant other than the workspace). Default "default".
        /// </summary>
        public string OtherTenant { get; set; } = "default";

        #endregion

        #region Private-Members

        private readonly GarrisonClient _Client;
        private readonly RunFollower _Follower;
        private readonly RunFollower _FastFollower;
        private readonly DirectInvoker? _Direct;
        private readonly ConcurrentDictionary<string, Node> _Nodes = new ConcurrentDictionary<string, Node>(StringComparer.Ordinal);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="client">Client.</param>
        /// <param name="pollMs">Poll interval while following runs, 10 to 10000.</param>
        /// <param name="direct">Direct invoker for the reference arm, or null to skip it.</param>
        /// <exception cref="ArgumentNullException">Thrown when client is null.</exception>
        public ProbeExecutor(GarrisonClient client, int pollMs, DirectInvoker? direct)
        {
            _Client = client ?? throw new ArgumentNullException(nameof(client));
            _Follower = new RunFollower(client);
            _Follower.PollMs = pollMs;
            _FastFollower = new RunFollower(client);
            _FastFollower.PollMs = 20;
            _Direct = direct;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Execute one repeat of a probe in the garrison arm.
        /// </summary>
        /// <param name="tenantId">Workspace tenant.</param>
        /// <param name="corpus">Corpus.</param>
        /// <param name="probe">Probe.</param>
        /// <param name="repeat">Repeat index.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Outcome.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public async Task<ProbeOutcome> ExecuteAsync(string tenantId, BenchmarkCorpus corpus, BenchmarkProbe probe, int repeat, CancellationToken token)
        {
            if (tenantId == null) throw new ArgumentNullException(nameof(tenantId));
            if (corpus == null) throw new ArgumentNullException(nameof(corpus));
            if (probe == null) throw new ArgumentNullException(nameof(probe));

            ProbeOutcome outcome = NewOutcome(corpus, probe, repeat, "garrison");
            try
            {
                switch (probe.Action)
                {
                    case "run":
                        await RunAsync(tenantId, probe, outcome, token).ConfigureAwait(false);
                        break;
                    case "request":
                        await RequestAsync(tenantId, probe, outcome, token).ConfigureAwait(false);
                        break;
                    case "blocked":
                        await BlockedAsync(tenantId, probe, outcome, token).ConfigureAwait(false);
                        break;
                    case "cancel":
                        await CancelAsync(tenantId, probe, outcome, token).ConfigureAwait(false);
                        break;
                    case "idempotency":
                        await IdempotencyAsync(tenantId, probe, outcome, token).ConfigureAwait(false);
                        break;
                    case "cross-tenant":
                        await CrossTenantAsync(tenantId, probe, outcome, token).ConfigureAwait(false);
                        break;
                    case "priority":
                        await PriorityAsync(tenantId, probe, outcome, token).ConfigureAwait(false);
                        break;
                    case "no-overlap":
                        await NoOverlapAsync(tenantId, probe, outcome, token).ConfigureAwait(false);
                        break;
                    case "apply":
                        await ApplyAsync(tenantId, probe, outcome, token).ConfigureAwait(false);
                        break;
                    case "reachable":
                        await ReachableAsync(tenantId, corpus, outcome, token).ConfigureAwait(false);
                        break;
                    default:
                        outcome.Failures.Add("unknown action " + probe.Action);
                        outcome.Errored = true;
                        break;
                }
            }
            catch (OperationCanceledException) when (token.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception e) when (e is InvalidOperationException || e is JsonException || e is TimeoutException)
            {
                outcome.Failures.Add("error: " + e.Message);
                outcome.Errored = true;
            }
            Finish(outcome);
            return outcome;
        }

        /// <summary>
        /// Execute one repeat of a run probe in the direct arm: the fake harness without Garrison.
        /// </summary>
        /// <param name="corpus">Corpus.</param>
        /// <param name="probe">Probe; must have DirectArguments.</param>
        /// <param name="repeat">Repeat index.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Outcome, or null when the probe has no direct form or no invoker is configured.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public async Task<ProbeOutcome?> ExecuteDirectAsync(BenchmarkCorpus corpus, BenchmarkProbe probe, int repeat, CancellationToken token)
        {
            if (corpus == null) throw new ArgumentNullException(nameof(corpus));
            if (probe == null) throw new ArgumentNullException(nameof(probe));
            if (_Direct == null || probe.Action != "run" || probe.DirectArguments == null) return null;
            ProbeOutcome outcome = NewOutcome(corpus, probe, repeat, "direct");
            string input = DatasetValidator.EffectiveInput(probe);
            DirectResult result = await _Direct.RunAsync(probe.DirectArguments, input, probe.TimeoutSeconds * 1000, token).ConfigureAwait(false);
            outcome.LatencyMs = result.ElapsedMs;
            outcome.Timings["directMs"] = result.ElapsedMs;
            outcome.Observed = "exit " + result.ExitCode.ToString(CultureInfo.InvariantCulture) + (result.IsError ? " (error)" : String.Empty) + ", result " + Excerpt(result.ResultText);
            if (result.Error != null)
            {
                outcome.Failures.Add("direct invocation: " + result.Error);
                outcome.Errored = true;
            }
            ProbeExpectation expect = probe.Expect;
            bool succeeded = result.ExitCode == 0 && !result.IsError;
            if (expect.Status == "Succeeded" && !succeeded) outcome.Failures.Add("expected success, harness exited " + result.ExitCode.ToString(CultureInfo.InvariantCulture));
            if (expect.Status == "Failed" && succeeded) outcome.Failures.Add("expected failure, harness succeeded");
            if (expect.ResultEcho && result.ResultText != DatasetValidator.ExpectedEcho(input)) outcome.Failures.Add("result is not the expected echo");
            if (!String.IsNullOrEmpty(expect.ResultText) && result.ResultText != expect.ResultText) outcome.Failures.Add("result text differs");
            if (!String.IsNullOrEmpty(expect.ResultContains) && (result.ResultText == null || !result.ResultText.Contains(expect.ResultContains, StringComparison.Ordinal))) outcome.Failures.Add("result does not contain '" + expect.ResultContains + "'");
            Finish(outcome);
            return outcome;
        }

        #endregion

        #region Private-Methods

        private static ProbeOutcome NewOutcome(BenchmarkCorpus corpus, BenchmarkProbe probe, int repeat, string arm)
        {
            ProbeOutcome outcome = new ProbeOutcome();
            outcome.Corpus = corpus.Id;
            outcome.ProbeId = probe.Id;
            outcome.Repeat = repeat;
            outcome.Arm = arm;
            outcome.Type = probe.Type;
            outcome.Category = probe.Category;
            outcome.Negative = probe.Negative;
            return outcome;
        }

        private static void Finish(ProbeOutcome outcome)
        {
            outcome.Passed = outcome.Failures.Count == 0;
            outcome.Score = outcome.Passed ? 1.0 : 0.0;
        }

        private static RunCreateRequest Request(BenchmarkProbe probe, string input, int priority)
        {
            RunCreateRequest request = new RunCreateRequest();
            request.AgentName = probe.Agent;
            request.Input = input;
            request.Parameters = probe.Parameters;
            request.Priority = priority;
            request.Wait = probe.Mode != "create";
            if (request.Wait)
            {
                request.WaitSeconds = Math.Min(600, Math.Max(1, probe.TimeoutSeconds));
                request.CancelOnDisconnect = false;
            }
            return request;
        }

        private Task<ApiResponse<Run>> StartAsync(string tenantId, BenchmarkProbe probe, RunCreateRequest request, string? idempotencyKey, CancellationToken token)
        {
            if (probe.Mode == "invoke") return _Client.InvokeAsync(tenantId, probe.Agent ?? String.Empty, request, token);
            return _Client.CreateRunAsync(tenantId, request, idempotencyKey, token);
        }

        private static bool CheckStart(ApiResponse<Run> response, ProbeExpectation expect, ProbeOutcome outcome)
        {
            outcome.Timings["requestMs"] = response.ElapsedMs;
            if (response.StatusCode == 0 || response.StatusCode >= 500) outcome.Errored = true;
            if (expect.HttpStatus.HasValue && response.StatusCode != expect.HttpStatus.Value) outcome.Failures.Add("expected HTTP " + expect.HttpStatus.Value.ToString(CultureInfo.InvariantCulture) + ", got " + response.Describe());
            if (!response.IsSuccess || response.Body == null)
            {
                if (!expect.HttpStatus.HasValue) outcome.Failures.Add("start request failed: " + response.Describe() + " " + Excerpt(response.Error?.Message ?? response.RawBody));
                return false;
            }
            outcome.RunIds.Add(response.Body.Id);
            return true;
        }

        private async Task RunAsync(string tenantId, BenchmarkProbe probe, ProbeOutcome outcome, CancellationToken token)
        {
            string input = DatasetValidator.EffectiveInput(probe);
            DateTime startUtc = DateTime.UtcNow;
            ApiResponse<Run> response = await StartAsync(tenantId, probe, Request(probe, input, probe.Priority), null, token).ConfigureAwait(false);
            if (!CheckStart(response, probe.Expect, outcome)) return;
            Run run = response.Body!;

            Task<List<SseMessage>>? stream = null;
            DateTime streamStartUtc = DateTime.UtcNow;
            using (CancellationTokenSource streamStop = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                if (Stream && probe.Mode == "create" && !RunFollower.IsTerminal(run.Status))
                {
                    streamStop.CancelAfter(TimeSpan.FromSeconds(probe.TimeoutSeconds + 10));
                    stream = _Client.StreamRunEventsAsync(tenantId, run.Id, streamStop.Token);
                }

                if (!RunFollower.IsTerminal(run.Status))
                {
                    Run? followed = await _Follower.WaitTerminalAsync(tenantId, run.Id, TimeSpan.FromSeconds(probe.TimeoutSeconds), token).ConfigureAwait(false);
                    if (followed != null) run = followed;
                }
                double observedMs = (DateTime.UtcNow - startUtc).TotalMilliseconds;
                outcome.LatencyMs = probe.Mode == "create" ? observedMs : response.ElapsedMs;
                if (!RunFollower.IsTerminal(run.Status))
                {
                    outcome.Failures.Add("run did not finish within " + probe.TimeoutSeconds.ToString(CultureInfo.InvariantCulture) + " s (status " + run.Status + ")");
                    outcome.Errored = true;
                    await _Client.CancelRunAsync(tenantId, run.Id, token).ConfigureAwait(false);
                }

                List<RunEvent>? events = await _Client.GetAllRunEventsAsync(tenantId, run.Id, token).ConfigureAwait(false);
                await CheckRunAsync(run, events, input, probe.Expect, outcome, token).ConfigureAwait(false);

                if (stream != null)
                {
                    streamStop.CancelAfter(TimeSpan.FromSeconds(5));
                    List<SseMessage> messages = await stream.ConfigureAwait(false);
                    StreamTimings(messages, streamStartUtc, outcome);
                }
            }
        }

        private async Task CheckRunAsync(Run run, List<RunEvent>? events, string input, ProbeExpectation expect, ProbeOutcome outcome, CancellationToken token)
        {
            outcome.Observed = Describe(run);
            if (!String.IsNullOrEmpty(run.LeaseNodeName)) outcome.Nodes.Add(run.LeaseNodeName);
            AddTiming(outcome, "queueMs", run.QueueMs);
            AddTiming(outcome, "executionMs", run.ExecutionMs);
            AddTiming(outcome, "totalMs", run.TotalMs);
            AddTiming(outcome, "ttftMs", run.TimeToFirstTokenMs);
            if (run.QueueMs.HasValue && run.TotalMs.HasValue && run.ExecutionMs.HasValue)
                outcome.Timings["serverOverheadMs"] = run.TotalMs.Value - run.ExecutionMs.Value;

            if (!String.IsNullOrEmpty(expect.Status) && run.Status != expect.Status) outcome.Failures.Add("expected status " + expect.Status + ", got " + run.Status);
            if (!String.IsNullOrEmpty(expect.Outcome) && run.Outcome != expect.Outcome) outcome.Failures.Add("expected outcome " + expect.Outcome + ", got " + run.Outcome);
            if (expect.ResultEcho)
            {
                string wanted = DatasetValidator.ExpectedEcho(input);
                if (run.ResultText != wanted) outcome.Failures.Add("result is not the expected echo (got " + Excerpt(run.ResultText) + ")");
            }
            if (!String.IsNullOrEmpty(expect.ResultText) && run.ResultText != expect.ResultText) outcome.Failures.Add("expected result '" + Excerpt(expect.ResultText) + "', got '" + Excerpt(run.ResultText) + "'");
            if (!String.IsNullOrEmpty(expect.ResultContains) && (run.ResultText == null || !run.ResultText.Contains(expect.ResultContains, StringComparison.Ordinal))) outcome.Failures.Add("result does not contain '" + expect.ResultContains + "'");
            if (expect.OutputSchemaValid.HasValue && run.OutputSchemaValid != expect.OutputSchemaValid) outcome.Failures.Add("expected outputSchemaValid " + expect.OutputSchemaValid.Value + ", got " + (run.OutputSchemaValid.HasValue ? run.OutputSchemaValid.Value.ToString() : "null"));
            if (expect.RepairAttempts.HasValue && run.RepairAttempts != expect.RepairAttempts.Value) outcome.Failures.Add("expected repairAttempts " + expect.RepairAttempts.Value + ", got " + run.RepairAttempts);
            if (!String.IsNullOrEmpty(expect.NodeLabelKey)) await CheckNodeLabelAsync(run, expect, outcome, token).ConfigureAwait(false);

            if (events == null)
            {
                if (expect.MinEvents.HasValue || expect.EventTypes != null || expect.ContiguousEvents) outcome.Failures.Add("events could not be read");
                return;
            }
            outcome.Timings["events"] = events.Count;
            if (expect.MinEvents.HasValue && events.Count < expect.MinEvents.Value) outcome.Failures.Add("expected at least " + expect.MinEvents.Value + " events, got " + events.Count);
            if (expect.EventTypes != null)
            {
                foreach (string type in expect.EventTypes)
                {
                    if (!events.Any(e => e.EventType == type)) outcome.Failures.Add("no " + type + " event");
                }
            }
            if (expect.ContiguousEvents)
            {
                List<long> sequences = events.Select(e => e.Sequence).OrderBy(s => s).ToList();
                bool contiguous = true;
                for (int i = 0; i < sequences.Count; i++)
                {
                    if (sequences[i] != i + 1) contiguous = false;
                }
                if (!contiguous) outcome.Failures.Add("event sequences are not 1.." + sequences.Count + " without gaps (" + String.Join(",", sequences.Take(20)) + ")");
                if (sequences.Count > 0 && run.LastEventSequence != sequences[sequences.Count - 1]) outcome.Failures.Add("lastEventSequence " + run.LastEventSequence + " differs from the last event " + sequences[sequences.Count - 1]);
            }
            List<double> persist = events.Where(e => e.TimestampUtc > DateTime.MinValue && e.CreatedUtc > DateTime.MinValue && !String.IsNullOrEmpty(e.EventType) && e.EventType != "Lifecycle")
                .Select(e => (e.CreatedUtc - e.TimestampUtc).TotalMilliseconds).ToList();
            if (persist.Count > 0)
            {
                persist.Sort();
                outcome.Timings["eventPersistMs"] = LatencyStatistics.Percentile(persist, 50);
                outcome.Timings["eventPersistMaxMs"] = persist[persist.Count - 1];
            }
        }

        private static void StreamTimings(List<SseMessage> messages, DateTime streamStartUtc, ProbeOutcome outcome)
        {
            List<double> latencies = new List<double>();
            foreach (SseMessage message in messages.Where(m => m.Event == "run.event"))
            {
                RunEvent? runEvent = null;
                try
                {
                    runEvent = JsonSerializer.Deserialize<RunEvent>(message.Data, JsonDefaults.Compact);
                }
                catch (JsonException)
                {
                }
                if (runEvent == null || runEvent.CreatedUtc < streamStartUtc) continue;
                latencies.Add((message.ReceivedUtc - runEvent.CreatedUtc).TotalMilliseconds);
            }
            outcome.Timings["streamMessages"] = messages.Count;
            if (latencies.Count > 0)
            {
                latencies.Sort();
                outcome.Timings["streamMs"] = LatencyStatistics.Percentile(latencies, 50);
                outcome.Timings["streamMaxMs"] = latencies[latencies.Count - 1];
            }
            if (!messages.Any(m => m.Event == "run.completed")) outcome.Timings["streamMissingCompleted"] = 1;
        }

        private async Task CheckNodeLabelAsync(Run run, ProbeExpectation expect, ProbeOutcome outcome, CancellationToken token)
        {
            if (String.IsNullOrEmpty(run.LeaseNodeId))
            {
                outcome.Failures.Add("run has no node");
                return;
            }
            Node? node = await NodeAsync(run.LeaseNodeId, token).ConfigureAwait(false);
            if (node == null)
            {
                outcome.Failures.Add("node " + run.LeaseNodeId + " not found");
                return;
            }
            NodeLabel? label = node.Labels.FirstOrDefault(l => l.Key == expect.NodeLabelKey);
            if (label == null || label.Value != expect.NodeLabelValue)
                outcome.Failures.Add("ran on " + node.Name + " whose " + expect.NodeLabelKey + " is " + (label == null ? "unset" : label.Value) + ", expected " + expect.NodeLabelValue);
        }

        private async Task<Node?> NodeAsync(string nodeId, CancellationToken token)
        {
            if (_Nodes.TryGetValue(nodeId, out Node? cached)) return cached;
            ApiResponse<EnumerationResult<Node>> nodes = await _Client.ListNodesAsync(token).ConfigureAwait(false);
            if (nodes.Body != null)
            {
                foreach (Node node in nodes.Body.Objects) _Nodes[node.Id] = node;
            }
            return _Nodes.TryGetValue(nodeId, out Node? found) ? found : null;
        }

        private async Task RequestAsync(string tenantId, BenchmarkProbe probe, ProbeOutcome outcome, CancellationToken token)
        {
            string input = DatasetValidator.EffectiveInput(probe);
            ApiResponse<Run> response = await StartAsync(tenantId, probe, Request(probe, input, probe.Priority), null, token).ConfigureAwait(false);
            outcome.LatencyMs = response.ElapsedMs;
            outcome.Timings["requestMs"] = response.ElapsedMs;
            outcome.Observed = response.Describe() + (response.Error?.Message == null ? String.Empty : ": " + Excerpt(response.Error.Message));
            if (response.StatusCode == 0 || response.StatusCode >= 500) outcome.Errored = true;
            ProbeExpectation expect = probe.Expect;
            if (expect.HttpStatus.HasValue && response.StatusCode != expect.HttpStatus.Value) outcome.Failures.Add("expected HTTP " + expect.HttpStatus.Value + ", got " + response.Describe());
            if (!String.IsNullOrEmpty(expect.ErrorCode) && (response.Error == null || response.Error.Code != expect.ErrorCode)) outcome.Failures.Add("expected error code " + expect.ErrorCode + ", got " + (response.Error?.Code ?? "none"));
            if (!String.IsNullOrEmpty(expect.FieldCode) && (response.Error?.FieldCodes == null || !response.Error.FieldCodes.Values.Contains(expect.FieldCode))) outcome.Failures.Add("expected field code " + expect.FieldCode + ", got " + (response.Error?.FieldCodes == null ? "none" : String.Join(",", response.Error.FieldCodes.Values)));
            if (response.StatusCode >= 400 && response.IsUncleanError) outcome.Failures.Add("error response has no JSON error body");
            if (response.IsSuccess && response.Body != null)
            {
                outcome.RunIds.Add(response.Body.Id);
                if (!RunFollower.IsTerminal(response.Body.Status)) await _Client.CancelRunAsync(tenantId, response.Body.Id, token).ConfigureAwait(false);
            }
        }

        private async Task BlockedAsync(string tenantId, BenchmarkProbe probe, ProbeOutcome outcome, CancellationToken token)
        {
            string input = DatasetValidator.EffectiveInput(probe);
            BenchmarkProbe asCreate = WithMode(probe, "create");
            ApiResponse<Run> response = await StartAsync(tenantId, asCreate, Request(asCreate, input, probe.Priority), null, token).ConfigureAwait(false);
            if (!CheckStart(response, new ProbeExpectation(), outcome)) return;
            DateTime startUtc = DateTime.UtcNow;
            Run? run = await _Follower.WaitUntilAsync(tenantId, response.Body!.Id, TimeSpan.FromSeconds(probe.TimeoutSeconds), r => !String.IsNullOrEmpty(r.BlockedReason), token).ConfigureAwait(false);
            outcome.LatencyMs = (DateTime.UtcNow - startUtc).TotalMilliseconds;
            if (run == null)
            {
                outcome.Failures.Add("run could not be read");
                outcome.Errored = true;
                return;
            }
            outcome.Observed = Describe(run) + ", blockedReason " + (run.BlockedReason ?? "null");
            if (run.Status != "Queued") outcome.Failures.Add("expected the run to stay Queued, got " + run.Status + "/" + run.Outcome);
            if (run.BlockedReason != probe.Expect.BlockedReason) outcome.Failures.Add("expected blockedReason " + probe.Expect.BlockedReason + ", got " + (run.BlockedReason ?? "null"));

            ApiResponse<Run> cancel = await _Client.CancelRunAsync(tenantId, run.Id, token).ConfigureAwait(false);
            Run? cancelled = await _Follower.WaitTerminalAsync(tenantId, run.Id, TimeSpan.FromSeconds(10), token).ConfigureAwait(false);
            if (!cancel.IsSuccess || cancelled == null || cancelled.Status != "Cancelled") outcome.Failures.Add("cancelling the blocked run did not end it Cancelled (" + cancel.Describe() + ", " + (cancelled?.Status ?? "unread") + ")");
        }

        private async Task CancelAsync(string tenantId, BenchmarkProbe probe, ProbeOutcome outcome, CancellationToken token)
        {
            string input = DatasetValidator.EffectiveInput(probe);
            BenchmarkProbe asCreate = WithMode(probe, "create");
            ApiResponse<Run> response = await StartAsync(tenantId, asCreate, Request(asCreate, input, probe.Priority), null, token).ConfigureAwait(false);
            if (!CheckStart(response, new ProbeExpectation(), outcome)) return;
            string runId = response.Body!.Id;
            Run? running = await _FastFollower.WaitUntilAsync(tenantId, runId, TimeSpan.FromSeconds(probe.TimeoutSeconds), r => r.Status == "Running", token).ConfigureAwait(false);
            if (running == null || running.Status != "Running")
            {
                outcome.Failures.Add("run never reached Running before the cancel (status " + (running?.Status ?? "unread") + ")");
                if (running != null && !RunFollower.IsTerminal(running.Status)) await _Client.CancelRunAsync(tenantId, runId, token).ConfigureAwait(false);
                return;
            }
            // Give the harness a moment to produce output, so the cancel stops a working process, not a starting one.
            await Task.Delay(300, token).ConfigureAwait(false);
            DateTime cancelUtc = DateTime.UtcNow;
            ApiResponse<Run> cancel = await _Client.CancelRunAsync(tenantId, runId, token).ConfigureAwait(false);
            Run? final = await _FastFollower.WaitTerminalAsync(tenantId, runId, TimeSpan.FromSeconds(30), token).ConfigureAwait(false);
            double cancelMs = (DateTime.UtcNow - cancelUtc).TotalMilliseconds;
            outcome.LatencyMs = cancelMs;
            outcome.Timings["cancelMs"] = cancelMs;
            outcome.Timings["cancelRequestMs"] = cancel.ElapsedMs;
            if (final == null)
            {
                outcome.Failures.Add("run could not be read after the cancel");
                outcome.Errored = true;
                return;
            }
            outcome.Observed = Describe(final);
            if (!cancel.IsSuccess) outcome.Failures.Add("cancel request failed: " + cancel.Describe());
            if (!String.IsNullOrEmpty(probe.Expect.Status) && final.Status != probe.Expect.Status) outcome.Failures.Add("expected status " + probe.Expect.Status + ", got " + final.Status);
            if (!String.IsNullOrEmpty(probe.Expect.Outcome) && final.Outcome != probe.Expect.Outcome) outcome.Failures.Add("expected outcome " + probe.Expect.Outcome + ", got " + final.Outcome);
            if (probe.Expect.MaxCancelMs.HasValue && cancelMs > probe.Expect.MaxCancelMs.Value) outcome.Failures.Add("cancel took " + cancelMs.ToString("F0", CultureInfo.InvariantCulture) + " ms, more than " + probe.Expect.MaxCancelMs.Value + " ms");
        }

        private async Task IdempotencyAsync(string tenantId, BenchmarkProbe probe, ProbeOutcome outcome, CancellationToken token)
        {
            string input = DatasetValidator.EffectiveInput(probe);
            BenchmarkProbe asCreate = WithMode(probe, "create");
            string key = "bench-" + probe.Id + "-" + Guid.NewGuid().ToString("N");
            ApiResponse<Run> first = await _Client.CreateRunAsync(tenantId, Request(asCreate, input, probe.Priority), key, token).ConfigureAwait(false);
            if (!CheckStart(first, new ProbeExpectation(), outcome)) return;
            ApiResponse<Run> second = await _Client.CreateRunAsync(tenantId, Request(asCreate, input, probe.Priority), key, token).ConfigureAwait(false);
            ApiResponse<Run> conflict = await _Client.CreateRunAsync(tenantId, Request(asCreate, input + " (changed)", probe.Priority), key, token).ConfigureAwait(false);
            outcome.LatencyMs = second.ElapsedMs;
            if (!second.IsSuccess || second.Body == null) outcome.Failures.Add("retry with the same key failed: " + second.Describe());
            else if (second.Body.Id != first.Body!.Id) outcome.Failures.Add("retry with the same key created a second run " + second.Body.Id);
            if (conflict.StatusCode != 409 || conflict.Error?.Code != "IdempotencyKeyConflict") outcome.Failures.Add("same key with different input: expected 409 IdempotencyKeyConflict, got " + conflict.Describe());
            if (conflict.IsSuccess && conflict.Body != null && conflict.Body.Id != first.Body!.Id) await _Client.CancelRunAsync(tenantId, conflict.Body.Id, token).ConfigureAwait(false);

            Run? run = await _Follower.WaitTerminalAsync(tenantId, first.Body!.Id, TimeSpan.FromSeconds(probe.TimeoutSeconds), token).ConfigureAwait(false);
            if (run == null || !RunFollower.IsTerminal(run.Status))
            {
                outcome.Failures.Add("run did not finish within " + probe.TimeoutSeconds + " s");
                return;
            }
            await CheckRunAsync(run, null, input, probe.Expect, outcome, token).ConfigureAwait(false);
        }

        private async Task CrossTenantAsync(string tenantId, BenchmarkProbe probe, ProbeOutcome outcome, CancellationToken token)
        {
            string input = DatasetValidator.EffectiveInput(probe);
            BenchmarkProbe asWait = WithMode(probe, "wait");
            ApiResponse<Run> created = await _Client.CreateRunAsync(tenantId, Request(asWait, input, probe.Priority), null, token).ConfigureAwait(false);
            if (!CheckStart(created, new ProbeExpectation(), outcome)) return;
            ApiResponse<Run> read = await _Client.GetRunAsync(OtherTenant, created.Body!.Id, token).ConfigureAwait(false);
            ApiResponse<RunEventsResponse> events = await _Client.GetRunEventsAsync(OtherTenant, created.Body.Id, 0, token).ConfigureAwait(false);
            outcome.LatencyMs = read.ElapsedMs;
            outcome.Observed = "read through tenant " + OtherTenant + ": " + read.Describe() + "; events: " + events.Describe();
            int expected = probe.Expect.HttpStatus ?? 404;
            if (read.StatusCode != expected) outcome.Failures.Add("reading another tenant's run: expected HTTP " + expected + ", got " + read.Describe());
            if (events.StatusCode != expected) outcome.Failures.Add("reading another tenant's run events: expected HTTP " + expected + ", got " + events.Describe());
            if (!String.IsNullOrEmpty(probe.Expect.ErrorCode) && read.Error?.Code != probe.Expect.ErrorCode) outcome.Failures.Add("expected error code " + probe.Expect.ErrorCode + ", got " + (read.Error?.Code ?? "none"));
        }

        private async Task PriorityAsync(string tenantId, BenchmarkProbe probe, ProbeOutcome outcome, CancellationToken token)
        {
            BenchmarkProbe asCreate = WithMode(probe, "create");
            string input = DatasetValidator.EffectiveInput(probe);
            ApiResponse<Run> blocker = await _Client.CreateRunAsync(tenantId, Request(asCreate, input + " [blocker]", 0), null, token).ConfigureAwait(false);
            if (!CheckStart(blocker, new ProbeExpectation(), outcome)) return;
            Run? running = await _FastFollower.WaitUntilAsync(tenantId, blocker.Body!.Id, TimeSpan.FromSeconds(probe.TimeoutSeconds), r => r.Status == "Running" || r.Status == "Leased", token).ConfigureAwait(false);
            if (running == null || (running.Status != "Running" && running.Status != "Leased"))
            {
                outcome.Failures.Add("the blocker run never started (status " + (running?.Status ?? "unread") + ")");
                return;
            }

            List<string> low = new List<string>();
            for (int i = 0; i < probe.Count - 2; i++)
            {
                ApiResponse<Run> created = await _Client.CreateRunAsync(tenantId, Request(asCreate, input + " [low " + i.ToString(CultureInfo.InvariantCulture) + "]", 0), null, token).ConfigureAwait(false);
                if (!CheckStart(created, new ProbeExpectation(), outcome)) return;
                low.Add(created.Body!.Id);
            }
            ApiResponse<Run> high = await _Client.CreateRunAsync(tenantId, Request(asCreate, input + " [high]", probe.Priority), null, token).ConfigureAwait(false);
            if (!CheckStart(high, new ProbeExpectation(), outcome)) return;

            List<Run> finished = await FollowAllAsync(tenantId, outcome.RunIds, probe, outcome, token).ConfigureAwait(false);
            Run? highRun = finished.FirstOrDefault(r => r.Id == high.Body!.Id);
            List<Run> lowRuns = finished.Where(r => low.Contains(r.Id)).ToList();
            if (highRun == null || lowRuns.Count != low.Count) return;
            DateTime? firstLow = lowRuns.Where(r => r.LeasedUtc.HasValue).Select(r => r.LeasedUtc).Min();
            outcome.Observed = "high leased " + Stamp(highRun.LeasedUtc) + ", first low leased " + Stamp(firstLow);
            if (!highRun.LeasedUtc.HasValue || !firstLow.HasValue || highRun.LeasedUtc.Value > firstLow.Value)
                outcome.Failures.Add("the priority " + probe.Priority + " run was not leased before the priority 0 runs queued ahead of it");
        }

        private async Task NoOverlapAsync(string tenantId, BenchmarkProbe probe, ProbeOutcome outcome, CancellationToken token)
        {
            BenchmarkProbe asCreate = WithMode(probe, "create");
            string input = DatasetValidator.EffectiveInput(probe);
            List<Task<ApiResponse<Run>>> creates = new List<Task<ApiResponse<Run>>>();
            for (int i = 0; i < probe.Count; i++)
            {
                creates.Add(_Client.CreateRunAsync(tenantId, Request(asCreate, input + " [" + i.ToString(CultureInfo.InvariantCulture) + "]", probe.Priority), null, token));
            }
            ApiResponse<Run>[] responses = await Task.WhenAll(creates).ConfigureAwait(false);
            foreach (ApiResponse<Run> response in responses)
            {
                if (!CheckStart(response, new ProbeExpectation(), outcome)) return;
            }
            List<Run> finished = await FollowAllAsync(tenantId, outcome.RunIds, probe, outcome, token).ConfigureAwait(false);
            if (finished.Count != probe.Count) return;
            List<Run> ordered = finished.OrderBy(r => r.LeasedUtc ?? DateTime.MaxValue).ToList();
            int overlaps = 0;
            for (int i = 1; i < ordered.Count; i++)
            {
                DateTime? previousEnd = ordered[i - 1].CompletedUtc;
                DateTime? nextStart = ordered[i].LeasedUtc;
                if (!previousEnd.HasValue || !nextStart.HasValue || nextStart.Value < previousEnd.Value) overlaps++;
            }
            outcome.Observed = probe.Count + " runs, " + overlaps + " overlapping pairs";
            if (overlaps > 0) outcome.Failures.Add(overlaps + " runs were leased before the previous run of a maxConcurrentRuns 1 deployment completed");
        }

        private async Task<List<Run>> FollowAllAsync(string tenantId, List<string> runIds, BenchmarkProbe probe, ProbeOutcome outcome, CancellationToken token)
        {
            List<Run> finished = new List<Run>();
            DateTime deadline = DateTime.UtcNow.AddSeconds(probe.TimeoutSeconds);
            foreach (string runId in runIds)
            {
                TimeSpan remaining = deadline - DateTime.UtcNow;
                if (remaining < TimeSpan.FromSeconds(1)) remaining = TimeSpan.FromSeconds(1);
                Run? run = await _Follower.WaitTerminalAsync(tenantId, runId, remaining, token).ConfigureAwait(false);
                if (run == null || !RunFollower.IsTerminal(run.Status))
                {
                    outcome.Failures.Add("run " + runId + " did not finish within " + probe.TimeoutSeconds + " s");
                    outcome.Errored = true;
                    continue;
                }
                if (!String.IsNullOrEmpty(probe.Expect.Status) && run.Status != probe.Expect.Status) outcome.Failures.Add("run " + runId + ": expected " + probe.Expect.Status + ", got " + run.Status + "/" + run.Outcome);
                if (!String.IsNullOrEmpty(run.LeaseNodeName) && !outcome.Nodes.Contains(run.LeaseNodeName)) outcome.Nodes.Add(run.LeaseNodeName);
                finished.Add(run);
            }
            return finished;
        }

        private async Task ApplyAsync(string tenantId, BenchmarkProbe probe, ProbeOutcome outcome, CancellationToken token)
        {
            ApiResponse<ManifestApply> response = await _Client.ApplyManifestAsync(tenantId, probe.Manifest ?? String.Empty, probe.DryRun, token).ConfigureAwait(false);
            outcome.LatencyMs = response.ElapsedMs;
            outcome.Timings["requestMs"] = response.ElapsedMs;
            if (response.StatusCode == 0 || response.StatusCode >= 500) outcome.Errored = true;
            ProbeExpectation expect = probe.Expect;
            ManifestApply? body = response.Body;
            ManifestApplyItem? firstFailed = body?.Items.FirstOrDefault(i => i.Result == "Failed");
            outcome.Observed = response.Describe() + (body == null ? String.Empty : ", created " + body.CreatedCount + ", unchanged " + body.UnchangedCount + ", failed " + body.FailedCount + (firstFailed == null ? String.Empty : ": " + Excerpt(firstFailed.Message)));
            if (expect.HttpStatus.HasValue && response.StatusCode != expect.HttpStatus.Value) outcome.Failures.Add("expected HTTP " + expect.HttpStatus.Value + ", got " + response.Describe());
            if (body == null)
            {
                outcome.Failures.Add("no apply result: " + response.Describe() + " " + Excerpt(response.RawBody));
                return;
            }
            if (expect.ManifestFailed.HasValue && body.FailedCount != expect.ManifestFailed.Value) outcome.Failures.Add("expected failedCount " + expect.ManifestFailed.Value + ", got " + body.FailedCount);
            if (expect.ManifestCreated.HasValue && body.CreatedCount != expect.ManifestCreated.Value) outcome.Failures.Add("expected createdCount " + expect.ManifestCreated.Value + ", got " + body.CreatedCount);
            if (expect.ManifestUnchanged.HasValue && body.UnchangedCount != expect.ManifestUnchanged.Value) outcome.Failures.Add("expected unchangedCount " + expect.ManifestUnchanged.Value + ", got " + body.UnchangedCount);
            if (!String.IsNullOrEmpty(expect.ManifestMessageContains) && (firstFailed?.Message == null || !firstFailed.Message.Contains(expect.ManifestMessageContains, StringComparison.OrdinalIgnoreCase)))
                outcome.Failures.Add("expected the failure message to mention '" + expect.ManifestMessageContains + "', got '" + Excerpt(firstFailed?.Message) + "'");
        }

        private async Task ReachableAsync(string tenantId, BenchmarkCorpus corpus, ProbeOutcome outcome, CancellationToken token)
        {
            List<BenchmarkItem> agents = corpus.Items.Where(i => i.Kind == "Agent").ToList();
            int reachable = 0;
            List<double> latencies = new List<double>();
            foreach (BenchmarkItem agent in agents)
            {
                ApiResponse<Agent> response = await _Client.GetAgentAsync(tenantId, agent.Name, token).ConfigureAwait(false);
                latencies.Add(response.ElapsedMs);
                if (response.IsSuccess && response.Body != null && response.Body.Name == agent.Name) reachable++;
                else if (outcome.Failures.Count < 5) outcome.Failures.Add("agent " + agent.Name + " not readable: " + response.Describe());
            }
            outcome.Timings["reachable"] = reachable;
            outcome.Timings["agents"] = agents.Count;
            if (latencies.Count > 0) outcome.LatencyMs = latencies.Average();
            outcome.Observed = reachable + " of " + agents.Count + " agents readable";
            if (reachable < agents.Count && outcome.Failures.Count >= 5) outcome.Failures.Add((agents.Count - reachable) + " agents not readable in total");
        }

        private static BenchmarkProbe WithMode(BenchmarkProbe probe, string mode)
        {
            BenchmarkProbe copy = new BenchmarkProbe();
            copy.Id = probe.Id;
            copy.Agent = probe.Agent;
            copy.Input = probe.Input;
            copy.InputRepeat = probe.InputRepeat;
            copy.Parameters = probe.Parameters;
            copy.Priority = probe.Priority;
            copy.Mode = mode;
            copy.TimeoutSeconds = probe.TimeoutSeconds;
            copy.Expect = probe.Expect;
            return copy;
        }

        private static void AddTiming(ProbeOutcome outcome, string name, long? value)
        {
            if (value.HasValue) outcome.Timings[name] = value.Value;
        }

        private static string Describe(Run run)
        {
            return (run.Status ?? "?") + "/" + (run.Outcome ?? "?") + (String.IsNullOrEmpty(run.LeaseNodeName) ? String.Empty : " on " + run.LeaseNodeName) + ", result " + Excerpt(run.ResultText);
        }

        private static string Stamp(DateTime? value)
        {
            return value.HasValue ? value.Value.ToString("HH:mm:ss.fff", CultureInfo.InvariantCulture) : "never";
        }

        private static string Excerpt(string? text)
        {
            if (text == null) return "null";
            string flat = text.Replace('\n', ' ').Replace('\r', ' ');
            return flat.Length > 120 ? flat.Substring(0, 120) + "..." : flat;
        }

        #endregion
    }
}
