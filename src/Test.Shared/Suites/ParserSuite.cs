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
                Case("parsers", "codex-app-server-success", "Codex app-server (recorded): deltas stream as AssistantText, thread id, served model, usage", CodexAppServerSuccess),
                Case("parsers", "codex-app-server-items", "Codex app-server: reasoning, commands, MCP calls, file changes; completed items are not emitted twice", CodexAppServerItems),
                Case("parsers", "codex-app-server-usage", "Codex app-server: usage of a resumed thread counts only this run's turn; output includes reasoning", CodexAppServerUsage),
                Case("parsers", "codex-app-server-failures", "Codex app-server: failed turn, 401 credential failure, rejected request, required MCP server, retries as warnings", CodexAppServerFailures),
                Case("parsers", "mux-success", "Mux JSONL: assistant text concatenation, tools, usage", MuxSuccess),
                Case("parsers", "mux-failed", "Mux JSONL: max iterations is a failure", MuxFailed),
                Case("parsers", "mux-llm-error", "Mux JSONL: completed_with_errors plus a non-zero exit is a failure", MuxLlmError),
                Case("parsers", "mux-1.2.0-compat", "Mux 1.2.0 JSONL: no contextWindowSource warning, mcp.supported fallback, empty session id ignored", Mux120Compat),
                Case("parsers", "mux-1.3.0-success", "Mux 1.3.0 JSONL (recorded): session id, tools, usage, default context window warning", Mux130Success),
                Case("parsers", "mux-1.3.0-usage", "Mux 1.3.0 JSONL: cachedTokens, reasoningTokens, costUsd, mcp.enabled", Mux130Usage),
                Case("parsers", "mux-1.3.0-failed-401", "Mux 1.3.0 JSONL (recorded): status failed after a 401 is NotCredentialed with the error detail", Mux130Failed401),
                Case("parsers", "mux-1.3.0-unresolved-env", "Mux 1.3.0 JSONL (recorded): config_unresolved_env before the run is NotCredentialed", Mux130UnresolvedEnv),
                Case("parsers", "mux-1.3.0-failed-other", "Mux 1.3.0 JSONL: status failed without a credential error is HarnessFailed with the last error", Mux130FailedOther),
                Case("parsers", "mux-1.3.0-schema-violation", "Mux 1.3.0 JSONL (recorded): Mux's own schema rejection defers to Garrison's validation and repair", Mux130SchemaViolation),
                Case("parsers", "gemini-success", "Gemini stream-json: served model from result stats", GeminiSuccess),
                Case("parsers", "opencode-success", "opencode 1.19.5 JSON (recorded): last step's text, tool call and result, summed usage and cost, session id", OpenCodeSuccess),
                Case("parsers", "opencode-failures", "opencode JSON: 401 and missing key are NotCredentialed, length finish and missing final step fail, failed tools", OpenCodeFailures),
                Case("parsers", "pi-success", "pi 1.4.0 JSON (recorded): streamed text, tools, usage, served model, session id; system prompt ignored", PiSuccess),
                Case("parsers", "pi-failures", "pi JSON: 401 with exit 0 is NotCredentialed, retries recover, length and abort fail, agent_end fallback", PiFailures),
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

        private static void CodexAppServerSuccess()
        {
            HarnessRunState state = Parse(OutputParserEnum.CodexAppServer, "codex-app-server/success.jsonl");
            List<RunEventReport> events = state.Drain();
            Assert.True(state.SawSuccess && state.SawFinalResult, "Expected success.");
            Assert.True(state.DetectedFailure == null, "Unexpected failure: " + state.DetectedFailure);
            List<RunEventReport> text = events.Where(e => e.EventType == RunEventTypeEnum.AssistantText).ToList();
            Assert.True(text.Count > 1, "The answer streams as several AssistantText events, got " + text.Count);
            Assert.Equal(state.FinalText, String.Concat(text.Select(e => e.Text)), "Deltas add up to the final message");
            Assert.True(!String.IsNullOrEmpty(state.SessionId), "Thread id");
            Assert.True(!String.IsNullOrEmpty(state.ServedModel), "Served model from thread/start");
            Assert.True(state.InputTokens > 0 && state.OutputTokens > 0, "Usage from thread/tokenUsage/updated");
            Assert.True(state.CachedTokens <= state.InputTokens, "Cached tokens");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Usage), "Usage event");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Result), "Result event");
            Assert.Equal(0, state.UnparsedLines, "Every line is JSON");
        }

        private static void CodexAppServerItems()
        {
            HarnessRunState state = ParseLines(OutputParserEnum.CodexAppServer, new[]
            {
                "{\"id\":2,\"result\":{\"thread\":{\"id\":\"thr_1\",\"model\":\"gpt-test\"},\"model\":\"gpt-test\"}}",
                "{\"method\":\"item/started\",\"params\":{\"item\":{\"type\":\"reasoning\",\"id\":\"rs_1\",\"summary\":[],\"content\":[]}}}",
                "{\"method\":\"item/reasoning/summaryTextDelta\",\"params\":{\"itemId\":\"rs_1\",\"delta\":\"Plan \"}}",
                "{\"method\":\"item/reasoning/summaryTextDelta\",\"params\":{\"itemId\":\"rs_1\",\"delta\":\"first.\"}}",
                "{\"method\":\"item/completed\",\"params\":{\"item\":{\"type\":\"reasoning\",\"id\":\"rs_1\",\"summary\":[\"Plan first.\"],\"content\":[]}}}",
                "{\"method\":\"item/completed\",\"params\":{\"item\":{\"type\":\"reasoning\",\"id\":\"rs_2\",\"summary\":[\"Unstreamed thought.\"],\"content\":[]}}}",
                "{\"method\":\"item/completed\",\"params\":{\"item\":{\"type\":\"agentMessage\",\"id\":\"msg_0\",\"text\":\"Looking around.\",\"phase\":\"commentary\"}}}",
                "{\"method\":\"item/started\",\"params\":{\"item\":{\"type\":\"commandExecution\",\"id\":\"c1\",\"command\":\"ls\",\"status\":\"inProgress\"}}}",
                "{\"method\":\"item/completed\",\"params\":{\"item\":{\"type\":\"commandExecution\",\"id\":\"c1\",\"command\":\"ls\",\"status\":\"completed\",\"exitCode\":0,\"aggregatedOutput\":\"README.md\"}}}",
                "{\"method\":\"item/started\",\"params\":{\"item\":{\"type\":\"commandExecution\",\"id\":\"c2\",\"command\":\"false\",\"status\":\"inProgress\"}}}",
                "{\"method\":\"item/completed\",\"params\":{\"item\":{\"type\":\"commandExecution\",\"id\":\"c2\",\"command\":\"false\",\"status\":\"failed\",\"exitCode\":1,\"aggregatedOutput\":\"\"}}}",
                "{\"method\":\"item/started\",\"params\":{\"item\":{\"type\":\"mcpToolCall\",\"id\":\"m1\",\"server\":\"garrison\",\"tool\":\"garrison_list_agents\",\"status\":\"inProgress\",\"arguments\":{\"limit\":5}}}}",
                "{\"method\":\"item/completed\",\"params\":{\"item\":{\"type\":\"mcpToolCall\",\"id\":\"m1\",\"server\":\"garrison\",\"tool\":\"garrison_list_agents\",\"status\":\"completed\",\"arguments\":{\"limit\":5},\"result\":{\"content\":[{\"type\":\"text\",\"text\":\"two agents\"}],\"structuredContent\":null},\"error\":null}}}",
                "{\"method\":\"item/completed\",\"params\":{\"item\":{\"type\":\"fileChange\",\"id\":\"f1\",\"status\":\"completed\",\"changes\":[{\"path\":\"a.txt\",\"kind\":{\"type\":\"add\"},\"diff\":\"+x\"}]}}}",
                "{\"method\":\"item/agentMessage/delta\",\"params\":{\"itemId\":\"msg_1\",\"delta\":\"Done\"}}",
                "{\"method\":\"item/agentMessage/delta\",\"params\":{\"itemId\":\"msg_1\",\"delta\":\".\"}}",
                "{\"method\":\"item/completed\",\"params\":{\"item\":{\"type\":\"agentMessage\",\"id\":\"msg_1\",\"text\":\"Done.\",\"phase\":\"final_answer\"}}}",
                "{\"method\":\"turn/completed\",\"params\":{\"threadId\":\"thr_1\",\"turn\":{\"id\":\"t1\",\"status\":\"completed\",\"error\":null}}}"
            });
            List<RunEventReport> events = state.Drain();
            List<RunEventReport> thinking = events.Where(e => e.EventType == RunEventTypeEnum.Thinking).ToList();
            Assert.Equal("Plan |first.|Unstreamed thought.", String.Join("|", thinking.Select(e => e.Text)), "Streamed reasoning once, unstreamed reasoning from the item");
            List<RunEventReport> text = events.Where(e => e.EventType == RunEventTypeEnum.AssistantText).ToList();
            Assert.Equal("Looking around.|Done|.", String.Join("|", text.Select(e => e.Text)), "Unstreamed message once, streamed message as deltas only");
            Assert.Equal("Looking around.\nDone.", state.AssistantText.ToString(), "Messages joined by a newline");
            Assert.Equal("Done.", state.FinalText, "Final text is the last message");
            Assert.Equal(3, events.Count(e => e.EventType == RunEventTypeEnum.ToolCall), "Tool calls: two commands and one MCP call");
            RunEventReport ok = Assert.NotNull(events.FirstOrDefault(e => e.EventType == RunEventTypeEnum.ToolResult && e.ToolCallId == "c1"), "ls result");
            Assert.True(ok.Success == true && ok.ToolName == "shell" && ok.Text == "README.md", "ls result fields");
            RunEventReport failed = Assert.NotNull(events.FirstOrDefault(e => e.EventType == RunEventTypeEnum.ToolResult && e.ToolCallId == "c2"), "false result");
            Assert.True(failed.Success == false, "Failed command");
            RunEventReport mcpCall = Assert.NotNull(events.FirstOrDefault(e => e.EventType == RunEventTypeEnum.ToolCall && e.ToolCallId == "m1"), "MCP call");
            Assert.Equal("garrison.garrison_list_agents", mcpCall.ToolName, "MCP tool name");
            Assert.Equal("{\"limit\":5}", mcpCall.Text, "MCP arguments");
            RunEventReport mcpResult = Assert.NotNull(events.FirstOrDefault(e => e.EventType == RunEventTypeEnum.ToolResult && e.ToolCallId == "m1"), "MCP result");
            Assert.True(mcpResult.Success == true && mcpResult.Text == "two agents", "MCP result text");
            RunEventReport file = Assert.NotNull(events.FirstOrDefault(e => e.EventType == RunEventTypeEnum.ToolResult && e.ToolName == "file_change"), "File change");
            Assert.Equal("add a.txt", file.Text, "File change summary");
            Assert.Equal("gpt-test", state.ServedModel, "Served model");
            Assert.Equal("thr_1", state.SessionId, "Session id");
        }

        private static void CodexAppServerUsage()
        {
            // A resumed thread: the first update already carries 1000 input tokens from the earlier turn.
            HarnessRunState state = ParseLines(OutputParserEnum.CodexAppServer, new[]
            {
                "{\"method\":\"thread/tokenUsage/updated\",\"params\":{\"tokenUsage\":{\"total\":{\"totalTokens\":1180,\"inputTokens\":1150,\"cachedInputTokens\":540,\"outputTokens\":30,\"reasoningOutputTokens\":14},\"last\":{\"totalTokens\":180,\"inputTokens\":150,\"cachedInputTokens\":40,\"outputTokens\":30,\"reasoningOutputTokens\":4}}}}",
                "{\"method\":\"thread/tokenUsage/updated\",\"params\":{\"tokenUsage\":{\"total\":{\"totalTokens\":1400,\"inputTokens\":1350,\"cachedInputTokens\":640,\"outputTokens\":50,\"reasoningOutputTokens\":20},\"last\":{\"totalTokens\":220,\"inputTokens\":200,\"cachedInputTokens\":100,\"outputTokens\":20,\"reasoningOutputTokens\":6}}}}",
                "{\"method\":\"turn/completed\",\"params\":{\"turn\":{\"id\":\"t1\",\"status\":\"completed\"}}}"
            });
            Assert.Equal(350L, state.InputTokens, "Input tokens of this turn (two calls)");
            Assert.Equal(140L, state.CachedTokens, "Cached tokens of this turn");
            Assert.Equal(10L, state.ReasoningTokens, "Reasoning tokens of this turn");
            Assert.Equal(60L, state.OutputTokens, "Output tokens include reasoning, like exec mode");
            RunEventReport usage = Assert.NotNull(state.Drain().FirstOrDefault(e => e.EventType == RunEventTypeEnum.Usage), "One usage event at turn end");
            Assert.Equal(350L, usage.InputTokens, "Usage event input");
        }

        private static void CodexAppServerFailures()
        {
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.CodexAppServer, SuccessPolicy = SuccessPolicyEnum.FinalEvent };

            HarnessRunState unauthorized = ParseLines(OutputParserEnum.CodexAppServer, new[]
            {
                "{\"method\":\"error\",\"params\":{\"error\":{\"message\":\"Reconnecting... 2/5\",\"codexErrorInfo\":{\"responseStreamDisconnected\":{\"httpStatusCode\":401}},\"additionalDetails\":\"auth error code: invalid_api_key\"},\"willRetry\":true}}",
                "{\"method\":\"turn/completed\",\"params\":{\"turn\":{\"id\":\"t1\",\"status\":\"failed\",\"error\":{\"message\":\"unexpected status 401 Unauthorized\",\"codexErrorInfo\":{\"httpConnectionFailed\":{\"httpStatusCode\":401}}}}}}"
            });
            List<RunEventReport> events = unauthorized.Drain();
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Warning && e.Text != null && e.Text.Contains("Reconnecting", StringComparison.Ordinal)), "A retried error is a warning");
            HarnessOutcome credential = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, unauthorized);
            Assert.Equal(RunOutcomeEnum.NotCredentialed, credential.Outcome, "401 is NotCredentialed");

            HarnessRunState failed = ParseLines(OutputParserEnum.CodexAppServer, new[]
            {
                "{\"method\":\"error\",\"params\":{\"error\":{\"message\":\"stream disconnected\",\"codexErrorInfo\":\"other\"},\"willRetry\":false}}",
                "{\"method\":\"turn/completed\",\"params\":{\"turn\":{\"id\":\"t1\",\"status\":\"failed\",\"error\":{\"message\":\"stream disconnected before completion\",\"codexErrorInfo\":\"other\"}}}}"
            });
            HarnessOutcome harness = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, failed);
            Assert.Equal(RunOutcomeEnum.HarnessFailed, harness.Outcome, "Failed turn");
            Assert.Equal("stream disconnected before completion", harness.ErrorMessage, "Failure message");

            HarnessRunState interrupted = ParseLines(OutputParserEnum.CodexAppServer, new[] { "{\"method\":\"turn/completed\",\"params\":{\"turn\":{\"id\":\"t1\",\"status\":\"interrupted\",\"error\":null}}}" });
            Assert.True(!interrupted.SawSuccess && interrupted.DetectedFailure == "Turn was interrupted.", "Interrupted turn");

            HarnessRunState rejected = ParseLines(OutputParserEnum.CodexAppServer, new[] { "{\"id\":3,\"error\":{\"code\":-32600,\"message\":\"no rollout found for thread id x\"}}" });
            Assert.True(rejected.DetectedFailure != null && rejected.DetectedFailure.Contains("no rollout found", StringComparison.Ordinal), "Rejected request fails the run");
            Assert.Equal(RunOutcomeEnum.HarnessFailed, OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, rejected).Outcome, "Rejected request outcome");

            IHarnessOutputParser parser = ParserFactory.Create(OutputParserEnum.CodexAppServer, null, new[] { "docs" });
            HarnessRunState mcp = new HarnessRunState();
            parser.ParseLine("{\"method\":\"mcpServer/startupStatus/updated\",\"params\":{\"name\":\"extra\",\"status\":\"failed\",\"error\":\"handshake failed\"}}", mcp);
            Assert.True(mcp.DetectedFailure == null, "An optional MCP server only warns");
            parser.ParseLine("{\"method\":\"mcpServer/startupStatus/updated\",\"params\":{\"name\":\"docs\",\"status\":\"failed\",\"error\":\"handshake failed\"}}", mcp);
            parser.ParseLine("{\"method\":\"turn/completed\",\"params\":{\"turn\":{\"id\":\"t1\",\"status\":\"completed\"}}}", mcp);
            parser.Complete(mcp);
            Assert.True(mcp.DetectedFailure != null && mcp.DetectedFailure.Contains("docs", StringComparison.Ordinal), "A required MCP server that fails fails the run");
            Assert.Equal(RunStatusEnum.Failed, OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, mcp).Status, "Required MCP failure outcome");

            HarnessRunState exited = ParseLines(OutputParserEnum.CodexAppServer, new[] { "{\"method\":\"error\",\"params\":{\"error\":{\"message\":\"fatal\"},\"willRetry\":false}}" });
            Assert.Equal("fatal", exited.DetectedFailure, "The last error explains a run that ended without turn/completed");
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
            Assert.Equal(RunOutcomeEnum.NotCredentialed, failed.Outcome, "A 401 from the model is NotCredentialed");
            HarnessOutcome ok = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, state);
            Assert.Equal(RunStatusEnum.Succeeded, ok.Status, "completed_with_errors with exit 0 still succeeds (tool errors the model recovered from)");
        }

        private static void Mux120Compat()
        {
            HarnessRunState state = Parse(OutputParserEnum.MuxJsonl, "mux/success.jsonl");
            List<RunEventReport> events = state.Drain();
            Assert.True(!events.Any(e => e.EventType == RunEventTypeEnum.Warning), "Mux 1.2.0 has no contextWindowSource, so no warning");
            Assert.Equal("ms-1", state.SessionId, "Session id");
            Assert.Equal(0L, state.CachedTokens, "No cachedTokens in 1.2.0");
            Assert.True(state.CostUsd == null, "No costUsd in 1.2.0");

            HarnessRunState stateless = ParseLines(OutputParserEnum.MuxJsonl, new[]
            {
                "{\"contractVersion\":2,\"eventType\":\"run_started\",\"sessionId\":\"\",\"model\":\"m\",\"mcp\":{\"supported\":true,\"configured\":true,\"serverCount\":1}}",
                "{\"contractVersion\":2,\"eventType\":\"run_completed\",\"sessionId\":\"\",\"status\":\"completed\"}"
            });
            Assert.True(stateless.SessionId == null, "An empty sessionId (stateless print run) is not a session");
            Assert.True(stateless.Drain().Any(e => e.EventType == RunEventTypeEnum.Lifecycle && e.Text != null && e.Text.Contains("MCP enabled with 1 server")), "mcp.supported is the fallback for mcp.enabled");

            IHarnessOutputParser parser = ParserFactory.Create(OutputParserEnum.MuxJsonl, null, new[] { "garrison" });
            HarnessRunState noMcp = new HarnessRunState();
            parser.ParseLine("{\"contractVersion\":2,\"eventType\":\"run_started\",\"model\":\"m\",\"mcp\":{\"supported\":false,\"configured\":false,\"serverCount\":0}}", noMcp);
            Assert.True(noMcp.DetectedFailure != null && noMcp.DetectedFailure.Contains("garrison"), "A required MCP server with MCP disabled fails the run");
        }

        private static void Mux130Success()
        {
            HarnessRunState state = Parse(OutputParserEnum.MuxJsonl, "mux/v1.3.0-success.jsonl");
            List<RunEventReport> events = state.Drain();
            Assert.True(state.SawSuccess && state.SawFinalResult, "Expected success.");
            Assert.True(state.DetectedFailure == null, "Unexpected failure: " + state.DetectedFailure);
            Assert.Equal("run_g20test01", state.SessionId, "Session id from --session-id");
            Assert.Equal("gpt-oss:20b", state.ServedModel, "Model");
            Assert.Equal("{\"answer\":\"noted\",\"color\":\"blue\"}", state.FinalText, "Final text");
            Assert.Equal(6449L, state.InputTokens, "Input tokens");
            Assert.Equal(694L, state.OutputTokens, "Output tokens");
            Assert.Equal(0L, state.CachedTokens, "Cached tokens");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.ToolResult && e.ToolName == "remember" && e.Success == true), "Tool result");
            RunEventReport? warning = events.FirstOrDefault(e => e.EventType == RunEventTypeEnum.Warning);
            Assert.True(warning != null && warning.Text != null && warning.Text.Contains("32768") && warning.Text.Contains("contextWindow"), "Default context window warning");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Lifecycle && e.Text != null && e.Text.Contains("MCP not enabled")), "mcp.enabled false is reported");

            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.MuxJsonl, SuccessPolicy = SuccessPolicyEnum.FinalEventAndExitCode };
            Assert.Equal(RunStatusEnum.Succeeded, OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, state).Status, "Succeeded");
        }

        private static void Mux130Usage()
        {
            HarnessRunState state = ParseLines(OutputParserEnum.MuxJsonl, new[]
            {
                "{\"contractVersion\":2,\"eventType\":\"run_started\",\"sessionId\":\"s1\",\"model\":\"gpt-5.5-mini\",\"contextWindow\":131072,\"contextWindowSource\":\"endpoint\",\"mcp\":{\"enabled\":true,\"supported\":false,\"configured\":true,\"serverCount\":2}}",
                "{\"contractVersion\":2,\"eventType\":\"assistant_text\",\"text\":\"OK\"}",
                "{\"contractVersion\":2,\"eventType\":\"run_completed\",\"sessionId\":\"s1\",\"status\":\"completed\",\"usage\":{\"inputTokens\":1234,\"outputTokens\":567,\"cachedTokens\":512,\"reasoningTokens\":64,\"totalTokens\":1801,\"estimatedTokens\":1750,\"costUsd\":0.008237}}"
            });
            List<RunEventReport> events = state.Drain();
            Assert.Equal(1234L, state.InputTokens, "Input tokens");
            Assert.Equal(567L, state.OutputTokens, "Output tokens");
            Assert.Equal(512L, state.CachedTokens, "Cached tokens");
            Assert.Equal(64L, state.ReasoningTokens, "Reasoning tokens");
            Assert.True(state.CostUsd.HasValue && Math.Abs(state.CostUsd.Value - 0.008237) < 0.0000001, "Cost");
            Assert.True(!events.Any(e => e.EventType == RunEventTypeEnum.Warning), "contextWindowSource endpoint produces no warning");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Lifecycle && e.Text != null && e.Text.Contains("MCP enabled with 2 servers")), "mcp.enabled wins over the deprecated supported");

            HarnessRunState cli = ParseLines(OutputParserEnum.MuxJsonl, new[] { "{\"contractVersion\":2,\"eventType\":\"run_started\",\"contextWindow\":131072,\"contextWindowSource\":\"cli\"}" });
            Assert.True(!cli.Drain().Any(e => e.EventType == RunEventTypeEnum.Warning), "contextWindowSource cli produces no warning");
        }

        private static void Mux130Failed401()
        {
            HarnessRunState state = Parse(OutputParserEnum.MuxJsonl, "mux/v1.3.0-llm-401.jsonl");
            Assert.True(!state.SawSuccess && state.SawFinalResult, "status failed is not success");
            Assert.True(state.CredentialFailure != null && state.CredentialFailure.Contains("401"), "A 401 from the model request is a credential failure");
            Assert.True(state.DetectedFailure != null && state.DetectedFailure.Contains("401"), "Failure detail is the last error message: " + state.DetectedFailure);
            Assert.True(state.SessionId == null, "Empty session id");
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.MuxJsonl, SuccessPolicy = SuccessPolicyEnum.FinalEventAndExitCode };
            HarnessOutcome outcome = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 1 }, state);
            Assert.Equal(RunOutcomeEnum.NotCredentialed, outcome.Outcome, "Outcome");
            Assert.True(outcome.ErrorMessage != null && outcome.ErrorMessage.Contains("401"), "Message carries the error detail");
        }

        private static void Mux130UnresolvedEnv()
        {
            HarnessRunState state = Parse(OutputParserEnum.MuxJsonl, "mux/v1.3.0-config-unresolved-env.jsonl");
            Assert.True(!state.SawFinalResult, "No run_completed before the run starts");
            Assert.True(state.CredentialFailure != null, "config_unresolved_env is a credential configuration failure");
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.MuxJsonl, SuccessPolicy = SuccessPolicyEnum.FinalEventAndExitCode };
            HarnessOutcome outcome = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 1 }, state);
            Assert.Equal(RunOutcomeEnum.NotCredentialed, outcome.Outcome, "Outcome");
            Assert.True(outcome.ErrorMessage != null && outcome.ErrorMessage.Contains("GARRISON_MUX_API_KEY_MISSING"), "Message names the variable");
        }

        private static void Mux130FailedOther()
        {
            HarnessRunState state = ParseLines(OutputParserEnum.MuxJsonl, new[]
            {
                "{\"contractVersion\":2,\"eventType\":\"run_started\",\"model\":\"m\"}",
                "{\"contractVersion\":2,\"eventType\":\"tool_call_completed\",\"toolCallId\":\"c1\",\"toolName\":\"web_retrieve\",\"result\":{\"success\":false,\"content\":\"HTTP 401 from example.com\"}}",
                "{\"contractVersion\":2,\"eventType\":\"error\",\"code\":\"tool_error\",\"errorCode\":\"tool_error\",\"failureCategory\":\"runtime\",\"message\":\"web_retrieve failed with status 401\"}",
                "{\"contractVersion\":2,\"eventType\":\"error\",\"code\":\"llm_stream_error\",\"errorCode\":\"llm_stream_error\",\"failureCategory\":\"backend\",\"message\":\"The response stream ended early.\"}",
                "{\"contractVersion\":2,\"eventType\":\"run_completed\",\"status\":\"failed\"}"
            });
            Assert.True(state.CredentialFailure == null, "A tool's 401 is not a Mux credential failure");
            Assert.Equal("Mux run failed: The response stream ended early.", state.DetectedFailure, "Last error message is the detail");
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.MuxJsonl, SuccessPolicy = SuccessPolicyEnum.FinalEventAndExitCode };
            HarnessOutcome outcome = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 1 }, state);
            Assert.Equal(RunOutcomeEnum.HarnessFailed, outcome.Outcome, "Outcome");
            Assert.Equal("Mux run failed: The response stream ended early.", outcome.ErrorMessage, "Message");
        }

        private static void Mux130SchemaViolation()
        {
            HarnessRunState state = Parse(OutputParserEnum.MuxJsonl, "mux/v1.3.0-schema-violation.jsonl");
            List<RunEventReport> events = state.Drain();
            Assert.True(state.HarnessRejectedOutputSchema, "schema_validation_failed is recorded");
            Assert.True(state.DetectedFailure == null, "Not a harness failure");
            Assert.Equal("run_stub1", state.SessionId, "Session id kept for the repair");
            Assert.Equal("hello, this is not JSON", state.BestText(), "Output text is kept for validation");
            Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Warning && e.Text != null && e.Text.Contains("--output-schema")), "Warning event");
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.MuxJsonl, SuccessPolicy = SuccessPolicyEnum.FinalEventAndExitCode };
            Assert.Equal(RunStatusEnum.Succeeded, OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 1 }, state).Status, "Exit 1 from the schema check alone defers to Garrison");
            Assert.Equal(RunStatusEnum.Failed, OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = null, TimedOut = false }, state).Status, "No exit code is still a failure");
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

        private static void OpenCodeSuccess()
        {
            HarnessRunState state = Parse(OutputParserEnum.OpenCodeJsonl, "opencode/v1.19.5-success.jsonl");
            List<RunEventReport> events = state.Drain();
            Assert.True(state.SawSuccess && state.SawFinalResult && state.DetectedFailure == null, "Expected success: " + state.DetectedFailure);
            Assert.Equal("FIXTURE_ANSWER_42", state.FinalText, "The answer is the text of the last step only");
            Assert.Equal("Running a command.\nFIXTURE_ANSWER_42", state.AssistantText.ToString(), "Assistant text keeps every step");
            Assert.True(state.SessionId != null && state.SessionId.StartsWith("ses_", StringComparison.Ordinal), "Session id: " + state.SessionId);
            Assert.Equal(240L, state.InputTokens, "Input tokens summed over steps");
            Assert.Equal(38L, state.OutputTokens, "Output tokens summed over steps");
            Assert.Equal(14L, state.CachedTokens, "Cache reads summed over steps");
            Assert.True(state.CostUsd.HasValue && Math.Abs(state.CostUsd.Value - 0.0012942) < 1e-9, "Cost summed over steps: " + state.CostUsd);
            Assert.Equal(2, events.Count(e => e.EventType == RunEventTypeEnum.Usage), "One usage event per step");
            RunEventReport call = events.Single(e => e.EventType == RunEventTypeEnum.ToolCall);
            Assert.Equal("bash", call.ToolName, "Tool name");
            Assert.Equal("toolu_fixture1", call.ToolCallId, "Tool call id");
            Assert.True(call.Text != null && call.Text.Contains("echo fixture-tool-output", StringComparison.Ordinal), "Tool input");
            RunEventReport result = events.Single(e => e.EventType == RunEventTypeEnum.ToolResult);
            Assert.True(result.Success == true && result.ToolCallId == "toolu_fixture1" && result.Text == "fixture-tool-output\n", "Tool result");
            Assert.Equal(1, events.Count(e => e.EventType == RunEventTypeEnum.Result), "One result event");
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.OpenCodeJsonl, SuccessPolicy = SuccessPolicyEnum.FinalEventAndExitCode };
            Assert.Equal(RunStatusEnum.Succeeded, OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, state).Status, "Succeeded with exit 0");
        }

        private static void OpenCodeFailures()
        {
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.OpenCodeJsonl, SuccessPolicy = SuccessPolicyEnum.FinalEventAndExitCode };

            HarnessRunState unauthorized = Parse(OutputParserEnum.OpenCodeJsonl, "opencode/v1.19.5-api-401.jsonl");
            HarnessOutcome outcome = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 1 }, unauthorized);
            Assert.Equal(RunOutcomeEnum.NotCredentialed, outcome.Outcome, "A 401 APIError is NotCredentialed");
            Assert.True(outcome.ErrorMessage != null && outcome.ErrorMessage.Contains("invalid x-api-key", StringComparison.Ordinal), "Error detail: " + outcome.ErrorMessage);
            Assert.True(unauthorized.Drain().Any(e => e.EventType == RunEventTypeEnum.Error), "Error event");

            HarnessRunState missing = Parse(OutputParserEnum.OpenCodeJsonl, "opencode/v1.19.5-missing-key.jsonl");
            Assert.Equal(RunOutcomeEnum.NotCredentialed, OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 1 }, missing).Outcome, "ProviderAuthError is NotCredentialed");

            HarnessRunState length = ParseLines(OutputParserEnum.OpenCodeJsonl, new[]
            {
                "{\"type\":\"text\",\"sessionID\":\"ses_a\",\"part\":{\"type\":\"text\",\"messageID\":\"msg_1\",\"text\":\"partial\",\"time\":{\"start\":1,\"end\":2}}}",
                "{\"type\":\"step_finish\",\"sessionID\":\"ses_a\",\"part\":{\"type\":\"step-finish\",\"reason\":\"length\",\"messageID\":\"msg_1\",\"tokens\":{\"input\":5,\"output\":9,\"reasoning\":3,\"cache\":{\"read\":0,\"write\":0}},\"cost\":0}}"
            });
            Assert.Equal(RunOutcomeEnum.HarnessFailed, OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, length).Outcome, "Finish reason length fails the run");
            Assert.Equal(12L, length.OutputTokens, "Output tokens include reasoning tokens");
            Assert.Equal(3L, length.ReasoningTokens, "Reasoning tokens");

            HarnessRunState unfinished = ParseLines(OutputParserEnum.OpenCodeJsonl, new[]
            {
                "{\"type\":\"tool_use\",\"sessionID\":\"ses_b\",\"part\":{\"type\":\"tool\",\"tool\":\"read\",\"callID\":\"call_1\",\"state\":{\"status\":\"error\",\"input\":{\"filePath\":\"/missing\"},\"error\":\"File not found\",\"time\":{\"start\":1,\"end\":2}}}}",
                "{\"type\":\"step_finish\",\"sessionID\":\"ses_b\",\"part\":{\"type\":\"step-finish\",\"reason\":\"tool-calls\",\"tokens\":{\"input\":1,\"output\":1,\"reasoning\":0,\"cache\":{\"read\":0,\"write\":0}},\"cost\":0}}"
            });
            List<RunEventReport> events = unfinished.Drain();
            RunEventReport failedTool = events.Single(e => e.EventType == RunEventTypeEnum.ToolResult);
            Assert.True(failedTool.Success == false && failedTool.Text == "File not found", "A failed tool is an unsuccessful tool result");
            Assert.True(!unfinished.SawFinalResult && !unfinished.SawSuccess, "A tool-calls step is not a final event");
            Assert.Equal(RunStatusEnum.Failed, OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, unfinished).Status, "No final step is a failure");
        }

        private static void PiSuccess()
        {
            HarnessRunState state = Parse(OutputParserEnum.PiJsonl, "pi/v1.4.0-success.jsonl");
            List<RunEventReport> events = state.Drain();
            Assert.True(state.SawSuccess && state.SawFinalResult && state.DetectedFailure == null, "Expected success: " + state.DetectedFailure);
            Assert.Equal("FIXTURE_ANSWER_42", state.FinalText, "The answer is the last assistant message");
            Assert.Equal("Running a command.\nFIXTURE_ANSWER_42", state.AssistantText.ToString(), "Assistant text from deltas, one message per line");
            Assert.True(state.SessionId != null && state.SessionId.StartsWith("01a18633", StringComparison.Ordinal), "Session id from the header: " + state.SessionId);
            Assert.Equal("claude-sonnet-4-5", state.ServedModel, "Served model");
            Assert.Equal(240L, state.InputTokens, "Input tokens");
            Assert.Equal(38L, state.OutputTokens, "Output tokens");
            Assert.Equal(14L, state.CachedTokens, "Cache reads");
            Assert.True(state.CostUsd.HasValue && Math.Abs(state.CostUsd.Value - 0.0012942) < 1e-9, "Cost: " + state.CostUsd);
            Assert.True(!events.Any(e => e.Text != null && e.Text.Contains("expert coding assistant", StringComparison.Ordinal)), "The system message is not reported");
            Assert.Equal(2, events.Count(e => e.EventType == RunEventTypeEnum.AssistantText), "One text delta per message");
            RunEventReport call = events.Single(e => e.EventType == RunEventTypeEnum.ToolCall);
            Assert.True(call.ToolName == "bash" && call.ToolCallId == "toolu_fixture1" && call.Text != null && call.Text.Contains("echo fixture-tool-output", StringComparison.Ordinal), "Tool call");
            RunEventReport result = events.Single(e => e.EventType == RunEventTypeEnum.ToolResult);
            Assert.True(result.Success == true && result.Text == "fixture-tool-output\n", "Tool result");
            Assert.Equal(1, events.Count(e => e.EventType == RunEventTypeEnum.Result), "One result event");
        }

        private static void PiFailures()
        {
            ExecutionSpec spec = new ExecutionSpec { Parser = OutputParserEnum.PiJsonl, SuccessPolicy = SuccessPolicyEnum.FinalEventAndExitCode };
            string settled = "{\"type\":\"agent_settled\",\"aborted\":false}";

            HarnessRunState unauthorized = Parse(OutputParserEnum.PiJsonl, "pi/v1.4.0-api-401.jsonl");
            HarnessOutcome outcome = OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, unauthorized);
            Assert.Equal(RunOutcomeEnum.NotCredentialed, outcome.Outcome, "pi exits 0 after a 401; the stop reason makes it NotCredentialed");

            HarnessRunState retried = ParseLines(OutputParserEnum.PiJsonl, new[]
            {
                "{\"type\":\"session\",\"version\":3,\"id\":\"s1\",\"cwd\":\"/work\"}",
                PiAssistant(String.Empty, "error", "529 overloaded"),
                "{\"type\":\"auto_retry_start\",\"attempt\":1,\"maxAttempts\":3,\"delayMs\":2000,\"errorMessage\":\"529 overloaded\"}",
                PiAssistant("Recovered", "stop", null),
                "{\"type\":\"auto_retry_end\",\"success\":true,\"attempt\":2}",
                settled
            });
            Assert.True(retried.SawSuccess && retried.DetectedFailure == null, "A retried error that recovers succeeds");
            Assert.Equal("Recovered", retried.FinalText, "Final text after the retry");
            Assert.True(retried.Drain().Any(e => e.EventType == RunEventTypeEnum.Warning && e.Text != null && e.Text.Contains("529 overloaded", StringComparison.Ordinal)), "Retry warning");

            HarnessRunState length = ParseLines(OutputParserEnum.PiJsonl, new[] { PiAssistant("cut", "length", null), settled });
            Assert.Equal(RunOutcomeEnum.HarnessFailed, OutcomeClassifier.Classify(spec, new ProcessRunResult { ExitCode = 0 }, length).Outcome, "Stop reason length fails the run");

            HarnessRunState aborted = ParseLines(OutputParserEnum.PiJsonl, new[] { PiAssistant("x", "stop", null), "{\"type\":\"agent_settled\",\"aborted\":true}" });
            Assert.True(!aborted.SawSuccess && aborted.DetectedFailure != null, "An aborted run fails");

            HarnessRunState noSettle = ParseLines(OutputParserEnum.PiJsonl, new[] { PiAssistant("Done", "stop", null), "{\"type\":\"agent_end\",\"messages\":[],\"willRetry\":false}" });
            Assert.True(noSettle.SawSuccess && noSettle.FinalText == "Done", "Without agent_settled the last assistant message decides at the end of output");

            HarnessRunState empty = ParseLines(OutputParserEnum.PiJsonl, new[] { "{\"type\":\"session\",\"version\":3,\"id\":\"s2\",\"cwd\":\"/work\"}" });
            Assert.True(!empty.SawSuccess && !empty.SawFinalResult, "No assistant message is no final result");

            HarnessRunState thinking = ParseLines(OutputParserEnum.PiJsonl, new[] { "{\"type\":\"message_update\",\"assistantMessageEvent\":{\"type\":\"thinking_delta\",\"contentIndex\":0,\"delta\":\"hmm\"}}" });
            Assert.True(thinking.Drain().Any(e => e.EventType == RunEventTypeEnum.Thinking && e.Text == "hmm"), "Thinking deltas");
        }

        private static string PiAssistant(string text, string stopReason, string? errorMessage)
        {
            string error = errorMessage == null ? String.Empty : ",\"errorMessage\":\"" + errorMessage + "\"";
            return "{\"type\":\"message_end\",\"message\":{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"" + text + "\"}],\"model\":\"m\",\"usage\":{\"input\":1,\"output\":2,\"cacheRead\":0,\"cost\":{\"total\":0}},\"stopReason\":\"" + stopReason + "\"" + error + "}}";
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
