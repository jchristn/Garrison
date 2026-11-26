namespace Garrison.Core.Evaluation
{
    using System;

    /// <summary>
    /// A scorer's verdict on one output (AA9.4). Not thread-safe.
    /// </summary>
    public class EvalScore
    {
        #region Public-Members

        /// <summary>
        /// Score from 0 (wrong) to 1 (right). Values outside are clamped.
        /// </summary>
        public double Score
        {
            get
            {
                return _Score;
            }
            set
            {
                _Score = Double.IsNaN(value) ? 0 : Math.Clamp(value, 0, 1);
            }
        }

        /// <summary>
        /// Whether the output passed the check.
        /// </summary>
        public bool Passed { get; set; } = false;

        /// <summary>
        /// Why, in a sentence, or null. At most 2000 characters; longer notes are cut.
        /// </summary>
        public string? Note
        {
            get
            {
                return _Note;
            }
            set
            {
                _Note = value == null ? null : (value.Length > 2000 ? value.Substring(0, 2000) : value);
            }
        }

        /// <summary>
        /// Run of the judge agent that produced the verdict (Judge scorer), or null.
        /// </summary>
        public string? JudgeRunId { get; set; } = null;

        /// <summary>
        /// USD the scoring spent (the judge run's cost), 0 or more.
        /// </summary>
        public double CostUsd
        {
            get
            {
                return _CostUsd;
            }
            set
            {
                _CostUsd = Double.IsNaN(value) ? 0 : Math.Max(0, value);
            }
        }

        #endregion

        #region Private-Members

        private double _Score = 0;
        private string? _Note = null;
        private double _CostUsd = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate a zero score.
        /// </summary>
        public EvalScore()
        {
        }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="score">Score from 0 to 1.</param>
        /// <param name="passed">Whether it passed.</param>
        /// <param name="note">Note, or null.</param>
        public EvalScore(double score, bool passed, string? note)
        {
            Score = score;
            Passed = passed;
            Note = note;
        }

        #endregion
    }
}
