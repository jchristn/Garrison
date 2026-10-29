namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using Garrison.Core.Enums;

    /// <summary>
    /// Parser for <c>pi --mode json</c> (the pi coding agent, 1.x JSON event stream):
    /// <list type="bullet">
    /// <item><c>session</c>: the session header with the session <c>id</c> a later run resumes.</item>
    /// <item><c>message_update</c>: <c>assistantMessageEvent</c> deltas; <c>text_delta</c> streams as assistant
    /// text and <c>thinking_delta</c> as thinking.</item>
    /// <item><c>message_end</c> with role <c>assistant</c>: the authoritative message with <c>usage</c>,
    /// <c>model</c>, <c>stopReason</c> (<c>stop</c>, <c>length</c>, <c>toolUse</c>, <c>error</c>,
    /// <c>aborted</c>), and <c>errorMessage</c>. System, user, and tool result messages are ignored.</item>
    /// <item><c>tool_execution_start</c>, <c>tool_execution_end</c>: tool calls and their results.</item>
    /// <item><c>auto_retry_start</c>, <c>auto_retry_end</c>, <c>compaction_end</c>: warnings.</item>
    /// <item><c>agent_settled</c>: pi has no automatic work left; the last assistant message decides the outcome.</item>
    /// </list>
    /// In JSON mode pi exits 0 even when the model call failed, so success comes from the final assistant message's
    /// stop reason. When the stream ends without <c>agent_settled</c> (older releases print only <c>agent_end</c>),
    /// the last assistant message is used at the end of output. Not thread-safe.
    /// </summary>
    public class PiJsonlParser : JsonLineParserBase
    {
        #region Private-Members

        private bool _SawAssistant = false;
        private bool _Settled = false;
        private bool _MessageStreamedText = false;
        private string? _LastStopReason = null;
        private string? _LastError = null;
        private string? _LastText = null;

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public override void Complete(HarnessRunState state)
        {
            if (state == null || _Settled) return;
            if (_SawAssistant) Finalize(false, null, state);
        }

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override void Handle(JsonElement root, string raw, HarnessRunState state)
        {
            string? type = JsonPath.Str(root, "type");
            switch (type)
            {
                case "session":
                    state.SessionId = JsonPath.Str(root, "id") ?? state.SessionId;
                    state.Emit(Event(RunEventTypeEnum.Lifecycle, "Session started.", raw));
                    break;
                case "message_start":
                    if (JsonPath.TryGet(root, "message", out JsonElement started) && JsonPath.Str(started, "role") == "assistant") _MessageStreamedText = false;
                    break;
                case "message_update":
                    HandleUpdate(root, state);
                    break;
                case "message_end":
                    if (JsonPath.TryGet(root, "message", out JsonElement message) && JsonPath.Str(message, "role") == "assistant") HandleAssistant(message, raw, state);
                    break;
                case "tool_execution_start":
                    state.Emit(ToolCall(JsonPath.Str(root, "toolName"), JsonPath.Str(root, "toolCallId"), JsonPath.Str(root, "args"), raw));
                    break;
                case "tool_execution_end":
                    string? output = JsonPath.TryGet(root, "result", out JsonElement result) ? ContentText(result) : null;
                    state.Emit(ToolResult(JsonPath.Str(root, "toolName"), JsonPath.Str(root, "toolCallId"), JsonPath.Bool(root, "isError") != true, output, raw));
                    break;
                case "auto_retry_start":
                    state.Emit(Event(RunEventTypeEnum.Warning, "pi is retrying the model call (attempt " + (JsonPath.Long(root, "attempt") ?? 1) + " of " + (JsonPath.Long(root, "maxAttempts") ?? 1) + "): " + (JsonPath.Str(root, "errorMessage") ?? "unknown error"), raw));
                    break;
                case "auto_retry_end":
                    if (JsonPath.Bool(root, "success") == false) state.Emit(Event(RunEventTypeEnum.Warning, "pi gave up retrying: " + (JsonPath.Str(root, "finalError") ?? "unknown error"), raw));
                    break;
                case "compaction_end":
                    string? compactionError = JsonPath.Str(root, "errorMessage");
                    if (!String.IsNullOrEmpty(compactionError)) state.Emit(Event(RunEventTypeEnum.Warning, "pi context compaction failed: " + compactionError, raw));
                    break;
                case "agent_settled":
                    Finalize(JsonPath.Bool(root, "aborted") == true, raw, state);
                    break;
                default:
                    break;
            }
        }

        #endregion

        #region Private-Methods

        private void HandleUpdate(JsonElement root, HarnessRunState state)
        {
            if (!JsonPath.TryGet(root, "assistantMessageEvent", out JsonElement update)) return;
            string? kind = JsonPath.Str(update, "type");
            if (kind == "text_delta")
            {
                string delta = JsonPath.Str(update, "delta") ?? String.Empty;
                if (delta.Length == 0) return;
                if (!_MessageStreamedText && state.AssistantText.Length > 0) state.AssistantText.Append('\n');
                _MessageStreamedText = true;
                state.AssistantText.Append(delta);
                state.Emit(Event(RunEventTypeEnum.AssistantText, delta, null));
            }
            else if (kind == "thinking_delta")
            {
                string delta = JsonPath.Str(update, "delta") ?? String.Empty;
                if (delta.Length > 0) state.Emit(Event(RunEventTypeEnum.Thinking, delta, null));
            }
        }

        private void HandleAssistant(JsonElement message, string raw, HarnessRunState state)
        {
            _SawAssistant = true;
            _Settled = false;
            _LastStopReason = JsonPath.Str(message, "stopReason");
            _LastError = JsonPath.Str(message, "errorMessage");
            _LastText = AssistantText(message);
            state.ServedModel = JsonPath.Str(message, "responseModel") ?? JsonPath.Str(message, "model") ?? state.ServedModel;

            if (!_MessageStreamedText && !String.IsNullOrEmpty(_LastText))
            {
                if (state.AssistantText.Length > 0) state.AssistantText.Append('\n');
                state.AssistantText.Append(_LastText);
                state.Emit(Event(RunEventTypeEnum.AssistantText, _LastText, null));
            }
            _MessageStreamedText = false;

            if (JsonPath.TryGet(message, "usage", out JsonElement usage))
            {
                long input = JsonPath.Long(usage, "input") ?? 0;
                long output = JsonPath.Long(usage, "output") ?? 0;
                state.InputTokens += input;
                state.OutputTokens += output;
                state.CachedTokens += JsonPath.Long(usage, "cacheRead") ?? 0;
                if (JsonPath.TryGet(usage, "cost", out JsonElement cost))
                {
                    double? total = JsonPath.Double(cost, "total");
                    if (total.HasValue && total.Value > 0) state.CostUsd = (state.CostUsd ?? 0) + total.Value;
                }
                state.Emit(Usage(input, output, raw));
            }
        }

        private void Finalize(bool aborted, string? raw, HarnessRunState state)
        {
            _Settled = true;
            state.SawFinalResult = true;
            if (!aborted && _LastStopReason == "stop")
            {
                state.SawSuccess = true;
                state.DetectedFailure = null;
                state.FinalText = String.IsNullOrEmpty(_LastText) ? null : _LastText;
                state.Emit(Event(RunEventTypeEnum.Result, state.FinalText, raw));
                return;
            }

            string failure;
            if (!_SawAssistant) failure = "pi finished without an assistant response.";
            else if (aborted || _LastStopReason == "aborted") failure = "pi run was aborted" + (String.IsNullOrEmpty(_LastError) ? "." : ": " + _LastError);
            else if (_LastStopReason == "error") failure = String.IsNullOrEmpty(_LastError) ? "pi reported a model error." : _LastError;
            else if (_LastStopReason == "length") failure = "pi stopped because the model reached its output token limit.";
            else failure = "pi ended with stop reason '" + (_LastStopReason ?? "unknown") + "'.";

            state.SawSuccess = false;
            state.DetectedFailure = failure;
            if (CredentialErrorText.IsCredentialFailure(_LastError)) state.CredentialFailure ??= _LastError;
            state.Emit(Event(RunEventTypeEnum.Error, failure, raw));
        }

        private static string? AssistantText(JsonElement message)
        {
            if (!JsonPath.TryGet(message, "content", out JsonElement content)) return null;
            if (content.ValueKind == JsonValueKind.String) return content.GetString();
            return ContentText(message);
        }

        private static string? ContentText(JsonElement holder)
        {
            if (!JsonPath.TryGet(holder, "content", out JsonElement content)) return null;
            if (content.ValueKind == JsonValueKind.String) return content.GetString();
            if (content.ValueKind != JsonValueKind.Array) return null;
            List<string> parts = new List<string>();
            foreach (JsonElement block in content.EnumerateArray())
            {
                if (JsonPath.Str(block, "type") != "text") continue;
                string? text = JsonPath.Str(block, "text");
                if (!String.IsNullOrEmpty(text)) parts.Add(text);
            }
            return parts.Count == 0 ? null : String.Join("\n", parts);
        }

        #endregion
    }
}
