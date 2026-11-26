namespace Garrison.Core.Enums
{
    /// <summary>
    /// What a deployment's run tokens may do in the management plane (AD7.4, AD-017).
    /// </summary>
    public enum ManagementAccessEnum
    {
        /// <summary>
        /// Nothing (default): run tokens cannot use management or studio tools.
        /// </summary>
        None,

        /// <summary>
        /// Studio draft tools only, acting for the person who started the conversation, within that person's design
        /// permissions. Never apply, delete live records, or read secret values.
        /// </summary>
        Drafts,

        /// <summary>
        /// Executive authority (AA8, AA-022): studio drafts limited to the subtree below the org unit the deployment's agent
        /// leads, acting for the person who started the run. Never the executive itself, its own unit, anything above it,
        /// secrets, budget increases, management access, or change rules. A draft applies at once only when every change
        /// matches an active change rule; otherwise a person decides. Valid only for a deployment of an agent that leads a
        /// unit.
        /// </summary>
        OrgSubtree
    }
}
