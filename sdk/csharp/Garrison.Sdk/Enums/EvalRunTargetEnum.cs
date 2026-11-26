namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What an eval run evaluates (AA9.3).
    /// </summary>
    public enum EvalRunTargetEnum
    {
        /// <summary>
        /// An agent revision, usually a draft, run on an ephemeral deployment like the studio playground.
        /// </summary>
        AgentRevision,

        /// <summary>
        /// A deployment as it is configured now.
        /// </summary>
        Deployment
    }
}
