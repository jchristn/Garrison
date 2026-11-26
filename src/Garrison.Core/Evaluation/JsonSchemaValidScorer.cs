namespace Garrison.Core.Evaluation
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Services;

    /// <summary>
    /// JsonSchemaValid (AA9.4): the output is a JSON document that matches the JSON Schema in the check's argument
    /// (user-authored text, unmanaged). A Markdown code fence around the document is removed first. Validation uses the
    /// same JsonSchema.Net evaluation as agent input schemas. Score 1 and passed when valid, 0 otherwise. Thread-safe.
    /// </summary>
    public class JsonSchemaValidScorer : IEvalScorer
    {
        #region Public-Members

        /// <inheritdoc />
        public EvalScorerEnum Scorer
        {
            get
            {
                return EvalScorerEnum.JsonSchemaValid;
            }
        }

        #endregion

        #region Private-Members

        private readonly InputSchemaValidator _Validator = new InputSchemaValidator();

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task<EvalScore> ScoreAsync(EvalScoreRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            token.ThrowIfCancellationRequested();
            if (String.IsNullOrWhiteSpace(request.Argument)) return Task.FromResult(new EvalScore(0, false, "The check has no JSON Schema: put the schema in its argument."));
            string? problem = InputSchemaValidator.CheckSchema(request.Argument);
            if (problem != null) return Task.FromResult(new EvalScore(0, false, problem));
            if (String.IsNullOrWhiteSpace(request.Output)) return Task.FromResult(new EvalScore(0, false, "There was no output."));
            List<InputSchemaViolation> violations = _Validator.Validate(request.Argument, Unfence(request.Output));
            if (violations.Count == 0) return Task.FromResult(new EvalScore(1, true, "The output matches the schema."));
            return Task.FromResult(new EvalScore(0, false, String.Join(" ", violations.Take(3).Select(v => v.Message))));
        }

        /// <summary>
        /// Remove one surrounding Markdown code fence (```json ... ```) and surrounding white space.
        /// </summary>
        /// <param name="text">Text.</param>
        /// <returns>The text inside the fence, or the trimmed text when there is none.</returns>
        public static string Unfence(string text)
        {
            if (text == null) throw new ArgumentNullException(nameof(text));
            string trimmed = text.Trim();
            if (!trimmed.StartsWith("```", StringComparison.Ordinal) || !trimmed.EndsWith("```", StringComparison.Ordinal) || trimmed.Length < 6) return trimmed;
            int firstLine = trimmed.IndexOf('\n');
            if (firstLine < 0) return trimmed;
            return trimmed.Substring(firstLine + 1, trimmed.Length - firstLine - 4).Trim();
        }

        #endregion
    }
}
