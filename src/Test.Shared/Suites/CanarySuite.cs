namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Notifications;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.ProviderHarness;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Canary releases (AUTONOMOUS_AGENTS_PLAN.md AA9.8, AA9.12): the weight scale and step rules, a failing candidate
    /// rolled back at step one with its weights restored and CanaryRolledBack notified, a healthy candidate advanced to
    /// 100 percent and promoted, the eval gate, abort, and the routes and MCP tools.
    /// </summary>
    public static class CanarySuite
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
            unit.Add(new TestCaseDescriptor("canary-unit", "weights", "A step's percent becomes candidate weight percent times 10 and the baseline the rest, on the 0 to 1000 scale", WeightsAsync));
            unit.Add(new TestCaseDescriptor("canary-unit", "decisions", "Wait for runs and minutes, roll back early on a high error rate, advance, promote after the last step, and gate on the eval score", DecisionsAsync));
            suites.Add(new TestSuiteDescriptor("canary-unit", "Canary releases: weights and step rules", unit));
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "canary-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "rollback", "A failing candidate rolls back at step one before its minimum time, the weights return to where they started, and a signed CanaryRolledBack notification arrives (" + provider + ")", ct => RollbackAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "promote", "A healthy candidate advances step by step to 100 percent and is promoted; shadow and eval runs do not count (" + provider + ")", ct => PromoteAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "eval-gate", "A release with an eval gate waits for a completed eval run and rolls back on a low score (" + provider + ")", ct => EvalGateAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "routes", "POST /canary-releases validation and 409, GET list and one, POST abort restores weights and conflicts the second time, cross-tenant 404, Viewer reads only, MCP tools (" + provider + ")", ct => RoutesAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Canary releases (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task WeightsAsync(CancellationToken token)
        {
            Assert.True(CanaryStepEvaluator.CandidateWeight(10) == 100 && CanaryStepEvaluator.BaselineWeight(10) == 900, "10 percent is 100 and 900");
            Assert.True(CanaryStepEvaluator.CandidateWeight(100) == 1000 && CanaryStepEvaluator.BaselineWeight(100) == 0, "100 percent is 1000 and 0");
            Assert.True(CanaryStepEvaluator.CandidateWeight(0) == 10 && CanaryStepEvaluator.CandidateWeight(500) == 1000, "Percent clamps to 1 to 100");
            return Task.CompletedTask;
        }

        private static Task DecisionsAsync(CancellationToken token)
        {
            DateTime start = new DateTime(2026, 11, 26, 12, 0, 0, DateTimeKind.Utc);
            CanaryRelease release = Release(start, 20, new CanaryReleaseStep { WeightPercent = 10, MinimumRuns = 10, MinimumMinutes = 30 }, new CanaryReleaseStep { WeightPercent = 100, MinimumRuns = 10, MinimumMinutes = 30 });
            Assert.Equal(CanaryDecisionEnum.Wait, CanaryStepEvaluator.Evaluate(release, 5, 0, null, start.AddHours(1)).Decision, "Too few runs waits");
            Assert.Equal(CanaryDecisionEnum.Wait, CanaryStepEvaluator.Evaluate(release, 10, 1, null, start.AddMinutes(5)).Decision, "Too little time waits");
            CanaryStepDecision early = CanaryStepEvaluator.Evaluate(release, 10, 5, null, start.AddMinutes(1));
            Assert.True(early.Decision == CanaryDecisionEnum.RollBack && early.Reason.Contains("50 percent", StringComparison.Ordinal), "A high error rate with enough runs rolls back before the minimum time: " + early.Reason);
            Assert.Equal(CanaryDecisionEnum.Wait, CanaryStepEvaluator.Evaluate(release, 4, 4, null, start.AddMinutes(1)).Decision, "Failures among too few runs wait");
            Assert.Equal(CanaryDecisionEnum.Wait, CanaryStepEvaluator.Evaluate(release, 10, 2, null, start.AddMinutes(10)).Decision, "Exactly at the limit is within it");
            Assert.Equal(CanaryDecisionEnum.Advance, CanaryStepEvaluator.Evaluate(release, 10, 2, null, start.AddMinutes(31)).Decision, "Enough runs, time, and a low error rate advance");
            release.CurrentStepIndex = 1;
            Assert.Equal(CanaryDecisionEnum.Promote, CanaryStepEvaluator.Evaluate(release, 12, 0, null, start.AddMinutes(31)).Decision, "Passing the last step promotes");

            CanaryRelease gated = Release(start, 10, new CanaryReleaseStep { WeightPercent = 100, MinimumRuns = 0, MinimumMinutes = 0 });
            gated.MinEvalScore = 0.8;
            gated.EvalSetId = "evs_gate";
            Assert.Equal(CanaryDecisionEnum.Wait, CanaryStepEvaluator.Evaluate(gated, 0, 0, null, start).Decision, "No eval result waits");
            Assert.Equal(CanaryDecisionEnum.RollBack, CanaryStepEvaluator.Evaluate(gated, 0, 0, 0.5, start).Decision, "A low eval score rolls back");
            Assert.Equal(CanaryDecisionEnum.Promote, CanaryStepEvaluator.Evaluate(gated, 0, 0, 0.9, start).Decision, "A high eval score passes");
            CanaryRelease zero = Release(start, 0, new CanaryReleaseStep { WeightPercent = 100, MinimumRuns = 0, MinimumMinutes = 0 });
            Assert.Equal(CanaryDecisionEnum.RollBack, CanaryStepEvaluator.Evaluate(zero, 3, 1, null, start).Decision, "A zero limit rolls back on any failure");
            return Task.CompletedTask;
        }

        private static async Task RollbackAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeWebhookReceiver receiver = new FakeWebhookReceiver())
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                NotificationService notifications = host.Server.Context.Get<NotificationService>();
                await notifications.StopAsync().ConfigureAwait(false);
                notifications.Options.AllowPrivateDestinations = true;
                NotificationEndpoint endpoint = await HttpTestHelpers.SendAsync<NotificationEndpoint>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", new NotificationEndpoint { Name = "canary-watch", Url = receiver.BaseUrl + "/canary", Events = new List<NotificationEventEnum> { NotificationEventEnum.CanaryRolledBack } }, 201, token).ConfigureAwait(false);
                await notifications.SweepAsync(token).ConfigureAwait(false);

                Agent agent = await AgentAsync(host, "canary-failing", token).ConfigureAwait(false);
                Deployment baseline = await DeploymentAsync(host, agent, "canary-failing-stable", 300, token).ConfigureAwait(false);
                Deployment candidate = await DeploymentAsync(host, agent, "canary-failing-next", 0, token).ConfigureAwait(false);
                CanaryRelease started = await StartAsync(host, agent, candidate, baseline, 20, token, Step(10, 5, 60), Step(50, 5, 60), Step(100, 5, 60)).ConfigureAwait(false);
                Assert.True(started.Status == CanaryStatusEnum.Running && started.CurrentStepIndex == 0 && started.CandidateInitialWeight == 0 && started.BaselineInitialWeight == 300, "Started at step one with the initial weights recorded: " + Serializer.Serialize(started));
                await WeightsAsync(host, candidate, baseline, 100, 900, "Step one gives the candidate 10 percent", token).ConfigureAwait(false);

                CanaryService canaries = host.Server.Context.Get<CanaryService>();
                await RunsAsync(host, agent, candidate, RunStatusEnum.Failed, 3, RunKindEnum.Invoke, token).ConfigureAwait(false);
                await RunsAsync(host, agent, candidate, RunStatusEnum.Succeeded, 1, RunKindEnum.Invoke, token).ConfigureAwait(false);
                Assert.True(!await canaries.SweepAsync(token).ConfigureAwait(false), "Four runs are fewer than the step's five; it waits");
                await RunsAsync(host, agent, candidate, RunStatusEnum.TimedOut, 1, RunKindEnum.Invoke, token).ConfigureAwait(false);
                await RunsAsync(host, agent, baseline, RunStatusEnum.Failed, 5, RunKindEnum.Invoke, token).ConfigureAwait(false);
                Assert.True(await canaries.SweepAsync(token).ConfigureAwait(false), "Four failures in five runs roll back without waiting the step's hour");

                CanaryRelease rolledBack = await canaries.ReadAsync(host.TenantId, started.Id, token).ConfigureAwait(false);
                Assert.True(rolledBack.Status == CanaryStatusEnum.RolledBack && rolledBack.CurrentStepIndex == 0 && rolledBack.CompletedUtc.HasValue, "Rolled back at step one: " + Serializer.Serialize(rolledBack));
                Assert.True(rolledBack.RollbackReason != null && rolledBack.RollbackReason.Contains("80 percent", StringComparison.Ordinal) && rolledBack.RollbackReason.Contains("4 of 5", StringComparison.Ordinal), "The reason gives the error rate: " + rolledBack.RollbackReason);
                await WeightsAsync(host, candidate, baseline, 0, 300, "The weights are back where they started", token).ConfigureAwait(false);
                Assert.True(!await canaries.SweepAsync(token).ConfigureAwait(false), "A rolled-back release is not evaluated again");

                DateTime deadline = DateTime.UtcNow.AddSeconds(30);
                while (receiver.For("/canary").Count < 1)
                {
                    if (DateTime.UtcNow > deadline) throw new TestAssertionException("The CanaryRolledBack notification did not arrive.");
                    await notifications.SweepAsync(token).ConfigureAwait(false);
                    await notifications.DispatchOnceAsync(token).ConfigureAwait(false);
                    await Task.Delay(200, token).ConfigureAwait(false);
                }
                WebhookReceipt receipt = receiver.For("/canary").Single();
                Assert.Equal(WebhookSignatureResultEnum.Valid, WebhookSigner.Verify(receipt.Signature, endpoint.SigningSecret, receipt.Body, DateTime.UtcNow, 300), "Signed with the endpoint secret");
                NotificationPayload payload = Assert.NotNull(Serializer.Deserialize<NotificationPayload>(Encoding.UTF8.GetString(receipt.Body)), "Payload parses");
                Assert.True(payload.Event == NotificationEventEnum.CanaryRolledBack && payload.Canary != null && payload.Canary.ReleaseId == started.Id && payload.Canary.AgentName == agent.Name && payload.Canary.CandidateDeploymentName == candidate.Name && payload.Canary.Step == 1 && payload.Canary.StepCount == 3 && payload.Canary.Reason == rolledBack.RollbackReason, "The payload names the release, step, and reason: " + Serializer.Serialize(payload));
                await notifications.SweepAsync(token).ConfigureAwait(false);
                await notifications.DispatchOnceAsync(token).ConfigureAwait(false);
                Assert.Equal(1, receiver.For("/canary").Count, "One notification per rollback");
            }
        }

        private static async Task PromoteAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await AgentAsync(host, "canary-healthy", token).ConfigureAwait(false);
                Deployment baseline = await DeploymentAsync(host, agent, "canary-healthy-stable", 100, token).ConfigureAwait(false);
                Deployment candidate = await DeploymentAsync(host, agent, "canary-healthy-next", 0, token).ConfigureAwait(false);
                CanaryRelease started = await StartAsync(host, agent, candidate, baseline, 10, token, Step(25, 2, 0), Step(60, 2, 0), Step(100, 2, 0)).ConfigureAwait(false);
                await WeightsAsync(host, candidate, baseline, 250, 750, "Step one is 25 percent", token).ConfigureAwait(false);
                CanaryService canaries = host.Server.Context.Get<CanaryService>();

                // Shadow and eval runs on the candidate are not its traffic and never count.
                await RunsAsync(host, agent, candidate, RunStatusEnum.Failed, 3, RunKindEnum.Shadow, token).ConfigureAwait(false);
                await RunsAsync(host, agent, candidate, RunStatusEnum.Failed, 3, RunKindEnum.Eval, token).ConfigureAwait(false);
                Assert.True(!await canaries.SweepAsync(token).ConfigureAwait(false), "Only shadow and eval runs so far: the step waits");

                int[][] expected = { new[] { 600, 400 }, new[] { 1000, 0 } };
                for (int step = 0; step < 2; step++)
                {
                    await RunsAsync(host, agent, candidate, RunStatusEnum.Succeeded, 2, RunKindEnum.Invoke, token).ConfigureAwait(false);
                    CanaryStepDecision advanced = await canaries.EvaluateAsync(await canaries.ReadAsync(host.TenantId, started.Id, token).ConfigureAwait(false), token).ConfigureAwait(false);
                    Assert.Equal(CanaryDecisionEnum.Advance, advanced.Decision, "Step " + (step + 1) + " advances: " + advanced.Reason);
                    CanaryRelease current = await canaries.ReadAsync(host.TenantId, started.Id, token).ConfigureAwait(false);
                    Assert.True(current.CurrentStepIndex == step + 1 && current.Status == CanaryStatusEnum.Running && current.StepStartedUtc > started.StepStartedUtc, "Now at step " + (step + 2) + ": " + Serializer.Serialize(current));
                    await WeightsAsync(host, candidate, baseline, expected[step][0], expected[step][1], "Weights for step " + (step + 2), token).ConfigureAwait(false);
                    Assert.Equal(CanaryDecisionEnum.Wait, (await canaries.EvaluateAsync(current, token).ConfigureAwait(false)).Decision, "Runs of the previous step do not count toward the next");
                    await Task.Delay(30, token).ConfigureAwait(false);
                }

                await RunsAsync(host, agent, candidate, RunStatusEnum.Succeeded, 2, RunKindEnum.Invoke, token).ConfigureAwait(false);
                Assert.True(await canaries.SweepAsync(token).ConfigureAwait(false), "The last step passes");
                CanaryRelease promoted = await canaries.ReadAsync(host.TenantId, started.Id, token).ConfigureAwait(false);
                Assert.True(promoted.Status == CanaryStatusEnum.Promoted && promoted.CompletedUtc.HasValue && promoted.RollbackReason == null, "Promoted: " + Serializer.Serialize(promoted));
                await WeightsAsync(host, candidate, baseline, 1000, 0, "The candidate takes all of the traffic", token).ConfigureAwait(false);
                Assert.True(!await canaries.SweepAsync(token).ConfigureAwait(false), "A promoted release is not evaluated again");
            }
        }

        private static async Task EvalGateAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await AgentAsync(host, "canary-gated", token).ConfigureAwait(false);
                Deployment baseline = await DeploymentAsync(host, agent, "canary-gated-stable", 100, token).ConfigureAwait(false);
                Deployment candidate = await DeploymentAsync(host, agent, "canary-gated-next", 100, token).ConfigureAwait(false);
                EvalSet set = await host.Server.Context.Database.EvalSets.CreateAsync(new EvalSet { TenantId = host.TenantId, Name = "canary-gate" }, token).ConfigureAwait(false);
                CanaryRelease body = Body(agent, candidate, baseline, 10, Step(100, 0, 0));
                body.MinEvalScore = 0.8;
                body.EvalSetId = set.Id;
                CanaryRelease started = await HttpTestHelpers.SendAsync<CanaryRelease>(host.AdminClient, HttpMethod.Post, T(host) + "/canary-releases", body, 201, token).ConfigureAwait(false);
                CanaryService canaries = host.Server.Context.Get<CanaryService>();
                CanaryStepDecision waiting = await canaries.EvaluateAsync(await canaries.ReadAsync(host.TenantId, started.Id, token).ConfigureAwait(false), token).ConfigureAwait(false);
                Assert.True(waiting.Decision == CanaryDecisionEnum.Wait && waiting.Reason.Contains(set.Id, StringComparison.Ordinal), "Without an eval run the release waits: " + waiting.Reason);

                await host.Server.Context.Database.EvalRuns.CreateAsync(new EvalRun { TenantId = host.TenantId, SetId = set.Id, SetName = set.Name, SetVersion = 1, TargetType = EvalRunTargetEnum.Deployment, AgentId = agent.Id, DeploymentId = baseline.Id, Status = EvalRunStatusEnum.Completed, Score = 0.1, CompletedUtc = DateTime.UtcNow }, token).ConfigureAwait(false);
                Assert.Equal(CanaryDecisionEnum.Wait, (await canaries.EvaluateAsync(await canaries.ReadAsync(host.TenantId, started.Id, token).ConfigureAwait(false), token).ConfigureAwait(false)).Decision, "An eval run of the baseline does not gate the candidate");
                await host.Server.Context.Database.EvalRuns.CreateAsync(new EvalRun { TenantId = host.TenantId, SetId = set.Id, SetName = set.Name, SetVersion = 1, TargetType = EvalRunTargetEnum.Deployment, AgentId = agent.Id, DeploymentId = candidate.Id, Status = EvalRunStatusEnum.Completed, Score = 0.5, CompletedUtc = DateTime.UtcNow.AddSeconds(1) }, token).ConfigureAwait(false);
                Assert.True(await canaries.SweepAsync(token).ConfigureAwait(false), "A low score rolls the release back");
                CanaryRelease rolledBack = await canaries.ReadAsync(host.TenantId, started.Id, token).ConfigureAwait(false);
                Assert.True(rolledBack.Status == CanaryStatusEnum.RolledBack && rolledBack.RollbackReason!.Contains("0.5", StringComparison.Ordinal), "Rolled back on the eval score: " + rolledBack.RollbackReason);
                await WeightsAsync(host, candidate, baseline, 100, 100, "Weights restored", token).ConfigureAwait(false);
            }
        }

        private static async Task RoutesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string b = "/v1.0/api/tenants/{tenantId}/canary-releases";
                Assert.True(host.Server.Context.Scopes.Find("GET", b) != null && host.Server.Context.Scopes.Find("POST", b) != null && host.Server.Context.Scopes.Find("GET", b + "/{releaseId}") != null && host.Server.Context.Scopes.Find("POST", b + "/{releaseId}/abort") != null, "Every canary route is in the scope map");
                foreach (string name in new[] { "garrison_list_canary_releases", "garrison_get_canary_release", "garrison_start_canary", "garrison_abort_canary" })
                    Assert.True(host.Server.Context.Scopes.Find("MCP", name) != null, name + " scope is registered");

                Agent agent = await AgentAsync(host, "canary-routes", token).ConfigureAwait(false);
                Agent other = await AgentAsync(host, "canary-other", token).ConfigureAwait(false);
                Deployment baseline = await DeploymentAsync(host, agent, "canary-routes-stable", 100, token).ConfigureAwait(false);
                Deployment candidate = await DeploymentAsync(host, agent, "canary-routes-next", 50, token).ConfigureAwait(false);
                Deployment foreignAgent = await DeploymentAsync(host, other, "canary-other-a", 100, token).ConfigureAwait(false);

                await ExpectAsync(host, Body(agent, candidate, baseline, 5, Step(50, 1, 0), Step(20, 1, 0), Step(100, 1, 0)), 400, "NotIncreasing", token).ConfigureAwait(false);
                await ExpectAsync(host, Body(agent, candidate, baseline, 5, Step(10, 1, 0), Step(50, 1, 0)), 400, "LastStepNotFull", token).ConfigureAwait(false);
                await ExpectAsync(host, Body(agent, candidate, baseline, 5), 400, "Required", token).ConfigureAwait(false);
                await ExpectAsync(host, Body(agent, baseline, baseline, 5, Step(100, 1, 0)), 400, "SameDeployment", token).ConfigureAwait(false);
                await ExpectAsync(host, Body(agent, foreignAgent, baseline, 5, Step(100, 1, 0)), 400, "DifferentAgent", token).ConfigureAwait(false);
                CanaryRelease halfGate = Body(agent, candidate, baseline, 5, Step(100, 1, 0));
                halfGate.MinEvalScore = 0.5;
                await ExpectAsync(host, halfGate, 400, "EvalGateIncomplete", token).ConfigureAwait(false);
                await ExpectAsync(host, new CanaryRelease { AgentId = "agt_missing", CandidateDeploymentId = candidate.Id, BaselineDeploymentId = baseline.Id, Steps = new List<CanaryReleaseStep> { Step(100, 1, 0) } }, 400, "AgentNotFound", token).ConfigureAwait(false);

                CanaryRelease started = await HttpTestHelpers.SendAsync<CanaryRelease>(host.AdminClient, HttpMethod.Post, T(host) + "/canary-releases", new CanaryRelease { AgentId = agent.Name, CandidateDeploymentId = candidate.Name, BaselineDeploymentId = baseline.Name, Steps = new List<CanaryReleaseStep> { Step(20, 10, 10), Step(100, 10, 10) } }, 201, token).ConfigureAwait(false);
                Assert.True(started.AgentId == agent.Id && started.CandidateDeploymentId == candidate.Id && started.Steps.Count == 2 && started.MaxErrorRatePercent == 5 && started.CandidateInitialWeight == 50, "Names resolve and defaults apply: " + Serializer.Serialize(started));
                await WeightsAsync(host, candidate, baseline, 200, 800, "Step one applied", token).ConfigureAwait(false);
                await ExpectAsync(host, Body(agent, candidate, baseline, 5, Step(100, 1, 0)), 409, "CanaryAlreadyRunning", token).ConfigureAwait(false);

                EnumerationResult<CanaryRelease> byAgent = await HttpTestHelpers.SendAsync<EnumerationResult<CanaryRelease>>(host.AdminClient, HttpMethod.Get, T(host) + "/canary-releases?agent=" + agent.Id + "&status=Running", null, 200, token).ConfigureAwait(false);
                Assert.True(byAgent.TotalRecords == 1 && byAgent.Objects[0].Id == started.Id && byAgent.Objects[0].Steps.Count == 2, "Filter by agent and status, with steps");
                Assert.Equal(started.Id, (await HttpTestHelpers.SendAsync<CanaryRelease>(host.AdminClient, HttpMethod.Get, T(host) + "/canary-releases/" + started.Id, null, 200, token).ConfigureAwait(false)).Id, "Read one");

                CanaryRelease aborted = await HttpTestHelpers.SendAsync<CanaryRelease>(host.AdminClient, HttpMethod.Post, T(host) + "/canary-releases/" + started.Id + "/abort", new CanaryAbortRequest { Reason = "Pausing the release." }, 200, token).ConfigureAwait(false);
                Assert.True(aborted.Status == CanaryStatusEnum.Aborted && aborted.RollbackReason == "Pausing the release.", "Aborted with the reason");
                await WeightsAsync(host, candidate, baseline, 50, 100, "Abort restores the weights", token).ConfigureAwait(false);
                TestResponse again = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/canary-releases/" + started.Id + "/abort", null, token).ConfigureAwait(false);
                Assert.True(again.StatusCode == 409 && again.Body.Contains("CanaryNotRunning", StringComparison.Ordinal), "Aborting twice is a conflict: " + again.Body);

                CanaryRelease foreign = new CanaryRelease { TenantId = "ten_elsewhere", AgentId = "agt_x", CandidateDeploymentId = "dep_x", BaselineDeploymentId = "dep_y", Steps = new List<CanaryReleaseStep> { Step(100, 0, 0) } };
                await host.Server.Context.Database.CanaryReleases.CreateAsync(foreign, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/canary-releases/" + foreign.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's release answers 404");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/canary-releases/" + foreign.Id + "/abort", null, token).ConfigureAwait(false)).StatusCode, "Another tenant's release cannot be aborted");

                await KeeperSuite.UserAsync(host, "canary-viewer@example.com", "Viewer", token).ConfigureAwait(false);
                using (HttpClient viewer = await host.UserClientAsync("canary-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Get, T(host) + "/canary-releases", null, token).ConfigureAwait(false)).StatusCode, "A Viewer lists releases");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Post, T(host) + "/canary-releases", Body(agent, candidate, baseline, 5, Step(100, 1, 0)), token).ConfigureAwait(false)).StatusCode, "A Viewer cannot start one");
                }

                using (TestMcpClient person = new TestMcpClient())
                {
                    await person.ConnectAsync(host, null, token).ConfigureAwait(false);
                    CanaryRelease viaMcp = await person.CallAsync<CanaryRelease>("garrison_start_canary", new { agent = agent.Name, candidateDeployment = candidate.Name, baselineDeployment = baseline.Name, steps = new[] { new { weightPercent = 50, minimumRuns = 1, minimumMinutes = 0 }, new { weightPercent = 100, minimumRuns = 1, minimumMinutes = 0 } }, maxErrorRatePercent = 10 }, token).ConfigureAwait(false);
                    Assert.True(viaMcp.Status == CanaryStatusEnum.Running && viaMcp.Steps.Count == 2 && viaMcp.MaxErrorRatePercent == 10, "People start a release over MCP: " + Serializer.Serialize(viaMcp));
                    Assert.Equal(viaMcp.Id, (await person.CallAsync<CanaryRelease>("garrison_get_canary_release", new { releaseId = viaMcp.Id }, token).ConfigureAwait(false)).Id, "and read it");
                    Assert.True((await person.CallAsync<EnumerationResult<CanaryRelease>>("garrison_list_canary_releases", new { agent = agent.Id }, token).ConfigureAwait(false)).Objects.Any(r => r.Id == viaMcp.Id), "and list it");
                    Assert.Equal(CanaryStatusEnum.Aborted, (await person.CallAsync<CanaryRelease>("garrison_abort_canary", new { releaseId = viaMcp.Id, reason = "Done testing." }, token).ConfigureAwait(false)).Status, "and abort it");
                    await person.ExpectErrorAsync("garrison_abort_canary", new { releaseId = viaMcp.Id }, "CanaryNotRunning", token).ConfigureAwait(false);
                }

                Run run = OrganizationSuite.RunOf(host, agent);
                run.DeploymentId = baseline.Id;
                run.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5);
                run = await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
                using (TestMcpClient runClient = await OrganizationSuite.RunClientAsync(host, run, token).ConfigureAwait(false))
                {
                    ProviderToolPage tools = await runClient.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(!tools.Tools.Any(t => t.Name.Contains("canary", StringComparison.Ordinal) || t.Name.Contains("shadow_trial", StringComparison.Ordinal)), "Run tokens are not shown the release tools");
                    await runClient.ExpectErrorAsync("garrison_start_canary", new { agent = agent.Name, candidateDeployment = candidate.Name, baselineDeployment = baseline.Name, steps = new[] { new { weightPercent = 100 } } }, "Forbidden", token).ConfigureAwait(false);
                }
            }
        }

        private static CanaryRelease Release(DateTime start, double maxErrorRate, params CanaryReleaseStep[] steps)
        {
            CanaryRelease release = new CanaryRelease();
            release.Steps = steps.ToList();
            release.CreatedUtc = start;
            release.StepStartedUtc = start;
            release.MaxErrorRatePercent = maxErrorRate;
            return release;
        }

        private static CanaryReleaseStep Step(int percent, int runs, int minutes)
        {
            return new CanaryReleaseStep { WeightPercent = percent, MinimumRuns = runs, MinimumMinutes = minutes };
        }

        private static CanaryRelease Body(Agent agent, Deployment candidate, Deployment baseline, double maxErrorRate, params CanaryReleaseStep[] steps)
        {
            return new CanaryRelease { AgentId = agent.Id, CandidateDeploymentId = candidate.Id, BaselineDeploymentId = baseline.Id, MaxErrorRatePercent = maxErrorRate, Steps = steps.ToList() };
        }

        private static async Task<CanaryRelease> StartAsync(TestServerHost host, Agent agent, Deployment candidate, Deployment baseline, double maxErrorRate, CancellationToken token, params CanaryReleaseStep[] steps)
        {
            return await HttpTestHelpers.SendAsync<CanaryRelease>(host.AdminClient, HttpMethod.Post, T(host) + "/canary-releases", Body(agent, candidate, baseline, maxErrorRate, steps), 201, token).ConfigureAwait(false);
        }

        private static async Task ExpectAsync(TestServerHost host, CanaryRelease body, int status, string code, CancellationToken token)
        {
            TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/canary-releases", body, token).ConfigureAwait(false);
            Assert.True(response.StatusCode == status && response.Body.Contains(code, StringComparison.Ordinal), "Expected " + status + " " + code + ", got " + response.StatusCode + ": " + response.Body);
        }

        private static async Task WeightsAsync(TestServerHost host, Deployment candidate, Deployment baseline, int candidateWeight, int baselineWeight, string what, CancellationToken token)
        {
            Deployment c = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadAsync(host.TenantId, candidate.Id, token).ConfigureAwait(false), "Candidate");
            Deployment b = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadAsync(host.TenantId, baseline.Id, token).ConfigureAwait(false), "Baseline");
            Assert.True(c.Weight == candidateWeight && b.Weight == baselineWeight, what + ": candidate " + c.Weight + " (expected " + candidateWeight + "), baseline " + b.Weight + " (expected " + baselineWeight + ")");
        }

        private static async Task RunsAsync(TestServerHost host, Agent agent, Deployment deployment, RunStatusEnum status, int count, RunKindEnum kind, CancellationToken token)
        {
            await Task.Delay(20, token).ConfigureAwait(false);
            for (int i = 0; i < count; i++)
            {
                Run run = new Run();
                run.Id = IdGenerator.NewRunId();
                run.TenantId = host.TenantId;
                run.AgentId = agent.Id;
                run.AgentName = agent.Name;
                run.DeploymentId = deployment.Id;
                run.Kind = kind;
                run.Status = status;
                run.CompletedUtc = DateTime.UtcNow;
                run.CallerType = PrincipalTypeEnum.Administrator;
                await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
            }
        }

        private static async Task<Agent> AgentAsync(TestServerHost host, string name, CancellationToken token)
        {
            return await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = name }, token).ConfigureAwait(false);
        }

        private static async Task<Deployment> DeploymentAsync(TestServerHost host, Agent agent, string name, int weight, CancellationToken token)
        {
            return await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = name, AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake", Weight = weight }, token).ConfigureAwait(false);
        }

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        #endregion
    }
}
