namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.ProviderHarness;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Shadow trials (AUTONOMOUS_AGENTS_PLAN.md AA9.7, AA9.12, AA-027, R7): sampling and linking, the default comparer,
    /// the shadow tool policy, a shadow run refused on every effect (effectful tool, message, memory write, report,
    /// escalation, file write-back) while its permission prompt is denied, an end-to-end trial on the fake harness whose
    /// source run is unaffected while three candidates agree, diverge, and fail, the end-time sweep, and the routes.
    /// </summary>
    public static class ShadowSuite
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
            unit.Add(new TestCaseDescriptor("shadow-unit", "sampling", "Sampling is deterministic, always on at 100 percent, near the requested share otherwise; the idempotency key names the source run", SamplingAsync));
            unit.Add(new TestCaseDescriptor("shadow-unit", "comparer", "The default comparer agrees after normalizing whitespace and case and explains a divergence", ComparerAsync));
            unit.Add(new TestCaseDescriptor("shadow-unit", "policy", "Shadow runs may read and ask for permission; effectful, messaging, escalation, report, memory-write, draft, file, and agent tools are refused", PolicyAsync));
            suites.Add(new TestSuiteDescriptor("shadow-unit", "Shadow trials: sampling, comparer, policy", unit));
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "shadow-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "refusals", "A shadow run's token is refused an effectful tool, a message, a memory write, a report, an escalation, and file write-back with ShadowRunRefused; its permission prompt is denied; its tool list hides them (" + provider + ")", ct => RefusalsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "trial", "A source run on the fake harness finishes unaffected; its input is copied once to three candidates as Shadow runs that agree, diverge, and fail (" + provider + ")", ct => TrialAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "comparison", "A trial with a comparison eval set is scored with the set's checks against the source output; useJudge runs the set's judge agent with eval-judge; a judge without a judge agent is refused at start (" + provider + ")", ct => ComparisonAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "terminal", "A shadow run cancelled in the queue or timed out by the maintenance pass counts once as a candidate failure; a clamped samplePercent is echoed (" + provider + ")", ct => TerminalAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "sweep", "The leader's sweep completes a trial at its end time, leaves an open-ended one running, and fails a trial whose candidate is inactive or whose source is deleted (" + provider + ")", ct => SweepAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "routes", "POST /shadow-trials validation and 409, GET list filters and one, POST stop and stop again, cross-tenant 404, Viewer reads but cannot start, MCP tools for people only (" + provider + ")", ct => RoutesAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Shadow trials (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task SamplingAsync(CancellationToken token)
        {
            Assert.True(ShadowSampling.Sampled("shd_a", "run_1", 100) && ShadowSampling.Sampled("shd_a", "run_2", 100), "100 percent samples every run");
            Assert.Equal(ShadowSampling.Sampled("shd_a", "run_x", 37), ShadowSampling.Sampled("shd_a", "run_x", 37), "The decision is deterministic");
            int sampled = 0;
            for (int i = 0; i < 2000; i++) if (ShadowSampling.Sampled("shd_b", "run_" + i, 25)) sampled++;
            Assert.True(sampled > 380 && sampled < 620, "25 percent samples about a quarter: " + sampled + " of 2000");
            string key = ShadowSampling.IdempotencyKey("shd_a", "run_src");
            Assert.Equal("shadow:shd_a:run_src", key, "Key format");
            Assert.Equal("run_src", ShadowSampling.SourceRunId(new Run { ShadowTrialId = "shd_a", IdempotencyKey = key }), "The source run is read back");
            Assert.True(ShadowSampling.SourceRunId(new Run { ShadowTrialId = "shd_other", IdempotencyKey = key }) == null && ShadowSampling.SourceRunId(new Run { IdempotencyKey = key }) == null, "A key of another trial or a run without a trial names nothing");
            Assert.Equal("{\"a\":1}", ShadowSampling.Output(new Run { ResultText = "text", StructuredOutputJson = "{\"a\":1}" }), "Structured output wins over text");
            return Task.CompletedTask;
        }

        private static async Task ComparerAsync(CancellationToken token)
        {
            NormalizedTextShadowComparer comparer = new NormalizedTextShadowComparer();
            ShadowTrial trial = new ShadowTrial();
            ShadowComparison same = await comparer.CompareAsync(trial, "  The answer\n\nis  42. ", "the ANSWER is 42.", token).ConfigureAwait(false);
            Assert.True(same.Agreed && !String.IsNullOrEmpty(same.Note), "Whitespace and case do not matter: " + same.Note);
            ShadowComparison different = await comparer.CompareAsync(trial, "The answer is 42.", "The answer is 41.", token).ConfigureAwait(false);
            Assert.True(!different.Agreed && different.Note!.Contains("character 15", StringComparison.Ordinal), "A divergence names where it starts: " + different.Note);
            Assert.True((await comparer.CompareAsync(trial, null, "", token).ConfigureAwait(false)).Agreed, "Two empty outputs agree");
            comparer.IgnoreCase = false;
            Assert.True(!(await comparer.CompareAsync(trial, "A", "a", token).ConfigureAwait(false)).Agreed, "Case counts when IgnoreCase is off");
            Assert.True(new ShadowComparison(true, new string('n', 3000)).Note!.Length == 2000, "Notes are cut at 2000 characters");
        }

        private static Task PolicyAsync(CancellationToken token)
        {
            Dictionary<string, McpToolDefinition> tools = McpToolCatalog.All().ToDictionary(t => t.Name, StringComparer.Ordinal);
            foreach (string refused in new[] { "garrison_send_message", "garrison_reply_message", "garrison_read_inbox", "garrison_ack_message", "garrison_escalate", "garrison_file_report", "garrison_memory_write", "garrison_memory_delete", "garrison_files_write", "garrison_invoke_agent", "garrison_start_run", "garrison_studio_create_draft", "garrison_studio_put_item", "garrison_studio_get_draft", "garrison_keeper_complete_tick", "garrison_fan_out" })
            {
                Assert.True(tools.ContainsKey(refused), refused + " is in the catalog");
                Assert.True(ShadowRunPolicy.Refuses(tools[refused]), refused + " is refused to shadow runs");
            }
            foreach (string allowed in new[] { "garrison_permission_prompt", "garrison_get_run", "garrison_memory_read", "garrison_list_agents" })
            {
                Assert.True(tools.ContainsKey(allowed) && !ShadowRunPolicy.Refuses(tools[allowed]), allowed + " stays available to shadow runs");
            }
            Assert.True(ShadowRunPolicy.Refuses(new McpToolDefinition { Name = "some-agent", AgentTool = true, Operation = OperationTypeEnum.Read }), "Agent tools are refused");
            Assert.True(ShadowRunPolicy.IsShadow(new Run { Kind = RunKindEnum.Shadow }) && !ShadowRunPolicy.IsShadow(new Run()) && !ShadowRunPolicy.IsShadow(null), "Only Shadow runs are shadow runs");
            Assert.True(ShadowRunPolicy.IsRestricted(new Run { Kind = RunKindEnum.Shadow }) && ShadowRunPolicy.IsRestricted(new Run { Kind = RunKindEnum.Eval }) && !ShadowRunPolicy.IsRestricted(new Run()) && !ShadowRunPolicy.IsRestricted(null), "Shadow and Eval runs are restricted (AA-074)");
            Assert.True(ShadowRunPolicy.RefusalCodeFor(new Run { Kind = RunKindEnum.Eval }) == "EvalRunRefused" && ShadowRunPolicy.RefusalCodeFor(new Run { Kind = RunKindEnum.Shadow }) == ShadowRunPolicy.RefusalCode, "Each kind has its refusal code");
            return Task.CompletedTask;
        }

        private static async Task RefusalsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, settings => settings.AgentMemory.Enabled = true, token).ConfigureAwait(false))
            {
                Agent agent = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "shadow-refused", ExposeMcpTool = true }, token).ConfigureAwait(false);
                Agent helper = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "shadow-helper", ExposeMcpTool = true }, token).ConfigureAwait(false);
                Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = "shadow-refused-d", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
                Run run = new Run();
                run.Id = IdGenerator.NewRunId();
                run.TenantId = host.TenantId;
                run.AgentId = agent.Id;
                run.AgentName = agent.Name;
                run.DeploymentId = deployment.Id;
                run.Kind = RunKindEnum.Shadow;
                run.ShadowTrialId = "shd_refusals";
                run.Status = RunStatusEnum.Running;
                run.LeaseEpoch = 1;
                run.LeaseNodeId = "nod_shadow";
                run.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5);
                run.CallerType = PrincipalTypeEnum.Administrator;
                run = await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);

                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(run, run.LeaseEpoch, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, bearer, token).ConfigureAwait(false);
                    ProviderToolPage listed = await client.ToolsAsync(token).ConfigureAwait(false);
                    string[] hidden = { "garrison_send_message", "garrison_file_report", "garrison_memory_write", "garrison_escalate", "garrison_files_write", "garrison_invoke_agent", "shadow-helper" };
                    Assert.True(hidden.All(n => !listed.Tools.Any(t => t.Name == n)), "The shadow run is not shown effectful tools: " + String.Join(", ", listed.Tools.Select(t => t.Name)));
                    Assert.True(listed.Tools.Any(t => t.Name == "garrison_permission_prompt") && listed.Tools.Any(t => t.Name == "garrison_get_run"), "It still sees the permission prompt and read tools");

                    // AA9.7 Accept: an effectful tool, a message, a memory write, and a report are each refused.
                    await client.ExpectErrorAsync("garrison_invoke_agent", new { agent = helper.Name, input = "Do something with effects." }, ShadowRunPolicy.RefusalCode, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_send_message", new { recipient = helper.Name, subject = "From a shadow", body = "This must not arrive." }, ShadowRunPolicy.RefusalCode, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_memory_write", new { scope = "Agent", key = "notes", value = "This must not be written." }, ShadowRunPolicy.RefusalCode, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_file_report", new { kind = "Status", title = "This must not be filed." }, ShadowRunPolicy.RefusalCode, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_escalate", new { question = "Should I?" }, ShadowRunPolicy.RefusalCode, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_files_write", new { path = "out.txt", content = "x" }, ShadowRunPolicy.RefusalCode, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_studio_create_draft", new { title = "A shadow draft" }, ShadowRunPolicy.RefusalCode, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_read_inbox", new { }, ShadowRunPolicy.RefusalCode, token).ConfigureAwait(false);

                    PermissionPromptResult prompt = await client.CallAsync<PermissionPromptResult>("garrison_permission_prompt", new { tool_name = "Bash", input = new { command = "rm -rf build" } }, token).ConfigureAwait(false);
                    Assert.True(prompt.Behavior == "deny" && !String.IsNullOrEmpty(prompt.Message), "A shadow run's tool approval is denied: " + Serializer.Serialize(prompt));
                    Approval? recorded = prompt.ApprovalId == null ? null : await host.Server.Context.Database.Approvals.ReadAsync(host.TenantId, prompt.ApprovalId, token).ConfigureAwait(false);
                    Assert.True(recorded != null && recorded.Status == ApprovalStatusEnum.Denied && recorded.DecisionSource == ApprovalSourceEnum.Default, "The denial is recorded as the default decision");
                }

                Assert.Equal(0L, (await host.Server.Context.Database.AgentMessages.EnumerateAsync(new AgentMessageFilter { TenantId = host.TenantId }, token).ConfigureAwait(false)).TotalRecords, "No message was created");
                Assert.Equal(0L, (await host.Server.Context.Database.Reports.EnumerateAsync(new ReportFilter { TenantId = host.TenantId }, token).ConfigureAwait(false)).TotalRecords, "No report was filed");
                Assert.Equal(0L, (await host.Server.Context.Database.Runs.EnumerateAsync(new RunFilter { TenantId = host.TenantId, AgentId = helper.Id }, token).ConfigureAwait(false)).TotalRecords, "No other run was started");
                Assert.True((await host.Server.Context.Database.EffectOperations.ListAsync(host.TenantId, run.Id, token).ConfigureAwait(false)).All(o => o.Tool == "garrison_permission_prompt"), "Nothing but the permission prompt reached the effect journal");

                bool refused = false;
                try
                {
                    await host.Server.Context.Get<Garrison.Server.Services.FileSpaceService>().WriteFromNodeAsync(host.TenantId, run.Id, "nod_shadow", 1, 0, "result.txt", 0, new byte[] { 1, 2, 3 }, token).ConfigureAwait(false);
                }
                catch (ConflictException e) when (e.Code == ShadowRunPolicy.RefusalCode)
                {
                    refused = true;
                }
                Assert.True(refused, "A shadow run's file space write-back is refused");
            }
        }

        private static async Task TrialAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                await ProfileAsync(host, "shadow-diverge", token, "--format", "claude", "--answer", "A different answer entirely.").ConfigureAwait(false);
                await ProfileAsync(host, "shadow-fail", token, "--format", "claude", "--fail").ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("shadow-e2e", "builtin/fake", null, token).ConfigureAwait(false);
                Deployment source = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadByNameAsync(host.TenantId, "shadow-e2e-default", token).ConfigureAwait(false), "Source deployment");
                Deployment same = await CandidateAsync(host, agent, "shadow-e2e-same", "builtin/fake", token).ConfigureAwait(false);
                Deployment diverge = await CandidateAsync(host, agent, "shadow-e2e-diverge", "shadow-diverge", token).ConfigureAwait(false);
                Deployment fail = await CandidateAsync(host, agent, "shadow-e2e-fail", "shadow-fail", token).ConfigureAwait(false);

                ShadowTrial agreeing = await StartAsync(host, source, same, 100, token).ConfigureAwait(false);
                ShadowTrial diverging = await StartAsync(host, source, diverge, 100, token).ConfigureAwait(false);
                ShadowTrial failing = await StartAsync(host, source, fail, 100, token).ConfigureAwait(false);
                Assert.True(agreeing.Status == ShadowTrialStatusEnum.Running && agreeing.AgentId == agent.Id && agreeing.SamplePercent == 100, "The trial starts Running for the agent");

                InvokeRequest invoke = new InvokeRequest { Input = "Summarize the shadow trial.", Wait = false };
                Run started = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", invoke, 202, token).ConfigureAwait(false);
                Run sourceRun = await WaitTerminalAsync(host, started.Id, token).ConfigureAwait(false);
                Assert.True(sourceRun.Status == RunStatusEnum.Succeeded && sourceRun.DeploymentId == source.Id && sourceRun.Kind == RunKindEnum.Invoke, "The source run succeeded on the source deployment (candidates have weight 0): " + sourceRun.Status + " " + sourceRun.DeploymentId);
                Assert.True((sourceRun.ResultText ?? String.Empty).Contains("Summarize the shadow trial.", StringComparison.Ordinal), "The source run answered its caller as usual: " + sourceRun.ResultText);

                ShadowTrialService service = host.Server.Context.Get<ShadowTrialService>();
                Run sameShadow = await ShadowRunAsync(host, service, agreeing, token).ConfigureAwait(false);
                Run divergeShadow = await ShadowRunAsync(host, service, diverging, token).ConfigureAwait(false);
                Run failShadow = await ShadowRunAsync(host, service, failing, token).ConfigureAwait(false);
                foreach (Run shadow in new[] { sameShadow, divergeShadow, failShadow })
                {
                    Assert.True(shadow.Kind == RunKindEnum.Shadow && shadow.InputText == sourceRun.InputText && shadow.Priority == -100, "A Shadow run with the source's input at the lowest priority: " + Serializer.Serialize(shadow));
                    Assert.True(shadow.ParentRunId == null && shadow.ConversationId == null && shadow.TriggerId == null && shadow.PipelineRunId == null && shadow.MandateId == null && shadow.FanOutGroupId == null, "It answers no caller, conversation, trigger, pipeline, mandate, or fan-out");
                    Assert.Equal(sourceRun.Id, ShadowSampling.SourceRunId(shadow), "It names its source run");
                }
                Assert.True(sameShadow.DeploymentId == same.Id && divergeShadow.DeploymentId == diverge.Id && failShadow.DeploymentId == fail.Id, "Each shadow run went to its trial's candidate");

                ShadowTrial agreed = await CountsAsync(host, service, agreeing, t => t.ComparedCount == 1, token).ConfigureAwait(false);
                ShadowTrial diverged = await CountsAsync(host, service, diverging, t => t.ComparedCount == 1, token).ConfigureAwait(false);
                ShadowTrial failed = await CountsAsync(host, service, failing, t => t.CandidateFailureCount == 1, token).ConfigureAwait(false);
                Assert.True(agreed.AgreedCount == 1 && agreed.DivergedCount == 0 && agreed.CandidateFailureCount == 0, "The same harness agrees: " + Serializer.Serialize(agreed));
                Assert.True(diverged.AgreedCount == 0 && diverged.DivergedCount == 1, "A different answer diverges: " + Serializer.Serialize(diverged));
                Assert.True(failed.ComparedCount == 0 && failed.CandidateFailureCount == 1, "A failing candidate counts as a candidate failure: " + Serializer.Serialize(failed));

                Run after = Assert.NotNull(await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, sourceRun.Id, token).ConfigureAwait(false), "Source run");
                Assert.True(after.Status == sourceRun.Status && after.ResultText == sourceRun.ResultText && after.CompletedUtc == sourceRun.CompletedUtc && after.ShadowTrialId == null, "The source run is unchanged by the trial");
                Assert.Equal(0, await service.CopyAsync(after, token).ConfigureAwait(false), "A source run is copied at most once per trial");
                EnumerationResult<Run> all = await host.Server.Context.Database.Runs.EnumerateAsync(new RunFilter { TenantId = host.TenantId, AgentId = agent.Id, MaxResults = 50 }, token).ConfigureAwait(false);
                Assert.Equal(4L, all.TotalRecords, "One source run and three shadow runs; shadow runs are never copied again");
            }
        }

        private static async Task SweepAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "shadow-sweep" }, token).ConfigureAwait(false);
                Deployment source = await DeploymentAsync(host, agent, "shadow-sweep-a", token).ConfigureAwait(false);
                Deployment candidate = await DeploymentAsync(host, agent, "shadow-sweep-b", token).ConfigureAwait(false);
                Deployment other = await DeploymentAsync(host, agent, "shadow-sweep-c", token).ConfigureAwait(false);
                ShadowTrialService service = host.Server.Context.Get<ShadowTrialService>();
                ShadowTrial ending = await HttpTestHelpers.SendAsync<ShadowTrial>(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials", new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = candidate.Id, EndsUtc = DateTime.UtcNow.AddHours(1) }, 201, token).ConfigureAwait(false);
                ShadowTrial open = await HttpTestHelpers.SendAsync<ShadowTrial>(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials", new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = other.Id }, 201, token).ConfigureAwait(false);
                Assert.True(!await service.SweepAsync(token).ConfigureAwait(false), "Nothing ends before its time");
                service.Clock = new ManualTimeProvider(DateTime.UtcNow.AddHours(2));
                try
                {
                    Assert.True(await service.SweepAsync(token).ConfigureAwait(false), "The sweep ends the trial past its end time");
                    Assert.True(!await service.SweepAsync(token).ConfigureAwait(false), "A second sweep changes nothing");
                }
                finally
                {
                    service.Clock = TimeProvider.System;
                }
                ShadowTrial ended = await service.ReadAsync(host.TenantId, ending.Id, token).ConfigureAwait(false);
                Assert.True(ended.Status == ShadowTrialStatusEnum.Completed && ended.CompletedUtc.HasValue && ended.StopReason == "Reached its end time.", "Completed at its end time: " + Serializer.Serialize(ended));
                Assert.Equal(ShadowTrialStatusEnum.Running, (await service.ReadAsync(host.TenantId, open.Id, token).ConfigureAwait(false)).Status, "An open-ended trial keeps running");

                // A trial whose candidate is made inactive, or whose source is deleted, fails on the next sweep.
                Deployment gone = await DeploymentAsync(host, agent, "shadow-sweep-d", token).ConfigureAwait(false);
                Deployment later = await DeploymentAsync(host, agent, "shadow-sweep-e", token).ConfigureAwait(false);
                ShadowTrial orphaned = await HttpTestHelpers.SendAsync<ShadowTrial>(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials", new ShadowTrial { SourceDeploymentId = gone.Id, CandidateDeploymentId = later.Id }, 201, token).ConfigureAwait(false);
                other.Active = false;
                await host.Server.Context.Database.Deployments.UpdateAsync(other, token).ConfigureAwait(false);
                await host.Server.Context.Database.Deployments.DeleteAsync(gone.Id, token).ConfigureAwait(false);
                Assert.True(await service.SweepAsync(token).ConfigureAwait(false), "The sweep fails the broken trials");
                ShadowTrial inactive = await service.ReadAsync(host.TenantId, open.Id, token).ConfigureAwait(false);
                Assert.True(inactive.Status == ShadowTrialStatusEnum.Failed && inactive.StopReason!.Contains("candidate deployment shadow-sweep-c is inactive", StringComparison.Ordinal), "An inactive candidate fails the trial: " + Serializer.Serialize(inactive));
                ShadowTrial deleted = await service.ReadAsync(host.TenantId, orphaned.Id, token).ConfigureAwait(false);
                Assert.True(deleted.Status == ShadowTrialStatusEnum.Failed && deleted.StopReason!.Contains("source deployment " + gone.Id + " was deleted", StringComparison.Ordinal), "A deleted source fails the trial: " + Serializer.Serialize(deleted));
                Assert.True(!await service.SweepAsync(token).ConfigureAwait(false), "A failed trial is not swept again");
            }
        }

        private static async Task RoutesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                foreach (string path in new[] { "/shadow-trials", "/shadow-trials/{trialId}", "/shadow-trials/{trialId}/stop" })
                {
                    string full = "/v1.0/api/tenants/{tenantId}" + path;
                    Assert.True(host.Server.Context.Scopes.Find(path.EndsWith("stop", StringComparison.Ordinal) ? "POST" : "GET", full) != null, full + " is in the scope map");
                }
                foreach (string name in new[] { "garrison_list_shadow_trials", "garrison_get_shadow_trial", "garrison_start_shadow_trial", "garrison_stop_shadow_trial" })
                    Assert.True(host.Server.Context.Scopes.Find("MCP", name) != null, name + " scope is registered");

                Agent agent = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "shadow-routes" }, token).ConfigureAwait(false);
                Agent stranger = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "shadow-stranger" }, token).ConfigureAwait(false);
                Deployment source = await DeploymentAsync(host, agent, "shadow-routes-a", token).ConfigureAwait(false);
                Deployment candidate = await DeploymentAsync(host, agent, "shadow-routes-b", token).ConfigureAwait(false);
                Deployment foreignAgent = await DeploymentAsync(host, stranger, "shadow-stranger-a", token).ConfigureAwait(false);

                await ExpectAsync(host, new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = source.Id }, 400, "SameDeployment", token).ConfigureAwait(false);
                await ExpectAsync(host, new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = foreignAgent.Id }, 400, "DifferentAgent", token).ConfigureAwait(false);
                await ExpectAsync(host, new ShadowTrial { SourceDeploymentId = "dep_missing", CandidateDeploymentId = candidate.Id }, 400, "DeploymentNotFound", token).ConfigureAwait(false);
                await ExpectAsync(host, new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = candidate.Id, EndsUtc = DateTime.UtcNow.AddMinutes(-1) }, 400, "EndsInPast", token).ConfigureAwait(false);
                await ExpectAsync(host, new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = candidate.Id, ComparisonEvalSetId = "evs_missing" }, 400, "EvalSetNotFound", token).ConfigureAwait(false);

                ShadowTrial created = await HttpTestHelpers.SendAsync<ShadowTrial>(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials", new ShadowTrial { Name = "candidate check", SourceDeploymentId = source.Name, CandidateDeploymentId = candidate.Name, SamplePercent = 25 }, 201, token).ConfigureAwait(false);
                Assert.True(created.SourceDeploymentId == source.Id && created.CandidateDeploymentId == candidate.Id && created.SamplePercent == 25 && created.Name == "candidate check" && created.CreatedByName != null, "Names resolve to identifiers: " + Serializer.Serialize(created));
                await ExpectAsync(host, new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = candidate.Id }, 409, "ShadowTrialAlreadyRunning", token).ConfigureAwait(false);

                EnumerationResult<ShadowTrial> bySource = await HttpTestHelpers.SendAsync<EnumerationResult<ShadowTrial>>(host.AdminClient, HttpMethod.Get, T(host) + "/shadow-trials?source=" + source.Id + "&status=Running", null, 200, token).ConfigureAwait(false);
                Assert.True(bySource.TotalRecords == 1 && bySource.Objects[0].Id == created.Id, "Filter by source and status");
                Assert.Equal(0L, (await HttpTestHelpers.SendAsync<EnumerationResult<ShadowTrial>>(host.AdminClient, HttpMethod.Get, T(host) + "/shadow-trials?status=Stopped", null, 200, token).ConfigureAwait(false)).TotalRecords, "No stopped trial yet");
                Assert.Equal(created.Id, (await HttpTestHelpers.SendAsync<ShadowTrial>(host.AdminClient, HttpMethod.Get, T(host) + "/shadow-trials/" + created.Id, null, 200, token).ConfigureAwait(false)).Id, "Read one");

                ShadowTrial stopped = await HttpTestHelpers.SendAsync<ShadowTrial>(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials/" + created.Id + "/stop", new ShadowTrialStopRequest { Reason = "Enough data." }, 200, token).ConfigureAwait(false);
                Assert.True(stopped.Status == ShadowTrialStatusEnum.Stopped && stopped.StopReason == "Enough data." && stopped.CompletedUtc.HasValue, "Stopped with the reason");
                TestResponse again = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials/" + created.Id + "/stop", null, token).ConfigureAwait(false);
                Assert.True(again.StatusCode == 409 && again.Body.Contains("ShadowTrialNotRunning", StringComparison.Ordinal), "Stopping twice is a conflict: " + again.StatusCode + " " + again.Body);

                ShadowTrial foreign = new ShadowTrial { TenantId = "ten_elsewhere", SourceDeploymentId = "dep_x", CandidateDeploymentId = "dep_y" };
                await host.Server.Context.Database.ShadowTrials.CreateAsync(foreign, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/shadow-trials/" + foreign.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's trial answers 404");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials/" + foreign.Id + "/stop", null, token).ConfigureAwait(false)).StatusCode, "Another tenant's trial cannot be stopped");
                Assert.True((await HttpTestHelpers.SendAsync<EnumerationResult<ShadowTrial>>(host.AdminClient, HttpMethod.Get, T(host) + "/shadow-trials", null, 200, token).ConfigureAwait(false)).Objects.All(t => t.TenantId == host.TenantId), "The list holds only this tenant's trials");

                await KeeperSuite.UserAsync(host, "shadow-viewer@example.com", "Viewer", token).ConfigureAwait(false);
                using (HttpClient viewer = await host.UserClientAsync("shadow-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Get, T(host) + "/shadow-trials", null, token).ConfigureAwait(false)).StatusCode, "A Viewer lists trials");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Post, T(host) + "/shadow-trials", new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = candidate.Id }, token).ConfigureAwait(false)).StatusCode, "A Viewer cannot start one");
                }

                using (TestMcpClient person = new TestMcpClient())
                {
                    await person.ConnectAsync(host, null, token).ConfigureAwait(false);
                    ShadowTrial viaMcp = await person.CallAsync<ShadowTrial>("garrison_start_shadow_trial", new { sourceDeployment = source.Name, candidateDeployment = candidate.Name, samplePercent = 50 }, token).ConfigureAwait(false);
                    Assert.True(viaMcp.Status == ShadowTrialStatusEnum.Running && viaMcp.SamplePercent == 50, "People start a trial over MCP");
                    Assert.Equal(viaMcp.Id, (await person.CallAsync<ShadowTrial>("garrison_get_shadow_trial", new { trialId = viaMcp.Id }, token).ConfigureAwait(false)).Id, "and read it");
                    EnumerationResult<ShadowTrial> listed = await person.CallAsync<EnumerationResult<ShadowTrial>>("garrison_list_shadow_trials", new { status = "Running" }, token).ConfigureAwait(false);
                    Assert.True(listed.Objects.Any(t => t.Id == viaMcp.Id), "and list it");
                    Assert.Equal(ShadowTrialStatusEnum.Stopped, (await person.CallAsync<ShadowTrial>("garrison_stop_shadow_trial", new { trialId = viaMcp.Id }, token).ConfigureAwait(false)).Status, "and stop it");
                    await person.ExpectErrorAsync("garrison_get_shadow_trial", new { trialId = foreign.Id }, "NotFound", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task ComparisonAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("shadow-scored", "builtin/fake", null, token).ConfigureAwait(false);
                await cluster.CreateAgentAsync("shadow-judge", "builtin/fake", null, token, d => d.Parameters.Add(new DeploymentParameter { Name = "answer", Value = "{\"score\": 0.9, \"passed\": true, \"reason\": \"Says the same thing.\"}" })).ConfigureAwait(false);
                Deployment source = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadByNameAsync(host.TenantId, "shadow-scored-default", token).ConfigureAwait(false), "Source deployment");
                Deployment schemaCandidate = await CandidateAsync(host, agent, "shadow-scored-schema", "builtin/fake", token).ConfigureAwait(false);
                Deployment judgedCandidate = await CandidateAsync(host, agent, "shadow-scored-judged", "builtin/fake", token).ConfigureAwait(false);

                EvalSet schemaSet = await HttpTestHelpers.SendAsync<EvalSet>(host.AdminClient, HttpMethod.Post, T(host) + "/eval-sets", new EvalSetRequest { Name = "shadow-schema", Cases = new List<EvalCase> { new EvalCase { InputText = "anything", Checks = new List<EvalCaseCheck> { new EvalCaseCheck { Scorer = EvalScorerEnum.JsonSchemaValid, Argument = "{\"type\":\"object\"}" } } } } }, 201, token).ConfigureAwait(false);
                EvalSet judgedSet = await HttpTestHelpers.SendAsync<EvalSet>(host.AdminClient, HttpMethod.Post, T(host) + "/eval-sets", new EvalSetRequest { Name = "shadow-judged", JudgeAgent = "shadow-judge", Cases = new List<EvalCase> { new EvalCase { InputText = "anything", ExpectedText = "anything" } } }, 201, token).ConfigureAwait(false);
                EvalSet judgeless = await HttpTestHelpers.SendAsync<EvalSet>(host.AdminClient, HttpMethod.Post, T(host) + "/eval-sets", new EvalSetRequest { Name = "shadow-judgeless", Cases = new List<EvalCase> { new EvalCase { InputText = "anything", Checks = new List<EvalCaseCheck> { new EvalCaseCheck { Scorer = EvalScorerEnum.Judge, Argument = "Same meaning?" } } } } }, 201, token).ConfigureAwait(false);

                // A judge needs a set with a judge agent, checked when the trial starts.
                await ExpectAsync(host, new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = schemaCandidate.Id, UseJudge = true }, 400, "JudgeAgentRequired", token).ConfigureAwait(false);
                await ExpectAsync(host, new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = schemaCandidate.Id, ComparisonEvalSetId = judgeless.Id }, 400, "JudgeAgentRequired", token).ConfigureAwait(false);
                await ExpectAsync(host, new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = schemaCandidate.Id, ComparisonEvalSetId = schemaSet.Id, UseJudge = true }, 400, "JudgeAgentRequired", token).ConfigureAwait(false);

                ShadowTrial schemaTrial = await HttpTestHelpers.SendAsync<ShadowTrial>(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials", new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = schemaCandidate.Id, SamplePercent = 100, ComparisonEvalSetId = schemaSet.Id }, 201, token).ConfigureAwait(false);
                ShadowTrial judgedTrial = await HttpTestHelpers.SendAsync<ShadowTrial>(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials", new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = judgedCandidate.Id, SamplePercent = 100, ComparisonEvalSetId = judgedSet.Id, UseJudge = true }, 201, token).ConfigureAwait(false);

                Run started = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "Describe the scored trial.", Wait = false }, 202, token).ConfigureAwait(false);
                Run sourceRun = await WaitTerminalAsync(host, started.Id, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, sourceRun.Status, "The source run succeeded");
                ShadowTrialService service = host.Server.Context.Get<ShadowTrialService>();
                Run schemaShadow = await ShadowRunAsync(host, service, schemaTrial, token).ConfigureAwait(false);
                Run judgedShadow = await ShadowRunAsync(host, service, judgedTrial, token).ConfigureAwait(false);
                Assert.True(schemaShadow.Status == RunStatusEnum.Succeeded && judgedShadow.Status == RunStatusEnum.Succeeded, "Both shadow runs succeeded");

                // The same harness gives the same text, but the set's JsonSchemaValid check fails plain text: the set decides.
                ShadowTrial schemaCounts = await CountsAsync(host, service, schemaTrial, t => t.ComparedCount == 1, token).ConfigureAwait(false);
                Assert.True(schemaCounts.DivergedCount == 1 && schemaCounts.AgreedCount == 0, "Scored with the set's checks, not text equality: " + Serializer.Serialize(schemaCounts));
                Assert.True((await service.Comparer.CompareAsync(new ShadowComparisonRequest(schemaTrial, "{\"a\":1}", "{\"b\":2}"), token).ConfigureAwait(false)).Agreed, "Two different JSON objects agree on a schema-only set");

                // UseJudge runs the set's judge agent with the eval-judge prompt; its verdict passes, so the outputs agree.
                ShadowTrial judgedCounts = await CountsAsync(host, service, judgedTrial, t => t.ComparedCount == 1, token).ConfigureAwait(false);
                Assert.True(judgedCounts.AgreedCount == 1 && judgedCounts.DivergedCount == 0, "The judge's verdict decides: " + Serializer.Serialize(judgedCounts));
                Agent judge = Assert.NotNull(await host.Server.Context.Database.Agents.ReadByNameAsync(host.TenantId, "shadow-judge", token).ConfigureAwait(false), "Judge agent");
                EnumerationResult<Run> judgeRuns = await host.Server.Context.Database.Runs.EnumerateAsync(new RunFilter { TenantId = host.TenantId, AgentId = judge.Id }, token).ConfigureAwait(false);
                Run judgeRun = judgeRuns.Objects.Single();
                Assert.True(judgeRun.Kind == RunKindEnum.Eval && judgeRun.IdempotencyKey != null && judgeRun.IdempotencyKey.StartsWith("shadow:" + judgedTrial.Id + ":" + judgedShadow.Id + ":judge", StringComparison.Ordinal), "One Eval run of the judge, keyed by the shadow run: " + judgeRun.IdempotencyKey);
                string judgeInput = judgeRun.InputText ?? String.Empty;
                Assert.True(judgeInput.StartsWith("You are grading one answer", StringComparison.Ordinal) && judgeInput.Contains("Describe the scored trial.", StringComparison.Ordinal) && judgeInput.Contains(sourceRun.ResultText ?? "missing", StringComparison.Ordinal), "The judge's input comes from builtin/eval-judge with the input and the source output as the reference: " + judgeInput);
                EnumerationResult<Run> judgedTrialRuns = await host.Server.Context.Database.Runs.EnumerateAsync(new RunFilter { TenantId = host.TenantId, ShadowTrialId = judgedTrial.Id }, token).ConfigureAwait(false);
                Assert.Equal(1, judgedTrialRuns.Objects.Count, "The judge run is not a shadow run of the trial");
            }
        }

        private static async Task TerminalAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "shadow-ends" }, token).ConfigureAwait(false);
                Deployment source = await DeploymentAsync(host, agent, "shadow-ends-a", token).ConfigureAwait(false);
                Deployment candidate = await DeploymentAsync(host, agent, "shadow-ends-b", token).ConfigureAwait(false);

                // samplePercent outside 1 to 100 is clamped, and the create response says so.
                WarningsEnvelope echoed = await HttpTestHelpers.SendAsync<WarningsEnvelope>(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials", new { sourceDeploymentId = source.Id, candidateDeploymentId = candidate.Id, samplePercent = 150 }, 201, token).ConfigureAwait(false);
                FieldWarning? warning = (echoed.Warnings ?? new List<FieldWarning>()).FirstOrDefault(w => w.Field == "samplePercent");
                Assert.True(warning != null && warning.Code == "ValueClamped" && warning.Given == "150" && warning.Stored == "100", "The clamp is echoed in the create response: " + Serializer.Serialize(echoed));
                ShadowTrialService service = host.Server.Context.Get<ShadowTrialService>();
                ShadowTrial trial = await service.ReadAsync(host.TenantId, echoed.Id, token).ConfigureAwait(false);
                Assert.Equal(100, trial.SamplePercent, "Stored clamped");

                // No worker runs here: the shadow run waits in the queue, and a cancel there ends it without a worker report.
                Run queuedShadow = await CopiedAsync(host, service, trial, agent, source, "cancel me", token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Queued, queuedShadow.Status, "The shadow run is queued");
                await host.Server.Context.Get<RunService>().CancelAsync(queuedShadow, token).ConfigureAwait(false);
                ShadowTrial afterCancel = await CountsAsync(host, service, trial, t => t.CandidateFailureCount >= 1, token).ConfigureAwait(false);
                Assert.True(afterCancel.CandidateFailureCount == 1 && afterCancel.ComparedCount == 0, "A cancelled shadow run counts as a candidate failure: " + Serializer.Serialize(afterCancel));
                try
                {
                    await host.Server.Context.Get<RunService>().CancelAsync((await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, queuedShadow.Id, token).ConfigureAwait(false))!, token).ConfigureAwait(false);
                    throw new TestAssertionException("Cancelling a finished run succeeded.");
                }
                catch (ConflictException)
                {
                }

                // A shadow run past its deadline without a result from its node times out in the maintenance pass.
                Run lateShadow = await CopiedAsync(host, service, trial, agent, source, "too slow", token).ConfigureAwait(false);
                Run late = (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, lateShadow.Id, token).ConfigureAwait(false))!;
                RunTransition running = new RunTransition();
                running.RunId = late.Id;
                running.FromStatuses.Add(RunStatusEnum.Queued);
                running.ToStatus = RunStatusEnum.Running;
                Assert.True(await host.Server.Context.Database.Runs.TransitionAsync(running, token).ConfigureAwait(false), "Marked running");
                late = (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, late.Id, token).ConfigureAwait(false))!;
                late.DeadlineUtc = DateTime.UtcNow.AddMinutes(-1);
                late.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(10);
                await host.Server.Context.Database.Runs.UpdateAsync(late, token).ConfigureAwait(false);
                MaintenanceService maintenance = host.Server.Context.Get<MaintenanceService>();
                await maintenance.RunOnceAsync(token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.TimedOut, (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, late.Id, token).ConfigureAwait(false))!.Status, "The late shadow run timed out");
                ShadowTrial afterDeadline = await CountsAsync(host, service, trial, t => t.CandidateFailureCount >= 2, token).ConfigureAwait(false);
                await maintenance.RunOnceAsync(token).ConfigureAwait(false);
                await service.DrainAsync(5000, token).ConfigureAwait(false);
                ShadowTrial settled = await service.ReadAsync(host.TenantId, trial.Id, token).ConfigureAwait(false);
                Assert.True(afterDeadline.CandidateFailureCount == 2 && settled.CandidateFailureCount == 2 && settled.ComparedCount == 0, "Each ended shadow run counts once: " + Serializer.Serialize(settled));
            }
        }

        private static async Task<Run> CopiedAsync(TestServerHost host, ShadowTrialService service, ShadowTrial trial, Agent agent, Deployment source, string input, CancellationToken token)
        {
            Run run = new Run();
            run.Id = IdGenerator.NewRunId();
            run.TenantId = host.TenantId;
            run.AgentId = agent.Id;
            run.AgentName = agent.Name;
            run.DeploymentId = source.Id;
            run.Kind = RunKindEnum.Invoke;
            run.Status = RunStatusEnum.Succeeded;
            run.InputText = input;
            run.ResultText = "done: " + input;
            run.CompletedUtc = DateTime.UtcNow;
            run.CallerType = PrincipalTypeEnum.Administrator;
            run = await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
            Assert.Equal(1, await service.CopyAsync(run, token).ConfigureAwait(false), "Copied to the candidate");
            EnumerationResult<Run> shadows = await host.Server.Context.Database.Runs.EnumerateAsync(new RunFilter { TenantId = host.TenantId, ShadowTrialId = trial.Id, MaxResults = 100 }, token).ConfigureAwait(false);
            return shadows.Objects.Single(r => ShadowSampling.SourceRunId(r) == run.Id);
        }

        private static async Task ExpectAsync(TestServerHost host, ShadowTrial body, int status, string code, CancellationToken token)
        {
            TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials", body, token).ConfigureAwait(false);
            Assert.True(response.StatusCode == status && response.Body.Contains(code, StringComparison.Ordinal), "Expected " + status + " " + code + ", got " + response.StatusCode + ": " + response.Body);
        }

        private static async Task<ShadowTrial> StartAsync(TestServerHost host, Deployment source, Deployment candidate, int percent, CancellationToken token)
        {
            return await HttpTestHelpers.SendAsync<ShadowTrial>(host.AdminClient, HttpMethod.Post, T(host) + "/shadow-trials", new ShadowTrial { SourceDeploymentId = source.Id, CandidateDeploymentId = candidate.Id, SamplePercent = percent }, 201, token).ConfigureAwait(false);
        }

        private static async Task<Deployment> CandidateAsync(TestServerHost host, Agent agent, string name, string profileName, CancellationToken token)
        {
            HarnessProfile profile = Assert.NotNull(await host.Server.Context.Database.HarnessProfiles.ReadByNameAsync(host.TenantId, profileName, token).ConfigureAwait(false), "Profile " + profileName);
            Deployment deployment = new Deployment { AgentId = agent.Id, Name = name, HarnessProfileId = profile.Id, TimeoutSeconds = 120, Weight = 0 };
            return await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", deployment, 201, token).ConfigureAwait(false);
        }

        private static async Task<Deployment> DeploymentAsync(TestServerHost host, Agent agent, string name, CancellationToken token)
        {
            return await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = name, AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
        }

        private static async Task ProfileAsync(TestServerHost host, string name, CancellationToken token, params string[] arguments)
        {
            HarnessProfile profile = new HarnessProfile();
            profile.Name = name;
            profile.HarnessType = HarnessTypeEnum.Generic;
            profile.Executable = "garrison-fake-harness";
            foreach (string argument in arguments) profile.Arguments.Add(new HarnessArgument { Template = argument });
            profile.OutputParser = OutputParserEnum.ClaudeStreamJson;
            profile.PromptDelivery = PromptDeliveryEnum.Stdin;
            profile.SystemPromptDelivery = SystemPromptDeliveryEnum.None;
            await HttpTestHelpers.SendAsync<HarnessProfile>(host.AdminClient, HttpMethod.Post, T(host) + "/harness-profiles", profile, 201, token).ConfigureAwait(false);
        }

        private static async Task<Run> WaitTerminalAsync(TestServerHost host, string runId, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(60);
            while (true)
            {
                Run? run = await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, runId, token).ConfigureAwait(false);
                if (run != null && RunService.IsTerminal(run.Status)) return run;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Run " + runId + " did not finish: " + run?.Status);
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        private static async Task<Run> ShadowRunAsync(TestServerHost host, ShadowTrialService service, ShadowTrial trial, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(60);
            while (true)
            {
                await service.DrainAsync(5000, token).ConfigureAwait(false);
                EnumerationResult<Run> runs = await host.Server.Context.Database.Runs.EnumerateAsync(new RunFilter { TenantId = host.TenantId, ShadowTrialId = trial.Id }, token).ConfigureAwait(false);
                if (runs.Objects.Count > 0)
                {
                    Assert.Equal(1, runs.Objects.Count, "One shadow run for trial " + trial.Id);
                    return await WaitTerminalAsync(host, runs.Objects[0].Id, token).ConfigureAwait(false);
                }
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Trial " + trial.Id + " started no shadow run.");
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        private static async Task<ShadowTrial> CountsAsync(TestServerHost host, ShadowTrialService service, ShadowTrial trial, Func<ShadowTrial, bool> done, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(30);
            while (true)
            {
                await service.DrainAsync(5000, token).ConfigureAwait(false);
                ShadowTrial current = await service.ReadAsync(host.TenantId, trial.Id, token).ConfigureAwait(false);
                if (done(current)) return current;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Trial " + trial.Id + " was not compared: " + Serializer.Serialize(current));
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        #endregion
    }
}
