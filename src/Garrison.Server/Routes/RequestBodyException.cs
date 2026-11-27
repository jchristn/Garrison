namespace Garrison.Server.Routes
{
    using System;

    /// <summary>
    /// Raised when a request body is missing or malformed; mapped to 400 InvalidBody. When the problem is one field of the
    /// wrong type, <see cref="Field"/> names it and the response carries it in fields and fieldCodes (InvalidType).
    /// </summary>
    public class RequestBodyException : Exception
    {
        #region Public-Members

        /// <summary>
        /// Path of the field in the body that has the wrong type (for example minIntervalSeconds), or null when the body as
        /// a whole is missing or does not parse.
        /// </summary>
        public string? Field { get; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="message">Message.</param>
        public RequestBodyException(string message) : base(message)
        {
        }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="message">Message.</param>
        /// <param name="inner">Inner exception.</param>
        public RequestBodyException(string message, Exception inner) : base(message, inner)
        {
        }

        /// <summary>
        /// Instantiate for one field of the wrong type.
        /// </summary>
        /// <param name="message">Message.</param>
        /// <param name="field">Field path, or null.</param>
        /// <param name="inner">Inner exception.</param>
        public RequestBodyException(string message, string? field, Exception inner) : base(message, inner)
        {
            Field = String.IsNullOrEmpty(field) ? null : field;
        }

        #endregion
    }
}
