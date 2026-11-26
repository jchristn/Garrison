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
        Drafts,

        /// <summary>
        /// Executive authority (AA8): studio drafts limited to the subtree below the org unit the deployment's agent
        /// leads, acting for the person who started the run. Never the executive itself, its own unit, anything above it,
        /// secrets, budget increases, management access, or change rules. A draft applies at once only when every change
        /// matches an active change rule; otherwise a person decides. Valid only for a deployment of an agent that leads a
        /// unit.
        /// </summary>
        OrgSubtree
    }
}
