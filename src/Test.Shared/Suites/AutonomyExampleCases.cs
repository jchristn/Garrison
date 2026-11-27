namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// The autonomy examples (AA12.1, AA12.2) for <see cref="ExamplesSuite"/>: the gerbil keeper and the site-reliability
    /// organization from examples/autonomous, applied as they are and played on the scripted fake harness. The suite
    /// drives the keeper scheduler itself so every tick happens when the case asks for it.
    /// </summary>
    internal static class AutonomyExampleCases
    {
        #region Internal-Methods

        /// <summary>
        /// Walkthrough 11.1: the gerbil applies and re-applies unchanged; its ticks go Quiet with memory, Attention on the
        /// first 503, Escalated on the second, and the on-call answer wakes it to record the instruction.
        /// </summary>
        /// <param name="provider">Database provider.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        internal static async Task GerbilAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            string root = MemoryRoot();
            try
            {
                await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, s => EnableMemory(s, root), token).ConfigureAwait(false))
                {
                    TestServerHost host = cluster.Server;
                    host.Server.Context.Get<MaintenanceService>().Keepers = null;
                    KeeperScheduler scheduler = host.Server.Context.Get<KeeperScheduler>();

                    string bundle = Bundle("gerbil/gerbil.yaml", "gerbil/fake-harness.yaml", "gerbil/scenarios/healthy.yaml");
                    ManifestApply first = await ExamplesSuite.ApplyAsync(host, bundle, token).ConfigureAwait(false);
                    Assert.Equal(first.DocumentCount, first.CreatedCount, "Everything is created");
                    ManifestApply again = await ExamplesSuite.ApplyAsync(host, bundle, token).ConfigureAwait(false);
                    Assert.Equal(again.DocumentCount, again.UnchangedCount, "Re-applying changes nothing: " + Changed(again));
                    Mandate mandate = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/gerbil-keeper", null, 200, token).ConfigureAwait(false);
                    Assert.True(mandate.Status == MandateStatusEnum.Active && mandate.CurrentRevision != null && mandate.CurrentRevision.MinIntervalSeconds == 900 && mandate.CurrentRevision.MaxIntervalSeconds == 14400, "The gerbil keeps a 15 minute to 4 hour mandate: " + Serializer.Serialize(mandate));

                    // Healthy: memory of what it saw, then Quiet, so the interval doubles.
                    MandateTick healthy = await TickAsync(host, scheduler, mandate.Id, token).ConfigureAwait(false);
                    Assert.True(healthy.Outcome == TickOutcomeEnum.Quiet, "The first tick is Quiet: " + Serializer.Serialize(healthy));
                    Mandate backedOff = await MandateAsync(host, mandate.Id, token).ConfigureAwait(false);
                    Assert.Equal(1800, backedOff.CurrentIntervalSeconds, "A quiet tick doubles the interval");
                    MemoryEntry seen = await MemoryEntryAsync(host, backedOff.AgentId, "last-seen-healthy", token).ConfigureAwait(false);
                    Assert.True(seen.WriterRunId == healthy.RunId && seen.Tags.Contains("recall"), "The tick remembered what it saw, tagged recall: " + Serializer.Serialize(seen));

                    // The page answers 503: Attention, and the interval snaps back. The tick input carried yesterday's memory.
                    await ExamplesSuite.ApplyAsync(host, Bundle("gerbil/scenarios/down.yaml"), token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + mandate.Id + "/wake", null, 202, token).ConfigureAwait(false);
                    MandateTick down = await TickAsync(host, scheduler, mandate.Id, token).ConfigureAwait(false);
                    Assert.True(down.Outcome == TickOutcomeEnum.Attention, "The first 503 needs attention: " + Serializer.Serialize(down));
                    Assert.Equal(900, (await MandateAsync(host, mandate.Id, token).ConfigureAwait(false)).CurrentIntervalSeconds, "Attention resets the interval to the minimum");
                    string downInput = await InputAsync(host, down, token).ConfigureAwait(false);
                    Assert.True(downInput.Contains("last-seen-healthy", StringComparison.Ordinal) && downInput.Contains("HTTP 200 in 0.14 s", StringComparison.Ordinal), "The tick recalls what the gerbil saw last time: " + downInput);

                    // Still down: a non-blocking escalation to the on-call role, and the tick ends Escalated.
                    await ExamplesSuite.ApplyAsync(host, Bundle("gerbil/scenarios/still-down.yaml"), token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + mandate.Id + "/wake", null, 202, token).ConfigureAwait(false);
                    MandateTick escalated = await TickAsync(host, scheduler, mandate.Id, token).ConfigureAwait(false);
                    Assert.True(escalated.Outcome == TickOutcomeEnum.Escalated, "Down twice in a row escalates: " + Serializer.Serialize(escalated));
                    EnumerationResult<Escalation> raised = await HttpTestHelpers.SendAsync<EnumerationResult<Escalation>>(host.AdminClient, HttpMethod.Get, T(host) + "/escalations?mandateId=" + mandate.Id, null, 200, token).ConfigureAwait(false);
                    Escalation question = raised.Objects.Single();
                    Assert.True(question.Status == EscalationStatusEnum.Open && question.Mode == EscalationModeEnum.NonBlocking && question.Severity == EscalationSeverityEnum.Urgent
                        && question.TargetKind == EscalationTargetKindEnum.Role && question.TargetName == "AgentOperator" && question.MandateTickId == escalated.Id
                        && question.Options.Select(o => o.Key).SequenceEqual(new[] { "restart", "wait", "ignore" }) && question.Question.Contains("last healthy 01:52", StringComparison.Ordinal),
                        "The keeper asks the on-call role: " + Serializer.Serialize(question));

                    // The answer wakes the keeper, which records the instruction and keeps watching.
                    await ExamplesSuite.ApplyAsync(host, Bundle("gerbil/scenarios/answered.yaml"), token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<Escalation>(host.AdminClient, HttpMethod.Post, T(host) + "/escalations/" + question.Id + "/answer", new EscalationAnswerRequest { Choice = "wait", Text = "The provider is on it. Keep watching." }, 200, token).ConfigureAwait(false);
                    Assert.Equal(WakeSourceEnum.EscalationAnswer, (await MandateAsync(host, mandate.Id, token).ConfigureAwait(false)).PendingWakeSource, "The answer wakes the keeper");
                    MandateTick answered = await TickAsync(host, scheduler, mandate.Id, token).ConfigureAwait(false);
                    Assert.True(answered.WakeSource == WakeSourceEnum.EscalationAnswer && answered.Outcome == TickOutcomeEnum.Acted, "The answer's tick records it: " + Serializer.Serialize(answered));
                    string answeredInput = await InputAsync(host, answered, token).ConfigureAwait(false);
                    Assert.True(answeredInput.Contains("Decision: wait", StringComparison.Ordinal) && answeredInput.Contains("Keep watching.", StringComparison.Ordinal), "The tick input carries the answer: " + answeredInput);
                    MemoryEntry instruction = await MemoryEntryAsync(host, backedOff.AgentId, "on-call-instruction", token).ConfigureAwait(false);
                    Assert.Equal(answered.RunId ?? String.Empty, instruction.WriterRunId ?? String.Empty, "The instruction is in memory for the next tick");
                    Assert.Equal(4, (await KeeperSuite.TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false)).Count, "Four ticks, one per scenario");
                }
            }
            finally
            {
                DeleteRoot(root);
            }
        }

        /// <summary>
        /// Walkthrough 11.2: the site-reliability organization applies with its eval set and change rules; one round of
        /// scripted ticks sends a message along the peer line, delivers it, reports upward, briefs the board, and
        /// escalates; the lead's driver-upgrade proposal waits for the gate, passes the approved eval set, and the rule
        /// applies it as an organization revision.
        /// </summary>
        /// <param name="provider">Database provider.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        internal static async Task SiteReliabilityAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            string root = MemoryRoot();
            try
            {
                await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, s => EnableMemory(s, root), token).ConfigureAwait(false))
                {
                    TestServerHost host = cluster.Server;
                    host.Server.Context.Get<MaintenanceService>().Keepers = null;
                    KeeperScheduler scheduler = host.Server.Context.Get<KeeperScheduler>();

                    string bundle = Bundle("site-reliability-org/org.yaml", "site-reliability-org/fake-harness.yaml");
                    ManifestApply first = await ExamplesSuite.ApplyAsync(host, bundle, token).ConfigureAwait(false);
                    Assert.Equal(first.DocumentCount, first.CreatedCount, "Everything is created");
                    ManifestApply again = await ExamplesSuite.ApplyAsync(host, bundle, token).ConfigureAwait(false);
                    Assert.Equal(again.DocumentCount, again.UnchangedCount, "Re-applying changes nothing: " + Changed(again));
                    string[] mandates = new[] { "reliability-lead-brief", "uptime-watch", "latency-watch", "dependency-watch", "memory-curation" };
                    foreach (string name in mandates)
                    {
                        await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + name + "/pause", null, 200, token).ConfigureAwait(false);
                    }

                    OrganizationService organizations = host.Server.Context.Get<OrganizationService>();
                    Organization org = Assert.NotNull(await organizations.FindAsync(host.TenantId, "site-reliability-org", token).ConfigureAwait(false), "The organization");
                    Assert.True(org.CurrentRevisionId != null, "The apply published the organization");
                    OrgUnit dependencies = Assert.NotNull(await organizations.FindUnitAsync(org, "dependencies", token).ConfigureAwait(false), "The dependencies unit");

                    // The approved eval set and the change rules, which manifests cannot carry yet.
                    EvalSetRequest setBody = Assert.NotNull(Serializer.Deserialize<EvalSetRequest>(Read("site-reliability-org/eval-set.json")), "eval-set.json");
                    EvalSet set = await HttpTestHelpers.SendAsync<EvalSet>(host.AdminClient, HttpMethod.Post, T(host) + "/eval-sets", setBody, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<EvalSet>(host.AdminClient, HttpMethod.Post, T(host) + "/eval-sets/" + set.Id + "/approve", null, 200, token).ConfigureAwait(false);
                    List<ChangeRule> ruleBodies = Assert.NotNull(Serializer.Deserialize<List<ChangeRule>>(Read("site-reliability-org/change-rules.json")), "change-rules.json");
                    List<ChangeRule> rules = new List<ChangeRule>();
                    foreach (ChangeRule body in ruleBodies)
                    {
                        rules.Add(await HttpTestHelpers.SendAsync<ChangeRule>(host.AdminClient, HttpMethod.Post, T(host) + "/change-rules", body, 201, token).ConfigureAwait(false));
                    }
                    ChangeRule hires = rules.Single(r => r.GateEvalSet == set.Name);
                    Assert.True(hires.OrganizationId == org.Id && hires.UnitId == dependencies.Id, "Rules name the organization and unit by name: " + Serializer.Serialize(hires));

                    // Message: the latency keeper hands the database problem to the dependency keeper along the peer line.
                    MandateTick latency = await ResumeAndTickAsync(host, scheduler, "latency-watch", token).ConfigureAwait(false);
                    Assert.True(latency.Outcome == TickOutcomeEnum.Attention, "The latency keeper needs attention: " + Serializer.Serialize(latency));
                    AgentMessage sent = (await HttpTestHelpers.SendAsync<EnumerationResult<AgentMessage>>(host.AdminClient, HttpMethod.Get, T(host) + "/messages?sender=latency-keeper", null, 200, token).ConfigureAwait(false)).Objects.Single();
                    Assert.True(sent.RecipientAgentName == "dependency-keeper" && sent.Urgency == MessageUrgencyEnum.Urgent && sent.Status == MessageStatusEnum.Queued && sent.SenderRunId == latency.RunId,
                        "An urgent message along the peer line waits for the paused dependency keeper: " + Serializer.Serialize(sent));

                    // Report: the dependency keeper reads it on its tick and reports the outdated driver upward as Degraded.
                    MandateTick dependency = await ResumeAndTickAsync(host, scheduler, "dependency-watch", token).ConfigureAwait(false);
                    Assert.True(dependency.Outcome == TickOutcomeEnum.Acted, "The dependency keeper acted: " + Serializer.Serialize(dependency));
                    AgentMessage delivered = await HttpTestHelpers.SendAsync<AgentMessage>(host.AdminClient, HttpMethod.Get, T(host) + "/messages/" + sent.Id, null, 200, token).ConfigureAwait(false);
                    Assert.True(delivered.Status == MessageStatusEnum.Delivered && delivered.DeliveredRunId == dependency.RunId, "The tick carried the message: " + Serializer.Serialize(delivered));
                    Assert.True((await InputAsync(host, dependency, token).ConfigureAwait(false)).Contains("Checkout p95 rising", StringComparison.Ordinal), "The message is in the tick input");
                    Report driver = (await HttpTestHelpers.SendAsync<EnumerationResult<Report>>(host.AdminClient, HttpMethod.Get, T(host) + "/reports?author=dependency-keeper", null, 200, token).ConfigureAwait(false)).Objects.Single();
                    Assert.True(driver.Health == ReportHealthEnum.Degraded && driver.Kind == ReportKindEnum.Incident && driver.OrgUnitId == dependencies.Id && driver.MandateTickId == dependency.Id,
                        "The report is stamped with the dependencies unit: " + Serializer.Serialize(driver));

                    // The lead reads both reports at its tick and briefs the board.
                    MandateTick lead = await ResumeAndTickAsync(host, scheduler, "reliability-lead-brief", token).ConfigureAwait(false);
                    Assert.True(lead.Outcome == TickOutcomeEnum.Acted, "The lead's tick: " + Serializer.Serialize(lead));
                    string leadInput = await InputAsync(host, lead, token).ConfigureAwait(false);
                    Assert.True(leadInput.Contains("Outdated database driver", StringComparison.Ordinal) && leadInput.Contains("Checkout latency rising", StringComparison.Ordinal), "Both reports reach the lead: " + leadInput);
                    Report brief = (await HttpTestHelpers.SendAsync<EnumerationResult<Report>>(host.AdminClient, HttpMethod.Get, T(host) + "/reports?author=reliability-lead&kind=Brief", null, 200, token).ConfigureAwait(false)).Objects.Single();
                    Assert.True(brief.Audience == ReportAudienceEnum.Board, "The brief is for the board: " + Serializer.Serialize(brief));

                    // Escalation: the uptime keeper asks the on-call role before a failover; the answer wakes it.
                    MandateTick uptime = await ResumeAndTickAsync(host, scheduler, "uptime-watch", token).ConfigureAwait(false);
                    Assert.True(uptime.Outcome == TickOutcomeEnum.Escalated, "The uptime keeper escalated: " + Serializer.Serialize(uptime));
                    Escalation failover = (await HttpTestHelpers.SendAsync<EnumerationResult<Escalation>>(host.AdminClient, HttpMethod.Get, T(host) + "/escalations?mandateId=" + uptime.MandateId, null, 200, token).ConfigureAwait(false)).Objects.Single();
                    Assert.True(failover.Status == EscalationStatusEnum.Open && failover.TargetKind == EscalationTargetKindEnum.Role && failover.TargetName == "AgentOperator", "Asked the on-call role: " + Serializer.Serialize(failover));
                    await HttpTestHelpers.SendAsync<Escalation>(host.AdminClient, HttpMethod.Post, T(host) + "/escalations/" + failover.Id + "/answer", new EscalationAnswerRequest { Choice = "hold" }, 200, token).ConfigureAwait(false);
                    Assert.Equal(WakeSourceEnum.EscalationAnswer, (await MandateAsync(host, uptime.MandateId, token).ConfigureAwait(false)).PendingWakeSource, "The answer wakes the uptime keeper");
                    await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/uptime-watch/pause", null, 200, token).ConfigureAwait(false);

                    // The curator's tick lists the unit's shared memory.
                    MandateTick curator = await ResumeAndTickAsync(host, scheduler, "memory-curation", token).ConfigureAwait(false);
                    Assert.True(curator.Outcome == TickOutcomeEnum.Quiet, "The curator's tick: " + Serializer.Serialize(curator));

                    await ProposalAsync(host, org, dependencies, hires, set, token).ConfigureAwait(false);
                }
            }
            finally
            {
                DeleteRoot(root);
            }
        }

        #endregion

        #region Private-Methods

        private static async Task ProposalAsync(TestServerHost host, Organization org, OrgUnit dependencies, ChangeRule hires, EvalSet set, CancellationToken token)
        {
            // The lead's proposal needs the draft identifier between calls, so the case makes them with the lead's run token.
            Agent lead = Assert.NotNull(await host.Server.Context.Database.Agents.ReadByNameAsync(host.TenantId, "reliability-lead", token).ConfigureAwait(false), "The lead agent");
            Deployment executive = (await host.Server.Context.Database.Deployments.ListByAgentAsync(host.TenantId, lead.Id, token).ConfigureAwait(false)).Single(d => d.Name == "reliability-lead");
            Assert.Equal(ManagementAccessEnum.OrgSubtree, executive.ManagementAccess, "The lead is an executive");
            Run run = OrganizationSuite.RunOf(host, lead);
            run.DeploymentId = executive.Id;
            run.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(10);
            run = await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
            int revisionsBefore = (await host.Server.Context.Database.Organizations.ListRevisionsAsync(host.TenantId, org.Id, token).ConfigureAwait(false)).Count;
            StudioDraft draft;
            using (TestMcpClient client = await OrganizationSuite.RunClientAsync(host, run, token).ConfigureAwait(false))
            {
                draft = await client.CallAsync<StudioDraft>("garrison_studio_create_draft", new { title = "Add a driver-upgrade worker to dependencies" }, token).ConfigureAwait(false);
                foreach (ManifestDocument document in ManifestParser.Parse(Read("site-reliability-org/proposal/driver-upgrade.yaml")))
                {
                    draft = await client.CallAsync<StudioDraft>("garrison_studio_put_item", new { draftId = draft.Id, version = draft.Version, kind = document.Kind, name = document.Metadata.Name, document = ExecutiveAuthoritySuite.Yaml(document) }, token).ConfigureAwait(false);
                }
                ManifestDocument organization = await ExecutiveAuthoritySuite.LiveAsync(host, "Organization", org.Name, token).ConfigureAwait(false);
                Dictionary<string, object?> unit = ExecutiveAuthoritySuite.FindUnit(organization.Spec["units"], dependencies.Name) ?? throw new TestAssertionException("The exported organization names " + dependencies.Name);
                List<object?> members = unit.TryGetValue("members", out object? existing) && existing is List<object?> list ? list : new List<object?>();
                members.Add(new Dictionary<string, object?> { ["agent"] = "driver-upgrade", ["title"] = "Driver upgrade" });
                unit["members"] = members;
                draft = await client.CallAsync<StudioDraft>("garrison_studio_put_item", new { draftId = draft.Id, version = draft.Version, kind = "Organization", name = org.Name, document = ExecutiveAuthoritySuite.Yaml(organization) }, token).ConfigureAwait(false);

                // The draft is valid, but the hire waits for the gate.
                StudioDraftDiff held = await client.CallAsync<StudioDraftDiff>("garrison_studio_validate", new { draftId = draft.Id }, token).ConfigureAwait(false);
                Assert.True(held.Valid && held.Refusals.Count == 0 && !held.AppliesByRule && held.RuleMatches.Any() && held.RuleMatches.All(m => m.Code == ChangeRuleMatcher.EvalGatePending), "The hire waits for the eval gate: " + Serializer.Serialize(held));
                Approval waiting = await client.CallAsync<Approval>("garrison_studio_request_apply", new { draftId = draft.Id, version = draft.Version }, token).ConfigureAwait(false);
                Assert.True(waiting.Status == ApprovalStatusEnum.Pending, "Without a passing eval the proposal waits: " + Serializer.Serialize(waiting));
                StudioDraft pending = Assert.NotNull(await host.Server.Context.Database.StudioDrafts.ReadAsync(host.TenantId, draft.Id, token).ConfigureAwait(false), "The waiting draft");

                // The lead runs the approved eval set against its draft; the candidate passes, and the rule applies the change.
                EvalRun started = await client.CallAsync<EvalRun>("garrison_run_eval", new { set = set.Name, studioDraftId = draft.Id, agent = "driver-upgrade" }, token).ConfigureAwait(false);
                EvalRun passed = await EvalAsync(host, started.Id, token).ConfigureAwait(false);
                Assert.True(passed.Status == EvalRunStatusEnum.Completed && passed.Score == 1, "The candidate passes the eval set: " + Serializer.Serialize(passed));
                StudioDraftDiff covered = await client.CallAsync<StudioDraftDiff>("garrison_studio_validate", new { draftId = draft.Id }, token).ConfigureAwait(false);
                Assert.True(covered.AppliesByRule && covered.RuleMatches.All(m => m.RuleId == hires.Id) && covered.RuleMatches.Any(m => m.GateEvalRunId == passed.Id), "The rule covers the hire once the eval passed: " + Serializer.Serialize(covered));
                Approval applied = await client.CallAsync<Approval>("garrison_studio_request_apply", new { draftId = draft.Id, version = pending.Version }, token).ConfigureAwait(false);
                Assert.True(applied.Status == ApprovalStatusEnum.Approved && applied.DecisionSource == ApprovalSourceEnum.Rule && applied.RuleId == hires.Id, "The rule applies the proposal: " + Serializer.Serialize(applied));
            }

            List<OrgRevision> revisions = await host.Server.Context.Database.Organizations.ListRevisionsAsync(host.TenantId, org.Id, token).ConfigureAwait(false);
            OrgRevision recorded = revisions.First();
            Assert.True(revisions.Count == revisionsBefore + 1 && recorded.DraftId == draft.Id && recorded.RevertDraftId != null && recorded.State == OrgRevisionStateEnum.Published, "The change is an organization revision with an undo: " + Serializer.Serialize(recorded));
            ManifestDocument live = await ExecutiveAuthoritySuite.LiveAsync(host, "Organization", org.Name, token).ConfigureAwait(false);
            string liveYaml = ExecutiveAuthoritySuite.Yaml(live);
            Assert.True(liveYaml.Contains("driver-upgrade", StringComparison.Ordinal), "The dependencies unit has its new worker: " + liveYaml);
        }

        private static async Task<MandateTick> ResumeAndTickAsync(TestServerHost host, KeeperScheduler scheduler, string mandateName, CancellationToken token)
        {
            Mandate resumed = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + mandateName + "/resume", null, 200, token).ConfigureAwait(false);
            return await TickAsync(host, scheduler, resumed.Id, token).ConfigureAwait(false);
        }

        private static async Task<MandateTick> TickAsync(TestServerHost host, KeeperScheduler scheduler, string mandateId, CancellationToken token)
        {
            HashSet<string> before = new HashSet<string>((await KeeperSuite.TicksOfAsync(host, mandateId, token).ConfigureAwait(false)).Select(t => t.Id));
            Assert.True(await scheduler.SweepAsync(DateTime.UtcNow.AddSeconds(1), token).ConfigureAwait(false), "A tick starts for " + mandateId);
            MandateTick? started = (await KeeperSuite.TicksOfAsync(host, mandateId, token).ConfigureAwait(false)).FirstOrDefault(t => !before.Contains(t.Id));
            if (started == null) throw new TestAssertionException("No new tick for " + mandateId);
            return await KeeperSuite.WaitTickAsync(host, started.Id, token).ConfigureAwait(false);
        }

        private static async Task<Mandate> MandateAsync(TestServerHost host, string mandateId, CancellationToken token)
        {
            return Assert.NotNull(await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, mandateId, token).ConfigureAwait(false), "Mandate " + mandateId);
        }

        private static async Task<string> InputAsync(TestServerHost host, MandateTick tick, CancellationToken token)
        {
            Run run = Assert.NotNull(await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, tick.RunId ?? String.Empty, token).ConfigureAwait(false), "The tick's run");
            return run.InputText ?? String.Empty;
        }

        private static async Task<MemoryEntry> MemoryEntryAsync(TestServerHost host, string agentId, string key, CancellationToken token)
        {
            EnumerationResult<MemoryEntry> entries = await HttpTestHelpers.SendAsync<EnumerationResult<MemoryEntry>>(host.AdminClient, HttpMethod.Get, T(host) + "/memory/entries?scopeKind=Agent&scopeId=" + agentId, null, 200, token).ConfigureAwait(false);
            MemoryEntry? entry = entries.Objects.FirstOrDefault(e => e.Key == key);
            if (entry == null) throw new TestAssertionException("No memory entry " + key + "; entries: " + String.Join(", ", entries.Objects.Select(e => e.Key)));
            return entry;
        }

        private static async Task<EvalRun> EvalAsync(TestServerHost host, string evalRunId, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(120);
            while (true)
            {
                EvalRun run = await HttpTestHelpers.SendAsync<EvalRun>(host.AdminClient, HttpMethod.Get, T(host) + "/eval-runs/" + evalRunId, null, 200, token).ConfigureAwait(false);
                if (run.Status == EvalRunStatusEnum.Completed || run.Status == EvalRunStatusEnum.Failed || run.Status == EvalRunStatusEnum.Cancelled) return run;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Eval run " + evalRunId + " did not finish in time: " + Serializer.Serialize(run));
                await Task.Delay(200, token).ConfigureAwait(false);
            }
        }

        private static string Changed(ManifestApply applied)
        {
            return String.Join("; ", applied.Items.Where(i => i.Result != ManifestApplyResultEnum.Unchanged).Select(i => i.Kind + "/" + i.Name + " " + i.Result + " " + i.Message));
        }

        private static string Bundle(params string[] paths)
        {
            return String.Join("\n---\n", paths.Select(Read));
        }

        private static string Read(string path)
        {
            string? directory = AppContext.BaseDirectory;
            while (directory != null && !Directory.Exists(Path.Combine(directory, "examples", "autonomous"))) directory = Path.GetDirectoryName(directory);
            string root = Assert.NotNull(directory, "Repository root with examples/autonomous");
            return File.ReadAllText(Path.Combine(root, "examples", "autonomous", path));
        }

        private static void EnableMemory(Garrison.Server.Settings.ServerSettings settings, string root)
        {
            settings.AgentMemory.Enabled = true;
            settings.AgentMemory.RootDirectory = root;
        }

        private static string MemoryRoot()
        {
            return Path.Combine(Path.GetTempPath(), "garrison-autonomy-example-" + Guid.NewGuid().ToString("N"));
        }

        private static void DeleteRoot(string root)
        {
            try
            {
                if (Directory.Exists(root)) Directory.Delete(root, true);
            }
            catch (IOException)
            {
            }
            catch (UnauthorizedAccessException)
            {
            }
        }

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        #endregion
    }
}
