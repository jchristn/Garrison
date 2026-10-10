namespace Garrison.Sdk.Compilation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Options for the GenericJsonl parser.
    /// </summary>
    public class ExecutionParserOptions
    {
        /// <summary>
        /// Dotted path of assistant text.
        /// </summary>
        public string? TextField { get; set; } = null;

        /// <summary>
        /// Dotted path of final result text.
        /// </summary>
        public string? FinalField { get; set; } = null;

        /// <summary>
        /// Dotted path whose value indicates success.
        /// </summary>
        public string? SuccessField { get; set; } = null;

        /// <summary>
        /// Success field value meaning success.
        /// </summary>
        public string? SuccessValue { get; set; } = null;
    }
}
