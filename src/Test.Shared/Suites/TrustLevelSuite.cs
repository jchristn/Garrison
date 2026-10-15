namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
    using Garrison.Worker.Execution;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Deployment trust level (P11.14): Untrusted runs only go to executors with at least Container isolation, queue with
    /// blockedReason NoIsolatingWorker until one registers, and a tenant can require Untrusted for every deployment.
    /// </summary>
    public static class TrustLevelSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("trust-level", "effective-requirement", "Effective requirement: Untrusted raises isolation to Container on top of the deployment's own requirements, never lowers it, and an unset executor resolves to KubernetesJob", EffectiveRequirementAsync),
                new TestCaseDescriptor("trust-level", "blocked-reason", "Blocked reason: an Untrusted run names missing isolation (NoIsolatingWorker); a missing other capability stays NoCapableWorker; Trusted runs keep their old reasons", BlockedReasonAsync)
            };
            suites.Add(new TestSuiteDescriptor("trust-level", "Deployment trust level", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "trust-level-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "queue-until-isolated", "An Untrusted run with only a Process worker stays Queued with NoIsolatingWorker over REST and MCP, then is leased to a worker with container isolation and succeeds (" + provider + ")", ct => QueueUntilIsolatedAsync(provider, ct)),
                    new TestCaseDescriptor(id, "trusted-unchanged", "A Trusted deployment's run uses the Process executor with no raised isolation and succeeds on a Process worker (" + provider + ")", ct => TrustedUnchangedAsync(provider, ct)),
                    new TestCaseDescriptor(id, "composed-claim", "Snapshot plus Untrusted needs both: candidate selection and the atomic claim refuse a container node without snapshots and a Process node with them (" + provider + ")", ct => ComposedClaimAsync(provider, ct)),
                    new TestCaseDescriptor(id, "tenant-policy", "requireUntrustedDeployments rejects creating and updating Trusted deployments with TenantRequiresUntrusted, leaves existing ones running, audits the change, and Untrusted on Process is UntrustedNeedsIsolation (" + provider + ")", ct => TenantPolicyAsync(provider, ct)),
                    new TestCaseDescriptor(id, "manifests", "Manifests round-trip trustLevel, export omits Trusted, and apply enforces the tenant policy with the field code (" + provider + ")", ct => ManifestsAsync(provider, ct)),
                    new TestCaseDescriptor(id, "mcp-management", "MCP management create and update carry trustLevel and reject a Trusted deployment under the tenant policy (" + provider + ")", ct => McpManagementAsync(provider, ct))
                };
                suites.Add(new TestSuiteDescriptor(id, "Deployment trust level (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task EffectiveRequirementAsync(CancellationToken token)
        {
            Deployment deployment = new Deployment();
            deployment.RequiredCapabilities.FilesystemSnapshot = true;
            ExecutorRequirements trusted = ExecutorCapabilityRules.Effective(deployment);
            Assert.True(trusted.Isolation == ExecutorIsolationEnum.Process && trusted.FilesystemSnapshot, "Trusted keeps the deployment's own requirement");
            deployment.TrustLevel = DeploymentTrustLevelEnum.Untrusted;
            ExecutorRequirements untrusted = ExecutorCapabilityRules.Effective(deployment);
            Assert.True(untrusted.Isolation == ExecutorIsolationEnum.Container && untrusted.FilesystemSnapshot, "Untrusted adds Container isolation on top");
            Assert.Equal(ExecutorIsolationEnum.Process, deployment.RequiredCapabilities.Isolation, "The deployment's stored requirement is not changed");
            deployment.RequiredCapabilities.Isolation = ExecutorIsolationEnum.SandboxedRuntime;
            Assert.Equal(ExecutorIsolationEnum.SandboxedRuntime, ExecutorCapabilityRules.Effective(deployment).Isolation, "A stronger requirement is kept");

            NodePool processPool = new NodePool { Name = "process-pool", DefaultExecutor = RunExecutorEnum.Process };
            Assert.Equal(RunExecutorEnum.KubernetesJob, RunExecutors.Resolve(new Deployment { TrustLevel = DeploymentTrustLevelEnum.Untrusted }, null), "Unset Untrusted executor resolves to KubernetesJob");
            Assert.Equal(RunExecutorEnum.KubernetesJob, RunExecutors.Resolve(new Deployment { TrustLevel = DeploymentTrustLevelEnum.Untrusted }, processPool), "A Process pool default is not used for Untrusted");
            Assert.Equal(RunExecutorEnum.Process, RunExecutors.Resolve(new Deployment(), processPool), "Trusted follows the pool default as before");
            Assert.Equal(RunExecutorEnum.Process, RunExecutors.Resolve(new Deployment(), null), "Trusted defaults to Process as before");

            Run run = new Run();
            Deployment admitted = new Deployment { TrustLevel = DeploymentTrustLevelEnum.Untrusted };
            ExecutorCapabilityRules.Admit(run, admitted, null);
            Assert.True(run.TrustLevel == DeploymentTrustLevelEnum.Untrusted && run.Executor == RunExecutorEnum.KubernetesJob && run.RequiredCapabilities.Isolation == ExecutorIsolationEnum.Container, "Admission records trust level, executor, and effective requirement");
            admitted.TrustLevel = DeploymentTrustLevelEnum.Trusted;
            Assert.Equal(ExecutorIsolationEnum.Container, run.RequiredCapabilities.Isolation, "Admitted requirements do not follow deployment edits");
            return Task.CompletedTask;
        }

        private static Task BlockedReasonAsync(CancellationToken token)
        {
            PlacementSnapshot snapshot = new PlacementSnapshot();
            snapshot.ReadyNodes.Add(NewNode("process", RunExecutorEnum.Process));
            Run untrusted = NewRun("ten_trust", new Deployment { TrustLevel = DeploymentTrustLevelEnum.Untrusted });
            Assert.Equal(RunBlockedReasonEnum.NoIsolatingWorker, BlockedRunService.Evaluate(snapshot, untrusted), "Process-only fleet blocks an Untrusted run on isolation");
            Assert.True(BlockedRunService.Describe(untrusted, RunBlockedReasonEnum.NoIsolatingWorker).Contains("Container isolation", StringComparison.Ordinal), "Description names the missing isolation");
            Assert.True(BlockedRunService.Cause(untrusted, RunBlockedReasonEnum.NoIsolatingWorker).Contains("Container isolation", StringComparison.Ordinal), "Cause names the missing isolation");

            Deployment snapshotting = new Deployment { TrustLevel = DeploymentTrustLevelEnum.Untrusted };
            snapshotting.RequiredCapabilities.FilesystemSnapshot = true;
            Run needsBoth = NewRun("ten_trust", snapshotting);
            snapshot.ReadyNodes.Add(NewNode("container", RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob));
            Assert.Equal(RunBlockedReasonEnum.NoCapableWorker, BlockedRunService.Evaluate(snapshot, needsBoth), "Isolation is available, so a missing snapshot capability stays NoCapableWorker");
            Assert.True(BlockedRunService.Evaluate(snapshot, untrusted) == null, "A container worker takes the Untrusted run");

            PlacementSnapshot processOnly = new PlacementSnapshot();
            processOnly.ReadyNodes.Add(NewNode("process", RunExecutorEnum.Process));
            Deployment explicitIsolation = new Deployment();
            explicitIsolation.RequiredCapabilities.Isolation = ExecutorIsolationEnum.Container;
            explicitIsolation.Executor = RunExecutorEnum.KubernetesJob;
            Assert.Equal(RunBlockedReasonEnum.NoCapableWorker, BlockedRunService.Evaluate(processOnly, NewRun("ten_trust", explicitIsolation)), "Trusted runs keep the existing reason");
            Assert.Equal(RunBlockedReasonEnum.NoReadyWorker, BlockedRunService.Evaluate(new PlacementSnapshot(), untrusted), "No Ready worker at all still wins");
            return Task.CompletedTask;
        }

        private static async Task QueueUntilIsolatedAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                DatabaseDriverBase db = host.Server.Context.Database;
                Agent agent = await cluster.CreateAgentAsync("untrusted-agent", "builtin/fake", null, token, d => d.TrustLevel = DeploymentTrustLevelEnum.Untrusted).ConfigureAwait(false);
                Run run = await InvokeAsync(host, agent, token).ConfigureAwait(false);
                Assert.True(run.TrustLevel == DeploymentTrustLevelEnum.Untrusted && run.Executor == RunExecutorEnum.KubernetesJob && run.RequiredCapabilities.Isolation == ExecutorIsolationEnum.Container, "Admission raises the requirement: " + run.TrustLevel + " " + run.Executor + " " + run.RequiredCapabilities.Isolation);

                // The Process worker long-polls for work throughout; give it several lease rounds to (wrongly) take the run.
                await Task.Delay(4000, token).ConfigureAwait(false);
                string path = "/v1.0/api/tenants/" + host.TenantId + "/runs/" + run.Id;
                Run waiting = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, path, null, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Queued, waiting.Status, "The Process worker never claims an Untrusted run");
                Assert.Equal(RunBlockedReasonEnum.NoIsolatingWorker, waiting.BlockedReason, "REST names the missing isolation");

                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                    McpRunSummary summary = await client.CallAsync<McpRunSummary>("garrison_get_run", new { tenantId = host.TenantId, runId = run.Id }, token).ConfigureAwait(false);
                    Assert.Equal("NoIsolatingWorker", summary.BlockedReason ?? String.Empty, "MCP names the missing isolation");
                }

                // A worker with container isolation registers; only it is leased the run.
                SchedulerService scheduler = host.Server.Context.Get<SchedulerService>();
                host.Server.Context.Get<BlockedRunService>().Invalidate();
                Node isolating = NewNode("isolating", RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob);
                isolating = await db.Nodes.CreateAsync(isolating, token).ConfigureAwait(false);
                NodeLeaseRequest request = new NodeLeaseRequest { NodeId = isolating.Id, MaxRuns = 4, WaitMs = 0 };
                RunAssignment? assignment = null;
                DateTime deadline = DateTime.UtcNow.AddSeconds(20);
                while (assignment == null && DateTime.UtcNow < deadline)
                {
                    NodeLeaseResponse leased = await scheduler.LeaseAsync(isolating, request, token).ConfigureAwait(false);
                    assignment = leased.Assignments.FirstOrDefault(a => a.RunId == run.Id);
                    if (assignment == null) await Task.Delay(200, token).ConfigureAwait(false);
                }
                if (assignment == null) throw new TestAssertionException("The isolating worker was not leased the Untrusted run.");
                Assert.Equal(RunExecutorEnum.KubernetesJob, assignment.Spec.Executor, "Spec executor");
                Assert.Equal(ExecutorIsolationEnum.Container, assignment.Spec.RequiredCapabilities?.Isolation ?? ExecutorIsolationEnum.Process, "Spec carries the raised isolation");

                RunEventService events = host.Server.Context.Get<RunEventService>();
                await events.StartedAsync(run.Id, new RunStartedRequest { NodeId = isolating.Id, Epoch = assignment.Epoch }, token).ConfigureAwait(false);
                RunCompleteRequest complete = new RunCompleteRequest();
                complete.NodeId = isolating.Id;
                complete.Epoch = assignment.Epoch;
                complete.Status = RunStatusEnum.Succeeded;
                complete.Outcome = RunOutcomeEnum.Succeeded;
                complete.ResultText = "isolated";
                await events.CompleteAsync(run.Id, complete, token).ConfigureAwait(false);
                Run finished = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, path, null, 200, token).ConfigureAwait(false);
                Assert.True(finished.Status == RunStatusEnum.Succeeded && finished.LeaseNodeId == isolating.Id && finished.BlockedReason == null, "Succeeded on the isolating worker");
            }
        }

        private static async Task TrustedUnchangedAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("trusted-agent", "builtin/fake", null, token).ConfigureAwait(false);
                EnumerationResult<Deployment> deployments = await host.Server.Context.Database.Deployments.EnumerateAsync(host.TenantId, new EnumerationQuery { MaxResults = 100 }, token).ConfigureAwait(false);
                Assert.Equal(DeploymentTrustLevelEnum.Trusted, deployments.Objects.Single(d => d.AgentId == agent.Id).TrustLevel, "New deployments default to Trusted");
                InvokeRequest request = new InvokeRequest();
                request.Input = "hello trusted";
                request.Wait = true;
                request.WaitSeconds = 60;
                Run run = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/agents/" + agent.Id + "/invoke", request, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Trusted run succeeds on the Process worker: " + run.ErrorMessage);
                Assert.True(run.TrustLevel == DeploymentTrustLevelEnum.Trusted && run.Executor == RunExecutorEnum.Process && run.RequiredCapabilities.Isolation == ExecutorIsolationEnum.Process, "Trusted placement is unchanged");
            }
        }

        private static async Task ComposedClaimAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                string tenant = "ten_trust_" + Guid.NewGuid().ToString("N");
                Deployment deployment = new Deployment { TrustLevel = DeploymentTrustLevelEnum.Untrusted };
                deployment.RequiredCapabilities.FilesystemSnapshot = true;
                Run run = await db.Runs.CreateAsync(NewRun(tenant, deployment), token).ConfigureAwait(false);
                Run stored = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Run read back");
                Assert.True(stored.TrustLevel == DeploymentTrustLevelEnum.Untrusted && stored.RequiredCapabilities.Isolation == ExecutorIsolationEnum.Container && stored.RequiredCapabilities.FilesystemSnapshot, "Stored effective requirement");

                Node container = NewNode("container-nosnap", RunExecutorEnum.KubernetesJob);
                container = await db.Nodes.CreateAsync(container, token).ConfigureAwait(false);
                Node processSnap = NewNode("process-snap", RunExecutorEnum.Process);
                processSnap.ExecutorCapabilities[0].FilesystemSnapshot = true;
                processSnap = await db.Nodes.CreateAsync(processSnap, token).ConfigureAwait(false);
                Node both = NewNode("container-snap", RunExecutorEnum.KubernetesJob);
                both.ExecutorCapabilities[0].FilesystemSnapshot = true;
                both = await db.Nodes.CreateAsync(both, token).ConfigureAwait(false);

                foreach (Node refused in new[] { container, processSnap })
                {
                    ClaimCandidateFilter filter = new ClaimCandidateFilter { AllowedTenantIds = new List<string> { tenant }, HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic }, Executors = RunExecutors.Of(refused), ExecutorCapabilities = ExecutorCapabilityRules.Of(refused) };
                    Assert.True(!(await db.Runs.ListClaimCandidatesAsync(filter, token).ConfigureAwait(false)).Any(r => r.Id == run.Id), "Candidate selection refuses " + refused.Name);
                    Assert.True(!(await db.Runs.TryClaimAsync(run.Id, refused.Id, refused.Name, DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false)).HasValue, "Atomic claim refuses " + refused.Name);
                }
                ClaimCandidateFilter capable = new ClaimCandidateFilter { AllowedTenantIds = new List<string> { tenant }, HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic }, Executors = RunExecutors.Of(both), ExecutorCapabilities = ExecutorCapabilityRules.Of(both) };
                Assert.True((await db.Runs.ListClaimCandidatesAsync(capable, token).ConfigureAwait(false)).Any(r => r.Id == run.Id), "Candidate selection accepts a container node with snapshots");
                Assert.True((await db.Runs.TryClaimAsync(run.Id, both.Id, both.Name, DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false)).HasValue, "Atomic claim accepts a container node with snapshots");
            }
        }

        private static async Task TenantPolicyAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string tenantPath = "/v1.0/api/tenants/" + host.TenantId;
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, tenantPath + "/agents", new Agent { Name = "policy-agent" }, 201, token).ConfigureAwait(false);
                HarnessProfile profile = await host.Server.Context.Database.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/fake", token).ConfigureAwait(false) ?? throw new TestAssertionException("No fake profile.");

                Deployment pinned = new Deployment { AgentId = agent.Id, Name = "untrusted-process", HarnessProfileId = profile.Id, TrustLevel = DeploymentTrustLevelEnum.Untrusted, Executor = RunExecutorEnum.Process };
                TestResponse processResponse = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", pinned, token).ConfigureAwait(false);
                Assert.Equal(400, processResponse.StatusCode, "Untrusted on Process is rejected");
                Assert.True(processResponse.Body.Contains("UntrustedNeedsIsolation", StringComparison.Ordinal) && processResponse.Body.Contains("executor", StringComparison.Ordinal), "Field code: " + processResponse.Body);

                Deployment existing = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", new Deployment { AgentId = agent.Id, Name = "legacy-trusted", HarnessProfileId = profile.Id }, 201, token).ConfigureAwait(false);
                Tenant tenant = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Put, tenantPath, new TenantRequest { RequireUntrustedDeployments = true }, 200, token).ConfigureAwait(false);
                Assert.True(tenant.RequireUntrustedDeployments, "Tenant policy set over REST");
                Tenant read = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Get, tenantPath, null, 200, token).ConfigureAwait(false);
                Assert.True(read.RequireUntrustedDeployments, "Tenant policy read over REST");
                Assert.True(await AuditedAsync(host, "requireUntrustedDeployments set to true", token).ConfigureAwait(false), "Tenant policy change audited");

                TestResponse created = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", new Deployment { AgentId = agent.Id, Name = "new-trusted", HarnessProfileId = profile.Id }, token).ConfigureAwait(false);
                Assert.Equal(400, created.StatusCode, "Creating a Trusted deployment is rejected");
                Assert.True(created.Body.Contains("TenantRequiresUntrusted", StringComparison.Ordinal) && created.Body.Contains("trustLevel", StringComparison.Ordinal), "Field code: " + created.Body);

                Deployment kept = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, tenantPath + "/deployments/" + existing.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(DeploymentTrustLevelEnum.Trusted, kept.TrustLevel, "The existing deployment is not rewritten");
                InvokeRequest invoke = new InvokeRequest { Input = "still admitted", Wait = false };
                TestResponse admitted = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/agents/" + agent.Id + "/invoke", invoke, token).ConfigureAwait(false);
                Assert.True(admitted.StatusCode == 200 || admitted.StatusCode == 202, "Existing Trusted deployment keeps running: " + admitted.StatusCode + " " + admitted.Body);
                Assert.Equal(DeploymentTrustLevelEnum.Trusted, (Serializer.Deserialize<Run>(admitted.Body) ?? throw new TestAssertionException("No run.")).TrustLevel, "Its runs stay Trusted");

                kept.Description = "edited";
                TestResponse unchanged = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, tenantPath + "/deployments/" + existing.Id, kept, token).ConfigureAwait(false);
                Assert.Equal(400, unchanged.StatusCode, "Updating while still Trusted is rejected");
                Assert.True(unchanged.Body.Contains("TenantRequiresUntrusted", StringComparison.Ordinal), "Update field code: " + unchanged.Body);
                kept.TrustLevel = DeploymentTrustLevelEnum.Untrusted;
                Deployment updated = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Put, tenantPath + "/deployments/" + existing.Id, kept, 200, token).ConfigureAwait(false);
                Assert.Equal(DeploymentTrustLevelEnum.Untrusted, updated.TrustLevel, "Update to Untrusted is accepted");
                Assert.True(await AuditedAsync(host, "Trust level changed from Trusted to Untrusted", token).ConfigureAwait(false), "Trust level change audited");

                await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Put, tenantPath, new TenantRequest { RequireUntrustedDeployments = false }, 200, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", new Deployment { AgentId = agent.Id, Name = "trusted-again", HarnessProfileId = profile.Id }, 201, token).ConfigureAwait(false);
            }
        }

        private static async Task ManifestsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string tenantPath = "/v1.0/api/tenants/" + host.TenantId;
                string manifest = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: manifest-trust\nspec:\n  description: Trust level manifest.\n---\n"
                    + "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: manifest-untrusted\nspec:\n  agent: manifest-trust\n  harnessProfile: builtin/fake\n  trustLevel: Untrusted\n  weight: 0\n---\n"
                    + "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: manifest-trusted\nspec:\n  agent: manifest-trust\n  harnessProfile: builtin/fake\n";
                ManifestApply applied = await ApplyAsync(host, manifest, 200, token).ConfigureAwait(false);
                Assert.Equal(0, applied.FailedCount, "Manifest applies");
                Deployment untrusted = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadByNameAsync(host.TenantId, "manifest-untrusted", token).ConfigureAwait(false), "Untrusted deployment");
                Deployment trusted = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadByNameAsync(host.TenantId, "manifest-trusted", token).ConfigureAwait(false), "Trusted deployment");
                Assert.True(untrusted.TrustLevel == DeploymentTrustLevelEnum.Untrusted && trusted.TrustLevel == DeploymentTrustLevelEnum.Trusted, "Manifest trust levels applied; omitted means Trusted");

                TestResponse export = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, tenantPath + "/manifests/export", null, token).ConfigureAwait(false);
                Assert.Equal(1, export.Body.Split("trustLevel:").Length - 1, "Export writes trustLevel only for the Untrusted deployment");
                Assert.True(export.Body.Contains("trustLevel: Untrusted", StringComparison.Ordinal), "Export carries Untrusted");
                ManifestApply reapplied = await ApplyAsync(host, export.Body, 200, token).ConfigureAwait(false);
                Assert.True(reapplied.FailedCount == 0 && reapplied.UpdatedCount == 0, "Exported manifest re-applies unchanged");

                string flip = "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: manifest-untrusted\nspec:\n  agent: manifest-trust\n  harnessProfile: builtin/fake\n  weight: 0\n";
                ManifestApply flipped = await ApplyAsync(host, flip, 200, token).ConfigureAwait(false);
                ManifestApplyItem change = flipped.Items.Single();
                Assert.True(change.Result == ManifestApplyResultEnum.Updated && change.Changes.Any(c => c.Field.Contains("trustLevel", StringComparison.Ordinal)), "Diff names trustLevel");

                await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Put, tenantPath, new TenantRequest { RequireUntrustedDeployments = true }, 200, token).ConfigureAwait(false);
                string rejected = "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: manifest-new-trusted\nspec:\n  agent: manifest-trust\n  harnessProfile: builtin/fake\n";
                ManifestApply failed = await ApplyAsync(host, rejected, 400, token).ConfigureAwait(false);
                ManifestApplyItem item = failed.Items.Single();
                Assert.True(item.Result == ManifestApplyResultEnum.Failed && item.ErrorCode == "TenantRequiresUntrusted" && item.ErrorField == "trustLevel", "Manifest apply enforces the policy: " + item.ErrorCode + " " + item.ErrorField + " " + item.Message);
                ManifestApply accepted = await ApplyAsync(host, rejected + "  trustLevel: Untrusted\n", 200, token).ConfigureAwait(false);
                Assert.Equal(1, accepted.CreatedCount, "Untrusted passes the policy");
            }
        }

        private static async Task McpManagementAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            using (TestMcpClient client = new TestMcpClient())
            {
                await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                Agent agent = await client.CallAsync<Agent>("garrison_create_agent", new { configuration = new Agent { Name = "mcp-trust" } }, token).ConfigureAwait(false);
                Deployment created = await client.CallAsync<Deployment>("garrison_create_deployment", new { configuration = new Deployment { Name = "mcp-untrusted", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake", TrustLevel = DeploymentTrustLevelEnum.Untrusted } }, token).ConfigureAwait(false);
                Assert.Equal(DeploymentTrustLevelEnum.Untrusted, created.TrustLevel, "MCP create carries trustLevel");
                created.TrustLevel = DeploymentTrustLevelEnum.Trusted;
                Deployment updated = await client.CallAsync<Deployment>("garrison_update_deployment", new { deploymentId = created.Id, configuration = created }, token).ConfigureAwait(false);
                Assert.Equal(DeploymentTrustLevelEnum.Trusted, updated.TrustLevel, "MCP update carries trustLevel");
                Assert.Equal(DeploymentTrustLevelEnum.Trusted, (await client.CallAsync<Deployment>("garrison_get_deployment", new { deploymentId = created.Id }, token).ConfigureAwait(false)).TrustLevel, "MCP read carries trustLevel");

                await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Put, "/v1.0/api/tenants/" + host.TenantId, new TenantRequest { RequireUntrustedDeployments = true }, 200, token).ConfigureAwait(false);
                await client.ExpectErrorAsync("garrison_update_deployment", new { deploymentId = created.Id, configuration = updated }, "ValidationFailed", token).ConfigureAwait(false);
                string error = String.Empty;
                try
                {
                    await client.CallAsync("garrison_create_deployment", new { configuration = new Deployment { Name = "mcp-trusted", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" } }, token).ConfigureAwait(false);
                }
                catch (TestAssertionException e)
                {
                    error = e.Message;
                }
                Assert.True(error.Contains("ValidationFailed", StringComparison.Ordinal) && error.Contains("trustLevel", StringComparison.Ordinal), "MCP error names the field: " + error);
                updated.TrustLevel = DeploymentTrustLevelEnum.Untrusted;
                Assert.Equal(DeploymentTrustLevelEnum.Untrusted, (await client.CallAsync<Deployment>("garrison_update_deployment", new { deploymentId = created.Id, configuration = updated }, token).ConfigureAwait(false)).TrustLevel, "MCP update to Untrusted passes the policy");
            }
        }

        private static async Task<bool> AuditedAsync(TestServerHost host, string fragment, CancellationToken token)
        {
            EnumerationResult<AuditRecord> page = await host.Server.Context.Database.Audit.EnumerateAsync(null, new EnumerationQuery { MaxResults = 500 }, token).ConfigureAwait(false);
            return page.Objects.Any(a => (a.Description ?? String.Empty).Contains(fragment, StringComparison.Ordinal));
        }

        private static async Task<Run> InvokeAsync(TestServerHost host, Agent agent, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = "untrusted input";
            request.Wait = false;
            TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
            if (response.StatusCode != 200 && response.StatusCode != 202) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
            return Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
        }

        private static async Task<ManifestApply> ApplyAsync(TestServerHost host, string yaml, int expectedStatus, CancellationToken token)
        {
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/manifests/apply"))
            {
                request.Content = new StringContent(yaml, Encoding.UTF8, "application/yaml");
                using (HttpResponseMessage response = await host.AdminClient.SendAsync(request, token).ConfigureAwait(false))
                {
                    string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    if ((int)response.StatusCode != expectedStatus) throw new TestAssertionException("Manifest apply returned " + (int)response.StatusCode + " (expected " + expectedStatus + "): " + body);
                    return Serializer.Deserialize<ManifestApply>(body) ?? throw new TestAssertionException("Empty apply response.");
                }
            }
        }

        private static Run NewRun(string tenantId, Deployment deployment)
        {
            Run run = new Run();
            run.TenantId = tenantId;
            run.AgentId = "agt_trust";
            run.AgentName = "trust";
            run.DeploymentId = "dep_trust";
            run.HarnessType = HarnessTypeEnum.Generic;
            run.Status = RunStatusEnum.Queued;
            run.QueuedUtc = DateTime.UtcNow;
            run.InputText = "hello";
            ExecutorCapabilityRules.Admit(run, deployment, null);
            return run;
        }

        private static Node NewNode(string name, params RunExecutorEnum[] executors)
        {
            Node node = new Node();
            node.Name = name + "-" + Guid.NewGuid().ToString("N").Substring(0, 6);
            node.Status = NodeStatusEnum.Ready;
            node.MaxConcurrentRuns = 8;
            node.LastHeartbeatUtc = DateTime.UtcNow;
            node.Capabilities.Add(new NodeCapability { NodeId = node.Id, HarnessType = HarnessTypeEnum.Generic, Available = true });
            node.Executors = executors.ToList();
            foreach (RunExecutorEnum executor in executors) node.ExecutorCapabilities.Add(ExecutorCapabilityProfiles.For(executor));
            return node;
        }

        #endregion
    }
}
