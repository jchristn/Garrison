namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Server.Runtime;
    using Garrison.Worker.Execution;
    using Garrison.Worker.Hosting;
    using Garrison.Worker.Reporting;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;
    using Voltaic.A2A;
    using Voltaic.Mcp;

    /// <summary>
    /// Conversations (plan P12.1): multi-turn runs that resume the harness session on the node holding it, A2A
    /// contextId continuity, fallback to a fresh session seeded with the transcript when the affinity node or its
    /// directories are lost, the ConversationBusy rule, tenant isolation, RBAC, and delete. Uses the fake harness, which
    /// reports "[turn N]" (the turns recorded in its session) when the deployment sets reportTurns.
    /// </summary>
    public static class ConversationSuite
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
            unit.Add(new TestCaseDescriptor("conversation-unit", "executor-formats", "Executor: a conversation turn resumes the session in the conversation's directories for the Claude, Codex, Mux, and Codex app-server formats", ExecutorFormatsAsync));
            unit.Add(new TestCaseDescriptor("conversation-unit", "executor-state-lost", "Executor: a resume whose directories are gone reports ConversationStateLost without launching; a fresh turn replaces old directories", ExecutorStateLostAsync));
            unit.Add(new TestCaseDescriptor("conversation-unit", "executor-sweep", "Executor: the sweep removes unused conversation directories and keeps active and recent ones", ExecutorSweepAsync));
            unit.Add(new TestCaseDescriptor("conversation-unit", "affinity-rule", "Scheduler: other nodes leave a turn to its Ready affinity node until the wait ends", AffinityRuleAsync));
            unit.Add(new TestCaseDescriptor("conversation-unit", "compile", "Compiler: resumed turns pass each built-in profile's resume form, Mux persists the session, fallback turns render the transcript, KubernetesJob turns get no conversation directories", CompileAsync));
            suites.Add(new TestSuiteDescriptor("conversation-unit", "Conversations (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "conversations-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "database", "Database: conversation CRUD, turn compare-and-set, release, success and fallback records (" + provider + ")", ct => DatabaseAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "multi-turn", "Three turns on one node resume one harness session; the conversation records session, node, and turns (" + provider + ")", ct => MultiTurnAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "a2a-context", "A2A: a message without contextId starts a conversation, the same contextId continues it, a client contextId is kept, ListTasks filters by it (" + provider + ")", ct => A2AContextAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp", "MCP: garrison_invoke_agent starts and continues a conversation (" + provider + ")", ct => McpAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "node-lost", "Affinity node lost: the next turn runs on another node as a fresh session seeded with the transcript, and the fallback is recorded (" + provider + ")", ct => NodeLostAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "workspace-lost", "Workspace gone on the affinity node: the turn is requeued as a fallback and succeeds (" + provider + ")", ct => WorkspaceLostAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "busy", "Concurrency: a turn sent while the previous one is unfinished gets 409 ConversationBusy; delete is refused too (" + provider + ")", ct => BusyAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "isolation", "Tenant isolation and RBAC: other tenants get 404, Viewer reads but cannot delete, no role gets 403 (" + provider + ")", ct => IsolationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "delete", "Delete: an idle conversation is deleted and audited, its runs are kept, and new turns get 404 (" + provider + ")", ct => DeleteAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mismatch", "Validation: unknown conversation 404, another agent's conversation and another deployment get 409 (" + provider + ")", ct => MismatchAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Conversations (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string T(TestCluster cluster)
        {
            return "/v1.0/api/tenants/" + cluster.Server.TenantId;
        }

        private static Task<Agent> TurnAgentAsync(TestCluster cluster, string name, CancellationToken token, int delayMs = 0)
        {
            return cluster.CreateAgentAsync(name, "builtin/fake", null, token, d =>
            {
                d.Parameters.Add(new DeploymentParameter { Name = "reportTurns", Value = "true" });
                if (delayMs > 0) d.Parameters.Add(new DeploymentParameter { Name = "delayMs", Value = delayMs.ToString(System.Globalization.CultureInfo.InvariantCulture) });
            });
        }

        private static async Task<TestResponse> InvokeRawAsync(HttpClient client, string tenantPath, string agentId, string input, string? conversationId, bool start, bool wait, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = input;
            request.Wait = wait;
            request.WaitSeconds = 90;
            request.ConversationId = conversationId;
            request.StartConversation = start;
            return await HttpTestHelpers.SendAsync(client, HttpMethod.Post, tenantPath + "/agents/" + agentId + "/invoke", request, token).ConfigureAwait(false);
        }

        private static async Task<Run> TurnAsync(TestCluster cluster, Agent agent, string input, string? conversationId, bool start, CancellationToken token)
        {
            TestResponse response = await InvokeRawAsync(cluster.Server.AdminClient, T(cluster), agent.Id, input, conversationId, start, true, token).ConfigureAwait(false);
            Assert.True(response.StatusCode == 200 || response.StatusCode == 202, "Invoke returned " + response.StatusCode + ": " + response.Body);
            Run run = Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
            if (!RunService.IsTerminal(run.Status)) run = await WaitAsync(cluster, run.Id, token).ConfigureAwait(false);
            return run;
        }

        private static async Task<Run> WaitAsync(TestCluster cluster, string runId, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(90);
            while (true)
            {
                Run run = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Get, T(cluster) + "/runs/" + runId, null, 200, token).ConfigureAwait(false);
                if (RunService.IsTerminal(run.Status)) return run;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Run " + runId + " did not finish in time (status " + run.Status + ").");
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        private static Task<Conversation> ConversationAsync(TestCluster cluster, string id, CancellationToken token)
        {
            return HttpTestHelpers.SendAsync<Conversation>(cluster.Server.AdminClient, HttpMethod.Get, T(cluster) + "/conversations/" + id, null, 200, token);
        }

        private static async Task<List<RunEvent>> EventsAsync(TestCluster cluster, Run run, CancellationToken token)
        {
            RunEventsResponse events = await HttpTestHelpers.SendAsync<RunEventsResponse>(cluster.Server.AdminClient, HttpMethod.Get, T(cluster) + "/runs/" + run.Id + "/events?limit=1000", null, 200, token).ConfigureAwait(false);
            return events.Events;
        }

        private static void Succeeded(Run run, string what)
        {
            Assert.Equal(RunStatusEnum.Succeeded, run.Status, what + " status (" + run.Outcome + ": " + run.ErrorMessage + ")");
        }

        private static string FakeHarnessDll()
        {
            string path = Path.Combine(AppContext.BaseDirectory, "garrison-fake-harness.dll");
            if (!File.Exists(path)) throw new TestAssertionException("garrison-fake-harness.dll not found next to the test runner at " + path + ".");
            return path;
        }

        private static string DotnetHost()
        {
            string? process = Environment.ProcessPath;
            if (!String.IsNullOrEmpty(process) && Path.GetFileNameWithoutExtension(process).Equals("dotnet", StringComparison.OrdinalIgnoreCase)) return process;
            return "dotnet";
        }

        private static ProcessRunExecutor Executor(string workRoot)
        {
            ExecutorOptions options = new ExecutorOptions();
            options.WorkRoot = workRoot;
            options.EnvironmentAllowlist = new List<string> { "PATH", "DOTNET_ROOT", "TMPDIR", "LANG" };
            options.McpPreflightTimeoutMs = 3000;
            return new ProcessRunExecutor(options);
        }

        private static RunAssignment TurnAssignment(string conversationId, int turn, bool resume, string format, OutputParserEnum parser, string prompt, List<string> sessionArguments)
        {
            ExecutionSpec spec = new ExecutionSpec();
            spec.RunId = "run_conv_" + Guid.NewGuid().ToString("N").Substring(0, 12);
            spec.TenantId = "ten_test";
            spec.AgentName = "fake";
            spec.HarnessType = HarnessTypeEnum.Generic;
            spec.Executable = DotnetHost();
            spec.Arguments = new List<string> { FakeHarnessDll(), "--format", format, "--report-turns" };
            spec.Arguments.AddRange(sessionArguments);
            spec.Stdin = prompt;
            spec.Parser = parser;
            spec.TimeoutSeconds = 60;
            spec.KillGraceSeconds = 1;
            spec.Conversation = new ExecutionConversation { ConversationId = conversationId, Turn = turn, Resume = resume };
            RunAssignment assignment = new RunAssignment();
            assignment.RunId = spec.RunId;
            assignment.Epoch = 1;
            assignment.Spec = spec;
            return assignment;
        }

        private static async Task ExecutorFormatsAsync(CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-conversation-tests", Guid.NewGuid().ToString("N"));
            ProcessRunExecutor executor = Executor(root);
            try
            {
                foreach (string format in new[] { "claude", "codex", "mux", "codex-app-server" })
                {
                    string conversation = "cnv_" + format.Replace("-", "_") + "_" + Guid.NewGuid().ToString("N").Substring(0, 8);
                    OutputParserEnum parser = format == "claude" ? OutputParserEnum.ClaudeStreamJson : format == "codex" ? OutputParserEnum.CodexJsonl : format == "mux" ? OutputParserEnum.MuxJsonl : OutputParserEnum.CodexAppServer;

                    // First turn: Mux names its session (--session-id), the others report a generated one.
                    List<string> first = new List<string>();
                    if (format == "mux") first.AddRange(new[] { "--session-id", "run_first_" + format });
                    RunAssignment one = TurnAssignment(conversation, 1, false, format, parser, "first question " + format, first);
                    if (format == "codex-app-server") one.Spec!.AppServer = new ExecutionAppServer();
                    InMemoryRunReporter reporter = new InMemoryRunReporter();
                    RunCompleteRequest done = await executor.ExecuteAsync(one, reporter, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, done.Status, format + ": first turn (" + done.ErrorMessage + "; " + done.StderrTail + ")");
                    Assert.True((done.ResultText ?? String.Empty).StartsWith("[turn 1] Echo: first question", StringComparison.Ordinal), format + ": first turn answer: " + done.ResultText);
                    string session = Assert.NotNull(done.SessionId, format + ": session id reported");
                    if (format == "mux") Assert.Equal("run_first_" + format, session, "mux: the session is the one named with --session-id");
                    RunDirectories directories = RunDirectories.For(root, one.RunId, one.Spec);
                    Assert.True(directories.Exists(), format + ": the conversation's directories outlive the turn");
                    Assert.True(!Directory.Exists(Path.Combine(root, one.RunId)), format + ": no per-run directory");

                    // Second turn resumes with the format's own resume form.
                    List<string> resume = new List<string>();
                    if (format == "codex") resume.AddRange(new[] { "resume", session, "-" });
                    else if (format != "codex-app-server") resume.AddRange(new[] { "--resume", session });
                    RunAssignment two = TurnAssignment(conversation, 2, true, format, parser, "second question " + format, resume);
                    if (format == "codex-app-server") two.Spec!.AppServer = new ExecutionAppServer { ResumeThreadId = session };
                    InMemoryRunReporter second = new InMemoryRunReporter();
                    RunCompleteRequest resumed = await executor.ExecuteAsync(two, second, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, resumed.Status, format + ": resumed turn (" + resumed.ErrorMessage + "; " + resumed.StderrTail + ")");
                    Assert.True((resumed.ResultText ?? String.Empty).StartsWith("[turn 2] Echo: second question", StringComparison.Ordinal), format + ": the resumed session has two turns: " + resumed.ResultText);
                    Assert.Equal(session, resumed.SessionId, format + ": the resumed turn reports the same session");
                    Assert.True(second.Events().Any(e => e.Code == "ConversationResumed"), format + ": ConversationResumed lifecycle event");
                }
            }
            finally
            {
                if (Directory.Exists(root)) Directory.Delete(root, true);
            }
        }

        private static async Task ExecutorStateLostAsync(CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-conversation-tests", Guid.NewGuid().ToString("N"));
            ProcessRunExecutor executor = Executor(root);
            try
            {
                string conversation = "cnv_lost_" + Guid.NewGuid().ToString("N").Substring(0, 8);
                RunAssignment resume = TurnAssignment(conversation, 2, true, "claude", OutputParserEnum.ClaudeStreamJson, "anyone there", new List<string> { "--resume", "missing-session" });
                InMemoryRunReporter reporter = new InMemoryRunReporter();
                RunCompleteRequest lost = await executor.ExecuteAsync(resume, reporter, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Failed, lost.Status, "Status");
                Assert.Equal(RunOutcomeEnum.ConversationStateLost, lost.Outcome, "Outcome");
                Assert.True(!reporter.Started, "The harness was not launched");
                Assert.True(reporter.Events().Any(e => e.EventType == RunEventTypeEnum.Warning && e.Code == "ConversationStateLost"), "Warning event");
                Assert.True(!Directory.Exists(RunDirectories.For(root, resume.RunId, resume.Spec).Root), "No directories were created for the lost conversation");

                // A fresh turn (first turn or fallback) starts from clean directories even when old ones exist.
                RunAssignment fresh = TurnAssignment(conversation, 1, false, "claude", OutputParserEnum.ClaudeStreamJson, "start over", new List<string>());
                RunDirectories directories = RunDirectories.For(root, fresh.RunId, fresh.Spec);
                directories.Create();
                File.WriteAllText(Path.Combine(directories.Workspace, "stale.txt"), "old");
                RunCompleteRequest done = await executor.ExecuteAsync(fresh, new InMemoryRunReporter(), token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, done.Status, "Fresh turn (" + done.ErrorMessage + ")");
                Assert.True((done.ResultText ?? String.Empty).StartsWith("[turn 1]", StringComparison.Ordinal), "Fresh session: " + done.ResultText);
                Assert.True(!File.Exists(Path.Combine(directories.Workspace, "stale.txt")), "Old directories were replaced");
            }
            finally
            {
                if (Directory.Exists(root)) Directory.Delete(root, true);
            }
        }

        private static Task ExecutorSweepAsync(CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-conversation-tests", Guid.NewGuid().ToString("N"));
            ProcessRunExecutor executor = Executor(root);
            try
            {
                string conversations = RunDirectories.ConversationsRoot(root);
                foreach (string name in new[] { "cnv_old", "cnv_active", "cnv_recent" })
                {
                    new RunDirectories(conversations, name).Create();
                }
                Directory.SetLastWriteTimeUtc(Path.Combine(conversations, "cnv_old"), DateTime.UtcNow.AddHours(-30));
                Directory.SetLastWriteTimeUtc(Path.Combine(conversations, "cnv_active"), DateTime.UtcNow.AddHours(-30));
                Assert.Equal(0, executor.SweepConversations(TimeSpan.Zero, new HashSet<string>()), "Retention 0 sweeps nothing");
                int deleted = executor.SweepConversations(TimeSpan.FromHours(24), new HashSet<string> { "cnv_active" });
                Assert.Equal(1, deleted, "One conversation swept");
                Assert.True(!Directory.Exists(Path.Combine(conversations, "cnv_old")), "Unused conversation removed");
                Assert.True(Directory.Exists(Path.Combine(conversations, "cnv_active")), "A conversation with a run on the worker is kept");
                Assert.True(Directory.Exists(Path.Combine(conversations, "cnv_recent")), "A recently used conversation is kept");
            }
            finally
            {
                if (Directory.Exists(root)) Directory.Delete(root, true);
            }
            return Task.CompletedTask;
        }

        private static Task AffinityRuleAsync(CancellationToken token)
        {
            DateTime now = DateTime.UtcNow;
            Node holder = new Node { Id = "nod_holder", Name = "holder", Status = NodeStatusEnum.Ready };
            Node other = new Node { Id = "nod_other", Name = "other", Status = NodeStatusEnum.Ready };
            Run run = new Run { AffinityNodeId = holder.Id, AffinityUntilUtc = now.AddSeconds(30), ResumeSessionId = "sess" };
            Assert.True(ConversationService.DefersToAffinityNode(run, other, holder, now), "Another node waits while the holder is Ready and the wait runs");
            Assert.True(!ConversationService.DefersToAffinityNode(run, holder, holder, now), "The holder claims its own turn");
            Assert.True(!ConversationService.DefersToAffinityNode(run, other, holder, now.AddSeconds(31)), "After the wait any node may claim");
            holder.Status = NodeStatusEnum.Lost;
            Assert.True(!ConversationService.DefersToAffinityNode(run, other, holder, now), "A Lost holder is not waited for");
            holder.Status = NodeStatusEnum.Cordoned;
            Assert.True(!ConversationService.DefersToAffinityNode(run, other, holder, now), "A Cordoned holder is not waited for");
            Assert.True(!ConversationService.DefersToAffinityNode(run, other, null, now), "A deleted holder is not waited for");
            Assert.True(!ConversationService.DefersToAffinityNode(new Run(), other, null, now), "Runs without affinity are claimed normally");
            return Task.CompletedTask;
        }

        private static async Task CompileAsync(CancellationToken token)
        {
            foreach (string profile in new[] { "claude-code", "codex", "codex-app-server", "mux", "gemini-cli" })
            {
                using (CompilerFixture fixture = await CompilerFixture.CreateAsync(DatabaseTypeEnum.Sqlite, token).ConfigureAwait(false))
                {
                    Deployment deployment = await fixture.DeploymentAsync(profile, false, token).ConfigureAwait(false);
                    Run first = CompilerFixture.RunFor(deployment, false);
                    first.ConversationId = "cnv_golden";
                    first.ConversationTurn = 1;
                    CompilationResult one = await fixture.Compiler.CompileAsync(first, null, token).ConfigureAwait(false);
                    ExecutionConversation turn = Assert.NotNull(one.Spec.Conversation, profile + ": conversation settings on a Process turn");
                    Assert.Equal("cnv_golden", turn.ConversationId, profile + ": conversation directory");
                    Assert.True(!turn.Resume, profile + ": the first turn does not resume");
                    if (profile == "mux")
                    {
                        int named = one.Spec.Arguments.IndexOf("--session-id");
                        Assert.True(named > 0 && one.Spec.Arguments[named + 1] == first.Id, "mux: a conversation's first turn names its session: " + String.Join(" ", one.Spec.Arguments));
                        Assert.True(!one.Spec.Arguments.Contains("--no-session-persistence"), "mux: the session is persisted for the next turn");
                    }

                    Run second = CompilerFixture.RunFor(deployment, false);
                    second.ConversationId = "cnv_golden";
                    second.ConversationTurn = 2;
                    second.ResumeSessionId = "sess-conv";
                    CompilationResult two = await fixture.Compiler.CompileAsync(second, null, token).ConfigureAwait(false);
                    Assert.True(Assert.NotNull(two.Spec.Conversation, profile + ": resumed turn settings").Resume, profile + ": the turn resumes");
                    int index = two.Spec.Arguments.IndexOf("sess-conv");
                    if (profile == "codex-app-server")
                    {
                        Assert.True(index < 0, "codex-app-server: no resume argument");
                        Assert.Equal("sess-conv", Assert.NotNull(two.Spec.AppServer, "app-server settings").ResumeThreadId, "codex-app-server: thread/resume of the conversation's thread");
                    }
                    else
                    {
                        Assert.True(index > 0, profile + ": session passed: " + String.Join(" ", two.Spec.Arguments));
                        Assert.Equal(profile == "codex" ? "resume" : "--resume", two.Spec.Arguments[index - 1], profile + ": resume form");
                    }
                    if (profile == "mux") Assert.True(!two.Spec.Arguments.Contains("--session-id"), "mux: a resumed turn does not name a new session");
                    Assert.True((two.Spec.Stdin ?? String.Empty).Contains("Summarize the repository.", StringComparison.Ordinal), profile + ": a resumed turn sends only the new task");

                    Run fallback = CompilerFixture.RunFor(deployment, false);
                    fallback.ConversationId = "cnv_golden";
                    fallback.ConversationTurn = 3;
                    fallback.ConversationFallbackReason = ConversationFallbackReasonEnum.AffinityNodeLost;
                    CompilationConversation transcript = new CompilationConversation();
                    transcript.Turns.Add(new ConversationTranscriptTurn { Turn = 1, Input = "What is the capital of France?", Output = "Paris." });
                    transcript.Turns.Add(new ConversationTranscriptTurn { Turn = 2, Input = "And of Spain?", Output = "Madrid.", OutputTruncated = true });
                    CompilationResult three = await fixture.Compiler.CompileAsync(fallback, null, transcript, token).ConfigureAwait(false);
                    string prompt = three.Spec.Stdin ?? String.Empty;
                    Assert.True(prompt.Contains("continues in a new session", StringComparison.Ordinal), profile + ": fallback prompt from builtin/conversation-fallback: " + prompt);
                    Assert.True(prompt.Contains("What is the capital of France?", StringComparison.Ordinal) && prompt.Contains("Paris.", StringComparison.Ordinal) && prompt.Contains("Madrid. [cut short]", StringComparison.Ordinal), profile + ": earlier turns repeated: " + prompt);
                    Assert.True(prompt.IndexOf("Summarize the repository.", StringComparison.Ordinal) > prompt.IndexOf("Madrid.", StringComparison.Ordinal), profile + ": the current task comes last");
                    Assert.True(!three.Spec.Arguments.Any(a => a == "--resume" || a == "resume"), profile + ": a fallback starts a fresh session");
                    Assert.True(!Assert.NotNull(three.Spec.Conversation, profile + ": fallback settings").Resume, profile + ": a fallback does not resume");
                    Assert.True(three.TemplateVersions.Any(v => v.TemplateName == "builtin/conversation-fallback"), profile + ": the fallback template version is recorded");

                    Run job = CompilerFixture.RunFor(deployment, false);
                    job.ConversationId = "cnv_golden";
                    job.ConversationTurn = 1;
                    job.Executor = RunExecutorEnum.KubernetesJob;
                    CompilationResult pod = await fixture.Compiler.CompileAsync(job, null, token).ConfigureAwait(false);
                    Assert.True(pod.Spec.Conversation == null, profile + ": KubernetesJob turns keep no conversation directories");
                }
            }
        }

        private static async Task DatabaseAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (Garrison.Core.Database.DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Conversation conversation = new Conversation();
                conversation.TenantId = "ten_a";
                conversation.AgentId = "agt_a";
                conversation.AgentName = "alpha";
                conversation.ContextId = "client-context-1";
                conversation.Title = "First line\nsecond line";
                conversation.ActiveRunId = "run_one";
                conversation.LastActivityUtc = DateTime.UtcNow;
                await db.Conversations.CreateAsync(conversation, token).ConfigureAwait(false);
                Assert.Equal("First line", conversation.Title, "Title keeps the first line");

                Conversation read = Assert.NotNull(await db.Conversations.ReadAsync("ten_a", conversation.Id, token).ConfigureAwait(false), "Read in tenant");
                Assert.Equal("run_one", read.ActiveRunId, "Active run");
                Assert.True(await db.Conversations.ReadAsync("ten_b", conversation.Id, token).ConfigureAwait(false) == null, "Other tenant reads nothing");
                Assert.Equal(conversation.Id, Assert.NotNull(await db.Conversations.ReadByContextIdAsync("ten_a", "agt_a", "client-context-1", token).ConfigureAwait(false), "By context").Id, "Context lookup");
                Assert.Equal("client-context-1", read.EffectiveContextId(), "Client context is the effective context");

                Assert.True(!await db.Conversations.TryAcquireTurnAsync(conversation.Id, null, "run_two", DateTime.UtcNow, token).ConfigureAwait(false), "Acquire fails when the expected active run differs");
                Assert.True(await db.Conversations.TryAcquireTurnAsync(conversation.Id, "run_one", "run_two", DateTime.UtcNow, token).ConfigureAwait(false), "Acquire replaces the expected active run");
                Assert.True(!await db.Conversations.TryAcquireTurnAsync(conversation.Id, "run_one", "run_three", DateTime.UtcNow, token).ConfigureAwait(false), "A second acquire with the stale expectation loses");

                conversation.DeploymentId = "dep_a";
                conversation.HarnessType = HarnessTypeEnum.ClaudeCode;
                Assert.True(await db.Conversations.RecordTurnStartedAsync(conversation, "run_two", token).ConfigureAwait(false), "Turn started recorded");
                Assert.True(!await db.Conversations.RecordTurnStartedAsync(conversation, "run_other", token).ConfigureAwait(false), "Only the active run records");
                Assert.True(await db.Conversations.RecordTurnSucceededAsync(conversation.Id, "run_two", "sess-1", "hrn_x", "nod_1", "node-1", DateTime.UtcNow, token).ConfigureAwait(false), "Success recorded");
                read = Assert.NotNull(await db.Conversations.ReadAsync(conversation.Id, token).ConfigureAwait(false), "Read");
                Assert.Equal(1, read.TurnCount, "Turn count");
                Assert.Equal("run_two", read.LastRunId, "Last run");
                Assert.Equal("dep_a", read.DeploymentId, "Deployment");
                Assert.Equal("sess-1", read.SessionId, "Session");
                Assert.Equal("nod_1", read.AffinityNodeId, "Affinity node");

                Assert.True(await db.Conversations.RecordFallbackAsync(conversation.Id, ConversationFallbackReasonEnum.WorkspaceLost, DateTime.UtcNow, token).ConfigureAwait(false), "Fallback recorded");
                read = Assert.NotNull(await db.Conversations.ReadAsync(conversation.Id, token).ConfigureAwait(false), "Read");
                Assert.Equal(1, read.FallbackCount, "Fallback count");
                Assert.True(read.LastFallbackReason == ConversationFallbackReasonEnum.WorkspaceLost && read.LastFallbackUtc.HasValue, "Fallback reason and time");
                Assert.True(read.AffinityNodeId == null, "A fallback drops the affinity");

                Assert.True(await db.Conversations.ReleaseTurnAsync(conversation.Id, "run_two", "run_one", token).ConfigureAwait(false), "Release restores the previous active run");
                Assert.Equal("run_one", Assert.NotNull(await db.Conversations.ReadAsync(conversation.Id, token).ConfigureAwait(false), "Read").ActiveRunId, "Previous active run");

                Conversation second = new Conversation { TenantId = "ten_a", AgentId = "agt_b", AgentName = "bravo", Title = "Other agent" };
                await db.Conversations.CreateAsync(second, token).ConfigureAwait(false);
                EnumerationResult<Conversation> byAgent = await db.Conversations.EnumerateAsync(new ConversationFilter { TenantId = "ten_a", AgentId = "agt_a" }, token).ConfigureAwait(false);
                Assert.Equal(1L, byAgent.TotalRecords, "Filter by agent");
                EnumerationResult<Conversation> search = await db.Conversations.EnumerateAsync(new ConversationFilter { TenantId = "ten_a", Search = "other" }, token).ConfigureAwait(false);
                Assert.Equal(1L, search.TotalRecords, "Search by title");
                Assert.Equal(0L, (await db.Conversations.EnumerateAsync(new ConversationFilter { TenantId = "ten_b" }, token).ConfigureAwait(false)).TotalRecords, "Other tenant lists nothing");

                Assert.True(await db.Conversations.DeleteAsync(conversation.Id, token).ConfigureAwait(false), "Delete");
                Assert.True(!await db.Conversations.ExistsAsync(conversation.Id, token).ConfigureAwait(false), "Gone");
            }
        }

        private static async Task MultiTurnAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent agent = await TurnAgentAsync(cluster, "conv-multi", token).ConfigureAwait(false);
                Run first = await TurnAsync(cluster, agent, "What is two plus two?", null, true, token).ConfigureAwait(false);
                Succeeded(first, "First turn");
                string conversationId = Assert.NotNull(first.ConversationId, "The first turn names its conversation");
                Assert.True(conversationId.StartsWith("cnv_", StringComparison.Ordinal), "Conversation identifier prefix");
                Assert.Equal(1, first.ConversationTurn, "Turn 1");
                Assert.True(first.ResumeSessionId == null && first.ConversationFallbackReason == null, "The first turn neither resumes nor falls back");
                Assert.True((first.ResultText ?? String.Empty).StartsWith("[turn 1] Echo: What is two plus two?", StringComparison.Ordinal), "First answer: " + first.ResultText);
                string session = Assert.NotNull(first.SessionId, "Session reported");

                Conversation after = await ConversationAsync(cluster, conversationId, token).ConfigureAwait(false);
                Assert.Equal(1, after.TurnCount, "Turn count");
                Assert.Equal(session, after.SessionId, "Session recorded");
                Assert.Equal(first.LeaseNodeId, after.AffinityNodeId, "Affinity node recorded");
                Assert.True(!after.Busy, "Idle after the turn");
                Assert.Equal("What is two plus two?", after.Title, "Title from the first input");

                Run second = await TurnAsync(cluster, agent, "And times three?", conversationId, false, token).ConfigureAwait(false);
                Succeeded(second, "Second turn");
                Assert.Equal(2, second.ConversationTurn, "Turn 2");
                Assert.Equal(session, second.ResumeSessionId, "The second turn resumes the first turn's session");
                Assert.Equal(first.LeaseNodeId, second.LeaseNodeId, "Same node");
                Assert.True(second.ConversationFallbackReason == null, "No fallback");
                Assert.True((second.ResultText ?? String.Empty).StartsWith("[turn 2] Echo: And times three?", StringComparison.Ordinal), "The harness saw a two-turn session: " + second.ResultText);
                Assert.True((await EventsAsync(cluster, second, token).ConfigureAwait(false)).Any(e => e.Code == "ConversationResumed"), "ConversationResumed event");

                Run third = await TurnAsync(cluster, agent, "Now minus one?", conversationId, false, token).ConfigureAwait(false);
                Succeeded(third, "Third turn");
                Assert.True((third.ResultText ?? String.Empty).StartsWith("[turn 3]", StringComparison.Ordinal), "Third turn resumes too: " + third.ResultText);

                Conversation done = await ConversationAsync(cluster, conversationId, token).ConfigureAwait(false);
                Assert.Equal(3, done.TurnCount, "Three turns");
                Assert.Equal(third.Id, done.LastRunId, "Last run");
                Assert.Equal(0, done.FallbackCount, "No fallbacks");
                EnumerationResult<Run> runs = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(cluster.Server.AdminClient, HttpMethod.Get, T(cluster) + "/conversations/" + conversationId + "/runs", null, 200, token).ConfigureAwait(false);
                Assert.True(runs.Objects.Select(r => r.Id).SequenceEqual(new List<string> { first.Id, second.Id, third.Id }), "Turns oldest first: " + String.Join(", ", runs.Objects.Select(r => r.Id)));
                EnumerationResult<Run> filtered = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(cluster.Server.AdminClient, HttpMethod.Get, T(cluster) + "/runs?conversationId=" + conversationId, null, 200, token).ConfigureAwait(false);
                Assert.Equal(3L, filtered.TotalRecords, "Runs filter by conversation");
                EnumerationResult<Conversation> listed = await HttpTestHelpers.SendAsync<EnumerationResult<Conversation>>(cluster.Server.AdminClient, HttpMethod.Get, T(cluster) + "/conversations?agentId=" + agent.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(listed.Objects.Any(c => c.Id == conversationId), "Listed by agent");

                // A plain invocation still runs outside any conversation.
                Run single = await TurnAsync(cluster, agent, "One-off", null, false, token).ConfigureAwait(false);
                Succeeded(single, "One-off run");
                Assert.True(single.ConversationId == null && single.ConversationTurn == 0, "No conversation without startConversation");
                Assert.True((single.ResultText ?? String.Empty).StartsWith("[turn 1]", StringComparison.Ordinal), "One-off runs start their own session");
            }
        }

        private static async Task A2AContextAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                await TurnAgentAsync(cluster, "conv-a2a", token).ConfigureAwait(false);
                string url = cluster.Server.BaseUrl + "/v1.0/a2a/" + cluster.Server.TenantId + "/conv-a2a";
                using (HttpClient http = new HttpClient())
                {
                    http.DefaultRequestHeaders.Add("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                    http.Timeout = TimeSpan.FromSeconds(120);
                    using (A2AClient client = new A2AClient(url, http))
                    {
                        AgentTask first = await SendAsync(client, "Hello there", null, token).ConfigureAwait(false);
                        Assert.Equal(TaskState.Completed, first.Status.State, "First task");
                        string context = first.ContextId;
                        Assert.True(context.StartsWith("cnv_", StringComparison.Ordinal), "A message without contextId starts a conversation: " + context);
                        Assert.True(Answer(first).StartsWith("[turn 1]", StringComparison.Ordinal), "First answer: " + Answer(first));

                        AgentTask second = await SendAsync(client, "Remember me?", context, token).ConfigureAwait(false);
                        Assert.Equal(TaskState.Completed, second.Status.State, "Second task");
                        Assert.Equal(context, second.ContextId, "Same context");
                        Assert.True(Answer(second).StartsWith("[turn 2]", StringComparison.Ordinal), "The second message resumed the session: " + Answer(second));

                        AgentTask fetched = await client.GetTaskAsync(new GetTaskRequest { Id = second.Id }).ConfigureAwait(false);
                        Assert.Equal(context, fetched.ContextId, "GetTask reports the context");

                        ListTasksResponse listed = await client.ListTasksAsync(new ListTasksRequest { ContextId = context }).ConfigureAwait(false);
                        Assert.Equal(2, listed.Tasks.Count, "ListTasks by context lists the conversation's tasks");

                        string clientContext = "client-ctx-" + Guid.NewGuid().ToString("N").Substring(0, 8);
                        AgentTask own = await SendAsync(client, "My own context", clientContext, token).ConfigureAwait(false);
                        Assert.Equal(clientContext, own.ContextId, "A client contextId is kept");
                        AgentTask ownNext = await SendAsync(client, "Still mine", clientContext, token).ConfigureAwait(false);
                        Assert.Equal(clientContext, ownNext.ContextId, "Same client context");
                        Assert.True(Answer(ownNext).StartsWith("[turn 2]", StringComparison.Ordinal), "The client context continues its conversation: " + Answer(ownNext));
                        EnumerationResult<Conversation> found = await HttpTestHelpers.SendAsync<EnumerationResult<Conversation>>(cluster.Server.AdminClient, HttpMethod.Get, T(cluster) + "/conversations?contextId=" + clientContext, null, 200, token).ConfigureAwait(false);
                        Assert.Equal(1L, found.TotalRecords, "One conversation for the client context");
                        Assert.Equal(2, found.Objects[0].TurnCount, "Two turns");
                    }
                }
            }
        }

        private static async Task<AgentTask> SendAsync(A2AClient client, string text, string? contextId, CancellationToken token)
        {
            SendMessageRequest request = new SendMessageRequest();
            request.Message = new Message { Role = Voltaic.A2A.Role.User, MessageId = Guid.NewGuid().ToString("N"), ContextId = contextId, Parts = new List<Part> { Part.FromText(text) } };
            SendMessageResponse response = await client.SendMessageAsync(request).ConfigureAwait(false);
            return Assert.NotNull(response.Task, "Task");
        }

        private static string Answer(AgentTask task)
        {
            return task.Artifacts?.SelectMany(a => a.Parts).Select(p => p.Text).FirstOrDefault(t => t != null) ?? String.Empty;
        }

        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                await TurnAgentAsync(cluster, "conv-mcp", token).ConfigureAwait(false);
                using (McpHttpClient client = new McpHttpClient())
                {
                    client.SetRequestHeader("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                    client.SetRequestHeader("x-tenant-id", cluster.Server.TenantId);
                    await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);
                    JsonElement started = await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_invoke_agent", arguments = new { tenantId = cluster.Server.TenantId, agent = "conv-mcp", input = "First over MCP", startConversation = true, waitSeconds = 60 } }, 90000).ConfigureAwait(false);
                    Garrison.Server.Protocols.McpRunSummary first = Summary(started);
                    Assert.Equal("Succeeded", first.Status, "First MCP turn");
                    string conversationId = Assert.NotNull(first.ConversationId, "The MCP summary carries the conversation");
                    Assert.Equal(1, first.ConversationTurn ?? 0, "Turn 1");

                    JsonElement continued = await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_invoke_agent", arguments = new { tenantId = cluster.Server.TenantId, agent = "conv-mcp", input = "Second over MCP", conversationId = conversationId, waitSeconds = 60 } }, 90000).ConfigureAwait(false);
                    Garrison.Server.Protocols.McpRunSummary second = Summary(continued);
                    Assert.Equal("Succeeded", second.Status, "Second MCP turn");
                    Assert.Equal(conversationId, second.ConversationId, "Same conversation");
                    Assert.True((second.Result ?? String.Empty).StartsWith("[turn 2]", StringComparison.Ordinal), "Resumed over MCP: " + second.Result);
                }
            }
        }

        private static Garrison.Server.Protocols.McpRunSummary Summary(JsonElement result)
        {
            string text = String.Empty;
            foreach (JsonElement part in result.GetProperty("content").EnumerateArray())
            {
                if (part.TryGetProperty("text", out JsonElement value)) text = value.GetString() ?? String.Empty;
            }
            return Serializer.Deserialize<Garrison.Server.Protocols.McpRunSummary>(text) ?? throw new TestAssertionException("Empty MCP summary: " + result.GetRawText());
        }

        private static async Task NodeLostAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 2, token).ConfigureAwait(false))
            {
                Agent agent = await TurnAgentAsync(cluster, "conv-failover", token).ConfigureAwait(false);
                Run first = await TurnAsync(cluster, agent, "Remember the word lantern.", null, true, token).ConfigureAwait(false);
                Succeeded(first, "First turn");
                string conversationId = Assert.NotNull(first.ConversationId, "Conversation");
                WorkerHost holder = cluster.Workers.First(w => w.NodeId == first.LeaseNodeId);
                WorkerHost survivor = cluster.Workers.First(w => w.NodeId != first.LeaseNodeId);

                // The node holding the session goes away and the leader has marked it Lost.
                cluster.Workers.Remove(holder);
                await holder.DisposeAsync().ConfigureAwait(false);
                await cluster.Server.Server.Context.Database.Nodes.SetStatusAsync(first.LeaseNodeId!, NodeStatusEnum.Lost, token).ConfigureAwait(false);

                // A lease long poll the stopped worker left open on the server ends within the worker's LeaseWaitMs
                // (2 s in tests); let it run out so it cannot pick up the next turn for a worker that is gone.
                await Task.Delay(3000, token).ConfigureAwait(false);

                Run second = await TurnAsync(cluster, agent, "Which word?", conversationId, false, token).ConfigureAwait(false);
                Succeeded(second, "Fallback turn");
                Assert.Equal(survivor.NodeId, second.LeaseNodeId, "Another node ran the turn");
                Assert.True(second.ConversationFallbackReason == ConversationFallbackReasonEnum.AffinityNodeLost, "Fallback reason: " + second.ConversationFallbackReason);
                Assert.True(second.ResumeSessionId == null && second.AffinityNodeId == null, "The fallback cleared the session to resume and the affinity");
                string answer = second.ResultText ?? String.Empty;
                Assert.True(answer.StartsWith("[turn 1] Echo: This conversation continues in a new session", StringComparison.Ordinal), "A fresh session got the transcript prompt: " + answer);
                Assert.True(second.TemplateVersions.Any(v => v.TemplateName == "builtin/conversation-fallback"), "The fallback template is recorded on the run");
                List<RunEvent> events = await EventsAsync(cluster, second, token).ConfigureAwait(false);
                Assert.True(events.Any(e => e.Code == "ConversationFallback" && (e.Text ?? String.Empty).Contains("not available", StringComparison.Ordinal)), "ConversationFallback event");

                Conversation conversation = await ConversationAsync(cluster, conversationId, token).ConfigureAwait(false);
                Assert.Equal(1, conversation.FallbackCount, "Fallback counted");
                Assert.True(conversation.LastFallbackReason == ConversationFallbackReasonEnum.AffinityNodeLost && conversation.LastFallbackUtc.HasValue, "Fallback recorded on the conversation");
                Assert.Equal(survivor.NodeId, conversation.AffinityNodeId, "The new node holds the conversation now");
                Assert.Equal(second.SessionId, conversation.SessionId, "The new session is the one to resume");

                Run third = await TurnAsync(cluster, agent, "And again?", conversationId, false, token).ConfigureAwait(false);
                Succeeded(third, "Third turn");
                Assert.Equal(survivor.NodeId, third.LeaseNodeId, "Third turn on the new node");
                Assert.True(third.ConversationFallbackReason == null && third.ResumeSessionId == second.SessionId, "The third turn resumes the new session");
                Assert.True((third.ResultText ?? String.Empty).StartsWith("[turn 2]", StringComparison.Ordinal), "Resumed the new session: " + third.ResultText);
            }
        }

        private static async Task WorkspaceLostAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent agent = await TurnAgentAsync(cluster, "conv-wiped", token).ConfigureAwait(false);
                Run first = await TurnAsync(cluster, agent, "Keep this in mind.", null, true, token).ConfigureAwait(false);
                Succeeded(first, "First turn");
                string conversationId = Assert.NotNull(first.ConversationId, "Conversation");
                string directory = Path.Combine(RunDirectories.ConversationsRoot(cluster.Workers[0].Settings.WorkRoot), conversationId);
                Assert.True(Directory.Exists(directory), "The worker keeps the conversation's directories");
                Directory.Delete(directory, true);

                Run second = await TurnAsync(cluster, agent, "What did I say?", conversationId, false, token).ConfigureAwait(false);
                Succeeded(second, "Requeued fallback turn");
                Assert.True(second.ConversationFallbackReason == ConversationFallbackReasonEnum.WorkspaceLost, "Fallback reason: " + second.ConversationFallbackReason);
                Assert.Equal(1, second.Attempt, "The requeue used no attempt");
                Assert.True((second.ResultText ?? String.Empty).StartsWith("[turn 1] Echo: This conversation continues in a new session", StringComparison.Ordinal), "Fresh session with the transcript: " + second.ResultText);
                List<RunEvent> events = await EventsAsync(cluster, second, token).ConfigureAwait(false);
                Assert.True(events.Any(e => e.Code == "ConversationStateLost"), "The worker reported the lost directories");
                Assert.True(events.Any(e => e.Code == "ConversationFallback"), "The fallback is recorded as an event");
                Conversation conversation = await ConversationAsync(cluster, conversationId, token).ConfigureAwait(false);
                Assert.True(conversation.LastFallbackReason == ConversationFallbackReasonEnum.WorkspaceLost && conversation.FallbackCount == 1, "Fallback recorded on the conversation");
                Assert.True(Directory.Exists(directory), "The fallback turn created fresh directories");
            }
        }

        private static async Task BusyAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent agent = await TurnAgentAsync(cluster, "conv-busy", token, 2500).ConfigureAwait(false);
                Run first = await TurnAsync(cluster, agent, "Quick one", null, true, token).ConfigureAwait(false);
                Succeeded(first, "First turn");
                string conversationId = Assert.NotNull(first.ConversationId, "Conversation");

                TestResponse started = await InvokeRawAsync(cluster.Server.AdminClient, T(cluster), agent.Id, "Slow one", conversationId, false, false, token).ConfigureAwait(false);
                Assert.Equal(202, started.StatusCode, "Second turn accepted: " + started.Body);
                Run slow = Serializer.Deserialize<Run>(started.Body) ?? throw new TestAssertionException("Empty run.");

                TestResponse refused = await InvokeRawAsync(cluster.Server.AdminClient, T(cluster), agent.Id, "Impatient", conversationId, false, false, token).ConfigureAwait(false);
                Assert.Equal(409, refused.StatusCode, "A turn during an unfinished turn is refused: " + refused.Body);
                Assert.True(refused.Body.Contains("ConversationBusy", StringComparison.Ordinal) && refused.Body.Contains(slow.Id, StringComparison.Ordinal), "ConversationBusy names the unfinished run: " + refused.Body);
                Conversation busy = await ConversationAsync(cluster, conversationId, token).ConfigureAwait(false);
                Assert.True(busy.Busy && busy.ActiveRunId == slow.Id, "The conversation reports busy");
                TestResponse deleteRefused = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Delete, T(cluster) + "/conversations/" + conversationId, null, token).ConfigureAwait(false);
                Assert.Equal(409, deleteRefused.StatusCode, "Delete is refused while busy: " + deleteRefused.Body);

                Run finished = await WaitAsync(cluster, slow.Id, token).ConfigureAwait(false);
                Succeeded(finished, "Second turn");
                Run third = await TurnAsync(cluster, agent, "Now it is free", conversationId, false, token).ConfigureAwait(false);
                Succeeded(third, "Third turn after the second finished");
                Assert.Equal(3, third.ConversationTurn, "Turn numbers stay in order");
                Assert.True((third.ResultText ?? String.Empty).StartsWith("[turn 3]", StringComparison.Ordinal), "The refused turn never reached the session: " + third.ResultText);

                // A cancelled turn frees the conversation.
                TestResponse cancelMe = await InvokeRawAsync(cluster.Server.AdminClient, T(cluster), agent.Id, "Cancel me", conversationId, false, false, token).ConfigureAwait(false);
                Run toCancel = Serializer.Deserialize<Run>(cancelMe.Body) ?? throw new TestAssertionException("Empty run.");
                await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, T(cluster) + "/runs/" + toCancel.Id + "/cancel", null, 200, token).ConfigureAwait(false);
                await WaitAsync(cluster, toCancel.Id, token).ConfigureAwait(false);
                Run fifth = await TurnAsync(cluster, agent, "After the cancel", conversationId, false, token).ConfigureAwait(false);
                Succeeded(fifth, "Turn after a cancelled turn");
            }
        }

        private static async Task IsolationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent agent = await TurnAgentAsync(cluster, "conv-isolated", token).ConfigureAwait(false);
                Run first = await TurnAsync(cluster, agent, "Private", null, true, token).ConfigureAwait(false);
                Succeeded(first, "First turn");
                string conversationId = Assert.NotNull(first.ConversationId, "Conversation");

                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Conversations Other " + Guid.NewGuid().ToString("N").Substring(0, 6) }, 201, token).ConfigureAwait(false);
                string otherPath = "/v1.0/api/tenants/" + other.Id;
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Get, otherPath + "/conversations/" + conversationId, null, token).ConfigureAwait(false)).StatusCode, "Read through another tenant is 404");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Get, otherPath + "/conversations/" + conversationId + "/runs", null, token).ConfigureAwait(false)).StatusCode, "Turns through another tenant are 404");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Delete, otherPath + "/conversations/" + conversationId, null, token).ConfigureAwait(false)).StatusCode, "Delete through another tenant is 404");
                EnumerationResult<Conversation> otherList = await HttpTestHelpers.SendAsync<EnumerationResult<Conversation>>(cluster.Server.AdminClient, HttpMethod.Get, otherPath + "/conversations", null, 200, token).ConfigureAwait(false);
                Assert.Equal(0L, otherList.TotalRecords, "The other tenant lists none");

                Agent otherAgent = await HttpTestHelpers.SendAsync<Agent>(cluster.Server.AdminClient, HttpMethod.Post, otherPath + "/agents", new Agent { Name = "conv-isolated" }, 201, token).ConfigureAwait(false);
                TestResponse crossInvoke = await InvokeRawAsync(cluster.Server.AdminClient, otherPath, otherAgent.Id, "Steal", conversationId, false, true, token).ConfigureAwait(false);
                Assert.Equal(404, crossInvoke.StatusCode, "Continuing another tenant's conversation is 404: " + crossInvoke.Body);

                await HttpTestHelpers.SendAsync<User>(cluster.Server.AdminClient, HttpMethod.Post, T(cluster) + "/users", new UserRequest { Email = "conv-norole@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                using (HttpClient noRole = await cluster.Server.UserClientAsync("conv-norole@example.com", "password123", cluster.Server.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(noRole, HttpMethod.Get, T(cluster) + "/conversations", null, token).ConfigureAwait(false)).StatusCode, "Conversation Read is required");
                }
                User viewer = await HttpTestHelpers.SendAsync<User>(cluster.Server.AdminClient, HttpMethod.Post, T(cluster) + "/users", new UserRequest { Email = "conv-viewer@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(cluster.Server.AdminClient, HttpMethod.Post, T(cluster) + "/user-role-assignments", new AssignmentRequest { UserId = viewer.Id, RoleName = "Viewer" }, 201, token).ConfigureAwait(false);
                using (HttpClient client = await cluster.Server.UserClientAsync("conv-viewer@example.com", "password123", cluster.Server.TenantId, token).ConfigureAwait(false))
                {
                    Conversation seen = await HttpTestHelpers.SendAsync<Conversation>(client, HttpMethod.Get, T(cluster) + "/conversations/" + conversationId, null, 200, token).ConfigureAwait(false);
                    Assert.Equal(conversationId, seen.Id, "Viewer reads the conversation");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Delete, T(cluster) + "/conversations/" + conversationId, null, token).ConfigureAwait(false)).StatusCode, "Viewer cannot delete");
                }
            }
        }

        private static async Task DeleteAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent agent = await TurnAgentAsync(cluster, "conv-delete", token).ConfigureAwait(false);
                Run first = await TurnAsync(cluster, agent, "Short lived", null, true, token).ConfigureAwait(false);
                Succeeded(first, "First turn");
                string conversationId = Assert.NotNull(first.ConversationId, "Conversation");

                TestResponse deleted = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Delete, T(cluster) + "/conversations/" + conversationId, null, token).ConfigureAwait(false);
                Assert.Equal(204, deleted.StatusCode, "Deleted: " + deleted.Body);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Get, T(cluster) + "/conversations/" + conversationId, null, token).ConfigureAwait(false)).StatusCode, "Gone");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Delete, T(cluster) + "/conversations/" + conversationId, null, token).ConfigureAwait(false)).StatusCode, "Second delete is 404");
                TestResponse continued = await InvokeRawAsync(cluster.Server.AdminClient, T(cluster), agent.Id, "Anyone?", conversationId, false, true, token).ConfigureAwait(false);
                Assert.Equal(404, continued.StatusCode, "A deleted conversation cannot continue: " + continued.Body);

                Run kept = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Get, T(cluster) + "/runs/" + first.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(conversationId, kept.ConversationId, "The run is kept with its conversation identifier");
                List<AuditRecord> audit = (await cluster.Server.Server.Context.Database.Audit.EnumerateAsync(cluster.Server.TenantId, new EnumerationQuery { MaxResults = 200 }, token).ConfigureAwait(false)).Objects;
                Assert.True(audit.Any(a => a.EventType == AuditEventTypeEnum.ConversationDeleted && a.ResourceId == conversationId), "Delete is audited");
            }
        }

        private static async Task MismatchAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent agent = await TurnAgentAsync(cluster, "conv-owner", token).ConfigureAwait(false);
                Agent stranger = await TurnAgentAsync(cluster, "conv-stranger", token).ConfigureAwait(false);
                Run first = await TurnAsync(cluster, agent, "Mine", null, true, token).ConfigureAwait(false);
                Succeeded(first, "First turn");
                string conversationId = Assert.NotNull(first.ConversationId, "Conversation");

                TestResponse unknown = await InvokeRawAsync(cluster.Server.AdminClient, T(cluster), agent.Id, "x", "cnv_doesnotexist", false, true, token).ConfigureAwait(false);
                Assert.Equal(404, unknown.StatusCode, "Unknown conversation: " + unknown.Body);
                TestResponse wrongAgent = await InvokeRawAsync(cluster.Server.AdminClient, T(cluster), stranger.Id, "x", conversationId, false, true, token).ConfigureAwait(false);
                Assert.True(wrongAgent.StatusCode == 409 && wrongAgent.Body.Contains("ConversationAgentMismatch", StringComparison.Ordinal), "Another agent's conversation: " + wrongAgent.Body);

                Deployment second = new Deployment();
                second.AgentId = agent.Id;
                second.Name = "conv-owner-second";
                second.HarnessProfileId = Assert.NotNull(await cluster.Server.Server.Context.Database.HarnessProfiles.ReadByNameAsync(cluster.Server.TenantId, "builtin/fake", token).ConfigureAwait(false), "Fake profile").Id;
                second.Weight = 0;
                Deployment created = await HttpTestHelpers.SendAsync<Deployment>(cluster.Server.AdminClient, HttpMethod.Post, T(cluster) + "/deployments", second, 201, token).ConfigureAwait(false);
                InvokeRequest pinned = new InvokeRequest { Input = "x", ConversationId = conversationId, DeploymentId = created.Id, Wait = true, WaitSeconds = 30 };
                TestResponse wrongDeployment = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Post, T(cluster) + "/agents/" + agent.Id + "/invoke", pinned, token).ConfigureAwait(false);
                Assert.True(wrongDeployment.StatusCode == 409 && wrongDeployment.Body.Contains("ConversationDeploymentMismatch", StringComparison.Ordinal), "Another deployment: " + wrongDeployment.Body);

                Run again = await TurnAsync(cluster, agent, "Still mine", conversationId, false, token).ConfigureAwait(false);
                Succeeded(again, "The refused requests changed nothing");
                Assert.Equal(2, again.ConversationTurn, "Turn 2");
                Assert.Equal(first.DeploymentId, again.DeploymentId, "Pinned to the first turn's deployment");
            }
        }

        #endregion
    }
}
