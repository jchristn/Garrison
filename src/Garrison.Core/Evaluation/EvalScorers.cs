namespace Garrison.Core.Evaluation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// The scorers one eval run uses (AA9.4): ExactMatch, Contains, and JsonSchemaValid always, and Judge when a judge
    /// scorer is supplied. Thread-safe after construction.
    /// </summary>
    public class EvalScorers
    {
        #region Private-Members

        private readonly Dictionary<EvalScorerEnum, IEvalScorer> _Scorers = new Dictionary<EvalScorerEnum, IEvalScorer>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="judge">Judge scorer, or null when the run has no judge (Judge checks then score 0 with a note).</param>
        public EvalScorers(IEvalScorer? judge)
        {
            _Scorers[EvalScorerEnum.ExactMatch] = new ExactMatchScorer();
            _Scorers[EvalScorerEnum.Contains] = new ContainsScorer();
            _Scorers[EvalScorerEnum.JsonSchemaValid] = new JsonSchemaValidScorer();
            if (judge != null)
            {
                if (judge.Scorer != EvalScorerEnum.Judge) throw new ArgumentException("The judge scorer must score Judge checks.", nameof(judge));
                _Scorers[EvalScorerEnum.Judge] = judge;
            }
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The scorer for a check, or null when none is available (a Judge check without a judge).
        /// </summary>
        /// <param name="scorer">Scorer kind.</param>
        /// <returns>Scorer, or null.</returns>
        public IEvalScorer? For(EvalScorerEnum scorer)
        {
            return _Scorers.TryGetValue(scorer, out IEvalScorer? found) ? found : null;
        }

        #endregion
    }
}
