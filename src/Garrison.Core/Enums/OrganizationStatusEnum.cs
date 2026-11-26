namespace Garrison.Core.Enums
{
    /// <summary>
    /// Lifecycle of an organization (AA7, AA-021).
    /// </summary>
    public enum OrganizationStatusEnum
    {
        /// <summary>
        /// Created, with no published revision yet. The chain of command does not use it. Default.
        /// </summary>
        Draft,

        /// <summary>
        /// A revision is published; the chain of command, budgets, and lines follow that revision.
        /// </summary>
        Active,

        /// <summary>
        /// An Organization freeze is active: no new runs or ticks for its members until it is lifted.
        /// </summary>
        Frozen,

        /// <summary>
        /// Retired by a person. Kept as history; the chain of command no longer uses it.
        /// </summary>
        Retired
    }
}
