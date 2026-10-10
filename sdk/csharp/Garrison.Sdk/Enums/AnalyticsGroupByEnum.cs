namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Series grouping for run analytics.
    /// </summary>
    public enum AnalyticsGroupByEnum
    {
        /// <summary>
        /// One series with key "all".
        /// </summary>
        None,

        /// <summary>
        /// One series per agent, keyed by agent identifier.
        /// </summary>
        Agent,

        /// <summary>
        /// One series per harness type, keyed by harness type.
        /// </summary>
        Harness
    }
}
