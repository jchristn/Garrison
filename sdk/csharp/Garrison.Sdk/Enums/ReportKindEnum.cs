namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What a report is about (AA5).
    /// </summary>
    public enum ReportKindEnum
    {
        /// <summary>
        /// Routine status over a period.
        /// </summary>
        Status,

        /// <summary>
        /// Something went wrong.
        /// </summary>
        Incident,

        /// <summary>
        /// A decision the author took.
        /// </summary>
        Decision,

        /// <summary>
        /// Work handed to someone else.
        /// </summary>
        Handoff,

        /// <summary>
        /// A summary from the top of an organization for the board.
        /// </summary>
        Brief
    }
}
