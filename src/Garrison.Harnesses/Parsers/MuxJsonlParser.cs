namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.Json;
    using System.Text.RegularExpressions;
    using Garrison.Core.Enums;
    using Garrison.Harnesses.Execution;

    /// <summary>
    /// Parser for mux --output-format jsonl (contract version 2), compatible with Mux 1.2.0 and 1.3.0. The
    /// run_completed event carries no answer text, so the final text is the concatenated assistant_text unless the
    /// result source is LastMessageFile.
    /// <para>
    /// Mux 1.3.0 additions handled here: the <c>failed</c> run status (the last error event's message becomes the
    /// failure detail), <c>usage.cachedTokens</c> and <c>usage.costUsd</c>, <c>run_started.contextWindowSource</c>
    /// (a Warning event when it is <c>default</c>), <c>run_started.mcp.enabled</c> (falling back to the deprecated
    /// <c>mcp.supported</c>), the <c>config_unresolved_env</c> error, and the <c>schema_validation_failed</c> error,
    /// which Garrison treats as an output for its own schema validation and repair rather than a harness failure.
    /// </para>
    /// Not thread-safe.
    /// </summary>
    public class MuxJsonlParser : JsonLineParserBase
    {
        #region Private-Members

        private static readonly Regex _Http401 = new Regex(@"\b401\b", RegexOptions.Compiled | RegexOptions.CultureInvariant);
        private readonly Dictionary<string, string> _ToolNames = new Dictionary<string, string>(StringComparer.Ordinal);
        private readonly HashSet<string> _RequiredServers;
        private string? _LastError = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="requiredMcpServers">MCP server names the run requires. When any are given and run_started
        /// reports MCP as not enabled, the run fails. Null or empty disables the check.</param>
        public MuxJsonlParser(IEnumerable<string>? requiredMcpServers = null)
        {
            _RequiredServers = new HashSet<string>(requiredMcpServers ?? Array.Empty<string>(), StringComparer.Ordinal);
        }

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override void Handle(JsonElement root, string raw, HarnessRunState state)
        {
            string? type = JsonPath.Str(root, "eventType");
            switch (type)
            {
                case "run_started":
                    HandleRunStarted(root, raw, state);
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
                    HandleError(root, raw, state);
                    break;
                case "run_completed":
                    HandleRunCompleted(root, raw, state);
                    break;
                default:
                    break;
            }
        }

        #endregion

        #region Private-Methods

        private void HandleRunStarted(JsonElement root, string raw, HarnessRunState state)
        {
            state.SessionId = NonEmpty(JsonPath.Str(root, "sessionId")) ?? state.SessionId;
            state.ServedModel = NonEmpty(JsonPath.Str(root, "model")) ?? state.ServedModel;

            bool? mcpEnabled = null;
            long? mcpServers = null;
            if (JsonPath.TryGet(root, "mcp", out JsonElement mcp))
            {
                mcpEnabled = JsonPath.Bool(mcp, "enabled") ?? JsonPath.Bool(mcp, "supported");
                mcpServers = JsonPath.Long(mcp, "serverCount");
            }

            List<string> details = new List<string>();
            if (state.ServedModel != null) details.Add(state.ServedModel);
            if (mcpEnabled == true) details.Add("MCP enabled" + (mcpServers.HasValue ? " with " + mcpServers.Value + " server" + (mcpServers.Value == 1 ? String.Empty : "s") : String.Empty));
            else if (mcpEnabled == false) details.Add("MCP not enabled");
            state.Emit(Event(RunEventTypeEnum.Lifecycle, "Run started" + (details.Count > 0 ? " (" + String.Join(", ", details) + ")" : String.Empty) + ".", raw));

            if (mcpEnabled == false && _RequiredServers.Count > 0)
            {
                state.DetectedFailure ??= "Mux started without MCP, but the run requires the MCP servers " + String.Join(", ", _RequiredServers.OrderBy(s => s, StringComparer.Ordinal)) + ".";
            }

            if (JsonPath.Str(root, "contextWindowSource") == "default")
            {
                long? window = JsonPath.Long(root, "contextWindow");
                long? usable = JsonPath.Long(root, "usableInputLimit");
                string message = "Mux is using its built-in default context window"
                    + (window.HasValue ? " of " + window.Value + " tokens" : String.Empty)
                    + (usable.HasValue ? " (about " + usable.Value + " usable for input)" : String.Empty)
                    + " because neither the endpoint nor the deployment sets one. Set the deployment parameter contextWindow to the model's real context window.";
                state.Emit(Event(RunEventTypeEnum.Warning, message, null));
            }
        }

        private void HandleError(JsonElement root, string raw, HarnessRunState state)
        {
            string? code = JsonPath.Str(root, "errorCode") ?? JsonPath.Str(root, "code");
            string message = NonEmpty(JsonPath.Str(root, "message")) ?? code ?? "Mux reported an error.";

            if (code == "schema_validation_failed")
            {
                // Mux checks --output-schema itself and exits 1 on a mismatch, before Garrison can validate the output
                // and ask for a repair in the same session. Record the rejection so the outcome classifier defers to
                // Garrison's validation instead of failing the run here.
                state.HarnessRejectedOutputSchema = true;
                state.Emit(Event(RunEventTypeEnum.Warning, message, raw));
                return;
            }

            _LastError = message;
            state.Emit(Event(RunEventTypeEnum.Error, message, raw));

            string? category = JsonPath.Str(root, "failureCategory");
            if (code == "tool_call_denied") state.DetectedFailure ??= message;
            if (IsCredentialError(code, category, message)) state.CredentialFailure ??= message;

            // Errors raised before the run starts (bad flags, an unknown endpoint, config_unresolved_env) arrive with
            // no run_started or run_completed, so the error itself is the failure.
            if (category == "configuration") state.DetectedFailure ??= message;
        }

        private void HandleRunCompleted(JsonElement root, string raw, HarnessRunState state)
        {
            state.SawFinalResult = true;
            string? status = JsonPath.Str(root, "status");
            state.SawSuccess = status == "completed" || status == "completed_with_errors";
            if (!state.SawSuccess)
            {
                if (status == "failed" && _LastError != null) state.DetectedFailure ??= "Mux run failed: " + _LastError;
                else state.DetectedFailure ??= "Mux run ended with status " + (status ?? "unknown") + (_LastError != null ? ": " + _LastError : ".");
            }

            if (JsonPath.TryGet(root, "usage", out JsonElement usage))
            {
                state.InputTokens = JsonPath.Long(usage, "inputTokens") ?? 0;
                state.OutputTokens = JsonPath.Long(usage, "outputTokens") ?? 0;
                state.CachedTokens = JsonPath.Long(usage, "cachedTokens") ?? 0;
                state.ReasoningTokens = JsonPath.Long(usage, "reasoningTokens") ?? 0;
                state.CostUsd = JsonPath.Double(usage, "costUsd") ?? state.CostUsd;
                state.Emit(Usage(state.InputTokens, state.OutputTokens, null));
            }

            state.SessionId = NonEmpty(JsonPath.Str(root, "sessionId")) ?? state.SessionId;
            if (state.AssistantText.Length > 0) state.FinalText = state.AssistantText.ToString();
            state.Emit(Event(RunEventTypeEnum.Result, state.FinalText, raw));
        }

        private static bool IsCredentialError(string? code, string? category, string message)
        {
            if (code == "config_unresolved_env") return true;

            // Only model requests count: a tool that got a 401 from some other service is not a Mux credential problem.
            bool backend = category == "backend" || (code != null && code.StartsWith("llm_", StringComparison.Ordinal));
            if (!backend) return false;
            if (_Http401.IsMatch(message)) return true;
            string lower = message.ToLowerInvariant();
            return OutcomeClassifier.CredentialMarkers.Any(m => lower.Contains(m, StringComparison.Ordinal));
        }

        private static string? NonEmpty(string? value)
        {
            return String.IsNullOrEmpty(value) ? null : value;
        }

        #endregion
    }
}
