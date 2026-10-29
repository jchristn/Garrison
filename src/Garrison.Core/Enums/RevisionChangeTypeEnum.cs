namespace Garrison.Core.Enums
{
    /// <summary>
    /// How a field differs between two revisions (AD1.2).
    /// </summary>
    public enum RevisionChangeTypeEnum
    {
        /// <summary>
        /// A scalar field has a different value.
        /// </summary>
        Changed,

        /// <summary>
        /// A list entry exists only in the newer revision.
        /// </summary>
        Added,

        /// <summary>
        /// A list entry exists only in the older revision.
        /// </summary>
        Removed
    }
}
