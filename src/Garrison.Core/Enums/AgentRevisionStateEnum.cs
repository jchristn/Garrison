namespace Garrison.Core.Enums
{
    /// <summary>
    /// State of an agent revision (AD1). A revision is editable only while it is a draft; once published it never
    /// changes again.
    /// </summary>
    public enum AgentRevisionStateEnum
    {
        /// <summary>
        /// The single open draft of an agent. Editable; never used by runs except playground runs.
        /// </summary>
        Draft,

        /// <summary>
        /// Frozen. Deployments may pin it, and unpinned deployments follow the agent's latest published revision.
        /// </summary>
        Published
    }
}
