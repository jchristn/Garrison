namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Example agentic apps (AD10): the doc-converter reference bundle and the research overview walkthrough, applied from
    /// examples/agentic-apps and run end to end on the fake harness. Real pandoc and LibreOffice are replaced by stubs on
    /// the worker's PATH that answer the tool probes and write placeholder files; scripts/run-research-example.sh runs the
    /// same walkthrough against a worker image built with the document tools.
    /// </summary>
    public static class ExamplesSuite
    {
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
                string id = "examples-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "doc-converter-no-tools", "The doc-converter bundle applies and re-applies unchanged; with no worker reporting pandoc its runs queue with NoToolWorker naming the tool (" + provider + ")", ct => NoToolsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "research-overview", "The research overview app: an anonymous gateway conversation fans out to two researchers, has the writer draft report.md, and the doc-converter produce report.pdf in the file space (" + provider + ")", ct => ResearchAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp-binding", "An external MCP converter with bearer auth from a secret: its tools enter the catalog, only the bound agent sees them, a run passes the required-tools pre-flight, and the secret never appears in events or the transcript (" + provider + ")", ct => McpBindingAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "support-triage-studio", "The support triage app is built in the studio from its documents, approved, exported with its references to the same documents, and answers through the gateway after asking the classifier and the knowledge lookup (" + provider + ")", ct => SupportTriageAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Example apps (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static string Example(string name)
        {
            string? directory = AppContext.BaseDirectory;
            while (directory != null && !Directory.Exists(Path.Combine(directory, "examples", "agentic-apps"))) directory = Path.GetDirectoryName(directory);
            string root = Assert.NotNull(directory, "Repository root with examples/agentic-apps");
            return File.ReadAllText(Path.Combine(root, "examples", "agentic-apps", name));
        }

        private static async Task<ManifestApply> ApplyAsync(TestServerHost host, string yaml, CancellationToken token)
        {
            using (StringContent content = new StringContent(yaml, Encoding.UTF8, "application/yaml"))
            using (HttpResponseMessage response = await host.AdminClient.PostAsync(T(host) + "/manifests/apply", content, token).ConfigureAwait(false))
            {
                string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                Assert.Equal(200, (int)response.StatusCode, "Apply status: " + body);
                ManifestApply applied = Assert.NotNull(Serializer.Deserialize<ManifestApply>(body), "Apply result");
                Assert.Equal(0, applied.FailedCount, "Every document applies: " + String.Join("; ", applied.Items.Where(i => i.Result == ManifestApplyResultEnum.Failed).Select(i => i.Kind + "/" + i.Name + ": " + i.Message)));
                return applied;
            }
        }

        private static async Task NoToolsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                string bundle = Example("doc-converter/doc-converter.yaml");
                ManifestApply first = await ApplyAsync(host, bundle, token).ConfigureAwait(false);
                Assert.Equal(first.DocumentCount, first.CreatedCount, "Everything is created");
                ManifestApply second = await ApplyAsync(host, bundle, token).ConfigureAwait(false);
                Assert.Equal(second.DocumentCount, second.UnchangedCount, "Re-applying changes nothing: " + String.Join("; ", second.Items.Where(i => i.Result != ManifestApplyResultEnum.Unchanged).Select(i => i.Kind + "/" + i.Name + " " + i.Result)));
                // A host with pandoc installed reports it, so the blocked case only applies without one.
                if ((Environment.GetEnvironmentVariable("PATH") ?? String.Empty).Split(Path.PathSeparator).Any(d => File.Exists(Path.Combine(d, "pandoc")))) return;
                Run queued = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/doc-converter/invoke", new InvokeRequest { Input = "{\"source\":\"files/a.md\",\"target\":\"files/a.docx\"}", Wait = false }, 202, token).ConfigureAwait(false);
                DateTime deadline = DateTime.UtcNow.AddSeconds(15);
                Run blocked;
                do
                {
                    await Task.Delay(500, token).ConfigureAwait(false);
                    blocked = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + queued.Id, null, 200, token).ConfigureAwait(false);
                }
                while (blocked.BlockedReason != RunBlockedReasonEnum.NoToolWorker && DateTime.UtcNow < deadline);
                Assert.True(blocked.Status == RunStatusEnum.Queued && blocked.BlockedReason == RunBlockedReasonEnum.NoToolWorker && queued.Requirements.Any(r => r.Key == "garrison.io/tool-pandoc"), "Waits for a worker with pandoc: " + blocked.Status + " " + blocked.BlockedReason);
                await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/runs/" + queued.Id + "/cancel", null, token).ConfigureAwait(false);
            }
        }

        private static async Task McpBindingAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost vendor = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                // Another control plane stands in for a vendor's converter MCP server: it needs a bearer token.
                string bearer;
                using (HttpClient login = await vendor.UserClientAsync("admin@garrison", "password", vendor.TenantId, token).ConfigureAwait(false))
                {
                    bearer = login.DefaultRequestHeaders.Authorization!.Parameter!;
                }
                TestServerHost host = cluster.Server;
                string secretId = (await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, T(host) + "/secrets", new SecretRequest { Name = "converter-token", Kind = SecretKindEnum.BearerToken, Value = bearer }, 201, token).ConfigureAwait(false)).Id;
                McpServer converter = await HttpTestHelpers.SendAsync<McpServer>(host.AdminClient, HttpMethod.Post, T(host) + "/mcp-servers", new McpServer
                {
                    Name = "converter-mcp", Transport = McpTransportEnum.Http, Url = vendor.McpUrl, Path = "/mcp", Required = true, RequiredTools = new List<string> { "garrison_list_agents" },
                    Headers = new List<McpServerHeader> { new McpServerHeader { Name = "Authorization", ValueTemplate = "Bearer {{secret.converter-token}}" } }
                }, 201, token).ConfigureAwait(false);
                CapabilityRefreshResult refreshed = await HttpTestHelpers.SendAsync<CapabilityRefreshResult>(host.AdminClient, HttpMethod.Post, T(host) + "/capabilities/refresh?mcpServerId=" + converter.Id, null, 200, token).ConfigureAwait(false);
                CapabilityServerRefresh outcome = refreshed.McpServers.Single();
                Assert.True(outcome.Error == null && outcome.Tools > 0, "The converter's tools are listed with the secret's bearer token: " + Serializer.Serialize(outcome));

                Agent user = await cluster.CreateAgentAsync("conv-user", "builtin/fake", null, token, d =>
                {
                    d.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.McpServer, Alias = "converter", ResourceId = converter.Id });
                    d.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = "converter-token", ResourceId = secretId });
                }).ConfigureAwait(false);
                Agent other = await cluster.CreateAgentAsync("conv-other", "builtin/fake", null, token).ConfigureAwait(false);
                foreach (Agent agent in new[] { user, other })
                {
                    Deployment deployment = (await host.Server.Context.Database.Deployments.ListByAgentAsync(host.TenantId, agent.Id, token).ConfigureAwait(false)).First();
                    Run run = await host.Server.Context.Database.Runs.CreateAsync(new Run
                    {
                        TenantId = host.TenantId, AgentId = agent.Id, AgentName = agent.Name, DeploymentId = deployment.Id, AgentRevisionId = agent.LatestPublishedRevisionId,
                        Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5)
                    }, token).ConfigureAwait(false);
                    using (TestMcpClient client = new TestMcpClient())
                    {
                        await client.ConnectAsync(host, await host.Server.Context.Authentication.IssueForRunAsync(run, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false), token).ConfigureAwait(false);
                        string listed = await client.CallAsync("garrison_list_capabilities", new { kind = "McpTool" }, token).ConfigureAwait(false);
                        Assert.Equal(agent.Id == user.Id, listed.Contains("converter-mcp/", StringComparison.Ordinal), agent.Name + " sees the converter's tools only when bound: " + listed);
                    }
                }

                Run real = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/conv-user/invoke", new InvokeRequest { Input = "Convert please.", Wait = true, WaitSeconds = 120 }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, real.Status, "The bound run passes the required-tools pre-flight: " + real.ErrorMessage);
                string events = (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + real.Id + "/events?maxResults=1000", null, token).ConfigureAwait(false)).Body;
                string record = (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + real.Id, null, token).ConfigureAwait(false)).Body;
                Assert.True(!events.Contains(bearer, StringComparison.Ordinal) && !record.Contains(bearer, StringComparison.Ordinal), "The secret never appears in events or the run record");
            }
        }

        private static async Task SupportTriageAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                List<ManifestDocument> documents = ManifestParser.Parse(Example("support-triage/support-triage.yaml"));
                string drafts = T(host) + "/studio/drafts";
                StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, drafts, new StudioDraftCreateRequest { Title = "Support triage" }, 201, token).ConfigureAwait(false);
                // The bundle's documents go into the draft one at a time, as the studio (or its architect) would write them.
                string text = Example("support-triage/support-triage.yaml");
                List<string> sources = text.Split("\n---\n").Select(d => d.Contains("apiVersion:", StringComparison.Ordinal) ? d.Substring(d.IndexOf("apiVersion:", StringComparison.Ordinal)) : d).ToList();
                foreach (ManifestDocument document in documents)
                {
                    if (document.Kind == "HarnessProfile")
                    {
                        // Drafts hold harness profiles too, but this one is applied directly so the test stays about the app.
                        await ApplyAsync(host, sources.Single(d => d.Contains("kind: HarnessProfile", StringComparison.Ordinal)), token).ConfigureAwait(false);
                        continue;
                    }
                    string source = sources.Single(d => d.Contains("kind: " + document.Kind + "\n", StringComparison.Ordinal) && d.Contains("  name: " + document.Metadata.Name + "\n", StringComparison.Ordinal));
                    draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Put, drafts + "/" + draft.Id + "/items/" + document.Kind + "/" + document.Metadata.Name, new StudioDraftItemRequest { Version = draft.Version, Document = source }, 200, token).ConfigureAwait(false);
                }
                StudioDraftDiff diff = await HttpTestHelpers.SendAsync<StudioDraftDiff>(host.AdminClient, HttpMethod.Post, drafts + "/" + draft.Id + "/validate", null, 200, token).ConfigureAwait(false);
                Assert.True(diff.Valid && diff.Items.All(i => i.Change == "Create"), "Everything validates as a create: " + Serializer.Serialize(diff));
                Approval approval = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, drafts + "/" + draft.Id + "/request-apply", new StudioDraftVersionRequest { Version = draft.Version }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, T(host) + "/approvals/" + approval.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, 200, token).ConfigureAwait(false);

                string exported = (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/manifests/export?resources=AgenticApp/support-triage&followReferences=true", null, token).ConfigureAwait(false)).Body;
                List<string> exportedKeys = ManifestParser.Parse(exported).Where(d => d.Kind != "Bundle").Select(d => d.Kind + "/" + d.Metadata.Name).OrderBy(k => k, StringComparer.Ordinal).ToList();
                List<string> bundleKeys = documents.Select(d => d.Kind + "/" + d.Metadata.Name).OrderBy(k => k, StringComparer.Ordinal).ToList();
                Assert.True(exportedKeys.SequenceEqual(bundleKeys), "The exported bundle has the example's documents: " + String.Join(", ", exportedKeys));

                using (HttpClient client = new HttpClient { BaseAddress = host.AdminClient.BaseAddress })
                {
                    string session;
                    using (StringContent content = new StringContent("{}", Encoding.UTF8, "application/json"))
                    using (HttpResponseMessage response = await client.PostAsync("/v1.0/apps/support-triage/session", content, token).ConfigureAwait(false))
                    {
                        session = Assert.NotNull(Serializer.Deserialize<AppSessionResponse>(await response.Content.ReadAsStringAsync(token).ConfigureAwait(false)), "Session").Token;
                    }
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", session);
                    string conversationId;
                    using (StringContent content = new StringContent("{\"message\":\"My invoice was charged twice.\"}", Encoding.UTF8, "application/json"))
                    using (HttpResponseMessage started = await client.PostAsync("/v1.0/apps/support-triage/conversations", content, token).ConfigureAwait(false))
                    {
                        string body = await started.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(201, (int)started.StatusCode, "Start: " + body);
                        conversationId = Assert.NotNull(Serializer.Deserialize<Dictionary<string, object>>(body)?["conversationId"]?.ToString(), "Conversation id");
                    }
                    DateTime deadline = DateTime.UtcNow.AddSeconds(120);
                    AppConversationView view;
                    while (true)
                    {
                        view = Assert.NotNull(Serializer.Deserialize<AppConversationView>(await client.GetStringAsync("/v1.0/apps/support-triage/conversations/" + conversationId, token).ConfigureAwait(false)), "Conversation");
                        if (view.Turns.Count == 1 && RunService.IsTerminal(view.Turns[0].Status)) break;
                        if (DateTime.UtcNow > deadline) throw new TestAssertionException("The triage turn did not finish: " + Serializer.Serialize(view));
                        await Task.Delay(500, token).ConfigureAwait(false);
                    }
                    string answer = view.Turns[0].Answer ?? String.Empty;
                    Assert.True(view.Turns[0].Status == RunStatusEnum.Succeeded && answer.Contains("\"agent\":\"triage-classifier\"", StringComparison.Ordinal) && answer.Contains("\"agent\":\"triage-knowledge\"", StringComparison.Ordinal), "The desk asked both members: " + answer);
                }
            }
        }

        private static string StubDirectory()
        {
            string directory = Path.Combine(Path.GetTempPath(), "garrison-doc-stubs-" + Environment.ProcessId);
            Directory.CreateDirectory(directory);
            string pandoc = Path.Combine(directory, "pandoc");
            File.WriteAllText(pandoc, "#!/bin/sh\n" +
                "case \"$1\" in --version) echo 'pandoc 3.1.3 (test stub)'; exit 0;; esac\n" +
                "src=''; out=''\n" +
                "while [ $# -gt 0 ]; do case \"$1\" in -o) out=\"$2\"; shift 2;; --*) shift;; *) src=\"$1\"; shift;; esac; done\n" +
                "{ echo 'STUB-DOCX'; cat \"$src\"; } > \"$out\"\n");
            string soffice = Path.Combine(directory, "soffice");
            File.WriteAllText(soffice, "#!/bin/sh\n" +
                "case \"$1\" in --version) echo 'LibreOffice 24.2 (test stub)'; exit 0;; esac\n" +
                "outdir='.'; file=''\n" +
                "while [ $# -gt 0 ]; do case \"$1\" in --outdir) outdir=\"$2\"; shift 2;; --convert-to) shift 2;; --*) shift;; *) file=\"$1\"; shift;; esac; done\n" +
                "b=$(basename \"$file\"); { echo '%PDF-1.4 STUB'; cat \"$file\"; } > \"$outdir/${b%.*}.pdf\"\n");
            foreach (string script in new[] { pandoc, soffice })
            {
                File.SetUnixFileMode(script, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute | UnixFileMode.GroupRead | UnixFileMode.GroupExecute);
            }
            return directory;
        }

        private static async Task ResearchAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            if (OperatingSystem.IsWindows()) return;
            string? path = Environment.GetEnvironmentVariable("PATH");
            Environment.SetEnvironmentVariable("PATH", StubDirectory() + Path.PathSeparator + path);
            try
            {
                await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
                {
                    TestServerHost host = cluster.Server;
                    await ApplyAsync(host, Example("doc-converter/doc-converter.yaml"), token).ConfigureAwait(false);
                    await ApplyAsync(host, Example("research-overview/research-overview.yaml"), token).ConfigureAwait(false);
                    using (HttpClient client = new HttpClient { BaseAddress = host.AdminClient.BaseAddress })
                    {
                        AppInfo info = Assert.NotNull(Serializer.Deserialize<AppInfo>(await client.GetStringAsync("/v1.0/apps/research-overview", token).ConfigureAwait(false)), "App info");
                        Assert.Equal("Research Desk", info.DisplayName ?? String.Empty, "Branding");
                        string session;
                        using (StringContent content = new StringContent("{}", Encoding.UTF8, "application/json"))
                        using (HttpResponseMessage response = await client.PostAsync("/v1.0/apps/research-overview/session", content, token).ConfigureAwait(false))
                        {
                            string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                            Assert.Equal(201, (int)response.StatusCode, "Anonymous session: " + body);
                            session = Assert.NotNull(Serializer.Deserialize<AppSessionResponse>(body), "Session").Token;
                        }
                        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", session);
                        string conversationId;
                        using (StringContent content = new StringContent("{\"message\":\"Build a research overview of decision models.\"}", Encoding.UTF8, "application/json"))
                        using (HttpResponseMessage started = await client.PostAsync("/v1.0/apps/research-overview/conversations", content, token).ConfigureAwait(false))
                        {
                            string body = await started.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                            Assert.Equal(201, (int)started.StatusCode, "Start: " + body);
                            conversationId = Assert.NotNull(Serializer.Deserialize<Dictionary<string, object>>(body)?["conversationId"]?.ToString(), "Conversation id");
                        }
                        DateTime deadline = DateTime.UtcNow.AddSeconds(180);
                        AppConversationView view;
                        while (true)
                        {
                            view = Assert.NotNull(Serializer.Deserialize<AppConversationView>(await client.GetStringAsync("/v1.0/apps/research-overview/conversations/" + conversationId, token).ConfigureAwait(false)), "Conversation");
                            if (view.Turns.Count == 1 && RunService.IsTerminal(view.Turns[0].Status)) break;
                            if (DateTime.UtcNow > deadline) throw new TestAssertionException("The research turn did not finish: " + Serializer.Serialize(view));
                            await Task.Delay(500, token).ConfigureAwait(false);
                        }
                        Assert.Equal(RunStatusEnum.Succeeded, view.Turns[0].Status, "The research turn succeeds: " + Serializer.Serialize(view.Turns[0]));
                        string answer = view.Turns[0].Answer ?? String.Empty;
                        Assert.True(answer.Contains("history", StringComparison.Ordinal) && answer.Contains("practice", StringComparison.Ordinal) && answer.Contains("report.pdf", StringComparison.Ordinal), "The answer carries the gathered research and the PDF path: " + answer);

                        FileSpaceListing files = Assert.NotNull(Serializer.Deserialize<FileSpaceListing>(await client.GetStringAsync("/v1.0/apps/research-overview/conversations/" + conversationId + "/files", token).ConfigureAwait(false)), "Files");
                        List<string> paths = files.Files.Select(f => f.Path).ToList();
                        Assert.True(paths.Contains("report.md") && paths.Contains("report.pdf"), "The writer's Markdown and the converter's PDF are in the file space: " + String.Join(", ", paths));
                        byte[] pdf = await client.GetByteArrayAsync("/v1.0/apps/research-overview/conversations/" + conversationId + "/files/content?path=report.pdf", token).ConfigureAwait(false);
                        string pdfText = Encoding.UTF8.GetString(pdf);
                        Assert.True(pdfText.StartsWith("%PDF", StringComparison.Ordinal) && pdfText.Contains("STUB-DOCX", StringComparison.Ordinal) && pdfText.Contains("# Research", StringComparison.Ordinal), "The PDF came from the writer's report: " + pdfText.Substring(0, Math.Min(2000, pdfText.Length)));
                    }
                }
            }
            finally
            {
                Environment.SetEnvironmentVariable("PATH", path);
            }
        }

        #endregion
    }
}
