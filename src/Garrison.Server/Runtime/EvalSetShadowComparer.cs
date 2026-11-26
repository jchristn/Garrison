namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Keepers;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// The control plane's shadow comparer (AA9.7, AA9.4): a trial with neither ComparisonEvalSetId nor UseJudge is
    /// compared by <see cref="Fallback"/> (normalized text by default). Otherwise the candidate's output is scored with the
    /// eval scorers, with the source run's output as the reference:
    /// <list type="bullet">
    /// <item>The checks are the distinct checks of the comparison set's cases. The set used is the latest approved version
    /// of the set's name, or the exact set the trial names when no version is approved. ExactMatch and Contains checks
    /// drop their case-specific arguments, so they compare with the source output; JsonSchemaValid and Judge keep theirs.</item>
    /// <item>UseJudge adds one Judge check with the default criteria when the set has none.</item>
    /// <item>With no checks at all the candidate must match the source output exactly (ExactMatch).</item>
    /// <item>Judge checks run the set's judgeAgent with builtin/eval-judge (see <see cref="ShadowJudgeRunner"/>) as the
    /// person who started the trial, keyed by the shadow run so a repeat reuses the judge run.</item>
    /// </list>
    /// The outputs agree when the score passes (every weighted check passed). A comparison that cannot be scored (the set
    /// is gone, it has Judge checks but no judge agent, the judge agent is gone, or the judge never finished) throws, so
    /// the shadow run is logged and left uncounted rather than counted as a divergence. Thread-safe.
    /// </summary>
    public class EvalSetShadowComparer : IShadowComparer
    {
        #region Public-Members

        /// <summary>
        /// Comparer for trials without a comparison eval set or judge. Default <see cref="NormalizedTextShadowComparer"/>;
        /// setting null restores the default.
        /// </summary>
        public IShadowComparer Fallback
        {
            get
            {
                return _Fallback;
            }
            set
            {
                _Fallback = value ?? new NormalizedTextShadowComparer();
            }
        }

        /// <summary>
        /// Longest wait for one judge run, in seconds. Minimum 10, maximum 86400, default 900.
        /// </summary>
        public int JudgeMaxWaitSeconds
        {
            get
            {
                return _JudgeMaxWaitSeconds;
            }
            set
            {
                _JudgeMaxWaitSeconds = Math.Clamp(value, 10, 86400);
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Server;
        private readonly RunService _Runs;
        private readonly RunSignals _Signals;
        private IShadowComparer _Fallback = new NormalizedTextShadowComparer();
        private int _JudgeMaxWaitSeconds = 900;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="runs">Run service judge runs are created through.</param>
        /// <param name="signals">Run signals.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public EvalSetShadowComparer(ServerContext server, RunService runs, RunSignals signals)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        /// <exception cref="NotFoundException">Thrown when the comparison set, its judge agent, or the eval-judge template cannot be found.</exception>
        /// <exception cref="TimeoutException">Thrown when a judge run does not finish in time.</exception>
        /// <exception cref="InvalidOperationException">Thrown when a judge run ended without a verdict (it failed or could not start).</exception>
        public async Task<ShadowComparison> CompareAsync(ShadowComparisonRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            ShadowTrial trial = request.Trial;
            if (String.IsNullOrWhiteSpace(trial.ComparisonEvalSetId) && !trial.UseJudge) return await _Fallback.CompareAsync(request, token).ConfigureAwait(false);

            EvalSet? set = String.IsNullOrWhiteSpace(trial.ComparisonEvalSetId) ? null : await ResolveSetAsync(trial, token).ConfigureAwait(false);
            List<EvalCaseCheck> checks = await ChecksAsync(trial, set, token).ConfigureAwait(false);
            IEvalScorer? judge = null;
            if (checks.Any(c => c.Scorer == EvalScorerEnum.Judge))
            {
                if (set == null || String.IsNullOrWhiteSpace(set.JudgeAgent))
                    throw new NotFoundException("Shadow trial " + trial.Id + " compares with a judge, but " + (set == null ? "it names no comparison eval set" : "eval set " + set.Name + " has no judgeAgent") + "; the shadow run was not compared.");
                Agent judgeAgent = await _Server.Database.Agents.ReadAsync(trial.TenantId, set.JudgeAgent, token).ConfigureAwait(false)
                    ?? await _Server.Database.Agents.ReadByNameAsync(trial.TenantId, set.JudgeAgent, token).ConfigureAwait(false)
                    ?? throw new NotFoundException("Judge agent " + set.JudgeAgent + " of eval set " + set.Name + " was not found; shadow trial " + trial.Id + " cannot compare.");
                PromptTemplate template = await new KeeperTemplateResolver(_Server.Database).ResolveAsync(trial.TenantId, EvalJudgePrompt.TemplateName, PromptTemplateKindEnum.Task, token).ConfigureAwait(false);
                ShadowJudgeRunner runner = new ShadowJudgeRunner(_Server, _Runs, _Signals, trial, judgeAgent);
                runner.MaxWaitSeconds = _JudgeMaxWaitSeconds;
                judge = new JudgeScorer(runner, template);
            }

            EvalWorkItem item = new EvalWorkItem();
            item.InputText = request.Input ?? String.Empty;
            item.ExpectedText = request.SourceOutput;
            item.Checks = checks;
            EvalCaseResult result = new EvalCaseResult();
            string correlation = "shadow:" + trial.Id + ":" + (request.ShadowRunId ?? Guid.NewGuid().ToString("N")) + ":judge";
            await EvalCaseScoring.ScoreAsync(new EvalScorers(judge), item, request.CandidateOutput, trial.TenantId, correlation, result, token).ConfigureAwait(false);
            foreach (EvalCaseCheckResult check in result.CheckResults)
            {
                // A judge that did not answer is not a verdict on the candidate.
                if (check.Scorer == EvalScorerEnum.Judge && check.Note != null && check.Note.StartsWith("The judge did not answer", StringComparison.Ordinal))
                    throw new InvalidOperationException("The judge of shadow trial " + trial.Id + " gave no verdict, so the shadow run was not compared: " + check.Note);
            }
            string score = result.Score.ToString("0.###", CultureInfo.InvariantCulture);
            string notes = String.Join("; ", result.CheckResults.Select(c => c.Scorer + " " + c.Score.ToString("0.###", CultureInfo.InvariantCulture) + (c.Passed ? " passed" : " failed") + (String.IsNullOrEmpty(c.Note) ? String.Empty : " (" + c.Note + ")")));
            string where = set == null ? "the judge" : "eval set " + set.Name + " version " + set.Version.ToString(CultureInfo.InvariantCulture);
            return new ShadowComparison(result.Passed, "Scored " + score + " with " + where + (result.Passed ? ", passed: " : ", failed: ") + notes);
        }

        #endregion

        #region Private-Methods

        private async Task<EvalSet> ResolveSetAsync(ShadowTrial trial, CancellationToken token)
        {
            EvalSet named = await _Server.Database.EvalSets.ReadAsync(trial.TenantId, trial.ComparisonEvalSetId!.Trim(), token).ConfigureAwait(false)
                ?? throw new NotFoundException("Comparison eval set " + trial.ComparisonEvalSetId + " of shadow trial " + trial.Id + " no longer exists.");
            EvalSet? approved = await _Server.Database.EvalSets.ReadLatestApprovedAsync(trial.TenantId, named.Name, token).ConfigureAwait(false);
            return approved ?? named;
        }

        private async Task<List<EvalCaseCheck>> ChecksAsync(ShadowTrial trial, EvalSet? set, CancellationToken token)
        {
            List<EvalCaseCheck> checks = new List<EvalCaseCheck>();
            if (set != null)
            {
                List<EvalCase> cases = await _Server.Database.EvalCases.ListBySetAsync(trial.TenantId, set.Id, token).ConfigureAwait(false);
                HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
                foreach (EvalCaseCheck check in cases.SelectMany(c => c.Checks))
                {
                    string? argument = check.Scorer == EvalScorerEnum.ExactMatch || check.Scorer == EvalScorerEnum.Contains ? null : check.Argument;
                    string key = check.Scorer + "\u0001" + (argument ?? String.Empty) + "\u0001" + check.Weight.ToString(CultureInfo.InvariantCulture);
                    if (!seen.Add(key)) continue;
                    checks.Add(new EvalCaseCheck { Scorer = check.Scorer, Argument = argument, Weight = check.Weight });
                }
            }
            if (trial.UseJudge && !checks.Any(c => c.Scorer == EvalScorerEnum.Judge)) checks.Add(new EvalCaseCheck { Scorer = EvalScorerEnum.Judge, Weight = 1 });
            if (checks.Count == 0) checks.Add(new EvalCaseCheck { Scorer = EvalScorerEnum.ExactMatch, Weight = 1 });
            return checks;
        }

        #endregion
    }
}
