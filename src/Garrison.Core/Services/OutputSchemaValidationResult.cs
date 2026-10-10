namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Outcome of validating a run's final output against an agent's output schema.
    /// </summary>
    public class OutputSchemaValidationResult
    {
        #region Public-Members

        /// <summary>
        /// True when the output parsed as JSON and validated against the schema.
        /// </summary>
        public bool Valid { get; set; } = false;

        /// <summary>
        /// True when the schema itself could not be loaded. A repair cannot fix this, so no repair is attempted.
        /// </summary>
        public bool SchemaUnusable { get; set; } = false;

        /// <summary>
        /// Where the validated document came from: "structuredOutput" (the harness reported structured output),
        /// "resultText" (the final result text parsed as JSON), or null when there was nothing to validate.
        /// </summary>
        public string? Source { get; set; } = null;

        /// <summary>
        /// The validated document as compact JSON when it parsed, otherwise null.
        /// </summary>
        public string? Json { get; set; } = null;

        /// <summary>
        /// Validation errors in evaluation order, at most <see cref="OutputSchemaValidator.MaxErrors"/> entries. Each
        /// entry names the instance location ("(root)" for the document itself), the message, and the keyword.
        /// Empty when valid. Never null.
        /// </summary>
        public List<string> Errors
        {
            get
            {
                return _Errors;
            }
            set
            {
                _Errors = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Total number of errors found, which may exceed the number kept in <see cref="Errors"/>.
        /// </summary>
        public int TotalErrors { get; set; } = 0;

        #endregion

        #region Private-Members

        private List<string> _Errors = new List<string>();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Join the kept errors with "; ", noting how many more were found.
        /// </summary>
        /// <returns>Summary text, or an empty string when there are no errors.</returns>
        public string Summary()
        {
            if (_Errors.Count == 0) return String.Empty;
            string joined = String.Join("; ", _Errors);
            int more = TotalErrors - _Errors.Count;
            return more > 0 ? joined + "; and " + more + " more" : joined;
        }

        #endregion
    }
}
