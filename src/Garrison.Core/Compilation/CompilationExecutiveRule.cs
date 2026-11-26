namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// A change rule as an executive's system prompt shows it (AA8.8). Not thread-safe.
    /// </summary>
    public class CompilationExecutiveRule
    {
        /// <summary>
        /// Rule name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// The unit whose subtree the rule covers.
        /// </summary>
        public string UnitName { get; set; } = String.Empty;

        /// <summary>
        /// Classes the rule covers, comma separated.
        /// </summary>
        public string Classes { get; set; } = String.Empty;

        /// <summary>
        /// Limits in words, such as "WakeTuning minIntervalSeconds from 300 to 3600", or null.
        /// </summary>
        public string? Limits { get; set; } = null;

        /// <summary>
        /// When the rule expires (UTC, ISO 8601), or null.
        /// </summary>
        public string? Expires { get; set; } = null;
    }
}
