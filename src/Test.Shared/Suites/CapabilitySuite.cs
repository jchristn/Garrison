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
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Capability catalog (AD4): manual descriptors with schema validation and tenant isolation; Agent descriptors derived
    /// from published revisions only; MCP tool descriptors from a stdio server listed through a worker, with removal and
    /// last-good-list on failure; harness tool probes reported as node labels and used for placement; cost and latency
    /// hints; and the catalog MCP tools filtered for run tokens.
    /// </summary>
    public static class CapabilitySuite
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
            unit.Add(new TestCaseDescriptor("capabilities-unit", "hints-and-probes", "Hints below the minimum sample are Unknown with null values; known hints match the samples; tool probe rules and the first-definition-wins probe set", UnitAsync));
            suites.Add(new TestSuiteDescriptor("capabilities-unit", "Capability catalog (unit)", unit));
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "capabilities-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "manual-crud", "Manual descriptors: InvalidJsonSchema, NameConflict, filters, 404 across tenants, and derived descriptors refuse changes (" + provider + ")", ct => ManualAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "agent-derivation", "Publishing a revision updates the agent's descriptor; a draft never shows; hints follow seeded runs (" + provider + ")", ct => AgentDerivationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp-tools", "A stdio MCP server's tools appear with description and schema, a removed tool disappears, and a failed refresh keeps the last good list with a warning (" + provider + ")", ct => McpToolsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "probes-placement", "A worker reports a probed tool as a node label; a run needing a missing tool queues with NoToolWorker; one needing a present tool runs (" + provider + ")", ct => ProbesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "catalog-tools", "garrison_list_capabilities for a run token shows only allowed agents, bound MCP tools, and its harness's built-ins; users see the tenant catalog (" + provider + ")", ct => CatalogToolsAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Capability catalog (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static void Code(TestResponse response, int status, string code, string what)
        {
            Assert.Equal(status, response.StatusCode, what + " status (" + response.Body + ")");
            Assert.True(response.Body.Contains(code, StringComparison.Ordinal), what + " answers " + code + ": " + response.Body);
        }

        private static void Refused(Func<HarnessToolProbe> build, string what)
        {
            try
            {
                build();
            }
            catch (ArgumentException)
            {
                return;
            }
            throw new TestAssertionException(what + ": expected ArgumentException.");
        }

        private static Task UnitAsync(CancellationToken token)
        {
            List<CapabilityRunSample> few = Enumerable.Range(1, 4).Select(i => new CapabilityRunSample { DurationMs = i * 1000, CostUsd = 0.01 }).ToList();
            CapabilityHints unknown = CapabilityService.ComputeHints(few, 5, 14);
            Assert.Equal(CapabilityHintStatusEnum.Unknown, unknown.Status, "Too few samples");
            Assert.Equal(4, unknown.SampleSize, "Sample size is still reported");
            Assert.True(unknown.MedianDurationMs == null && unknown.P90DurationMs == null && unknown.MeanCostUsd == null, "Unknown hints are null, never zero");

            List<CapabilityRunSample> samples = Enumerable.Range(1, 10).Select(i => new CapabilityRunSample { DurationMs = i * 1000, CostUsd = i % 2 == 0 ? 0.02 : (double?)null }).ToList();
            CapabilityHints known = CapabilityService.ComputeHints(samples, 5, 14);
            Assert.Equal(CapabilityHintStatusEnum.Known, known.Status, "Enough samples");
            Assert.Equal(5000L, known.MedianDurationMs ?? -1, "Median of 1..10 seconds (nearest rank)");
            Assert.Equal(9000L, known.P90DurationMs ?? -1, "p90 of 1..10 seconds");
            Assert.Equal(0.02, known.MeanCostUsd ?? -1, "Mean over runs that recorded a cost");

            Refused(() => new HarnessToolProbe { Executable = "/usr/bin/pandoc" }, "A path is not a bare executable");
            Refused(() => new HarnessToolProbe { Arguments = new List<string> { "-c", "rm" } }, "Arbitrary arguments are refused");
            Refused(() => new HarnessToolProbe { Name = "Has Space" }, "Names are label-safe");
            HarnessToolProbe ok = new HarnessToolProbe { Name = "pandoc", Executable = "pandoc", Arguments = new List<string> { "--version" } };
            Assert.Equal("pandoc", ok.Name, "A valid probe");

            List<HarnessToolProbeSource> sources = new List<HarnessToolProbeSource>
            {
                new HarnessToolProbeSource { HarnessProfileId = "a", Probe = new HarnessToolProbe { Name = "pandoc", Executable = "pandoc" } },
                new HarnessToolProbeSource { HarnessProfileId = "b", TenantId = "ten_x", Probe = new HarnessToolProbe { Name = "pandoc", Executable = "pandoc2" } },
                new HarnessToolProbeSource { HarnessProfileId = "c", TenantId = "ten_x", Probe = new HarnessToolProbe { Name = "jq", Executable = "jq" } },
                new HarnessToolProbeSource { HarnessProfileId = "d", TenantId = "ten_x", Active = false, Probe = new HarnessToolProbe { Name = "inactive", Executable = "x" } }
            };
            ToolProbeSet set = ToolProbeCatalog.Build(sources);
            Assert.Equal("pandoc:pandoc,jq:jq", String.Join(",", set.Probes.Select(p => p.Name + ":" + p.Executable)), "First definition wins; inactive profiles are skipped");
            Assert.Equal(16, set.Hash.Length, "Short hash");
            Assert.Equal(set.Hash, ToolProbeCatalog.Build(sources).Hash, "Stable hash");
            return Task.CompletedTask;
        }

        private static async Task ManualAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string caps = T(host) + "/capabilities";
                CapabilityDescriptor body = new CapabilityDescriptor
                {
                    Name = "docx-to-pdf", Kind = CapabilityKindEnum.HarnessBuiltIn, Summary = "Converts DOCX to PDF on the shared conversion host.",
                    InputSchemaJson = "{\"type\":\"object\",\"properties\":{\"path\":{\"type\":\"string\"}}}", Tags = new List<string> { "documents", "pdf" }
                };
                CapabilityDescriptor created = await HttpTestHelpers.SendAsync<CapabilityDescriptor>(host.AdminClient, HttpMethod.Post, caps, body, 201, token).ConfigureAwait(false);
                Assert.True(created.Id.StartsWith("cap_", StringComparison.Ordinal) && created.Origin == CapabilityOriginEnum.Manual && created.TenantId == host.TenantId, "Manual descriptor");
                Assert.Equal(CapabilityHintStatusEnum.Unknown, created.Hints.Status, "No hints yet");

                CapabilityDescriptor bad = new CapabilityDescriptor { Name = "bad-schema", Kind = CapabilityKindEnum.McpTool, InputSchemaJson = "{\"type\":\"not-a-type\"}" };
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, caps, bad, token).ConfigureAwait(false), 400, "InvalidJsonSchema", "Invalid schema");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, caps, body, token).ConfigureAwait(false), 409, "NameConflict", "Duplicate manual name");

                created.Summary = "Converts DOCX and ODT to PDF.";
                CapabilityDescriptor updated = await HttpTestHelpers.SendAsync<CapabilityDescriptor>(host.AdminClient, HttpMethod.Put, caps + "/" + created.Id, created, 200, token).ConfigureAwait(false);
                Assert.Equal("Converts DOCX and ODT to PDF.", updated.Summary ?? String.Empty, "Updated");

                EnumerationResult<CapabilityDescriptor> byTag = await HttpTestHelpers.SendAsync<EnumerationResult<CapabilityDescriptor>>(host.AdminClient, HttpMethod.Get, caps + "?tag=pdf", null, 200, token).ConfigureAwait(false);
                Assert.Equal(1, byTag.Objects.Count, "Tag filter");
                EnumerationResult<CapabilityDescriptor> bySearch = await HttpTestHelpers.SendAsync<EnumerationResult<CapabilityDescriptor>>(host.AdminClient, HttpMethod.Get, caps + "?search=ODT", null, 200, token).ConfigureAwait(false);
                Assert.True(bySearch.Objects.Any(d => d.Id == created.Id), "Search in summary");
                CapabilityDescriptor byName = await HttpTestHelpers.SendAsync<CapabilityDescriptor>(host.AdminClient, HttpMethod.Get, caps + "/docx-to-pdf", null, 200, token).ConfigureAwait(false);
                Assert.Equal(created.Id, byName.Id, "Read by name");

                // Built-in profiles declare tool probes; a refresh derives shared HarnessBuiltIn descriptors from them.
                await host.Server.Context.Get<CapabilityService>().SyncHarnessBuiltInsAsync(token).ConfigureAwait(false);
                EnumerationResult<CapabilityDescriptor> builtIns = await HttpTestHelpers.SendAsync<EnumerationResult<CapabilityDescriptor>>(host.AdminClient, HttpMethod.Get, caps + "?kind=HarnessBuiltIn", null, 200, token).ConfigureAwait(false);
                CapabilityDescriptor pandoc = Assert.NotNull(builtIns.Objects.FirstOrDefault(d => d.Name == "pandoc" && d.Origin == CapabilityOriginEnum.Derived), "Derived pandoc descriptor");
                Assert.True(pandoc.TenantId == null && pandoc.Requirements.Any(r => r.Key == "garrison.io/tool-pandoc" && r.Value == "true"), "Shared, and requires the tool label");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, caps + "/" + pandoc.Id, created, token).ConfigureAwait(false), 409, "CapabilityDerived", "Derived descriptors cannot be edited");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, caps + "/" + pandoc.Id, null, token).ConfigureAwait(false), 409, "CapabilityDerived", "Derived descriptors cannot be deleted");

                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Capabilities Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "cap-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("cap-outsider@example.com", "password123", other.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/capabilities/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's descriptor");
                    EnumerationResult<CapabilityDescriptor> theirs = await HttpTestHelpers.SendAsync<EnumerationResult<CapabilityDescriptor>>(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/capabilities", null, 200, token).ConfigureAwait(false);
                    Assert.True(!theirs.Objects.Any(d => d.TenantId == host.TenantId), "Other tenants list none of ours");
                    Assert.True(theirs.Objects.Any(d => d.Name == "pandoc"), "Shared built-ins are visible to every tenant");
                }

                await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, caps + "/" + created.Id, null, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, caps + "/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "Deleted");
            }
        }

        private static async Task AgentDerivationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string caps = T(host) + "/capabilities";
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "cap-writer", Description = "Writes reports.", InputSchemaJson = "{\"type\":\"object\",\"properties\":{\"topic\":{\"type\":\"string\"}}}" }, 201, token).ConfigureAwait(false);
                CapabilityDescriptor first = await HttpTestHelpers.SendAsync<CapabilityDescriptor>(host.AdminClient, HttpMethod.Get, caps + "/cap-writer", null, 200, token).ConfigureAwait(false);
                Assert.True(first.Kind == CapabilityKindEnum.Agent && first.SourceAgentId == agent.Id && first.SourceRevisionId == agent.LatestPublishedRevisionId, "Descriptor from revision 1");
                Assert.True((first.Summary ?? String.Empty).Contains("Writes reports.", StringComparison.Ordinal) && (first.InputSchemaJson ?? String.Empty).Contains("topic", StringComparison.Ordinal), "Summary and schema from the revision");

                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions", new AgentRevision { Description = "Draft text that must not show." }, 201, token).ConfigureAwait(false);
                CapabilityDescriptor draft = await HttpTestHelpers.SendAsync<CapabilityDescriptor>(host.AdminClient, HttpMethod.Get, caps + "/cap-writer", null, 200, token).ConfigureAwait(false);
                Assert.True(draft.SourceRevisionId == first.SourceRevisionId && !(draft.Summary ?? String.Empty).Contains("Draft text", StringComparison.Ordinal), "A draft never changes the descriptor");

                AgentRevision two = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions/2/publish", null, 200, token).ConfigureAwait(false);
                CapabilityDescriptor published = await HttpTestHelpers.SendAsync<CapabilityDescriptor>(host.AdminClient, HttpMethod.Get, caps + "/cap-writer", null, 200, token).ConfigureAwait(false);
                Assert.True(published.Id == first.Id && published.SourceRevisionId == two.Id, "Publishing refreshes the same descriptor");
                Assert.True((published.Summary ?? String.Empty).Contains("Draft text that must not show.", StringComparison.Ordinal), "Published content shows");

                // Hints (AD4.5): four finished runs are not enough; six are.
                Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = "cap-writer", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
                CapabilityService service = host.Server.Context.Get<CapabilityService>();
                for (int i = 1; i <= 6; i++)
                {
                    DateTime started = DateTime.UtcNow.AddHours(-i);
                    await host.Server.Context.Database.Runs.CreateAsync(new Run
                    {
                        TenantId = host.TenantId, AgentId = agent.Id, AgentName = agent.Name, DeploymentId = deployment.Id, Status = RunStatusEnum.Succeeded, Outcome = RunOutcomeEnum.Succeeded,
                        CallerType = PrincipalTypeEnum.Administrator, StartedUtc = started, CompletedUtc = started.AddSeconds(i * 10), CostUsd = 0.5
                    }, token).ConfigureAwait(false);
                    if (i == 4)
                    {
                        await service.RefreshHintsAsync(host.TenantId, token).ConfigureAwait(false);
                        CapabilityDescriptor few = await HttpTestHelpers.SendAsync<CapabilityDescriptor>(host.AdminClient, HttpMethod.Get, caps + "/cap-writer", null, 200, token).ConfigureAwait(false);
                        Assert.True(few.Hints.Status == CapabilityHintStatusEnum.Unknown && few.Hints.SampleSize == 4 && few.Hints.MedianDurationMs == null && few.Hints.MeanCostUsd == null, "Four runs: Unknown, never zero");
                    }
                }
                await service.RefreshHintsAsync(host.TenantId, token).ConfigureAwait(false);
                CapabilityDescriptor hinted = await HttpTestHelpers.SendAsync<CapabilityDescriptor>(host.AdminClient, HttpMethod.Get, caps + "/cap-writer", null, 200, token).ConfigureAwait(false);
                Assert.True(hinted.Hints.Status == CapabilityHintStatusEnum.Known && hinted.Hints.SampleSize == 6, "Six runs: Known");
                Assert.Equal(30000L, hinted.Hints.MedianDurationMs ?? -1, "Median of 10..60 seconds");
                Assert.Equal(60000L, hinted.Hints.P90DurationMs ?? -1, "p90 of 10..60 seconds");
                Assert.Equal(0.5, hinted.Hints.MeanCostUsd ?? -1, "Mean cost");

                await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/deployments/" + deployment.Id, null, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/" + agent.Id, null, token).ConfigureAwait(false);
                EnumerationResult<CapabilityDescriptor> after = await HttpTestHelpers.SendAsync<EnumerationResult<CapabilityDescriptor>>(host.AdminClient, HttpMethod.Get, caps + "?kind=Agent", null, 200, token).ConfigureAwait(false);
                Assert.True(!after.Objects.Any(d => d.SourceAgentId == agent.Id), "A deleted agent's descriptor goes with it");
            }
        }

        private static async Task McpToolsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                cluster.Workers.Add(await TestCluster.StartWorkerAsync(cluster.Server.BaseUrl, "cap-diagnostics", settings => settings.McpTestsEnabled = true, token).ConfigureAwait(false));
                TestServerHost host = cluster.Server;
                string caps = T(host) + "/capabilities";
                McpServer server = await HttpTestHelpers.SendAsync<McpServer>(host.AdminClient, HttpMethod.Post, T(host) + "/mcp-servers", new McpServer
                {
                    Name = "fixture", Active = true, Transport = McpTransportEnum.Stdio, Command = "garrison-fake-harness", Arguments = new List<string> { "--mcp-stdio", "--stdio-describe" }
                }, 201, token).ConfigureAwait(false);

                CapabilityRefreshResult refreshed = await HttpTestHelpers.SendAsync<CapabilityRefreshResult>(host.AdminClient, HttpMethod.Post, caps + "/refresh?mcpServerId=" + server.Id, null, 200, token).ConfigureAwait(false);
                CapabilityServerRefresh outcome = refreshed.McpServers.Single();
                Assert.True(outcome.Error == null && outcome.Tools == 2, "Two tools listed: " + outcome.Error);
                EnumerationResult<CapabilityDescriptor> tools = await HttpTestHelpers.SendAsync<EnumerationResult<CapabilityDescriptor>>(host.AdminClient, HttpMethod.Get, caps + "?kind=McpTool", null, 200, token).ConfigureAwait(false);
                CapabilityDescriptor echo = Assert.NotNull(tools.Objects.FirstOrDefault(d => d.Name == "fixture/fixture_echo"), "fixture_echo descriptor");
                Assert.True(echo.SourceMcpServerId == server.Id && echo.SourceToolName == "fixture_echo", "Source server and tool");
                Assert.Equal("Echoes the text it is given.", echo.Summary ?? String.Empty, "Description copied");
                Assert.True((echo.InputSchemaJson ?? String.Empty).Contains("\"text\"", StringComparison.Ordinal), "Input schema copied");
                Assert.True(tools.Objects.Any(d => d.Name == "fixture/fixture_status"), "Second page tool");

                server.Arguments = new List<string> { "--mcp-stdio", "--stdio-single" };
                await HttpTestHelpers.SendAsync<McpServer>(host.AdminClient, HttpMethod.Put, T(host) + "/mcp-servers/" + server.Id, server, 200, token).ConfigureAwait(false);
                refreshed = await HttpTestHelpers.SendAsync<CapabilityRefreshResult>(host.AdminClient, HttpMethod.Post, caps + "/refresh?mcpServerId=" + server.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(1, refreshed.McpServers.Single().Removed, "One tool removed");
                tools = await HttpTestHelpers.SendAsync<EnumerationResult<CapabilityDescriptor>>(host.AdminClient, HttpMethod.Get, caps + "?kind=McpTool", null, 200, token).ConfigureAwait(false);
                Assert.True(!tools.Objects.Any(d => d.Name == "fixture/fixture_status"), "A removed tool disappears");

                server.Arguments = new List<string> { "--mcp-stdio", "--stdio-malformed" };
                await HttpTestHelpers.SendAsync<McpServer>(host.AdminClient, HttpMethod.Put, T(host) + "/mcp-servers/" + server.Id, server, 200, token).ConfigureAwait(false);
                refreshed = await HttpTestHelpers.SendAsync<CapabilityRefreshResult>(host.AdminClient, HttpMethod.Post, caps + "/refresh?mcpServerId=" + server.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(refreshed.McpServers.Single().Error != null, "The refresh failed");
                tools = await HttpTestHelpers.SendAsync<EnumerationResult<CapabilityDescriptor>>(host.AdminClient, HttpMethod.Get, caps + "?kind=McpTool", null, 200, token).ConfigureAwait(false);
                CapabilityDescriptor kept = Assert.NotNull(tools.Objects.FirstOrDefault(d => d.Name == "fixture/fixture_echo"), "The last good list is kept");
                Assert.True((kept.RefreshWarning ?? String.Empty).StartsWith("Refresh failed", StringComparison.Ordinal) && kept.Id == echo.Id, "Warning recorded, descriptor kept: " + kept.RefreshWarning);

                await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/mcp-servers/" + server.Id, null, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<CapabilityRefreshResult>(host.AdminClient, HttpMethod.Post, caps + "/refresh", null, 200, token).ConfigureAwait(false);
                tools = await HttpTestHelpers.SendAsync<EnumerationResult<CapabilityDescriptor>>(host.AdminClient, HttpMethod.Get, caps + "?kind=McpTool", null, 200, token).ConfigureAwait(false);
                Assert.Equal(0, tools.Objects.Count(d => d.SourceMcpServerId == server.Id), "A deleted server's tools go with it");
            }
        }

        private static async Task<HarnessProfile> ProbeProfileAsync(TestServerHost host, CancellationToken token)
        {
            HarnessProfile profile = await HttpTestHelpers.SendAsync<HarnessProfile>(host.AdminClient, HttpMethod.Post, T(host) + "/harness-profiles/hrn_builtin_fake/clone", new CloneRequest { Name = "fake-with-tools" }, 201, token).ConfigureAwait(false);
            profile.ToolProbes = new List<HarnessToolProbe>
            {
                new HarnessToolProbe { Name = "dotnet-sdk", Executable = "dotnet", Arguments = new List<string> { "--version" }, Description = "The .NET SDK." },
                new HarnessToolProbe { Name = "absent-tool", Executable = "garrison-no-such-tool", Arguments = new List<string> { "--version" } }
            };
            return await HttpTestHelpers.SendAsync<HarnessProfile>(host.AdminClient, HttpMethod.Put, T(host) + "/harness-profiles/" + profile.Id, profile, 200, token).ConfigureAwait(false);
        }

        private static async Task<Node> WaitForLabelAsync(TestServerHost host, string label, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(45);
            while (true)
            {
                Node? node = (await host.Server.Context.Database.Nodes.EnumerateAsync(new EnumerationQuery(), token).ConfigureAwait(false)).Objects.FirstOrDefault();
                if (node != null && node.Labels.Any(l => l.Key == label && l.Value == "true")) return node;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("No node reported " + label + "; labels: " + String.Join(", ", node?.Labels.Select(l => l.Key) ?? new List<string>()));
                await Task.Delay(250, token).ConfigureAwait(false);
            }
        }

        private static async Task ProbesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                HarnessProfile profile = await ProbeProfileAsync(host, token).ConfigureAwait(false);
                Node node = await WaitForLabelAsync(host, "garrison.io/tool-dotnet-sdk", token).ConfigureAwait(false);
                Assert.True(!node.Labels.Any(l => l.Key == "garrison.io/tool-absent-tool"), "A missing tool is not reported");

                Agent needsAbsent = await cluster.CreateAgentAsync("cap-needs-absent", profile.Name, null, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + needsAbsent.Id + "/revisions", new AgentRevision { Description = "Needs a tool no worker has.", Capabilities = new List<string> { "absent-tool" } }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + needsAbsent.Id + "/revisions/2/publish", null, 200, token).ConfigureAwait(false);
                Run queued = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + needsAbsent.Id + "/invoke", new InvokeRequest { Input = "convert", Wait = false }, 202, token).ConfigureAwait(false);
                Assert.True(queued.Requirements.Any(r => r.Key == "garrison.io/tool-absent-tool" && r.Value == "true"), "The run requires the tool label");
                await Task.Delay(1500, token).ConfigureAwait(false);
                Run blocked = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + queued.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(blocked.Status == RunStatusEnum.Queued && blocked.BlockedReason == RunBlockedReasonEnum.NoToolWorker, "Queued with NoToolWorker: " + blocked.Status + " " + blocked.BlockedReason);
                await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/runs/" + queued.Id + "/cancel", null, token).ConfigureAwait(false);

                Agent needsDotnet = await cluster.CreateAgentAsync("cap-needs-dotnet", profile.Name, null, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + needsDotnet.Id + "/revisions", new AgentRevision { Description = "Needs dotnet.", Capabilities = new List<string> { "dotnet-sdk" } }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + needsDotnet.Id + "/revisions/2/publish", null, 200, token).ConfigureAwait(false);
                Run ran = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + needsDotnet.Id + "/invoke", new InvokeRequest { Input = "build", Wait = true, WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, ran.Status, "A run needing a present tool runs: " + ran.ErrorMessage);

                CapabilityRefreshResult refreshed = await HttpTestHelpers.SendAsync<CapabilityRefreshResult>(host.AdminClient, HttpMethod.Post, T(host) + "/capabilities/refresh", null, 200, token).ConfigureAwait(false);
                Assert.True(refreshed.HarnessBuiltIns >= 0, "Refresh ran");
                CapabilityDescriptor dotnet = await HttpTestHelpers.SendAsync<CapabilityDescriptor>(host.AdminClient, HttpMethod.Get, T(host) + "/capabilities/dotnet-sdk", null, 200, token).ConfigureAwait(false);
                Assert.True(dotnet.Kind == CapabilityKindEnum.HarnessBuiltIn && dotnet.TenantId == host.TenantId && dotnet.SourceHarnessProfileId == profile.Id && dotnet.Summary == "The .NET SDK.", "Tenant built-in descriptor from the probe");
            }
        }

        private static async Task CatalogToolsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent helper = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "cap-helper", Description = "Helps." }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "cap-hidden", Description = "Not on the allow list." }, 201, token).ConfigureAwait(false);
                Agent orchestrator = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent
                {
                    Name = "cap-orchestrator", DelegationMode = DelegationModeEnum.AllowList, DelegationAllowList = new List<string> { "cap-helper" }
                }, 201, token).ConfigureAwait(false);
                McpServer bound = await host.Server.Context.Database.McpServers.CreateAsync(new McpServer { TenantId = host.TenantId, Name = "bound", Transport = McpTransportEnum.Http, Url = "http://127.0.0.1:9" }, token).ConfigureAwait(false);
                McpServer unbound = await host.Server.Context.Database.McpServers.CreateAsync(new McpServer { TenantId = host.TenantId, Name = "unbound", Transport = McpTransportEnum.Http, Url = "http://127.0.0.1:9" }, token).ConfigureAwait(false);
                foreach (McpServer server in new[] { bound, unbound })
                {
                    await host.Server.Context.Database.Capabilities.CreateAsync(new CapabilityDescriptor
                    {
                        TenantId = host.TenantId, Name = server.Name + "/search", Kind = CapabilityKindEnum.McpTool, Origin = CapabilityOriginEnum.Derived,
                        SourceKey = "mcp:" + server.Id + ":search", SourceMcpServerId = server.Id, SourceToolName = "search"
                    }, token).ConfigureAwait(false);
                }
                Deployment deployment = new Deployment { TenantId = host.TenantId, Name = "cap-orchestrator", AgentId = orchestrator.Id, HarnessProfileId = "hrn_builtin_claude_code" };
                deployment.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.McpServer, Alias = "bound", ResourceId = bound.Id });
                deployment = await host.Server.Context.Database.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
                await host.Server.Context.Get<CapabilityService>().SyncHarnessBuiltInsAsync(token).ConfigureAwait(false);
                Run run = await host.Server.Context.Database.Runs.CreateAsync(new Run
                {
                    TenantId = host.TenantId, AgentId = orchestrator.Id, AgentName = orchestrator.Name, DeploymentId = deployment.Id, AgentRevisionId = orchestrator.LatestPublishedRevisionId,
                    HarnessType = HarnessTypeEnum.ClaudeCode, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5)
                }, token).ConfigureAwait(false);

                using (TestMcpClient runClient = new TestMcpClient())
                {
                    await runClient.ConnectAsync(host, await host.Server.Context.Authentication.IssueForRunAsync(run, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false), token).ConfigureAwait(false);
                    string listed = await runClient.CallAsync("garrison_list_capabilities", new { }, token).ConfigureAwait(false);
                    Assert.True(listed.Contains("cap-helper", StringComparison.Ordinal), "Allowed agent visible: " + listed);
                    Assert.True(!listed.Contains("cap-hidden", StringComparison.Ordinal), "Agent off the allow list hidden");
                    Assert.True(!listed.Contains("\"name\":\"cap-orchestrator\"", StringComparison.Ordinal), "Itself hidden without recursion");
                    Assert.True(listed.Contains("bound/search", StringComparison.Ordinal) && !listed.Contains("unbound/search", StringComparison.Ordinal), "Only the bound server's tools");
                    Assert.True(listed.Contains("pandoc", StringComparison.Ordinal), "Built-ins its harness profile declares");
                    string described = await runClient.CallAsync("garrison_describe_capability", new { capability = "cap-helper" }, token).ConfigureAwait(false);
                    Assert.True(described.Contains(helper.Id, StringComparison.Ordinal), "Describe by name: " + described);
                    await runClient.ExpectErrorAsync("garrison_describe_capability", new { capability = "cap-hidden" }, "NotFound", token).ConfigureAwait(false);
                    string agents = await runClient.CallAsync("garrison_list_agents", new { }, token).ConfigureAwait(false);
                    Assert.True(agents.Contains("\"hints\"", StringComparison.Ordinal) && agents.Contains("Unknown", StringComparison.Ordinal), "garrison_list_agents carries hints: " + agents);
                }
                using (TestMcpClient user = new TestMcpClient())
                {
                    await user.ConnectAsync(host, null, token).ConfigureAwait(false);
                    string all = await user.CallAsync("garrison_list_capabilities", new { kind = "Agent" }, token).ConfigureAwait(false);
                    Assert.True(all.Contains("cap-hidden", StringComparison.Ordinal) && all.Contains("cap-orchestrator", StringComparison.Ordinal), "A user sees every agent descriptor");
                }
            }
        }

        #endregion
    }
}
