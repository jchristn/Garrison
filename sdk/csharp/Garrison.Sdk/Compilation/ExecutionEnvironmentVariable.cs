namespace Garrison.Sdk.Compilation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Resolved environment variable or header for a run.
    /// </summary>
    public class ExecutionEnvironmentVariable
    {
        /// <summary>
        /// Name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Value (may be secret).
        /// </summary>
        public string Value { get; set; } = String.Empty;

        /// <summary>
        /// Whether the value is secret and must be scrubbed from logs.
        /// </summary>
        public bool IsSecret { get; set; } = false;
    }
}
