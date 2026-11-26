namespace Garrison.Core.Database.Ado
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// An eval case's check or file row with the case it belongs to, used while loading cases (AA9.2).
    /// </summary>
    public class EvalCaseChildRow
    {
        /// <summary>
        /// Case identifier.
        /// </summary>
        public string CaseId { get; set; } = String.Empty;

        /// <summary>
        /// The check row, or null for a file row.
        /// </summary>
        public EvalCaseCheck? Check { get; set; } = null;

        /// <summary>
        /// The file row, or null for a check row.
        /// </summary>
        public EvalCaseFile? File { get; set; } = null;
    }
}
