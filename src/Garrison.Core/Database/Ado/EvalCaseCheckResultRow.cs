namespace Garrison.Core.Database.Ado
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// An eval check result with the case result it belongs to, used while loading results (AA9.2).
    /// </summary>
    public class EvalCaseCheckResultRow
    {
        /// <summary>
        /// Case result identifier.
        /// </summary>
        public string ResultId { get; set; } = String.Empty;

        /// <summary>
        /// The check result.
        /// </summary>
        public EvalCaseCheckResult CheckResult { get; set; } = new EvalCaseCheckResult();
    }
}
