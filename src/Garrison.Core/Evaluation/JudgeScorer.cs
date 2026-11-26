namespace Garrison.Core.Evaluation
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;

    /// <summary>
    /// Judge (AA9.4): a Garrison agent grades the output. The judge run's input is rendered from builtin/eval-judge (or the
    /// tenant's eval-judge override) with the check's argument as the criteria and the input, reference, and output framed
    /// as data (AA-025); the verdict is read from the typed <see cref="EvalJudgeVerdict"/>. A verdict without passed
    /// passes when its score reaches <see cref="PassScore"/>. A judge that fails or replies without a verdict scores 0 with
    /// a note. Thread-safe.
    /// </summary>
    public class JudgeScorer : IEvalScorer
    {
        #region Public-Members

        /// <inheritdoc />
        public EvalScorerEnum Scorer
        {
            get
            {
                return EvalScorerEnum.Judge;
            }
        }

        /// <summary>
        /// Score a verdict without a passed field needs to pass. Minimum 0, maximum 1, default 0.5.
        /// </summary>
        public double PassScore
        {
            get
            {
                return _PassScore;
            }
            set
            {
                if (Double.IsNaN(value) || value < 0 || value > 1) throw new ArgumentOutOfRangeException(nameof(PassScore), "PassScore must be between 0 and 1.");
                _PassScore = value;
            }
        }

        #endregion

        #region Private-Members

        private readonly IEvalJudgeRunner _Runner;
        private readonly PromptTemplate _Template;
        private double _PassScore = 0.5;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="runner">Runs the judge agent.</param>
        /// <param name="template">Resolved eval-judge template.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public JudgeScorer(IEvalJudgeRunner runner, PromptTemplate template)
        {
            _Runner = runner ?? throw new ArgumentNullException(nameof(runner));
            _Template = template ?? throw new ArgumentNullException(nameof(template));
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<EvalScore> ScoreAsync(EvalScoreRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            token.ThrowIfCancellationRequested();
            string prompt;
            try
            {
                prompt = EvalJudgePrompt.Render(_Template, request);
            }
            catch (TemplateException e)
            {
                return new EvalScore(0, false, "The eval-judge template did not render: " + e.Message);
            }
            EvalJudgeRunResult result = await _Runner.RunAsync(prompt, request.CorrelationKey, token).ConfigureAwait(false);
            EvalScore score = new EvalScore();
            score.JudgeRunId = result.RunId;
            score.CostUsd = result.CostUsd;
            if (result.ErrorMessage != null)
            {
                score.Note = "The judge did not answer: " + result.ErrorMessage;
                return score;
            }
            if (!EvalJudgeVerdictParser.TryParse(result.StructuredOutputJson, result.Output, out EvalJudgeVerdict? verdict) || verdict == null)
            {
                score.Note = "The judge's reply held no verdict (a JSON object with score, passed, and reason).";
                return score;
            }
            score.Score = verdict.Score;
            score.Passed = verdict.Passed ?? verdict.Score >= _PassScore;
            score.Note = verdict.Reason;
            return score;
        }

        #endregion
    }
}
