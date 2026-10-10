namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.Json;
    using Json.Schema;

    /// <summary>
    /// Validates a run's final output against an agent's output schema (JSON Schema, any draft JsonSchema.Net
    /// supports; 2020-12 when the schema does not declare <c>$schema</c>). The document validated is the harness's
    /// structured output when present, otherwise the final result text parsed as JSON. Each call builds the schema
    /// with its own registry, so schemas that share an <c>$id</c> never collide, and remote <c>$ref</c> targets are
    /// never fetched. Thread-safe.
    /// </summary>
    public class OutputSchemaValidator
    {
        #region Public-Members

        /// <summary>
        /// Maximum number of validation errors kept in a result. Minimum 1, maximum 50, default 5.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the value is outside 1 to 50.</exception>
        public int MaxErrors
        {
            get
            {
                return _MaxErrors;
            }
            set
            {
                if (value < 1 || value > 50) throw new ArgumentOutOfRangeException(nameof(MaxErrors), "MaxErrors must be between 1 and 50.");
                _MaxErrors = value;
            }
        }

        /// <summary>
        /// Whether a result text wrapped in a single Markdown code fence (three backticks, optionally tagged json) is
        /// unwrapped before parsing. Default true. Structured output reported by the harness is never unwrapped.
        /// </summary>
        public bool UnwrapCodeFence { get; set; } = true;

        #endregion

        #region Private-Members

        private int _MaxErrors = 5;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Validate a run's output.
        /// </summary>
        /// <param name="schemaJson">Output schema JSON.</param>
        /// <param name="structuredOutputJson">Structured output reported by the harness, or null.</param>
        /// <param name="resultText">Final result text, used when there is no structured output, or null.</param>
        /// <returns>Validation result. Never null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when schemaJson is null or empty.</exception>
        public OutputSchemaValidationResult Validate(string schemaJson, string? structuredOutputJson, string? resultText)
        {
            if (String.IsNullOrWhiteSpace(schemaJson)) throw new ArgumentNullException(nameof(schemaJson));

            OutputSchemaValidationResult result = new OutputSchemaValidationResult();
            JsonSchema schema;
            try
            {
                BuildOptions options = new BuildOptions();
                options.SchemaRegistry = new SchemaRegistry();
                schema = JsonSchema.FromText(schemaJson, options, new Uri("https://garrison.invalid/output-schema/" + Guid.NewGuid().ToString("N")));
            }
            catch (Exception e) when (IsSchemaFailure(e))
            {
                result.SchemaUnusable = true;
                AddError(result, "(schema): the agent's output schema could not be loaded: " + e.Message);
                return result;
            }

            string candidate;
            if (!String.IsNullOrWhiteSpace(structuredOutputJson))
            {
                candidate = structuredOutputJson;
                result.Source = "structuredOutput";
            }
            else if (!String.IsNullOrWhiteSpace(resultText))
            {
                candidate = UnwrapCodeFence ? Unwrap(resultText) : resultText.Trim();
                result.Source = "resultText";
            }
            else
            {
                AddError(result, "(root): the run produced no output to validate");
                return result;
            }

            JsonDocument document;
            try
            {
                document = JsonDocument.Parse(candidate);
            }
            catch (JsonException e)
            {
                AddError(result, "(root): output is not valid JSON (" + e.Message + ")");
                return result;
            }

            using (document)
            {
                result.Json = JsonSerializer.Serialize(document.RootElement);
                EvaluationResults evaluation;
                try
                {
                    EvaluationOptions evaluationOptions = new EvaluationOptions();
                    evaluationOptions.OutputFormat = OutputFormat.List;
                    evaluation = schema.Evaluate(document.RootElement, evaluationOptions);
                }
                catch (Exception e) when (IsSchemaFailure(e))
                {
                    result.SchemaUnusable = true;
                    AddError(result, "(schema): the agent's output schema could not be evaluated: " + e.Message);
                    return result;
                }

                if (evaluation.IsValid)
                {
                    result.Valid = true;
                    return result;
                }

                Collect(result, evaluation);
                if (evaluation.Details != null)
                {
                    foreach (EvaluationResults detail in evaluation.Details) Collect(result, detail);
                }
                if (result.TotalErrors == 0) AddError(result, "(root): output does not match the schema");
                return result;
            }
        }

        #endregion

        #region Private-Methods

        private static bool IsSchemaFailure(Exception e)
        {
            return e is JsonException || e is JsonSchemaException || e is RefResolutionException || e is ArgumentException || e is InvalidOperationException || e is NotSupportedException || e is FormatException;
        }

        private void Collect(OutputSchemaValidationResult result, EvaluationResults node)
        {
            if (node.Errors == null || node.Errors.Count == 0) return;
            string location = node.InstanceLocation.ToString();
            if (String.IsNullOrEmpty(location)) location = "(root)";
            string path = node.EvaluationPath.ToString();
            string pathKeyword = path.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? String.Empty;
            foreach (KeyValuePair<string, string> error in node.Errors)
            {
                string keyword = String.IsNullOrEmpty(error.Key) ? pathKeyword : error.Key;
                AddError(result, location + ": " + error.Value + (String.IsNullOrEmpty(keyword) ? String.Empty : " (" + keyword + ")"));
            }
        }

        private void AddError(OutputSchemaValidationResult result, string error)
        {
            result.TotalErrors++;
            if (result.Errors.Count < _MaxErrors) result.Errors.Add(error);
        }

        private static string Unwrap(string text)
        {
            string trimmed = text.Trim();
            if (!trimmed.StartsWith("```", StringComparison.Ordinal) || !trimmed.EndsWith("```", StringComparison.Ordinal) || trimmed.Length < 6) return trimmed;
            int firstNewline = trimmed.IndexOf('\n');
            if (firstNewline < 0) return trimmed;
            string tag = trimmed.Substring(3, firstNewline - 3).Trim();
            if (tag.Length > 0 && !String.Equals(tag, "json", StringComparison.OrdinalIgnoreCase)) return trimmed;
            string inner = trimmed.Substring(firstNewline + 1, trimmed.Length - firstNewline - 1 - 3);
            return inner.Trim();
        }

        #endregion
    }
}
