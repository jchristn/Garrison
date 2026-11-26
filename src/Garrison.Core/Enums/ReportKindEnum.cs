namespace Garrison.Core.Enums
{
    /// <summary>
    /// What a report is about (AA5, AA-019).
    /// </summary>
    public enum ReportKindEnum
    {
        /// <summary>
        /// Routine status: how the work is going over a period. Default.
        /// </summary>
        Status,

        /// <summary>
        /// Something went wrong: what happened, its impact, and what was done.
        /// </summary>
        Incident,

        /// <summary>
        /// A decision the author took within its authority, recorded for the people and agents above it.
        /// </summary>
        Decision,

        /// <summary>
        /// Work handed to someone else, with what they need to continue it.
        /// </summary>
        Handoff,

        /// <summary>
        /// A summary from the top of an organization for the board (AA10).
        /// </summary>
        Brief
    }
}
