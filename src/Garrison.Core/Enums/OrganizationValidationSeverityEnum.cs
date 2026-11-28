namespace Garrison.Core.Enums
{
    /// <summary>
    /// How serious an organization validation problem is (LP3.7a).
    /// </summary>
    public enum OrganizationValidationSeverityEnum
    {
        /// <summary>
        /// Publishing a revision of this working tree is refused until the problem is fixed.
        /// </summary>
        Error,

        /// <summary>
        /// Publishing succeeds, but the organization is incomplete (for example a unit without a lead).
        /// </summary>
        Warning
    }
}
