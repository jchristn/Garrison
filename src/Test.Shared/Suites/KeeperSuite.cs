namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Net.WebSockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Keepers;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.ProviderHarness;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Keepers (AUTONOMOUS_AGENTS_PLAN.md phase AA1): interval math and model clamps, mandate CRUD with validation, RBAC,
    /// reference guards, and tenant isolation, scripted keeper ticks through the fake harness (reported outcome, first
    /// report wins, backoff, recent summaries in the next input, the keeper system fragment, Unreported runs),
    /// single-flight with Skipped ticks and recovery of an interrupted claim, exactly-once ticks across three replicas, and
    /// the management and keeper MCP tools.
    /// </summary>
    public static class KeeperSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>();
            unit.Add(new TestCaseDescriptor("keeper-unit", "intervals", "Interval math: ten quiet ticks reach the maximum, Acted and Unreported keep, Attention resets, Fixed mode, requested wakes clamped, and jitter bounds", IntervalsAsync));
            unit.Add(new TestCaseDescriptor("keeper-unit", "models", "Revision clamps report ValueClamped warnings and enums round-trip by name", ModelsAsync));
            unit.Add(new TestCaseDescriptor("keeper-unit", "sweep-options", "Scheduler sweep options: defaults (5 s, 2500 claims, 32 at a time) and clamps at their minimums and maximums", SweepOptionsAsync));
            suites.Add(new TestSuiteDescriptor("keeper-unit", "Keepers (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "keepers-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "crud", "Mandate CRUD by id and name, revisions and publish, pause, resume, wake, validation codes, settings bounds, RBAC and the agent check, reference guards, forced delete, and tenant isolation (" + provider + ")", ct => CrudAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "ticks", "Scripted keeper ticks: Quiet reported once (first report wins), backoff, summaries in the next input, the keeper system fragment and template versions, runs filtered by mandate, and Unreported runs (" + provider + ")", ct => TicksAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "single-flight", "A timer wake during a tick is Skipped and deferred, a manual wake waits for the tick, and an interrupted claim is failed and freed (" + provider + ")", ct => SingleFlightAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "sweep-settings", "Autonomy.SchedulerSweepSeconds, MaxDueClaimsPerSweep, and SchedulerSweepConcurrency: registered defaults and bounds, out-of-range values refused, in-range values applied live, a sweep one at a time and a sweep 16 at a time each start one tick per due mandate, and the claim batch limits a sweep (" + provider + ")", ct => SweepSettingsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "replicas", "Three replicas sweeping 50 due mandates at once start exactly 50 ticks (" + provider + ")", ct => ReplicasAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "manifests", "Manifest kind Mandate: dry run, apply, unchanged re-apply, a changed revision publishes the next one, paused, agent immutability, export, and a studio draft with a mandate item validates (" + provider + ")", ct => ManifestsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "channel", "A mandate:{id} subscriber receives tick.started when a tick's run starts and tick.completed with the outcome and next wake when it ends (" + provider + ")", ct => ChannelAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "data-isolation", "mandates, mandate_revisions, mandate_revision_signals, and mandate_ticks: another tenant cannot read, list, publish, report, or wake them, and its own rows stay apart (" + provider + ")", ct => DataIsolationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp", "Management MCP tools for mandates, keeper tools visible only to keeper runs, and refusals for other callers (" + provider + ")", ct => McpAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "user-findings", "UT-04 unknown filters answer 400 InvalidValue, UT-06 pause, resume, wake, and delete are audited, UT-09 a negative budget is refused, UT-13 type errors name the field and a plain type, UT-14 an unchanged revision is not published and does not wake, UT-15 publish and resume wake as Manual (" + provider + ")", ct => UserFindingsAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Keepers (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        /// <summary>
        /// The tenant API base path of a host.
        /// </summary>
        internal static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        /// <summary>
        /// A mandate revision with test defaults.
        /// </summary>
        internal static MandateRevision Revision(string objective, WakeModeEnum mode = WakeModeEnum.Backoff, int min = 60, int max = 480)
        {
            MandateRevision revision = new MandateRevision();
            revision.Objective = objective;
            revision.HealthyDefinition = "The pond has no ripples.";
            revision.Autonomy = "Observe only.";
            revision.WakeMode = mode;
            revision.MinIntervalSeconds = min;
            revision.MaxIntervalSeconds = max;
            revision.BackoffFactor = 2.0;
            revision.JitterPercent = 0;
            revision.Signals = new List<MandateRevisionSignal> { new MandateRevisionSignal { Name = "ripples", Description = "Count ripples on the surface." } };
            return revision;
        }

        /// <summary>
        /// A mandate on an agent's default deployment.
        /// </summary>
        internal static Mandate Body(string name, Agent agent, MandateRevision? revision)
        {
            Mandate mandate = new Mandate();
            mandate.Name = name;
            mandate.AgentId = agent.Id;
            mandate.DeploymentId = agent.Name + "-default";
            mandate.CurrentRevision = revision;
            return mandate;
        }

        /// <summary>
        /// Start a one-worker cluster whose leader does not sweep keepers, so a test drives the scheduler itself.
        /// </summary>
        internal static async Task<TestCluster> ClusterAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false);
            // Tests drive the scheduler themselves; the leader's own sweep would race with them. Run completion still
            // finishes ticks at once.
            cluster.Server.Server.Context.Get<MaintenanceService>().Keepers = null;
            return cluster;
        }

        /// <summary>
        /// Apply the keeper-script harness profile: the fake harness runs up to three MCP calls from deployment parameters step1 to step3.
        /// </summary>
        internal static async Task ApplyScriptProfileAsync(TestServerHost host, CancellationToken token)
        {
            string steps = String.Join("\n", Enumerable.Range(1, 3).Select(i =>
                "    - template: --mcp-invoke\n      condition: \"{{deployment.parameters.step" + i + "}}\"\n    - template: \"{{deployment.parameters.step" + i + "}}\"\n      condition: \"{{deployment.parameters.step" + i + "}}\""));
            string manifest = @"apiVersion: garrison/v1
kind: HarnessProfile
metadata:
  name: keeper-script
spec:
  harnessType: Generic
  executable: garrison-fake-harness
  promptDelivery: Stdin
  mcpConfigFormat: ClaudeJson
  mcpConfigFileName: mcp.json
  outputParser: ClaudeStreamJson
  resultSource: ParserFinalEvent
  defaultTimeoutSeconds: 300
  files:
    - baseDirectory: Config
      pathTemplate: mcp.json
      contentTemplate: ""{{> builtin/claude-code-mcp-config}}""
      isSecret: true
      condition: ""{{resources.hasMcpServers}}""
      mode: ""600""
  arguments:
    - template: --format
    - template: claude
    - template: --mcp-config
      condition: ""{{resources.hasMcpServers}}""
    - template: $GARRISON_CONFIG_DIR/mcp.json
      condition: ""{{resources.hasMcpServers}}""
" + steps + "\n";
            using (StringContent content = new StringContent(manifest, Encoding.UTF8, "application/yaml"))
            using (HttpResponseMessage response = await host.AdminClient.PostAsync(T(host) + "/manifests/apply", content, token).ConfigureAwait(false))
            {
                string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                Assert.Equal(200, (int)response.StatusCode, "Script profile: " + body);
                Assert.True(!body.Contains("\"Failed\"", StringComparison.Ordinal), "Script profile applies: " + body);
            }
        }

        private static string CompleteTick(string outcome, string summary)
        {
            return "garrison,garrison_keeper_complete_tick," + Serializer.Serialize(new { outcome = outcome, summary = summary });
        }

        /// <summary>
        /// Wait for a tick to finish.
        /// </summary>
        internal static async Task<MandateTick> WaitTickAsync(TestServerHost host, string tickId, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(90);
            while (true)
            {
                MandateTick tick = await HttpTestHelpers.SendAsync<MandateTick>(host.AdminClient, HttpMethod.Get, T(host) + "/mandate-ticks/" + tickId, null, 200, token).ConfigureAwait(false);
                if (tick.FinishedUtc.HasValue) return tick;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Tick " + tickId + " did not finish in time (run " + tick.RunId + ").");
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// A mandate's ticks, newest first.
        /// </summary>
        internal static async Task<List<MandateTick>> TicksOfAsync(TestServerHost host, string mandateId, CancellationToken token)
        {
            EnumerationResult<MandateTick> page = await HttpTestHelpers.SendAsync<EnumerationResult<MandateTick>>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/" + mandateId + "/ticks?maxResults=100", null, 200, token).ConfigureAwait(false);
            return page.Objects;
        }

        /// <summary>
        /// Assert a response status and error code.
        /// </summary>
        internal static void Code(TestResponse response, int status, string code, string what)
        {
            Assert.Equal(status, response.StatusCode, what + " status (" + response.Body + ")");
            Assert.True(response.Body.Contains(code, StringComparison.Ordinal), what + " answers " + code + ": " + response.Body);
        }

        private static Task IntervalsAsync(CancellationToken token)
        {
            KeeperIntervalCalculator calculator = new KeeperIntervalCalculator(() => 0.0);
            MandateRevision backoff = Revision("x", WakeModeEnum.Backoff, 60, 3600);
            DateTime now = new DateTime(2026, 11, 25, 12, 0, 0, DateTimeKind.Utc);

            int interval = 60;
            int quiet = 0;
            List<int> seen = new List<int>();
            for (int i = 0; i < 10; i++)
            {
                KeeperIntervalResult step = calculator.Next(backoff, interval, quiet, TickOutcomeEnum.Quiet, null, now);
                interval = step.IntervalSeconds;
                quiet = step.ConsecutiveQuietTicks;
                seen.Add(interval);
            }
            Assert.True(seen.SequenceEqual(new[] { 120, 240, 480, 960, 1920, 3600, 3600, 3600, 3600, 3600 }), "Ten quiet ticks double up to the maximum: " + String.Join(",", seen));
            Assert.Equal(10, quiet, "Quiet ticks are counted");

            KeeperIntervalResult acted = calculator.Next(backoff, 960, 4, TickOutcomeEnum.Acted, null, now);
            Assert.True(acted.IntervalSeconds == 960 && acted.ConsecutiveQuietTicks == 0, "Acted keeps the interval and resets the quiet count");
            KeeperIntervalResult unreported = calculator.Next(backoff, 960, 4, TickOutcomeEnum.Unreported, null, now);
            Assert.Equal(960, unreported.IntervalSeconds, "Unreported keeps the interval");
            foreach (TickOutcomeEnum reset in new[] { TickOutcomeEnum.Attention, TickOutcomeEnum.Escalated, TickOutcomeEnum.Failed, TickOutcomeEnum.Skipped })
            {
                Assert.Equal(60, calculator.Next(backoff, 1920, 3, reset, null, now).IntervalSeconds, reset + " resets to the minimum");
            }

            KeeperIntervalResult requested = calculator.Next(backoff, 240, 2, TickOutcomeEnum.Quiet, 5, now);
            Assert.True(requested.IntervalSeconds == 480 && requested.AppliedIntervalSeconds == 60 && requested.NextWakeUtc == now.AddSeconds(60), "A requested wake below the minimum is raised to it and does not change the backoff state");
            KeeperIntervalResult tooLate = calculator.Next(backoff, 240, 2, TickOutcomeEnum.Quiet, 999999, now);
            Assert.Equal(3600, tooLate.AppliedIntervalSeconds, "A requested wake above the maximum is lowered to it");

            MandateRevision fixedRevision = Revision("x", WakeModeEnum.Fixed, 300, 3600);
            Assert.Equal(300, calculator.Next(fixedRevision, 1200, 9, TickOutcomeEnum.Quiet, null, now).IntervalSeconds, "Fixed mode always uses the minimum");

            MandateRevision jittered = Revision("x", WakeModeEnum.Fixed, 1000, 3600);
            jittered.JitterPercent = 10;
            KeeperIntervalResult low = new KeeperIntervalCalculator(() => 0.0).Next(jittered, 1000, 0, TickOutcomeEnum.Quiet, null, now);
            KeeperIntervalResult high = new KeeperIntervalCalculator(() => 0.9999).Next(jittered, 1000, 0, TickOutcomeEnum.Quiet, null, now);
            Assert.True(low.JitterSeconds == 0 && high.JitterSeconds >= 99 && high.JitterSeconds <= 100 && high.NextWakeUtc == now.AddSeconds(1000 + high.JitterSeconds), "Jitter adds 0 to 10 percent: " + high.JitterSeconds);
            jittered.JitterPercent = null;
            KeeperIntervalCalculator defaults = new KeeperIntervalCalculator(() => 0.9999);
            defaults.DefaultJitterPercent = 0;
            Assert.Equal(0, defaults.Next(jittered, 1000, 0, TickOutcomeEnum.Quiet, null, now).JitterSeconds, "A revision without jitter uses the default");

            KeeperIntervalResult start = calculator.Start(backoff, now);
            Assert.True(start.IntervalSeconds == 60 && start.NextWakeUtc == now && start.ConsecutiveQuietTicks == 0, "Start wakes at once with the minimum interval");
            return Task.CompletedTask;
        }

        private static Task ModelsAsync(CancellationToken token)
        {
            MandateRevision revision = new MandateRevision();
            revision.MinIntervalSeconds = 1;
            revision.MaxIntervalSeconds = 99999999;
            revision.BackoffFactor = 50;
            revision.JitterPercent = -3;
            revision.BudgetPerDayUsd = -1;
            List<FieldWarning> warnings = Assert.NotNull(revision.Warnings, "Clamped values produce warnings");
            Assert.True(revision.MinIntervalSeconds == 10 && revision.MaxIntervalSeconds == 2592000 && revision.BackoffFactor == 10.0 && revision.JitterPercent == 0 && revision.BudgetPerDayUsd == 0, "Values are clamped");
            foreach (string field in new[] { "minIntervalSeconds", "maxIntervalSeconds", "backoffFactor", "jitterPercent", "budgetPerDayUsd" })
            {
                Assert.True(warnings.Any(w => w.Field == field && w.Code == "ValueClamped"), field + " has a ValueClamped warning");
            }
            revision.MinIntervalSeconds = 120;
            Assert.True(!revision.Warnings!.Any(w => w.Field == "minIntervalSeconds"), "An in-range value clears its warning");

            Mandate mandate = new Mandate { Name = "m", Status = MandateStatusEnum.CapReached, LastTickOutcome = TickOutcomeEnum.Unreported, PendingWakeSource = WakeSourceEnum.EscalationAnswer };
            string json = Serializer.Serialize(mandate);
            Assert.True(json.Contains("\"CapReached\"", StringComparison.Ordinal) && json.Contains("\"Unreported\"", StringComparison.Ordinal) && json.Contains("\"EscalationAnswer\"", StringComparison.Ordinal), "Enums serialize by name: " + json);
            Mandate back = Assert.NotNull(Serializer.Deserialize<Mandate>(json), "Round trip");
            Assert.True(back.Status == MandateStatusEnum.CapReached && back.LastTickOutcome == TickOutcomeEnum.Unreported && back.PendingWakeSource == WakeSourceEnum.EscalationAnswer, "Enums round-trip");
            Assert.True(new Mandate().Id.StartsWith("mdt_", StringComparison.Ordinal) && new MandateRevision().Id.StartsWith("mdr_", StringComparison.Ordinal) && new MandateTick().Id.StartsWith("mtk_", StringComparison.Ordinal), "Identifier prefixes");
            return Task.CompletedTask;
        }

        private static async Task DataIsolationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Mandate mine = await db.Mandates.CreateAsync(new Mandate { TenantId = "ten_a", Name = "pond", AgentId = "agt_a", DeploymentId = "dep_a" }, token).ConfigureAwait(false);
                Mandate theirs = await db.Mandates.CreateAsync(new Mandate { TenantId = "ten_b", Name = "pond", AgentId = "agt_b", DeploymentId = "dep_b" }, token).ConfigureAwait(false);
                MandateRevision revision = new MandateRevision { TenantId = "ten_a", MandateId = mine.Id, Number = 1, Objective = "Keep the pond clean" };
                revision.Signals = new List<MandateRevisionSignal> { new MandateRevisionSignal { Name = "clarity" } };
                revision = await db.MandateRevisions.CreateAsync(revision, token).ConfigureAwait(false);
                MandateTick tick = await db.MandateTicks.CreateAsync(new MandateTick { TenantId = "ten_a", MandateId = mine.Id, RevisionId = revision.Id, Summary = "all clear" }, token).ConfigureAwait(false);

                Assert.True(await db.Mandates.ReadAsync("ten_b", mine.Id, token).ConfigureAwait(false) == null, "Another tenant cannot read the mandate");
                Assert.Equal(theirs.Id, Assert.NotNull(await db.Mandates.ReadByNameAsync("ten_b", "pond", token).ConfigureAwait(false), "Same name in another tenant").Id, "A name lookup stays in its tenant");
                EnumerationResult<Mandate> listed = await db.Mandates.EnumerateAsync("ten_b", null, null, null, new EnumerationQuery(), token).ConfigureAwait(false);
                Assert.True(listed.Objects.Count == 1 && listed.Objects[0].Id == theirs.Id, "Another tenant lists only its own mandate");
                Assert.True(!await db.Mandates.RequestWakeAsync("ten_b", mine.Id, WakeSourceEnum.Manual, DateTime.UtcNow, token).ConfigureAwait(false), "Another tenant cannot wake it");
                Assert.True(!await db.Mandates.DeleteAsync("ten_b", mine.Id, token).ConfigureAwait(false), "Another tenant cannot delete it");

                Assert.True(await db.MandateRevisions.ReadAsync("ten_b", revision.Id, token).ConfigureAwait(false) == null, "Another tenant cannot read the revision or its signals");
                Assert.Equal(0L, (await db.MandateRevisions.EnumerateAsync("ten_b", mine.Id, new EnumerationQuery(), token).ConfigureAwait(false)).TotalRecords, "Another tenant lists no revisions");
                Assert.True(!await db.MandateRevisions.PublishAsync("ten_b", revision.Id, DateTime.UtcNow, token).ConfigureAwait(false), "Another tenant cannot publish it");
                MandateRevision own = Assert.NotNull(await db.MandateRevisions.ReadAsync("ten_a", revision.Id, token).ConfigureAwait(false), "Its tenant reads the revision");
                Assert.True(own.State == MandateRevisionStateEnum.Draft && own.Signals.Count == 1 && own.Signals[0].Name == "clarity", "The revision stays a draft with its signal");

                Assert.True(await db.MandateTicks.ReadAsync("ten_b", tick.Id, token).ConfigureAwait(false) == null, "Another tenant cannot read the tick");
                Assert.Equal(0L, (await db.MandateTicks.EnumerateAsync("ten_b", mine.Id, null, new EnumerationQuery(), token).ConfigureAwait(false)).TotalRecords, "Another tenant lists no ticks");
                Assert.Equal(0, (await db.MandateTicks.ListRecentAsync("ten_b", mine.Id, 10, token).ConfigureAwait(false)).Count, "Another tenant sees no recent ticks");
                Assert.True(!await db.MandateTicks.TryReportAsync("ten_b", tick.Id, TickOutcomeEnum.Acted, "forged", null, token).ConfigureAwait(false), "Another tenant cannot report the tick");
                MandateTick ownTick = Assert.NotNull(await db.MandateTicks.ReadAsync("ten_a", tick.Id, token).ConfigureAwait(false), "Its tenant reads the tick");
                Assert.True(!ownTick.Reported && ownTick.Summary == "all clear", "The tick keeps its own summary");
            }
        }

        private static async Task CrudAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("keep-crud", "builtin/fake", null, token).ConfigureAwait(false);
                Agent other = await cluster.CreateAgentAsync("keep-other", "builtin/fake", null, token).ConfigureAwait(false);

                // A draft mandate has no schedule until a revision is published.
                Mandate draft = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("pond-draft", agent, null), 201, token).ConfigureAwait(false);
                Assert.True(draft.Status == MandateStatusEnum.Draft && !draft.NextWakeUtc.HasValue && draft.CurrentRevisionNumber == 0 && draft.RunAsType == PrincipalTypeEnum.Administrator, "Draft mandate: " + Serializer.Serialize(draft));
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + draft.Id + "/resume", null, token).ConfigureAwait(false), 409, "MandateNotPaused", "Resume of a draft");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + draft.Id + "/wake", null, token).ConfigureAwait(false), 409, "MandateNotActive", "Wake of a draft");
                MandateRevision drafted = await HttpTestHelpers.SendAsync<MandateRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + draft.Name + "/revisions", Revision("Keep the pond calm."), 201, token).ConfigureAwait(false);
                Assert.True(drafted.Number == 1 && drafted.State == MandateRevisionStateEnum.Draft && drafted.Source == MandateRevisionSourceEnum.Human && drafted.Signals.Count == 1, "Drafted revision 1");
                Mandate published = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + draft.Id + "/revisions/" + drafted.Id + "/publish", null, 200, token).ConfigureAwait(false);
                Assert.True(published.Status == MandateStatusEnum.Active && published.CurrentRevisionNumber == 1 && published.NextWakeUtc.HasValue && published.CurrentIntervalSeconds == 60 && published.CurrentRevision != null && published.CurrentRevision.State == MandateRevisionStateEnum.Published, "Publishing activates the mandate: " + Serializer.Serialize(published));
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + draft.Id + "/revisions/" + drafted.Id + "/publish", null, token).ConfigureAwait(false), 409, "RevisionPublished", "Publishing twice");
                MandateRevision byNumber = await HttpTestHelpers.SendAsync<MandateRevision>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/" + draft.Id + "/revisions/1", null, 200, token).ConfigureAwait(false);
                Assert.Equal(drafted.Id, byNumber.Id, "Revisions are addressable by number");

                // Inline first revision, with settings bounds applied and reported.
                MandateRevision tiny = Revision("Watch the gate.");
                tiny.MinIntervalSeconds = 15;
                tiny.MaxIntervalSeconds = 20;
                TestResponse inlineResponse = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("gate", agent, tiny), token).ConfigureAwait(false);
                Assert.Equal(201, inlineResponse.StatusCode, "Inline create: " + inlineResponse.Body);
                Mandate inline = Assert.NotNull(Serializer.Deserialize<Mandate>(inlineResponse.Body), "Inline mandate");
                Assert.True(inline.Status == MandateStatusEnum.Active && inline.CurrentRevision != null && inline.CurrentRevision.MinIntervalSeconds == 60 && inline.CurrentRevision.MaxIntervalSeconds == 60, "Intervals are raised to Autonomy.MinIntervalSeconds: " + Serializer.Serialize(inline.CurrentRevision));
                Assert.True(inlineResponse.Body.Contains("\"warnings\"", StringComparison.Ordinal) && inlineResponse.Body.Contains("ValueClamped", StringComparison.Ordinal) && inlineResponse.Body.Contains("maxIntervalSeconds", StringComparison.Ordinal), "The create response carries the warnings: " + inlineResponse.Body);
                Mandate paused = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", new Mandate { Name = "paused-gate", AgentId = agent.Name, DeploymentId = "keep-crud-default", Status = MandateStatusEnum.Paused, CurrentRevision = Revision("Watch quietly.") }, 201, token).ConfigureAwait(false);
                Assert.True(paused.Status == MandateStatusEnum.Paused && !paused.NextWakeUtc.HasValue && paused.AgentId == agent.Id, "Created Paused, agent resolved by name");

                // Pause, resume, wake.
                Mandate pausedNow = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/gate/pause", null, 200, token).ConfigureAwait(false);
                Assert.True(pausedNow.Status == MandateStatusEnum.Paused && !pausedNow.NextWakeUtc.HasValue, "Pause clears the schedule");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/gate/wake", null, token).ConfigureAwait(false), 409, "MandateNotActive", "Wake while paused");
                Mandate resumed = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/gate/resume", null, 200, token).ConfigureAwait(false);
                Assert.True(resumed.Status == MandateStatusEnum.Active && resumed.NextWakeUtc.HasValue, "Resume schedules a wake");
                Mandate woken = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/gate/wake", null, 202, token).ConfigureAwait(false);
                Assert.True(woken.NextWakeUtc.HasValue && woken.NextWakeUtc.Value <= DateTime.UtcNow.AddSeconds(1), "Wake schedules now");

                // Listing and filters.
                EnumerationResult<Mandate> active = await HttpTestHelpers.SendAsync<EnumerationResult<Mandate>>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates?status=Active", null, 200, token).ConfigureAwait(false);
                Assert.True(active.Objects.Count == 2 && active.Objects.All(m => m.Status == MandateStatusEnum.Active), "Status filter");
                EnumerationResult<Mandate> search = await HttpTestHelpers.SendAsync<EnumerationResult<Mandate>>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates?search=gate", null, 200, token).ConfigureAwait(false);
                Assert.Equal(2, search.Objects.Count, "Search by name");

                // Update keeps the agent, may move the deployment, and validates it.
                Mandate update = new Mandate { Name = "gate-keeper", Description = "Watches the gate.", DeploymentId = "keep-crud-default" };
                Mandate updated = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Put, T(host) + "/mandates/gate", update, 200, token).ConfigureAwait(false);
                Assert.True(updated.Name == "gate-keeper" && updated.Description == "Watches the gate." && updated.Status == MandateStatusEnum.Active, "Update renames");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/mandates/gate-keeper", new Mandate { AgentId = other.Id }, token).ConfigureAwait(false), 400, "Immutable", "The agent cannot change");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/mandates/gate-keeper", new Mandate { DeploymentId = "keep-other-default" }, token).ConfigureAwait(false), 400, "DeploymentAgentMismatch", "A deployment of another agent");

                // Validation.
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("Bad Name", agent, null), token).ConfigureAwait(false), 400, "name", "A bad name");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", new Mandate { Name = "ghost", AgentId = "agt_missing", DeploymentId = "x" }, token).ConfigureAwait(false), 400, "ReferenceNotFound", "A missing agent");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("pond-draft", agent, null), token).ConfigureAwait(false), 409, "NameConflict", "A taken name");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("no-objective", agent, new MandateRevision()), token).ConfigureAwait(false), 400, "objective", "A revision without an objective");
                MandateRevision crowded = Revision("Too many signals.");
                crowded.Signals = Enumerable.Range(0, 51).Select(i => new MandateRevisionSignal { Name = "s" + i }).ToList();
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("crowded", agent, crowded), token).ConfigureAwait(false), 400, "signals", "Too many signals");

                // RBAC: a viewer reads but cannot create; creating needs Execute on the agent too.
                await UserAsync(host, "keep-viewer@example.com", "Viewer", token).ConfigureAwait(false);
                using (HttpClient viewer = await host.UserClientAsync("keep-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Get, T(host) + "/mandates", null, token).ConfigureAwait(false)).StatusCode, "A viewer lists mandates");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Post, T(host) + "/mandates", Body("viewer-made", agent, null), token).ConfigureAwait(false)).StatusCode, "A viewer cannot create");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Post, T(host) + "/mandates/gate-keeper/pause", null, token).ConfigureAwait(false)).StatusCode, "A viewer cannot pause");
                }
                User developer = await UserAsync(host, "keep-dev@example.com", "AgentDeveloper", token).ConfigureAwait(false);
                using (HttpClient dev = await host.UserClientAsync("keep-dev@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Mandate mine = await HttpTestHelpers.SendAsync<Mandate>(dev, HttpMethod.Post, T(host) + "/mandates", Body("dev-made", agent, Revision("Developer keeper.")), 201, token).ConfigureAwait(false);
                    Assert.True(mine.RunAsType == PrincipalTypeEnum.User && mine.RunAsId == developer.Id, "Ticks run as the creator");
                }

                // Reference guards: an agent or deployment used by a mandate cannot be deleted.
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/" + agent.Id, null, token).ConfigureAwait(false), 409, "ReferencedByMandate", "Deleting the keeper's agent");

                // Tenant isolation.
                Tenant otherTenant = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Keepers Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + otherTenant.Id + "/users", new UserRequest { Email = "keep-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("keep-outsider@example.com", "password123", otherTenant.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + otherTenant.Id + "/mandates/" + draft.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's mandate is not found");
                    EnumerationResult<Mandate> theirs = await HttpTestHelpers.SendAsync<EnumerationResult<Mandate>>(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + otherTenant.Id + "/mandates", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(0, theirs.Objects.Count, "Another tenant lists none");
                    Assert.True((await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, T(host) + "/mandates/" + draft.Id, null, token).ConfigureAwait(false)).StatusCode >= 403, "Another tenant's path is refused");
                }

                // Delete: refused while a tick is in flight unless forced.
                Mandate gate = (await host.Server.Context.Database.Mandates.ReadByNameAsync(host.TenantId, "gate-keeper", token).ConfigureAwait(false))!;
                Assert.True(await host.Server.Context.Database.Mandates.TryClaimAsync(gate.Id, gate.NextWakeUtc!.Value, "mtk_simulated", token).ConfigureAwait(false), "Simulated claim");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/mandates/gate-keeper", null, token).ConfigureAwait(false), 409, "MandateActive", "Delete during a tick");
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/mandates/gate-keeper?force=true", null, token).ConfigureAwait(false)).StatusCode, "Forced delete");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/gate-keeper", null, token).ConfigureAwait(false)).StatusCode, "Deleted");
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/mandates/" + draft.Id, null, token).ConfigureAwait(false)).StatusCode, "Delete an idle mandate");
                EnumerationResult<MandateRevision> gone = await host.Server.Context.Database.MandateRevisions.EnumerateAsync(host.TenantId, draft.Id, new EnumerationQuery(), token).ConfigureAwait(false);
                Assert.Equal(0, gone.Objects.Count, "Revisions are deleted with the mandate");
            }
        }

        private static async Task UserFindingsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                KeeperScheduler scheduler = host.Server.Context.Get<KeeperScheduler>();
                Agent agent = await cluster.CreateAgentAsync("ut-keeper", "builtin/fake", null, token).ConfigureAwait(false);
                string mandateHead = "{\"agentId\":\"" + agent.Id + "\",\"deploymentId\":\"ut-keeper-default\",";

                // UT-04: an unknown filter value is refused, naming the parameter and the allowed values.
                TestResponse bogus = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/mandates?status=Bogus", null, token).ConfigureAwait(false);
                Code(bogus, 400, "InvalidValue", "An unknown status filter");
                Assert.True(bogus.Body.Contains("status must be one of", StringComparison.Ordinal) && bogus.Body.Contains("Paused", StringComparison.Ordinal), "The error lists the allowed values: " + bogus.Body);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/audit?eventType=NoSuchEvent", null, token).ConfigureAwait(false), 400, "InvalidValue", "An unknown audit event type");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/mandates?status=42", null, token).ConfigureAwait(false), 400, "InvalidValue", "A number is not a status");
                Assert.Equal(200, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/mandates?status=active", null, token).ConfigureAwait(false)).StatusCode, "Names match without regard to case");
                Assert.Equal(200, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/mandates?status=", null, token).ConfigureAwait(false)).StatusCode, "An empty filter is no filter");

                // UT-09: a negative budget is refused, not clamped to 0.
                TestResponse negative = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", mandateHead + "\"name\":\"ut-negative\",\"currentRevision\":{\"objective\":\"Spend nothing.\",\"budgetPerTickUsd\":-5,\"budgetPerDayUsd\":-1}}", token).ConfigureAwait(false);
                Code(negative, 400, "InvalidValue", "A negative budget");
                Assert.True(negative.Body.Contains("budgetPerTickUsd", StringComparison.Ordinal) && negative.Body.Contains("budgetPerDayUsd", StringComparison.Ordinal) && negative.Body.Contains("from 0 to 1000000", StringComparison.Ordinal), "Both budgets are named: " + negative.Body);
                Assert.True(await host.Server.Context.Database.Mandates.ReadByNameAsync(host.TenantId, "ut-negative", token).ConfigureAwait(false) == null, "Nothing was created");
                TestResponse large = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", mandateHead + "\"name\":\"ut-large\",\"status\":\"Paused\",\"currentRevision\":{\"objective\":\"Spend a lot.\",\"budgetPerTickUsd\":5000000}}", token).ConfigureAwait(false);
                Assert.True(large.StatusCode == 201 && large.Body.Contains("ValueClamped", StringComparison.Ordinal), "A budget over the maximum still clamps with a warning: " + large.Body);

                // UT-13: a value of the wrong type names the field and a plain type, never a .NET type.
                TestResponse typed = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", mandateHead + "\"name\":\"ut-typed\",\"currentRevision\":{\"objective\":\"x\",\"minIntervalSeconds\":\"soon\"}}", token).ConfigureAwait(false);
                Code(typed, 400, "InvalidBody", "A string for a number");
                Assert.True(typed.Body.Contains("currentRevision.minIntervalSeconds must be a whole number.", StringComparison.Ordinal) && typed.Body.Contains("InvalidType", StringComparison.Ordinal), "Field and plain type: " + typed.Body);
                TestResponse mode = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", mandateHead + "\"name\":\"ut-mode\",\"currentRevision\":{\"objective\":\"x\",\"wakeMode\":\"Sometimes\"}}", token).ConfigureAwait(false);
                Code(mode, 400, "InvalidBody", "An unknown wake mode");
                Assert.True(mode.Body.Contains("currentRevision.wakeMode must be one of Fixed, Backoff.", StringComparison.Ordinal), "Enum values listed: " + mode.Body);
                foreach (string leak in new[] { "System.Int32", "Garrison.Core", "BytePosition", "LineNumber" })
                {
                    Assert.True(!typed.Body.Contains(leak, StringComparison.Ordinal) && !mode.Body.Contains(leak, StringComparison.Ordinal), "No serializer internals (" + leak + "): " + typed.Body + " " + mode.Body);
                }

                // UT-15: publishing a revision wakes the keeper as Manual, and the tick records it.
                Mandate draft = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("ut-pond", agent, null), 201, token).ConfigureAwait(false);
                MandateRevision first = await HttpTestHelpers.SendAsync<MandateRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + draft.Id + "/revisions", Revision("Keep the pond calm."), 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + draft.Id + "/revisions/" + first.Id + "/publish", null, 200, token).ConfigureAwait(false);
                Mandate stored = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, draft.Id, token).ConfigureAwait(false))!;
                Assert.True(stored.PendingWakeSource == WakeSourceEnum.Manual, "Publish leaves a Manual wake pending: " + stored.PendingWakeSource);

                // UT-14: the same content again is not published and does not move the schedule.
                MandateRevision same = await HttpTestHelpers.SendAsync<MandateRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + draft.Id + "/revisions", Revision("Keep the pond calm."), 201, token).ConfigureAwait(false);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + draft.Id + "/revisions/" + same.Id + "/publish", null, token).ConfigureAwait(false), 409, "RevisionUnchanged", "Publishing an unchanged revision");
                Mandate unchanged = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, draft.Id, token).ConfigureAwait(false))!;
                Assert.True(unchanged.CurrentRevisionNumber == 1 && unchanged.NextWakeUtc == stored.NextWakeUtc, "The current revision and the next wake stay: " + Serializer.Serialize(unchanged));
                MandateRevision sameDraft = await HttpTestHelpers.SendAsync<MandateRevision>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/" + draft.Id + "/revisions/" + same.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(MandateRevisionStateEnum.Draft, sameDraft.State, "The unchanged revision stays a draft");

                Assert.True(await scheduler.SweepAsync(DateTime.UtcNow.AddSeconds(1), token).ConfigureAwait(false), "The sweep starts the tick");
                List<MandateTick> ticks = await TicksOfAsync(host, draft.Id, token).ConfigureAwait(false);
                Assert.True(ticks.Count == 1 && ticks[0].WakeSource == WakeSourceEnum.Manual, "The tick after a publish is Manual: " + Serializer.Serialize(ticks));
                await WaitTickAsync(host, ticks[0].Id, token).ConfigureAwait(false);

                // UT-06 and UT-15: pause, resume (a Manual wake), wake, and delete are audited with their own event types.
                await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/ut-pond/pause", null, 200, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/ut-pond/resume", null, 200, token).ConfigureAwait(false);
                Mandate resumed = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, draft.Id, token).ConfigureAwait(false))!;
                Assert.True(resumed.PendingWakeSource == WakeSourceEnum.Manual, "Resume leaves a Manual wake pending: " + resumed.PendingWakeSource);
                await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/ut-pond/wake", null, 202, token).ConfigureAwait(false);
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/mandates/ut-pond?force=true", null, token).ConfigureAwait(false)).StatusCode, "Delete");
                foreach (AuditEventTypeEnum eventType in new[] { AuditEventTypeEnum.MandatePaused, AuditEventTypeEnum.MandateResumed, AuditEventTypeEnum.MandateWoken, AuditEventTypeEnum.MandateDeleted })
                {
                    AuditPage page = await host.Server.Context.Database.Audit.EnumerateAsync(new AuditFilter { TenantId = host.TenantId, EventType = eventType }, token).ConfigureAwait(false);
                    Assert.True(page.Objects.Count == 1 && page.Objects[0].ResourceId == draft.Id && page.Objects[0].ResourceType == "Mandate" && !String.IsNullOrEmpty(page.Objects[0].PrincipalName), eventType + " is audited with the person: " + Serializer.Serialize(page.Objects));
                    TestResponse filtered = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/audit?eventType=" + eventType, null, token).ConfigureAwait(false);
                    Assert.True(filtered.StatusCode == 200 && filtered.Body.Contains(draft.Id, StringComparison.Ordinal), eventType + " filters over REST: " + filtered.Body);
                }
            }
        }

        private static async Task TicksAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                KeeperScheduler scheduler = host.Server.Context.Get<KeeperScheduler>();
                await ApplyScriptProfileAsync(host, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("pond-keeper", "keeper-script", null, token, deployment =>
                {
                    deployment.Parameters = new List<DeploymentParameter>
                    {
                        new DeploymentParameter { Name = "step1", Value = CompleteTick("Quiet", "pond is calm") },
                        new DeploymentParameter { Name = "step2", Value = CompleteTick("Attention", "second report") }
                    };
                }).ConfigureAwait(false);
                Mandate mandate = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("pond", agent, Revision("Keep the koi pond calm.")), 201, token).ConfigureAwait(false);

                // First tick: due at once; the run reports Quiet, and the second report changes nothing.
                Assert.True(await scheduler.SweepAsync(DateTime.UtcNow.AddSeconds(1), token).ConfigureAwait(false), "The first sweep starts a tick");
                List<MandateTick> started = await TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false);
                Assert.True(started.Count == 1 && started[0].RunId != null && started[0].WakeSource == WakeSourceEnum.Timer && started[0].TemplateName == "builtin/keeper-tick", "One tick with a run: " + Serializer.Serialize(started));
                MandateTick first = await WaitTickAsync(host, started[0].Id, token).ConfigureAwait(false);
                Run firstRun = (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, first.RunId!, token).ConfigureAwait(false))!;
                Assert.True(firstRun.Status == RunStatusEnum.Succeeded && firstRun.Kind == RunKindEnum.Keeper && firstRun.MandateId == mandate.Id && firstRun.MandateTickId == first.Id, "The tick ran as a keeper run: " + firstRun.ErrorMessage + " " + firstRun.ResultText);
                Assert.True(first.Outcome == TickOutcomeEnum.Quiet && first.Reported && first.Summary == "pond is calm", "The first report wins: " + Serializer.Serialize(first));
                Assert.True(firstRun.ResultText != null && firstRun.ResultText.Contains("already has an outcome", StringComparison.Ordinal), "The repeated report was answered as a no-op: " + firstRun.ResultText);
                Assert.Equal(120, first.AppliedIntervalSeconds ?? 0, "Backoff doubled the interval after a Quiet tick");
                Assert.True(firstRun.InputText != null && firstRun.InputText.Contains("first tick", StringComparison.Ordinal), "The first tick says so: " + firstRun.InputText);
                Assert.True(firstRun.TemplateVersions.Any(v => v.TemplateName == "builtin/keeper-system"), "The keeper system fragment is recorded on the run: " + String.Join(", ", firstRun.TemplateVersions.Select(v => v.TemplateName)));
                Mandate afterFirst = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/pond", null, 200, token).ConfigureAwait(false);
                Assert.True(afterFirst.ActiveTickId == null && afterFirst.CurrentIntervalSeconds == 120 && afterFirst.ConsecutiveQuietTicks == 1 && afterFirst.LastTickOutcome == TickOutcomeEnum.Quiet && afterFirst.TickCount == 1, "The mandate is free and backed off: " + Serializer.Serialize(afterFirst));
                Assert.True(afterFirst.NextWakeUtc.HasValue && Math.Abs((afterFirst.NextWakeUtc.Value - first.FinishedUtc!.Value).TotalSeconds - 120) < 2, "The next wake is one interval after the tick");

                // A manual wake runs now; the input carries the last summary as data.
                await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/pond/wake", null, 202, token).ConfigureAwait(false);
                Assert.True(await scheduler.SweepAsync(DateTime.UtcNow.AddSeconds(1), token).ConfigureAwait(false), "The manual wake starts a tick");
                MandateTick second = await WaitTickAsync(host, (await TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false)).First(t => t.Id != first.Id).Id, token).ConfigureAwait(false);
                Run secondRun = (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, second.RunId!, token).ConfigureAwait(false))!;
                Assert.True(second.WakeSource == WakeSourceEnum.Manual && second.Outcome == TickOutcomeEnum.Quiet && second.AppliedIntervalSeconds == 240, "Second tick: " + Serializer.Serialize(second));
                Assert.True(secondRun.InputText != null && secondRun.InputText.Contains("pond is calm", StringComparison.Ordinal) && secondRun.InputText.Contains("--- Recent ticks ---", StringComparison.Ordinal), "The last summary is framed as data in the next input: " + secondRun.InputText);
                EnumerationResult<Run> byMandate = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(host.AdminClient, HttpMethod.Get, T(host) + "/runs?mandateId=" + mandate.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(2, byMandate.Objects.Count, "Runs filter by mandate");

                // A keeper whose run never reports records Unreported and keeps its interval.
                Agent silent = await cluster.CreateAgentAsync("silent-keeper", "builtin/fake", null, token).ConfigureAwait(false);
                Mandate quiet = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("silent", silent, Revision("Say nothing.")), 201, token).ConfigureAwait(false);
                Assert.True(await scheduler.SweepAsync(DateTime.UtcNow.AddSeconds(1), token).ConfigureAwait(false), "The silent keeper ticks");
                MandateTick unreported = await WaitTickAsync(host, (await TicksOfAsync(host, quiet.Id, token).ConfigureAwait(false)).Single().Id, token).ConfigureAwait(false);
                Assert.True(unreported.Outcome == TickOutcomeEnum.Unreported && !unreported.Reported && unreported.AppliedIntervalSeconds == 60, "An unreported tick: " + Serializer.Serialize(unreported));
            }
        }

        private static async Task SingleFlightAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                KeeperScheduler scheduler = host.Server.Context.Get<KeeperScheduler>();
                Agent agent = await cluster.CreateAgentAsync("flight-keeper", "builtin/fake", null, token).ConfigureAwait(false);
                Mandate mandate = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("flight", agent, Revision("One at a time.")), 201, token).ConfigureAwait(false);

                // Simulate a tick in flight whose claiming replica never started a run.
                Mandate stored = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, mandate.Id, token).ConfigureAwait(false))!;
                DateTime now = DateTime.UtcNow;
                MandateTick inFlight = new MandateTick { TenantId = host.TenantId, MandateId = mandate.Id, RevisionId = stored.CurrentRevisionId, RevisionNumber = 1, StartedUtc = now, ScheduledUtc = stored.NextWakeUtc!.Value };
                Assert.True(await host.Server.Context.Database.Mandates.TryClaimAsync(mandate.Id, stored.NextWakeUtc!.Value, inFlight.Id, token).ConfigureAwait(false), "Claimed once");
                Assert.True(!await host.Server.Context.Database.Mandates.TryClaimAsync(mandate.Id, stored.NextWakeUtc!.Value, "mtk_second", token).ConfigureAwait(false), "A second claim of the same wake loses");
                await host.Server.Context.Database.MandateTicks.CreateAsync(inFlight, token).ConfigureAwait(false);

                // A timer wake that comes due during the tick is Skipped and deferred by one interval.
                stored = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, mandate.Id, token).ConfigureAwait(false))!;
                stored.NextWakeUtc = now.AddSeconds(-5);
                stored.PendingWakeSource = null;
                stored.CurrentIntervalSeconds = 60;
                await host.Server.Context.Database.Mandates.UpdateScheduleAsync(stored, token).ConfigureAwait(false);
                Assert.True(await scheduler.SweepAsync(now, token).ConfigureAwait(false), "The sweep records the skip");
                List<MandateTick> ticks = await TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false);
                MandateTick skipped = ticks.Single(t => t.Id != inFlight.Id);
                Assert.True(skipped.Outcome == TickOutcomeEnum.Skipped && skipped.ErrorCode == "PreviousTickRunning" && skipped.RunId == null, "Skipped tick: " + Serializer.Serialize(skipped));
                Mandate deferred = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, mandate.Id, token).ConfigureAwait(false))!;
                Assert.True(deferred.ActiveTickId == inFlight.Id && deferred.NextWakeUtc.HasValue && deferred.NextWakeUtc.Value > now.AddSeconds(50), "The wake moved by one interval and the tick is still active");
                EnumerationResult<Run> none = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(host.AdminClient, HttpMethod.Get, T(host) + "/runs?mandateId=" + mandate.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(0, none.Objects.Count, "No run started during the tick");

                // A manual wake during the tick waits: no skip is recorded and nothing starts.
                await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/flight/wake", null, 202, token).ConfigureAwait(false);
                await scheduler.SweepAsync(now.AddSeconds(1), token).ConfigureAwait(false);
                Assert.Equal(2, (await TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false)).Count, "A manual wake waits for the tick");

                // The interrupted claim is failed after the grace, and the waiting manual wake then starts a tick.
                Assert.True(await scheduler.SweepAsync(now.AddSeconds(scheduler.OrphanedClaimSeconds + 5), token).ConfigureAwait(false), "The sweep frees the interrupted claim");
                MandateTick failed = (await TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false)).Single(t => t.Id == inFlight.Id);
                Assert.True(failed.Outcome == TickOutcomeEnum.Failed && failed.ErrorCode == "StartInterrupted" && failed.FinishedUtc.HasValue, "Interrupted claim: " + Serializer.Serialize(failed));
                List<MandateTick> after = await TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false);
                MandateTick manual = Assert.NotNull(after.FirstOrDefault(t => t.WakeSource == WakeSourceEnum.Manual), "The waiting manual wake started: " + Serializer.Serialize(after));
                MandateTick done = await WaitTickAsync(host, manual.Id, token).ConfigureAwait(false);
                Assert.Equal(TickOutcomeEnum.Unreported, done.Outcome ?? TickOutcomeEnum.Failed, "The manual tick ran");
            }
        }

        private static Task SweepOptionsAsync(CancellationToken token)
        {
            KeeperOptions options = new KeeperOptions();
            Assert.True(options.SchedulerSweepSeconds == 5 && options.MaxDueClaimsPerSweep == 2500 && options.SchedulerSweepConcurrency == 32, "Defaults: 5 s, 2500 claims, 32 at a time");
            options.SchedulerSweepSeconds = 0;
            options.MaxDueClaimsPerSweep = 0;
            options.SchedulerSweepConcurrency = 0;
            Assert.True(options.SchedulerSweepSeconds == 1 && options.MaxDueClaimsPerSweep == 1 && options.SchedulerSweepConcurrency == 1, "Values below the minimums clamp to 1");
            options.SchedulerSweepSeconds = 61;
            options.MaxDueClaimsPerSweep = 10001;
            options.SchedulerSweepConcurrency = 65;
            Assert.True(options.SchedulerSweepSeconds == 60 && options.MaxDueClaimsPerSweep == 10000 && options.SchedulerSweepConcurrency == 64, "Values above the maximums clamp to 60, 10000, and 64");
            return Task.CompletedTask;
        }

        private static async Task SweepSettingsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                KeeperScheduler scheduler = host.Server.Context.Get<KeeperScheduler>();
                ClusterSettingsService settings = host.Server.Context.Get<ClusterSettingsService>();
                string[] keys = new[] { "Autonomy.SchedulerSweepSeconds", "Autonomy.MaxDueClaimsPerSweep", "Autonomy.SchedulerSweepConcurrency" };
                string[] defaults = new[] { "5", "2500", "32" };
                long[] minimums = new long[] { 1, 1, 1 };
                long[] maximums = new long[] { 60, 10000, 64 };
                for (int i = 0; i < keys.Length; i++)
                {
                    ClusterSettingDefinition definition = Assert.NotNull(settings.Definitions.FirstOrDefault(d => d.Key == keys[i]), keys[i] + " is registered");
                    Assert.True(definition.DefaultValue == defaults[i] && definition.Minimum == minimums[i] && definition.Maximum == maximums[i], keys[i] + " default and bounds: " + Serializer.Serialize(definition));
                    foreach (long outside in new[] { minimums[i] - 1, maximums[i] + 1 })
                    {
                        bool refused = false;
                        try
                        {
                            await settings.SetAsync(keys[i], outside.ToString(System.Globalization.CultureInfo.InvariantCulture), "test", token).ConfigureAwait(false);
                        }
                        catch (Garrison.Core.Services.ValidationException)
                        {
                            refused = true;
                        }
                        Assert.True(refused, keys[i] + " refuses " + outside);
                    }
                }
                Assert.True(scheduler.Options.SchedulerSweepSeconds == 5 && scheduler.Options.MaxDueClaimsPerSweep == 2500 && scheduler.Options.SchedulerSweepConcurrency == 32, "Refused values leave the defaults in place");

                Agent agent = await cluster.CreateAgentAsync("sweep-keeper", "builtin/fake", null, token).ConfigureAwait(false);
                int round = 0;
                foreach (string concurrency in new[] { "1", "16" })
                {
                    round++;
                    await settings.SetAsync("Autonomy.SchedulerSweepConcurrency", concurrency, "test", token).ConfigureAwait(false);
                    Assert.Equal(Int32.Parse(concurrency, System.Globalization.CultureInfo.InvariantCulture), scheduler.Options.SchedulerSweepConcurrency, "SchedulerSweepConcurrency applies live");
                    List<string> ids = new List<string>();
                    for (int i = 0; i < 6; i++)
                    {
                        Mandate created = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("sweep-" + round + "-" + i, agent, Revision("Sweep keeper " + i + ".")), 201, token).ConfigureAwait(false);
                        ids.Add(created.Id);
                    }
                    Assert.True(await scheduler.SweepAsync(DateTime.UtcNow.AddSeconds(2), token).ConfigureAwait(false), "The sweep starts ticks with concurrency " + concurrency);
                    foreach (string id in ids)
                    {
                        List<MandateTick> ticks = await TicksOfAsync(host, id, token).ConfigureAwait(false);
                        Assert.True(ticks.Count == 1 && ticks[0].RunId != null, "Mandate " + id + " has one tick with a run at concurrency " + concurrency + ": " + Serializer.Serialize(ticks));
                    }
                    await WaitIdleAsync(host, ids, token).ConfigureAwait(false);
                }

                // The claim batch bounds one sweep: with 2 per sweep, 5 due mandates need three sweeps.
                await settings.SetAsync("Autonomy.MaxDueClaimsPerSweep", "2", "test", token).ConfigureAwait(false);
                Assert.Equal(2, scheduler.Options.MaxDueClaimsPerSweep, "MaxDueClaimsPerSweep applies live");
                List<string> batch = new List<string>();
                for (int i = 0; i < 5; i++)
                {
                    Mandate created = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("batch-" + i, agent, Revision("Batch keeper " + i + ".")), 201, token).ConfigureAwait(false);
                    batch.Add(created.Id);
                }
                DateTime at = DateTime.UtcNow.AddSeconds(2);
                int[] expected = new[] { 2, 4, 5 };
                for (int sweep = 0; sweep < expected.Length; sweep++)
                {
                    await scheduler.SweepAsync(at, token).ConfigureAwait(false);
                    int ticked = 0;
                    foreach (string id in batch) ticked += (await TicksOfAsync(host, id, token).ConfigureAwait(false)).Count;
                    Assert.Equal(expected[sweep], ticked, "Ticks after sweep " + (sweep + 1) + " with MaxDueClaimsPerSweep 2");
                }
            }
        }

        private static async Task WaitIdleAsync(TestServerHost host, List<string> mandateIds, CancellationToken token)
        {
            // Wait for the ticks to finish so the next round's sweep sees only its own due mandates.
            DateTime deadline = DateTime.UtcNow.AddSeconds(60);
            while (DateTime.UtcNow < deadline)
            {
                bool busy = false;
                foreach (string id in mandateIds)
                {
                    Mandate? mandate = await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, id, token).ConfigureAwait(false);
                    if (mandate != null && !String.IsNullOrEmpty(mandate.ActiveTickId)) busy = true;
                }
                if (!busy) return;
                await Task.Delay(200, token).ConfigureAwait(false);
            }
            throw new TimeoutException("The ticks of " + mandateIds.Count + " mandates did not finish within 60 seconds.");
        }

        private static async Task ReplicasAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 3, Garrison.Server.Backplane.BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                foreach (TestServerHost replica in cluster.Replicas) replica.Server.Context.Get<MaintenanceService>().Keepers = null;
                TestServerHost host = cluster.Replicas[0];
                Agent agent = await cluster.CreateAgentAsync(0, "crowd-keeper", null, token).ConfigureAwait(false);
                for (int i = 0; i < 50; i++)
                {
                    await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("crowd-" + i, agent, Revision("Keeper " + i + ".")), 201, token).ConfigureAwait(false);
                }
                DateTime now = DateTime.UtcNow.AddSeconds(2);
                await Task.WhenAll(cluster.Replicas.Select(r => r.Server.Context.Get<KeeperScheduler>().SweepAsync(now, token))).ConfigureAwait(false);
                await Task.WhenAll(cluster.Replicas.Select(r => r.Server.Context.Get<KeeperScheduler>().SweepAsync(now, token))).ConfigureAwait(false);

                EnumerationResult<Mandate> all = await host.Server.Context.Database.Mandates.EnumerateAsync(host.TenantId, null, null, null, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false);
                Assert.Equal(50, all.Objects.Count, "Fifty mandates");
                int ticks = 0;
                foreach (Mandate mandate in all.Objects)
                {
                    EnumerationResult<MandateTick> page = await host.Server.Context.Database.MandateTicks.EnumerateAsync(host.TenantId, mandate.Id, null, new EnumerationQuery(), token).ConfigureAwait(false);
                    Assert.True(page.Objects.Count == 1 && page.Objects[0].RunId != null && mandate.TickCount == 1, "Mandate " + mandate.Name + " has exactly one tick with a run: " + Serializer.Serialize(page.Objects));
                    ticks += page.Objects.Count;
                }
                Assert.Equal(50, ticks, "Exactly 50 ticks across three replicas");
                EnumerationResult<Run> runs = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(host.AdminClient, HttpMethod.Get, T(host) + "/runs?maxResults=1000", null, 200, token).ConfigureAwait(false);
                Assert.Equal(50, runs.Objects.Count(r => r.Kind == RunKindEnum.Keeper), "Exactly 50 keeper runs");
            }
        }

        private static string MandateYaml(string name, string agent, string objective, bool paused)
        {
            List<string> lines = new List<string>
            {
                "apiVersion: garrison/v1",
                "kind: Mandate",
                "metadata:",
                "  name: " + name,
                "spec:",
                "  description: Keeps the pond",
                "  agent: " + agent,
                "  deployment: " + agent + "-default",
                "  revision:",
                "    objective: " + objective,
                "    healthyDefinition: No ripples.",
                "    wakeMode: Backoff",
                "    minIntervalSeconds: 120",
                "    maxIntervalSeconds: 3600",
                "    jitterPercent: 0",
                "    signals:",
                "      - name: ripples",
                "        description: Count ripples."
            };
            if (paused) lines.Insert(8, "  paused: true");
            return String.Join("\n", lines);
        }

        private static async Task ManifestsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                await cluster.CreateAgentAsync("manifest-keeper", "builtin/fake", null, token).ConfigureAwait(false);
                await cluster.CreateAgentAsync("manifest-other", "builtin/fake", null, token).ConfigureAwait(false);
                string yaml = MandateYaml("pond-manifest", "manifest-keeper", "Keep the pond calm.", false);

                ManifestApply dry = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply?dryRun=true", yaml, 200, token).ConfigureAwait(false);
                Assert.True(dry.CreatedCount == 1 && dry.FailedCount == 0, "Dry run plans one creation: " + Serializer.Serialize(dry));
                Assert.True(await host.Server.Context.Database.Mandates.ReadByNameAsync(host.TenantId, "pond-manifest", token).ConfigureAwait(false) == null, "A dry run writes nothing");
                ManifestApply applied = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply", yaml, 200, token).ConfigureAwait(false);
                Assert.True(applied.CreatedCount == 1, "Apply creates the mandate: " + Serializer.Serialize(applied));
                Mandate created = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/pond-manifest", null, 200, token).ConfigureAwait(false);
                Assert.True(created.Status == MandateStatusEnum.Active && created.CurrentRevisionNumber == 1 && created.NextWakeUtc.HasValue && created.RunAsType == PrincipalTypeEnum.Administrator, "Active with revision 1: " + Serializer.Serialize(created));
                Assert.True(created.CurrentRevision != null && created.CurrentRevision.Objective == "Keep the pond calm." && created.CurrentRevision.MinIntervalSeconds == 120 && created.CurrentRevision.Signals.Count == 1 && created.CurrentRevision.Source == MandateRevisionSourceEnum.Human, "Revision from the manifest");

                ManifestApply again = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply", yaml, 200, token).ConfigureAwait(false);
                Assert.True(again.UnchangedCount == 1 && again.UpdatedCount == 0, "Re-applying changes nothing: " + Serializer.Serialize(again));
                Mandate unchanged = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/pond-manifest", null, 200, token).ConfigureAwait(false);
                Assert.True(unchanged.CurrentRevisionNumber == 1, "No new revision for an unchanged document");

                ManifestApply revised = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply", MandateYaml("pond-manifest", "manifest-keeper", "Keep the pond calm and clear.", false), 200, token).ConfigureAwait(false);
                Assert.True(revised.UpdatedCount == 1 && revised.Items.Any(i => i.Changes.Any(c => c.Field.StartsWith("revision", StringComparison.Ordinal))), "A new objective is an update with a revision diff: " + Serializer.Serialize(revised));
                Mandate second = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/pond-manifest", null, 200, token).ConfigureAwait(false);
                Assert.True(second.CurrentRevisionNumber == 2 && second.CurrentRevision!.Objective == "Keep the pond calm and clear.", "The changed revision was published as revision 2");

                ManifestApply paused = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply", MandateYaml("pond-manifest", "manifest-keeper", "Keep the pond calm and clear.", true), 200, token).ConfigureAwait(false);
                Assert.True(paused.UpdatedCount == 1, "Pausing through a manifest is an update");
                Mandate pausedNow = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/pond-manifest", null, 200, token).ConfigureAwait(false);
                Assert.True(pausedNow.Status == MandateStatusEnum.Paused && !pausedNow.NextWakeUtc.HasValue && pausedNow.CurrentRevisionNumber == 2, "Paused without a new revision: " + Serializer.Serialize(pausedNow));

                TestResponse moved = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply", MandateYaml("pond-manifest", "manifest-other", "Keep the pond calm and clear.", true), token).ConfigureAwait(false);
                Assert.True(moved.StatusCode == 400 && moved.Body.Contains("spec.agent", StringComparison.Ordinal), "The agent cannot change through a manifest: " + moved.Body);
                TestResponse noRevision = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply", String.Join("\n", "apiVersion: garrison/v1", "kind: Mandate", "metadata:", "  name: bare", "spec:", "  agent: manifest-keeper", "  deployment: manifest-keeper-default"), token).ConfigureAwait(false);
                Assert.True(noRevision.StatusCode == 400 && noRevision.Body.Contains("spec.revision", StringComparison.Ordinal), "A mandate document needs a revision: " + noRevision.Body);

                TestResponse export = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/manifests/export", null, token).ConfigureAwait(false);
                Assert.True(export.StatusCode == 200 && export.Body.Contains("kind: Mandate", StringComparison.Ordinal) && export.Body.Contains("Keep the pond calm and clear.", StringComparison.Ordinal) && export.Body.Contains("paused: true", StringComparison.Ordinal), "Export carries the mandate: " + export.Body);

                using (HttpClient person = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
                {
                    StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(person, HttpMethod.Post, T(host) + "/studio/drafts", new StudioDraftCreateRequest { Title = "Keeper draft" }, 201, token).ConfigureAwait(false);
                    StudioDraft withItem = await HttpTestHelpers.SendAsync<StudioDraft>(person, HttpMethod.Put, T(host) + "/studio/drafts/" + draft.Id + "/items/Mandate/drafted-keeper", new StudioDraftItemRequest { Version = draft.Version, Document = MandateYaml("drafted-keeper", "manifest-keeper", "Drafted by the architect.", false) }, 200, token).ConfigureAwait(false);
                    Assert.True(withItem.Items.Any(i => i.Kind == "Mandate" && i.Name == "drafted-keeper"), "A draft holds a Mandate item");
                    StudioDraftDiff diff = await HttpTestHelpers.SendAsync<StudioDraftDiff>(person, HttpMethod.Get, T(host) + "/studio/drafts/" + draft.Id + "/diff", null, 200, token).ConfigureAwait(false);
                    Assert.True(diff.Valid && diff.Items.Any(i => i.Kind == "Mandate" && i.Change == "Create"), "The draft's mandate validates as a creation: " + Serializer.Serialize(diff));
                }
            }
        }

        private static async Task ChannelAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                host.Server.Context.Get<MaintenanceService>().Keepers = null;
                KeeperScheduler scheduler = host.Server.Context.Get<KeeperScheduler>();
                Agent agent = await cluster.CreateAgentAsync("live-keeper", "builtin/fake", null, token).ConfigureAwait(false);
                Mandate mandate = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", Body("live", agent, Revision("Stream my ticks.")), 201, token).ConfigureAwait(false);
                using (ClientWebSocket socket = new ClientWebSocket())
                {
                    string bearer;
                    using (HttpClient login = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
                    {
                        bearer = login.DefaultRequestHeaders.Authorization!.Parameter!;
                    }
                    await socket.ConnectAsync(new Uri(host.BaseUrl.Replace("http://", "ws://", StringComparison.Ordinal) + "/v1.0/ws?token=" + Uri.EscapeDataString(bearer)), token).ConfigureAwait(false);
                    await socket.SendAsync(Encoding.UTF8.GetBytes("{\"type\":\"subscribe\",\"channel\":\"mandate:" + mandate.Id + "\"}"), WebSocketMessageType.Text, true, token).ConfigureAwait(false);
                    await Task.Delay(2500, token).ConfigureAwait(false);

                    // No worker runs it, so the tick stays in flight until its run is cancelled.
                    await scheduler.SweepAsync(DateTime.UtcNow.AddSeconds(1), token).ConfigureAwait(false);
                    string started = await ReceiveUntilAsync(socket, "tick.started", mandate.Id, token).ConfigureAwait(false);
                    MandateTick tick = (await TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false)).Single();
                    Assert.True(started.Contains(tick.Id, StringComparison.Ordinal) && started.Contains(tick.RunId!, StringComparison.Ordinal), "tick.started names the tick and its run: " + started);
                    await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/runs/" + tick.RunId + "/cancel", null, token).ConfigureAwait(false);
                    await scheduler.SweepAsync(DateTime.UtcNow.AddSeconds(2), token).ConfigureAwait(false);
                    string completed = await ReceiveUntilAsync(socket, "tick.completed", tick.Id, token).ConfigureAwait(false);
                    Assert.True(completed.Contains("\"outcome\":\"Unreported\"", StringComparison.Ordinal) && completed.Contains("nextWakeUtc", StringComparison.Ordinal), "tick.completed carries the outcome and next wake: " + completed);
                }
                using (ClientWebSocket outsider = new ClientWebSocket())
                {
                    await UserAsync(host, "live-viewer@example.com", "Viewer", token).ConfigureAwait(false);
                    string viewerBearer;
                    using (HttpClient login = await host.UserClientAsync("live-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                    {
                        viewerBearer = login.DefaultRequestHeaders.Authorization!.Parameter!;
                    }
                    await outsider.ConnectAsync(new Uri(host.BaseUrl.Replace("http://", "ws://", StringComparison.Ordinal) + "/v1.0/ws?token=" + Uri.EscapeDataString(viewerBearer)), token).ConfigureAwait(false);
                    await outsider.SendAsync(Encoding.UTF8.GetBytes("{\"type\":\"subscribe\",\"channel\":\"mandate:mdt_missing\"}"), WebSocketMessageType.Text, true, token).ConfigureAwait(false);
                    string refused = await ReceiveUntilAsync(outsider, "error", "Mandate not found", token).ConfigureAwait(false);
                    Assert.True(refused.Length > 0, "An unknown mandate channel is refused");
                }
            }
        }

        /// <summary>
        /// Receive WebSocket messages until one contains both texts.
        /// </summary>
        internal static async Task<string> ReceiveUntilAsync(ClientWebSocket socket, string type, string contains, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(15);
            byte[] buffer = new byte[262144];
            while (DateTime.UtcNow < deadline)
            {
                using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    timeout.CancelAfter(TimeSpan.FromSeconds(5));
                    using (System.IO.MemoryStream message = new System.IO.MemoryStream())
                    {
                        WebSocketReceiveResult result;
                        do
                        {
                            result = await socket.ReceiveAsync(buffer, timeout.Token).ConfigureAwait(false);
                            message.Write(buffer, 0, result.Count);
                        }
                        while (!result.EndOfMessage);
                        string text = Encoding.UTF8.GetString(message.ToArray());
                        if (text.Contains(type, StringComparison.Ordinal) && text.Contains(contains, StringComparison.Ordinal)) return text;
                    }
                }
            }
            throw new TestAssertionException("No " + type + " message containing " + contains + " within 15 seconds.");
        }

        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            using (TestMcpClient client = new TestMcpClient())
            {
                TestServerHost host = cluster.Server;
                await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                List<string> management = new List<string> { "garrison_list_mandates", "garrison_get_mandate", "garrison_create_mandate", "garrison_update_mandate", "garrison_publish_mandate_revision", "garrison_pause_mandate", "garrison_resume_mandate", "garrison_wake_mandate", "garrison_list_mandate_ticks" };
                ProviderToolPage listed = await client.ToolsAsync(token).ConfigureAwait(false);
                foreach (string name in management)
                {
                    McpToolDefinition? tool = McpToolCatalog.All().FirstOrDefault(t => t.Name == name);
                    Assert.True(tool != null && tool.UserOnly && tool.ManagementTool, name + " is a management tool");
                    Assert.True(host.Server.Context.Scopes.Find("MCP", name) != null, name + " scope is registered");
                    Assert.True(listed.Tools.Any(t => t.Name == name), "Administrator sees " + name);
                }
                Assert.True(!listed.Tools.Any(t => t.Name.StartsWith("garrison_keeper_", StringComparison.Ordinal)), "Keeper tools are hidden from people");
                await client.ExpectErrorAsync("garrison_keeper_context", new { }, "Forbidden", token).ConfigureAwait(false);

                Agent agent = await cluster.CreateAgentAsync("mcp-keeper", "builtin/fake", null, token).ConfigureAwait(false);
                Mandate created = await client.CallAsync<Mandate>("garrison_create_mandate", new { configuration = new Mandate { Name = "mcp-mandate", AgentId = agent.Name, DeploymentId = "mcp-keeper-default" } }, token).ConfigureAwait(false);
                Assert.True(created.Status == MandateStatusEnum.Draft && created.AgentId == agent.Id, "Create through MCP");
                await client.ExpectErrorAsync("garrison_create_mandate", new { configuration = new Mandate { Name = "mcp-mandate", AgentId = agent.Id, DeploymentId = "mcp-keeper-default" } }, "NameConflict", token).ConfigureAwait(false);
                Mandate published = await client.CallAsync<Mandate>("garrison_publish_mandate_revision", new { mandate = "mcp-mandate", revision = Revision("Keep MCP tidy.") }, token).ConfigureAwait(false);
                Assert.True(published.Status == MandateStatusEnum.Active && published.CurrentRevisionNumber == 1, "Publish through MCP");
                Mandate paused = await client.CallAsync<Mandate>("garrison_pause_mandate", new { mandate = created.Id }, token).ConfigureAwait(false);
                Assert.Equal(MandateStatusEnum.Paused, paused.Status, "Pause through MCP");
                Mandate resumed = await client.CallAsync<Mandate>("garrison_resume_mandate", new { mandate = created.Id }, token).ConfigureAwait(false);
                Assert.Equal(MandateStatusEnum.Active, resumed.Status, "Resume through MCP");
                Mandate woken = await client.CallAsync<Mandate>("garrison_wake_mandate", new { mandate = created.Name }, token).ConfigureAwait(false);
                Assert.True(woken.NextWakeUtc.HasValue, "Wake through MCP");
                EnumerationResult<Mandate> list = await client.CallAsync<EnumerationResult<Mandate>>("garrison_list_mandates", new { status = "Active" }, token).ConfigureAwait(false);
                Assert.True(list.Objects.Any(m => m.Id == created.Id), "List through MCP");
                await client.ExpectErrorAsync("garrison_list_mandates", new { status = "Sleepy" }, "ValidationFailed", token).ConfigureAwait(false);
                Mandate read = await client.CallAsync<Mandate>("garrison_get_mandate", new { mandate = created.Name }, token).ConfigureAwait(false);
                Assert.True(read.CurrentRevision != null && read.CurrentRevision.Objective == "Keep MCP tidy.", "Get through MCP includes the current revision");

                // A keeper run sees the keeper tools and its own mandate; another run does not.
                await host.Server.Context.Get<KeeperScheduler>().SweepAsync(DateTime.UtcNow.AddSeconds(1), token).ConfigureAwait(false);
                MandateTick tick = (await host.Server.Context.Database.MandateTicks.EnumerateAsync(host.TenantId, created.Id, null, new EnumerationQuery(), token).ConfigureAwait(false)).Objects.First();
                EnumerationResult<MandateTick> ticks = await client.CallAsync<EnumerationResult<MandateTick>>("garrison_list_mandate_ticks", new { mandate = created.Id }, token).ConfigureAwait(false);
                Assert.True(ticks.Objects.Any(t => t.Id == tick.Id), "Ticks through MCP");
                Run keeperRun = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, DeploymentId = created.DeploymentId, Kind = RunKindEnum.Keeper, MandateId = created.Id, MandateTickId = tick.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
                string keeperBearer = await host.Server.Context.Authentication.IssueForRunAsync(keeperRun, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (TestMcpClient keeper = new TestMcpClient())
                {
                    await keeper.ConnectAsync(host, keeperBearer, token).ConfigureAwait(false);
                    ProviderToolPage keeperTools = await keeper.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(keeperTools.Tools.Any(t => t.Name == "garrison_keeper_context") && keeperTools.Tools.Any(t => t.Name == "garrison_keeper_complete_tick"), "A keeper run sees the keeper tools");
                    Assert.True(!keeperTools.Tools.Any(t => t.Name == "garrison_list_mandates"), "A keeper run does not see management tools");
                    McpKeeperContext context = await keeper.CallAsync<McpKeeperContext>("garrison_keeper_context", new { recentTicks = 5 }, token).ConfigureAwait(false);
                    Assert.True(context.Mandate.Id == created.Id && context.Tick.Id == tick.Id && context.Mandate.CurrentRevision != null, "The keeper reads its own mandate and tick");
                    bool refused = false;
                    try
                    {
                        await keeper.CallAsync("garrison_keeper_complete_tick", new { outcome = "Failed" }, token).ConfigureAwait(false);
                    }
                    catch (Exception)
                    {
                        refused = true;
                    }
                    Assert.True(refused, "A keeper cannot report Failed; the scheduler records it");
                    await keeper.ExpectErrorAsync("garrison_list_mandates", new { }, "Forbidden", token).ConfigureAwait(false);
                    McpKeeperTickResult reported = await keeper.CallAsync<McpKeeperTickResult>("garrison_keeper_complete_tick", new { outcome = "Acted", summary = "tidied", nextWakeSeconds = 90 }, token).ConfigureAwait(false);
                    Assert.True(reported.Accepted && reported.Outcome == "Acted", "The keeper reports");
                    McpKeeperTickResult repeated = await keeper.CallAsync<McpKeeperTickResult>("garrison_keeper_complete_tick", new { outcome = "Quiet" }, token).ConfigureAwait(false);
                    Assert.True(!repeated.Accepted && repeated.Outcome == "Acted", "A repeated report changes nothing");
                }
                Run plainRun = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, DeploymentId = created.DeploymentId, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
                string plainBearer = await host.Server.Context.Authentication.IssueForRunAsync(plainRun, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (TestMcpClient plain = new TestMcpClient())
                {
                    await plain.ConnectAsync(host, plainBearer, token).ConfigureAwait(false);
                    ProviderToolPage plainTools = await plain.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(!plainTools.Tools.Any(t => t.Name.StartsWith("garrison_keeper_", StringComparison.Ordinal)), "Other runs do not see keeper tools");
                    await plain.ExpectErrorAsync("garrison_keeper_complete_tick", new { outcome = "Quiet" }, "Forbidden", token).ConfigureAwait(false);
                }
            }
        }

        /// <summary>
        /// Create a user with one role in the host tenant.
        /// </summary>
        internal static async Task<User> UserAsync(TestServerHost host, string email, string role, CancellationToken token)
        {
            User user = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = email, Password = "password123" }, 201, token).ConfigureAwait(false);
            await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = user.Id, RoleName = role }, 201, token).ConfigureAwait(false);
            return user;
        }

        #endregion
    }
}
