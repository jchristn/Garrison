namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Series grouping for run analytics.
    /// </summary>
    public enum AnalyticsGroupByEnum
    {
        /// <summary>
        /// One series with key "all". Wire value "none".
        /// </summary>
        None,

        /// <summary>
        /// One series per agent, keyed by agent identifier. Wire value "agent".
        /// </summary>
        Agent,

        /// <summary>
        /// One series per harness type, keyed by harness type. Wire value "harness".
        /// </summary>
        Harness,

        /// <summary>
        /// One series per served model, keyed by model name; runs without a recorded model are keyed "unknown". Wire value "model".
        /// </summary>
        Model,

        /// <summary>
        /// One series per harness type and served model pair, keyed "Harness|model" and labeled "Harness / model". Wire value "harnessModel".
        /// </summary>
        HarnessModel
    }
}
