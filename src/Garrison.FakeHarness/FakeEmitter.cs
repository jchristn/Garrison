namespace Garrison.FakeHarness
{
    using System;
    using System.Text.Json;
    using System.Threading;

    /// <summary>
    /// Writes harness-shaped event streams to stdout.
    /// </summary>
    public class FakeEmitter
    {
        #region Private-Members

        private readonly FakeOptions _Options;
        private readonly string _SessionId = Guid.NewGuid().ToString();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="options">Options.</param>
        public FakeEmitter(FakeOptions options)
        {
            _Options = options ?? throw new ArgumentNullException(nameof(options));
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
                    Line(new { type = "user", message = new { content = new object[] { new { type = "tool_result", tool_use_id = id, is_error = !success, content = result } } } });
                    break;
                case "codex":
                    Line(new { type = "item.started", item = new { id, type = "mcp_tool_call", server = "garrison", tool, status = "in_progress" } });
                    Line(new { type = "item.completed", item = new { id, type = "mcp_tool_call", server = "garrison", tool, status = success ? "completed" : "failed", result } });
                    break;
                case "mux":
                    Line(new { contractVersion = 2, eventType = "tool_call_proposed", timestampUtc = DateTime.UtcNow, toolCall = new { id, name = tool, arguments = "{}" } });
                    Line(new { contractVersion = 2, eventType = "tool_call_completed", timestampUtc = DateTime.UtcNow, toolCallId = id, toolName = tool, elapsedMs = 1, result = new { toolCallId = id, success, content = result } });
                    break;
                default:
                    Console.Out.WriteLine("[tool " + tool + "] " + result);
                    break;
            }
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
                    foreach (string chunk in chunks)
                    {
                        Line(new { type = "stream_event", @event = new { type = "content_block_delta", index = 0, delta = new { type = "text_delta", text = chunk } } });
                        Delay();
                    }
                    Line(new
                    {
                        type = "result",
                        subtype = fail ? "error_during_execution" : "success",
                        is_error = fail,
                        result = answer,
                        session_id = _SessionId,
                        total_cost_usd = 0.0001,
                        usage = new { input_tokens = 12, output_tokens = 7, cache_read_input_tokens = 3, cache_creation_input_tokens = 0 },
                        modelUsage = new System.Collections.Generic.Dictionary<string, object> { { "fake-model", new { outputTokens = 7 } } }
                    });
                    break;
                case "codex":
                    if (fail)
                    {
                        Line(new { type = "turn.failed", error = new { message = "fake failure" } });
                    }
                    else
                    {
                        Line(new { type = "item.completed", item = new { id = "msg_1", type = "agent_message", text = answer } });
                        Line(new { type = "turn.completed", usage = new { input_tokens = 12, cached_input_tokens = 3, output_tokens = 7 } });
                    }
                    break;
                case "mux":
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

        #endregion

        #region Private-Methods

        private void Line(object value)
        {
            Console.Out.WriteLine(JsonSerializer.Serialize(value));
            Console.Out.Flush();
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
