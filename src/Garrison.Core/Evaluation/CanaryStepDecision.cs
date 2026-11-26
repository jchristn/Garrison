namespace Garrison.Core.Evaluation
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// The outcome of evaluating a canary release's current step (AA9.8). Not thread-safe.
    /// </summary>
    public class CanaryStepDecision
    {
        #region Public-Members

        /// <summary>
        /// What to do. Default Wait.
        /// </summary>
        public CanaryDecisionEnum Decision { get; set; } = CanaryDecisionEnum.Wait;

        /// <summary>
        /// Why, in a sentence a person can read; never null.
        /// </summary>
        public string Reason
        {
            get
            {
                return _Reason;
            }
            set
            {
                _Reason = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _Reason = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public CanaryStepDecision()
        {
        }

        /// <summary>
        /// Instantiate with a decision.
        /// </summary>
        /// <param name="decision">Decision.</param>
        /// <param name="reason">Reason.</param>
        public CanaryStepDecision(CanaryDecisionEnum decision, string reason)
        {
            Decision = decision;
            Reason = reason;
        }

        #endregion
    }
}
