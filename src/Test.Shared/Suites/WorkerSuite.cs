namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Harnesses.Probing;
    using Garrison.Worker.Execution;
    using Garrison.Worker.Hosting;
    using Garrison.Worker.Reporting;
    using Garrison.Worker.Settings;
    using SyslogLogging;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Worker suites: the process executor end to end with the fake harness, and the worker host's protocol loops
    /// against an in-process fake control plane.
    /// </summary>
    public static class WorkerSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestCaseDescriptor> executor = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("worker-executor", "success-claude", "Executor: fake harness success in Claude format", ct => FormatSuccessAsync("claude", OutputParserEnum.ClaudeStreamJson, ct)),
                new TestCaseDescriptor("worker-executor", "success-codex", "Executor: fake harness success in Codex format", ct => FormatSuccessAsync("codex", OutputParserEnum.CodexJsonl, ct)),
                new TestCaseDescriptor("worker-executor", "success-plain", "Executor: fake harness success in plain format", ct => FormatSuccessAsync("plain", OutputParserEnum.PlainText, ct)),
                new TestCaseDescriptor("worker-executor", "codex-app-server-stream", "Executor: Codex app-server delivery streams deltas with real TTFT and streaming time, then closes stdin", AppServerStreamAsync),
                new TestCaseDescriptor("worker-executor", "codex-app-server-login-schema", "Executor: Codex app-server delivery logs in with the API key from the environment and sends the output schema; the key is scrubbed", AppServerLoginSchemaAsync),
                new TestCaseDescriptor("worker-executor", "codex-app-server-approval", "Executor: Codex app-server approval requests are declined and reported", AppServerApprovalAsync),
                new TestCaseDescriptor("worker-executor", "codex-app-server-failures", "Executor: Codex app-server failed turn, unknown resume thread, and a hung turn hitting the deadline", AppServerFailuresAsync),
                new TestCaseDescriptor("worker-executor", "failure", "Executor: harness failure maps to HarnessFailed", FailureAsync),
                new TestCaseDescriptor("worker-executor", "not-installed", "Executor: missing executable maps to NotInstalled", NotInstalledAsync),
                new TestCaseDescriptor("worker-executor", "timeout", "Executor: deadline kills a hung harness", TimeoutAsync),
                new TestCaseDescriptor("worker-executor", "output-limit", "Executor: stdout limit kills the harness", OutputLimitAsync),
                new TestCaseDescriptor("worker-executor", "cancellation", "Executor: cancellation stops the harness", CancellationAsync),
                new TestCaseDescriptor("worker-executor", "placeholders", "Executor: worker-side placeholders resolve in args, files, stdin, and result file", PlaceholdersAsync),
                new TestCaseDescriptor("worker-executor", "path-traversal", "Executor: files escaping their base directory are rejected", PathTraversalAsync),
                new TestCaseDescriptor("worker-executor", "scrubbing", "Executor: secret values are scrubbed from stderr, result, and events", ScrubbingAsync),
                new TestCaseDescriptor("worker-executor", "environment", "Executor: environment starts empty plus allowlist and spec values; HOME is isolated", EnvironmentAsync),
                new TestCaseDescriptor("worker-executor", "retention", "Executor: workspace retention policies and secret directory cleanup", RetentionAsync),
                new TestCaseDescriptor("worker-executor", "tool-call-count", "Executor: tool call events are counted", ToolCallCountAsync),
                new TestCaseDescriptor("worker-executor", "timing-without-output", "Executor: timing on a killed harness and on a harness that never started", TimingOnFailureAsync),
                new TestCaseDescriptor("worker-executor", "mcp-preflight", "Executor: unreachable required MCP server fails before launch", McpPreflightAsync),
                new TestCaseDescriptor("worker-executor", "mux-probe-version", "Probe: Mux 1.3.0 --version output (\"mux v1.3.0\") reports version 1.3.0", MuxProbeVersionAsync)
            };

            List<TestCaseDescriptor> host = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("worker-host", "lease-execute-complete", "Host: registers, leases, executes, ships ordered events, completes", HostRoundTripAsync),
                new TestCaseDescriptor("worker-host", "event-buffer-replay", "Host: events survive control-plane failures and replay with original sequences", HostBufferReplayAsync),
                new TestCaseDescriptor("worker-host", "cancel-from-heartbeat", "Host: heartbeat cancellation stops the run and reports Cancelled", HostCancelAsync),
                new TestCaseDescriptor("worker-host", "stale-lease", "Host: a 409 stale lease kills the harness and skips completion", HostStaleAsync),
                new TestCaseDescriptor("worker-host", "settings-environment", "Settings: GARRISON_WORKER_* overrides and clamping", SettingsAsync)
            };

            return new List<TestSuiteDescriptor>
            {
                new TestSuiteDescriptor("worker-executor", "Worker process executor", executor),
                new TestSuiteDescriptor("worker-host", "Worker host protocol loops", host)
            };
        }

        #endregion

        #region Private-Methods

        private static string FakeHarnessDll()
        {
            string path = Path.Combine(AppContext.BaseDirectory, "garrison-fake-harness.dll");
            if (!File.Exists(path)) throw new TestAssertionException("garrison-fake-harness.dll not found next to the test runner at " + path + ". The test project must reference Garrison.FakeHarness.");
            return path;
        }

        private static string DotnetHost()
        {
            string? process = Environment.ProcessPath;
            if (!String.IsNullOrEmpty(process) && Path.GetFileNameWithoutExtension(process).Equals("dotnet", StringComparison.OrdinalIgnoreCase)) return process;
            return "dotnet";
        }

        private static string WorkRoot()
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-worker-tests");
            Directory.CreateDirectory(root);
            return root;
        }

        private static ProcessRunExecutor Executor()
        {
            ExecutorOptions options = new ExecutorOptions();
            options.WorkRoot = WorkRoot();
            options.EnvironmentAllowlist = new List<string> { "PATH", "DOTNET_ROOT", "TMPDIR", "LANG" };
            options.McpPreflightTimeoutMs = 3000;
            return new ProcessRunExecutor(options);
        }

        private static RunAssignment Assignment(string format, OutputParserEnum parser, string prompt, params string[] extraArguments)
        {
            ExecutionSpec spec = new ExecutionSpec();
            spec.RunId = "run_test_" + Guid.NewGuid().ToString("N").Substring(0, 12);
            spec.TenantId = "ten_test";
            spec.AgentName = "fake";
            spec.HarnessType = HarnessTypeEnum.Generic;
            spec.Executable = DotnetHost();
            spec.Arguments = new List<string> { FakeHarnessDll(), "--format", format };
            spec.Arguments.AddRange(extraArguments);
            spec.Stdin = prompt;
            spec.Parser = parser;
            spec.TimeoutSeconds = 60;
            spec.KillGraceSeconds = 1;

            RunAssignment assignment = new RunAssignment();
            assignment.RunId = spec.RunId;
            assignment.Epoch = 1;
            assignment.Spec = spec;
            return assignment;
        }

        private static void AssertSequences(List<RunEventReport> events)
        {
            for (int i = 0; i < events.Count; i++) Assert.Equal((long)(i + 1), events[i].Sequence, "Event sequence " + i);
        }

        private static async Task FormatSuccessAsync(string format, OutputParserEnum parser, CancellationToken token)
        {
            RunAssignment assignment = Assignment(format, parser, "hello garrison");
            InMemoryRunReporter reporter = new InMemoryRunReporter();
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Succeeded, complete.Status, "Status (" + complete.ErrorMessage + ")");
            Assert.Equal(RunOutcomeEnum.Succeeded, complete.Outcome, "Outcome");
            Assert.Equal("Echo: hello garrison", complete.ResultText, "Result text");
            Assert.Equal(0, complete.ExitCode, "Exit code");
            Assert.True(reporter.Started && reporter.ProcessId.HasValue, "Start should be reported with a process id.");
            List<RunEventReport> events = reporter.Events();
            AssertSequences(events);
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Lifecycle), "Lifecycle events expected.");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.AssistantText), "Assistant text expected.");
            if (parser != OutputParserEnum.PlainText) Assert.True(complete.OutputTokens > 0, "Usage expected.");

            long ttft = complete.TimeToFirstTokenMs ?? -1;
            long streaming = complete.StreamingMs ?? -1;
            long execution = complete.ExecutionMs ?? -1;
            Assert.True(ttft > 0, "TTFT should be measured (was " + ttft + ").");
            Assert.True(streaming >= 0, "Streaming should be measured (was " + streaming + ").");
            Assert.True(execution >= ttft + streaming, "Execution (" + execution + ") covers TTFT (" + ttft + ") plus streaming (" + streaming + ").");
            Assert.True(complete.FirstTokenUtc.HasValue && complete.LastTokenUtc.HasValue && complete.LastTokenUtc.Value >= complete.FirstTokenUtc.Value, "First and last token times.");
            Assert.Equal(0, complete.ToolCallCount, "No tool calls");
            if (parser != OutputParserEnum.PlainText)
            {
                Assert.True(streaming >= 15, "The fake harness pauses after thinking, so streaming is measurable (was " + streaming + ").");
                Assert.Equal(2L, complete.ReasoningTokens, "Reasoning tokens reported by the fake harness");
            }
        }

        private static RunAssignment AppServerAssignment(string prompt, params string[] extraArguments)
        {
            RunAssignment assignment = Assignment("codex-app-server", OutputParserEnum.CodexAppServer, prompt, extraArguments);
            ExecutionSpec spec = assignment.Spec!;
            spec.HarnessType = HarnessTypeEnum.Codex;
            spec.AppServer = new ExecutionAppServer();
            return assignment;
        }

        private static async Task AppServerStreamAsync(CancellationToken token)
        {
            RunAssignment assignment = AppServerAssignment("hello streaming garrison world", "--delay-ms", "15", "--tool-calls", "1");
            InMemoryRunReporter reporter = new InMemoryRunReporter();
            Stopwatch elapsed = Stopwatch.StartNew();
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Succeeded, complete.Status, "Status (" + complete.ErrorMessage + "; stderr " + complete.StderrTail + ")");
            Assert.Equal("Echo: hello streaming garrison world", complete.ResultText, "Result text");
            Assert.Equal(0, complete.ExitCode, "The app-server exits 0 once stdin closes");
            Assert.True(elapsed.Elapsed < TimeSpan.FromSeconds(30), "The run ends when the turn completes, not at the deadline");

            List<RunEventReport> events = reporter.Events();
            AssertSequences(events);
            List<RunEventReport> text = events.Where(e => e.EventType == RunEventTypeEnum.AssistantText).ToList();
            Assert.Equal(5, text.Count, "One AssistantText event per streamed delta");
            Assert.Equal("Echo: hello streaming garrison world", String.Concat(text.Select(e => e.Text)), "Deltas add up to the answer");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Thinking), "Reasoning delta");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Result), "Result");
            Assert.Equal(1, complete.ToolCallCount, "Command item counted as a tool call");

            Assert.True(!String.IsNullOrEmpty(complete.SessionId), "Thread id recorded as the session id");
            Assert.Equal("fake-app-server-model", complete.ServedModel, "Served model from thread/start");
            Assert.Equal(100L, complete.InputTokens, "Input tokens");
            Assert.Equal(40L, complete.CachedTokens, "Cached tokens");
            Assert.Equal(2L, complete.ReasoningTokens, "Reasoning tokens");
            Assert.Equal(7L, complete.OutputTokens, "Output tokens (five chunks plus two reasoning)");

            long ttft = complete.TimeToFirstTokenMs ?? -1;
            long streaming = complete.StreamingMs ?? -1;
            Assert.True(ttft > 0, "TTFT measured (was " + ttft + ")");
            Assert.True(streaming >= 60, "Streaming covers the pauses between deltas (was " + streaming + ")");
            Assert.True((complete.ExecutionMs ?? -1) >= ttft + streaming, "Execution covers TTFT plus streaming");
            Assert.True((complete.StderrTail ?? String.Empty).Contains("approval policy \"never\"", StringComparison.Ordinal), "Approval policy never sent on thread/start: " + complete.StderrTail);
        }

        private static async Task AppServerLoginSchemaAsync(CancellationToken token)
        {
            RunAssignment assignment = AppServerAssignment("structured please", "--answer", "{\"answer\":\"sk-fake-app-server-key-1234\"}");
            ExecutionSpec spec = assignment.Spec!;
            spec.Environment.Add(new ExecutionEnvironmentVariable { Name = "CODEX_API_KEY", Value = "sk-fake-app-server-key-1234", IsSecret = true });
            spec.AppServer!.OutputSchemaJson = "{\"type\":\"object\",\"properties\":{\"answer\":{\"type\":\"string\"}}}";
            InMemoryRunReporter reporter = new InMemoryRunReporter();
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Succeeded, complete.Status, "Status (" + complete.ErrorMessage + ")");
            string stderr = complete.StderrTail ?? String.Empty;
            Assert.True(stderr.Contains("api key login", StringComparison.Ordinal), "Logged in with the API key: " + stderr);
            Assert.True(stderr.Contains("output schema received", StringComparison.Ordinal), "Output schema sent on turn/start: " + stderr);
            Assert.True((complete.ResultText ?? String.Empty).Contains("[REDACTED]", StringComparison.Ordinal), "Secret scrubbed from the result: " + complete.ResultText);
            Assert.True(reporter.Events().All(e => (e.Text ?? String.Empty).IndexOf("sk-fake-app-server-key-1234", StringComparison.Ordinal) < 0), "Secret scrubbed from events");
        }

        private static async Task AppServerApprovalAsync(CancellationToken token)
        {
            RunAssignment assignment = AppServerAssignment("needs approval", "--request-approval");
            InMemoryRunReporter reporter = new InMemoryRunReporter();
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Succeeded, complete.Status, "Status (" + complete.ErrorMessage + ")");
            Assert.True((complete.StderrTail ?? String.Empty).Contains("approval answered \"decline\"", StringComparison.Ordinal), "Approval declined: " + complete.StderrTail);
            List<RunEventReport> events = reporter.Events();
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Warning && (e.Text ?? String.Empty).Contains("requestApproval", StringComparison.Ordinal)), "The approval request is visible");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.ToolResult && e.ToolCallId == "call_approval" && e.Success == false), "The declined command failed");
        }

        private static async Task AppServerFailuresAsync(CancellationToken token)
        {
            RunCompleteRequest failed = await Executor().ExecuteAsync(AppServerAssignment("fail please", "--fail"), new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Failed, failed.Status, "Failed turn status");
            Assert.Equal(RunOutcomeEnum.HarnessFailed, failed.Outcome, "Failed turn outcome");
            Assert.Equal("Fake failure.", failed.ErrorMessage, "Failed turn message");

            RunAssignment resume = AppServerAssignment("resume me");
            resume.Spec!.AppServer!.ResumeThreadId = "thr-does-not-exist";
            RunCompleteRequest missing = await Executor().ExecuteAsync(resume, new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Failed, missing.Status, "Unknown thread status");
            Assert.True((missing.ErrorMessage ?? String.Empty).Contains("no rollout found", StringComparison.Ordinal), "Unknown thread message: " + missing.ErrorMessage);

            RunAssignment hang = AppServerAssignment("hang", "--hang");
            hang.Spec!.TimeoutSeconds = 3;
            Stopwatch elapsed = Stopwatch.StartNew();
            RunCompleteRequest timedOut = await Executor().ExecuteAsync(hang, new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.TimedOut, timedOut.Status, "Hung turn status");
            Assert.True(elapsed.Elapsed < TimeSpan.FromSeconds(20), "The driver does not outlive the deadline (took " + elapsed.Elapsed + ")");
        }

        private static async Task ToolCallCountAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "count my tools", "--tool-calls", "3");
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Succeeded, complete.Status, "Status (" + complete.ErrorMessage + ")");
            Assert.Equal(3, complete.ToolCallCount, "Tool calls counted by the worker");
            Assert.True(complete.ExecutionMs.HasValue, "Execution measured");
        }

        private static async Task TimingOnFailureAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x", "--hang");
            assignment.Spec.TimeoutSeconds = 2;
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.TimedOut, complete.Status, "Status");
            Assert.True(complete.TimeToFirstTokenMs == null, "A harness that never produced model output has no TTFT.");
            Assert.True((complete.ExecutionMs ?? 0) >= 1500, "Execution covers the time until the harness was killed (was " + complete.ExecutionMs + ").");

            RunAssignment missing = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x");
            missing.Spec.Executable = "garrison-executable-that-does-not-exist";
            RunCompleteRequest notInstalled = await Executor().ExecuteAsync(missing, new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.True(notInstalled.ExecutionMs == null && notInstalled.TimeToFirstTokenMs == null, "No timing when the process never started.");
        }

        private static async Task FailureAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x", "--fail");
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Failed, complete.Status, "Status");
            Assert.Equal(RunOutcomeEnum.HarnessFailed, complete.Outcome, "Outcome");
            Assert.Equal(1, complete.ExitCode, "Exit code");
        }

        private static async Task NotInstalledAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x");
            assignment.Spec.Executable = "garrison-executable-that-does-not-exist";
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.Equal(RunOutcomeEnum.NotInstalled, complete.Outcome, "Outcome");
        }

        private static async Task TimeoutAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x", "--hang");
            assignment.Spec.TimeoutSeconds = 2;
            Stopwatch watch = Stopwatch.StartNew();
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.TimedOut, complete.Status, "Status");
            Assert.True(watch.Elapsed.TotalSeconds < 20, "Timeout should be enforced promptly (took " + watch.Elapsed.TotalSeconds + "s).");
        }

        private static async Task OutputLimitAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("plain", OutputParserEnum.PlainText, "x", "--large-output", "5000");
            assignment.Spec.MaxOutputBytes = 20000;
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.Equal(RunOutcomeEnum.OutputLimitExceeded, complete.Outcome, "Outcome");
        }

        private static async Task CancellationAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x", "--hang");
            using (CancellationTokenSource cancel = new CancellationTokenSource(TimeSpan.FromSeconds(2)))
            {
                RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, new InMemoryRunReporter(), cancel.Token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Cancelled, complete.Status, "Status");
                Assert.Equal(RunOutcomeEnum.Cancelled, complete.Outcome, "Outcome");
            }
        }

        private static async Task PlaceholdersAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("mux", OutputParserEnum.MuxJsonl, "$GARRISON_HOME_DIR", "--output-last-message", "$GARRISON_CONFIG_DIR/out/last.txt");
            assignment.Spec.ResultSource = ResultSourceEnum.LastMessageFile;
            assignment.Spec.ResultFileName = "$GARRISON_CONFIG_DIR/out/last.txt";
            assignment.Spec.Workspace.Retention = WorkspaceRetentionEnum.Keep;
            ExecutionFile file = new ExecutionFile();
            file.BaseDirectory = FileBaseDirectoryEnum.Workspace;
            file.Path = "notes/check.txt";
            file.Content = "workspace=$GARRISON_WORKSPACE_DIR";
            assignment.Spec.Files.Add(file);

            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, new InMemoryRunReporter(), token).ConfigureAwait(false);
            RunDirectories directories = new RunDirectories(WorkRoot(), assignment.RunId);
            Assert.Equal(RunStatusEnum.Succeeded, complete.Status, "Status (" + complete.ErrorMessage + ")");
            Assert.Equal("Echo: " + directories.Home, complete.ResultText, "Stdin placeholder resolved and result read from the LastMessageFile");
            Assert.Equal("workspace=" + directories.Workspace, File.ReadAllText(Path.Combine(directories.Workspace, "notes", "check.txt")), "File content placeholder");
            Directory.Delete(directories.Root, true);
        }

        private static async Task PathTraversalAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x");
            ExecutionFile file = new ExecutionFile();
            file.BaseDirectory = FileBaseDirectoryEnum.Config;
            file.Path = "../../escaped-" + assignment.RunId + ".txt";
            file.Content = "nope";
            assignment.Spec.Files.Add(file);
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.Equal(RunOutcomeEnum.WorkspaceFailed, complete.Outcome, "Outcome");
            Assert.True(!File.Exists(Path.Combine(WorkRoot(), "escaped-" + assignment.RunId + ".txt")), "Escaped file must not be written.");
        }

        private static async Task ScrubbingAsync(CancellationToken token)
        {
            string secret = "sk-garrison-test-secret-98765";
            RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "prompt with " + secret, "--fail", "--stderr", "auth token " + secret);
            ExecutionEnvironmentVariable variable = new ExecutionEnvironmentVariable();
            variable.Name = "FAKE_API_KEY";
            variable.Value = secret;
            variable.IsSecret = true;
            assignment.Spec.Environment.Add(variable);
            InMemoryRunReporter reporter = new InMemoryRunReporter();
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.True(!(complete.StderrTail ?? String.Empty).Contains(secret), "Stderr tail must be scrubbed.");
            Assert.True((complete.StderrTail ?? String.Empty).Contains("[REDACTED]"), "Stderr tail should show the redaction.");
            Assert.True(!(complete.ResultText ?? String.Empty).Contains(secret), "Result text must be scrubbed.");
            Assert.True(!reporter.Events().Any(e => (e.Text ?? String.Empty).Contains(secret) || (e.RawEventJson ?? String.Empty).Contains(secret)), "Events must be scrubbed.");
        }

        private static async Task EnvironmentAsync(CancellationToken token)
        {
            Environment.SetEnvironmentVariable("GARRISON_TEST_LEAK", "leaked");
            try
            {
                RunAssignment assignment = Assignment("plain", OutputParserEnum.PlainText, String.Empty);
                assignment.Spec.Executable = "/usr/bin/env";
                assignment.Spec.Arguments = new List<string>();
                assignment.Spec.IsolateHome = true;
                ExecutionEnvironmentVariable variable = new ExecutionEnvironmentVariable();
                variable.Name = "SPEC_VALUE";
                variable.Value = "home=$GARRISON_HOME_DIR";
                assignment.Spec.Environment.Add(variable);
                if (!File.Exists("/usr/bin/env")) return;

                RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, new InMemoryRunReporter(), token).ConfigureAwait(false);
                string output = complete.ResultText ?? String.Empty;
                RunDirectories directories = new RunDirectories(WorkRoot(), assignment.RunId);
                Assert.True(!output.Contains("GARRISON_TEST_LEAK"), "Non-allowlisted variables must not leak.");
                Assert.True(output.Contains("SPEC_VALUE=home=" + directories.Home), "Spec values with placeholders must be set.");
                Assert.True(output.Contains("HOME=" + directories.Home), "HOME must be isolated.");
                Assert.True(output.Contains("CODEX_HOME=" + Path.Combine(directories.Home, ".codex")), "CODEX_HOME must be isolated.");
                Assert.True(output.Contains("GARRISON_RUN_ID=" + assignment.RunId), "Run id must be exported.");
                Assert.True(!output.Contains("CLAUDE_CONFIG_DIR"), "CLAUDE_CONFIG_DIR is not set by default.");
            }
            finally
            {
                Environment.SetEnvironmentVariable("GARRISON_TEST_LEAK", null);
            }
        }

        private static async Task RetentionAsync(CancellationToken token)
        {
            RunAssignment kept = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x", "--fail");
            kept.Spec.Workspace.Retention = WorkspaceRetentionEnum.KeepOnFailure;
            ExecutionWorkspaceFile seeded = new ExecutionWorkspaceFile();
            seeded.Path = "seed/readme.md";
            seeded.Content = "seeded";
            kept.Spec.Workspace.Kind = WorkspaceKindEnum.Seeded;
            kept.Spec.Workspace.Files.Add(seeded);
            await Executor().ExecuteAsync(kept, new InMemoryRunReporter(), token).ConfigureAwait(false);
            RunDirectories keptDirs = new RunDirectories(WorkRoot(), kept.RunId);
            Assert.Equal("seeded", File.ReadAllText(Path.Combine(keptDirs.Workspace, "seed", "readme.md")), "Seeded file kept on failure");
            Assert.True(!Directory.Exists(keptDirs.Config) && !Directory.Exists(keptDirs.Home), "Config and home are always removed.");
            Directory.Delete(keptDirs.Root, true);

            RunAssignment deleted = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x");
            deleted.Spec.Workspace.Retention = WorkspaceRetentionEnum.KeepOnFailure;
            await Executor().ExecuteAsync(deleted, new InMemoryRunReporter(), token).ConfigureAwait(false);
            Assert.True(!Directory.Exists(new RunDirectories(WorkRoot(), deleted.RunId).Root), "Successful run workspace removed under KeepOnFailure.");
        }

        private static async Task McpPreflightAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x");
            ExecutionMcpCheck check = new ExecutionMcpCheck();
            check.Name = "garrison";
            check.Url = "http://127.0.0.1:" + TestServerHost.FreePort();
            check.RequiredTools.Add("garrison_invoke_agent");
            assignment.Spec.McpPreflight.Add(check);
            InMemoryRunReporter reporter = new InMemoryRunReporter();
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunOutcomeEnum.McpPreflightFailed, complete.Outcome, "Outcome");
            Assert.True(!reporter.Started, "The harness must not launch after a failed pre-flight.");
        }

        private static WorkerSettings HostSettings(FakeNodeServer server)
        {
            WorkerSettings settings = new WorkerSettings();
            settings.Telemetry.Enabled = false;
            settings.ServerUrl = server.BaseUrl;
            settings.NodeName = "test-worker-" + Guid.NewGuid().ToString("N").Substring(0, 6);
            settings.WorkRoot = WorkRoot();
            settings.MaxConcurrentRuns = 2;
            settings.EventFlushIntervalMs = 50;
            settings.CompletionRetrySeconds = 30;
            settings.DrainTimeoutSeconds = 5;
            settings.ProbeIntervalSeconds = 0;
            settings.EnvironmentAllowlist = new List<string> { "PATH", "DOTNET_ROOT", "TMPDIR" };
            HarnessProbeSettings probe = new HarnessProbeSettings();
            probe.HarnessType = HarnessTypeEnum.Generic;
            probe.Executable = DotnetHost();
            probe.Arguments = new List<string> { FakeHarnessDll(), "--version" };
            probe.Label = "fake";
            settings.Probes = new List<HarnessProbeSettings> { probe };
            settings.Logging.ConsoleLogging = Environment.GetEnvironmentVariable("GARRISON_TEST_LOGS") == "true";
            return settings;
        }

        private static async Task MuxProbeVersionAsync(CancellationToken token)
        {
            HarnessProbeSettings mux = WorkerSettings.DefaultProbes().Single(p => p.HarnessType == HarnessTypeEnum.Mux);
            Assert.Equal("mux", mux.Executable, "Default Mux probe executable");
            Assert.Equal("--version", mux.Arguments.Single(), "Default Mux probe argument");
            if (OperatingSystem.IsWindows()) return;

            // Mux 1.3.0 prints "mux v1.3.0"; the probe must report the bare version.
            HarnessProbe probe = new HarnessProbe();
            NodeCapabilityReport report = await probe.ProbeAsync(HarnessTypeEnum.Mux, "/bin/sh", new List<string> { "-c", "echo mux v1.3.0" }, new Dictionary<string, string>(), token).ConfigureAwait(false);
            Assert.True(report.Available, "Probe available: " + report.Detail);
            Assert.Equal("1.3.0", report.Version, "Probe version");
        }

        private static LoggingModule Quiet(WorkerSettings settings)
        {
            LoggingModule logging = new LoggingModule();
            logging.Settings.EnableConsole = settings.Logging.ConsoleLogging;
            return logging;
        }

        private static async Task HostRoundTripAsync(CancellationToken token)
        {
            using (FakeNodeServer server = new FakeNodeServer())
            {
                WorkerSettings settings = HostSettings(server);
                await using (WorkerHost host = new WorkerHost(settings, Quiet(settings)))
                {
                    await host.StartAsync(false).ConfigureAwait(false);
                    RunAssignment assignment = Assignment("codex", OutputParserEnum.CodexJsonl, "round trip", "--delay-ms", "10");
                    server.Pending.Enqueue(assignment);

                    RunCompleteRequest complete = await server.WaitForCompletionAsync(assignment.RunId, TimeSpan.FromSeconds(60)).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, complete.Status, "Status (" + complete.ErrorMessage + ")");
                    Assert.Equal("nod_fake", complete.NodeId, "Node id");
                    Assert.Equal(1L, complete.Epoch, "Epoch");
                    Assert.Equal("Echo: round trip", complete.ResultText, "Result");
                    Assert.True(server.Started.ContainsKey(assignment.RunId), "Started report expected.");

                    NodeRegisterRequest registration = Assert.NotNull(server.Registrations.FirstOrDefault(), "Registration");
                    Assert.True(registration.Capabilities.Any(c => c.Available && c.Version == "1.0.0"), "Fake harness capability reported.");
                    Assert.Equal("true", registration.Labels.GetValueOrDefault("garrison.io/harness-fake"), "Capability label");

                    List<RunEventReport> events = server.Events.ToList();
                    AssertSequences(events);
                    Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Result), "Result event delivered before completion.");
                    Assert.True(host.Health().Ready, "Host should be ready.");
                }
            }
        }

        private static async Task HostBufferReplayAsync(CancellationToken token)
        {
            using (FakeNodeServer server = new FakeNodeServer())
            {
                server.FailNextEventCalls(3);
                WorkerSettings settings = HostSettings(server);
                await using (WorkerHost host = new WorkerHost(settings, Quiet(settings)))
                {
                    await host.StartAsync(false).ConfigureAwait(false);
                    RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "buffered events", "--delay-ms", "20");
                    server.Pending.Enqueue(assignment);
                    RunCompleteRequest complete = await server.WaitForCompletionAsync(assignment.RunId, TimeSpan.FromSeconds(90)).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, complete.Status, "Status");
                    List<RunEventReport> events = server.Events.ToList();
                    AssertSequences(events);
                    Assert.Equal(events.Count, events.Select(e => e.Sequence).Distinct().Count(), "No duplicates");
                }
            }
        }

        private static async Task HostCancelAsync(CancellationToken token)
        {
            using (FakeNodeServer server = new FakeNodeServer())
            {
                WorkerSettings settings = HostSettings(server);
                await using (WorkerHost host = new WorkerHost(settings, Quiet(settings)))
                {
                    await host.StartAsync(false).ConfigureAwait(false);
                    RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x", "--hang");
                    server.Pending.Enqueue(assignment);
                    DateTime deadline = DateTime.UtcNow.AddSeconds(30);
                    while (!server.Started.ContainsKey(assignment.RunId) && DateTime.UtcNow < deadline) await Task.Delay(100, token).ConfigureAwait(false);
                    server.CancelRequests.Enqueue(assignment.RunId);
                    RunCompleteRequest complete = await server.WaitForCompletionAsync(assignment.RunId, TimeSpan.FromSeconds(30)).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Cancelled, complete.Status, "Status");
                }
            }
        }

        private static async Task HostStaleAsync(CancellationToken token)
        {
            using (FakeNodeServer server = new FakeNodeServer())
            {
                WorkerSettings settings = HostSettings(server);
                await using (WorkerHost host = new WorkerHost(settings, Quiet(settings)))
                {
                    await host.StartAsync(false).ConfigureAwait(false);
                    RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "x", "--hang");
                    server.StaleRuns[assignment.RunId] = true;
                    server.Pending.Enqueue(assignment);
                    DateTime deadline = DateTime.UtcNow.AddSeconds(30);
                    while (host.CompletedRuns == 0 && DateTime.UtcNow < deadline) await Task.Delay(100, token).ConfigureAwait(false);
                    Assert.Equal(1L, host.CompletedRuns, "The stale run should end promptly.");
                    Assert.True(!server.Completions.ContainsKey(assignment.RunId), "No completion is reported for a stale lease.");
                }
            }
        }

        private static Task SettingsAsync(CancellationToken token)
        {
            Environment.SetEnvironmentVariable("GARRISON_WORKER_MAX_CONCURRENT_RUNS", "9999");
            Environment.SetEnvironmentVariable("GARRISON_WORKER_LABELS", "zone=a, gpu = true");
            Environment.SetEnvironmentVariable("GARRISON_WORKER_NODE_NAME", "post-7");
            try
            {
                WorkerSettings settings = new WorkerSettings();
            settings.Telemetry.Enabled = false;
                settings.Telemetry.Enabled = false;
                settings.ApplyEnvironment();
                Assert.Equal(256, settings.MaxConcurrentRuns, "Clamped capacity");
                Assert.Equal("a", settings.Labels["zone"], "Label zone");
                Assert.Equal("true", settings.Labels["gpu"], "Label gpu");
                Assert.Equal("default", settings.Labels["garrison.io/pool"], "Default label kept");
                Assert.Equal("post-7", settings.EffectiveNodeName, "Node name");
                Assert.Equal("http://127.0.0.1:8700", settings.ServerUrl, "Default server URL uses 127.0.0.1");
            }
            finally
            {
                Environment.SetEnvironmentVariable("GARRISON_WORKER_MAX_CONCURRENT_RUNS", null);
                Environment.SetEnvironmentVariable("GARRISON_WORKER_LABELS", null);
                Environment.SetEnvironmentVariable("GARRISON_WORKER_NODE_NAME", null);
            }
            return Task.CompletedTask;
        }

        #endregion
    }
}
