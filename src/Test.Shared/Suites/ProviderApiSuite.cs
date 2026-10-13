namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Requests;
    using Garrison.Core.Models;
    using Garrison.Core.Helpers;
    using Garrison.Core.Protocol;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Harnesses;
    using Garrison.Harnesses.Parsers;
    using Garrison.ProviderHarness;
    using Garrison.Worker.Execution;
    using Garrison.Worker.Reporting;
    using Garrison.Worker.Settings;
    using System.Net.Http;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Optional provider execution: streaming, history, failure bounds, MCP, approvals, and compilation.</summary>
    public static class ProviderApiSuite
    {
        /// <summary>Build the retained provider-mode checks.</summary>
        /// <returns>Suite descriptors.</returns>
        public static IReadOnlyList<TestSuiteDescriptor> Build()
        {
            List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("provider-api", "process", "The bundled harness runs through the normal worker process executor with usage and cleanup", ProcessAsync),
                new TestCaseDescriptor("provider-api", "stream-history", "Provider chunks normalize text/usage and a private conversation resumes its history", StreamAsync),
                new TestCaseDescriptor("provider-api", "failures", "Missing/rejected credentials, bounded retries, incomplete output, cancellation, and limits fail safely", FailuresAsync)
            };
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor> { new TestSuiteDescriptor("provider-api", "Optional provider execution", cases) };
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "provider-api-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Provider configuration and tool mediation", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "lifecycle", "Provider execution through the real node protocol repairs schema output and resumes a conversation", ct => LifecycleAsync(provider, ct)),
                    new TestCaseDescriptor(id, "compile", "The opt-in provider profile compiles typed secret configuration and templated prompts", ct => CompileAsync(provider, ct)),
                    new TestCaseDescriptor(id, "mcp-approvals", "A provider MCP tool round trip obeys Garrison allow/deny rules and validates model arguments", ct => McpAsync(provider, ct))
                }));
            }
            return suites;
        }
        private static async Task ProcessAsync(CancellationToken token)
        {
            string work = Path.Combine(Path.GetTempPath(), "garrison-provider-process-" + Guid.NewGuid().ToString("N"));
            try
            {
                using (FakeProviderServer endpoint = new FakeProviderServer())
                {
                    ProviderApiConfig config = Config(endpoint);
                    ExecutionSpec spec = new ExecutionSpec
                    {
                        RunId = "run_provider_fixture", TenantId = "ten_fixture", HarnessType = HarnessTypeEnum.ProviderApi,
                        Executable = "dotnet", Arguments = new List<string> { typeof(Garrison.ProviderHarness.Program).Assembly.Location, "--config", "$GARRISON_CONFIG_DIR/provider-api.json" },
                        Stdin = "fixture task", Parser = OutputParserEnum.ProviderApiJsonl, TimeoutSeconds = 30,
                        SuccessPolicy = SuccessPolicyEnum.FinalEventAndExitCode,
                        Files = new List<ExecutionFile> { new ExecutionFile { Path = "provider-api.json", Content = Serializer.Serialize(config), IsSecret = true, Mode = "600" } }
                    };
                    InMemoryRunReporter reporter = new InMemoryRunReporter();
                    RunCompleteRequest complete = await new ProcessRunExecutor(new ExecutorOptions { WorkRoot = work }).ExecuteAsync(new RunAssignment { RunId = spec.RunId, Epoch = 1, Spec = spec }, reporter, token).ConfigureAwait(false);
                    Assert.Equal(RunOutcomeEnum.Succeeded, complete.Outcome, "Provider subprocess outcome");
                    Assert.Equal("fixture answer", complete.ResultText, "Subprocess final answer");
                    Assert.Equal(11L, complete.InputTokens, "Subprocess usage");
                    Assert.True(reporter.Events().Any(e => e.EventType == RunEventTypeEnum.AssistantText), "Worker receives streaming events");
                }
            }
            finally { if (Directory.Exists(work)) Directory.Delete(work, true); }
        }
        private static async Task StreamAsync(CancellationToken token)
        {
            string home = Path.Combine(Path.GetTempPath(), "garrison-provider-test-" + Guid.NewGuid().ToString("N"));
            try
            {
                using (FakeProviderServer endpoint = new FakeProviderServer())
                using (StringWriter output = new StringWriter())
                {
                    ProviderApiConfig config = Config(endpoint);
                    config.SessionId = "session_fixture";
                    config.SystemPrompt = "fixture system";
                    Assert.Equal(0, await new ProviderApiRunner(config, output, home).RunAsync("first task", token).ConfigureAwait(false), "First provider turn");
                    HarnessRunState state = Parse(output.ToString());
                    Assert.Equal("fixture answer", state.FinalText, "Final text");
                    Assert.Equal("fixture answer", state.AssistantText.ToString(), "Streaming text");
                    Assert.Equal("served-fixture-model", state.ServedModel, "Served model");
                    Assert.Equal(11L, state.InputTokens, "Input usage");
                    Assert.Equal(7L, state.OutputTokens, "Output usage");
                    Assert.Equal(3L, state.CachedTokens, "Cache usage");
                    Assert.Equal(2L, state.ReasoningTokens, "Reasoning usage");
                    Assert.True(state.SawSuccess && state.SessionId == config.SessionId, "Session and success");
                    config.Resume = true;
                    output.GetStringBuilder().Clear();
                    Assert.Equal(0, await new ProviderApiRunner(config, output, home).RunAsync("second task", token).ConfigureAwait(false), "Resumed provider turn");
                    Assert.True(endpoint.LastRequest!.Messages.Any(m => m.Role == "user" && m.Content == "first task"), "Earlier user turn retained");
                    Assert.True(endpoint.LastRequest.Messages.Any(m => m.Role == "assistant" && m.Content == "fixture answer"), "Earlier answer retained");
                    string session = Directory.GetFiles(home, "*.json", SearchOption.AllDirectories).Single();
                    if (!OperatingSystem.IsWindows()) Assert.Equal(UnixFileMode.UserRead | UnixFileMode.UserWrite, File.GetUnixFileMode(session), "Private session mode");
                }
            }
            finally { if (Directory.Exists(home)) Directory.Delete(home, true); }
        }
        private static async Task FailuresAsync(CancellationToken token)
        {
            using (FakeProviderServer endpoint = new FakeProviderServer())
            using (StringWriter output = new StringWriter())
            {
                ProviderApiConfig config = Config(endpoint);
                config.AllowAnonymous = false;
                config.ApiKeyVariable = "GARRISON_TEST_MISSING_" + Guid.NewGuid().ToString("N");
                Assert.Equal(1, await new ProviderApiRunner(config, output).RunAsync("task", token).ConfigureAwait(false), "Missing key fails before network");
                Assert.Equal(0, endpoint.Requests, "No missing-key request");
                Assert.True(Parse(output.ToString()).CredentialFailure != null, "Credential classification");
                config.AllowAnonymous = true;
                endpoint.HttpStatus = 401;
                output.GetStringBuilder().Clear();
                Assert.Equal(1, await new ProviderApiRunner(config, output).RunAsync("task", token).ConfigureAwait(false), "Rejected key fails");
                Assert.True(Parse(output.ToString()).CredentialFailure != null, "401 classification");
                endpoint.HttpStatus = 200;
                endpoint.RetryResponses = endpoint.Requests + 1;
                output.GetStringBuilder().Clear();
                Assert.Equal(0, await new ProviderApiRunner(config, output).RunAsync("task", token).ConfigureAwait(false), "Transient 429 is retried");
                Assert.True(Parse(output.ToString()).Drain().Any(e => e.EventType == RunEventTypeEnum.Warning), "Retry warning");
                endpoint.Truncated = true;
                output.GetStringBuilder().Clear();
                Assert.Equal(1, await new ProviderApiRunner(config, output).RunAsync("task", token).ConfigureAwait(false), "Incomplete stream is not a successful answer");
                Assert.True(!Parse(output.ToString()).SawSuccess, "No fabricated completion");
                endpoint.Truncated = false;
                endpoint.DelayMs = 2000;
                using (CancellationTokenSource cancelled = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    cancelled.CancelAfter(100);
                    bool observed = false;
                    try { await new ProviderApiRunner(config, output).RunAsync("cancel", cancelled.Token).ConfigureAwait(false); }
                    catch (OperationCanceledException) { observed = true; }
                    Assert.True(observed, "HTTP cancellation propagates");
                }
                bool invalid = false;
                try { new ProviderApiConfig { Endpoint = endpoint.Endpoint, Model = "fixture", SessionId = "../escape" }.Validate(); }
                catch (ArgumentException) { invalid = true; }
                Assert.True(invalid, "Session traversal rejected");
                config.Servers.Add(new ProviderMcpSpec { Name = "stdio", Transport = "stdio" });
                bool unsupported = false;
                using (ProviderMcpBridge bridge = new ProviderMcpBridge(config))
                {
                    try { await bridge.ConnectAsync(token).ConfigureAwait(false); }
                    catch (InvalidOperationException) { unsupported = true; }
                }
                Assert.True(unsupported, "Required unsupported transport fails before provider execution");
            }
        }
        private static async Task CompileAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync("provider-api", false, token).ConfigureAwait(false);
                deployment.Parameters.Add(new DeploymentParameter { Name = "baseUrl", Value = "http://127.0.0.1:9001/v1" });
                deployment.Parameters.Add(new DeploymentParameter { Name = "maxTokens", Value = "1234" });
                deployment.ApprovalsEnabled = true;
                await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                CompilationResult compilation = await fixture.Compiler.CompileAsync(CompilerFixture.RunFor(deployment, false), "fixture-run-token", token).ConfigureAwait(false);
                ExecutionFile file = compilation.Spec.Files.Single(f => f.Path.EndsWith("provider-api.json", StringComparison.Ordinal));
                ProviderApiConfig config = Serializer.Deserialize<ProviderApiConfig>(file.Content)!;
                config.Validate();
                Assert.Equal("http://127.0.0.1:9001/v1", config.Endpoint, "Endpoint parameter");
                Assert.Equal(1234, config.MaxTokens, "Typed token parameter");
                Assert.True(config.ApprovalsEnabled && config.Servers.Any(s => s.Name == Constants.McpServerName), "Approval MCP hook compiled");
                Assert.True(config.SystemPrompt!.Contains("Helper", StringComparison.Ordinal), "System prompt remains templated");
                Assert.True(file.IsSecret && file.Mode == "600", "Resolved MCP headers stay private");
                Assert.True(!file.Content.Contains("credential-provider_api", StringComparison.Ordinal), "API key is never embedded in the config");
                Assert.Equal(OutputParserEnum.ProviderApiJsonl, compilation.Spec.Parser, "Typed parser selected");
            }
        }
        private static async Task LifecycleAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            using (FakeProviderServer endpoint = new FakeProviderServer { Answers = new List<string> { "invalid schema answer", "{\"answer\":\"repaired\"}" } })
            {
                HarnessProfile profile = BuiltInSeeder.HarnessProfileDefaults().Single(p => p.Name == "builtin/provider-api");
                profile.Id = IdGenerator.NewHarnessProfileId();
                profile.TenantId = cluster.Server.TenantId;
                profile.Name = "provider-lifecycle";
                profile.IsBuiltIn = false;
                profile.IsProtected = false;
                profile.BuiltInKey = null;
                profile.Executable = "dotnet";
                profile.Arguments.Insert(0, new HarnessArgument { Template = typeof(Garrison.ProviderHarness.Program).Assembly.Location });
                await cluster.Server.Server.Context.Database.HarnessProfiles.CreateAsync(profile, token).ConfigureAwait(false);
                cluster.Workers.Add(await TestCluster.StartWorkerAsync(cluster.Server.BaseUrl, "provider-lifecycle", settings =>
                {
                    settings.Probes = new List<HarnessProbeSettings> { new HarnessProbeSettings { HarnessType = HarnessTypeEnum.ProviderApi, Executable = "dotnet", Arguments = new List<string> { typeof(Garrison.ProviderHarness.Program).Assembly.Location, "--version" }, Label = "provider-api" } };
                }, token).ConfigureAwait(false));
                Agent agent = await cluster.CreateAgentAsync("provider-lifecycle", profile.Name,
                    a => a.OutputSchemaJson = "{\"type\":\"object\",\"properties\":{\"answer\":{\"type\":\"string\"}},\"required\":[\"answer\"],\"additionalProperties\":false}", token,
                    d => { d.Model = "fixture-model"; d.Parameters.Add(new DeploymentParameter { Name = "baseUrl", Value = endpoint.Endpoint }); d.Parameters.Add(new DeploymentParameter { Name = "allowAnonymous", Value = "true" }); }).ConfigureAwait(false);
                string path = "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke";
                Run first = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, path, new InvokeRequest { Input = "first schema task", StartConversation = true, Wait = true, WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, first.Status, "Provider lifecycle status");
                Assert.Equal(1, first.RepairAttempts, "Existing schema repair runs once");
                Assert.True(first.OutputSchemaValid == true && first.SessionId != null, "Repaired schema and session are retained");
                Assert.Equal("{\"answer\":\"repaired\"}", first.StructuredOutputJson, "Repaired result");
                Assert.True(endpoint.LastRequest!.Messages.Any(m => m.Role == "user" && m.Content!.Contains("Your previous answer", StringComparison.Ordinal)), "Repair uses the existing prompt template");
                Run second = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, path, new InvokeRequest { Input = "second conversation task", ConversationId = first.ConversationId, Wait = true, WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, second.Status, "Conversation resumes");
                Assert.Equal(first.SessionId, second.SessionId, "Provider session affinity");
                Assert.True(endpoint.LastRequest!.Messages.Any(m => m.Role == "user" && m.Content!.Contains("first schema task", StringComparison.Ordinal)), "Earlier conversation task survives repair and resume");
                Assert.Equal("served-fixture-model", second.ServedModel, "Served model reaches stored run");
                Assert.Equal(11L, second.InputTokens, "Usage reaches stored run");
                Assert.True(second.CostUsd == null, "Absent configured prices remain unknown, not a fabricated zero");
            }
        }
        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            using (FakeProviderServer endpoint = new FakeProviderServer { UseTool = true })
            using (StringWriter output = new StringWriter())
            {
                Agent agent = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "provider-tool-test", DelegationMode = DelegationModeEnum.Any }, token).ConfigureAwait(false);
                Agent target = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "provider-target" }, token).ConfigureAwait(false);
                await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, AgentId = target.Id, Name = "provider-target", HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
                Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, AgentId = agent.Id, Name = "provider-tool-test", HarnessProfileId = "hrn_builtin_provider_api", ApprovalsEnabled = true, ApprovalDefaultAction = ApprovalRuleActionEnum.Allow }, token).ConfigureAwait(false);
                Run run = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, DeploymentId = deployment.Id, CallerType = PrincipalTypeEnum.Administrator, Status = RunStatusEnum.Running, LeaseEpoch = 1 }, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(run, run.LeaseEpoch, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                ProviderApiConfig config = Config(endpoint);
                config.ApprovalsEnabled = true;
                config.Servers.Add(new ProviderMcpSpec { Name = Constants.McpServerName, Url = "http://127.0.0.1:" + host.Settings.Mcp.Port, Headers = new List<ExecutionEnvironmentVariable> { new ExecutionEnvironmentVariable { Name = "Authorization", Value = "Bearer " + bearer } }, RequiredTools = new List<string> { "garrison_permission_prompt", "garrison_list_agents" } });
                Assert.Equal(0, await new ProviderApiRunner(config, output).RunAsync("use a tool", token).ConfigureAwait(false), "Allowed tool loop finishes");
                HarnessRunState allowed = Parse(output.ToString());
                Assert.True(allowed.Drain().Any(e => e.EventType == RunEventTypeEnum.ToolResult && e.Success == true), "Allowed tool executes");
                Assert.True(endpoint.LastRequest!.Messages.Any(m => m.Role == "tool" && m.Content!.Contains(target.Name, StringComparison.Ordinal)), "Real Garrison tool output reaches the provider");
                Assert.True(endpoint.LastRequest.Tools.All(t => !t.Function.Description.Contains("permission prompt", StringComparison.OrdinalIgnoreCase)), "Permission mediation cannot be selected or bypassed by the model");
                deployment.ApprovalDefaultAction = ApprovalRuleActionEnum.Deny;
                await host.Server.Context.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                output.GetStringBuilder().Clear();
                Assert.Equal(0, await new ProviderApiRunner(config, output).RunAsync("deny the tool", token).ConfigureAwait(false), "Model receives a denied tool result");
                Assert.True(Parse(output.ToString()).Drain().Any(e => e.EventType == RunEventTypeEnum.ToolResult && e.Success == false), "Denied tool does not execute");
                Assert.Equal(2, (await host.Server.Context.Database.Approvals.EnumerateAsync(new ApprovalFilter { TenantId = host.TenantId, MaxResults = 100 }, token).ConfigureAwait(false)).Objects.Count, "Both decisions are recorded");
                endpoint.ToolArguments = "[]";
                output.GetStringBuilder().Clear();
                Assert.Equal(0, await new ProviderApiRunner(config, output).RunAsync("invalid arguments", token).ConfigureAwait(false), "Invalid arguments return a tool error");
                Assert.True(Parse(output.ToString()).Drain().Any(e => e.EventType == RunEventTypeEnum.ToolResult && e.Success == false && e.Text!.Contains("arguments", StringComparison.OrdinalIgnoreCase)), "Schema validation precedes dispatch");
                Assert.Equal(2, (await host.Server.Context.Database.Approvals.EnumerateAsync(new ApprovalFilter { TenantId = host.TenantId, MaxResults = 100 }, token).ConfigureAwait(false)).Objects.Count, "Invalid arguments do not invoke the permission hook");
            }
        }
        private static ProviderApiConfig Config(FakeProviderServer endpoint) { return new ProviderApiConfig { Endpoint = endpoint.Endpoint, Model = "fixture-model", AllowAnonymous = true }; }
        private static HarnessRunState Parse(string output)
        {
            HarnessRunState state = new HarnessRunState();
            ProviderApiJsonlParser parser = new ProviderApiJsonlParser();
            foreach (string line in output.Split('\n', StringSplitOptions.RemoveEmptyEntries)) parser.ParseLine(line, state);
            parser.Complete(state);
            return state;
        }
    }
}
