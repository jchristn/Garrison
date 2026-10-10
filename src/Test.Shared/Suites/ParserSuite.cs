namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Harnesses;
    using Garrison.Harnesses.Execution;
    using Garrison.Harnesses.Parsers;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Harness output parser and outcome classification suites, driven by recorded and hand-written fixtures.
    /// </summary>
    public static class ParserSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestCaseDescriptor> parsers = new List<TestCaseDescriptor>
            {
                Case("parsers", "claude-success", "Claude stream-json: recorded success", ClaudeSuccess),
                Case("parsers", "claude-mcp-failed", "Claude stream-json: failed MCP server fails the run despite exit 0", ClaudeMcpFailed),
                Case("parsers", "claude-max-turns", "Claude stream-json: error result with tool use", ClaudeMaxTurns),
                Case("parsers", "codex-session-model", "Codex: served model read from the session file under CODEX_HOME", CodexSessionModel),
                Case("parsers", "claude-partial", "Claude stream-json: partial messages stream text once and keep tool input", ClaudePartialMessages),
                Case("parsers", "codex-success", "Codex JSONL: recorded success with usage", CodexSuccess),
                Case("parsers", "codex-failed", "Codex JSONL: turn.failed with tool items", CodexFailed),
                Case("parsers", "mux-success", "Mux JSONL: assistant text concatenation, tools, usage", MuxSuccess),
                Case("parsers", "mux-failed", "Mux JSONL: max iterations is a failure", MuxFailed),
                Case("parsers", "mux-llm-error", "Mux JSONL: completed_with_errors plus a non-zero exit is a failure", MuxLlmError),
                Case("parsers", "gemini-success", "Gemini stream-json: served model from result stats", GeminiSuccess),
                Case("parsers", "generic-jsonl", "Generic JSONL: dotted path mappings", GenericJsonl),
                Case("parsers", "plain-text", "Plain text: every line is assistant text", PlainText),
                Case("parsers", "non-json-lines", "JSON parsers turn non-JSON lines into stdout events", NonJsonLines),
                Case("parsers", "raw-event-truncation", "Raw events are truncated to the configured size", RawTruncation),
                Case("parsers", "reasoning-tokens", "Reasoning tokens from Codex, Claude, and Mux usage; 0 when absent", ReasoningTokens),
                Case("parsers", "timing", "Harness timing: TTFT, streaming, execution, and tool calls on a monotonic clock", Timing)
            };

            List<TestCaseDescriptor> outcomes = new List<TestCaseDescriptor>
            {
                Case("outcomes", "precedence", "Cancelled, timed out, not installed, and output limit win over parser state", OutcomePrecedence),
                Case("outcomes", "final-event-policy", "FinalEvent policy ignores a non-zero exit after success", OutcomeFinalEvent),
                Case("outcomes", "exit-code-policies", "ExitCode and FinalEventAndExitCode policies", OutcomeExitCodePolicies),
                Case("outcomes", "credential-heuristics", "Credential stderr markers map to NotCredentialed", OutcomeCredentials),
                Case("outcomes", "scrubber", "Secret scrubber redacts every occurrence and ignores tiny values", Scrubber)
            };

            return new List<TestSuiteDescriptor>
            {
                new TestSuiteDescriptor("parsers", "Harness output parsers", parsers),
                new TestSuiteDescriptor("outcomes", "Harness outcome classification", outcomes)
            };
        }

        #endregion

        #region Private-Methods

        private static TestCaseDescriptor Case(string suite, string id, string name, Action body)
        {
            return new TestCaseDescriptor(suite, id, name, ct =>
            {
                body();
                return Task.CompletedTask;
            });
        }

        private static HarnessRunState Parse(OutputParserEnum kind, string fixture, ExecutionParserOptions? options = null, IEnumerable<string>? requiredMcpServers = null)
        {
            string path = Path.Combine(AppContext.BaseDirectory, "Fixtures", fixture);
            if (!File.Exists(path)) throw new TestAssertionException("Fixture not found: " + path);
            IHarnessOutputParser parser = ParserFactory.Create(kind, options, requiredMcpServers);
            HarnessRunState state = new HarnessRunState();
            foreach (string line in File.ReadAllLines(path)) parser.ParseLine(line, state);
            parser.Complete(state);
            return state;
        }

        private static HarnessRunState ParseLines(OutputParserEnum kind, IEnumerable<string> lines, ExecutionParserOptions? options = null)
        {
            IHarnessOutputParser parser = ParserFactory.Create(kind, options);
            HarnessRunState state = new HarnessRunState();
            foreach (string line in lines) parser.ParseLine(line, state);
            parser.Complete(state);
            return state;
        }

        private static void ClaudeSuccess()
        {
            HarnessRunState state = Parse(OutputParserEnum.ClaudeStreamJson, "claude/success.jsonl");
            List<RunEventReport> events = state.Drain();
            Assert.True(state.SawSuccess && state.SawFinalResult, "Expected success.");
            Assert.True(state.DetectedFailure == null, "Unexpected failure: " + state.DetectedFailure);
            Assert.Equal("OK", state.FinalText, "Final text");
            Assert.Equal("OK", state.AssistantText.ToString(), "Assistant text must not double count the assistant message");
            Assert.Equal("claude-opus-5-5", state.ServedModel, "Served model");
            Assert.True(state.CostUsd.HasValue && state.CostUsd.Value > 0, "Cost should be reported.");
            Assert.True(state.CachedTokens > 0, "Cached tokens should be read.");
            Assert.True(!String.IsNullOrEmpty(state.SessionId), "Session id should be read.");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.AssistantText && e.Text == "OK"), "Expected an assistant text event.");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Result), "Expected a result event.");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Usage), "Expected a usage event.");
        }

        private static void ReasoningTokens()
        {
            Assert.Equal(0L, Parse(OutputParserEnum.CodexJsonl, "codex/success.jsonl").ReasoningTokens, "Codex fixture reports 0 reasoning tokens");
            Assert.Equal(0L, Parse(OutputParserEnum.ClaudeStreamJson, "claude/success.jsonl").ReasoningTokens, "Claude fixture reports 0 thinking tokens");
            Assert.Equal(0L, Parse(OutputParserEnum.MuxJsonl, "mux/success.jsonl").ReasoningTokens, "Mux reports no reasoning tokens");

            HarnessRunState codex = ParseLines(OutputParserEnum.CodexJsonl, new[]
            {
                "{\"type\":\"thread.started\",\"thread_id\":\"t1\"}",
                "{\"type\":\"item.completed\",\"item\":{\"id\":\"m1\",\"type\":\"agent_message\",\"text\":\"OK\"}}",
                "{\"type\":\"turn.completed\",\"usage\":{\"input_tokens\":100,\"cached_input_tokens\":10,\"output_tokens\":20,\"reasoning_output_tokens\":64}}"
            });
            Assert.Equal(64L, codex.ReasoningTokens, "Codex reasoning_output_tokens");
            Assert.Equal(84L, codex.OutputTokens, "Codex output tokens include reasoning");

            HarnessRunState claude = ParseLines(OutputParserEnum.ClaudeStreamJson, new[]
            {
                "{\"type\":\"result\",\"subtype\":\"success\",\"is_error\":false,\"result\":\"OK\",\"usage\":{\"input_tokens\":5,\"output_tokens\":50,\"output_tokens_details\":{\"thinking_tokens\":31}}}"
            });
            Assert.Equal(31L, claude.ReasoningTokens, "Claude usage thinking_tokens");

            HarnessRunState claudeModels = ParseLines(OutputParserEnum.ClaudeStreamJson, new[]
            {
                "{\"type\":\"result\",\"subtype\":\"success\",\"is_error\":false,\"result\":\"OK\",\"usage\":{\"output_tokens\":50},\"modelUsage\":{\"a\":{\"outputTokens\":40,\"thinkingTokens\":12},\"b\":{\"outputTokens\":10,\"thinkingTokens\":3}}}"
            });
            Assert.Equal(15L, claudeModels.ReasoningTokens, "Claude modelUsage thinkingTokens summed");

            HarnessRunState mux = ParseLines(OutputParserEnum.MuxJsonl, new[]
            {
                "{\"contractVersion\":2,\"eventType\":\"run_completed\",\"status\":\"completed\",\"usage\":{\"inputTokens\":10,\"outputTokens\":4,\"reasoningTokens\":7}}"
            });
            Assert.Equal(7L, mux.ReasoningTokens, "Mux usage reasoningTokens when present");
        }

        private static void Timing()
        {
            HarnessTiming timing = new HarnessTiming();
            RunEventReport text = new RunEventReport();
            text.EventType = RunEventTypeEnum.AssistantText;
            timing.Observe(text);
            Assert.True(timing.TimeToFirstTokenMs == null, "Output before start is ignored.");

            timing.Start();
            Thread.Sleep(30);
            RunEventReport thinking = new RunEventReport();
            thinking.EventType = RunEventTypeEnum.Thinking;
            timing.Observe(thinking);
            RunEventReport tool = new RunEventReport();
            tool.EventType = RunEventTypeEnum.ToolCall;
            timing.Observe(tool);
            timing.Observe(tool);
            RunEventReport result = new RunEventReport();
            result.EventType = RunEventTypeEnum.ToolResult;
            timing.Observe(result);
            Thread.Sleep(30);
            timing.Observe(text);
            Thread.Sleep(10);
            timing.MarkExited();
            timing.Observe(text);

            long ttft = timing.TimeToFirstTokenMs ?? -1;
            long streaming = timing.StreamingMs ?? -1;
            long execution = timing.ExecutionMs ?? -1;
            Assert.True(ttft >= 25, "TTFT should cover the delay before the first output (was " + ttft + ").");
            Assert.True(streaming >= 25, "Streaming should cover first to last output (was " + streaming + ").");
            Assert.True(execution >= ttft + streaming, "Execution covers TTFT plus streaming (was " + execution + ").");
            Assert.Equal(2, timing.ToolCallCount, "Tool calls");
            DateTime firstToken = timing.FirstTokenUtc ?? DateTime.MinValue;
            DateTime lastToken = timing.LastTokenUtc ?? DateTime.MinValue;
            Assert.True(firstToken > DateTime.MinValue && lastToken >= firstToken, "First token precedes last token.");
            Assert.Equal(streaming, (long)(lastToken - firstToken).TotalMilliseconds, "Timestamps agree with the monotonic durations");

            RunCompleteRequest complete = new RunCompleteRequest();
            timing.ApplyTo(complete);
            Assert.Equal(ttft, complete.TimeToFirstTokenMs ?? -1, "Applied TTFT");
            Assert.Equal(2, complete.ToolCallCount, "Applied tool calls");

            HarnessTiming silent = new HarnessTiming();
            silent.Start();
            silent.MarkExited();
            Assert.True(silent.TimeToFirstTokenMs == null && silent.StreamingMs == null && silent.FirstTokenUtc == null, "No model output means null TTFT and streaming.");
            Assert.True(silent.ExecutionMs.HasValue, "Execution is measured even without model output.");
        }

        private static void ClaudeMcpFailed()
        {
            HarnessRunState optional = Parse(OutputParserEnum.ClaudeStreamJson, "claude/mcp-failed.jsonl");
            Assert.True(optional.DetectedFailure == null, "A non-required server only warns.");
            Assert.True(optional.Drain().Any(e => e.EventType == RunEventTypeEnum.Warning), "Expected a warning for the optional server.");

            HarnessRunState state = Parse(OutputParserEnum.ClaudeStreamJson, "claude/mcp-failed.jsonl", null, new[] { "garrison" });
            Assert.True(state.SawSuccess, "The result event itself reports success.");
            Assert.True(state.DetectedFailure != null && state.DetectedFailure.Contains("garrison"), "MCP failure should be detected.");
            HarnessOutcome outcome = OutcomeClassifier.Classify(new ExecutionSpec { Parser = OutputParserEnum.ClaudeStreamJson }, new ProcessRunResult { ExitCode = 0 }, state);
            Assert.Equal(RunStatusEnum.Failed, outcome.Status, "Status");
            Assert.Equal(RunOutcomeEnum.HarnessFailed, outcome.Outcome, "Outcome");
        }

        private static void CodexSessionModel()
        {
            string home = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "garrison-codex-" + Guid.NewGuid().ToString("N"));
            try
            {
                Assert.True(CodexSessionReader.ReadModel(home) == null, "Missing home yields null");
                string dir = System.IO.Path.Combine(home, "sessions", "2026", "10", "10");
                System.IO.Directory.CreateDirectory(dir);
                System.IO.File.WriteAllLines(System.IO.Path.Combine(dir, "rollout-2026-10-10T00-00-00-abc.jsonl"), new[]
                {
                    "{\"type\":\"session_meta\",\"payload\":{\"model_provider\":\"openai\"}}",
                    "{\"type\":\"turn_context\",\"payload\":{\"model\":\"gpt-6.1-sol\",\"cwd\":\"/w\"}}",
                    "{\"type\":\"event_msg\",\"payload\":{\"type\":\"agent_message\"}}"
                });
                Assert.Equal("gpt-6.1-sol", CodexSessionReader.ReadModel(home), "Model from turn_context");
            }
            finally
            {
                if (System.IO.Directory.Exists(home)) System.IO.Directory.Delete(home, true);
            }
        }

        private static void ClaudePartialMessages()
        {
            HarnessRunState state = ParseLines(OutputParserEnum.ClaudeStreamJson, new[]
            {
                "{\"type\":\"system\",\"subtype\":\"init\",\"session_id\":\"s1\",\"model\":\"claude-sonnet-5-5\"}",
                "{\"type\":\"stream_event\",\"event\":{\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"Hel\"}}}",
                "{\"type\":\"stream_event\",\"event\":{\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"lo\"}}}",
                "{\"type\":\"stream_event\",\"event\":{\"type\":\"content_block_start\",\"content_block\":{\"type\":\"tool_use\",\"id\":\"t1\",\"name\":\"Bash\"}}}",
                "{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"Hello\"},{\"type\":\"tool_use\",\"id\":\"t1\",\"name\":\"Bash\",\"input\":{\"command\":\"ls\"}}]}}",
                "{\"type\":\"result\",\"subtype\":\"success\",\"is_error\":false,\"result\":\"Hello\"}"
            });
            List<RunEventReport> events = state.Drain();
            List<RunEventReport> text = events.Where(e => e.EventType == RunEventTypeEnum.AssistantText).ToList();
            Assert.Equal(2, text.Count, "One text event per delta, none repeated from the full message");
            Assert.Equal("Hello", String.Concat(text.Select(e => e.Text)), "Streamed text");
            RunEventReport call = Assert.NotNull(events.SingleOrDefault(e => e.EventType == RunEventTypeEnum.ToolCall), "Exactly one tool call");
            Assert.True((call.Text ?? String.Empty).Contains("ls", StringComparison.Ordinal), "Tool call keeps its input");
        }

        private static void ClaudeMaxTurns()
        {
            HarnessRunState state = Parse(OutputParserEnum.ClaudeStreamJson, "claude/error-max-turns.jsonl");
            List<RunEventReport> events = state.Drain();
            Assert.True(!state.SawSuccess && state.SawFinalResult, "Expected a failed final result.");
            Assert.Equal(20L, state.OutputTokens, "Output tokens");
            Assert.Equal("claude-sonnet-5-5", state.ServedModel, "Served model");
            RunEventReport call = Assert.NotNull(events.FirstOrDefault(e => e.EventType == RunEventTypeEnum.ToolCall), "Tool call");
            Assert.Equal("Bash", call.ToolName, "Tool name");
            RunEventReport result = Assert.NotNull(events.FirstOrDefault(e => e.EventType == RunEventTypeEnum.ToolResult), "Tool result");
            Assert.Equal("Bash", result.ToolName, "Tool result name resolved from the call");
            Assert.True(result.Success == true, "Tool result success");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Error), "Expected an error event.");
        }

        private static void CodexSuccess()
        {
            HarnessRunState state = Parse(OutputParserEnum.CodexJsonl, "codex/success.jsonl");
            Assert.True(state.SawSuccess, "Expected success.");
            Assert.Equal("OK", state.FinalText, "Final text");
            Assert.Equal(16639L, state.InputTokens, "Input tokens");
            Assert.Equal(13184L, state.CachedTokens, "Cached tokens");
            Assert.Equal(5L, state.OutputTokens, "Output tokens");
            Assert.True(!String.IsNullOrEmpty(state.SessionId), "Thread id");
        }

        private static void CodexFailed()
        {
            HarnessRunState state = Parse(OutputParserEnum.CodexJsonl, "codex/failed.jsonl");
            List<RunEventReport> events = state.Drain();
            Assert.True(!state.SawSuccess, "Expected failure.");
            Assert.True(state.DetectedFailure != null && state.DetectedFailure.Contains("disconnected"), "Failure message");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.ToolResult && e.ToolName == "shell" && e.Success == true), "Shell result");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.ToolResult && e.ToolName == "garrison.garrison_list_agents" && e.Success == false), "MCP result");
        }

        private static void MuxSuccess()
        {
            HarnessRunState state = Parse(OutputParserEnum.MuxJsonl, "mux/success.jsonl");
            List<RunEventReport> events = state.Drain();
            Assert.True(state.SawSuccess, "Expected success.");
            Assert.Equal("OK", state.FinalText, "Final text concatenated from assistant_text");
            Assert.Equal(120L, state.InputTokens, "Input tokens");
            Assert.Equal(4L, state.OutputTokens, "Output tokens");
            Assert.Equal("gpt-5.5-mini", state.ServedModel, "Model");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.ToolResult && e.ToolName == "read_file" && e.Success == true), "Tool result");
        }

        private static void MuxLlmError()
        {
            HarnessRunState state = ParseLines(OutputParserEnum.MuxJsonl, new[]
            {
                "{\"contractVersion\":2,\"eventType\":\"run_started\",\"model\":\"gpt-oss:20b\"}",
                "{\"contractVersion\":2,\"eventType\":\"error\",\"code\":\"llm_request_failed\",\"message\":\"LLM request failed with status 401\"}",
                "{\"contractVersion\":2,\"eventType\":\"run_completed\",\"status\":\"completed_with_errors\"}"
            });
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.MuxJsonl, SuccessPolicy = SuccessPolicyEnum.FinalEventAndExitCode };
            HarnessOutcome failed = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 1 }, state);
            Assert.Equal(RunStatusEnum.Failed, failed.Status, "Exit code 1 after an LLM error must fail");
            HarnessOutcome ok = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, state);
            Assert.Equal(RunStatusEnum.Succeeded, ok.Status, "completed_with_errors with exit 0 still succeeds (tool errors the model recovered from)");
        }

        private static void MuxFailed()
        {
            HarnessRunState state = Parse(OutputParserEnum.MuxJsonl, "mux/failed.jsonl");
            Assert.True(!state.SawSuccess && state.SawFinalResult, "Expected failure.");
            Assert.True(state.DetectedFailure != null, "Expected a failure message.");
        }

        private static void GeminiSuccess()
        {
            HarnessRunState state = Parse(OutputParserEnum.GeminiStreamJson, "gemini/success.jsonl");
            Assert.True(state.SawSuccess, "Expected success.");
            Assert.Equal("OK", state.FinalText, "Final text excludes the user message");
            Assert.Equal("gemini-3-flash", state.ServedModel, "Served model comes from result stats");
            Assert.Equal(25L, state.InputTokens, "Input tokens");
            Assert.Equal(10L, state.CachedTokens, "Cached tokens");
        }

        private static void GenericJsonl()
        {
            ExecutionParserOptions options = new ExecutionParserOptions();
            options.TextField = "delta.text";
            options.FinalField = "final.answer";
            options.SuccessField = "final.status";
            options.SuccessValue = "ok";
            HarnessRunState state = ParseLines(OutputParserEnum.GenericJsonl, new[]
            {
                "{\"delta\":{\"text\":\"Hel\"}}",
                "{\"delta\":{\"text\":\"lo\"}}",
                "{\"final\":{\"answer\":\"Hello\",\"status\":\"OK\"}}"
            }, options);
            Assert.Equal("Hello", state.AssistantText.ToString(), "Assistant text");
            Assert.Equal("Hello", state.FinalText, "Final text");
            Assert.True(state.SawSuccess, "Success value match is case-insensitive.");

            HarnessRunState failed = ParseLines(OutputParserEnum.GenericJsonl, new[] { "{\"final\":{\"answer\":\"x\",\"status\":\"error\"}}" }, options);
            Assert.True(!failed.SawSuccess && failed.DetectedFailure != null, "Non-matching success value fails.");
        }

        private static void PlainText()
        {
            HarnessRunState state = ParseLines(OutputParserEnum.PlainText, new[] { "line one", "line two" });
            Assert.Equal("line one\nline two", state.FinalText, "Final text");
            Assert.Equal(2, state.Drain().Count, "Event count");
            HarnessOutcome ok = OutcomeClassifier.Classify(new ExecutionSpec { Parser = OutputParserEnum.PlainText }, new ProcessRunResult { ExitCode = 0 }, state);
            Assert.Equal(RunStatusEnum.Succeeded, ok.Status, "Plain text success follows the exit code");
            HarnessOutcome bad = OutcomeClassifier.Classify(new ExecutionSpec { Parser = OutputParserEnum.PlainText }, new ProcessRunResult { ExitCode = 2 }, state);
            Assert.Equal(RunStatusEnum.Failed, bad.Status, "Plain text failure follows the exit code");
        }

        private static void NonJsonLines()
        {
            HarnessRunState state = ParseLines(OutputParserEnum.ClaudeStreamJson, new[] { "warning: something", "{not json", "{\"type\":\"unknown\"}" });
            List<RunEventReport> events = state.Drain();
            Assert.Equal(2, state.UnparsedLines, "Unparsed lines");
            Assert.Equal(2, events.Count(e => e.EventType == RunEventTypeEnum.Stdout), "Stdout events");
        }

        private static void RawTruncation()
        {
            HarnessRunState state = new HarnessRunState();
            state.MaxRawEventChars = 50;
            IHarnessOutputParser parser = ParserFactory.Create(OutputParserEnum.CodexJsonl);
            parser.ParseLine("{\"type\":\"thread.started\",\"thread_id\":\"" + new string('a', 200) + "\"}", state);
            RunEventReport report = state.Drain().Single();
            Assert.Equal(50, report.RawEventJson!.Length, "Raw event length");
        }

        private static void OutcomePrecedence()
        {
            HarnessRunState success = new HarnessRunState { SawSuccess = true, SawFinalResult = true };
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.ClaudeStreamJson };
            Assert.Equal(RunOutcomeEnum.Cancelled, OutcomeClassifier.Classify(spec, new ProcessRunResult { Cancelled = true, TimedOut = true }, success).Outcome, "Cancelled wins");
            Assert.Equal(RunStatusEnum.TimedOut, OutcomeClassifier.Classify(spec, new ProcessRunResult { TimedOut = true }, success).Status, "Timed out");
            Assert.Equal(RunOutcomeEnum.NotInstalled, OutcomeClassifier.Classify(spec, new ProcessRunResult { NotInstalled = true }, success).Outcome, "Not installed");
            Assert.Equal(RunOutcomeEnum.OutputLimitExceeded, OutcomeClassifier.Classify(spec, new ProcessRunResult { OutputLimitExceeded = true, ExitCode = 0 }, success).Outcome, "Output limit");
        }

        private static void OutcomeFinalEvent()
        {
            HarnessRunState success = new HarnessRunState { SawSuccess = true, SawFinalResult = true };
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.GeminiStreamJson, SuccessPolicy = SuccessPolicyEnum.FinalEvent };
            HarnessOutcome outcome = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 127 }, success);
            Assert.Equal(RunStatusEnum.Succeeded, outcome.Status, "Exit code 127 after a successful final event is still success (D-019)");
            HarnessOutcome missing = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, new HarnessRunState());
            Assert.Equal(RunStatusEnum.Failed, missing.Status, "Exit 0 without a final event is a failure");
        }

        private static void OutcomeExitCodePolicies()
        {
            HarnessRunState success = new HarnessRunState { SawSuccess = true, SawFinalResult = true };
            ExecutionSpec exitOnly = new ExecutionSpec { Parser = OutputParserEnum.ClaudeStreamJson, SuccessPolicy = SuccessPolicyEnum.ExitCode, SuccessExitCodes = new List<int> { 0, 3 } };
            Assert.Equal(RunStatusEnum.Succeeded, OutcomeClassifier.Classify(exitOnly, new ProcessRunResult { ExitCode = 3 }, new HarnessRunState()).Status, "Custom success exit code");
            ExecutionSpec both = new ExecutionSpec { Parser = OutputParserEnum.ClaudeStreamJson, SuccessPolicy = SuccessPolicyEnum.FinalEventAndExitCode };
            Assert.Equal(RunStatusEnum.Failed, OutcomeClassifier.Classify(both, new ProcessRunResult { ExitCode = 1 }, success).Status, "Both required");
            Assert.Equal(RunStatusEnum.Succeeded, OutcomeClassifier.Classify(both, new ProcessRunResult { ExitCode = 0 }, success).Status, "Both satisfied");
        }

        private static void OutcomeCredentials()
        {
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.CodexJsonl };
            HarnessOutcome outcome = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 1, StderrTail = "Error: 401 Unauthorized\n" }, new HarnessRunState());
            Assert.Equal(RunOutcomeEnum.NotCredentialed, outcome.Outcome, "401");
            HarnessOutcome login = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 1, StderrTail = "Not logged in. Please run /login\n" }, new HarnessRunState());
            Assert.Equal(RunOutcomeEnum.NotCredentialed, login.Outcome, "Not logged in");
        }

        private static void Scrubber()
        {
            SecretScrubber scrubber = new SecretScrubber(new[] { "sk-abcdef123456", "abc", "sk-abcdef" });
            Assert.Equal("key=[REDACTED] again [REDACTED]", scrubber.Scrub("key=sk-abcdef123456 again sk-abcdef123456"), "Longest value first");
            Assert.Equal("abc stays", scrubber.Scrub("abc stays"), "Values shorter than four characters are ignored");
        }

        #endregion
    }
}
