namespace Garrison.Core.Evaluation
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// What a shadow comparer looks at (AA9.7): the trial, the input both runs answered, and both outputs. Not thread-safe.
    /// </summary>
    public class ShadowComparisonRequest
    {
        #region Public-Members

        /// <summary>
        /// The trial the shadow run belongs to (its ComparisonEvalSetId and UseJudge say how it wants to be compared).
        /// Never null.
        /// </summary>
        public ShadowTrial Trial
        {
            get
            {
                return _Trial;
            }
            set
            {
                _Trial = value ?? throw new ArgumentNullException(nameof(Trial));
            }
        }

        /// <summary>
        /// The input both runs answered (the source run's input), or null.
        /// </summary>
        public string? Input { get; set; } = null;

        /// <summary>
        /// The source run's output (structured output JSON when it has one, else its result text), or null.
        /// </summary>
        public string? SourceOutput { get; set; } = null;

        /// <summary>
        /// The shadow run's output, chosen the same way, or null.
        /// </summary>
        public string? CandidateOutput { get; set; } = null;

        /// <summary>
        /// Source run identifier, or null.
        /// </summary>
        public string? SourceRunId { get; set; } = null;

        /// <summary>
        /// Shadow run identifier, or null. Comparers that start runs (a judge) derive their idempotency keys from it.
        /// </summary>
        public string? ShadowRunId { get; set; } = null;

        #endregion

        #region Private-Members

        private ShadowTrial _Trial = new ShadowTrial();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public ShadowComparisonRequest()
        {
        }

        /// <summary>
        /// Instantiate for a trial and two outputs.
        /// </summary>
        /// <param name="trial">Trial.</param>
        /// <param name="sourceOutput">Source output, or null.</param>
        /// <param name="candidateOutput">Candidate output, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when trial is null.</exception>
        public ShadowComparisonRequest(ShadowTrial trial, string? sourceOutput, string? candidateOutput)
        {
            Trial = trial;
            SourceOutput = sourceOutput;
            CandidateOutput = candidateOutput;
        }

        #endregion
    }
}
