namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Where an eval run takes its inputs from (AA9.3, AA9.11).
    /// </summary>
    public enum EvalRunInputModeEnum
    {
        /// <summary>
        /// Each case of the eval set, in order.
        /// </summary>
        Cases,

        /// <summary>
        /// The inputs of the target deployment's most recent finished runs (recentInputCount of them), scored with the set's checks. Used by scheduled re-evaluation (AA11.3).
        /// </summary>
        RecentInputs
    }
}
