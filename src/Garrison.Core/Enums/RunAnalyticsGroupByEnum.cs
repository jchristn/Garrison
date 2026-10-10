namespace Garrison.Core.Enums
{
    /// <summary>
    /// How run analytics split runs into series.
    /// </summary>
    public enum RunAnalyticsGroupByEnum
    {
        /// <summary>
        /// One series (key "all") holding every run.
        /// </summary>
        None,

        /// <summary>
        /// One series per agent (key is the agent ID, label the agent name).
        /// </summary>
        Agent,

        /// <summary>
        /// One series per harness type (key and label are the harness type).
        /// </summary>
        Harness,

        /// <summary>
        /// One series per served model (key and label are the model; runs without one use "unknown").
        /// </summary>
        Model,

        /// <summary>
        /// One series per harness type and served model pair (key "Harness|model", label "Harness / model").
        /// </summary>
        HarnessModel
    }
}
