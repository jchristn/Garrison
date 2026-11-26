namespace Garrison.Core.Evaluation
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Scores one case's output against its checks (AA9.3, AA9.4). A case without checks is scored by ExactMatch against
    /// its expected text when it has one, and by one Judge check (default criteria) when it has none. The case score is the
    /// weighted mean of its check scores (the plain mean when every weight is 0), and the case passes when every check
    /// with a weight above 0 passed. Thread-safe.
    /// </summary>
    public static class EvalCaseScoring
    {
        #region Public-Methods

        /// <summary>
        /// The checks a work item is scored with.
        /// </summary>
        /// <param name="item">Work item.</param>
        /// <returns>The item's checks, or the defaults when it has none.</returns>
        /// <exception cref="ArgumentNullException">Thrown when item is null.</exception>
        public static List<EvalCaseCheck> EffectiveChecks(EvalWorkItem item)
        {
            if (item == null) throw new ArgumentNullException(nameof(item));
            if (item.Checks.Count > 0) return item.Checks;
            if (!String.IsNullOrEmpty(item.ExpectedText)) return new List<EvalCaseCheck> { new EvalCaseCheck { Scorer = EvalScorerEnum.ExactMatch, Weight = 1 } };
            return new List<EvalCaseCheck> { new EvalCaseCheck { Scorer = EvalScorerEnum.Judge, Weight = 1 } };
        }

        /// <summary>
        /// Score an output. Fills the result's CheckResults, Score, Passed, and adds the judges' cost to CostUsd.
        /// </summary>
        /// <param name="scorers">Scorers.</param>
        /// <param name="item">Work item.</param>
        /// <param name="output">The target's output, or null.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="correlationPrefix">Prefix of each check's correlation key (the check index is appended).</param>
        /// <param name="result">Result to fill.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public static async Task ScoreAsync(EvalScorers scorers, EvalWorkItem item, string? output, string tenantId, string correlationPrefix, EvalCaseResult result, CancellationToken token = default)
        {
            if (scorers == null) throw new ArgumentNullException(nameof(scorers));
            if (item == null) throw new ArgumentNullException(nameof(item));
            if (result == null) throw new ArgumentNullException(nameof(result));
            List<EvalCaseCheck> checks = EffectiveChecks(item);
            result.CheckResults = new List<EvalCaseCheckResult>();
            for (int i = 0; i < checks.Count; i++)
            {
                token.ThrowIfCancellationRequested();
                EvalCaseCheck check = checks[i];
                EvalCaseCheckResult checkResult = new EvalCaseCheckResult { Scorer = check.Scorer, Weight = check.Weight };
                IEvalScorer? scorer = scorers.For(check.Scorer);
                if (scorer == null)
                {
                    checkResult.Note = "No judge is set for this eval run: give the eval set a judge agent.";
                }
                else
                {
                    EvalScoreRequest request = new EvalScoreRequest
                    {
                        TenantId = tenantId, Input = item.InputText, Output = output, Reference = item.ExpectedText, Argument = check.Argument,
                        CorrelationKey = correlationPrefix + ":" + i.ToString(CultureInfo.InvariantCulture)
                    };
                    EvalScore score = await scorer.ScoreAsync(request, token).ConfigureAwait(false);
                    checkResult.Score = score.Score;
                    checkResult.Passed = score.Passed;
                    checkResult.Note = score.Note;
                    checkResult.JudgeRunId = score.JudgeRunId;
                    result.CostUsd += score.CostUsd;
                }
                result.CheckResults.Add(checkResult);
            }
            result.Score = Combine(result.CheckResults);
            List<EvalCaseCheckResult> weighted = result.CheckResults.Where(c => c.Weight > 0).ToList();
            result.Passed = weighted.Count > 0 ? weighted.All(c => c.Passed) : result.CheckResults.Count > 0 && result.CheckResults.All(c => c.Passed);
        }

        /// <summary>
        /// Weighted mean of check scores: the plain mean when every weight is 0, and 0 for no checks.
        /// </summary>
        /// <param name="checks">Check results.</param>
        /// <returns>Score from 0 to 1.</returns>
        /// <exception cref="ArgumentNullException">Thrown when checks is null.</exception>
        public static double Combine(List<EvalCaseCheckResult> checks)
        {
            if (checks == null) throw new ArgumentNullException(nameof(checks));
            if (checks.Count == 0) return 0;
            double weight = checks.Sum(c => c.Weight);
            if (weight <= 0) return checks.Average(c => c.Score);
            return checks.Sum(c => c.Score * c.Weight) / weight;
        }

        #endregion
    }
}
