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
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Server.Routes;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Run analytics suites (plan section 10.6): bucketing, gap fill, filters, grouping, percentiles, validation,
    /// authorization, and tenant isolation, over HTTP against an in-process control plane.
    /// </summary>
    public static class AnalyticsSuite
    {
        #region Private-Members

        private static readonly DateTime _Base = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "analytics-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "buckets-and-totals", "Hourly buckets are gap-filled; totals, averages, and percentiles are correct (" + provider + ")", ct => BucketsAndTotalsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "filters", "agentId, harnessType, and deploymentId filters combine (" + provider + ")", ct => FiltersAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "group-by", "groupBy agent and harness produce one series per group (" + provider + ")", ct => GroupByAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "by-model", "Model filter, groupBy model and harnessModel, and the dimensions endpoint (" + provider + ")", ct => ByModelAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "model-encoding", "Query values are decoded: model names with colons, spaces, plus signs, and slashes filter correctly (" + provider + ")", ct => ModelEncodingAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "intervals", "Auto, day, and week intervals choose and align buckets (" + provider + ")", ct => IntervalsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "validation", "Bad ranges, intervals, and filters return 400 (" + provider + ")", ct => ValidationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "auth-and-isolation", "Run Read is required and tenants only see their own runs (" + provider + ")", ct => AuthAndIsolationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "truncation", "The run cap keeps the newest runs and reports truncation (" + provider + ")", ct => TruncationAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Run analytics (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static async Task<Run> SeedRunAsync(DatabaseDriverBase db, string tenantId, string agentId, string agentName, HarnessTypeEnum harness, string deploymentId, RunStatusEnum status, DateTime createdUtc, Action<Run>? configure, CancellationToken token)
        {
            Run run = new Run();
            run.TenantId = tenantId;
            run.AgentId = agentId;
            run.AgentName = agentName;
            run.DeploymentId = deploymentId;
            run.HarnessType = harness;
            run.Status = status;
            configure?.Invoke(run);
            run = await db.Runs.CreateAsync(run, token).ConfigureAwait(false);
            AdoDatabaseDriver ado = (AdoDatabaseDriver)db;
            await ado.NonQueryAsync("UPDATE " + ado.Table("runs") + " SET createdutc = @created WHERE id = @id;", command =>
            {
                AdoDatabaseDriver.Add(command, "created", createdUtc);
                AdoDatabaseDriver.Add(command, "id", run.Id);
            }, token).ConfigureAwait(false);
            return run;
        }

        private static async Task SeedStandardAsync(TestServerHost host, CancellationToken token)
        {
            DatabaseDriverBase db = host.Server.Context.Database;
            string t = host.TenantId;

            await SeedRunAsync(db, t, "agt_a", "alpha", HarnessTypeEnum.ClaudeCode, "dep_1", RunStatusEnum.Succeeded, _Base.AddMinutes(10), r =>
            {
                r.ServedModel = "claude-sonnet-5-5";
                r.InputTokens = 100;
                r.OutputTokens = 500;
                r.CachedTokens = 10;
                r.ReasoningTokens = 5;
                r.CostUsd = 0.01;
                r.ToolCallCount = 2;
                r.TimeToFirstTokenMs = 100;
                r.StreamingMs = 1000;
                r.ExecutionMs = 2000;
                r.QueueMs = 50;
            }, token).ConfigureAwait(false);
            await SeedRunAsync(db, t, "agt_a", "alpha", HarnessTypeEnum.ClaudeCode, "dep_1", RunStatusEnum.Failed, _Base.AddMinutes(20), r =>
            {
                r.ServedModel = "claude-sonnet-5-5";
                r.OutputTokens = 10;
                r.ToolCallCount = 1;
                r.TimeToFirstTokenMs = 300;
                r.StreamingMs = 50;
                r.ExecutionMs = 4000;
                r.QueueMs = 150;
            }, token).ConfigureAwait(false);
            await SeedRunAsync(db, t, "agt_a", "alpha", HarnessTypeEnum.ClaudeCode, "dep_1", RunStatusEnum.Succeeded, _Base.AddMinutes(150), r =>
            {
                r.ServedModel = "claude-haiku-5-5";
                r.OutputTokens = 1000;
                r.CostUsd = 0.02;
                r.TimeToFirstTokenMs = 200;
                r.StreamingMs = 2000;
                r.ExecutionMs = 3000;
            }, token).ConfigureAwait(false);
            await SeedRunAsync(db, t, "agt_b", "beta", HarnessTypeEnum.Codex, "dep_2", RunStatusEnum.Cancelled, _Base.AddMinutes(165), null, token).ConfigureAwait(false);
            await SeedRunAsync(db, t, "agt_b", "beta", HarnessTypeEnum.Codex, "dep_2", RunStatusEnum.TimedOut, _Base.AddMinutes(359), r =>
            {
                r.ServedModel = "gpt-5";
                r.TimeToFirstTokenMs = 1000;
                r.ExecutionMs = 10000;
            }, token).ConfigureAwait(false);

            // Outside the range: one before, one exactly at the exclusive end.
            await SeedRunAsync(db, t, "agt_a", "alpha", HarnessTypeEnum.ClaudeCode, "dep_1", RunStatusEnum.Succeeded, _Base.AddHours(-1), null, token).ConfigureAwait(false);
            await SeedRunAsync(db, t, "agt_a", "alpha", HarnessTypeEnum.ClaudeCode, "dep_1", RunStatusEnum.Succeeded, _Base.AddHours(6), null, token).ConfigureAwait(false);
        }

        private static string Path(TestServerHost host, string query)
        {
            return Path(host.TenantId, query);
        }

        private static string Path(string tenantId, string query)
        {
            return "/v1.0/api/tenants/" + tenantId + "/analytics/runs" + (String.IsNullOrEmpty(query) ? String.Empty : "?" + query);
        }

        private static string Range(DateTime fromUtc, DateTime toUtc)
        {
            return "from=" + Uri.EscapeDataString(fromUtc.ToString("yyyy-MM-ddTHH:mm:ssZ")) + "&to=" + Uri.EscapeDataString(toUtc.ToString("yyyy-MM-ddTHH:mm:ssZ"));
        }

        private static string Standard()
        {
            return Range(_Base, _Base.AddHours(6));
        }

        private static async Task<RunAnalyticsResponse> GetAsync(HttpClient client, string path, CancellationToken token)
        {
            return await HttpTestHelpers.SendAsync<RunAnalyticsResponse>(client, HttpMethod.Get, path, null, 200, token).ConfigureAwait(false);
        }

        private static async Task BucketsAndTotalsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                await SeedStandardAsync(host, token).ConfigureAwait(false);
                RunAnalyticsResponse response = await GetAsync(host.AdminClient, Path(host, Standard() + "&interval=hour"), token).ConfigureAwait(false);

                Assert.Equal("hour", response.Interval, "Interval");
                Assert.Equal(3600L, response.BucketSeconds, "Bucket seconds");
                Assert.Equal(_Base, response.FromUtc, "From");
                Assert.Equal(_Base.AddHours(6), response.ToUtc, "To");
                Assert.True(!response.Truncated, "Not truncated");

                RunAnalyticsMetrics totals = response.Totals;
                Assert.Equal(5L, totals.Runs, "Runs in range");
                Assert.Equal(2L, totals.Succeeded, "Succeeded");
                Assert.Equal(1L, totals.Failed, "Failed");
                Assert.Equal(1L, totals.Cancelled, "Cancelled");
                Assert.Equal(1L, totals.TimedOut, "Timed out");
                Assert.Equal(100L, totals.InputTokens, "Input tokens");
                Assert.Equal(1510L, totals.OutputTokens, "Output tokens");
                Assert.Equal(10L, totals.CachedTokens, "Cached tokens");
                Assert.Equal(5L, totals.ReasoningTokens, "Reasoning tokens");
                Assert.Equal(0.03, totals.CostUsd, "Cost");
                Assert.Equal(3L, totals.ToolCalls, "Tool calls");
                Assert.Equal(400.0, totals.TimeToFirstTokenMsAvg ?? -1, "TTFT average");
                Assert.Equal(200.0, totals.TimeToFirstTokenMsP50 ?? -1, "TTFT p50 (nearest rank)");
                Assert.Equal(1000.0, totals.TimeToFirstTokenMsP95 ?? -1, "TTFT p95 (nearest rank)");
                Assert.Equal(1016.7, totals.StreamingMsAvg ?? -1, "Streaming average");
                Assert.Equal(4750.0, totals.ExecutionMsAvg ?? -1, "Execution average");
                Assert.Equal(10000.0, totals.ExecutionMsP95 ?? -1, "Execution p95");
                Assert.Equal(100.0, totals.QueueMsAvg ?? -1, "Queue average");
                Assert.Equal(500.0, totals.OutputTokensPerSecondAvg ?? -1, "Tokens per second average (runs with at least 100 ms of streaming)");

                Assert.Equal(1, response.Series.Count, "One series without grouping");
                RunAnalyticsSeries all = response.Series[0];
                Assert.Equal("all", all.Key, "Series key");
                Assert.Equal("All runs", all.Label, "Series label");
                Assert.Equal(6, all.Buckets.Count, "Six hourly buckets");
                for (int i = 0; i < 6; i++) Assert.Equal(_Base.AddHours(i), all.Buckets[i].StartUtc, "Bucket " + i + " start");

                long[] expectedRuns = new long[] { 2, 0, 2, 0, 0, 1 };
                for (int i = 0; i < 6; i++) Assert.Equal(expectedRuns[i], all.Buckets[i].Runs, "Bucket " + i + " runs");
                Assert.Equal(200.0, all.Buckets[0].TimeToFirstTokenMsAvg ?? -1, "Bucket 0 TTFT average");
                Assert.Equal(100.0, all.Buckets[0].TimeToFirstTokenMsP50 ?? -1, "Bucket 0 TTFT p50");
                Assert.Equal(300.0, all.Buckets[0].TimeToFirstTokenMsP95 ?? -1, "Bucket 0 TTFT p95");
                Assert.Equal(3L, all.Buckets[0].ToolCalls, "Bucket 0 tool calls");
                Assert.True(all.Buckets[1].TimeToFirstTokenMsAvg == null && all.Buckets[1].ExecutionMsP95 == null && all.Buckets[1].OutputTokensPerSecondAvg == null, "Empty buckets have null averages.");
                Assert.Equal(0L, all.Buckets[1].OutputTokens, "Empty buckets have zero sums.");
                Assert.Equal(1L, all.Buckets[2].Succeeded, "Bucket 2 succeeded");
                Assert.Equal(1L, all.Buckets[2].Cancelled, "Bucket 2 cancelled");
                Assert.Equal(1L, all.Buckets[5].TimedOut, "Bucket 5 timed out");

                TestResponse raw = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, Path(host, Standard() + "&interval=hour"), null, token).ConfigureAwait(false);
                Assert.True(raw.Body.Contains("\"timeToFirstTokenMsAvg\":null", StringComparison.Ordinal), "Null averages are serialized explicitly.");
                Assert.True(raw.Body.Contains("\"bucketSeconds\":3600", StringComparison.Ordinal) && raw.Body.Contains("\"series\":[{\"key\":\"all\"", StringComparison.Ordinal), "Contract field names.");
                Assert.True(raw.Body.Contains("\"buckets\":[{\"startUtc\":", StringComparison.Ordinal), "Buckets lead with startUtc.");
            }
        }

        private static async Task FiltersAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                await SeedStandardAsync(host, token).ConfigureAwait(false);
                Assert.Equal(3L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&agentId=agt_a"), token).ConfigureAwait(false)).Totals.Runs, "agentId");
                Assert.Equal(2L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&harnessType=Codex"), token).ConfigureAwait(false)).Totals.Runs, "harnessType");
                Assert.Equal(2L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&harnessType=codex"), token).ConfigureAwait(false)).Totals.Runs, "harnessType is case-insensitive");
                Assert.Equal(3L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&deploymentId=dep_1"), token).ConfigureAwait(false)).Totals.Runs, "deploymentId");
                Assert.Equal(3L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&agentId=agt_a&deploymentId=dep_1&harnessType=ClaudeCode"), token).ConfigureAwait(false)).Totals.Runs, "All filters together");
                RunAnalyticsResponse none = await GetAsync(host.AdminClient, Path(host, Standard() + "&agentId=agt_b&harnessType=ClaudeCode&interval=hour"), token).ConfigureAwait(false);
                Assert.Equal(0L, none.Totals.Runs, "Filters are combined with AND");
                Assert.Equal(6, none.Series[0].Buckets.Count, "An empty result is still gap-filled");
                Assert.True(none.Totals.TimeToFirstTokenMsAvg == null, "Empty totals have null averages");
            }
        }

        private static async Task GroupByAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                await SeedStandardAsync(host, token).ConfigureAwait(false);
                RunAnalyticsResponse byAgent = await GetAsync(host.AdminClient, Path(host, Standard() + "&interval=hour&groupBy=agent"), token).ConfigureAwait(false);
                Assert.Equal(2, byAgent.Series.Count, "Agent series");
                Assert.Equal("agt_a", byAgent.Series[0].Key, "Largest series first");
                Assert.Equal("alpha", byAgent.Series[0].Label, "Agent label is the name");
                Assert.Equal("agt_b", byAgent.Series[1].Key, "Second series");
                Assert.Equal("beta", byAgent.Series[1].Label, "Second label");
                Assert.Equal(3L, byAgent.Series[0].Buckets.Sum(b => b.Runs), "Agent A runs");
                Assert.Equal(2L, byAgent.Series[1].Buckets.Sum(b => b.Runs), "Agent B runs");
                Assert.True(byAgent.Series.All(s => s.Buckets.Count == 6), "Each series is gap-filled");
                Assert.Equal(5L, byAgent.Totals.Runs, "Totals cover every series");

                RunAnalyticsResponse byHarness = await GetAsync(host.AdminClient, Path(host, Standard() + "&groupBy=harness"), token).ConfigureAwait(false);
                Assert.Equal(2, byHarness.Series.Count, "Harness series");
                Assert.Equal("ClaudeCode", byHarness.Series[0].Key, "Harness key");
                Assert.Equal("ClaudeCode", byHarness.Series[0].Label, "Harness label");
                Assert.Equal("Codex", byHarness.Series[1].Key, "Second harness");
                Assert.Equal(1000.0, byHarness.Series[1].Buckets.Where(b => b.TimeToFirstTokenMsP95.HasValue).Select(b => b.TimeToFirstTokenMsP95 ?? 0).Max(), "Codex p95 TTFT");

                RunAnalyticsResponse explicitNone = await GetAsync(host.AdminClient, Path(host, Standard() + "&groupBy=none"), token).ConfigureAwait(false);
                Assert.Equal("all", explicitNone.Series.Single().Key, "groupBy none");
            }
        }

        private static async Task ByModelAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                await SeedStandardAsync(host, token).ConfigureAwait(false);

                RunAnalyticsResponse byModel = await GetAsync(host.AdminClient, Path(host, Standard() + "&groupBy=model"), token).ConfigureAwait(false);
                Assert.Equal(4, byModel.Series.Count, "Model series");
                Assert.Equal("claude-sonnet-5-5", byModel.Series[0].Key, "Largest model first");
                Assert.Equal(2L, byModel.Series[0].Buckets.Sum(b => b.Runs), "Sonnet runs");
                Assert.True(byModel.Series.Any(x => x.Key == "unknown" && x.Buckets.Sum(b => b.Runs) == 1), "A run without a model groups under unknown");

                RunAnalyticsResponse byPair = await GetAsync(host.AdminClient, Path(host, Standard() + "&groupBy=harnessModel"), token).ConfigureAwait(false);
                RunAnalyticsSeries sonnet = Assert.NotNull(byPair.Series.FirstOrDefault(x => x.Key == "ClaudeCode|claude-sonnet-5-5"), "Harness and model series");
                Assert.Equal("ClaudeCode / claude-sonnet-5-5", sonnet.Label, "Harness and model label");
                Assert.True(byPair.Series.Any(x => x.Key == "Codex|gpt-5"), "Codex and gpt-5 series");
                Assert.True(byPair.Series.Any(x => x.Key == "Codex|unknown"), "Codex without a model");
                Assert.Equal(4, byPair.Series.Count, "Harness and model series count");

                RunAnalyticsResponse filtered = await GetAsync(host.AdminClient, Path(host, Standard() + "&model=gpt-5"), token).ConfigureAwait(false);
                Assert.Equal(1L, filtered.Totals.Runs, "model filter");
                RunAnalyticsResponse unknown = await GetAsync(host.AdminClient, Path(host, Standard() + "&model=unknown"), token).ConfigureAwait(false);
                Assert.Equal(1L, unknown.Totals.Runs, "model=unknown matches runs without a model");
                RunAnalyticsResponse combined = await GetAsync(host.AdminClient, Path(host, Standard() + "&model=claude-sonnet-5-5&harnessType=Codex"), token).ConfigureAwait(false);
                Assert.Equal(0L, combined.Totals.Runs, "model combines with other filters");

                RunAnalyticsDimensions dimensions = await HttpTestHelpers.SendAsync<RunAnalyticsDimensions>(host.AdminClient, HttpMethod.Get,
                    "/v1.0/api/tenants/" + host.TenantId + "/analytics/runs/dimensions?" + Standard(), null, 200, token).ConfigureAwait(false);
                Assert.Equal(2, dimensions.Agents.Count, "Agents");
                Assert.Equal("alpha", dimensions.Agents[0].Name, "Agents ordered by name");
                Assert.Equal(2, dimensions.Harnesses.Count, "Harnesses");
                Assert.Equal(2, dimensions.Deployments.Count, "Deployments");
                Assert.True(dimensions.Deployments.All(d => !String.IsNullOrEmpty(d.AgentId)), "Deployments carry their agent");
                Assert.Equal(4, dimensions.Models.Count, "Models");
                Assert.True(dimensions.Models.Contains("unknown"), "unknown model listed");
                Assert.True(!dimensions.Truncated, "Not truncated");
            }
        }

        private static async Task ModelEncodingAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                string t = host.TenantId;
                string[] models = new string[] { "gpt-oss:20b", "my model", "a+b", "org/model-1" };
                foreach (string model in models)
                {
                    await SeedRunAsync(db, t, "agt_m", "mux", HarnessTypeEnum.Mux, "dep_m", RunStatusEnum.Succeeded, _Base.AddMinutes(30), r => r.ServedModel = model, token).ConfigureAwait(false);
                }
                await SeedRunAsync(db, t, "agt_m", "mux", HarnessTypeEnum.Mux, "dep_m", RunStatusEnum.Succeeded, _Base.AddMinutes(31), r => r.ServedModel = "gpt-oss:20b", token).ConfigureAwait(false);

                Assert.Equal(2L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&model=gpt-oss%3A20b"), token).ConfigureAwait(false)).Totals.Runs, "Percent-encoded colon (what browsers and SDKs send)");
                Assert.Equal(2L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&model=gpt-oss:20b"), token).ConfigureAwait(false)).Totals.Runs, "Raw colon");
                Assert.Equal(1L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&model=my%20model"), token).ConfigureAwait(false)).Totals.Runs, "Space as %20");
                Assert.Equal(1L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&model=my+model"), token).ConfigureAwait(false)).Totals.Runs, "Space as a plus sign (form encoding, Go url.Values)");
                Assert.Equal(1L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&model=a%2Bb"), token).ConfigureAwait(false)).Totals.Runs, "Literal plus sign as %2B");
                Assert.Equal(1L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&model=org%2Fmodel-1"), token).ConfigureAwait(false)).Totals.Runs, "Slash as %2F");
                Assert.Equal(1L, (await GetAsync(host.AdminClient, Path(host, Standard() + "&model=" + Uri.EscapeDataString("org/model-1")), token).ConfigureAwait(false)).Totals.Runs, "Uri.EscapeDataString round trip");

                Assert.Equal("gpt-oss:20b", RouteHelpers.DecodeQueryValue("gpt-oss%3A20b"), "Decode colon");
                Assert.Equal("a b", RouteHelpers.DecodeQueryValue("a+b"), "Plus is a space");
                Assert.Equal("a+b", RouteHelpers.DecodeQueryValue("a%2Bb"), "Encoded plus");
                Assert.Equal("100%", RouteHelpers.DecodeQueryValue("100%25"), "Encoded percent");

                // Dates keep a raw plus sign as an offset sign.
                RunAnalyticsResponse offset = await GetAsync(host.AdminClient, Path(host, "from=2026-01-05T02:00:00+02:00&to=2026-01-05T06:00:00Z"), token).ConfigureAwait(false);
                Assert.Equal(_Base, offset.FromUtc, "A raw +02:00 offset still parses");
            }
        }

        private static async Task IntervalsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                await SeedStandardAsync(host, token).ConfigureAwait(false);

                RunAnalyticsResponse auto6h = await GetAsync(host.AdminClient, Path(host, Standard()), token).ConfigureAwait(false);
                Assert.Equal(300L, auto6h.BucketSeconds, "Auto over 6 hours uses 5 minute buckets");
                Assert.Equal("auto", auto6h.Interval, "Interval name for a size that is not a named interval");
                Assert.Equal(72, auto6h.Series[0].Buckets.Count, "72 buckets");
                Assert.Equal(5L, auto6h.Series[0].Buckets.Sum(b => b.Runs), "Every run lands in a bucket");

                RunAnalyticsResponse auto1h = await GetAsync(host.AdminClient, Path(host, Range(_Base, _Base.AddHours(1)) + "&interval=auto"), token).ConfigureAwait(false);
                Assert.Equal("minute", auto1h.Interval, "Auto over one hour uses minutes");
                Assert.Equal(60, auto1h.Series[0].Buckets.Count, "60 minute buckets");

                RunAnalyticsResponse auto30d = await GetAsync(host.AdminClient, Path(host, Range(_Base, _Base.AddDays(30))), token).ConfigureAwait(false);
                Assert.Equal(43200L, auto30d.BucketSeconds, "Auto over 30 days uses 12 hour buckets");
                Assert.True(auto30d.Series[0].Buckets.Count >= 24 && auto30d.Series[0].Buckets.Count <= 96, "Auto stays within 24 to 96 buckets");

                RunAnalyticsResponse auto7d = await GetAsync(host.AdminClient, Path(host, Range(_Base, _Base.AddDays(7))), token).ConfigureAwait(false);
                Assert.True(auto7d.Series[0].Buckets.Count >= 24 && auto7d.Series[0].Buckets.Count <= 96, "Auto over 7 days stays within 24 to 96 buckets (was " + auto7d.Series[0].Buckets.Count + ")");

                RunAnalyticsResponse days = await GetAsync(host.AdminClient, Path(host, Range(_Base.AddHours(-12), _Base.AddDays(2)) + "&interval=day"), token).ConfigureAwait(false);
                Assert.Equal(86400L, days.BucketSeconds, "Day bucket");
                Assert.Equal(_Base.AddDays(-1), days.Series[0].Buckets[0].StartUtc, "Day buckets align to UTC midnight");
                Assert.Equal(3, days.Series[0].Buckets.Count, "Partial first day plus two days");
                Assert.Equal(1L, days.Series[0].Buckets[0].Runs, "Run from the previous day");
                Assert.Equal(6L, days.Series[0].Buckets[1].Runs, "Runs on the first full day");

                RunAnalyticsResponse weeks = await GetAsync(host.AdminClient, Path(host, Range(_Base.AddDays(2), _Base.AddDays(20)) + "&interval=week"), token).ConfigureAwait(false);
                Assert.Equal("week", weeks.Interval, "Week interval");
                Assert.Equal(_Base, weeks.Series[0].Buckets[0].StartUtc, "Weeks start on Monday");
                Assert.Equal(3, weeks.Series[0].Buckets.Count, "Three weeks");

                RunAnalyticsResponse defaultRange = await GetAsync(host.AdminClient, Path(host, String.Empty), token).ConfigureAwait(false);
                Assert.True(Math.Abs((defaultRange.ToUtc - defaultRange.FromUtc).TotalHours - 24) < 0.01, "Default range is the last 24 hours");
                Assert.True(Math.Abs((DateTime.UtcNow - defaultRange.ToUtc).TotalMinutes) < 5, "Default end is now");
                Assert.Equal(0L, defaultRange.Totals.Runs, "Seeded runs are outside the default range");

                Assert.Equal(300L, RunAnalyticsService.BucketSeconds(RunAnalyticsIntervalEnum.Auto, _Base, _Base.AddHours(6)), "Ladder for 6 hours");
                Assert.Equal(900L, RunAnalyticsService.BucketSeconds(RunAnalyticsIntervalEnum.Auto, _Base, _Base.AddHours(24)), "Ladder for 24 hours");
                Assert.Equal(7200L, RunAnalyticsService.BucketSeconds(RunAnalyticsIntervalEnum.Auto, _Base, _Base.AddDays(7)), "Ladder for 7 days");
                Assert.Equal(604800L * 2, RunAnalyticsService.BucketSeconds(RunAnalyticsIntervalEnum.Auto, _Base, _Base.AddDays(1000)), "Whole weeks for very long ranges");
            }
        }

        private static async Task ValidationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, Path(host, Range(_Base, _Base)), null, token).ConfigureAwait(false)).StatusCode, "from equal to to");
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, Path(host, Range(_Base.AddHours(1), _Base)), null, token).ConfigureAwait(false)).StatusCode, "from after to");
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, Path(host, Range(_Base, _Base.AddDays(7)) + "&interval=minute"), null, token).ConfigureAwait(false)).StatusCode, "More than 400 buckets");
                Assert.Equal(200, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, Path(host, Range(_Base, _Base.AddMinutes(400)) + "&interval=minute"), null, token).ConfigureAwait(false)).StatusCode, "Exactly 400 buckets");
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, Path(host, Standard() + "&interval=fortnight"), null, token).ConfigureAwait(false)).StatusCode, "Unknown interval");
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, Path(host, Standard() + "&groupBy=node"), null, token).ConfigureAwait(false)).StatusCode, "Unknown groupBy");
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, Path(host, Standard() + "&harnessType=Nope"), null, token).ConfigureAwait(false)).StatusCode, "Unknown harness type");
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, Path(host, "from=yesterday"), null, token).ConfigureAwait(false)).StatusCode, "Unparseable from");
                TestResponse error = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, Path(host, Standard() + "&interval=2"), null, token).ConfigureAwait(false);
                Assert.Equal(400, error.StatusCode, "Numeric interval");
                Assert.True(error.Body.Contains("ValidationFailed", StringComparison.Ordinal), "Validation error body");
            }
        }

        private static async Task AuthAndIsolationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                await SeedStandardAsync(host, token).ConfigureAwait(false);
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Analytics Other" }, 201, token).ConfigureAwait(false);
                await SeedRunAsync(host.Server.Context.Database, other.Id, "agt_x", "xray", HarnessTypeEnum.ClaudeCode, "dep_x", RunStatusEnum.Succeeded, _Base.AddMinutes(30), r => r.TimeToFirstTokenMs = 99999, token).ConfigureAwait(false);

                RunAnalyticsResponse own = await GetAsync(host.AdminClient, Path(host, Standard()), token).ConfigureAwait(false);
                Assert.Equal(5L, own.Totals.Runs, "Another tenant's runs are not counted");
                Assert.Equal(1000.0, own.Totals.TimeToFirstTokenMsP95 ?? -1, "Another tenant's timings are not counted");
                RunAnalyticsResponse theirs = await GetAsync(host.AdminClient, Path(other.Id, Standard()), token).ConfigureAwait(false);
                Assert.Equal(1L, theirs.Totals.Runs, "The other tenant sees only its run");

                using (HttpClient anonymous = new HttpClient())
                {
                    anonymous.BaseAddress = new Uri(host.BaseUrl);
                    Assert.Equal(401, (await HttpTestHelpers.SendAsync(anonymous, HttpMethod.Get, Path(host, Standard()), null, token).ConfigureAwait(false)).StatusCode, "Unauthenticated");
                }

                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/users", new UserRequest { Email = "norole@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                using (HttpClient noRole = await host.UserClientAsync("norole@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(noRole, HttpMethod.Get, Path(host, Standard()), null, token).ConfigureAwait(false)).StatusCode, "Run Read is required");
                }

                User viewer = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/users", new UserRequest { Email = "viewer@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/user-role-assignments", new AssignmentRequest { UserId = viewer.Id, RoleName = "Viewer" }, 201, token).ConfigureAwait(false);
                using (HttpClient client = await host.UserClientAsync("viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    RunAnalyticsResponse viewed = await GetAsync(client, Path(host, Standard()), token).ConfigureAwait(false);
                    Assert.Equal(5L, viewed.Totals.Runs, "Viewer (Run Read) can read analytics");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, Path(other.Id, Standard()), null, token).ConfigureAwait(false)).StatusCode, "Cross-tenant analytics return 404");
                }
            }
        }

        private static async Task TruncationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                await SeedStandardAsync(host, token).ConfigureAwait(false);
                RunAnalyticsService service = new RunAnalyticsService(host.Server.Context.Database);
                service.MaxRuns = 3;
                RunAnalyticsQuery query = new RunAnalyticsQuery();
                query.TenantId = host.TenantId;
                query.FromUtc = _Base;
                query.ToUtc = _Base.AddHours(6);
                query.Interval = RunAnalyticsIntervalEnum.Hour;
                RunAnalyticsResponse response = await service.QueryAsync(query, token).ConfigureAwait(false);
                Assert.True(response.Truncated, "Truncated");
                Assert.Equal(3L, response.Totals.Runs, "Capped runs");
                Assert.Equal(0L, response.Series[0].Buckets[0].Runs, "The oldest runs are dropped first");
                Assert.Equal(1L, response.Series[0].Buckets[5].Runs, "The newest run is kept");

                service.MaxRuns = 5;
                Assert.True(!(await service.QueryAsync(query, token).ConfigureAwait(false)).Truncated, "Exactly at the cap is not truncated");
            }
        }

        #endregion
    }
}
