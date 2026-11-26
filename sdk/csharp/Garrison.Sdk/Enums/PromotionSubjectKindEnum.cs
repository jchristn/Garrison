namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What a promotion record moved (AD1.4, AD6.4, AA7.4).
    /// </summary>
    public enum PromotionSubjectKindEnum
    {
        /// <summary>
        /// An agent revision repinned on deployments.
        /// </summary>
        Agent,

        /// <summary>
        /// An agentic app revision.
        /// </summary>
        App,

        /// <summary>
        /// An organization revision published or rolled back. Organizations have no environments of their own, so the
        /// record's source environment is "draft" and its target "live" (AA-062).
        /// </summary>
        Organization
    }
}
