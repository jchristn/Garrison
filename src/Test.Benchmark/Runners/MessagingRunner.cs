namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Metrics;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The messaging command (AA12.4): message throughput and delivery lag. It creates --recipients agents, each with a
    /// keeper whose timer is an hour away after its first tick, so only mail wakes it. Then, for each of --rounds rounds,
    /// it sends a batch of normal messages as a person (send throughput and latency), sends one urgent message per
    /// recipient (which brings that keeper's next wake forward to now), and waits until nothing is queued. Delivery lag is
    /// the time from a message being stored to the keeper tick that carries it being claimed (deliveredUtc minus
    /// createdUtc); for urgent mail that is the wake path, for normal mail it also includes the wait for the urgent
    /// message that triggered the tick. Invariant probes: every send accepted, every urgent message woke its keeper,
    /// everything delivered, every delivery went to a keeper tick of the recipient, and one tick per recipient per round
    /// carried the mail (coalescing).
    /// </summary>
    public static class MessagingRunner
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
            int recipients = context.Args.GetInt("recipients", 25, 1, 500);
            int messages = context.Args.GetInt("messages", 500, 1, 100000);
            int rounds = context.Args.GetInt("rounds", 3, 1, 12);
            int concurrency = context.Args.GetInt("concurrency", 8, 1, 256);
            int bodyBytes = context.Args.GetInt("body-bytes", 512, 0, 16384);
            int timeoutSeconds = context.Args.GetInt("delivery-timeout-seconds", 120, 10, 3600);
            bool deterministic = context.Args.GetBool("deterministic", false);

            AutonomyWorkload? workload = await AutonomyWorkload.LoadAsync(context, token).ConfigureAwait(false);
            if (workload == null) return 1;
            if (!await RunnerSupport.WaitReadyAsync(context.Client, TimeSpan.FromSeconds(30), token).ConfigureAwait(false)) return 1;
            GarrisonClient client = context.Client;

            DateTime startedUtc = DateTime.UtcNow;
            BenchmarkReport report = new BenchmarkReport();
            report.Kind = "messaging";
            report.Deterministic = deterministic;
            int perRecipient = (int)Math.Ceiling(messages / (double)recipients) + rounds;
            if (perRecipient > 30) report.Notes.Add("Each recipient gets " + perRecipient + " messages from one sender; with the default Messaging.LineRatePerMinute (30) some sends inside one minute may be refused with LineRate. Use more recipients or fewer messages.");

            Workspace workspace;
            try
            {
                workspace = await AutonomySupport.ProvisionAsync(client, "messaging", workload, RecipientYaml(recipients), startedUtc, token).ConfigureAwait(false);
            }
            catch (InvalidOperationException e)
            {
                report.Incomplete = true;
                report.IncompleteReason = "the workload did not provision (" + e.Message + ")";
                await RunnerSupport.FinishAsync(context, report, AutonomyWorkload.DatasetName, workload.Sha256, workload.Path, startedUtc, null, token).ConfigureAwait(false);
                return RunnerSupport.ExitCode(context, report);
            }
            string tenantId = workspace.TenantId;
            BenchmarkContext.Log("messaging: tenant " + workspace.Name + ", " + recipients + " recipients, " + messages + " normal messages over " + rounds + " rounds");
            PrometheusSnapshot before = PrometheusSnapshot.Parse(await client.GetMetricsTextAsync(token).ConfigureAwait(false));

            // One keeper per recipient. The first tick runs at once; after that the timer is an hour away.
            string[] mandateIds = new string[recipients];
            ConcurrentBag<string> keeperFailures = new ConcurrentBag<string>();
            await AutonomySupport.ForEachAsync(recipients, concurrency, async (i, w, t) =>
            {
                MandateCreateRequest request = new MandateCreateRequest();
                request.Name = Recipient(i) + "-keeper";
                request.AgentId = Recipient(i);
                request.DeploymentId = Recipient(i) + "-fake";
                MandateRevisionRequest revision = new MandateRevisionRequest();
                revision.Objective = "Benchmark inbox keeper: read the mail the tick carries and report.";
                revision.WakeMode = "Fixed";
                revision.MinIntervalSeconds = 3600;
                revision.MaxIntervalSeconds = 3600;
                revision.JitterPercent = 0;
                request.CurrentRevision = revision;
                ApiResponse<Mandate> created = await client.CreateMandateAsync(tenantId, request, t).ConfigureAwait(false);
                if (created.IsSuccess && created.Body != null) mandateIds[i] = created.Body.Id;
                else keeperFailures.Add(request.Name + ": " + created.Describe());
            }, token).ConfigureAwait(false);
            if (keeperFailures.Count > 0 || !await WaitKeepersIdleAsync(client, tenantId, 1, timeoutSeconds, token).ConfigureAwait(false))
            {
                report.Incomplete = true;
                report.IncompleteReason = keeperFailures.Count > 0 ? "keepers could not be created: " + String.Join("; ", keeperFailures.Take(3)) : "the keepers' first ticks did not finish within " + timeoutSeconds + " s";
                await AutonomySupport.DeleteMandatesAsync(client, tenantId, mandateIds.Where(id => id != null).ToList(), concurrency, token).ConfigureAwait(false);
                await RunnerSupport.FinishAsync(context, report, AutonomyWorkload.DatasetName, workload.Sha256, workload.Path, startedUtc, null, token).ConfigureAwait(false);
                return RunnerSupport.ExitCode(context, report);
            }

            string body = Body(bodyBytes);
            ConcurrentBag<SentMessage> sent = new ConcurrentBag<SentMessage>();
            List<double> sendWindows = new List<double>();
            List<double> deliveryWindows = new List<double>();
            List<string> stuck = new List<string>();
            int normalSent = 0;
            for (int round = 0; round < rounds; round++)
            {
                token.ThrowIfCancellationRequested();
                int batch = messages / rounds + (round < messages % rounds ? 1 : 0);
                int offset = normalSent;
                DateTime sendStart = DateTime.UtcNow;
                await AutonomySupport.ForEachAsync(batch, concurrency, async (i, w, t) =>
                {
                    int n = offset + i;
                    sent.Add(await SendAsync(client, tenantId, Recipient(n % recipients), "Normal", "Benchmark note " + n.ToString(CultureInfo.InvariantCulture), body, round, t).ConfigureAwait(false));
                }, token).ConfigureAwait(false);
                sendWindows.Add((DateTime.UtcNow - sendStart).TotalSeconds);
                normalSent += batch;

                DateTime urgentStart = DateTime.UtcNow;
                await AutonomySupport.ForEachAsync(recipients, concurrency, async (i, w, t) =>
                {
                    sent.Add(await SendAsync(client, tenantId, Recipient(i), "Urgent", "Benchmark wake " + round.ToString(CultureInfo.InvariantCulture) + "/" + i.ToString(CultureInfo.InvariantCulture), body, round, t).ConfigureAwait(false));
                }, token).ConfigureAwait(false);
                bool drained = await WaitDrainedAsync(client, tenantId, timeoutSeconds, token).ConfigureAwait(false);
                deliveryWindows.Add((DateTime.UtcNow - urgentStart).TotalSeconds);
                if (!drained) stuck.Add("round " + round + ": mail still queued after " + timeoutSeconds + " s");
                // The next round starts with every keeper idle, so an urgent message never waits for a running tick.
                await WaitKeepersIdleAsync(client, tenantId, round + 2, timeoutSeconds, token).ConfigureAwait(false);
                BenchmarkContext.Log("messaging: round " + (round + 1) + " of " + rounds + " done (" + batch + " normal, " + recipients + " urgent)" + (drained ? String.Empty : ", NOT drained"));
            }

            // Read every message back, and every keeper's ticks.
            List<SentMessage> all = sent.ToList();
            ConcurrentDictionary<string, AgentMessage> final = new ConcurrentDictionary<string, AgentMessage>(StringComparer.Ordinal);
            List<SentMessage> stored = all.Where(s => s.Message != null).ToList();
            await AutonomySupport.ForEachAsync(stored.Count, concurrency, async (i, w, t) =>
            {
                ApiResponse<AgentMessage> read = await client.GetMessageAsync(tenantId, stored[i].Message!.Id, t).ConfigureAwait(false);
                if (read.IsSuccess && read.Body != null) final[read.Body.Id] = read.Body;
            }, token).ConfigureAwait(false);
            ConcurrentDictionary<string, List<MandateTick>> ticks = new ConcurrentDictionary<string, List<MandateTick>>(StringComparer.Ordinal);
            await AutonomySupport.ForEachAsync(recipients, concurrency, async (i, w, t) =>
            {
                List<MandateTick>? list = await AutonomySupport.ListAllTicksAsync(client, tenantId, mandateIds[i], t).ConfigureAwait(false);
                if (list != null) ticks[Recipient(i)] = list;
            }, token).ConfigureAwait(false);
            DateTime endUtc = DateTime.UtcNow;

            Analyze(context, report, all, final, ticks, recipients, rounds, sendWindows, deliveryWindows, stuck, endUtc);

            int deleteFailed = await AutonomySupport.DeleteMandatesAsync(client, tenantId, mandateIds.ToList(), concurrency, token).ConfigureAwait(false);
            if (deleteFailed > 0) report.Notes.Add(deleteFailed + " keepers could not be deleted.");
            PrometheusSnapshot after = PrometheusSnapshot.Parse(await client.GetMetricsTextAsync(token).ConfigureAwait(false));
            report.Stages = after.Since(before, 25);
            report.Notes.Add("Messages are sent as a person (the system administrator key), so the line policy does not apply; freezes, the thread budget, and Messaging.LineRatePerMinute do. Urgent wakes are limited by Messaging.UrgentWakesPerHour (default 12), so --rounds is at most 12.");
            report.Notes.Add("Delivery is measured with server timestamps: createdUtc when the message is stored, deliveredUtc when the keeper tick that carries it claims it, before the tick's run starts.");
            await RunnerSupport.FinishAsync(context, report, AutonomyWorkload.DatasetName, workload.Sha256, workload.Path, startedUtc, null, token).ConfigureAwait(false);
            return RunnerSupport.ExitCode(context, report);
        }

        #endregion

        #region Private-Methods

        private static string Recipient(int index)
        {
            return "inbox-" + index.ToString("000", CultureInfo.InvariantCulture);
        }

        private static string RecipientYaml(int recipients)
        {
            StringBuilder yaml = new StringBuilder();
            for (int i = 0; i < recipients; i++)
            {
                if (i > 0) yaml.Append("---\n");
                string name = Recipient(i);
                yaml.Append("apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: ").Append(name).Append("\n  description: Messaging benchmark recipient\nspec:\n  displayName: ").Append(name).Append("\n  exposure: { a2a: false, mcpTool: false }\n");
                yaml.Append("---\napiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: ").Append(name).Append("-fake\nspec:\n  agent: ").Append(name).Append("\n  harnessProfile: builtin/fake\n  timeoutSeconds: 60\n  maxAttempts: 1\n");
            }
            return yaml.ToString();
        }

        private static string Body(int bytes)
        {
            StringBuilder text = new StringBuilder();
            string line = "Benchmark message body. ";
            while (text.Length < bytes) text.Append(line);
            return text.ToString(0, bytes);
        }

        private static async Task<SentMessage> SendAsync(GarrisonClient client, string tenantId, string recipient, string urgency, string subject, string body, int round, CancellationToken token)
        {
            MessageSendRequest request = new MessageSendRequest();
            request.Recipient = recipient;
            request.Subject = subject;
            request.Body = body.Length == 0 ? null : body;
            request.Urgency = urgency;
            ApiResponse<AgentMessage> response = await client.SendMessageAsync(tenantId, request, token).ConfigureAwait(false);
            SentMessage sent = new SentMessage();
            sent.Recipient = recipient;
            sent.Urgency = urgency;
            sent.Round = round;
            sent.LatencyMs = response.ElapsedMs;
            sent.Accepted = response.StatusCode == 201 && response.Body != null && response.Body.Status == "Queued";
            sent.Message = response.Body;
            sent.Problem = sent.Accepted ? null : recipient + " " + urgency + ": " + response.Describe() + (response.Body?.RejectionReason == null ? String.Empty : " " + response.Body.RejectionReason);
            return sent;
        }

        private static async Task<bool> WaitDrainedAsync(GarrisonClient client, string tenantId, int timeoutSeconds, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds);
            while (DateTime.UtcNow < deadline)
            {
                ApiResponse<EnumerationResult<AgentMessage>> queued = await client.CountMessagesAsync(tenantId, "Queued", token).ConfigureAwait(false);
                if (queued.IsSuccess && queued.Body != null && queued.Body.TotalRecords == 0) return true;
                await Task.Delay(250, token).ConfigureAwait(false);
            }
            return false;
        }

        private static async Task<bool> WaitKeepersIdleAsync(GarrisonClient client, string tenantId, int minimumTicks, int timeoutSeconds, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds);
            while (DateTime.UtcNow < deadline)
            {
                List<Mandate>? mandates = await AutonomySupport.ListAllMandatesAsync(client, tenantId, token).ConfigureAwait(false);
                if (mandates != null && mandates.Count > 0 && mandates.All(m => m.TickCount >= minimumTicks && String.IsNullOrEmpty(m.ActiveTickId))) return true;
                await Task.Delay(500, token).ConfigureAwait(false);
            }
            return false;
        }

        private static void Analyze(BenchmarkContext context, BenchmarkReport report, List<SentMessage> all, ConcurrentDictionary<string, AgentMessage> final, ConcurrentDictionary<string, List<MandateTick>> ticks, int recipients, int rounds, List<double> sendWindows, List<double> deliveryWindows, List<string> stuck, DateTime endUtc)
        {
            List<string> refused = all.Where(s => !s.Accepted).Select(s => s.Problem ?? "refused").ToList();
            AutonomyPhaseResult send = new AutonomyPhaseResult();
            send.Scenario = "messaging";
            send.Name = "send";
            send.Level = all.Count;
            send.Operations = all.Count;
            send.Succeeded = all.Count(s => s.Accepted);
            send.Failed = refused.Count;
            send.WindowSeconds = sendWindows.Sum();
            int normalAccepted = all.Count(s => s.Accepted && s.Urgency == "Normal");
            send.Throughput = send.WindowSeconds > 0 ? normalAccepted / send.WindowSeconds : 0;
            send.Counts["normalAccepted"] = normalAccepted;
            send.Counts["urgentAccepted"] = all.Count(s => s.Accepted && s.Urgency == "Urgent");
            AutonomySupport.AddTiming(context, send, "sendLatencyMs", all.Where(s => s.Accepted).Select(s => s.LatencyMs).ToList());
            report.AutonomyPhases.Add(send);

            Dictionary<string, string> runOwner = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (KeyValuePair<string, List<MandateTick>> keeper in ticks)
                foreach (MandateTick tick in keeper.Value.Where(t => t.RunId != null)) runOwner[tick.RunId!] = keeper.Key;
            Dictionary<string, string> agentNames = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (SentMessage s in all.Where(s => s.Message != null)) agentNames[s.Message!.RecipientAgentId] = s.Recipient;

            List<string> undelivered = new List<string>();
            List<string> misdelivered = new List<string>();
            List<string> notWoken = new List<string>();
            foreach (string urgency in new string[] { "Urgent", "Normal" })
            {
                AutonomyPhaseResult phase = new AutonomyPhaseResult();
                phase.Scenario = "messaging";
                phase.Name = urgency == "Urgent" ? "urgent-delivery" : "normal-delivery";
                List<SentMessage> group = all.Where(s => s.Accepted && s.Urgency == urgency).ToList();
                phase.Level = group.Count;
                phase.Operations = group.Count;
                List<double> lag = new List<double>();
                foreach (SentMessage s in group)
                {
                    AgentMessage? message = final.TryGetValue(s.Message!.Id, out AgentMessage? read) ? read : null;
                    if (message == null || message.DeliveredUtc == null)
                    {
                        phase.Censored++;
                        lag.Add(AutonomySupport.Ms(s.Message.CreatedUtc, endUtc));
                        undelivered.Add(s.Message.Id + " to " + s.Recipient + " is " + (message?.Status ?? "unreadable"));
                        continue;
                    }
                    phase.Succeeded++;
                    lag.Add(AutonomySupport.Ms(message.CreatedUtc, message.DeliveredUtc.Value));
                    if (message.DeliveredRunId == null || !runOwner.TryGetValue(message.DeliveredRunId, out string? owner) || owner != s.Recipient)
                        misdelivered.Add(message.Id + " to " + s.Recipient + " went to run " + (message.DeliveredRunId ?? "none"));
                    if (urgency == "Urgent" && !message.WokeRecipient) notWoken.Add(message.Id + " to " + s.Recipient + " did not wake its keeper");
                }
                phase.Failed = 0;
                phase.WindowSeconds = deliveryWindows.Sum();
                phase.Throughput = phase.WindowSeconds > 0 ? phase.Succeeded / phase.WindowSeconds : 0;
                AutonomySupport.AddTiming(context, phase, urgency == "Urgent" ? "deliveryLagMs" : "queuedDeliveryLagMs", lag);
                report.AutonomyPhases.Add(phase);
            }

            // Coalescing: each round's mail to a recipient rides on exactly one Message tick.
            List<string> coalescing = new List<string>();
            int messageTicks = 0;
            for (int i = 0; i < recipients; i++)
            {
                string name = Recipient(i);
                int count = ticks.TryGetValue(name, out List<MandateTick>? list) ? list.Count(t => t.WakeSource == "Message") : -1;
                if (count < 0) coalescing.Add(name + ": ticks could not be read");
                else if (count != rounds) coalescing.Add(name + ": " + count + " Message ticks for " + rounds + " rounds");
                if (count > 0) messageTicks += count;
            }
            AutonomyPhaseResult urgentPhase = report.AutonomyPhases.First(p => p.Name == "urgent-delivery");
            urgentPhase.Counts["messageTicks"] = messageTicks;
            urgentPhase.Counts["deliveredAll"] = report.AutonomyPhases.Where(p => p.Name.EndsWith("-delivery", StringComparison.Ordinal)).Sum(p => p.Succeeded);
            undelivered.AddRange(stuck);

            report.Outcomes.Add(AutonomySupport.Probe("messaging", "send-accepted", "send-accepted", "send", refused, send.Succeeded + " of " + send.Operations + " accepted"));
            report.Outcomes.Add(AutonomySupport.Probe("messaging", "urgent-wakes", "urgent-wakes", "delivery", notWoken, (recipients * rounds - notWoken.Count) + " urgent messages woke their keeper"));
            report.Outcomes.Add(AutonomySupport.Probe("messaging", "all-delivered", "all-delivered", "delivery", undelivered, urgentPhase.Counts["deliveredAll"] + " delivered"));
            report.Outcomes.Add(AutonomySupport.Probe("messaging", "delivered-to-keeper", "delivered-to-keeper", "delivery", misdelivered, "deliveries checked against the recipients' keeper runs"));
            report.Outcomes.Add(AutonomySupport.Probe("messaging", "coalesced", "coalesced", "delivery", coalescing, messageTicks + " Message ticks for " + recipients + " recipients x " + rounds + " rounds"));
            BenchmarkContext.Log("messaging: send " + ReportWriter.N(send.Throughput, "F1") + " msg/s; urgent delivery lag p50 " + Format(urgentPhase, "deliveryLagMs", 50) + " ms, p95 " + Format(urgentPhase, "deliveryLagMs", 95) + " ms, p99 " + Format(urgentPhase, "deliveryLagMs", 99) + " ms");
        }

        private static string Format(AutonomyPhaseResult phase, string name, int percentile)
        {
            if (!phase.Timings.TryGetValue(name, out LatencyStatistics? stats)) return "n/a";
            double value = percentile == 50 ? stats.P50 : (percentile == 95 ? stats.P95 : stats.P99);
            return ReportWriter.N(value, "F0");
        }

        #endregion
    }
}
