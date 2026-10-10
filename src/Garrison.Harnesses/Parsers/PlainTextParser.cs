namespace Garrison.Harnesses.Parsers
{
    using System;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;

    /// <summary>
    /// Parser for plain text output: every line is assistant text and the final text is the whole output. Success is
    /// decided by exit code. Not thread-safe.
    /// </summary>
    public class PlainTextParser : IHarnessOutputParser
    {
        /// <inheritdoc />
        public void ParseLine(string line, HarnessRunState state)
        {
            if (state == null) throw new ArgumentNullException(nameof(state));
            if (line == null) return;
            state.Stdout.AppendLine(line);
            if (state.AssistantText.Length > 0) state.AssistantText.Append('\n');
            state.AssistantText.Append(line);
            RunEventReport report = new RunEventReport();
            report.EventType = RunEventTypeEnum.AssistantText;
            report.Text = line;
            state.Emit(report);
        }

        /// <inheritdoc />
        public void Complete(HarnessRunState state)
        {
            if (state == null) return;
            state.FinalText = state.AssistantText.ToString();
        }
    }
}
