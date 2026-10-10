namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Runtime.InteropServices;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Harnesses;
    using Garrison.Harnesses.Execution;
    using Garrison.Harnesses.Parsers;
    using Garrison.Worker.Execution;
    using Garrison.Worker.Reporting;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Run guards (P3.15): the repetition, assistant text size, and no-progress detectors against a real degenerate
    /// loop and against legitimate output, and the worker's stop path (SIGTERM, SIGKILL after the grace period, process
    /// tree) with the fake harness.
    /// </summary>
    public static class RunGuardSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestCaseDescriptor> detector = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("run-guard", "fixture-loop", "Repetition: the recorded gpt-oss loop trips after the loop starts and never during the system prompt text", FixtureLoopAsync),
                new TestCaseDescriptor("run-guard", "fixture-through-parser", "Repetition: the recorded loop replayed as Mux JSONL through the parser trips the same way", FixtureThroughParserAsync),
                new TestCaseDescriptor("run-guard", "fixture-guard-off", "Repetition: with repetitionGuard off the recorded loop does not trip", FixtureGuardOffAsync),
                new TestCaseDescriptor("run-guard", "markdown", "Repetition: Markdown with lists, tables, rules, and code does not trip", MarkdownAsync),
                new TestCaseDescriptor("run-guard", "long-output", "Size: 190,000 characters of legitimate text stay under the cap; passing the cap trips OutputLimitExceeded", LongOutputAsync),
                new TestCaseDescriptor("run-guard", "whitespace", "Repetition: whitespace-only streams trip", WhitespaceAsync),
                new TestCaseDescriptor("run-guard", "units", "Repetition: a 40-character unit trips; tool calls between repeated sentences reset the window", UnitsAsync),
                new TestCaseDescriptor("run-guard", "no-progress", "No progress: open tool calls pause the clock; text, thinking, and results are progress; silence trips", NoProgressAsync),
                new TestCaseDescriptor("run-guard", "cost", "Cost: 1,000,000 characters are checked quickly with bounded state", CostAsync)
            };

            List<TestCaseDescriptor> stopping = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("run-guard-stop", "sigkill", "Stop: a harness that ignores SIGTERM is killed after the grace period", SigkillAsync),
                new TestCaseDescriptor("run-guard-stop", "process-tree", "Stop: children of the harness are stopped with it", ProcessTreeAsync),
                new TestCaseDescriptor("run-guard-stop", "process-tree-sigkill", "Stop: children of a harness that ignores SIGTERM are killed with it", ProcessTreeKillAsync),
                new TestCaseDescriptor("run-guard-stop", "executor-loop-mux", "Executor: a Mux-format \"* \\n\" loop ends RepetitionDetected with one RunGuardTriggered warning and partial output", ct => ExecutorLoopAsync("mux", OutputParserEnum.MuxJsonl, ct)),
                new TestCaseDescriptor("run-guard-stop", "executor-loop-claude", "Executor: a Claude-format \"* \\n\" loop ends RepetitionDetected", ct => ExecutorLoopAsync("claude", OutputParserEnum.ClaudeStreamJson, ct)),
                new TestCaseDescriptor("run-guard-stop", "executor-max-chars", "Executor: maxAssistantChars stops a run with OutputLimitExceeded", ExecutorMaxCharsAsync),
                new TestCaseDescriptor("run-guard-stop", "executor-no-progress", "Executor: a silent harness ends NoProgress", ExecutorNoProgressAsync),
                new TestCaseDescriptor("run-guard-stop", "executor-long-tool", "Executor: a tool call that runs longer than noProgressSeconds does not stop the run", ExecutorLongToolAsync)
            };

            return new List<TestSuiteDescriptor>
            {
                new TestSuiteDescriptor("run-guard", "Run guard detectors", detector),
                new TestSuiteDescriptor("run-guard-stop", "Run guard stop path", stopping)
            };
        }

        /// <summary>
        /// Append a measurement line to the file named by GARRISON_TEST_MEASUREMENTS, when set.
        /// </summary>
        /// <param name="line">Line.</param>
        public static void Measure(string line)
        {
            string? path = Environment.GetEnvironmentVariable("GARRISON_TEST_MEASUREMENTS");
            if (String.IsNullOrEmpty(path)) return;
            lock (_MeasureLock)
            {
                File.AppendAllText(path, DateTime.UtcNow.ToString("o") + " " + line + Environment.NewLine);
            }
        }

        #endregion

        #region Private-Members

        private static readonly object _MeasureLock = new object();
        private static readonly int _LoopStartDelta = 1200;

        #endregion

        #region Private-Methods

        private static List<string> FixtureDeltas()
        {
            string path = Path.Combine(AppContext.BaseDirectory, "Fixtures", "mux", "v1.3.0-repetition-loop-deltas.jsonl");
            List<string> deltas = new List<string>();
            foreach (string line in File.ReadAllLines(path))
            {
                if (String.IsNullOrEmpty(line)) continue;
                deltas.Add(JsonSerializer.Deserialize<string>(line) ?? String.Empty);
            }
            Assert.Equal(3117, deltas.Count, "fixture deltas");
            return deltas;
        }

        private static Task FixtureLoopAsync(CancellationToken token)
        {
            List<string> deltas = FixtureDeltas();
            RunGuard guard = new RunGuard(new RunGuardOptions());
            int trippedAt = -1;
            for (int i = 0; i < deltas.Count; i++)
            {
                if (guard.ObserveText(deltas[i]) != null)
                {
                    trippedAt = i;
                    break;
                }
            }
            RunGuardTrip trip = Assert.NotNull(guard.Trip, "trip on the recorded loop");
            Assert.True(trippedAt >= _LoopStartDelta, "the guard tripped at delta " + trippedAt + ", before the loop starts at delta " + _LoopStartDelta);
            Assert.Equal(RunOutcomeEnum.RepetitionDetected, trip.Outcome, "outcome");
            Assert.Equal("repetitionGuard", trip.Guard, "guard");
            int loopChars = deltas.Skip(_LoopStartDelta).Take(trippedAt - _LoopStartDelta + 1).Sum(d => d.Length);
            Assert.True(loopChars <= 1100, "tripped after " + loopChars + " characters of loop");
            Measure("run-guard fixture: tripped at delta " + trippedAt + " of " + deltas.Count + " (" + loopChars + " characters into the loop): " + trip.Reason);

            // The legitimate part alone (system prompt, bullets, and reasoning) never trips.
            RunGuard legit = new RunGuard(new RunGuardOptions());
            for (int i = 0; i < _LoopStartDelta; i++) Assert.True(legit.ObserveText(deltas[i]) == null, "tripped on legitimate delta " + i + ": " + legit.Trip?.Reason);

            // Without the degenerate-text rule, the periodic rule alone still catches the loop.
            RunGuardOptions periodicOnly = new RunGuardOptions();
            periodicOnly.DegenerateChars = 0;
            RunGuard periodic = new RunGuard(periodicOnly);
            int periodicAt = -1;
            for (int i = 0; i < deltas.Count; i++)
            {
                if (periodic.ObserveText(deltas[i]) != null)
                {
                    periodicAt = i;
                    break;
                }
            }
            Assert.True(periodicAt > _LoopStartDelta, "periodic rule tripped at delta " + periodicAt);
            Assert.True((periodic.Trip?.Reason ?? String.Empty).Contains("3-character unit", StringComparison.Ordinal), "periodic reason names the 3-character unit: " + periodic.Trip?.Reason);
            return Task.CompletedTask;
        }

        private static Task FixtureThroughParserAsync(CancellationToken token)
        {
            List<string> deltas = FixtureDeltas();
            IHarnessOutputParser parser = ParserFactory.Create(OutputParserEnum.MuxJsonl);
            HarnessRunState state = new HarnessRunState();
            RunGuard guard = new RunGuard(new RunGuardOptions());
            int assistantEvents = 0;
            int trippedAt = -1;
            parser.ParseLine("{\"contractVersion\":2,\"eventType\":\"run_started\",\"runId\":\"fixture\",\"sessionId\":\"fixture\",\"model\":\"gpt-oss:20b\",\"contextWindowSource\":\"endpoint\"}", state);
            for (int i = 0; i < deltas.Count && trippedAt < 0; i++)
            {
                parser.ParseLine("{\"contractVersion\":2,\"eventType\":\"assistant_text\",\"text\":" + JsonSerializer.Serialize(deltas[i]) + "}", state);
                foreach (RunEventReport report in state.Drain())
                {
                    if (report.EventType == RunEventTypeEnum.AssistantText) assistantEvents++;
                    if (guard.Observe(report) != null && trippedAt < 0) trippedAt = i;
                }
            }
            Assert.True(trippedAt >= _LoopStartDelta, "parser replay tripped at delta " + trippedAt);
            Assert.Equal(RunOutcomeEnum.RepetitionDetected, Assert.NotNull(guard.Trip, "trip").Outcome, "outcome");
            Assert.Equal(trippedAt + 1, assistantEvents, "one AssistantText event per delta");
            return Task.CompletedTask;
        }

        private static Task FixtureGuardOffAsync(CancellationToken token)
        {
            RunGuardOptions options = new RunGuardOptions();
            options.RepetitionGuard = false;
            RunGuard guard = new RunGuard(options);
            foreach (string delta in FixtureDeltas()) guard.ObserveText(delta);
            Assert.True(guard.Trip == null, "no trip with the repetition guard off: " + guard.Trip?.Reason);
            Assert.Equal(8045L, guard.AssistantChars, "assistant characters counted");
            return Task.CompletedTask;
        }

        private static string MarkdownDocument(int section)
        {
            StringBuilder doc = new StringBuilder();
            doc.Append("## Section " + section + ": deployment notes\n\n");
            doc.Append("Garrison runs headless harnesses on worker nodes. This section covers item " + section + ".\n\n");
            doc.Append("* First point about leases and epochs for section " + section + "\n");
            doc.Append("* Second point about heartbeats\n");
            doc.Append("  * Nested point A\n");
            doc.Append("  * Nested point B\n");
            doc.Append("1. Step one\n2. Step two\n3. Step three\n\n");
            doc.Append("| Column | Value | Notes |\n");
            doc.Append("|---|---|---|\n");
            doc.Append("|:------------|:-----------:|------------:|\n");
            for (int row = 0; row < 6; row++) doc.Append("| row " + row + " | " + (row * section) + " | ok |\n");
            doc.Append("|   |   |   |\n\n");
            doc.Append("---\n\n");
            doc.Append("```csharp\n");
            doc.Append("public static int Add(int a, int b)\n{\n    if (a < 0) { return -1; }\n    return a + b; // " + section + "\n}\n");
            doc.Append("```\n\n");
            doc.Append("```\n+----------+      +----------+\n|  Server  | ---> |  Worker  |\n+----------+      +----------+\n```\n\n");
            doc.Append("> Quote: keep loopback at 127.0.0.1.\n\n");
            doc.Append("=====================================================================\n\n");
            return doc.ToString();
        }

        private static Task MarkdownAsync(CancellationToken token)
        {
            RunGuard guard = new RunGuard(new RunGuardOptions());
            long chars = 0;
            for (int section = 1; section <= 40; section++)
            {
                string doc = MarkdownDocument(section);
                chars += doc.Length;
                // Stream it the way models do: small deltas.
                for (int i = 0; i < doc.Length; i += 7)
                {
                    Assert.True(guard.ObserveText(doc.Substring(i, Math.Min(7, doc.Length - i))) == null, "Markdown tripped the guard in section " + section + ": " + guard.Trip?.Reason);
                }
            }
            Assert.True(chars > 20000, "the Markdown sample is long enough (" + chars + " characters)");

            // The same document repeated verbatim is a unit far longer than 64 characters: not a degenerate loop.
            RunGuard repeated = new RunGuard(new RunGuardOptions());
            string same = MarkdownDocument(7);
            for (int i = 0; i < 20; i++) Assert.True(repeated.ObserveText(same) == null, "a repeated long document tripped: " + repeated.Trip?.Reason);
            return Task.CompletedTask;
        }

        private static Task LongOutputAsync(CancellationToken token)
        {
            RunGuard guard = new RunGuard(new RunGuardOptions());
            int line = 0;
            while (guard.AssistantChars < 190000)
            {
                line++;
                string text = "Line " + line + ": the worker shipped batch " + (line * 7 % 1000) + " of events for run " + (line % 13) + ", and the control plane acknowledged it.\n";
                Assert.True(guard.ObserveText(text) == null, "legitimate output tripped at " + guard.AssistantChars + " characters: " + guard.Trip?.Reason);
            }
            Assert.True(guard.AssistantChars < 200000, "still under the cap");

            while (guard.Trip == null) guard.ObserveText("Another legitimate line of output number " + (line++) + ".\n");
            RunGuardTrip trip = guard.Trip!;
            Assert.Equal(RunOutcomeEnum.OutputLimitExceeded, trip.Outcome, "outcome past the cap");
            Assert.Equal("maxAssistantChars", trip.Guard, "guard");
            Assert.True(guard.AssistantChars > 200000 && guard.AssistantChars < 200100, "tripped right after the cap: " + guard.AssistantChars);

            RunGuardOptions unlimited = new RunGuardOptions();
            unlimited.MaxAssistantChars = 0;
            RunGuard noCap = new RunGuard(unlimited);
            for (int i = 0; i < 3000; i++) noCap.ObserveText("Unlimited output line " + i + " with words and numbers " + (i * 31) + ".\n");
            Assert.True(noCap.Trip == null && noCap.AssistantChars > 100000, "maxAssistantChars 0 is unlimited");
            return Task.CompletedTask;
        }

        private static Task WhitespaceAsync(CancellationToken token)
        {
            foreach (string unit in new[] { " \n", "\n", " ", "\t", "\r\n", "...", "* \n" })
            {
                RunGuard guard = new RunGuard(new RunGuardOptions());
                int deltas = 0;
                while (guard.Trip == null && deltas < 5000)
                {
                    guard.ObserveText(unit);
                    deltas++;
                }
                RunGuardTrip trip = Assert.NotNull(guard.Trip, "whitespace stream '" + unit.Replace("\n", "\\n") + "' trips");
                Assert.Equal(RunOutcomeEnum.RepetitionDetected, trip.Outcome, "outcome for '" + unit.Replace("\n", "\\n") + "'");
                Assert.True(guard.AssistantChars <= 1000 + unit.Length, "whitespace tripped within 1,000 characters (" + guard.AssistantChars + ")");
            }

            // A whitespace stream that is not periodic (varying run lengths) still trips through the degenerate rule.
            RunGuard varied = new RunGuard(new RunGuardOptions());
            Random random = new Random(7);
            while (varied.Trip == null && varied.AssistantChars < 5000) varied.ObserveText(new string(' ', random.Next(1, 9)) + (random.Next(2) == 0 ? "\n" : "\t"));
            Assert.True(varied.Trip != null && varied.AssistantChars <= 1010, "irregular whitespace trips within about 1,000 characters (" + varied.AssistantChars + ")");
            return Task.CompletedTask;
        }

        private static Task UnitsAsync(CancellationToken token)
        {
            string unit = "I will check the file again right now. ";
            RunGuard guard = new RunGuard(new RunGuardOptions());
            string forty = unit + "!";
            while (guard.Trip == null && guard.AssistantChars < 10000) guard.ObserveText(forty);
            RunGuardTrip trip = Assert.NotNull(guard.Trip, "a 40-character unit trips");
            Assert.True(trip.Reason.Contains("40-character unit", StringComparison.Ordinal), "reason names the unit length: " + trip.Reason);
            Assert.True(guard.AssistantChars >= 2000 && guard.AssistantChars <= 2040, "tripped once the window filled (" + guard.AssistantChars + ")");

            // Units longer than 64 characters are not loops for this guard.
            RunGuard longUnit = new RunGuard(new RunGuardOptions());
            string seventy = "This sentence is exactly seventy characters long, give or take a few.!";
            for (int i = 0; i < 200; i++) longUnit.ObserveText(seventy);
            Assert.True(longUnit.Trip == null, "a 70-character unit does not trip: " + longUnit.Trip?.Reason);

            // The same short sentence between tool calls (an agent working through many files) is not a loop.
            RunGuard agent = new RunGuard(new RunGuardOptions());
            for (int i = 0; i < 300; i++)
            {
                agent.ObserveText("Reading the next file.\n");
                agent.Observe(new RunEventReport { EventType = RunEventTypeEnum.ToolCall, ToolName = "read", ToolCallId = "c" + i });
                agent.Observe(new RunEventReport { EventType = RunEventTypeEnum.ToolResult, ToolName = "read", ToolCallId = "c" + i, Success = true });
            }
            Assert.True(agent.Trip == null, "repeated sentences between tool calls do not trip: " + agent.Trip?.Reason);
            return Task.CompletedTask;
        }

        private static Task NoProgressAsync(CancellationToken token)
        {
            long now = 0;
            RunGuardOptions options = new RunGuardOptions();
            options.NoProgressSeconds = 10;
            RunGuard guard = new RunGuard(options, () => now);
            guard.Start();

            now = 9000;
            Assert.True(guard.CheckIdle() == null, "9 seconds idle is within the limit");
            guard.Observe(new RunEventReport { EventType = RunEventTypeEnum.Thinking, Text = "thinking" });
            now = 18000;
            Assert.True(guard.CheckIdle() == null, "thinking is progress");

            // A long tool execution: the clock is paused while the call is open.
            guard.Observe(new RunEventReport { EventType = RunEventTypeEnum.ToolCall, ToolName = "Bash", ToolCallId = "toolu_1" });
            guard.Observe(new RunEventReport { EventType = RunEventTypeEnum.ToolCall, ToolName = "Bash", ToolCallId = "toolu_2" });
            Assert.Equal(2, guard.OpenToolCalls, "two open tool calls");
            now = 600000;
            Assert.True(guard.CheckIdle() == null, "no NoProgress while tool calls are open (10 minutes)");
            guard.Observe(new RunEventReport { EventType = RunEventTypeEnum.ToolResult, ToolCallId = "toolu_1", Success = true });
            now = 1200000;
            Assert.True(guard.CheckIdle() == null, "one call still open");
            guard.Observe(new RunEventReport { EventType = RunEventTypeEnum.ToolResult, ToolCallId = "toolu_2", Success = true });
            Assert.Equal(0, guard.OpenToolCalls, "all calls closed");
            now = 1209000;
            Assert.True(guard.CheckIdle() == null, "the result restarted the clock");

            // Events that are not progress do not reset the clock.
            guard.Observe(new RunEventReport { EventType = RunEventTypeEnum.Usage });
            guard.Observe(new RunEventReport { EventType = RunEventTypeEnum.Lifecycle, Text = "heartbeat" });
            guard.Observe(new RunEventReport { EventType = RunEventTypeEnum.Stderr, Text = "retrying" });
            now = 1210500;
            RunGuardTrip trip = Assert.NotNull(guard.CheckIdle(), "silence past the limit trips");
            Assert.Equal(RunOutcomeEnum.NoProgress, trip.Outcome, "outcome");
            Assert.Equal("noProgressSeconds", trip.Guard, "guard");

            // A tool call that never reports a result (Codex web_search) is closed when the model writes again.
            long clock = 0;
            RunGuard codex = new RunGuard(options, () => clock);
            codex.Observe(new RunEventReport { EventType = RunEventTypeEnum.ToolCall, ToolName = "web_search", ToolCallId = "ws_1" });
            codex.ObserveText("Here is what I found.");
            Assert.Equal(0, codex.OpenToolCalls, "text closes calls that never report a result");
            clock = 11000;
            Assert.True(codex.CheckIdle() != null, "and the idle clock runs again");

            // 0 turns the guard off.
            RunGuardOptions off = new RunGuardOptions();
            off.NoProgressSeconds = 0;
            long offClock = 0;
            RunGuard disabled = new RunGuard(off, () => offClock);
            offClock = 86400000;
            Assert.True(disabled.CheckIdle() == null, "noProgressSeconds 0 never trips");
            return Task.CompletedTask;
        }

        private static Task CostAsync(CancellationToken token)
        {
            RunGuardOptions options = new RunGuardOptions();
            options.MaxAssistantChars = 0;
            RunGuard guard = new RunGuard(options);
            StringBuilder chunk = new StringBuilder();
            for (int i = 0; i < 100; i++) chunk.Append("Word" + i + " ");
            string text = chunk.ToString();
            Stopwatch watch = Stopwatch.StartNew();
            while (guard.AssistantChars < 1000000) guard.ObserveText(text);
            watch.Stop();
            Assert.True(guard.Trip == null, "varied text does not trip");
            Assert.True(watch.ElapsedMilliseconds < 3000, "1,000,000 characters checked in " + watch.ElapsedMilliseconds + " ms");
            Measure("run-guard cost: 1,000,000 characters in " + watch.ElapsedMilliseconds + " ms");
            return Task.CompletedTask;
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

        private static string WorkRoot()
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-guard-tests");
            Directory.CreateDirectory(root);
            return root;
        }

        private static ProcessRunRequest FakeRequest(params string[] arguments)
        {
            ProcessRunRequest request = new ProcessRunRequest();
            request.Executable = DotnetHost();
            request.Arguments = new List<string> { FakeHarnessDll() };
            request.Arguments.AddRange(arguments);
            request.WorkingDirectory = WorkRoot();
            foreach (string name in new[] { "PATH", "DOTNET_ROOT", "TMPDIR", "LANG", "HOME" })
            {
                string? value = Environment.GetEnvironmentVariable(name);
                if (!String.IsNullOrEmpty(value)) request.Environment[name] = value;
            }
            request.Stdin = "x";
            request.TimeoutSeconds = 60;
            return request;
        }

        private static async Task<ProcessRunResult> CancelAfterStartAsync(ProcessRunRequest request, string? pidFile, CancellationToken token)
        {
            using (CancellationTokenSource cancel = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                int lines = 0;
                Task<ProcessRunResult> running = new ProcessRunner().RunAsync(request, line => Interlocked.Increment(ref lines), null, cancel.Token);
                DateTime deadline = DateTime.UtcNow.AddSeconds(20);
                while (DateTime.UtcNow < deadline && (Volatile.Read(ref lines) == 0 || (pidFile != null && !File.Exists(pidFile)))) await Task.Delay(50, token).ConfigureAwait(false);
                Assert.True(Volatile.Read(ref lines) > 0, "the fake harness started");
                // Let a spawned child and the signal handler settle.
                await Task.Delay(300, token).ConfigureAwait(false);
                cancel.Cancel();
                return await running.ConfigureAwait(false);
            }
        }

        private static async Task SigkillAsync(CancellationToken token)
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return;
            ProcessRunRequest request = FakeRequest("--format", "claude", "--hang", "--ignore-sigterm");
            request.KillGraceSeconds = 1;
            ProcessRunResult result = await CancelAfterStartAsync(request, null, token).ConfigureAwait(false);
            Assert.True(result.Cancelled, "cancelled");
            Assert.True(result.Killed, "the harness ignored SIGTERM, so it was killed");
            long latency = result.StopLatencyMs ?? -1;
            Assert.True(latency >= 900 && latency < 5000, "SIGKILL after the 1-second grace period (stopped after " + latency + " ms)");
            Assert.True(result.ExitCode.HasValue && result.ExitCode.Value != 0, "killed exit code " + result.ExitCode);
            Measure("run-guard-stop sigkill: SIGTERM ignored, killed " + latency + " ms after the stop request (grace 1 s)");

            ProcessRunRequest polite = FakeRequest("--format", "claude", "--hang");
            polite.KillGraceSeconds = 5;
            ProcessRunResult graceful = await CancelAfterStartAsync(polite, null, token).ConfigureAwait(false);
            Assert.True(!graceful.Killed, "a harness that honors SIGTERM is not killed");
            Assert.True((graceful.StopLatencyMs ?? 99999) < 2000, "SIGTERM stops it quickly (" + graceful.StopLatencyMs + " ms)");
            Measure("run-guard-stop sigterm: harness exited " + graceful.StopLatencyMs + " ms after SIGTERM");
        }

        private static async Task ProcessTreeAsync(CancellationToken token)
        {
            await ProcessTreeCoreAsync(false, token).ConfigureAwait(false);
        }

        private static async Task ProcessTreeKillAsync(CancellationToken token)
        {
            await ProcessTreeCoreAsync(true, token).ConfigureAwait(false);
        }

        private static async Task ProcessTreeCoreAsync(bool ignoreSigterm, CancellationToken token)
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return;
            string pidFile = Path.Combine(WorkRoot(), "child-" + Guid.NewGuid().ToString("N") + ".pid");
            List<string> arguments = new List<string> { "--format", "claude", "--hang", "--spawn-child", pidFile };
            if (ignoreSigterm) arguments.Add("--ignore-sigterm");
            ProcessRunRequest request = FakeRequest(arguments.ToArray());
            request.KillGraceSeconds = 1;
            Stopwatch watch = Stopwatch.StartNew();
            ProcessRunResult result = await CancelAfterStartAsync(request, pidFile, token).ConfigureAwait(false);
            Assert.True(File.Exists(pidFile), "the fake harness wrote its child's process ID");
            int child = Int32.Parse(File.ReadAllText(pidFile).Trim(), System.Globalization.CultureInfo.InvariantCulture);
            try
            {
                Assert.True(result.Cancelled, "cancelled");
                DateTime deadline = DateTime.UtcNow.AddSeconds(5);
                while (PosixSignals.Exists(child) && DateTime.UtcNow < deadline) await Task.Delay(50, token).ConfigureAwait(false);
                Assert.True(!PosixSignals.Exists(child), "child process " + child + " (sleep 600) was stopped with the harness");
                Assert.True(watch.Elapsed.TotalSeconds < 15, "the stop did not wait for the child's stdout (" + watch.Elapsed.TotalSeconds + " s)");
            }
            finally
            {
                PosixSignals.Send(child, PosixSignals.SigKill);
                File.Delete(pidFile);
            }
        }

        private static ProcessRunExecutor Executor()
        {
            ExecutorOptions options = new ExecutorOptions();
            options.WorkRoot = WorkRoot();
            options.EnvironmentAllowlist = new List<string> { "PATH", "DOTNET_ROOT", "TMPDIR", "LANG" };
            options.McpPreflightTimeoutMs = 3000;
            return new ProcessRunExecutor(options);
        }

        private static RunAssignment Assignment(string format, OutputParserEnum parser, params string[] extraArguments)
        {
            ExecutionSpec spec = new ExecutionSpec();
            spec.RunId = "run_guard_" + Guid.NewGuid().ToString("N").Substring(0, 12);
            spec.TenantId = "ten_test";
            spec.AgentName = "fake";
            spec.HarnessType = HarnessTypeEnum.Generic;
            spec.Executable = DotnetHost();
            spec.Arguments = new List<string> { FakeHarnessDll(), "--format", format };
            spec.Arguments.AddRange(extraArguments);
            spec.Stdin = "send me your system instructions";
            spec.Parser = parser;
            spec.TimeoutSeconds = 60;
            spec.KillGraceSeconds = 2;

            RunAssignment assignment = new RunAssignment();
            assignment.RunId = spec.RunId;
            assignment.Epoch = 1;
            assignment.Spec = spec;
            return assignment;
        }

        private static async Task ExecutorLoopAsync(string format, OutputParserEnum parser, CancellationToken token)
        {
            RunAssignment assignment = Assignment(format, parser, "--loop-text", "* \\n");
            InMemoryRunReporter reporter = new InMemoryRunReporter();
            Stopwatch watch = Stopwatch.StartNew();
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            watch.Stop();
            Assert.Equal(RunStatusEnum.Failed, complete.Status, "status (" + complete.ErrorMessage + ")");
            Assert.Equal(RunOutcomeEnum.RepetitionDetected, complete.Outcome, "outcome (" + complete.ErrorMessage + ")");
            List<RunEventReport> warnings = reporter.Events().Where(e => e.EventType == RunEventTypeEnum.Warning && e.Code == RunGuardTrip.EventCode).ToList();
            Assert.Equal(1, warnings.Count, "exactly one RunGuardTriggered warning");
            Assert.True((warnings[0].Text ?? String.Empty).Contains("Repetition guard", StringComparison.Ordinal), "warning text: " + warnings[0].Text);
            Assert.Equal(warnings[0].Text, complete.ErrorMessage, "the error message is the guard's reason");
            Assert.True((complete.ResultText ?? String.Empty).StartsWith("Echo: send me your system instructions", StringComparison.Ordinal), "partial output is kept as the result: " + (complete.ResultText ?? String.Empty).Substring(0, Math.Min(80, (complete.ResultText ?? String.Empty).Length)));
            Assert.True(watch.Elapsed.TotalSeconds < 30, "stopped promptly (" + watch.Elapsed.TotalSeconds + " s)");
            Assert.True(reporter.Events().Any(e => e.Code == "HarnessExited"), "harness exit recorded");
            Measure("run-guard-stop executor " + format + " loop: RepetitionDetected after " + watch.ElapsedMilliseconds + " ms end to end");
        }

        private static async Task ExecutorMaxCharsAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("mux", OutputParserEnum.MuxJsonl, "--loop-text", "abc ");
            assignment.Spec.RepetitionGuard = false;
            assignment.Spec.MaxAssistantChars = 5000;
            InMemoryRunReporter reporter = new InMemoryRunReporter();
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Failed, complete.Status, "status");
            Assert.Equal(RunOutcomeEnum.OutputLimitExceeded, complete.Outcome, "outcome (" + complete.ErrorMessage + ")");
            Assert.True((complete.ErrorMessage ?? String.Empty).Contains("maxAssistantChars", StringComparison.Ordinal), "error names the limit: " + complete.ErrorMessage);
            Assert.Equal(1, reporter.Events().Count(e => e.Code == RunGuardTrip.EventCode), "one RunGuardTriggered warning");
        }

        private static async Task ExecutorNoProgressAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "--hang");
            assignment.Spec.NoProgressSeconds = 2;
            InMemoryRunReporter reporter = new InMemoryRunReporter();
            Stopwatch watch = Stopwatch.StartNew();
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Failed, complete.Status, "status");
            Assert.Equal(RunOutcomeEnum.NoProgress, complete.Outcome, "outcome (" + complete.ErrorMessage + ")");
            Assert.True(watch.Elapsed.TotalSeconds >= 2 && watch.Elapsed.TotalSeconds < 15, "stopped after about 2 seconds of silence (" + watch.Elapsed.TotalSeconds + " s)");
            Assert.Equal(1, reporter.Events().Count(e => e.Code == RunGuardTrip.EventCode), "one RunGuardTriggered warning");
        }

        private static async Task ExecutorLongToolAsync(CancellationToken token)
        {
            RunAssignment assignment = Assignment("claude", OutputParserEnum.ClaudeStreamJson, "--tool-calls", "1", "--tool-sleep-ms", "5000", "--think-ms", "0");
            assignment.Spec.NoProgressSeconds = 2;
            InMemoryRunReporter reporter = new InMemoryRunReporter();
            RunCompleteRequest complete = await Executor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Succeeded, complete.Status, "a 5-second tool call with noProgressSeconds 2 succeeds (" + complete.Outcome + ": " + complete.ErrorMessage + ")");
            Assert.Equal(0, reporter.Events().Count(e => e.Code == RunGuardTrip.EventCode), "no guard warning");
        }

        #endregion
    }
}
