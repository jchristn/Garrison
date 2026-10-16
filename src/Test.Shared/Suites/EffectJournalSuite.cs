namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.ProviderHarness;
    using Garrison.Core.Models;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Fault boundaries for the durable effect protocol, tested against each real database provider.</summary>
    public static class EffectJournalSuite
    {
        /// <summary>Build journal fault-boundary regression suites.</summary>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            suites.Add(new TestSuiteDescriptor("effect-journal-classification", "Conservative effect metadata", new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("effect-journal-classification", "annotation-conflicts", "Missing and conflicting hints stay effectful; idempotent mutations still require journaling", AnnotationRulesAsync),
                new TestCaseDescriptor("effect-journal-classification", "harness-unknown-coverage", "Harness parser metadata never lets optimistic hints hide shell or network effects", HarnessRulesAsync)
            }));
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "effect-journal-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Effect journal and epoch fencing", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "snapshot-recovery", "Accepted current-epoch session snapshots cover completed effects; older epochs and new dispatches cannot reuse them", ct => SnapshotRecoveryAsync(provider, ct)),
                    new TestCaseDescriptor(id, "sink-at-most-once", "Actual lease reaping never repeats an external mutation under AtMostOnce", ct => PolicySinkAsync(provider, DeploymentEffectPolicyEnum.AtMostOnce, ct)),
                    new TestCaseDescriptor(id, "sink-at-least-once", "Actual lease reaping under AtLeastOnce exposes and tags each duplicate mutation", ct => PolicySinkAsync(provider, DeploymentEffectPolicyEnum.AtLeastOnce, ct)),
                    new TestCaseDescriptor(id, "sink-journaled", "Actual Journaled recovery never repeats an external mutation with an uncertain outcome", ct => PolicySinkAsync(provider, DeploymentEffectPolicyEnum.Journaled, ct)),
                    new TestCaseDescriptor(id, "before-dispatch", "A crash before dispatch leaves Authorized; only trusted known coverage permits replay", ct => BoundaryAsync(provider, EffectOperationStateEnum.Authorized, ct)),
                    new TestCaseDescriptor(id, "after-dispatch", "A crash after dispatch leaves an unresolved effect and forbids replay", ct => BoundaryAsync(provider, EffectOperationStateEnum.Dispatched, ct)),
                    new TestCaseDescriptor(id, "unknown-outcome", "An uncertain destination outcome prevents checkpoint and replay", ct => BoundaryAsync(provider, EffectOperationStateEnum.Unknown, ct)),
                    new TestCaseDescriptor(id, "after-completion", "A destination mutation committed before worker reporting is never automatically repeated", ct => BoundaryAsync(provider, EffectOperationStateEnum.Completed, ct)),
                    new TestCaseDescriptor(id, "expired-run-token", "A partitioned worker token stops working at lease expiry before the reaper runs", ct => TokenFencingAsync(provider, ct)),
                    new TestCaseDescriptor(id, "stale-epoch", "Expired and replaced attempts cannot authorize or dispatch gateway operations", ct => FencingAsync(provider, ct))
                }));
            }
            return suites;
        }

        private static Task AnnotationRulesAsync(CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            Assert.Equal(EffectOperationClassificationEnum.Effectful, EffectClassificationRules.Classify(null), "Missing annotations count as effectful");
            EffectToolMetadata optimistic = new EffectToolMetadata { ReadOnlyHint = true, IdempotentHint = true, DestructiveHint = true };
            Assert.Equal(EffectOperationClassificationEnum.Effectful, EffectClassificationRules.Classify(optimistic), "Destructive hint overrides optimistic annotations");
            Assert.True(EffectClassificationRules.RequiresJournal(OperationTypeEnum.Read, false, optimistic), "Contradictory read tool cannot bypass journal");
            EffectToolMetadata idempotent = new EffectToolMetadata { IdempotentHint = true, DestructiveHint = false };
            Assert.Equal(EffectOperationClassificationEnum.Idempotent, EffectClassificationRules.Classify(idempotent), "Idempotent mutation identified separately");
            Assert.True(EffectClassificationRules.RequiresJournal(OperationTypeEnum.Update, false, idempotent), "Idempotence cannot hide uncertain dispatch outcomes");
            EffectToolMetadata read = new EffectToolMetadata { ReadOnlyHint = true, DestructiveHint = false };
            Assert.True(!EffectClassificationRules.RequiresJournal(OperationTypeEnum.Read, false, read), "Trusted read-only hosted tool may skip effect intent");
            Assert.True(EffectClassificationRules.RequiresJournal(OperationTypeEnum.Execute, true, read), "Agent execution cannot claim read-only scope");
            return Task.CompletedTask;
        }

        private static Task HarnessRulesAsync(CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            EffectToolMetadata read = new EffectToolMetadata { ReadOnlyHint = true, IdempotentHint = true, DestructiveHint = false };
            HarnessProfile profile = new HarnessProfile { HarnessType = HarnessTypeEnum.ClaudeCode, OutputParser = OutputParserEnum.ClaudeStreamJson };
            foreach (string operation in new[] { "Bash", "shell_command", "functions.exec_command", "WebFetch", "http_request", "direct_network" })
                Assert.Equal(EffectOperationClassificationEnum.UnknownCoverage, EffectClassificationRules.ClassifyHarnessOperation(profile, operation, read), "Shell/network cannot borrow a safe annotation: " + operation);
            Assert.Equal(EffectOperationClassificationEnum.ReadOnly, EffectClassificationRules.ClassifyHarnessOperation(profile, "Read", read), "Structured parser may describe an observed read without proving complete harness coverage");
            profile.OutputParser = OutputParserEnum.PlainText;
            Assert.Equal(EffectOperationClassificationEnum.UnknownCoverage, EffectClassificationRules.ClassifyHarnessOperation(profile, "Read", read), "Unstructured output cannot establish observed tool coverage");
            profile.OutputParser = OutputParserEnum.GenericJsonl;
            Assert.Equal(EffectOperationClassificationEnum.Effectful, EffectClassificationRules.ClassifyHarnessOperation(profile, "unclassified"), "Custom JSON tool without hints remains effectful");
            return Task.CompletedTask;
        }

        private static async Task BoundaryAsync(DatabaseTypeEnum provider, EffectOperationStateEnum state, CancellationToken token)
        {
            using (EffectSinkHost sink = new EffectSinkHost())
            using (HttpClient client = new HttpClient())
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                Run run = await NewRunAsync(db, host.TenantId, token).ConfigureAwait(false);
                Assert.True(!await db.EffectOperations.RecoverySafeAsync(run.TenantId, run.Id, run.LeaseEpoch, token).ConfigureAwait(false), "Empty journal is unknown shell/network coverage");
                Assert.True(await db.EffectOperations.CheckpointAsync(run.TenantId, run.Id, run.LeaseEpoch, false, token).ConfigureAwait(false), "Unknown-coverage checkpoint persists");
                Assert.True(!await db.EffectOperations.RecoverySafeAsync(run.TenantId, run.Id, run.LeaseEpoch, token).ConfigureAwait(false), "Unknown coverage fails closed");
                Assert.True(await db.EffectOperations.CheckpointAsync(run.TenantId, run.Id, run.LeaseEpoch, true, token).ConfigureAwait(false), "Trusted gateway-only checkpoint");
                EffectOperation operation = NewOperation(run);
                Assert.True(await db.EffectOperations.AuthorizeAsync(operation, token).ConfigureAwait(false), "Intent committed before destination dispatch");
                if (state != EffectOperationStateEnum.Authorized)
                {
                    Assert.True(await db.EffectOperations.TransitionAsync(run.TenantId, run.Id, operation.Id, run.LeaseEpoch, EffectOperationStateEnum.Authorized, EffectOperationStateEnum.Dispatched, null, token).ConfigureAwait(false), "Dispatch marker committed before side effect");
                    await MutateAsync(client, sink, operation.Id, "1", token).ConfigureAwait(false);
                    if (state != EffectOperationStateEnum.Dispatched)
                        Assert.True(await db.EffectOperations.TransitionAsync(run.TenantId, run.Id, operation.Id, run.LeaseEpoch, EffectOperationStateEnum.Dispatched, state, state == EffectOperationStateEnum.Completed ? "sink:" + operation.Id : null, token).ConfigureAwait(false), "Persist dispatch outcome");
                }
                bool safe = await db.EffectOperations.RecoverySafeAsync(run.TenantId, run.Id, run.LeaseEpoch, token).ConfigureAwait(false);
                Assert.Equal(state == EffectOperationStateEnum.Authorized, safe, "Only never-dispatched effect permits automatic prompt replay");
                Assert.Equal(state == EffectOperationStateEnum.Unknown || state == EffectOperationStateEnum.Dispatched,
                    await db.EffectOperations.HasUncertainAsync(run.TenantId, run.Id, run.LeaseEpoch, token).ConfigureAwait(false), "Uncertainty classification");
                if (safe) await MutateAsync(client, sink, operation.Id, "2", token).ConfigureAwait(false);
                Assert.Equal(1, sink.Receipts.Count, "Sink observes exactly one mutation across the simulated loss and allowed replay");
                EffectOperation persisted = (await db.EffectOperations.ListAsync(run.TenantId, run.Id, token).ConfigureAwait(false)).Single();
                Assert.Equal(state, persisted.State, "Crash boundary survives a database read");
                Assert.Equal(0, (await db.EffectOperations.ListAsync("another-tenant", run.Id, token).ConfigureAwait(false)).Count, "Cross-tenant journal hidden");
                if (state == EffectOperationStateEnum.Unknown || state == EffectOperationStateEnum.Dispatched)
                    Assert.True(!await db.EffectOperations.CheckpointAsync(run.TenantId, run.Id, run.LeaseEpoch, true, token).ConfigureAwait(false), "Cannot hide unresolved effects behind a later checkpoint");
            }
        }

        private static async Task MutateAsync(HttpClient client, EffectSinkHost sink, string operationId, string attempt, CancellationToken token)
        {
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, sink.Url))
            {
                request.Headers.Add("Idempotency-Key", operationId);
                request.Headers.Add("X-Garrison-Attempt", attempt);
                using (HttpResponseMessage response = await client.SendAsync(request, token).ConfigureAwait(false))
                    Assert.True(response.IsSuccessStatusCode, "External effect sink accepted tagged mutation");
            }
        }

        private static async Task SnapshotRecoveryAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                AdoDatabaseDriver db = (AdoDatabaseDriver)host.Server.Context.Database;
                Run run = await NewRunAsync(db, host.TenantId, token).ConfigureAwait(false);
                EffectOperation operation = NewOperation(run);
                Assert.True(await db.EffectOperations.AuthorizeAsync(operation, token).ConfigureAwait(false), "Authorize");
                Assert.True(await db.EffectOperations.TransitionAsync(run.TenantId, run.Id, operation.Id, run.LeaseEpoch, EffectOperationStateEnum.Authorized, EffectOperationStateEnum.Dispatched, null, token).ConfigureAwait(false), "Dispatch");
                Assert.True(await db.EffectOperations.TransitionAsync(run.TenantId, run.Id, operation.Id, run.LeaseEpoch, EffectOperationStateEnum.Dispatched, EffectOperationStateEnum.Completed, "sink:done", token).ConfigureAwait(false), "Complete");
                // Seed the trusted acceptance boundary established by the suspension transaction, after effects completed.
                await db.NonQueryAsync("INSERT INTO " + db.Table("run_checkpoints") + " (runid,tenantid,artifactid,sessionid,sessionformat,epoch,createdutc) VALUES (@run,@tenant,'art_fixture','session','fixture-v1',@epoch,@now)", command =>
                {
                    AdoDatabaseDriver.Add(command, "run", run.Id);
                    AdoDatabaseDriver.Add(command, "tenant", run.TenantId);
                    AdoDatabaseDriver.Add(command, "epoch", run.LeaseEpoch);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                }, token).ConfigureAwait(false);
                Assert.True(await db.EffectOperations.RecoverySafeAsync(run.TenantId, run.Id, run.LeaseEpoch, token).ConfigureAwait(false), "Accepted session snapshot covers completed effects");
                Assert.True(!await db.EffectOperations.RecoverySafeAsync(run.TenantId, run.Id, run.LeaseEpoch + 1, token).ConfigureAwait(false), "Older snapshot cannot prove absence of raw shell/network effects in a resumed attempt");
                EffectOperation newer = NewOperation(run);
                Assert.True(await db.EffectOperations.AuthorizeAsync(newer, token).ConfigureAwait(false), "New activity after saved checkpoint");
                Assert.True(!await db.EffectOperations.RecoverySafeAsync(run.TenantId, run.Id, run.LeaseEpoch, token).ConfigureAwait(false), "New activity requires a fresh checkpoint");
            }
        }

        private static async Task PolicySinkAsync(DatabaseTypeEnum provider, DeploymentEffectPolicyEnum policy, CancellationToken token)
        {
            using (EffectSinkHost sink = new EffectSinkHost())
            using (HttpClient client = new HttpClient())
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                Run run = await NewRunAsync(db, host.TenantId, token).ConfigureAwait(false);
                run.EffectPolicy = policy;
                run.Attempt = 1;
                run = await db.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                EffectOperation operation = NewOperation(run);
                Assert.True(await db.EffectOperations.AuthorizeAsync(operation, token).ConfigureAwait(false), "Persist effect intent");
                Assert.True(await db.EffectOperations.TransitionAsync(run.TenantId, run.Id, operation.Id, run.LeaseEpoch, EffectOperationStateEnum.Authorized, EffectOperationStateEnum.Dispatched, null, token).ConfigureAwait(false), "Commit dispatch marker");
                await MutateAsync(client, sink, operation.Id, "1", token).ConfigureAwait(false);
                // Fault injection: the destination committed but the attempt died before reporting completion.
                run.LeaseExpiresUtc = DateTime.UtcNow.AddSeconds(-1);
                await db.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                DateTime deadline = DateTime.UtcNow.AddSeconds(20);
                do
                {
                    await Task.Delay(100, token).ConfigureAwait(false);
                    run = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Run survived lease loss");
                }
                while (run.Status == RunStatusEnum.Running && DateTime.UtcNow < deadline);
                if (policy == DeploymentEffectPolicyEnum.AtLeastOnce)
                {
                    Assert.Equal(RunStatusEnum.Queued, run.Status, "AtLeastOnce permits another attempt");
                    await MutateAsync(client, sink, operation.Id, run.Attempt.ToString(System.Globalization.CultureInfo.InvariantCulture), token).ConfigureAwait(false);
                    Assert.Equal(2, sink.Receipts.Count, "Destination sees allowed duplicate");
                    Assert.Equal(2, sink.Receipts.Select(receipt => receipt.Attempt).Distinct().Count(), "Each duplicate is attributed to its attempt");
                    Assert.True(sink.Receipts.All(receipt => receipt.OperationId == operation.Id), "All duplicates carry stable operation identity");
                }
                else
                {
                    Assert.Equal(RunStatusEnum.Failed, run.Status, "Unsafe lost attempt ends rather than repeats effect");
                    Assert.Equal(RunOutcomeEnum.NodeLost, run.Outcome, "Unsafe recovery records NodeLost");
                    Assert.Equal(1, sink.Receipts.Count, "Destination mutation is never repeated");
                }
            }
        }

        private static async Task TokenFencingAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                Run run = await NewRunAsync(db, host.TenantId, token).ConfigureAwait(false);
                run.CallerType = PrincipalTypeEnum.Administrator;
                run.CallerId = "admin";
                run = await db.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                using (TestMcpClient mcp = new TestMcpClient())
                {
                    await mcp.ConnectAsync(host, null, token).ConfigureAwait(false);
                    ProviderToolPage page = await mcp.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(page.Tools.Single(tool => tool.Name == "garrison_get_run").Annotations?.ReadOnlyHint == true, "Hosted read metadata published in tools/list");
                    Assert.True(page.Tools.Single(tool => tool.Name == "garrison_start_run").Annotations?.ReadOnlyHint == false, "Executable tool is not advertised read-only");
                }
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(run, run.LeaseEpoch, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false);
                using (HttpClient client = new HttpClient())
                {
                    client.BaseAddress = new Uri(host.BaseUrl);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + bearer);
                    string path = "/v1.0/api/tenants/" + run.TenantId + "/runs/" + run.Id;
                    using (HttpResponseMessage initial = await client.GetAsync(path, token).ConfigureAwait(false))
                        Assert.Equal(200, (int)initial.StatusCode, "Current brokered run credential succeeds");
                    run.LeaseExpiresUtc = DateTime.UtcNow.AddSeconds(-1);
                    await db.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                    using (HttpResponseMessage expired = await client.GetAsync(path, token).ConfigureAwait(false))
                        Assert.Equal(401, (int)expired.StatusCode, "Partitioned worker credential is rejected even before session revocation");
                }
            }
        }

        private static async Task FencingAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                Run run = await NewRunAsync(db, host.TenantId, token).ConfigureAwait(false);
                EffectOperation operation = NewOperation(run);
                Assert.True(await db.EffectOperations.AuthorizeAsync(operation, token).ConfigureAwait(false), "Current epoch authorizes");
                run.LeaseEpoch++;
                run = await db.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                Assert.True(!await db.EffectOperations.TransitionAsync(run.TenantId, run.Id, operation.Id, operation.LeaseEpoch, EffectOperationStateEnum.Authorized, EffectOperationStateEnum.Dispatched, null, token).ConfigureAwait(false), "Old intent cannot dispatch after replacement");
                Assert.True(!await db.EffectOperations.AuthorizeAsync(operation, token).ConfigureAwait(false), "Stale epoch cannot authorize");
                Assert.True(await db.EffectOperations.AuthorizeAsync(NewOperation(run), token).ConfigureAwait(false), "Replacement epoch succeeds");
                run.LeaseExpiresUtc = DateTime.UtcNow.AddSeconds(-1);
                run = await db.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                Assert.True(!await db.EffectOperations.AuthorizeAsync(NewOperation(run), token).ConfigureAwait(false), "Expired lease fails before reaper runs");
                EffectOperation foreign = NewOperation(run);
                foreign.TenantId = "another-tenant";
                Assert.True(!await db.EffectOperations.AuthorizeAsync(foreign, token).ConfigureAwait(false), "Cross-tenant authorization fails");
            }
        }

        private static Task<Run> NewRunAsync(DatabaseDriverBase db, string tenantId, CancellationToken token)
        {
            return db.Runs.CreateAsync(new Run
            {
                TenantId = tenantId, AgentId = "agt_journal", DeploymentId = "dep_journal", Status = RunStatusEnum.Running,
                EffectPolicy = DeploymentEffectPolicyEnum.Journaled, LeaseEpoch = 7, LeaseNodeId = "nod_journal",
                LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5), StartedUtc = DateTime.UtcNow, MaxAttempts = 3
            }, token);
        }

        private static EffectOperation NewOperation(Run run)
        {
            return new EffectOperation { TenantId = run.TenantId, RunId = run.Id, LeaseEpoch = run.LeaseEpoch, Tool = "effect-sink", ArgumentDigest = new string('a', 64) };
        }
    }
}
