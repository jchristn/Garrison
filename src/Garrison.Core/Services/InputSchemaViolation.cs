namespace Garrison.Core.Services
{
    using System;

    /// <summary>
    /// One way an invocation input fails an agent's input schema (P12.22).
    /// </summary>
    public class InputSchemaViolation
    {
        #region Public-Members

        /// <summary>
        /// Field key the violation is reported under: <c>input</c> for the root, otherwise <c>input.</c> followed by the
        /// instance path with dots for properties and <c>[n]</c> for array items (for example <c>input.topic</c>,
        /// <c>input.tags[1]</c>, <c>input.address.city</c>). A missing required property is reported on its own key.
        /// Never null.
        /// </summary>
        public string Field
        {
            get
            {
                return _Field;
            }
            set
            {
                _Field = String.IsNullOrEmpty(value) ? "input" : value;
            }
        }

        /// <summary>
        /// Readable message. Never null.
        /// </summary>
        public string Message
        {
            get
            {
                return _Message;
            }
            set
            {
                _Message = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Field code: <c>InputNotJson</c> when the input is not JSON, otherwise <c>InputSchemaViolation</c>.
        /// </summary>
        public string Code { get; set; } = "InputSchemaViolation";

        /// <summary>
        /// JSON Schema keyword that failed (for example required, type, enum), or null.
        /// </summary>
        public string? Keyword { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Field = "input";
        private string _Message = String.Empty;

        #endregion
    }
}
