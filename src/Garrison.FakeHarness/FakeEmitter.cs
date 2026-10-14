namespace Garrison.FakeHarness
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Text.Json;
    using System.Threading;

    /// <summary>
    /// Writes harness-shaped event streams to stdout.
    /// </summary>
    public class FakeEmitter
    {
        #region Public-Members

        /// <summary>
        /// Session identifier reported in the stream.
        /// </summary>
        public string SessionId
        {
            get
            {
                return _SessionId;
            }
        }

        #endregion

        #region Private-Members

        private readonly FakeOptions _Options;
        private readonly string _SessionId;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="options">Options.</param>
        public FakeEmitter(FakeOptions options) : this(options, Guid.NewGuid().ToString())
        {
        }

        /// <summary>
        /// Instantiate with a known session identifier (used when resuming a session).
        /// </summary>
        /// <param name="options">Options.</param>
        /// <param name="sessionId">Session identifier reported in the stream.</param>
        public FakeEmitter(FakeOptions options, string sessionId)
        {
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _SessionId = String.IsNullOrEmpty(sessionId) ? Guid.NewGuid().ToString() : sessionId;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Emit the start of the stream.
        /// </summary>
        public void Start()
        {
            switch (_Options.Format)
            {
                case "claude":
                    Line(new { type = "system", subtype = "init", session_id = _SessionId, model = "fake-model", tools = new string[0], mcp_servers = new object[0] });
                    break;
                case "codex":
                    Line(new { type = "thread.started", thread_id = _SessionId });
                    Line(new { type = "turn.started" });
                    break;
                case "mux":
                    Line(new { contractVersion = 2, eventType = "run_started", timestampUtc = DateTime.UtcNow, runId = "fake", sessionId = _SessionId, model = "fake-model" });
                    break;
                default:
                    break;
            }
        }

        /// <summary>
        /// Emit a filler line.
        /// </summary>
        /// <param name="index">Line index.</param>
        public void Filler(int index)
        {
            string text = index.ToString("D6") + new string('x', 94);
            switch (_Options.Format)
            {
                case "claude":
                    Line(new { type = "stream_event", @event = new { type = "content_block_delta", index = 0, delta = new { type = "thinking_delta", thinking = text } } });
                    break;
                case "codex":
                    Line(new { type = "item.completed", item = new { id = "r" + index, type = "reasoning", text } });
                    break;
                case "mux":
                    Line(new { contractVersion = 2, eventType = "assistant_thinking", timestampUtc = DateTime.UtcNow, text });
                    break;
                default:
                    Console.Out.WriteLine(text);
                    break;
            }
        }

        /// <summary>
        /// Emit a tool call and its result.
        /// </summary>
        /// <param name="tool">Tool name.</param>
        /// <param name="result">Result text.</param>
        /// <param name="success">Whether the call succeeded.</param>
        public void ToolCall(string tool, string result, bool success)
        {
            string id = "call_" + Guid.NewGuid().ToString("N").Substring(0, 8);
            switch (_Options.Format)
            {
                case "claude":
                    Line(new { type = "assistant", message = new { content = new object[] { new { type = "tool_use", id, name = tool, input = new { } } } } });
                    ToolSleep();
                    Line(new { type = "user", message = new { content = new object[] { new { type = "tool_result", tool_use_id = id, is_error = !success, content = result } } } });
                    break;
                case "codex":
                    Line(new { type = "item.started", item = new { id, type = "mcp_tool_call", server = "garrison", tool, status = "in_progress" } });
                    ToolSleep();
                    Line(new { type = "item.completed", item = new { id, type = "mcp_tool_call", server = "garrison", tool, status = success ? "completed" : "failed", result } });
                    break;
                case "mux":
                    Line(new { contractVersion = 2, eventType = "tool_call_proposed", timestampUtc = DateTime.UtcNow, toolCall = new { id, name = tool, arguments = "{}" } });
                    ToolSleep();
                    Line(new { contractVersion = 2, eventType = "tool_call_completed", timestampUtc = DateTime.UtcNow, toolCallId = id, toolName = tool, elapsedMs = 1, result = new { toolCallId = id, success, content = result } });
                    break;
                default:
                    Console.Out.WriteLine("[tool " + tool + "] " + result);
                    break;
            }
        }

        /// <summary>
        /// Emit a tool call with an input object, in Claude format; other formats get a plain tool call line.
        /// </summary>
        /// <param name="id">Tool use identifier.</param>
        /// <param name="tool">Tool name.</param>
        /// <param name="input">Input object.</param>
        public void ToolUse(string id, string tool, JsonElement input)
        {
            if (_Options.Format == "claude") Line(new { type = "assistant", message = new { content = new object[] { new { type = "tool_use", id, name = tool, input } } } });
            else Console.Out.WriteLine("[tool " + tool + "] " + input.GetRawText());
        }

        /// <summary>
        /// Emit the result of a tool call started with <see cref="ToolUse"/>.
        /// </summary>
        /// <param name="id">Tool use identifier.</param>
        /// <param name="result">Result text.</param>
        /// <param name="success">Whether the call succeeded.</param>
        public void ToolResult(string id, string result, bool success)
        {
            if (_Options.Format == "claude") Line(new { type = "user", message = new { content = new object[] { new { type = "tool_result", tool_use_id = id, is_error = !success, content = result } } } });
            else Console.Out.WriteLine("[tool result] " + result);
        }

        /// <summary>
        /// Emit the answer text and the final event.
        /// </summary>
        /// <param name="answer">Answer.</param>
        /// <param name="fail">Whether to report failure.</param>
        public void Finish(string answer, bool fail)
        {
            string[] chunks = Chunk(answer);
            switch (_Options.Format)
            {
                case "claude":
                    Line(new { type = "stream_event", @event = new { type = "message_start" } });
                    Line(new { type = "stream_event", @event = new { type = "content_block_delta", index = 0, delta = new { type = "thinking_delta", thinking = "Considering the request." } } });
                    Think();
                    foreach (string chunk in chunks)
                    {
                        Line(new { type = "stream_event", @event = new { type = "content_block_delta", index = 0, delta = new { type = "text_delta", text = chunk } } });
                        Delay();
                    }
                    Dictionary<string, object?> result = new Dictionary<string, object?>();
                    result["type"] = "result";
                    result["subtype"] = fail ? "error_during_execution" : "success";
                    result["is_error"] = fail;
                    result["result"] = answer;
                    result["session_id"] = _SessionId;
                    result["total_cost_usd"] = 0.0001;
                    result["usage"] = new { input_tokens = 12, output_tokens = 7, cache_read_input_tokens = 3, cache_creation_input_tokens = 0, output_tokens_details = new { thinking_tokens = 2 } };
                    result["modelUsage"] = new Dictionary<string, object> { { "fake-model", new { outputTokens = 7, thinkingTokens = 2 } } };
                    if (_Options.StructuredOutput && !fail)
                    {
                        try
                        {
                            using (JsonDocument structured = JsonDocument.Parse(answer))
                            {
                                result["structured_output"] = structured.RootElement.Clone();
                            }
                        }
                        catch (JsonException)
                        {
                        }
                    }
                    Line(result);
                    break;
                case "codex":
                    if (fail)
                    {
                        Line(new { type = "turn.failed", error = new { message = "fake failure" } });
                    }
                    else
                    {
                        Line(new { type = "item.completed", item = new { id = "rs_1", type = "reasoning", text = "Considering the request." } });
                        Think();
                        Line(new { type = "item.completed", item = new { id = "msg_1", type = "agent_message", text = answer } });
                        Line(new { type = "turn.completed", usage = new { input_tokens = 12, cached_input_tokens = 3, output_tokens = 7, reasoning_output_tokens = 2 } });
                    }
                    break;
                case "mux":
                    Line(new { contractVersion = 2, eventType = "assistant_thinking", timestampUtc = DateTime.UtcNow, text = "Considering the request." });
                    Think();
                    foreach (string chunk in chunks)
                    {
                        Line(new { contractVersion = 2, eventType = "assistant_text", timestampUtc = DateTime.UtcNow, text = chunk });
                        Delay();
                    }
                    Line(new { contractVersion = 2, eventType = "run_completed", timestampUtc = DateTime.UtcNow, runId = "fake", sessionId = _SessionId, status = fail ? "max_iterations_reached" : "completed", usage = new { inputTokens = 12, outputTokens = 7, totalTokens = 19 } });
                    break;
                default:
                    Console.Out.WriteLine(answer);
                    break;
            }
            Console.Out.Flush();
        }

        /// <summary>
        /// Emit the paced load-test stream (--events-per-second and --duration-ms): round(rate * duration / 1000) text
        /// events ("event N" lines, at least one when the rate is above 0), each sent at its scheduled offset from the
        /// start of the stream, then wait out the rest of the duration. Does nothing when the duration is 0. The content
        /// and the number of events are deterministic; only the timing depends on the clock.
        /// </summary>
        /// <returns>Number of events emitted.</returns>
        public int Stream()
        {
            int durationMs = _Options.DurationMs;
            if (durationMs <= 0) return 0;
            int rate = _Options.EventsPerSecond;
            int count = rate > 0 ? Math.Max(1, (int)Math.Round(rate * (durationMs / 1000.0), MidpointRounding.AwayFromZero)) : 0;
            Stopwatch clock = Stopwatch.StartNew();
            for (int i = 0; i < count; i++)
            {
                double dueMs = i * (double)durationMs / count;
                int wait = (int)(dueMs - clock.Elapsed.TotalMilliseconds);
                if (wait > 0) Thread.Sleep(wait);
                Text("event " + (i + 1).ToString("D6", CultureInfo.InvariantCulture) + "\n");
            }
            int rest = (int)(durationMs - clock.Elapsed.TotalMilliseconds);
            if (rest > 0) Thread.Sleep(rest);
            return count;
        }

        /// <summary>
        /// Emit legitimate answer text, then the loop text as assistant text deltas until the process is killed. Never
        /// returns.
        /// </summary>
        /// <param name="answer">Answer text emitted first.</param>
        /// <param name="loopText">Text repeated forever.</param>
        public void Loop(string answer, string loopText)
        {
            switch (_Options.Format)
            {
                case "claude":
                    Line(new { type = "stream_event", @event = new { type = "message_start" } });
                    Line(new { type = "stream_event", @event = new { type = "content_block_delta", index = 0, delta = new { type = "thinking_delta", thinking = "Considering the request." } } });
                    break;
                case "mux":
                    Line(new { contractVersion = 2, eventType = "assistant_thinking", timestampUtc = DateTime.UtcNow, text = "Considering the request." });
                    break;
                default:
                    break;
            }
            Think();
            foreach (string chunk in Chunk(answer + "\n")) Text(chunk);
            while (true)
            {
                Text(loopText);
                if (_Options.DelayMs > 0) Thread.Sleep(_Options.DelayMs);
                else Thread.Sleep(1);
            }
        }

        #endregion

        #region Private-Methods

        private void Text(string chunk)
        {
            switch (_Options.Format)
            {
                case "claude":
                    Line(new { type = "stream_event", @event = new { type = "content_block_delta", index = 0, delta = new { type = "text_delta", text = chunk } } });
                    break;
                case "codex":
                    Line(new { type = "item.completed", item = new { id = "msg_" + Guid.NewGuid().ToString("N").Substring(0, 8), type = "agent_message", text = chunk } });
                    break;
                case "mux":
                    Line(new { contractVersion = 2, eventType = "assistant_text", timestampUtc = DateTime.UtcNow, text = chunk });
                    break;
                default:
                    Console.Out.Write(chunk);
                    Console.Out.Flush();
                    break;
            }
        }

        private void ToolSleep()
        {
            if (_Options.ToolSleepMs > 0) Thread.Sleep(_Options.ToolSleepMs);
        }

        private void Line(object value)
        {
            Console.Out.WriteLine(JsonSerializer.Serialize(value));
            Console.Out.Flush();
        }

        private void Think()
        {
            if (_Options.ThinkMs > 0) Thread.Sleep(_Options.ThinkMs);
        }

        private void Delay()
        {
            if (_Options.DelayMs > 0) Thread.Sleep(_Options.DelayMs);
        }

        private static string[] Chunk(string text)
        {
            if (text.Length <= 16) return new string[] { text };
            int count = (text.Length + 15) / 16;
            string[] chunks = new string[count];
            for (int i = 0; i < count; i++) chunks[i] = text.Substring(i * 16, Math.Min(16, text.Length - i * 16));
            return chunks;
        }

        #endregion
    }
}
