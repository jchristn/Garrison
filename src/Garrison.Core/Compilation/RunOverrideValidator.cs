namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Text.RegularExpressions;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Validates per-run parameter overrides against a deployment's allowed run overrides and computes the effective
    /// parameter set. Thread-safe.
    /// </summary>
    public static class RunOverrideValidator
    {
        #region Public-Members

        /// <summary>
        /// Deployment fields a caller may override when the deployment allows them (in addition to deployment parameters).
        /// </summary>
        public static IReadOnlyCollection<string> FieldOverrides
        {
            get
            {
                return _FieldOverrides;
            }
        }

        #endregion

        #region Private-Members

        private static readonly HashSet<string> _FieldOverrides = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "model", "effort", "maxTurns" };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Validate run parameters.
        /// </summary>
        /// <param name="deployment">Deployment.</param>
        /// <param name="parameters">Run parameters.</param>
        /// <exception cref="ArgumentNullException">Thrown when deployment is null.</exception>
        /// <exception cref="ValidationException">Thrown when a parameter is not allowed or fails validation.</exception>
        public static void Validate(Deployment deployment, IEnumerable<RunParameter>? parameters)
        {
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            Dictionary<string, string> errors = new Dictionary<string, string>(StringComparer.Ordinal);
            Dictionary<string, string> codes = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (RunParameter parameter in parameters ?? Enumerable.Empty<RunParameter>())
            {
                DeploymentRunOverrideRule? rule = deployment.AllowedRunOverrides.FirstOrDefault(r => String.Equals(r.Name, parameter.Name, StringComparison.OrdinalIgnoreCase));
                if (rule == null)
                {
                    errors["parameters." + parameter.Name] = "The deployment does not allow callers to set '" + parameter.Name + "'.";
                    codes["parameters." + parameter.Name] = "ParameterNotAllowed";
                    continue;
                }
                string? problem = Check(rule, parameter.Value);
                if (problem != null)
                {
                    errors["parameters." + parameter.Name] = "Parameter " + parameter.Name + ": " + problem;
                    codes["parameters." + parameter.Name] = "ParameterInvalid";
                }
            }
            if (errors.Count > 0) throw new ValidationException("Invalid run parameters: " + String.Join(" ", errors.Values), errors, codes);
        }

        /// <summary>
        /// Effective parameters: deployment parameters overridden by allowed run parameters.
        /// </summary>
        /// <param name="deployment">Deployment.</param>
        /// <param name="parameters">Run parameters.</param>
        /// <returns>Name to value map (case-insensitive).</returns>
        public static Dictionary<string, string> Effective(Deployment deployment, IEnumerable<RunParameter>? parameters)
        {
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            Dictionary<string, string> effective = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (DeploymentParameter parameter in deployment.Parameters) effective[parameter.Name] = parameter.Value;
            foreach (RunParameter parameter in parameters ?? Enumerable.Empty<RunParameter>())
            {
                DeploymentRunOverrideRule? rule = deployment.AllowedRunOverrides.FirstOrDefault(r => String.Equals(r.Name, parameter.Name, StringComparison.OrdinalIgnoreCase));
                if (rule != null && Check(rule, parameter.Value) == null) effective[parameter.Name] = parameter.Value;
            }
            return effective;
        }

        #endregion

        #region Private-Methods

        private static string? Check(DeploymentRunOverrideRule rule, string? value)
        {
            string text = value ?? String.Empty;
            switch (rule.Validation)
            {
                case RunOverrideValidationEnum.Enum:
                    List<string> allowed = (rule.Pattern ?? String.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
                    return allowed.Contains(text, StringComparer.Ordinal) ? null : "Value must be one of: " + String.Join(", ", allowed) + ".";
                case RunOverrideValidationEnum.Regex:
                    try
                    {
                        return Regex.IsMatch(text, "^(?:" + (rule.Pattern ?? ".*") + ")$", RegexOptions.None, TimeSpan.FromMilliseconds(250)) ? null : "Value does not match the allowed pattern.";
                    }
                    catch (RegexMatchTimeoutException)
                    {
                        return "Value could not be validated in time.";
                    }
                case RunOverrideValidationEnum.IntegerRange:
                    if (!Int64.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out long number)) return "Value must be an integer.";
                    string[] bounds = (rule.Pattern ?? String.Empty).Split(',');
                    if (bounds.Length == 2 && Int64.TryParse(bounds[0].Trim(), out long min) && Int64.TryParse(bounds[1].Trim(), out long max) && (number < min || number > max))
                    {
                        return "Value must be between " + min + " and " + max + ".";
                    }
                    return null;
                default:
                    return text.Length > 65536 ? "Value is too long." : null;
            }
        }

        #endregion
    }
}
