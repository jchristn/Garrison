namespace Garrison.Core.Evaluation
{
    using System;
    using System.Globalization;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Pure rules of a canary release (AA9.8): the deployment weights for a step and the decision after a step is
    /// evaluated. Deployment weights run from 0 to 1000 and the run service picks among an agent's active deployments in
    /// proportion to them, so a step's percent becomes a candidate weight of percent times 10 and a baseline weight of the
    /// rest (100 percent is 1000 and 0). Other deployments of the agent keep their own weights. Thread-safe.
    /// </summary>
    public static class CanaryStepEvaluator
    {
        #region Public-Methods

        /// <summary>
        /// Candidate deployment weight for a step's percent: percent times 10, from 10 (1 percent) to 1000 (100 percent).
        /// </summary>
        /// <param name="weightPercent">Percent of traffic, 1 to 100 (values outside are clamped).</param>
        /// <returns>Weight.</returns>
        public static int CandidateWeight(int weightPercent)
        {
            return Math.Clamp(weightPercent, 1, 100) * 10;
        }

        /// <summary>
        /// Baseline deployment weight for a step's percent: the remaining share times 10, from 990 (1 percent) to 0 (100 percent).
        /// </summary>
        /// <param name="weightPercent">Percent of traffic the candidate receives, 1 to 100 (values outside are clamped).</param>
        /// <returns>Weight.</returns>
        public static int BaselineWeight(int weightPercent)
        {
            return (100 - Math.Clamp(weightPercent, 1, 100)) * 10;
        }

        /// <summary>
        /// Whether the current step has met its minimums: at least its minimum finished runs and its minimum minutes. An
        /// eval-gated release starts the step's eval run once this is true (AA9.8).
        /// </summary>
        /// <param name="release">Release (its current step is checked).</param>
        /// <param name="finished">Candidate runs that finished in the step. Minimum 0.</param>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <returns>True when both minimums are met.</returns>
        /// <exception cref="ArgumentNullException">Thrown when release is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the release has no step at its current index.</exception>
        public static bool StepReady(CanaryRelease release, long finished, DateTime nowUtc)
        {
            if (release == null) throw new ArgumentNullException(nameof(release));
            if (release.CurrentStepIndex < 0 || release.CurrentStepIndex >= release.Steps.Count) throw new ArgumentException("Canary release " + release.Id + " has no step " + release.CurrentStepIndex + ".", nameof(release));
            CanaryReleaseStep step = release.Steps[release.CurrentStepIndex];
            if (Math.Max(0, finished) < step.MinimumRuns) return false;
            DateTime started = release.StepStartedUtc ?? release.CreatedUtc;
            return (nowUtc - started).TotalMinutes >= step.MinimumMinutes;
        }

        /// <summary>
        /// Decide what a running release does with its current step. The error rate is checked first and may roll the
        /// release back before the step's minimum time has passed, once the step has at least its minimum runs (and at
        /// least one). The step advances when it has its minimum runs, its minimum minutes have passed, and, when the
        /// release has an eval gate, the latest eval score is at least the minimum. A missing eval result waits.
        /// </summary>
        /// <param name="release">Release (its current step is evaluated).</param>
        /// <param name="finished">Candidate runs that finished in the step (succeeded, failed, or timed out). Minimum 0.</param>
        /// <param name="failed">Of those, runs that failed or timed out. Minimum 0, at most finished.</param>
        /// <param name="evalScore">Latest completed eval score of the candidate on the release's eval set (0 to 1), or null when none.</param>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <returns>Decision; never null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when release is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the release has no step at its current index.</exception>
        public static CanaryStepDecision Evaluate(CanaryRelease release, long finished, long failed, double? evalScore, DateTime nowUtc)
        {
            if (release == null) throw new ArgumentNullException(nameof(release));
            if (release.CurrentStepIndex < 0 || release.CurrentStepIndex >= release.Steps.Count) throw new ArgumentException("Canary release " + release.Id + " has no step " + release.CurrentStepIndex + ".", nameof(release));
            CanaryReleaseStep step = release.Steps[release.CurrentStepIndex];
            long total = Math.Max(0, finished);
            long failures = Math.Clamp(failed, 0, total);
            string where = "step " + (release.CurrentStepIndex + 1).ToString(CultureInfo.InvariantCulture) + " of " + release.Steps.Count.ToString(CultureInfo.InvariantCulture) + " (" + step.WeightPercent.ToString(CultureInfo.InvariantCulture) + " percent)";

            if (total > 0 && total >= step.MinimumRuns)
            {
                double rate = failures * 100.0 / total;
                if (rate > release.MaxErrorRatePercent)
                {
                    return new CanaryStepDecision(CanaryDecisionEnum.RollBack, "The candidate's error rate was " + Format(rate) + " percent (" + failures + " of " + total + " runs) at " + where + ", above the " + Format(release.MaxErrorRatePercent) + " percent limit.");
                }
            }

            if (total < step.MinimumRuns) return new CanaryStepDecision(CanaryDecisionEnum.Wait, "Waiting for " + step.MinimumRuns + " finished runs at " + where + " (" + total + " so far).");
            DateTime started = release.StepStartedUtc ?? release.CreatedUtc;
            double elapsed = (nowUtc - started).TotalMinutes;
            if (elapsed < step.MinimumMinutes) return new CanaryStepDecision(CanaryDecisionEnum.Wait, "Waiting for " + step.MinimumMinutes + " minutes at " + where + " (" + Format(Math.Max(0, elapsed)) + " so far).");

            if (release.MinEvalScore.HasValue && !String.IsNullOrEmpty(release.EvalSetId))
            {
                if (!evalScore.HasValue) return new CanaryStepDecision(CanaryDecisionEnum.Wait, "Waiting for a completed eval run of the candidate on eval set " + release.EvalSetId + " at " + where + ".");
                if (evalScore.Value < release.MinEvalScore.Value)
                {
                    return new CanaryStepDecision(CanaryDecisionEnum.RollBack, "The candidate's eval score was " + Format(evalScore.Value) + " on eval set " + release.EvalSetId + " at " + where + ", below the minimum " + Format(release.MinEvalScore.Value) + ".");
                }
            }

            if (release.CurrentStepIndex >= release.Steps.Count - 1)
            {
                return new CanaryStepDecision(CanaryDecisionEnum.Promote, "The candidate passed " + where + ", the last step, with " + failures + " failures in " + total + " runs.");
            }
            return new CanaryStepDecision(CanaryDecisionEnum.Advance, "The candidate passed " + where + " with " + failures + " failures in " + total + " runs.");
        }

        #endregion

        #region Private-Methods

        private static string Format(double value)
        {
            return Math.Round(value, 2).ToString("0.##", CultureInfo.InvariantCulture);
        }

        #endregion
    }
}
