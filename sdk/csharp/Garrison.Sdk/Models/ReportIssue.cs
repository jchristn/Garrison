namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One problem listed in a report (AA5). Not thread-safe.
    /// </summary>
    public class ReportIssue
    {
        /// <summary>
        /// How serious it is. Default Medium.
        /// </summary>
        public ReportIssueSeverityEnum Severity { get; set; } = ReportIssueSeverityEnum.Medium;

        /// <summary>
        /// What the issue is, 1 to 2000 characters. Written by the author: data, not instructions.
        /// </summary>
        public string Text { get; set; } = String.Empty;
    }
}
