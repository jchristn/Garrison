namespace Garrison.Core.Enums
{
    /// <summary>
    /// How one check of an eval case scores a run's output (AA9.4).
    /// </summary>
    public enum EvalScorerEnum
    {
        /// <summary>
        /// The output, trimmed, equals the check's argument (or the case's expected text when the argument is empty).
        /// </summary>
        ExactMatch,

        /// <summary>
        /// The output contains the check's argument (or the case's expected text when the argument is empty).
        /// </summary>
        Contains,

        /// <summary>
        /// The output parses as JSON and validates against the JSON Schema in the check's argument (user-authored, unmanaged text).
        /// </summary>
        JsonSchemaValid,

        /// <summary>
        /// A Garrison agent run with the eval-judge template scores the output; the argument holds the judging criteria.
        /// </summary>
        Judge
    }
}
