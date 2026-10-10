namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Text.Json;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;

    /// <summary>
    /// Base for parsers of JSON-lines harness output. Non-JSON lines become Stdout events. Not thread-safe.
    /// </summary>
    public abstract class JsonLineParserBase : IHarnessOutputParser
    {
        #region Public-Methods

        /// <inheritdoc />
        public void ParseLine(string line, HarnessRunState state)
        {
            if (state == null) throw new ArgumentNullException(nameof(state));
            if (String.IsNullOrWhiteSpace(line)) return;
            state.Stdout.AppendLine(line);

            string trimmed = line.Trim();
            if (!trimmed.StartsWith("{", StringComparison.Ordinal))
            {
                state.UnparsedLines++;
                state.Emit(Event(RunEventTypeEnum.Stdout, line, null));
                return;
            }

            try
            {
                using (JsonDocument document = JsonDocument.Parse(trimmed))
                {
                    Handle(document.RootElement, trimmed, state);
                }
            }
            catch (JsonException)
            {
                state.UnparsedLines++;
                state.Emit(Event(RunEventTypeEnum.Stdout, line, null));
            }
        }

        /// <inheritdoc />
        public virtual void Complete(HarnessRunState state)
        {
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Handle one parsed JSON event.
        /// </summary>
        /// <param name="root">Event root.</param>
        /// <param name="raw">Raw line.</param>
        /// <param name="state">Run state.</param>
        protected abstract void Handle(JsonElement root, string raw, HarnessRunState state);

        /// <summary>
        /// Build an event.
        /// </summary>
        /// <param name="type">Type.</param>
        /// <param name="text">Text.</param>
        /// <param name="raw">Raw JSON.</param>
        /// <returns>Event.</returns>
        protected static RunEventReport Event(RunEventTypeEnum type, string? text, string? raw)
        {
            RunEventReport report = new RunEventReport();
            report.EventType = type;
            report.TimestampUtc = DateTime.UtcNow;
            report.Text = text;
            report.RawEventJson = raw;
            return report;
        }

        /// <summary>
        /// Build a tool call event.
        /// </summary>
        /// <param name="name">Tool name.</param>
        /// <param name="id">Tool call identifier.</param>
        /// <param name="input">Input text.</param>
        /// <param name="raw">Raw JSON.</param>
        /// <returns>Event.</returns>
        protected static RunEventReport ToolCall(string? name, string? id, string? input, string? raw)
        {
            RunEventReport report = Event(RunEventTypeEnum.ToolCall, input, raw);
            report.ToolName = name;
            report.ToolCallId = id;
            return report;
        }

        /// <summary>
        /// Build a tool result event.
        /// </summary>
        /// <param name="name">Tool name.</param>
        /// <param name="id">Tool call identifier.</param>
        /// <param name="success">Success.</param>
        /// <param name="output">Output text.</param>
        /// <param name="raw">Raw JSON.</param>
        /// <returns>Event.</returns>
        protected static RunEventReport ToolResult(string? name, string? id, bool success, string? output, string? raw)
        {
            RunEventReport report = Event(RunEventTypeEnum.ToolResult, Truncate(output, 4000), raw);
            report.ToolName = name;
            report.ToolCallId = id;
            report.Success = success;
            return report;
        }

        /// <summary>
        /// Build a usage event.
        /// </summary>
        /// <param name="input">Input tokens.</param>
        /// <param name="output">Output tokens.</param>
        /// <param name="raw">Raw JSON.</param>
        /// <returns>Event.</returns>
        protected static RunEventReport Usage(long input, long output, string? raw)
        {
            RunEventReport report = Event(RunEventTypeEnum.Usage, null, raw);
            report.InputTokens = input;
            report.OutputTokens = output;
            return report;
        }

        /// <summary>
        /// Truncate text.
        /// </summary>
        /// <param name="text">Text.</param>
        /// <param name="max">Maximum characters.</param>
        /// <returns>Truncated text.</returns>
        protected static string? Truncate(string? text, int max)
        {
            if (text == null || text.Length <= max) return text;
            return text.Substring(0, max);
        }

        #endregion
    }
}
