namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What a deployment's run tokens may do in the management plane (AD7).
    /// </summary>
    public enum ManagementAccessEnum
    {
        /// <summary>
        /// Nothing. The default.
        /// </summary>
        None,

        /// <summary>
        /// Create, read, and edit the studio drafts of the person who started the run, request their apply, and read design
        /// configuration. Never apply a draft, decide an approval, delete live resources, or read secret values. A deployment
        /// of agent-architect always has this.
        /// </summary>
        Drafts
    }
}
