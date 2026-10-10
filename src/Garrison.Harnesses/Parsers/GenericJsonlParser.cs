namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Text.Json;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;

    /// <summary>
    /// Configurable parser for any CLI that emits JSON lines. Text, final result, and success are located by dotted
    /// paths from <see cref="ExecutionParserOptions"/>. Not thread-safe.
    /// </summary>
    public class GenericJsonlParser : JsonLineParserBase
    {
        #region Private-Members

        private readonly ExecutionParserOptions _Options;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="options">Field mappings.</param>
        /// <exception cref="ArgumentNullException">Thrown when options is null.</exception>
        public GenericJsonlParser(ExecutionParserOptions options)
        {
            _Options = options ?? throw new ArgumentNullException(nameof(options));
        }

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override void Handle(JsonElement root, string raw, HarnessRunState state)
        {
            if (JsonPath.TryPath(root, _Options.TextField, out JsonElement text))
            {
                string value = JsonPath.AsText(text);
                state.AssistantText.Append(value);
                state.Emit(Event(RunEventTypeEnum.AssistantText, value, raw));
            }

            if (JsonPath.TryPath(root, _Options.FinalField, out JsonElement final))
            {
                state.FinalText = JsonPath.AsText(final);
                state.SawFinalResult = true;
                state.Emit(Event(RunEventTypeEnum.Result, state.FinalText, raw));
                if (String.IsNullOrEmpty(_Options.SuccessField)) state.SawSuccess = true;
            }

            if (JsonPath.TryPath(root, _Options.SuccessField, out JsonElement success))
            {
                state.SawFinalResult = true;
                string value = JsonPath.AsText(success);
                state.SawSuccess = String.IsNullOrEmpty(_Options.SuccessValue)
                    ? value == "true"
                    : String.Equals(value, _Options.SuccessValue, StringComparison.OrdinalIgnoreCase);
                if (!state.SawSuccess) state.DetectedFailure ??= "Success field '" + _Options.SuccessField + "' was '" + value + "'.";
            }
        }

        #endregion
    }
}
