namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Text.Json;
    using System.Text.RegularExpressions;
    using Json.Schema;

    /// <summary>
    /// Validates JSON Schema documents when an agent is saved and invocation inputs against an agent's input schema
    /// (P12.22). Schemas use any draft JsonSchema.Net supports (2020-12 when <c>$schema</c> is absent); each call builds
    /// the schema with its own registry, so schemas that share an <c>$id</c> never collide, and remote <c>$ref</c>
    /// targets are never fetched. Thread-safe.
    /// </summary>
    public class InputSchemaValidator
    {
        #region Public-Members

        /// <summary>
        /// Field code for an input that is not a JSON document.
        /// </summary>
        public static readonly string NotJsonCode = "InputNotJson";

        /// <summary>
        /// Field code for an input that does not match the schema.
        /// </summary>
        public static readonly string ViolationCode = "InputSchemaViolation";

        /// <summary>
        /// Field code for a schema that is not a usable JSON Schema document.
        /// </summary>
        public static readonly string InvalidSchemaCode = "InvalidJsonSchema";

        /// <summary>
        /// Most violations reported for one input. Minimum 1, maximum 100, default 20.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the value is outside 1 to 100.</exception>
        public int MaxViolations
        {
            get
            {
                return _MaxViolations;
            }
            set
            {
                if (value < 1 || value > 100) throw new ArgumentOutOfRangeException(nameof(MaxViolations), "MaxViolations must be between 1 and 100.");
                _MaxViolations = value;
            }
        }

        #endregion

        #region Private-Members

        private int _MaxViolations = 20;
        private static readonly Regex _Quoted = new Regex("\"([^\"]+)\"", RegexOptions.Compiled | RegexOptions.CultureInvariant, TimeSpan.FromSeconds(1));

        #endregion

        #region Public-Methods

        /// <summary>
        /// Check that a text is a usable JSON Schema document.
        /// </summary>
        /// <param name="schemaJson">Schema text; null or whitespace means no schema and is valid.</param>
        /// <returns>Null when usable (or absent), otherwise a readable reason.</returns>
        public static string? CheckSchema(string? schemaJson)
        {
            if (String.IsNullOrWhiteSpace(schemaJson)) return null;
            try
            {
                using (JsonDocument document = JsonDocument.Parse(schemaJson))
                {
                    JsonValueKind kind = document.RootElement.ValueKind;
                    if (kind != JsonValueKind.Object && kind != JsonValueKind.True && kind != JsonValueKind.False) return "A JSON Schema must be an object (or true or false).";
                }
                JsonSchema schema = Build(schemaJson);
                using (JsonDocument probe = JsonDocument.Parse("{}"))
                {
                    // Evaluating once resolves references and keyword values, which building alone does not check.
                    schema.Evaluate(probe.RootElement, new EvaluationOptions());
                }
                return null;
            }
            catch (Exception e) when (IsSchemaFailure(e))
            {
                return "Not a usable JSON Schema: " + e.Message;
            }
        }

        /// <summary>
        /// Validate an input against a schema.
        /// </summary>
        /// <param name="schemaJson">Input schema JSON.</param>
        /// <param name="input">Input text.</param>
        /// <returns>Violations; empty when the input is valid. Never null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when schemaJson is null or empty.</exception>
        public List<InputSchemaViolation> Validate(string schemaJson, string? input)
        {
            if (String.IsNullOrWhiteSpace(schemaJson)) throw new ArgumentNullException(nameof(schemaJson));
            List<InputSchemaViolation> violations = new List<InputSchemaViolation>();
            JsonSchema schema;
            try
            {
                schema = Build(schemaJson);
            }
            catch (Exception e) when (IsSchemaFailure(e))
            {
                violations.Add(new InputSchemaViolation { Field = "input", Code = ViolationCode, Message = "The agent's input schema could not be loaded: " + e.Message });
                return violations;
            }

            JsonDocument document;
            try
            {
                document = JsonDocument.Parse(input ?? String.Empty);
            }
            catch (JsonException e)
            {
                violations.Add(new InputSchemaViolation { Field = "input", Code = NotJsonCode, Message = "This agent takes a JSON document that matches its input schema; the input is not JSON (" + e.Message + ")." });
                return violations;
            }

            using (document)
            {
                EvaluationResults evaluation;
                try
                {
                    EvaluationOptions options = new EvaluationOptions();
                    options.OutputFormat = OutputFormat.List;
                    evaluation = schema.Evaluate(document.RootElement, options);
                }
                catch (Exception e) when (IsSchemaFailure(e))
                {
                    violations.Add(new InputSchemaViolation { Field = "input", Code = ViolationCode, Message = "The agent's input schema could not be evaluated: " + e.Message });
                    return violations;
                }
                if (evaluation.IsValid) return violations;

                Collect(violations, evaluation);
                if (evaluation.Details != null)
                {
                    foreach (EvaluationResults detail in evaluation.Details) Collect(violations, detail);
                }
                if (violations.Count == 0) violations.Add(new InputSchemaViolation { Field = "input", Code = ViolationCode, Message = "The input does not match the agent's input schema." });
                return violations;
            }
        }

        /// <summary>
        /// Validate an input and throw when it does not match.
        /// </summary>
        /// <param name="schemaJson">Input schema JSON; null or whitespace means no schema and nothing is checked.</param>
        /// <param name="input">Input text.</param>
        /// <exception cref="ValidationException">Thrown with one field and field code per violation when the input does not match.</exception>
        public void Require(string? schemaJson, string? input)
        {
            if (String.IsNullOrWhiteSpace(schemaJson)) return;
            List<InputSchemaViolation> violations = Validate(schemaJson, input);
            if (violations.Count == 0) return;
            Dictionary<string, string> fields = new Dictionary<string, string>(StringComparer.Ordinal);
            Dictionary<string, string> codes = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (InputSchemaViolation violation in violations)
            {
                if (fields.TryGetValue(violation.Field, out string? existing))
                {
                    if (!existing.Contains(violation.Message, StringComparison.Ordinal)) fields[violation.Field] = existing + " " + violation.Message;
                    continue;
                }
                fields[violation.Field] = violation.Message;
                codes[violation.Field] = violation.Code;
            }
            bool notJson = violations.Any(v => v.Code == NotJsonCode);
            throw new ValidationException(notJson ? "The input is not a JSON document; this agent takes input that matches its input schema." : "The input does not match the agent's input schema.", fields, codes);
        }

        /// <summary>
        /// Convert a JSON Pointer instance location to a field key under <c>input</c>.
        /// </summary>
        /// <param name="pointer">JSON Pointer such as <c>/address/city</c> or <c>/tags/1</c>; empty for the root.</param>
        /// <returns>Field key such as <c>input.address.city</c> or <c>input.tags[1]</c>.</returns>
        public static string FieldFor(string? pointer)
        {
            StringBuilder builder = new StringBuilder("input");
            if (String.IsNullOrEmpty(pointer) || pointer == "#") return builder.ToString();
            string trimmed = pointer.StartsWith("#", StringComparison.Ordinal) ? pointer.Substring(1) : pointer;
            foreach (string raw in trimmed.Split('/', StringSplitOptions.RemoveEmptyEntries))
            {
                string segment = raw.Replace("~1", "/", StringComparison.Ordinal).Replace("~0", "~", StringComparison.Ordinal);
                if (segment.Length > 0 && segment.All(Char.IsDigit)) builder.Append('[').Append(segment).Append(']');
                else builder.Append('.').Append(segment);
            }
            return builder.ToString();
        }

        #endregion

        #region Private-Methods

        private static JsonSchema Build(string schemaJson)
        {
            BuildOptions options = new BuildOptions();
            options.SchemaRegistry = new SchemaRegistry();
            return JsonSchema.FromText(schemaJson, options, new Uri("https://garrison.invalid/input-schema/" + Guid.NewGuid().ToString("N")));
        }

        private static bool IsSchemaFailure(Exception e)
        {
            return e is JsonException || e is JsonSchemaException || e is RefResolutionException || e is ArgumentException || e is InvalidOperationException || e is NotSupportedException || e is FormatException || e is KeyNotFoundException;
        }

        private void Collect(List<InputSchemaViolation> violations, EvaluationResults node)
        {
            if (node.Errors == null || node.Errors.Count == 0) return;
            string location = node.InstanceLocation.ToString();
            string path = node.EvaluationPath.ToString();
            string pathKeyword = path.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? String.Empty;
            foreach (KeyValuePair<string, string> error in node.Errors)
            {
                if (violations.Count >= _MaxViolations) return;
                string keyword = String.IsNullOrEmpty(error.Key) ? pathKeyword : error.Key;
                if (String.Equals(keyword, "required", StringComparison.Ordinal))
                {
                    // Report each missing property on its own key so a form can mark the control.
                    List<string> missing = _Quoted.Matches(error.Value).Select(m => m.Groups[1].Value).Where(v => v.Length > 0).Distinct(StringComparer.Ordinal).ToList();
                    if (missing.Count > 0)
                    {
                        foreach (string property in missing)
                        {
                            if (violations.Count >= _MaxViolations) return;
                            string field = FieldFor(location + "/" + property.Replace("~", "~0", StringComparison.Ordinal).Replace("/", "~1", StringComparison.Ordinal));
                            violations.Add(new InputSchemaViolation { Field = field, Code = ViolationCode, Keyword = "required", Message = "'" + property + "' is required." });
                        }
                        continue;
                    }
                }
                violations.Add(new InputSchemaViolation { Field = FieldFor(location), Code = ViolationCode, Keyword = String.IsNullOrEmpty(keyword) ? null : keyword, Message = error.Value });
            }
        }

        #endregion
    }
}
