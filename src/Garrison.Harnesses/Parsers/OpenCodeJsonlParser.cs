namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Text;
    using System.Text.Json;
    using Garrison.Core.Enums;

    /// <summary>
    /// Parser for <c>opencode run --format json</c> (opencode 1.x). Every line carries <c>type</c>, <c>timestamp</c>,
    /// and <c>sessionID</c>; the content is in <c>part</c> (a session message part) or <c>error</c>:
    /// <list type="bullet">
    /// <item><c>text</c>: a completed text part of an assistant message. Each assistant step is its own message
    /// (<c>part.messageID</c>), and the text of the last step is the answer.</item>
    /// <item><c>reasoning</c>: a completed reasoning part (only printed with <c>--thinking</c>).</item>
    /// <item><c>tool_use</c>: a tool part that has completed or failed, with its input and output.</item>
    /// <item><c>step_start</c>, <c>step_finish</c>: one model call. <c>step_finish</c> carries the finish reason
    /// (<c>tool-calls</c> while the agent continues, <c>stop</c> at the end), the tokens, and the cost.</item>
    /// <item><c>error</c>: a session error (for example <c>APIError</c> with a status code, or
    /// <c>ProviderAuthError</c>); opencode then exits 1.</item>
    /// </list>
    /// opencode prints no single final event, so the last <c>step_finish</c> that is not <c>tool-calls</c> stands in
    /// for one. Not thread-safe.
    /// </summary>
    public class OpenCodeJsonlParser : JsonLineParserBase
    {
        #region Private-Members

        private readonly StringBuilder _MessageText = new StringBuilder();
        private string? _MessageId = null;
        private bool _SawError = false;

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public override void Complete(HarnessRunState state)
        {
            if (state == null) return;
            if (state.SawSuccess && String.IsNullOrEmpty(state.FinalText) && _MessageText.Length > 0) state.FinalText = _MessageText.ToString();
        }

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override void Handle(JsonElement root, string raw, HarnessRunState state)
        {
            if (state.SessionId == null) state.SessionId = JsonPath.Str(root, "sessionID");
            string? type = JsonPath.Str(root, "type");
            bool hasPart = JsonPath.TryGet(root, "part", out JsonElement part) && part.ValueKind == JsonValueKind.Object;
            switch (type)
            {
                case "text":
                    if (hasPart) HandleText(part, raw, state);
                    break;
                case "reasoning":
                    if (hasPart) state.Emit(Event(RunEventTypeEnum.Thinking, JsonPath.Str(part, "text"), raw));
                    break;
                case "tool_use":
                    if (hasPart) HandleTool(part, raw, state);
                    break;
                case "step_finish":
                    if (hasPart) HandleStepFinish(part, raw, state);
                    break;
                case "error":
                    HandleError(root, raw, state);
                    break;
                default:
                    break;
            }
        }

        #endregion

        #region Private-Methods

        private void HandleText(JsonElement part, string raw, HarnessRunState state)
        {
            if (JsonPath.Bool(part, "synthetic") == true || JsonPath.Bool(part, "ignored") == true) return;
            string text = JsonPath.Str(part, "text") ?? String.Empty;
            if (text.Length == 0) return;

            string? messageId = JsonPath.Str(part, "messageID");
            if (messageId != _MessageId)
            {
                _MessageId = messageId;
                _MessageText.Clear();
            }
            if (_MessageText.Length > 0) _MessageText.Append('\n');
            _MessageText.Append(text);

            if (state.AssistantText.Length > 0) state.AssistantText.Append('\n');
            state.AssistantText.Append(text);
            state.Emit(Event(RunEventTypeEnum.AssistantText, text, raw));
        }

        private static void HandleTool(JsonElement part, string raw, HarnessRunState state)
        {
            string? name = JsonPath.Str(part, "tool");
            string? id = JsonPath.Str(part, "callID");
            if (!JsonPath.TryGet(part, "state", out JsonElement toolState)) return;
            string? status = JsonPath.Str(toolState, "status");
            state.Emit(ToolCall(name, id, JsonPath.Str(toolState, "input"), raw));
            if (status == "completed") state.Emit(ToolResult(name, id, true, JsonPath.Str(toolState, "output"), null));
            else if (status == "error") state.Emit(ToolResult(name, id, false, JsonPath.Str(toolState, "error"), null));
        }

        private void HandleStepFinish(JsonElement part, string raw, HarnessRunState state)
        {
            if (JsonPath.TryGet(part, "tokens", out JsonElement tokens))
            {
                long input = JsonPath.Long(tokens, "input") ?? 0;
                long reasoning = JsonPath.Long(tokens, "reasoning") ?? 0;
                long output = (JsonPath.Long(tokens, "output") ?? 0) + reasoning;
                long cached = 0;
                if (JsonPath.TryGet(tokens, "cache", out JsonElement cache)) cached = JsonPath.Long(cache, "read") ?? 0;
                state.InputTokens += input;
                state.CachedTokens += cached;
                state.OutputTokens += output;
                state.ReasoningTokens += reasoning;
                state.Emit(Usage(input, output, raw));
            }
            double? cost = JsonPath.Double(part, "cost");
            if (cost.HasValue) state.CostUsd = (state.CostUsd ?? 0) + cost.Value;

            string reason = JsonPath.Str(part, "reason") ?? String.Empty;
            if (reason == "tool-calls") return;

            state.SawFinalResult = true;
            if (_SawError) return;
            if (reason == "length" || reason == "content-filter" || reason == "error")
            {
                state.SawSuccess = false;
                state.DetectedFailure = "opencode stopped with finish reason '" + reason + "'" + (reason == "length" ? ": the model reached its output token limit." : ".");
                return;
            }

            state.SawSuccess = true;
            state.DetectedFailure = null;
            state.FinalText = _MessageText.Length > 0 ? _MessageText.ToString() : null;
            state.Emit(Event(RunEventTypeEnum.Result, state.FinalText, null));
        }

        private void HandleError(JsonElement root, string raw, HarnessRunState state)
        {
            string? name = null;
            string? message = null;
            long? status = null;
            if (JsonPath.TryGet(root, "error", out JsonElement error))
            {
                name = JsonPath.Str(error, "name");
                if (JsonPath.TryGet(error, "data", out JsonElement data) && data.ValueKind == JsonValueKind.Object)
                {
                    message = JsonPath.Str(data, "message");
                    status = JsonPath.Long(data, "statusCode");
                }
            }
            string failure = message ?? name ?? "opencode reported an error.";

            _SawError = true;
            state.SawFinalResult = true;
            state.SawSuccess = false;
            state.DetectedFailure ??= failure;
            if (name == "ProviderAuthError" || status == 401 || CredentialErrorText.IsCredentialFailure(failure)) state.CredentialFailure ??= failure;
            state.Emit(Event(RunEventTypeEnum.Error, failure, raw));
        }

        #endregion
    }
}
