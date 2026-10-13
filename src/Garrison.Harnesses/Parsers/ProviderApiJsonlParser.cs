namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Text.Json;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;
    using Garrison.Harnesses.Provider;

    /// <summary>Normalizes the fixed bundled provider protocol without JSON DOM navigation. One instance per run.</summary>
    public class ProviderApiJsonlParser : IHarnessOutputParser
    {
        /// <inheritdoc />
        public void ParseLine(string line, HarnessRunState state)
        {
            ArgumentNullException.ThrowIfNull(state);
            if (String.IsNullOrWhiteSpace(line)) return;
            state.Stdout.AppendLine(line);
            ProviderApiEvent? item;
            try { item = Serializer.Deserialize<ProviderApiEvent>(line); }
            catch (JsonException) { state.UnparsedLines++; return; }
            if (item == null) { state.UnparsedLines++; return; }
            if (item.SessionId != null) state.SessionId = item.SessionId;
            if (item.Model != null) state.ServedModel = item.Model;
            switch (item.EventType)
            {
                case RunEventTypeEnum.AssistantText:
                    state.AssistantText.Append(item.Text);
                    break;
                case RunEventTypeEnum.Usage:
                    state.InputTokens += Math.Max(0, item.InputTokens ?? 0);
                    state.OutputTokens += Math.Max(0, item.OutputTokens ?? 0);
                    state.CachedTokens += Math.Max(0, item.CachedTokens ?? 0);
                    state.ReasoningTokens += Math.Max(0, item.ReasoningTokens ?? 0);
                    break;
                case RunEventTypeEnum.Result:
                    state.FinalText = item.Text;
                    state.SawFinalResult = true;
                    state.SawSuccess = item.Success == true;
                    break;
                case RunEventTypeEnum.Error:
                    state.DetectedFailure = item.Text ?? "Provider API execution failed.";
                    if (item.Code == "NotCredentialed") state.CredentialFailure = state.DetectedFailure;
                    break;
            }
            item.RawEventJson = line;
            state.Emit(item);
        }

        /// <inheritdoc />
        public void Complete(HarnessRunState state) { }
    }
}
