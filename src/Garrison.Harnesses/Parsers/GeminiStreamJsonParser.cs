namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Text.Json;
    using Garrison.Core.Enums;

    /// <summary>
    /// Parser for gemini -o stream-json: init, message (assistant), tool_use, tool_result, error, and result
    /// (status and stats). The served model is read from the result because Gemini may substitute models.
    /// Not thread-safe.
    /// </summary>
    public class GeminiStreamJsonParser : JsonLineParserBase
    {
        #region Protected-Methods

        /// <inheritdoc />
        protected override void Handle(JsonElement root, string raw, HarnessRunState state)
        {
            string? type = JsonPath.Str(root, "type");
            switch (type)
            {
                case "init":
                    state.SessionId = JsonPath.Str(root, "session_id") ?? state.SessionId;
                    state.ServedModel = JsonPath.Str(root, "model") ?? state.ServedModel;
                    state.Emit(Event(RunEventTypeEnum.Lifecycle, "Session initialized.", raw));
                    break;
                case "message":
                    if (JsonPath.Str(root, "role") != "assistant") return;
                    string text = JsonPath.Str(root, "content") ?? String.Empty;
                    state.AssistantText.Append(text);
                    state.Emit(Event(RunEventTypeEnum.AssistantText, text, null));
                    break;
                case "tool_use":
                    state.Emit(ToolCall(JsonPath.Str(root, "tool_name"), JsonPath.Str(root, "tool_id"), JsonPath.Str(root, "parameters"), raw));
                    break;
                case "tool_result":
                    state.Emit(ToolResult(null, JsonPath.Str(root, "tool_id"), JsonPath.Str(root, "status") != "error", JsonPath.Str(root, "output"), raw));
                    break;
                case "error":
                    state.Emit(Event(RunEventTypeEnum.Error, JsonPath.Str(root, "message"), raw));
                    break;
                case "result":
                    state.SawFinalResult = true;
                    state.SawSuccess = JsonPath.Str(root, "status") == "success";
                    if (!state.SawSuccess) state.DetectedFailure ??= "Gemini reported status " + (JsonPath.Str(root, "status") ?? "unknown") + ".";
                    if (JsonPath.TryGet(root, "stats", out JsonElement stats))
                    {
                        state.InputTokens = JsonPath.Long(stats, "input_tokens") ?? 0;
                        state.CachedTokens = JsonPath.Long(stats, "cached") ?? JsonPath.Long(stats, "cached_tokens") ?? 0;
                        state.OutputTokens = JsonPath.Long(stats, "output_tokens") ?? 0;
                        if (JsonPath.TryGet(stats, "models", out JsonElement models) && models.ValueKind == JsonValueKind.Object)
                        {
                            foreach (JsonProperty model in models.EnumerateObject())
                            {
                                state.ServedModel = model.Name;
                                break;
                            }
                        }
                        state.Emit(Usage(state.InputTokens, state.OutputTokens, null));
                    }
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
