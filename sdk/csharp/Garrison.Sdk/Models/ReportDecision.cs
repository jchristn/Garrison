namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// One decision listed in a report (AA5). Not thread-safe.
    /// </summary>
    public class ReportDecision
    {
        /// <summary>
        /// What was decided and why, 1 to 2000 characters.
        /// </summary>
        public string Text { get; set; } = String.Empty;
    }
}
