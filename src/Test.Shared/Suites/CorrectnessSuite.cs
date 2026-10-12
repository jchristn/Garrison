namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Sockets;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Settings;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Garrison.Worker.Hosting;
    using Microsoft.Data.Sqlite;
    using Npgsql;
    using SyslogLogging;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;
    using Voltaic.Mcp;

    /// <summary>
    /// Correctness fixes found by benchmark round 0 and the AB_IMPROVEMENTS review: the start gate for leased runs
    /// (P10.20), run tokens fenced by lease epoch (P10.21), JSON 503 answers when the database is down or its pool is
    /// exhausted (G-25, G-23), the separate liveness listener (G-24), readable manifest spec errors (G-26), and
    /// concurrent node pool creation (G-27).
    /// </summary>
    public static class CorrectnessSuite
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
            unit.Add(new TestCaseDescriptor("correctness-unit", "database-failure-classifier", "Pool exhaustion, too many clients, and Sqlite busy are Busy; refused connections and shutdowns are Unavailable; constraint errors are not (G-23, G-25)", ct => ClassifierAsync()));
            unit.Add(new TestCaseDescriptor("correctness-unit", "liveness-listener", "The liveness port answers GET /v1.0/api/health/live from its own thread, 404 elsewhere, and keeps answering while the REST listener's thread pool is saturated (G-24)", LivenessAsync));
            unit.Add(new TestCaseDescriptor("correctness-unit", "manifest-invalid", "An invalid enum or wrong type in a manifest spec returns ManifestInvalid naming the document, field, and allowed values, without type names or byte positions (G-26)", ManifestInvalidAsync));
            suites.Add(new TestSuiteDescriptor("correctness-unit", "Correctness fixes (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "correctness-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "start-gate-partition", "A worker partitioned after claiming never launches; the run is requeued and executes exactly once elsewhere (P10.20, " + provider + ")", ct => PartitionBeforeStartAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "start-gate-node-lost", "A started run whose worker is partitioned ends NodeLost under retryOnNodeLoss false and is never run again; runs.finished carries agent and model (P10.20, " + provider + ")", ct => PartitionAfterStartAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "run-token-epoch", "A requeue revokes the old attempt's run token; tokens of an older epoch are refused even unrevoked; the new attempt's token delegates over REST and MCP (P10.21, " + provider + ")", ct => RunTokenEpochAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "database-outage-json", "With the database stopped, authentication, the tenant check, and handlers answer 503 DatabaseUnavailable JSON with Retry-After, and recover after (G-25, " + provider + ")", ct => DatabaseOutageAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "node-pool-race", "Parallel registrations that create the same node pool, and the same node, all succeed (G-27, " + provider + ")", ct => NodePoolRaceAsync(provider, ct)));
                if (provider == DatabaseTypeEnum.Postgresql)
                {
                    cases.Add(new TestCaseDescriptor(id, "pool-exhausted", "An exhausted connection pool answers 503 DatabaseBusy with Retry-After, not 500 (G-23, " + provider + ")", ct => PoolExhaustedAsync(ct)));
                }
                suites.Add(new TestSuiteDescriptor(id, "Correctness fixes (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task ClassifierAsync()
        {
            Assert.Equal(DatabaseFailureEnum.Busy, DatabaseFailures.Classify(new NpgsqlException("The connection pool has been exhausted.", new TimeoutException("timeout"))), "Npgsql pool exhaustion");
            Assert.Equal(DatabaseFailureEnum.Busy, DatabaseFailures.Classify(new PostgresException("sorry, too many clients already", "FATAL", "FATAL", "53300")), "53300 too many clients");
            Assert.Equal(DatabaseFailureEnum.Unavailable, DatabaseFailures.Classify(new NpgsqlException("Failed to connect", new SocketException((int)SocketError.ConnectionRefused))), "Connection refused");
            Assert.Equal(DatabaseFailureEnum.Unavailable, DatabaseFailures.Classify(new NpgsqlException("Exception while reading from stream", new EndOfStreamException())), "Connection reset");
            Assert.Equal(DatabaseFailureEnum.Unavailable, DatabaseFailures.Classify(new PostgresException("the database system is shutting down", "FATAL", "FATAL", "57P03")), "57P03 cannot connect now");
            Assert.Equal(DatabaseFailureEnum.Unavailable, DatabaseFailures.Classify(new InvalidOperationException("wrapped", new PostgresException("terminating connection due to administrator command", "FATAL", "FATAL", "57P01"))), "Inner exceptions are inspected");
            Assert.Equal(DatabaseFailureEnum.Busy, DatabaseFailures.Classify(new SqliteException("database is locked", 5)), "Sqlite busy");
            Assert.Equal(DatabaseFailureEnum.Unavailable, DatabaseFailures.Classify(new SqliteException("unable to open database file", 14)), "Sqlite cannot open");
            Assert.Equal(DatabaseFailureEnum.None, DatabaseFailures.Classify(new PostgresException("duplicate key value violates unique constraint", "ERROR", "ERROR", "23505")), "Unique violation is not an outage");
            Assert.Equal(DatabaseFailureEnum.None, DatabaseFailures.Classify(new InvalidOperationException("not a database error")), "Other exceptions");
            Assert.True(DatabaseFailures.IsUniqueViolation(new PostgresException("duplicate key", "ERROR", "ERROR", "23505")), "Postgres unique violation");
            Assert.True(DatabaseFailures.IsUniqueViolation(new SqliteException("UNIQUE constraint failed", 19, 2067)), "Sqlite unique violation");
            Assert.True(!DatabaseFailures.IsUniqueViolation(new SqliteException("NOT NULL constraint failed", 19, 1299)), "Sqlite not-null is not a unique violation");
            return Task.CompletedTask;
        }

        private static async Task LivenessAsync(CancellationToken token)
        {
            int port = TestServerHost.FreePort();
            using (LivenessListener listener = new LivenessListener("127.0.0.1", port, "node-live"))
            using (HttpClient client = new HttpClient())
            {
                Assert.True(listener.Start(), "The liveness listener binds");
                client.Timeout = TimeSpan.FromSeconds(10);
                string url = "http://127.0.0.1:" + port;

                HttpResponseMessage starting = await client.GetAsync(url + "/v1.0/api/health/live", token).ConfigureAwait(false);
                Assert.Equal(200, (int)starting.StatusCode, "Liveness answers before the server is up");
                HealthResponse? body = Serializer.Deserialize<HealthResponse>(await starting.Content.ReadAsStringAsync(token).ConfigureAwait(false));
                Assert.Equal("starting", body?.Status, "Status before the server is up");
                Assert.Equal("unchecked", body?.Database, "Liveness never checks the database");

                listener.Status = () => "draining";
                HttpResponseMessage draining = await client.GetAsync(url + "/v1.0/api/health/live?x=1", token).ConfigureAwait(false);
                Assert.Equal(200, (int)draining.StatusCode, "Draining is still alive");
                Assert.True((await draining.Content.ReadAsStringAsync(token).ConfigureAwait(false)).Contains("\"draining\"", StringComparison.Ordinal), "Status follows the server");

                HttpResponseMessage other = await client.GetAsync(url + "/v1.0/api/health/ready", token).ConfigureAwait(false);
                Assert.Equal(404, (int)other.StatusCode, "Only liveness is served on this port");

                // Saturate the thread pool: liveness runs on its own thread, so it still answers promptly.
                listener.Status = () => "alive";
                using (ManualResetEventSlim release = new ManualResetEventSlim(false))
                {
                    int blockers = Environment.ProcessorCount * 4;
                    List<Task> blocked = new List<Task>();
                    for (int i = 0; i < blockers; i++) blocked.Add(Task.Run(() => release.Wait(TimeSpan.FromSeconds(30))));
                    try
                    {
                        string answer = await Task.Run(() => RawGet(port, "/v1.0/api/health/live")).ConfigureAwait(false);
                        Assert.True(answer.StartsWith("HTTP/1.1 200", StringComparison.Ordinal) && answer.Contains("\"alive\"", StringComparison.Ordinal), "Liveness answers with the thread pool saturated: " + answer);
                    }
                    finally
                    {
                        release.Set();
                        await Task.WhenAll(blocked).ConfigureAwait(false);
                    }
                }
                Assert.True(listener.Answered >= 4, "Answers are counted");
            }

            await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, null, token).ConfigureAwait(false))
            using (HttpClient client = new HttpClient())
            {
                Assert.True(host.Server.Liveness != null && host.Server.Liveness.Listening, "The server starts its liveness listener on Rest.LivenessPort");
                HttpResponseMessage live = await client.GetAsync("http://127.0.0.1:" + host.Settings.Rest.LivenessPort + "/v1.0/api/health/live", token).ConfigureAwait(false);
                Assert.Equal(200, (int)live.StatusCode, "Server liveness port");
                Assert.True((await live.Content.ReadAsStringAsync(token).ConfigureAwait(false)).Contains("\"alive\"", StringComparison.Ordinal), "A running server reports alive");
            }
        }

        private static string RawGet(int port, string path)
        {
            // A synchronous socket client, so the probe itself does not need the saturated thread pool.
            using (TcpClient client = new TcpClient())
            {
                client.ReceiveTimeout = 5000;
                client.SendTimeout = 5000;
                client.Connect("127.0.0.1", port);
                NetworkStream stream = client.GetStream();
                byte[] request = Encoding.ASCII.GetBytes("GET " + path + " HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n");
                stream.Write(request, 0, request.Length);
                using (MemoryStream buffer = new MemoryStream())
                {
                    byte[] chunk = new byte[4096];
                    int read;
                    while ((read = stream.Read(chunk, 0, chunk.Length)) > 0) buffer.Write(chunk, 0, read);
                    return Encoding.UTF8.GetString(buffer.ToArray());
                }
            }
        }

        private static async Task ManifestInvalidAsync(CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, null, token).ConfigureAwait(false))
            {
                string path = "/v1.0/api/tenants/" + host.TenantId + "/manifests/apply";
                string yaml =
                    "apiVersion: garrison/v1\nkind: Secret\nmetadata:\n  name: ok-key\nspec:\n  kind: GenericEnv\n" +
                    "---\napiVersion: garrison/v1\nkind: Secret\nmetadata:\n  name: mux-api-key\nspec:\n  kind: Generic\n";
                ManifestApply apply = await ApplyAsync(host, path, yaml, 400, token).ConfigureAwait(false);
                ManifestApplyItem failed = apply.Items.Single(i => i.Name == "mux-api-key");
                Assert.Equal(ManifestApplyResultEnum.Failed, failed.Result, "The invalid document fails");
                Assert.Equal("ManifestInvalid", failed.ErrorCode, "Error code (" + failed.Message + ")");
                Assert.Equal("documents[1].spec.kind", failed.ErrorField, "Error field names the document and field");
                string message = failed.Message ?? String.Empty;
                Assert.True(message.Contains("mux-api-key", StringComparison.Ordinal) && message.Contains("spec.kind", StringComparison.Ordinal) && message.Contains("'Generic'", StringComparison.Ordinal), "Message names the document, field, and value: " + message);
                Assert.True(message.Contains("GenericEnv", StringComparison.Ordinal) && message.Contains("GenericFile", StringComparison.Ordinal), "Message lists the allowed values: " + message);
                AssertNoInternals(message);

                string wrongType =
                    "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: typed\nspec:\n  description: Typed\n  exposeMcpTool: sometimes\n";
                ManifestApply typed = await ApplyAsync(host, path, wrongType, 400, token).ConfigureAwait(false);
                ManifestApplyItem typedItem = typed.Items.Single();
                Assert.Equal("ManifestInvalid", typedItem.ErrorCode, "Wrong type error code (" + typedItem.Message + ")");
                Assert.Equal("documents[0].spec.exposeMcpTool", typedItem.ErrorField, "Wrong type field");
                Assert.True((typedItem.Message ?? String.Empty).Contains("true or false", StringComparison.Ordinal), "Message says what the field accepts: " + typedItem.Message);
                AssertNoInternals(typedItem.Message ?? String.Empty);

                // The stored apply keeps the code and field.
                TestResponse history = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/manifests/applies/" + apply.Id, null, token).ConfigureAwait(false);
                Assert.Equal(200, history.StatusCode, "Stored apply");
                Assert.True(history.Body.Contains("\"errorCode\":\"ManifestInvalid\"", StringComparison.Ordinal) && history.Body.Contains("\"errorField\":\"documents[1].spec.kind\"", StringComparison.Ordinal), "Stored apply keeps errorCode and errorField: " + history.Body);
            }
        }

        private static void AssertNoInternals(string message)
        {
            foreach (string leak in new[] { "Garrison.Core", "BytePosition", "LineNumber", "Path: $", "could not be converted" })
            {
                Assert.True(!message.Contains(leak, StringComparison.Ordinal), "Message leaks serializer internals (" + leak + "): " + message);
            }
        }

        private static async Task<ManifestApply> ApplyAsync(TestServerHost host, string path, string yaml, int expected, CancellationToken token)
        {
            using (StringContent content = new StringContent(yaml, Encoding.UTF8, "application/yaml"))
            {
                HttpResponseMessage response = await host.AdminClient.PostAsync(path, content, token).ConfigureAwait(false);
                string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                Assert.Equal(expected, (int)response.StatusCode, "Apply status (" + body + ")");
                return Serializer.Deserialize<ManifestApply>(body) ?? throw new TestAssertionException("Empty apply: " + body);
            }
        }

        private static void FastLeases(TestCluster cluster)
        {
            RuntimeOptions runtime = cluster.Server.Server.Context.Get<RuntimeOptions>();
            runtime.LeaseDurationMs = 5000;
            runtime.MaintenanceIntervalMs = 500;
            // A loaded test machine must not look like a host pause, which defers lease expiry.
            runtime.PauseGraceMs = 60000;
        }

        private static async Task<Run> CreateRunAsync(TestCluster cluster, Agent agent, string input, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = input;
            request.Wait = false;
            TestResponse response = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
            if (response.StatusCode != 200 && response.StatusCode != 202) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
            return Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
        }

        private static async Task<Run> WaitForAsync(TestCluster cluster, string runId, Func<Run, bool> done, TimeSpan timeout, string what, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow + timeout;
            Run? run = null;
            while (DateTime.UtcNow < deadline)
            {
                run = await cluster.Server.Server.Context.Database.Runs.ReadAsync(runId, token).ConfigureAwait(false);
                if (run != null && done(run)) return run;
                await Task.Delay(100, token).ConfigureAwait(false);
            }
            throw new TestAssertionException("Timed out waiting for " + what + " (run " + runId + " is " + run?.Status + ", attempt " + run?.Attempt + ").");
        }

        private static async Task PartitionBeforeStartAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            using (HttpPartitionProxy proxy = new HttpPartitionProxy(cluster.Server.BaseUrl))
            {
                FastLeases(cluster);
                Agent agent = await cluster.CreateAgentAsync("gate-once", "builtin/fake", null, token, d =>
                {
                    d.MaxAttempts = 3;
                    d.RetryOnNodeLoss = false;
                }).ConfigureAwait(false);

                HoldingExecutor partitionedExecutor = new HoldingExecutor("partitioned");
                HoldingExecutor healthyExecutor = new HoldingExecutor("healthy");
                proxy.PartitionAfterAssignment = true;
                WorkerHost partitioned = await TestCluster.StartWorkerAsync(proxy.BaseUrl, "gate-a-" + Guid.NewGuid().ToString("N").Substring(0, 4), null, token, partitionedExecutor).ConfigureAwait(false);
                try
                {
                    Run run = await CreateRunAsync(cluster, agent, "Run exactly once", token).ConfigureAwait(false);

                    // Worker A claims the run, and the partition starts right after the lease response reaches it.
                    DateTime claimDeadline = DateTime.UtcNow.AddSeconds(30);
                    while (!proxy.Partitioned && DateTime.UtcNow < claimDeadline) await Task.Delay(50, token).ConfigureAwait(false);
                    Assert.True(proxy.Partitioned, "Worker A leased the run before the partition");
                    Run leased = Assert.NotNull(await cluster.Server.Server.Context.Database.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Leased run");
                    Assert.Equal(RunStatusEnum.Leased, leased.Status, "The claim happened; the start was never acknowledged");

                    // A healthy worker joins; the run is requeued when A's lease expires and runs there.
                    await using (WorkerHost healthy = await TestCluster.StartWorkerAsync(cluster.Server.BaseUrl, "gate-b-" + Guid.NewGuid().ToString("N").Substring(0, 4), null, token, healthyExecutor).ConfigureAwait(false))
                    {
                        Run finished = await WaitForAsync(cluster, run.Id, r => RunService.IsTerminal(r.Status), TimeSpan.FromSeconds(120), "the requeued run to finish", token).ConfigureAwait(false);
                        Assert.Equal(RunStatusEnum.Succeeded, finished.Status, "The run succeeded on the healthy worker (" + finished.ErrorMessage + ")");
                        Assert.Equal("healthy", finished.ResultText, "Result came from the healthy worker");
                        Assert.Equal(2, finished.Attempt, "One requeue");

                        // Heal: the partitioned worker must not run it late either.
                        proxy.Heal();
                        await Task.Delay(3000, token).ConfigureAwait(false);
                        Assert.Equal(0, partitionedExecutor.Executed, "The partitioned worker never launched the harness");
                        Assert.Equal(1, healthyExecutor.Executed, "The run executed exactly once");
                    }
                }
                finally
                {
                    proxy.Heal();
                    await partitioned.DisposeAsync().ConfigureAwait(false);
                }
            }
        }

        private static async Task PartitionAfterStartAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (MetricCapture capture = new MetricCapture())
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            using (HttpPartitionProxy proxy = new HttpPartitionProxy(cluster.Server.BaseUrl))
            {
                FastLeases(cluster);
                Agent agent = await cluster.CreateAgentAsync("gate-lost", "builtin/fake", null, token, d =>
                {
                    d.MaxAttempts = 3;
                    d.RetryOnNodeLoss = false;
                }).ConfigureAwait(false);

                HoldingExecutor partitionedExecutor = new HoldingExecutor("partitioned");
                partitionedExecutor.HoldMs = 120000;
                HoldingExecutor healthyExecutor = new HoldingExecutor("healthy");
                proxy.PartitionAfterStartAcknowledged = true;
                WorkerHost partitioned = await TestCluster.StartWorkerAsync(proxy.BaseUrl, "lost-a-" + Guid.NewGuid().ToString("N").Substring(0, 4), null, token, partitionedExecutor).ConfigureAwait(false);
                try
                {
                    Run run = await CreateRunAsync(cluster, agent, "Started, then lost", token).ConfigureAwait(false);
                    Run running = await WaitForAsync(cluster, run.Id, r => r.Status == RunStatusEnum.Running, TimeSpan.FromSeconds(30), "the start acknowledgement", token).ConfigureAwait(false);
                    Assert.True(running.StartedUtc.HasValue, "Started time is recorded at the acknowledgement");

                    await using (WorkerHost healthy = await TestCluster.StartWorkerAsync(cluster.Server.BaseUrl, "lost-b-" + Guid.NewGuid().ToString("N").Substring(0, 4), null, token, healthyExecutor).ConfigureAwait(false))
                    {
                        Run finished = await WaitForAsync(cluster, run.Id, r => RunService.IsTerminal(r.Status), TimeSpan.FromSeconds(120), "the lost run to fail", token).ConfigureAwait(false);
                        Assert.Equal(RunStatusEnum.Failed, finished.Status, "A started run is not silently requeued");
                        Assert.Equal(RunOutcomeEnum.NodeLost, finished.Outcome, "Outcome");
                        Assert.Equal(1, finished.Attempt, "No second attempt");
                        await Task.Delay(2000, token).ConfigureAwait(false);
                        Assert.Equal(1, partitionedExecutor.Executed, "The run started once, on the partitioned worker");
                        Assert.Equal(0, healthyExecutor.Executed, "The healthy worker never ran it");
                    }

                    // Every runs.finished series carries agent and model, including the lease reaper's (item 8).
                    List<CapturedMeasurement> finishedMetrics = capture.Of("garrison.runs.finished").Where(m => m.Tag("agent") == "gate-lost").ToList();
                    Assert.True(finishedMetrics.Count == 1 && finishedMetrics[0].Tag("outcome") == "NodeLost" && finishedMetrics[0].Tag("model") == "none" && !String.IsNullOrEmpty(finishedMetrics[0].Tag("harness")),
                        "The reaper's runs.finished has agent, model, harness, and outcome labels: " + String.Join("; ", finishedMetrics.Select(m => "agent=" + m.Tag("agent") + " model=" + m.Tag("model") + " outcome=" + m.Tag("outcome"))));
                }
                finally
                {
                    proxy.Heal();
                    await partitioned.DisposeAsync().ConfigureAwait(false);
                }
            }
        }

        private static async Task RunTokenEpochAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = cluster.Server.Server.Context.Database;
                AuthenticationService authentication = cluster.Server.Server.Context.Authentication;
                string tenant = cluster.Server.TenantId;
                Agent helper = await cluster.CreateAgentAsync("epoch-helper", "builtin/fake", null, token).ConfigureAwait(false);
                // The lead's deployment pins a pool no worker has, so only this test claims its run.
                Agent lead = await cluster.CreateAgentAsync("epoch-lead", "builtin/fake", a =>
                {
                    a.DelegationMode = DelegationModeEnum.AllowList;
                    a.DelegationAllowList.Add("epoch-helper");
                }, token, d =>
                {
                    d.MaxAttempts = 3;
                    d.NodeSelector.Add(new DeploymentNodeSelector { Key = "zone", Value = "mars" });
                }).ConfigureAwait(false);

                Run run = await CreateRunAsync(cluster, lead, "Delegate with a fenced token", token).ConfigureAwait(false);
                long epoch1 = (await db.Runs.TryClaimAsync(run.Id, "nod_ghost", "ghost", DateTime.UtcNow.AddSeconds(1), token).ConfigureAwait(false)) ?? throw new TestAssertionException("First claim failed.");
                Run claimed = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Claimed run");
                string token1 = await authentication.IssueForRunAsync(claimed, epoch1, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false);

                Assert.Equal(200, await InvokeAsRunAsync(cluster, token1, helper, token).ConfigureAwait(false), "The current attempt's token delegates over REST");
                Assert.Equal("Succeeded", await McpInvokeAsync(cluster, token1, token).ConfigureAwait(false), "The current attempt's token delegates over MCP");

                // Force the requeue: the lease expired and the reaper runs.
                await Task.Delay(1200, token).ConfigureAwait(false);
                using (GarrisonTelemetry telemetry = new GarrisonTelemetry(new TelemetrySettings { Enabled = false }, "test", null))
                using (MaintenanceService maintenance = new MaintenanceService(db, new FixedLeader(), new RunSignals(), new RuntimeOptions(), telemetry, Quiet()))
                {
                    await maintenance.RunOnceAsync(token).ConfigureAwait(false);
                }
                Run requeued = await WaitForAsync(cluster, run.Id, r => r.Status == RunStatusEnum.Queued, TimeSpan.FromSeconds(10), "the requeue", token).ConfigureAwait(false);
                Assert.Equal(2, requeued.Attempt, "Requeued for a second attempt");

                Assert.Equal(401, await InvokeAsRunAsync(cluster, token1, helper, token).ConfigureAwait(false), "The old attempt's token is revoked on requeue");
                Assert.Equal("refused", await McpInvokeAsync(cluster, token1, token).ConfigureAwait(false), "The old attempt's token cannot open an MCP session");

                long epoch2 = (await db.Runs.TryClaimAsync(run.Id, "nod_ghost2", "ghost2", DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false)) ?? throw new TestAssertionException("Second claim failed.");
                Assert.True(epoch2 > epoch1, "The new attempt has a higher epoch");
                Run reclaimed = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Reclaimed run");
                string token2 = await authentication.IssueForRunAsync(reclaimed, epoch2, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false);
                Assert.Equal(200, await InvokeAsRunAsync(cluster, token2, helper, token).ConfigureAwait(false), "The new attempt's token delegates over REST");
                Assert.Equal("Succeeded", await McpInvokeAsync(cluster, token2, token).ConfigureAwait(false), "The new attempt's token delegates over MCP");

                // Fencing does not depend on revocation: an unrevoked token minted for the old epoch is refused.
                string stale = await authentication.IssueForRunAsync(reclaimed, epoch1, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false);
                Assert.Equal(401, await InvokeAsRunAsync(cluster, stale, helper, token).ConfigureAwait(false), "A token for an older epoch is refused");
                Assert.Equal(401, await InvokeAsRunAsync(cluster, token1, helper, token).ConfigureAwait(false), "The old token stays refused after the re-claim");

                List<AuthSession> sessions = (await db.Sessions.EnumerateAsync(tenant, new Garrison.Core.Enumeration.EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false)).Objects.Where(s => s.RunId == run.Id).ToList();
                Assert.True(sessions.Any(s => s.LeaseEpoch == epoch1 && s.RevokedUtc.HasValue), "The first attempt's session was revoked");
                Assert.True(sessions.Any(s => s.LeaseEpoch == epoch2 && !s.RevokedUtc.HasValue), "The second attempt's session is live");
            }
        }

        private static async Task<int> InvokeAsRunAsync(TestCluster cluster, string runToken, Agent helper, CancellationToken token)
        {
            using (HttpClient asRun = new HttpClient())
            {
                asRun.BaseAddress = new Uri(cluster.Server.BaseUrl);
                asRun.DefaultRequestHeaders.Add("Authorization", "Bearer " + runToken);
                asRun.Timeout = TimeSpan.FromSeconds(90);
                InvokeRequest request = new InvokeRequest();
                request.Input = "Delegated work";
                request.Wait = true;
                request.WaitSeconds = 60;
                TestResponse response = await HttpTestHelpers.SendAsync(asRun, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + helper.Id + "/invoke", request, token).ConfigureAwait(false);
                if (response.StatusCode == 200)
                {
                    Run child = Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty child run.");
                    Assert.Equal(RunStatusEnum.Succeeded, child.Status, "Delegated child status");
                }
                else if (response.StatusCode != 401)
                {
                    throw new TestAssertionException("Delegated invoke returned " + response.StatusCode + ": " + response.Body);
                }
                else
                {
                    Assert.True(response.Body.Contains("\"code\"", StringComparison.Ordinal), "A refused token gets the JSON error shape: " + response.Body);
                }
                return response.StatusCode;
            }
        }

        private static async Task<string> McpInvokeAsync(TestCluster cluster, string runToken, CancellationToken token)
        {
            using (McpHttpClient client = new McpHttpClient())
            {
                client.SetRequestHeader("Authorization", "Bearer " + runToken);
                try
                {
                    await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);
                    JsonElement invoked = await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_invoke_agent", arguments = new { agent = "epoch-helper", input = "Delegated over MCP", waitSeconds = 60 } }, 90000).ConfigureAwait(false);
                    if (invoked.TryGetProperty("isError", out JsonElement isError) && isError.ValueKind == JsonValueKind.True) return "refused";
                    string text = invoked.GetProperty("content")[0].GetProperty("text").GetString() ?? String.Empty;
                    using (JsonDocument summary = JsonDocument.Parse(text))
                    {
                        return summary.RootElement.GetProperty("status").GetString() ?? String.Empty;
                    }
                }
                catch (Exception e) when (e is not TestAssertionException && e is not OperationCanceledException)
                {
                    return "refused";
                }
            }
        }

        private static async Task DatabaseOutageAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            TcpFaultProxy? proxy = null;
            DatabaseSettings isolated = TestEnvironment.IsolatedSettings(provider);
            if (provider == DatabaseTypeEnum.Postgresql) proxy = new TcpFaultProxy(isolated.Host, isolated.Port);
            try
            {
                await using (TestServerHost host = await TestServerHost.StartAsync(provider, s =>
                {
                    s.Database = isolated;
                    s.Database.ConnectionTimeoutSeconds = 2;
                    if (proxy != null)
                    {
                        s.Database.Host = "127.0.0.1";
                        s.Database.Port = proxy.Port;
                    }
                    s.Rest.DatabaseRetryAfterSeconds = 7;
                }, token).ConfigureAwait(false))
                {
                    string tenantPath = "/v1.0/api/tenants/" + host.TenantId + "/agents";
                    using (HttpClient user = await host.UserClientAsync(host.Settings.Security.AdminEmail, host.Settings.Security.AdminPassword, null, token).ConfigureAwait(false))
                    {
                        Assert.Equal(200, (await HttpTestHelpers.SendAsync(user, HttpMethod.Get, tenantPath, null, token).ConfigureAwait(false)).StatusCode, "Bearer request before the outage");
                        Assert.Equal(200, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, tenantPath, null, token).ConfigureAwait(false)).StatusCode, "Admin request before the outage");

                        string? sqliteFile = provider == DatabaseTypeEnum.Sqlite ? isolated.Filename : null;
                        List<FileStream> locks = StopDatabase(proxy, sqliteFile);
                        try
                        {
                            // Authentication reads the session (bearer); the tenant check reads the tenant (administrator
                            // key on a tenant route); the handler reads the tenants table (administrator key, no tenant).
                            await ExpectUnavailableAsync(user, HttpMethod.Get, tenantPath, "authentication", token).ConfigureAwait(false);
                            await ExpectUnavailableAsync(host.AdminClient, HttpMethod.Get, tenantPath, "tenant check", token).ConfigureAwait(false);
                            await ExpectUnavailableAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants", "handler", token).ConfigureAwait(false);
                            await ExpectUnavailableAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/runs/run_missing", "run read", token).ConfigureAwait(false);

                            HttpResponseMessage ready = await host.AdminClient.GetAsync("/v1.0/api/health/ready", token).ConfigureAwait(false);
                            Assert.Equal(503, (int)ready.StatusCode, "Readiness reports the outage");
                            using (HttpClient live = new HttpClient())
                            {
                                HttpResponseMessage alive = await live.GetAsync("http://127.0.0.1:" + host.Settings.Rest.LivenessPort + "/v1.0/api/health/live", token).ConfigureAwait(false);
                                Assert.Equal(200, (int)alive.StatusCode, "Liveness does not depend on the database");
                            }
                        }
                        finally
                        {
                            StartDatabase(proxy, sqliteFile, locks);
                        }

                        DateTime recovered = DateTime.UtcNow.AddSeconds(20);
                        int status = 0;
                        while (DateTime.UtcNow < recovered)
                        {
                            status = (await HttpTestHelpers.SendAsync(user, HttpMethod.Get, tenantPath, null, token).ConfigureAwait(false)).StatusCode;
                            if (status == 200) break;
                            await Task.Delay(250, token).ConfigureAwait(false);
                        }
                        Assert.Equal(200, status, "Requests recover when the database is back");
                    }
                }
            }
            finally
            {
                proxy?.Dispose();
            }
        }

        private static List<FileStream> StopDatabase(TcpFaultProxy? proxy, string? sqliteFile)
        {
            List<FileStream> locks = new List<FileStream>();
            if (proxy != null)
            {
                proxy.Cut();
                NpgsqlConnection.ClearAllPools();
            }
            if (sqliteFile != null)
            {
                SqliteConnection.ClearAllPools();
                foreach (string file in SqliteFiles(sqliteFile))
                {
                    // Make the database file unopenable: no permissions on Unix, an exclusive handle on Windows.
                    if (OperatingSystem.IsWindows()) locks.Add(new FileStream(file, FileMode.Open, FileAccess.ReadWrite, FileShare.None));
                    else File.SetUnixFileMode(file, UnixFileMode.None);
                }
            }
            return locks;
        }

        private static void StartDatabase(TcpFaultProxy? proxy, string? sqliteFile, List<FileStream> locks)
        {
            if (proxy != null) proxy.Restore();
            foreach (FileStream held in locks) held.Dispose();
            if (sqliteFile != null && !OperatingSystem.IsWindows())
            {
                foreach (string file in SqliteFiles(sqliteFile)) File.SetUnixFileMode(file, UnixFileMode.UserRead | UnixFileMode.UserWrite);
            }
        }

        private static IEnumerable<string> SqliteFiles(string file)
        {
            foreach (string candidate in new[] { file, file + "-wal", file + "-shm" })
            {
                if (File.Exists(candidate)) yield return candidate;
            }
        }

        private static async Task ExpectUnavailableAsync(HttpClient client, HttpMethod method, string path, string what, CancellationToken token)
        {
            using (HttpRequestMessage request = new HttpRequestMessage(method, path))
            {
                HttpResponseMessage response = await client.SendAsync(request, token).ConfigureAwait(false);
                string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                Assert.Equal(503, (int)response.StatusCode, what + " answers 503 during the outage (" + body + ")");
                Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType, what + " answers JSON, not an HTML page");
                ErrorResponse? error = Serializer.Deserialize<ErrorResponse>(body);
                Assert.True(error != null && (error.Code == "DatabaseUnavailable" || error.Code == "DatabaseBusy"), what + " error code: " + body);
                Assert.True(response.Headers.RetryAfter?.Delta == TimeSpan.FromSeconds(7), what + " carries Retry-After from Rest.DatabaseRetryAfterSeconds: " + response.Headers.RetryAfter);
            }
        }

        private static async Task PoolExhaustedAsync(CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Postgresql, s =>
            {
                s.Database.MaxPoolSize = 3;
                s.Database.ConnectionTimeoutSeconds = 3;
            }, token).ConfigureAwait(false))
            {
                string tenantPath = "/v1.0/api/tenants/" + host.TenantId + "/agents";
                Assert.Equal(200, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, tenantPath, null, token).ConfigureAwait(false)).StatusCode, "Request before the pool is exhausted");

                AdoDatabaseDriver driver = (AdoDatabaseDriver)host.Server.Context.Database;
                List<System.Data.Common.DbConnection> held = new List<System.Data.Common.DbConnection>();
                try
                {
                    DateTime deadline = DateTime.UtcNow.AddSeconds(15);
                    while (held.Count < 3 && DateTime.UtcNow < deadline)
                    {
                        try
                        {
                            held.Add(await driver.OpenConnectionAsync(token).ConfigureAwait(false));
                        }
                        catch (NpgsqlException)
                        {
                            await Task.Delay(50, token).ConfigureAwait(false);
                        }
                    }
                    Assert.Equal(3, held.Count, "The test holds every pooled connection");

                    using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, tenantPath))
                    {
                        HttpResponseMessage response = await host.AdminClient.SendAsync(request, token).ConfigureAwait(false);
                        string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(503, (int)response.StatusCode, "Exhausted pool answers 503 (" + body + ")");
                        Assert.True(body.Contains("\"code\":\"DatabaseBusy\"", StringComparison.Ordinal), "Code DatabaseBusy: " + body);
                        Assert.True(response.Headers.RetryAfter?.Delta == TimeSpan.FromSeconds(2), "Retry-After defaults to 2 seconds: " + response.Headers.RetryAfter);
                    }
                }
                finally
                {
                    foreach (System.Data.Common.DbConnection connection in held) await connection.DisposeAsync().ConfigureAwait(false);
                }
                Assert.Equal(200, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, tenantPath, null, token).ConfigureAwait(false)).StatusCode, "Requests succeed once connections are free");
            }
        }

        private static async Task NodePoolRaceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                NodeService nodes = host.Server.Context.Get<NodeService>();
                string pool = "race-pool-" + Guid.NewGuid().ToString("N").Substring(0, 6);
                using (SemaphoreSlim gate = new SemaphoreSlim(0))
                {
                    List<Task> registrations = new List<Task>();
                    for (int i = 0; i < 12; i++)
                    {
                        string name = "race-node-" + i;
                        registrations.Add(Task.Run(async () =>
                        {
                            await gate.WaitAsync(token).ConfigureAwait(false);
                            await nodes.RegisterAsync(new RequestContext(), Registration(name, pool), token).ConfigureAwait(false);
                        }, token));
                    }
                    // The same node registering several times at once (a retry racing the first attempt).
                    for (int i = 0; i < 4; i++)
                    {
                        registrations.Add(Task.Run(async () =>
                        {
                            await gate.WaitAsync(token).ConfigureAwait(false);
                            await nodes.RegisterAsync(new RequestContext(), Registration("race-twin", pool), token).ConfigureAwait(false);
                        }, token));
                    }
                    gate.Release(registrations.Count);
                    await Task.WhenAll(registrations).ConfigureAwait(false);
                }

                NodePool created = Assert.NotNull(await host.Server.Context.Database.NodePools.ReadByNameAsync(pool, token).ConfigureAwait(false), "Pool");
                for (int i = 0; i < 12; i++)
                {
                    Node node = Assert.NotNull(await host.Server.Context.Database.Nodes.ReadByNameAsync("race-node-" + i, token).ConfigureAwait(false), "Node " + i);
                    Assert.Equal(created.Id, node.NodePoolId, "Node " + i + " joined the one pool");
                }
                Node twin = Assert.NotNull(await host.Server.Context.Database.Nodes.ReadByNameAsync("race-twin", token).ConfigureAwait(false), "Twin");
                Assert.Equal(created.Id, twin.NodePoolId, "Twin pool");
            }
        }

        private static Garrison.Core.Protocol.NodeRegisterRequest Registration(string name, string pool)
        {
            Garrison.Core.Protocol.NodeRegisterRequest request = new Garrison.Core.Protocol.NodeRegisterRequest();
            request.Name = name;
            request.NodePool = pool;
            request.MaxConcurrentRuns = 1;
            request.Version = "test";
            return request;
        }

        private static LoggingModule Quiet()
        {
            LoggingModule logging = new LoggingModule();
            logging.Settings.EnableConsole = false;
            return logging;
        }

        #endregion
    }
}
