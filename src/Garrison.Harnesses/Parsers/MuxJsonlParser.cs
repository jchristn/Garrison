namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using Garrison.Core.Enums;

    /// <summary>
    /// Parser for mux --output-format jsonl (contract version 2). The run_completed event carries no answer text, so
    /// the final text is the concatenated assistant_text unless the result source is LastMessageFile. Not thread-safe.
    /// </summary>
    public class MuxJsonlParser : JsonLineParserBase
    {
        #region Private-Members

        private readonly Dictionary<string, string> _ToolNames = new Dictionary<string, string>(StringComparer.Ordinal);

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override void Handle(JsonElement root, string raw, HarnessRunState state)
        {
            string? type = JsonPath.Str(root, "eventType");
            switch (type)
            {
                case "run_started":
                    state.SessionId = JsonPath.Str(root, "sessionId") ?? state.SessionId;
                    state.ServedModel = JsonPath.Str(root, "model") ?? state.ServedModel;
                    state.Emit(Event(RunEventTypeEnum.Lifecycle, "Run started" + (state.ServedModel != null ? " (" + state.ServedModel + ")" : "") + ".", raw));
                    break;
                case "assistant_text":
                    string text = JsonPath.Str(root, "text") ?? String.Empty;
                    state.AssistantText.Append(text);
                    state.Emit(Event(RunEventTypeEnum.AssistantText, text, null));
                    break;
                case "assistant_thinking":
                    state.Emit(Event(RunEventTypeEnum.Thinking, JsonPath.Str(root, "text"), null));
                    break;
                case "tool_call_proposed":
                    if (JsonPath.TryGet(root, "toolCall", out JsonElement call))
                    {
                        string? id = JsonPath.Str(call, "id");
                        string? name = JsonPath.Str(call, "name");
                        if (id != null && name != null) _ToolNames[id] = name;
                        state.Emit(ToolCall(name, id, JsonPath.Str(call, "arguments"), raw));
                    }
                    break;
                case "tool_call_completed":
                    string? callId = JsonPath.Str(root, "toolCallId");
                    string? toolName = JsonPath.Str(root, "toolName");
                    if (toolName == null && callId != null) _ToolNames.TryGetValue(callId, out toolName);
                    bool success = true;
                    string? content = null;
                    if (JsonPath.TryGet(root, "result", out JsonElement result))
                    {
                        success = JsonPath.Bool(result, "success") ?? true;
                        content = JsonPath.Str(result, "content");
                    }
                    state.Emit(ToolResult(toolName, callId, success, content, raw));
                    break;
                case "tool_call_denied":
                    state.Emit(Event(RunEventTypeEnum.Warning, "Tool call denied: " + JsonPath.Str(root, "toolCallId"), raw));
                    break;
                case "error":
                    string message = JsonPath.Str(root, "message") ?? JsonPath.Str(root, "code") ?? "Mux reported an error.";
                    state.Emit(Event(RunEventTypeEnum.Error, message, raw));
                    if (JsonPath.Str(root, "code") == "tool_call_denied") state.DetectedFailure ??= message;
                    break;
                case "run_completed":
                    state.SawFinalResult = true;
                    string? status = JsonPath.Str(root, "status");
                    state.SawSuccess = status == "completed" || status == "completed_with_errors";
                    if (!state.SawSuccess) state.DetectedFailure ??= "Mux run ended with status " + (status ?? "unknown") + ".";
                    if (JsonPath.TryGet(root, "usage", out JsonElement usage))
                    {
                        state.InputTokens = JsonPath.Long(usage, "inputTokens") ?? 0;
                        state.OutputTokens = JsonPath.Long(usage, "outputTokens") ?? 0;
                        state.ReasoningTokens = JsonPath.Long(usage, "reasoningTokens") ?? 0;
                        state.Emit(Usage(state.InputTokens, state.OutputTokens, null));
                    }
                    state.SessionId = JsonPath.Str(root, "sessionId") ?? state.SessionId;
                    if (state.AssistantText.Length > 0) state.FinalText = state.AssistantText.ToString();
                    state.Emit(Event(RunEventTypeEnum.Result, state.FinalText, raw));
                    break;
                default:
                    break;
            }
        }

        #endregion
    }
}
