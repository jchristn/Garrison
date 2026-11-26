namespace Garrison.Core.Enums
{
    /// <summary>
    /// How serious an issue listed in a report is (AA5).
    /// </summary>
    public enum ReportIssueSeverityEnum
    {
        /// <summary>
        /// Worth knowing; no action needed yet.
        /// </summary>
        Low,

        /// <summary>
        /// Needs attention soon. Default.
        /// </summary>
        Medium,

        /// <summary>
        /// Needs attention now.
        /// </summary>
        High
    }
}
