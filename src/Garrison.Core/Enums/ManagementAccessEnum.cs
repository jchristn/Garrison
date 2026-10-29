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
        Drafts
    }
}
