namespace Garrison.Core.Evaluation
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Models;

    /// <summary>
    /// An eval run's totals computed from its case results (AA9.3): the aggregate score is the mean of the case scores
    /// weighted by each case's total check weight (a case with no weighted checks, for example one whose run failed,
    /// weighs 1), errored cases count as 0, and the run passes when it has a threshold and the score reaches it.
    /// Not thread-safe.
    /// </summary>
    public class EvalRunTally
    {
        #region Public-Members

        /// <summary>
        /// Aggregate score from 0 to 1, or 0 when there are no results.
        /// </summary>
        public double Score { get; set; } = 0;

        /// <summary>
        /// Whether Score reached the threshold, or null without a threshold.
        /// </summary>
        public bool? Passed { get; set; } = null;

        /// <summary>
        /// Cases with a result.
        /// </summary>
        public int CompletedCases { get; set; } = 0;

        /// <summary>
        /// Cases that passed.
        /// </summary>
        public int PassedCases { get; set; } = 0;

        /// <summary>
        /// Cases whose run failed or could not start.
        /// </summary>
        public int ErroredCases { get; set; } = 0;

        /// <summary>
        /// USD the cases and their judges spent.
        /// </summary>
        public double CostUsd { get; set; } = 0;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Tally case results.
        /// </summary>
        /// <param name="results">Case results.</param>
        /// <param name="threshold">Threshold from 0 to 1, or null.</param>
        /// <returns>Tally.</returns>
        /// <exception cref="ArgumentNullException">Thrown when results is null.</exception>
        public static EvalRunTally Compute(List<EvalCaseResult> results, double? threshold)
        {
            if (results == null) throw new ArgumentNullException(nameof(results));
            EvalRunTally tally = new EvalRunTally();
            tally.CompletedCases = results.Count;
            tally.PassedCases = results.Count(r => r.Passed);
            tally.ErroredCases = results.Count(r => r.ErrorMessage != null);
            tally.CostUsd = results.Sum(r => r.CostUsd);
            double weight = 0;
            double sum = 0;
            foreach (EvalCaseResult result in results)
            {
                double caseWeight = result.CheckResults.Sum(c => c.Weight);
                if (caseWeight <= 0) caseWeight = 1;
                weight += caseWeight;
                sum += (result.ErrorMessage != null ? 0 : result.Score) * caseWeight;
            }
            tally.Score = weight > 0 ? Math.Clamp(sum / weight, 0, 1) : 0;
            tally.Passed = threshold.HasValue ? tally.Score >= threshold.Value - 1e-9 : null;
            return tally;
        }

        #endregion
    }
}
