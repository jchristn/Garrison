namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Raised when input fails validation; mapped to 400 with field errors.
    /// </summary>
    public class ValidationException : Exception
    {
        /// <summary>
        /// Field errors keyed by field path.
        /// </summary>
        public Dictionary<string, string> Fields { get; } = new Dictionary<string, string>();

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="message">Message.</param>
        public ValidationException(string message) : base(message)
        {
        }

        /// <summary>
        /// Instantiate with field errors.
        /// </summary>
        /// <param name="message">Message.</param>
        /// <param name="fields">Field errors.</param>
        public ValidationException(string message, Dictionary<string, string> fields) : base(message)
        {
            if (fields != null) Fields = fields;
        }
    }
}
