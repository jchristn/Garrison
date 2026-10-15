namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Core.Transcripts;
    using Garrison.ProviderHarness;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;
    using Voltaic.Mcp;

    /// <summary>
    /// Run and conversation transcripts (plan P12.27, D-054): Markdown and JSON content (input, assistant text, tool calls
    /// and results, thinking only on request, usage), secret redaction, format negotiation and download headers, the size
    /// cap, the MCP tools, and tenant isolation.
    /// </summary>
    public static class TranscriptSuite
    {
        #region Private-Members

        private static readonly string _SecretValue = "transcript-secret-value-8f3a91c2";
        private static readonly string _ShapedKey = "sk-proj-abcdefghijklmnopqrstuvwx";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>();
            unit.Add(new TestCaseDescriptor("transcript-unit", "markdown", "Markdown rendering: headings, fences longer than any backtick run in agent text, tool calls and results, approvals, truncation notes, and usage", MarkdownAsync));
            unit.Add(new TestCaseDescriptor("transcript-unit", "budget", "The byte budget always spends mandatory text and refuses optional text past the limit", BudgetAsync));
            suites.Add(new TestSuiteDescriptor("transcript-unit", "Transcripts (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "transcripts-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "content-redaction", "A run transcript carries the input, assistant text, tool calls and results, usage, and cost; thinking only with includeThinking; bound secret values and credential shapes are redacted in Markdown and JSON (" + provider + ")", ct => ContentAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "formats", "Format negotiation (query, Accept, default Markdown), 400 InvalidFormat, download headers, conversation transcripts with every turn, the size cap with a truncation note, and the MCP tools (" + provider + ")", ct => FormatsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "isolation", "Run and conversation transcripts of another tenant answer 404 over REST and NotFound over MCP (" + provider + ")", ct => IsolationAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Transcripts (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task MarkdownAsync(CancellationToken token)
        {
            Transcript transcript = new Transcript();
            transcript.Kind = TranscriptKindEnum.Conversation;
            transcript.ConversationId = "cnv_test";
            transcript.TenantId = "default";
            transcript.AgentName = "writer";
            transcript.Truncated = true;
            transcript.TruncationNote = "Left out the rest.";
            TranscriptTurn turn = new TranscriptTurn();
            turn.Turn = 1;
            turn.RunId = "run_one";
            turn.Input = "Write `code` with ```` four backticks";
            turn.Result = "done";
            turn.Usage.InputTokens = 1200;
            turn.Usage.OutputTokens = 34;
            turn.Usage.CostUsd = 0.0123;
            turn.Entries.Add(new TranscriptEntry { Sequence = 1, Type = RunEventTypeEnum.AssistantText, Text = "Here:\n```\nx\n```" });
            turn.Entries.Add(new TranscriptEntry { Sequence = 2, Type = RunEventTypeEnum.ToolCall, ToolName = "Bash", ToolCallId = "call_1", Text = "{\"command\":\"ls\"}" });
            turn.Entries.Add(new TranscriptEntry { Sequence = 3, Type = RunEventTypeEnum.ToolResult, ToolName = "Bash", ToolCallId = "call_1", Success = true, Text = "file.txt", TextTruncated = true });
            turn.Approvals.Add(new TranscriptApproval { Id = "apr_1", ToolName = "Bash", Summary = "ls", Status = ApprovalStatusEnum.Approved, Decision = ApprovalDecisionEnum.Allow, DecisionSource = ApprovalSourceEnum.User, DecidedBy = "ops" });
            transcript.Turns.Add(turn);
            transcript.TurnCount = 1;
            string md = TranscriptMarkdownWriter.Write(transcript);
            Assert.True(md.StartsWith("# Conversation transcript: cnv\\_test", StringComparison.Ordinal), "Heading names the conversation: " + md);
            Assert.True(md.Contains("## Turn 1: run\\_one", StringComparison.Ordinal), "Turn heading");
            Assert.True(md.Contains("`````text\nWrite `code` with ```` four backticks\n`````", StringComparison.Ordinal), "Input fence is longer than any backtick run: " + md);
            Assert.True(md.Contains("````text\nHere:\n```\nx\n```\n````", StringComparison.Ordinal), "Assistant fence is longer than the agent's own fence");
            Assert.True(md.Contains("**Tool call** `Bash` id `call_1`", StringComparison.Ordinal) && md.Contains("```json\n{\"command\":\"ls\"}", StringComparison.Ordinal), "Tool call with JSON arguments");
            Assert.True(md.Contains("**Tool result** `Bash` id `call_1`, succeeded", StringComparison.Ordinal) && md.Contains("file.txt\n[truncated]", StringComparison.Ordinal), "Tool result marks truncation");
            Assert.True(md.Contains("### Approvals", StringComparison.Ordinal) && md.Contains("Approved, Allow by User (ops)", StringComparison.Ordinal), "Approvals");
            Assert.True(md.Contains("> **Truncated.** Left out the rest.", StringComparison.Ordinal), "Truncation note");
            Assert.True(md.Contains("1,200 input tokens, 34 output tokens, $0.0123", StringComparison.Ordinal), "Usage line: " + md);
            return Task.CompletedTask;
        }

        private static Task BudgetAsync(CancellationToken token)
        {
            TranscriptBudget budget = new TranscriptBudget(200);
            budget.OverheadBytes = 10;
            Assert.True(budget.TrySpend(new string('a', 90)), "Fits");
            Assert.Equal(100L, budget.Remaining, "Remaining after one item");
            Assert.True(!budget.TrySpend(new string('b', 95)), "Refused past the limit");
            Assert.Equal(100L, budget.Remaining, "A refused item costs nothing");
            budget.Spend(new string('c', 200));
            Assert.True(budget.Exhausted && budget.Remaining < 0, "Mandatory text is always spent");
            Assert.True(!budget.TrySpend(null), "Nothing fits once exhausted");
            return Task.CompletedTask;
        }

        private static async Task ContentAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + cluster.Server.TenantId;
                HttpClient admin = cluster.Server.AdminClient;
                Run run = await ToolRunAsync(cluster, "transcript-tools", "Summarize " + _SecretValue + " and api_key=" + _ShapedKey + " please", token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Run succeeded");

                TestResponse markdown = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, t + "/runs/" + run.Id + "/transcript", null, token).ConfigureAwait(false);
                Assert.Equal(200, markdown.StatusCode, "Markdown transcript: " + markdown.Body);
                string md = markdown.Body;
                Assert.True(md.StartsWith("# Run transcript: " + run.Id.Replace("_", "\\_", StringComparison.Ordinal), StringComparison.Ordinal), "Markdown heading: " + md);
                Assert.True(md.Contains("## Input", StringComparison.Ordinal) && md.Contains("Summarize [REDACTED]", StringComparison.Ordinal), "Input is shown with the secret redacted: " + md);
                Assert.True(md.Contains("**Assistant**", StringComparison.Ordinal) && md.Contains("Echo: Summarize", StringComparison.Ordinal), "Assistant text");
                Assert.True(md.Contains("**Tool call** `fake_tool`", StringComparison.Ordinal) && md.Contains("**Tool result** `fake_tool`", StringComparison.Ordinal) && md.Contains("ok 1", StringComparison.Ordinal), "Tool calls and results");
                Assert.True(md.Contains("## Result", StringComparison.Ordinal) && md.Contains("## Usage", StringComparison.Ordinal) && md.Contains("input tokens", StringComparison.Ordinal), "Result and usage");
                Assert.True(!md.Contains("Considering the request.", StringComparison.Ordinal) && !md.Contains("**Thinking**", StringComparison.Ordinal), "Thinking is left out by default");
                Assert.True(!md.Contains(_SecretValue, StringComparison.Ordinal) && !md.Contains(_ShapedKey, StringComparison.Ordinal), "No secret in the Markdown transcript");

                TestResponse withThinking = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, t + "/runs/" + run.Id + "/transcript?includeThinking=true", null, token).ConfigureAwait(false);
                Assert.True(withThinking.Body.Contains("**Thinking**", StringComparison.Ordinal) && withThinking.Body.Contains("Considering the request.", StringComparison.Ordinal), "Thinking on request: " + withThinking.Body);

                TestResponse json = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, t + "/runs/" + run.Id + "/transcript?format=json&includeThinking=true", null, token).ConfigureAwait(false);
                Assert.Equal(200, json.StatusCode, "JSON transcript");
                Assert.True(!json.Body.Contains(_SecretValue, StringComparison.Ordinal) && !json.Body.Contains(_ShapedKey, StringComparison.Ordinal), "No secret in the JSON transcript");
                Transcript transcript = Assert.NotNull(Serializer.Deserialize<Transcript>(json.Body), "Transcript");
                Assert.Equal(Transcript.SchemaName, transcript.Schema, "Schema");
                Assert.True(transcript.Kind == TranscriptKindEnum.Run && transcript.RunId == run.Id && transcript.AgentName == "transcript-tools" && transcript.IncludesThinking && !transcript.Truncated, "Header fields");
                Assert.Equal(1, transcript.TurnCount, "One turn");
                TranscriptTurn turn = transcript.Turns.Single();
                Assert.True(turn.Status == RunStatusEnum.Succeeded && turn.Input != null && turn.Input.Contains("[REDACTED]", StringComparison.Ordinal), "Turn input redacted: " + turn.Input);
                Assert.True(turn.Entries.Count(e => e.Type == RunEventTypeEnum.ToolCall && e.ToolName == "fake_tool") == 2, "Two tool calls");
                Assert.True(turn.Entries.Count(e => e.Type == RunEventTypeEnum.ToolResult && e.Success == true) == 2, "Two tool results");
                Assert.True(turn.Entries.Any(e => e.Type == RunEventTypeEnum.Thinking), "Thinking entry");
                Assert.True(turn.Entries.All(e => e.Type != RunEventTypeEnum.Usage && e.Type != RunEventTypeEnum.Result && e.Type != RunEventTypeEnum.Stdout && e.Type != RunEventTypeEnum.Stderr && e.Type != RunEventTypeEnum.Progress), "Excluded event types");
                Assert.True(turn.Entries.Select(e => e.Sequence).SequenceEqual(turn.Entries.Select(e => e.Sequence).OrderBy(s => s)), "Entries in sequence order");
                Assert.True(turn.Usage.InputTokens > 0 && turn.Usage.OutputTokens > 0 && transcript.Usage.InputTokens == turn.Usage.InputTokens, "Usage on the turn and in the totals");
                Assert.True(turn.Result != null && turn.Result.Contains("Echo:", StringComparison.Ordinal) && !turn.Result.Contains(_SecretValue, StringComparison.Ordinal), "Result redacted");
                Assert.Equal(0L, turn.OmittedEvents, "Nothing removed by retention");
            }
        }

        private static async Task FormatsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + cluster.Server.TenantId;
                HttpClient admin = cluster.Server.AdminClient;
                Agent agent = await cluster.CreateAgentAsync("transcript-chat", "builtin/fake", null, token).ConfigureAwait(false);
                Run first = await HttpTestHelpers.SendAsync<Run>(admin, HttpMethod.Post, t + "/agents/" + agent.Name + "/invoke", new InvokeRequest { Input = "first question", StartConversation = true, WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                Assert.True(!String.IsNullOrEmpty(first.ConversationId), "Conversation started");
                Run second = await HttpTestHelpers.SendAsync<Run>(admin, HttpMethod.Post, t + "/agents/" + agent.Name + "/invoke", new InvokeRequest { Input = "second question", ConversationId = first.ConversationId, WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, second.Status, "Second turn");

                // Negotiation and headers.
                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, t + "/runs/" + first.Id + "/transcript"))
                {
                    request.Headers.Add("Accept", "application/json");
                    using (HttpResponseMessage response = await admin.SendAsync(request, token).ConfigureAwait(false))
                    {
                        Assert.Equal(200, (int)response.StatusCode, "Accept JSON");
                        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType, "JSON media type");
                        Assert.Equal(first.Id + "-transcript.json", response.Content.Headers.ContentDisposition?.FileName?.Trim('"'), "JSON file name");
                        Assert.True(response.Content.Headers.ContentDisposition?.DispositionType == "attachment", "Attachment");
                        Assert.True(response.Headers.TryGetValues("X-Garrison-Transcript-Truncated", out IEnumerable<string>? truncated) && truncated.Single() == "false", "Truncation header");
                        Transcript parsed = Assert.NotNull(Serializer.Deserialize<Transcript>(await response.Content.ReadAsStringAsync(token).ConfigureAwait(false)), "JSON by Accept");
                        Assert.Equal(first.Id, parsed.RunId, "Run id");
                    }
                }
                using (HttpResponseMessage response = await admin.GetAsync(t + "/runs/" + first.Id + "/transcript", token).ConfigureAwait(false))
                {
                    Assert.Equal("text/markdown", response.Content.Headers.ContentType?.MediaType, "Markdown by default");
                    Assert.Equal(first.Id + "-transcript.md", response.Content.Headers.ContentDisposition?.FileName?.Trim('"'), "Markdown file name");
                }
                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, t + "/runs/" + first.Id + "/transcript?format=MARKDOWN"))
                {
                    request.Headers.Add("Accept", "application/json");
                    using (HttpResponseMessage response = await admin.SendAsync(request, token).ConfigureAwait(false))
                    {
                        Assert.Equal("text/markdown", response.Content.Headers.ContentType?.MediaType, "The query wins over Accept");
                    }
                }
                TestResponse invalid = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, t + "/runs/" + first.Id + "/transcript?format=xml", null, token).ConfigureAwait(false);
                Assert.Equal(400, invalid.StatusCode, "Unknown format");
                ErrorResponse error = Assert.NotNull(Serializer.Deserialize<ErrorResponse>(invalid.Body), "Error body");
                Assert.True(error.FieldCodes != null && error.FieldCodes.TryGetValue("format", out string? code) && code == "InvalidFormat", "InvalidFormat field code: " + invalid.Body);

                // Conversation transcript with every turn.
                Transcript conversation = await HttpTestHelpers.SendAsync<Transcript>(admin, HttpMethod.Get, t + "/conversations/" + first.ConversationId + "/transcript?format=json", null, 200, token).ConfigureAwait(false);
                Assert.True(conversation.Kind == TranscriptKindEnum.Conversation && conversation.ConversationId == first.ConversationId && conversation.TurnCount == 2, "Two turns");
                Assert.True(conversation.Turns[0].RunId == first.Id && conversation.Turns[0].Turn == 1 && conversation.Turns[0].Input == "first question", "Turn 1 first");
                Assert.True(conversation.Turns[1].RunId == second.Id && conversation.Turns[1].Turn == 2 && conversation.Turns[1].Input == "second question", "Turn 2 second");
                Assert.True(conversation.Usage.InputTokens == conversation.Turns.Sum(x => x.Usage.InputTokens), "Totals add up");
                TestResponse conversationMd = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, t + "/conversations/" + first.ConversationId + "/transcript", null, token).ConfigureAwait(false);
                Assert.True(conversationMd.Body.Contains("## Turn 1:", StringComparison.Ordinal) && conversationMd.Body.Contains("## Turn 2:", StringComparison.Ordinal) && conversationMd.Body.Contains("### Input", StringComparison.Ordinal), "Conversation Markdown: " + conversationMd.Body);

                // The size cap cuts the transcript and says where to read the rest.
                TranscriptOptions options = cluster.Server.Server.Context.Get<TranscriptOptions>();
                int previous = options.MaxBytes;
                options.MaxBytes = 65536;
                try
                {
                    Run large = await HttpTestHelpers.SendAsync<Run>(admin, HttpMethod.Post, t + "/agents/" + agent.Name + "/invoke", new InvokeRequest { Input = new string('x', 70000), WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                    Transcript cut = await HttpTestHelpers.SendAsync<Transcript>(admin, HttpMethod.Get, t + "/runs/" + large.Id + "/transcript?format=json", null, 200, token).ConfigureAwait(false);
                    Assert.True(cut.Truncated && cut.Turns.Single().Truncated, "Truncated at the cap");
                    Assert.True(cut.TruncationNote != null && cut.TruncationNote.Contains("Transcripts.MaxBytes", StringComparison.Ordinal) && cut.TruncationNote.Contains("/runs/" + large.Id + "/events?afterSequence=", StringComparison.Ordinal), "Note says where to read the rest: " + cut.TruncationNote);
                    using (HttpResponseMessage response = await admin.GetAsync(t + "/runs/" + large.Id + "/transcript", token).ConfigureAwait(false))
                    {
                        Assert.True(response.Headers.TryGetValues("X-Garrison-Transcript-Truncated", out IEnumerable<string>? truncated) && truncated.Single() == "true", "Truncation header set");
                        string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.True(body.Contains("> **Truncated.**", StringComparison.Ordinal), "Markdown truncation note");
                    }
                }
                finally
                {
                    options.MaxBytes = previous;
                }

                // MCP tools.
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(cluster.Server, null, token).ConfigureAwait(false);
                    McpTranscriptExport mdExport = await client.CallAsync<McpTranscriptExport>("garrison_get_run_transcript", new { runId = first.Id }, token).ConfigureAwait(false);
                    Assert.True(mdExport.Format == "markdown" && mdExport.Markdown != null && mdExport.Markdown.Contains("first question", StringComparison.Ordinal) && mdExport.Transcript == null && mdExport.FileName == first.Id + "-transcript.md", "MCP run transcript in Markdown");
                    McpTranscriptExport jsonExport = await client.CallAsync<McpTranscriptExport>("garrison_get_conversation_transcript", new { conversationId = first.ConversationId, format = "json" }, token).ConfigureAwait(false);
                    Assert.True(jsonExport.Format == "json" && jsonExport.Transcript != null && jsonExport.Transcript.TurnCount == 2 && jsonExport.Markdown == null, "MCP conversation transcript in JSON");
                    await client.ExpectErrorAsync("garrison_get_run_transcript", new { runId = first.Id, format = "pdf" }, "format", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_get_conversation_transcript", new { }, "conversationId", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task IsolationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + cluster.Server.TenantId;
                HttpClient admin = cluster.Server.AdminClient;
                Agent agent = await cluster.CreateAgentAsync("transcript-owned", "builtin/fake", null, token).ConfigureAwait(false);
                Run run = await HttpTestHelpers.SendAsync<Run>(admin, HttpMethod.Post, t + "/agents/" + agent.Name + "/invoke", new InvokeRequest { Input = "private work", StartConversation = true, WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(admin, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Transcripts Other " + Guid.NewGuid().ToString("N").Substring(0, 6) }, 201, token).ConfigureAwait(false);
                string o = "/v1.0/api/tenants/" + other.Id;

                TestResponse runCross = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, o + "/runs/" + run.Id + "/transcript", null, token).ConfigureAwait(false);
                Assert.Equal(404, runCross.StatusCode, "Run transcript through another tenant");
                TestResponse conversationCross = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, o + "/conversations/" + run.ConversationId + "/transcript?format=json", null, token).ConfigureAwait(false);
                Assert.Equal(404, conversationCross.StatusCode, "Conversation transcript through another tenant");
                Assert.True(!runCross.Body.Contains("private work", StringComparison.Ordinal) && !conversationCross.Body.Contains("private work", StringComparison.Ordinal), "Nothing leaks");
                TestResponse missing = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, t + "/runs/run_doesnotexist/transcript", null, token).ConfigureAwait(false);
                Assert.Equal(404, missing.StatusCode, "Unknown run");

                using (McpHttpClient client = new McpHttpClient())
                {
                    // An administrator acting in the other tenant cannot reach this tenant's run or conversation.
                    client.SetRequestHeader("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                    client.SetRequestHeader("x-tenant-id", other.Id);
                    await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);
                    string runError = await ToolErrorAsync(client, "garrison_get_run_transcript", new { runId = run.Id }).ConfigureAwait(false);
                    Assert.True(runError.Contains("NotFound", StringComparison.Ordinal) && !runError.Contains("private work", StringComparison.Ordinal), "MCP run transcript across tenants: " + runError);
                    string conversationError = await ToolErrorAsync(client, "garrison_get_conversation_transcript", new { conversationId = run.ConversationId }).ConfigureAwait(false);
                    Assert.True(conversationError.Contains("NotFound", StringComparison.Ordinal), "MCP conversation transcript across tenants: " + conversationError);
                }
            }
        }

        private static async Task<string> ToolErrorAsync(McpHttpClient client, string name, object arguments)
        {
            ProviderToolResult result = await client.CallAsync<ProviderToolResult>("tools/call", new { name, arguments }, 90000).ConfigureAwait(false);
            string text = ProviderMcpBridge.Text(result);
            if (!result.IsError) throw new TestAssertionException(name + " was expected to fail: " + text);
            return text;
        }

        private static async Task<Run> ToolRunAsync(TestCluster cluster, string agentName, string input, CancellationToken token)
        {
            string t = "/v1.0/api/tenants/" + cluster.Server.TenantId;
            HttpClient admin = cluster.Server.AdminClient;
            HarnessProfile profile = new HarnessProfile();
            profile.Name = agentName + "-profile";
            profile.HarnessType = HarnessTypeEnum.Generic;
            profile.Executable = "garrison-fake-harness";
            foreach (string argument in new string[] { "--format", "claude", "--tool-calls", "2" }) profile.Arguments.Add(new HarnessArgument { Template = argument });
            profile.OutputParser = OutputParserEnum.ClaudeStreamJson;
            profile.PromptDelivery = PromptDeliveryEnum.Stdin;
            profile.SystemPromptDelivery = SystemPromptDeliveryEnum.None;
            await HttpTestHelpers.SendAsync<HarnessProfile>(admin, HttpMethod.Post, t + "/harness-profiles", profile, 201, token).ConfigureAwait(false);
            Secret secret = await HttpTestHelpers.SendAsync<Secret>(admin, HttpMethod.Post, t + "/secrets", new SecretRequest { Name = agentName + "-token", Kind = SecretKindEnum.BearerToken, Value = _SecretValue }, 201, token).ConfigureAwait(false);
            Agent agent = await cluster.CreateAgentAsync(agentName, profile.Name, null, token, d => d.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = "token", ResourceId = secret.Id })).ConfigureAwait(false);
            return await HttpTestHelpers.SendAsync<Run>(admin, HttpMethod.Post, t + "/agents/" + agent.Name + "/invoke", new InvokeRequest { Input = input, WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
        }

        #endregion
    }
}
