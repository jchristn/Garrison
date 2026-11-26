namespace Garrison.Core.Evaluation
{
    using System;
    using System.Text.Json;
    using Garrison.Core.Serialization;

    /// <summary>
    /// Reads an <see cref="EvalJudgeVerdict"/> from a judge's reply (AA9.4): the structured output when the judge agent
    /// has an output schema, otherwise the first JSON object in the reply text (a code fence or words around it are
    /// ignored). Deserializes into the typed class; no DOM navigation. Thread-safe.
    /// </summary>
    public static class EvalJudgeVerdictParser
    {
        #region Public-Methods

        /// <summary>
        /// Parse a verdict.
        /// </summary>
        /// <param name="structuredOutputJson">Structured output JSON, or null.</param>
        /// <param name="output">Reply text, or null.</param>
        /// <param name="verdict">The verdict, or null when none parsed.</param>
        /// <returns>True when a verdict with a score parsed.</returns>
        public static bool TryParse(string? structuredOutputJson, string? output, out EvalJudgeVerdict? verdict)
        {
            verdict = Deserialize(structuredOutputJson);
            if (verdict != null) return true;
            if (String.IsNullOrWhiteSpace(output)) return false;
            int start = output.IndexOf('{');
            int end = output.LastIndexOf('}');
            if (start < 0 || end <= start) return false;
            verdict = Deserialize(output.Substring(start, end - start + 1));
            return verdict != null;
        }

        #endregion

        #region Private-Methods

        private static EvalJudgeVerdict? Deserialize(string? json)
        {
            if (String.IsNullOrWhiteSpace(json)) return null;
            if (!json.Contains("score", StringComparison.OrdinalIgnoreCase)) return null;
            try
            {
                return Serializer.Deserialize<EvalJudgeVerdict>(json);
            }
            catch (JsonException)
            {
                return null;
            }
            catch (NotSupportedException)
            {
                return null;
            }
        }

        #endregion
    }
}
