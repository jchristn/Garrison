namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Text.Json;
    using Garrison.Core.Enums;

    /// <summary>
    /// Parser for the JSON-RPC messages <c>codex app-server</c> writes to stdout (P12.2a). Agent message deltas become
    /// <c>AssistantText</c> events and reasoning deltas become <c>Thinking</c> events as they arrive, so Codex output
    /// streams the way Claude Code's partial messages do; a completed message or reasoning item whose deltas were
    /// already seen is not emitted again. Tool items (commands, MCP calls, file changes, web searches, dynamic tools)
    /// become tool call and result events, <c>thread/tokenUsage/updated</c> gives the turn's usage, and
    /// <c>turn/completed</c> is the final event. Error responses to the worker's requests, failed turns, and required
    /// MCP servers that fail to start fail the run; a 401 from the model provider is a credential failure. Deltas
    /// carry no raw JSON (one stored line per token would dwarf the text). Not thread-safe.
    /// </summary>
    public class CodexAppServerParser : JsonLineParserBase
    {
        #region Private-Members

        private readonly HashSet<string> _RequiredServers;
        private readonly HashSet<string> _StreamedItems = new HashSet<string>(StringComparer.Ordinal);
        private string? _LastTextItem = null;
        private bool _TurnFailed = false;
        private bool _UsageSeen = false;
        private long _BaselineInput = 0;
        private long _BaselineCached = 0;
        private long _BaselineOutput = 0;
        private long _BaselineReasoning = 0;
        private string? _LastError = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="requiredServers">MCP servers that must start; a failure of one fails the run. Null for none.</param>
        public CodexAppServerParser(IEnumerable<string>? requiredServers = null)
        {
            _RequiredServers = new HashSet<string>(requiredServers ?? Enumerable.Empty<string>(), StringComparer.Ordinal);
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public override void Complete(HarnessRunState state)
        {
            if (state == null) return;
            if (!state.SawFinalResult && state.DetectedFailure == null && _LastError != null) state.DetectedFailure = _LastError;
        }

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override void Handle(JsonElement root, string raw, HarnessRunState state)
        {
            string? method = JsonPath.Str(root, "method");
            bool hasId = JsonPath.TryGet(root, "id", out JsonElement _);
            if (method == null)
            {
                if (hasId) HandleResponse(root, raw, state);
                return;
            }
            JsonPath.TryGet(root, "params", out JsonElement parameters);
            if (hasId)
            {
                HandleServerRequest(method, state, raw);
                return;
            }

            switch (method)
            {
                case "thread/started":
                    if (JsonPath.TryGet(parameters, "thread", out JsonElement thread)) ReadThread(thread, state);
                    state.Emit(Event(RunEventTypeEnum.Lifecycle, "Thread started" + (state.ServedModel != null ? " (" + state.ServedModel + ")" : String.Empty) + ".", raw));
                    break;
                case "model/rerouted":
                    string? toModel = JsonPath.Str(parameters, "toModel");
                    if (!String.IsNullOrEmpty(toModel)) state.ServedModel = toModel;
                    state.Emit(Event(RunEventTypeEnum.Warning, "Codex rerouted the turn from " + (JsonPath.Str(parameters, "fromModel") ?? "its model") + " to " + (toModel ?? "another model") + ".", raw));
                    break;
                case "item/agentMessage/delta":
                    HandleTextDelta(parameters, state);
                    break;
                case "item/reasoning/textDelta":
                case "item/reasoning/summaryTextDelta":
                    string? itemId = JsonPath.Str(parameters, "itemId");
                    if (itemId != null) _StreamedItems.Add(itemId);
                    string thinking = JsonPath.Str(parameters, "delta") ?? String.Empty;
                    if (thinking.Length > 0) state.Emit(Event(RunEventTypeEnum.Thinking, thinking, null));
                    break;
                case "item/started":
                    if (JsonPath.TryGet(parameters, "item", out JsonElement started)) HandleItem(started, raw, state, false);
                    break;
                case "item/completed":
                    if (JsonPath.TryGet(parameters, "item", out JsonElement completed)) HandleItem(completed, raw, state, true);
                    break;
                case "thread/tokenUsage/updated":
                    if (JsonPath.TryGet(parameters, "tokenUsage", out JsonElement usage)) HandleUsage(usage, state);
                    break;
                case "turn/completed":
                    if (JsonPath.TryGet(parameters, "turn", out JsonElement turn)) HandleTurnCompleted(turn, raw, state);
                    break;
                case "error":
                    HandleError(parameters, raw, state);
                    break;
                case "warning":
                    state.Emit(Event(RunEventTypeEnum.Warning, JsonPath.Str(parameters, "message"), raw));
                    break;
                case "configWarning":
                    string summary = JsonPath.Str(parameters, "summary") ?? "Codex configuration warning.";
                    string? details = JsonPath.Str(parameters, "details");
                    state.Emit(Event(RunEventTypeEnum.Warning, details == null ? summary : summary + " " + details, raw));
                    break;
                case "mcpServer/startupStatus/updated":
                    HandleMcpStatus(parameters, raw, state);
                    break;
                default:
                    break;
            }
        }

        #endregion

        #region Private-Methods

        private void HandleResponse(JsonElement root, string raw, HarnessRunState state)
        {
            if (JsonPath.TryGet(root, "error", out JsonElement error))
            {
                string message = "Codex app-server rejected a request: " + (JsonPath.Str(error, "message") ?? error.GetRawText());
                state.DetectedFailure ??= message;
                if (IsCredentialText(message)) state.CredentialFailure ??= message;
                state.Emit(Event(RunEventTypeEnum.Error, message, raw));
                return;
            }
            if (!JsonPath.TryGet(root, "result", out JsonElement result)) return;
            if (JsonPath.TryGet(result, "thread", out JsonElement thread))
            {
                // thread/start and thread/resume answer with the thread and the model it runs on.
                ReadThread(thread, state);
                string? model = JsonPath.Str(result, "model");
                if (!String.IsNullOrEmpty(model)) state.ServedModel = model;
            }
        }

        private static void ReadThread(JsonElement thread, HarnessRunState state)
        {
            state.SessionId = JsonPath.Str(thread, "id") ?? state.SessionId;
            string? model = JsonPath.Str(thread, "model");
            if (!String.IsNullOrEmpty(model) && String.IsNullOrEmpty(state.ServedModel)) state.ServedModel = model;
        }

        private static void HandleServerRequest(string method, HarnessRunState state, string raw)
        {
            switch (method)
            {
                case "item/commandExecution/requestApproval":
                case "item/fileChange/requestApproval":
                case "mcpServer/elicitation/request":
                    state.Emit(Event(RunEventTypeEnum.Warning, "Codex asked for approval (" + method + "); headless runs decline approval requests.", raw));
                    break;
                default:
                    state.Emit(Event(RunEventTypeEnum.Warning, "Codex sent request " + method + ", which a headless run does not answer.", raw));
                    break;
            }
        }

        private void HandleTextDelta(JsonElement parameters, HarnessRunState state)
        {
            string text = JsonPath.Str(parameters, "delta") ?? String.Empty;
            string? itemId = JsonPath.Str(parameters, "itemId");
            if (itemId != null && _StreamedItems.Add(itemId)) StartTextItem(itemId, state);
            if (text.Length == 0) return;
            state.AssistantText.Append(text);
            state.Emit(Event(RunEventTypeEnum.AssistantText, text, null));
        }

        private void StartTextItem(string itemId, HarnessRunState state)
        {
            // Messages are joined with a newline in the accumulated text, as in exec mode; events carry the text as sent.
            if (_LastTextItem != null && _LastTextItem != itemId && state.AssistantText.Length > 0) state.AssistantText.Append('\n');
            _LastTextItem = itemId;
        }

        private void HandleItem(JsonElement item, string raw, HarnessRunState state, bool completed)
        {
            string? type = JsonPath.Str(item, "type");
            string? id = JsonPath.Str(item, "id");
            switch (type)
            {
                case "agentMessage":
                    if (!completed) return;
                    string text = JsonPath.Str(item, "text") ?? String.Empty;
                    if (id == null || !_StreamedItems.Contains(id))
                    {
                        if (id != null) StartTextItem(id, state);
                        else if (state.AssistantText.Length > 0) state.AssistantText.Append('\n');
                        state.AssistantText.Append(text);
                        if (text.Length > 0) state.Emit(Event(RunEventTypeEnum.AssistantText, text, raw));
                    }
                    if (text.Length > 0) state.FinalText = text;
                    break;
                case "reasoning":
                    if (!completed || (id != null && _StreamedItems.Contains(id))) return;
                    string reasoning = JoinStrings(item, "summary");
                    if (reasoning.Length == 0) reasoning = JoinStrings(item, "content");
                    if (reasoning.Length > 0) state.Emit(Event(RunEventTypeEnum.Thinking, reasoning, raw));
                    break;
                case "commandExecution":
                    if (!completed) state.Emit(ToolCall("shell", id, JsonPath.Str(item, "command"), raw));
                    else state.Emit(ToolResult("shell", id, JsonPath.Str(item, "status") == "completed" && (JsonPath.Long(item, "exitCode") ?? 0) == 0, JsonPath.Str(item, "aggregatedOutput"), raw));
                    break;
                case "mcpToolCall":
                    string name = (JsonPath.Str(item, "server") ?? "mcp") + "." + (JsonPath.Str(item, "tool") ?? "tool");
                    if (!completed)
                    {
                        state.Emit(ToolCall(name, id, JsonPath.Str(item, "arguments"), raw));
                    }
                    else
                    {
                        string? failure = JsonPath.TryGet(item, "error", out JsonElement error) ? JsonPath.Str(error, "message") : null;
                        string? output = failure ?? (JsonPath.TryGet(item, "result", out JsonElement result) ? McpText(result) : null);
                        state.Emit(ToolResult(name, id, failure == null && JsonPath.Str(item, "status") == "completed", output, raw));
                    }
                    break;
                case "dynamicToolCall":
                    string tool = JsonPath.Str(item, "tool") ?? "tool";
                    if (!completed) state.Emit(ToolCall(tool, id, JsonPath.Str(item, "arguments"), raw));
                    else state.Emit(ToolResult(tool, id, JsonPath.Bool(item, "success") ?? JsonPath.Str(item, "status") == "completed", JsonPath.Str(item, "contentItems"), raw));
                    break;
                case "fileChange":
                    if (!completed) state.Emit(ToolCall("file_change", id, FileChangePaths(item), raw));
                    else state.Emit(ToolResult("file_change", id, JsonPath.Str(item, "status") == "completed", FileChangePaths(item), raw));
                    break;
                case "webSearch":
                    if (completed) state.Emit(ToolCall("web_search", id, JsonPath.Str(item, "query"), raw));
                    break;
                default:
                    break;
            }
        }

        private void HandleUsage(JsonElement usage, HarnessRunState state)
        {
            if (!JsonPath.TryGet(usage, "total", out JsonElement total)) return;
            long input = JsonPath.Long(total, "inputTokens") ?? 0;
            long cached = JsonPath.Long(total, "cachedInputTokens") ?? 0;
            long output = JsonPath.Long(total, "outputTokens") ?? 0;
            long reasoning = JsonPath.Long(total, "reasoningOutputTokens") ?? 0;
            if (!_UsageSeen)
            {
                // The totals are for the whole thread. A resumed thread already has earlier turns in them, so the first
                // update of this run sets the baseline: its total minus the one model call it reports as last.
                _UsageSeen = true;
                if (JsonPath.TryGet(usage, "last", out JsonElement last))
                {
                    _BaselineInput = Math.Max(0, input - (JsonPath.Long(last, "inputTokens") ?? 0));
                    _BaselineCached = Math.Max(0, cached - (JsonPath.Long(last, "cachedInputTokens") ?? 0));
                    _BaselineOutput = Math.Max(0, output - (JsonPath.Long(last, "outputTokens") ?? 0));
                    _BaselineReasoning = Math.Max(0, reasoning - (JsonPath.Long(last, "reasoningOutputTokens") ?? 0));
                }
            }
            long turnReasoning = Math.Max(0, reasoning - _BaselineReasoning);
            state.InputTokens = Math.Max(0, input - _BaselineInput);
            state.CachedTokens = Math.Max(0, cached - _BaselineCached);
            state.ReasoningTokens = turnReasoning;
            // Same accounting as exec mode: output tokens include reasoning tokens.
            state.OutputTokens = Math.Max(0, output - _BaselineOutput) + turnReasoning;
        }

        private void HandleTurnCompleted(JsonElement turn, string raw, HarnessRunState state)
        {
            if (_UsageSeen) state.Emit(Usage(state.InputTokens, state.OutputTokens, null));
            state.SawFinalResult = true;
            string? status = JsonPath.Str(turn, "status");
            if (status == "completed" && !_TurnFailed)
            {
                state.SawSuccess = true;
                if (String.IsNullOrEmpty(state.FinalText) && state.AssistantText.Length > 0) state.FinalText = state.AssistantText.ToString();
                state.Emit(Event(RunEventTypeEnum.Result, state.FinalText, raw));
                return;
            }

            _TurnFailed = true;
            state.SawSuccess = false;
            string failure;
            if (JsonPath.TryGet(turn, "error", out JsonElement error))
            {
                failure = JsonPath.Str(error, "message") ?? "Turn failed.";
                if (IsCredentialError(error)) state.CredentialFailure ??= failure;
            }
            else
            {
                failure = status == "interrupted" ? "Turn was interrupted." : (_LastError ?? "Turn failed.");
            }
            state.DetectedFailure ??= failure;
            state.Emit(Event(RunEventTypeEnum.Error, failure, raw));
        }

        private void HandleError(JsonElement parameters, string raw, HarnessRunState state)
        {
            if (!JsonPath.TryGet(parameters, "error", out JsonElement error)) return;
            string message = JsonPath.Str(error, "message") ?? "Codex reported an error.";
            string? details = JsonPath.Str(error, "additionalDetails");
            string text = details == null ? message : message + " " + details;
            if (JsonPath.Bool(parameters, "willRetry") == true)
            {
                state.Emit(Event(RunEventTypeEnum.Warning, text, raw));
                return;
            }
            _LastError = text;
            if (IsCredentialError(error)) state.CredentialFailure ??= text;
            state.Emit(Event(RunEventTypeEnum.Error, text, raw));
        }

        private void HandleMcpStatus(JsonElement parameters, string raw, HarnessRunState state)
        {
            if (JsonPath.Str(parameters, "status") != "failed") return;
            string name = JsonPath.Str(parameters, "name") ?? "unknown";
            string message = "MCP server '" + name + "' failed to start" + (JsonPath.Str(parameters, "error") is string error ? ": " + error : ".");
            if (_RequiredServers.Contains(name)) state.DetectedFailure ??= message;
            state.Emit(Event(RunEventTypeEnum.Warning, message, raw));
        }

        private static bool IsCredentialError(JsonElement error)
        {
            if (JsonPath.TryGet(error, "codexErrorInfo", out JsonElement info))
            {
                if (info.ValueKind == JsonValueKind.String) return info.GetString() == "unauthorized";
                if (info.ValueKind == JsonValueKind.Object)
                {
                    foreach (JsonProperty variant in info.EnumerateObject())
                    {
                        if (JsonPath.Long(variant.Value, "httpStatusCode") == 401) return true;
                    }
                }
            }
            return IsCredentialText(JsonPath.Str(error, "message")) || IsCredentialText(JsonPath.Str(error, "additionalDetails"));
        }

        private static bool IsCredentialText(string? text)
        {
            if (String.IsNullOrEmpty(text)) return false;
            string lower = text.ToLowerInvariant();
            return lower.Contains("401 unauthorized", StringComparison.Ordinal) || lower.Contains("invalid_api_key", StringComparison.Ordinal) || lower.Contains("not logged in", StringComparison.Ordinal);
        }

        private static string JoinStrings(JsonElement item, string name)
        {
            if (!JsonPath.TryGet(item, name, out JsonElement array) || array.ValueKind != JsonValueKind.Array) return String.Empty;
            List<string> parts = new List<string>();
            foreach (JsonElement part in array.EnumerateArray())
            {
                if (part.ValueKind == JsonValueKind.String && !String.IsNullOrEmpty(part.GetString())) parts.Add(part.GetString()!);
            }
            return String.Join("\n", parts);
        }

        private static string McpText(JsonElement result)
        {
            if (JsonPath.TryGet(result, "content", out JsonElement content) && content.ValueKind == JsonValueKind.Array)
            {
                StringBuilder text = new StringBuilder();
                foreach (JsonElement part in content.EnumerateArray())
                {
                    string? value = JsonPath.Str(part, "text");
                    if (value == null) continue;
                    if (text.Length > 0) text.Append('\n');
                    text.Append(value);
                }
                if (text.Length > 0) return text.ToString();
            }
            return result.GetRawText();
        }

        private static string? FileChangePaths(JsonElement item)
        {
            if (!JsonPath.TryGet(item, "changes", out JsonElement changes) || changes.ValueKind != JsonValueKind.Array) return null;
            List<string> paths = new List<string>();
            foreach (JsonElement change in changes.EnumerateArray())
            {
                string? path = JsonPath.Str(change, "path");
                if (path == null) continue;
                string? kind = JsonPath.TryGet(change, "kind", out JsonElement kindElement) ? JsonPath.Str(kindElement, "type") : null;
                paths.Add(kind == null ? path : kind + " " + path);
            }
            return String.Join("\n", paths);
        }

        #endregion
    }
}
