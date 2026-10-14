namespace Garrison.Core.Helpers
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Services;

    /// <summary>
    /// Rules for the input a caller sends when it starts a run or a pipeline (D-050). Every surface that creates a run
    /// from caller input (REST invoke, deployment tests, run create, conversation turns, MCP, agent tools, A2A,
    /// delegation, and pipeline start) requires a non-empty input, so a request without a body or with an empty input
    /// is a 400 instead of a run that spends harness quota on nothing. A structured input is a JSON document sent as the
    /// input text, so it is never empty. Thread-safe.
    /// </summary>
    public static class InvocationInputRules
    {
        #region Public-Members

        /// <summary>
        /// Field path reported for a missing input.
        /// </summary>
        public static string FieldName
        {
            get
            {
                return "input";
            }
        }

        /// <summary>
        /// Field code reported for a missing input.
        /// </summary>
        public static string FieldCode
        {
            get
            {
                return "InputRequired";
            }
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether an input is missing: null, empty, or only whitespace.
        /// </summary>
        /// <param name="input">Input text; null is allowed and counts as missing.</param>
        /// <returns>True when the input is missing.</returns>
        public static bool IsMissing(string? input)
        {
            return String.IsNullOrWhiteSpace(input);
        }

        /// <summary>
        /// Throw when an input is missing.
        /// </summary>
        /// <param name="input">Input text; null is allowed and counts as missing.</param>
        /// <exception cref="ValidationException">Thrown with the field code InputRequired on input when the input is null, empty, or whitespace.</exception>
        public static void Require(string? input)
        {
            if (!IsMissing(input)) return;
            Dictionary<string, string> fields = new Dictionary<string, string>();
            fields[FieldName] = "Input is required: send the text, or for an agent with structured input the JSON document, the agent should work on.";
            Dictionary<string, string> codes = new Dictionary<string, string>();
            codes[FieldName] = FieldCode;
            throw new ValidationException("Input is required. An empty input does not start a run.", fields, codes);
        }

        #endregion
    }
}
