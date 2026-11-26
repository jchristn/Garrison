namespace Garrison.Core.Enums
{
    /// <summary>
    /// What a canary release does after its current step is evaluated (AA9.8).
    /// </summary>
    public enum CanaryDecisionEnum
    {
        /// <summary>
        /// Stay on the current step: not enough runs, not enough time, or no eval result yet.
        /// </summary>
        Wait,

        /// <summary>
        /// Move to the next step and apply its weights.
        /// </summary>
        Advance,

        /// <summary>
        /// The last step passed: the candidate takes all of the traffic.
        /// </summary>
        Promote,

        /// <summary>
        /// A threshold was crossed: restore the initial weights.
        /// </summary>
        RollBack
    }
}
