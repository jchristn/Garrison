namespace Garrison.Core.Transcripts
{
    using System;
    using System.Globalization;
    using System.Text;
    using Garrison.Core.Enums;

    /// <summary>
    /// Renders a <see cref="Transcript"/> as readable Markdown (P12.27). User and agent text goes into code fences long
    /// enough that the text cannot close them, so a transcript renders the same whatever the agent wrote. Thread-safe.
    /// </summary>
    public static class TranscriptMarkdownWriter
    {
        #region Public-Methods

        /// <summary>
        /// Render a transcript.
        /// </summary>
        /// <param name="transcript">Transcript.</param>
        /// <returns>Markdown text.</returns>
        /// <exception cref="ArgumentNullException">Thrown when transcript is null.</exception>
        public static string Write(Transcript transcript)
        {
            if (transcript == null) throw new ArgumentNullException(nameof(transcript));
            StringBuilder md = new StringBuilder();
            if (transcript.Kind == TranscriptKindEnum.Conversation)
            {
                md.Append("# Conversation transcript: ").Append(Inline(String.IsNullOrWhiteSpace(transcript.Title) ? transcript.ConversationId : transcript.Title)).Append('\n').Append('\n');
            }
            else
            {
                md.Append("# Run transcript: ").Append(Inline(transcript.RunId)).Append('\n').Append('\n');
            }

            md.Append("| | |\n|---|---|\n");
            Row(md, "Agent", transcript.AgentName);
            if (transcript.Kind == TranscriptKindEnum.Run) Row(md, "Run", transcript.RunId);
            Row(md, "Conversation", transcript.ConversationId);
            Row(md, "Tenant", transcript.TenantId);
            if (transcript.Kind == TranscriptKindEnum.Conversation) Row(md, "Turns", transcript.TurnCount.ToString(CultureInfo.InvariantCulture));
            if (transcript.Kind == TranscriptKindEnum.Run && transcript.Turns.Count > 0)
            {
                TranscriptTurn only = transcript.Turns[0];
                Row(md, "Status", only.Status + (only.Outcome != RunOutcomeEnum.None ? " (" + only.Outcome + ")" : String.Empty));
                Row(md, "Model", only.Model);
                Row(md, "Caller", only.CallerName);
                Row(md, "Created", Time(only.CreatedUtc));
                Row(md, "Completed", only.CompletedUtc.HasValue ? Time(only.CompletedUtc.Value) : null);
            }
            Row(md, "Usage", UsageText(transcript.Usage));
            Row(md, "Generated", Time(transcript.GeneratedUtc));
            Row(md, "Thinking", transcript.IncludesThinking ? "included" : "not included");
            md.Append('\n');
            if (transcript.Truncated && !String.IsNullOrEmpty(transcript.TruncationNote))
            {
                md.Append("> **Truncated.** ").Append(Inline(transcript.TruncationNote)).Append('\n').Append('\n');
            }

            foreach (TranscriptTurn turn in transcript.Turns) WriteTurn(md, transcript, turn);
            return md.ToString();
        }

        #endregion

        #region Private-Methods

        private static void WriteTurn(StringBuilder md, Transcript transcript, TranscriptTurn turn)
        {
            if (transcript.Kind == TranscriptKindEnum.Conversation)
            {
                md.Append("## Turn ").Append(turn.Turn.ToString(CultureInfo.InvariantCulture)).Append(": ").Append(Inline(turn.RunId)).Append('\n').Append('\n');
                md.Append("- Status: ").Append(turn.Status).Append(turn.Outcome != RunOutcomeEnum.None ? " (" + turn.Outcome + ")" : String.Empty).Append('\n');
                if (!String.IsNullOrEmpty(turn.Model)) md.Append("- Model: ").Append(Inline(turn.Model)).Append('\n');
                md.Append("- Created: ").Append(Time(turn.CreatedUtc)).Append('\n');
                if (turn.CompletedUtc.HasValue) md.Append("- Completed: ").Append(Time(turn.CompletedUtc.Value)).Append('\n');
                md.Append('\n');
            }

            string sub = transcript.Kind == TranscriptKindEnum.Conversation ? "###" : "##";
            md.Append(sub).Append(" Input\n\n");
            if (String.IsNullOrEmpty(turn.Input)) md.Append("_No input recorded._\n\n");
            else Fence(md, turn.Input, turn.InputContentType != null && turn.InputContentType.Contains("json", StringComparison.OrdinalIgnoreCase) ? "json" : "text");

            md.Append(sub).Append(" Activity\n\n");
            if (turn.Entries.Count == 0) md.Append("_No events recorded._\n\n");
            foreach (TranscriptEntry entry in turn.Entries) WriteEntry(md, entry);
            if (turn.OmittedEvents > 0)
            {
                md.Append("_").Append(turn.OmittedEvents.ToString(CultureInfo.InvariantCulture)).Append(" earlier event(s) are no longer stored (event retention)._\n\n");
            }
            if (turn.Truncated) md.Append("_The rest of this turn was left out because the transcript reached its size limit._\n\n");

            if (turn.Approvals.Count > 0)
            {
                md.Append(sub).Append(" Approvals\n\n");
                foreach (TranscriptApproval approval in turn.Approvals)
                {
                    md.Append("- ").Append(Time(approval.RequestedUtc)).Append(" `").Append(Code(approval.ToolName)).Append("`");
                    if (!String.IsNullOrEmpty(approval.Summary)) md.Append(": ").Append(Inline(approval.Summary));
                    md.Append(". ").Append(approval.Status);
                    if (approval.Decision.HasValue) md.Append(", ").Append(approval.Decision.Value);
                    if (approval.DecisionSource.HasValue) md.Append(" by ").Append(approval.DecisionSource.Value);
                    if (!String.IsNullOrEmpty(approval.DecidedBy)) md.Append(" (").Append(Inline(approval.DecidedBy)).Append(')');
                    if (approval.DecidedUtc.HasValue) md.Append(" at ").Append(Time(approval.DecidedUtc.Value));
                    if (!String.IsNullOrEmpty(approval.Reason)) md.Append(". Reason: ").Append(Inline(approval.Reason));
                    md.Append('\n');
                }
                md.Append('\n');
            }

            if (!String.IsNullOrEmpty(turn.Result))
            {
                md.Append(sub).Append(" Result\n\n");
                Fence(md, turn.Result, "text");
            }
            if (!String.IsNullOrEmpty(turn.ErrorMessage))
            {
                md.Append(sub).Append(" Error\n\n");
                Fence(md, turn.ErrorMessage, "text");
            }

            md.Append(sub).Append(" Usage\n\n").Append(UsageText(turn.Usage)).Append('\n').Append('\n');
        }

        private static void WriteEntry(StringBuilder md, TranscriptEntry entry)
        {
            string time = Time(entry.TimestampUtc);
            switch (entry.Type)
            {
                case RunEventTypeEnum.AssistantText:
                    md.Append("**Assistant** (").Append(time).Append(")\n\n");
                    Fence(md, entry.Text ?? String.Empty, "text");
                    break;
                case RunEventTypeEnum.Thinking:
                    md.Append("**Thinking** (").Append(time).Append(")\n\n");
                    Fence(md, entry.Text ?? String.Empty, "text");
                    break;
                case RunEventTypeEnum.ToolCall:
                    md.Append("**Tool call** `").Append(Code(entry.ToolName ?? "tool")).Append('`');
                    if (!String.IsNullOrEmpty(entry.ToolCallId)) md.Append(" id `").Append(Code(entry.ToolCallId)).Append('`');
                    md.Append(" (").Append(time).Append(")\n\n");
                    if (!String.IsNullOrEmpty(entry.Text)) Fence(md, entry.Text + (entry.TextTruncated ? "\n[truncated]" : String.Empty), LooksLikeJson(entry.Text) ? "json" : "text");
                    break;
                case RunEventTypeEnum.ToolResult:
                    md.Append("**Tool result**");
                    if (!String.IsNullOrEmpty(entry.ToolName)) md.Append(" `").Append(Code(entry.ToolName)).Append('`');
                    if (!String.IsNullOrEmpty(entry.ToolCallId)) md.Append(" id `").Append(Code(entry.ToolCallId)).Append('`');
                    if (entry.Success.HasValue) md.Append(entry.Success.Value ? ", succeeded" : ", failed");
                    md.Append(" (").Append(time).Append(")\n\n");
                    if (!String.IsNullOrEmpty(entry.Text)) Fence(md, entry.Text + (entry.TextTruncated ? "\n[truncated]" : String.Empty), "text");
                    break;
                default:
                    md.Append("**").Append(entry.Type).Append("**");
                    if (!String.IsNullOrEmpty(entry.Code)) md.Append(" `").Append(Code(entry.Code)).Append('`');
                    md.Append(" (").Append(time).Append(")");
                    if (!String.IsNullOrEmpty(entry.Text)) md.Append(": ").Append(Inline(entry.Text));
                    md.Append('\n').Append('\n');
                    break;
            }
        }

        private static void Row(StringBuilder md, string label, string? value)
        {
            if (String.IsNullOrEmpty(value)) return;
            md.Append("| ").Append(label).Append(" | ").Append(Inline(value).Replace("|", "\\|", StringComparison.Ordinal)).Append(" |\n");
        }

        private static void Fence(StringBuilder md, string text, string language)
        {
            int longest = 0;
            int current = 0;
            foreach (char c in text)
            {
                if (c == '`')
                {
                    current++;
                    if (current > longest) longest = current;
                }
                else
                {
                    current = 0;
                }
            }
            string fence = new string('`', Math.Max(3, longest + 1));
            md.Append(fence).Append(language).Append('\n').Append(text.TrimEnd('\n', '\r')).Append('\n').Append(fence).Append('\n').Append('\n');
        }

        private static string UsageText(TranscriptUsage usage)
        {
            StringBuilder text = new StringBuilder();
            text.Append(usage.InputTokens.ToString("N0", CultureInfo.InvariantCulture)).Append(" input tokens, ");
            text.Append(usage.OutputTokens.ToString("N0", CultureInfo.InvariantCulture)).Append(" output tokens");
            if (usage.CachedTokens > 0) text.Append(", ").Append(usage.CachedTokens.ToString("N0", CultureInfo.InvariantCulture)).Append(" cached");
            if (usage.ReasoningTokens > 0) text.Append(", ").Append(usage.ReasoningTokens.ToString("N0", CultureInfo.InvariantCulture)).Append(" reasoning");
            if (usage.ToolCallCount > 0) text.Append(", ").Append(usage.ToolCallCount.ToString(CultureInfo.InvariantCulture)).Append(" tool call(s)");
            if (usage.CostUsd.HasValue) text.Append(", $").Append(usage.CostUsd.Value.ToString("0.0000", CultureInfo.InvariantCulture)).Append(usage.CostEstimated ? " (estimated)" : String.Empty);
            if (usage.DurationMs.HasValue) text.Append(", ").Append((usage.DurationMs.Value / 1000.0).ToString("0.0", CultureInfo.InvariantCulture)).Append(" s");
            return text.ToString();
        }

        private static string Time(DateTime value)
        {
            return value.ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss'Z'", CultureInfo.InvariantCulture);
        }

        private static string Inline(string? value)
        {
            if (String.IsNullOrEmpty(value)) return String.Empty;
            string single = value.Replace("\r", " ", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal);
            StringBuilder escaped = new StringBuilder(single.Length);
            foreach (char c in single)
            {
                if ("\\`*_[]<>#".IndexOf(c) >= 0) escaped.Append('\\');
                escaped.Append(c);
            }
            return escaped.ToString();
        }

        private static string Code(string value)
        {
            return value.Replace("`", "'", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal);
        }

        private static bool LooksLikeJson(string text)
        {
            string trimmed = text.TrimStart();
            return trimmed.StartsWith("{", StringComparison.Ordinal) || trimmed.StartsWith("[", StringComparison.Ordinal);
        }

        #endregion
    }
}
