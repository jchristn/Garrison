namespace Garrison.Core.Evaluation
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Models;

    /// <summary>
    /// Hides hidden cases from run tokens (AA9.5, AA-024): a run sees a hidden case's name, order, checks' scorers and
    /// weights, and its scores, never its input, expected text, check arguments, file contents, the target's output, or
    /// the judge's notes (which may quote the input). Mutates the objects passed in. Thread-safe for distinct objects.
    /// </summary>
    public static class EvalRedaction
    {
        #region Public-Methods

        /// <summary>
        /// Redact a case when it is hidden.
        /// </summary>
        /// <param name="item">Case.</param>
        /// <returns>The same case.</returns>
        /// <exception cref="ArgumentNullException">Thrown when item is null.</exception>
        public static EvalCase Case(EvalCase item)
        {
            if (item == null) throw new ArgumentNullException(nameof(item));
            if (!item.Hidden) return item;
            item.InputText = String.Empty;
            item.ExpectedText = null;
            foreach (EvalCaseCheck check in item.Checks) check.Argument = null;
            foreach (EvalCaseFile file in item.Files) file.ContentText = null;
            return item;
        }

        /// <summary>
        /// Redact the results of hidden cases.
        /// </summary>
        /// <param name="results">Case results.</param>
        /// <param name="hiddenCaseIds">Identifiers of the hidden cases of the run's set.</param>
        /// <returns>The same list.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static List<EvalCaseResult> Results(List<EvalCaseResult> results, HashSet<string> hiddenCaseIds)
        {
            if (results == null) throw new ArgumentNullException(nameof(results));
            if (hiddenCaseIds == null) throw new ArgumentNullException(nameof(hiddenCaseIds));
            foreach (EvalCaseResult result in results.Where(r => r.CaseId != null && hiddenCaseIds.Contains(r.CaseId)))
            {
                result.OutputText = null;
                result.ErrorMessage = result.ErrorMessage == null ? null : "The case is hidden.";
                foreach (EvalCaseCheckResult check in result.CheckResults) check.Note = null;
            }
            return results;
        }

        #endregion
    }
}
