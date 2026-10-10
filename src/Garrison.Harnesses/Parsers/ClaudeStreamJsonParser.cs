namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using Garrison.Core.Enums;

    /// <summary>
    /// Parser for Claude Code --output-format stream-json (with or without --include-partial-messages).
    /// Handles system init (MCP server status), stream_event text and thinking deltas, assistant messages (used only
    /// when no stream events were seen), user tool results, and the final result event. Not thread-safe.
    /// </summary>
    public class ClaudeStreamJsonParser : JsonLineParserBase
    {
        #region Private-Members

        private bool _SawStreamEvents = false;
        private readonly Dictionary<string, string> _ToolNames = new Dictionary<string, string>(StringComparer.Ordinal);
        private readonly HashSet<string> _RequiredServers;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="requiredMcpServers">MCP server names that must report connected; a server in this set with any
        /// other status fails the run (Claude Code exits 0 when MCP authentication fails). Servers outside the set only
        /// produce warnings. Null or empty means every non-connected server is a warning.</param>
        public ClaudeStreamJsonParser(IEnumerable<string>? requiredMcpServers = null)
        {
            _RequiredServers = new HashSet<string>(requiredMcpServers ?? Array.Empty<string>(), StringComparer.Ordinal);
        }

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override void Handle(JsonElement root, string raw, HarnessRunState state)
        {
            string? type = JsonPath.Str(root, "type");
            switch (type)
            {
                case "system":
                    HandleSystem(root, raw, state);
                    break;
                case "stream_event":
                    HandleStreamEvent(root, raw, state);
                    break;
                case "assistant":
                    HandleAssistant(root, raw, state);
                    break;
                case "user":
                    HandleUser(root, raw, state);
                    break;
                case "result":
                    HandleResult(root, raw, state);
                    break;
                default:
                    break;
            }
        }

        #endregion

        #region Private-Methods

        private void HandleSystem(JsonElement root, string raw, HarnessRunState state)
        {
            if (JsonPath.Str(root, "subtype") != "init") return;
            state.SessionId = JsonPath.Str(root, "session_id") ?? state.SessionId;
            state.ServedModel = JsonPath.Str(root, "model") ?? state.ServedModel;
            if (JsonPath.TryGet(root, "mcp_servers", out JsonElement servers) && servers.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement server in servers.EnumerateArray())
                {
                    string? status = JsonPath.Str(server, "status");
                    string name = JsonPath.Str(server, "name") ?? "unknown";
                    if (status == null || status == "connected") continue;
                    string message = "MCP server '" + name + "' status is " + status + ".";
                    if (_RequiredServers.Contains(name)) state.DetectedFailure ??= message;
                    else state.Emit(Event(RunEventTypeEnum.Warning, message, null));
                }
            }
            state.Emit(Event(RunEventTypeEnum.Lifecycle, "Session initialized" + (state.ServedModel != null ? " (" + state.ServedModel + ")" : "") + ".", raw));
        }

        private void HandleStreamEvent(JsonElement root, string raw, HarnessRunState state)
        {
            _SawStreamEvents = true;
            if (!JsonPath.TryGet(root, "event", out JsonElement ev)) return;
            string? evType = JsonPath.Str(ev, "type");
            if (evType == "content_block_delta" && JsonPath.TryGet(ev, "delta", out JsonElement delta))
            {
                string? deltaType = JsonPath.Str(delta, "type");
                if (deltaType == "text_delta")
                {
                    string text = JsonPath.Str(delta, "text") ?? String.Empty;
                    state.AssistantText.Append(text);
                    state.Emit(Event(RunEventTypeEnum.AssistantText, text, null));
                }
                else if (deltaType == "thinking_delta")
                {
                    state.Emit(Event(RunEventTypeEnum.Thinking, JsonPath.Str(delta, "thinking"), null));
                }
            }
            else if (evType == "content_block_start" && JsonPath.TryGet(ev, "content_block", out JsonElement block) && JsonPath.Str(block, "type") == "tool_use")
            {
                string? id = JsonPath.Str(block, "id");
                string? name = JsonPath.Str(block, "name");
                if (id != null && name != null) _ToolNames[id] = name;
            }
        }

        private void HandleAssistant(JsonElement root, string raw, HarnessRunState state)
        {
            if (!JsonPath.TryGet(root, "message", out JsonElement message)) return;
            if (!JsonPath.TryGet(message, "content", out JsonElement content) || content.ValueKind != JsonValueKind.Array) return;
            foreach (JsonElement part in content.EnumerateArray())
            {
                string? partType = JsonPath.Str(part, "type");
                if (partType == "text" && !_SawStreamEvents)
                {
                    string text = JsonPath.Str(part, "text") ?? String.Empty;
                    state.AssistantText.Append(text);
                    state.Emit(Event(RunEventTypeEnum.AssistantText, text, raw));
                }
                else if (partType == "thinking" && !_SawStreamEvents)
                {
                    state.Emit(Event(RunEventTypeEnum.Thinking, JsonPath.Str(part, "thinking"), raw));
                }
                else if (partType == "tool_use")
                {
                    string? id = JsonPath.Str(part, "id");
                    string? name = JsonPath.Str(part, "name");
                    if (id != null && name != null) _ToolNames[id] = name;
                    state.Emit(ToolCall(name, id, JsonPath.Str(part, "input"), raw));
                }
            }
        }

        private void HandleUser(JsonElement root, string raw, HarnessRunState state)
        {
            if (!JsonPath.TryGet(root, "message", out JsonElement message)) return;
            if (!JsonPath.TryGet(message, "content", out JsonElement content) || content.ValueKind != JsonValueKind.Array) return;
            foreach (JsonElement part in content.EnumerateArray())
            {
                string? partType = JsonPath.Str(part, "type");
                if (partType != "tool_result" && partType != "web_search_tool_result" && partType != "web_fetch_tool_result") continue;
                string? id = JsonPath.Str(part, "tool_use_id");
                string? name = null;
                if (id != null) _ToolNames.TryGetValue(id, out name);
                bool isError = JsonPath.Bool(part, "is_error") ?? false;
                state.Emit(ToolResult(name, id, !isError, JsonPath.Str(part, "content"), raw));
            }
        }

        private static void HandleResult(JsonElement root, string raw, HarnessRunState state)
        {
            state.SawFinalResult = true;
            bool isError = JsonPath.Bool(root, "is_error") ?? false;
            string? subtype = JsonPath.Str(root, "subtype");
            state.SawSuccess = subtype == "success" && !isError;
            state.FinalText = JsonPath.Str(root, "result") ?? state.FinalText;
            state.SessionId = JsonPath.Str(root, "session_id") ?? state.SessionId;
            state.CostUsd = JsonPath.Double(root, "total_cost_usd") ?? state.CostUsd;
            if (JsonPath.TryGet(root, "structured_output", out JsonElement structured)) state.StructuredOutputJson = structured.GetRawText();

            if (JsonPath.TryGet(root, "usage", out JsonElement usage))
            {
                state.InputTokens = (JsonPath.Long(usage, "input_tokens") ?? 0) + (JsonPath.Long(usage, "cache_creation_input_tokens") ?? 0);
                state.CachedTokens = JsonPath.Long(usage, "cache_read_input_tokens") ?? 0;
                state.OutputTokens = JsonPath.Long(usage, "output_tokens") ?? 0;
                if (JsonPath.TryGet(usage, "output_tokens_details", out JsonElement details))
                {
                    state.ReasoningTokens = JsonPath.Long(details, "thinking_tokens") ?? JsonPath.Long(details, "reasoning_tokens") ?? state.ReasoningTokens;
                }
            }

            if (JsonPath.TryGet(root, "modelUsage", out JsonElement modelUsage) && modelUsage.ValueKind == JsonValueKind.Object)
            {
                long best = -1;
                long thinking = 0;
                bool sawThinking = false;
                foreach (JsonProperty model in modelUsage.EnumerateObject())
                {
                    long? modelThinking = JsonPath.Long(model.Value, "thinkingTokens");
                    if (modelThinking.HasValue)
                    {
                        thinking += modelThinking.Value;
                        sawThinking = true;
                    }
                    long output = JsonPath.Long(model.Value, "outputTokens") ?? 0;
                    if (output > best)
                    {
                        best = output;
                        state.ServedModel = model.Name;
                    }
                }
                if (sawThinking && thinking > state.ReasoningTokens) state.ReasoningTokens = thinking;
            }

            if (!state.SawSuccess)
            {
                string reason = "Harness reported " + (subtype ?? "an error") + (isError ? " (is_error)." : ".");
                string? apiError = JsonPath.Str(root, "api_error_status");
                if (apiError != null) reason += " API error status " + apiError + ".";
                state.DetectedFailure ??= reason;
                state.Emit(Event(RunEventTypeEnum.Error, reason, raw));
            }

            state.Emit(Usage(state.InputTokens, state.OutputTokens, null));
            state.Emit(Event(RunEventTypeEnum.Result, state.FinalText, raw));
        }

        #endregion
    }
}
