namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Who wrote an eval set (AA9.1, AA-024).
    /// </summary>
    public enum EvalSetOriginEnum
    {
        /// <summary>
        /// Written by a person through the API, the dashboard, or a manifest.
        /// </summary>
        Human,

        /// <summary>
        /// Written by an evaluator agent. It can gate an executive's change only when the evaluator sits outside that executive's subtree.
        /// </summary>
        Evaluator,

        /// <summary>
        /// Assembled from studio playground runs saved as eval cases (AD11.5).
        /// </summary>
        Playground
    }
}
