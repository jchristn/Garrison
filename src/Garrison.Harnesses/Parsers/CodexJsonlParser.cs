namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Text.Json;
    using Garrison.Core.Enums;

    /// <summary>
    /// Parser for codex exec --json. Handles thread.started, item.started/item.completed (agent_message, reasoning,
    /// mcp_tool_call, command_execution, web_search, file_change, error), turn.completed usage, turn.failed, and
    /// error events. Not thread-safe.
    /// </summary>
    public class CodexJsonlParser : JsonLineParserBase
    {
        #region Private-Members

        private bool _TurnFailed = false;

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public override void Complete(HarnessRunState state)
        {
            if (state == null) return;
            if (state.SawSuccess && !_TurnFailed && String.IsNullOrEmpty(state.FinalText) && state.AssistantText.Length > 0)
            {
                state.FinalText = state.AssistantText.ToString();
            }
        }

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override void Handle(JsonElement root, string raw, HarnessRunState state)
        {
            string? type = JsonPath.Str(root, "type");
            switch (type)
            {
                case "thread.started":
                    state.SessionId = JsonPath.Str(root, "thread_id") ?? state.SessionId;
                    state.Emit(Event(RunEventTypeEnum.Lifecycle, "Thread started.", raw));
                    break;
                case "item.started":
                    HandleItem(root, raw, state, false);
                    break;
                case "item.completed":
                    HandleItem(root, raw, state, true);
                    break;
                case "turn.completed":
                    if (JsonPath.TryGet(root, "usage", out JsonElement usage))
                    {
                        long input = JsonPath.Long(usage, "input_tokens") ?? 0;
                        long cached = JsonPath.Long(usage, "cached_input_tokens") ?? 0;
                        long output = (JsonPath.Long(usage, "output_tokens") ?? 0) + (JsonPath.Long(usage, "reasoning_output_tokens") ?? 0);
                        state.InputTokens += input;
                        state.CachedTokens += cached;
                        state.OutputTokens += output;
                        state.Emit(Usage(input, output, raw));
                    }
                    state.SawFinalResult = true;
                    if (!_TurnFailed)
                    {
                        state.SawSuccess = true;
                        if (String.IsNullOrEmpty(state.FinalText) && state.AssistantText.Length > 0) state.FinalText = state.AssistantText.ToString();
                        state.Emit(Event(RunEventTypeEnum.Result, state.FinalText, raw));
                    }
                    break;
                case "turn.failed":
                    _TurnFailed = true;
                    state.SawFinalResult = true;
                    state.SawSuccess = false;
                    string failure = JsonPath.TryGet(root, "error", out JsonElement error) ? (JsonPath.Str(error, "message") ?? error.GetRawText()) : "Turn failed.";
                    state.DetectedFailure = failure;
                    state.Emit(Event(RunEventTypeEnum.Error, failure, raw));
                    break;
                case "error":
                    string message = JsonPath.Str(root, "message") ?? "Codex reported an error.";
                    state.Emit(Event(RunEventTypeEnum.Error, message, raw));
                    break;
                default:
                    break;
            }
        }

        #endregion

        #region Private-Methods

        private static void HandleItem(JsonElement root, string raw, HarnessRunState state, bool completed)
        {
            if (!JsonPath.TryGet(root, "item", out JsonElement item)) return;
            string? itemType = JsonPath.Str(item, "type") ?? JsonPath.Str(item, "item_type");
            string? id = JsonPath.Str(item, "id");
            switch (itemType)
            {
                case "agent_message":
                    if (!completed) return;
                    string text = JsonPath.Str(item, "text") ?? String.Empty;
                    if (state.AssistantText.Length > 0) state.AssistantText.Append('\n');
                    state.AssistantText.Append(text);
                    state.FinalText = text;
                    state.Emit(Event(RunEventTypeEnum.AssistantText, text, raw));
                    break;
                case "reasoning":
                    if (completed) state.Emit(Event(RunEventTypeEnum.Thinking, JsonPath.Str(item, "text"), raw));
                    break;
                case "mcp_tool_call":
                    string name = (JsonPath.Str(item, "server") ?? "mcp") + "." + (JsonPath.Str(item, "tool") ?? "tool");
                    if (!completed) state.Emit(ToolCall(name, id, JsonPath.Str(item, "arguments"), raw));
                    else state.Emit(ToolResult(name, id, JsonPath.Str(item, "status") != "failed", JsonPath.Str(item, "result") ?? JsonPath.Str(item, "error"), raw));
                    break;
                case "command_execution":
                    if (!completed) state.Emit(ToolCall("shell", id, JsonPath.Str(item, "command"), raw));
                    else state.Emit(ToolResult("shell", id, (JsonPath.Long(item, "exit_code") ?? 0) == 0 && JsonPath.Str(item, "status") != "failed", JsonPath.Str(item, "aggregated_output"), raw));
                    break;
                case "web_search":
                    if (completed) state.Emit(ToolCall("web_search", id, JsonPath.Str(item, "query"), raw));
                    break;
                case "file_change":
                    if (completed) state.Emit(ToolResult("file_change", id, JsonPath.Str(item, "status") != "failed", JsonPath.Str(item, "changes"), raw));
                    break;
                case "error":
                    if (completed) state.Emit(Event(RunEventTypeEnum.Warning, JsonPath.Str(item, "message"), raw));
                    break;
                default:
                    break;
            }
        }

        #endregion
    }
}
