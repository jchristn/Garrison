namespace Garrison.Core.Enums
{
    /// <summary>
    /// State of an organization revision (AA7.4).
    /// </summary>
    public enum OrgRevisionStateEnum
    {
        /// <summary>
        /// A snapshot that is not live yet. Default.
        /// </summary>
        Draft,

        /// <summary>
        /// The live revision: the chain of command, budgets, and lines follow it. An organization has at most one.
        /// </summary>
        Published,

        /// <summary>
        /// Was live and has been replaced by a later publish or a rollback.
        /// </summary>
        Superseded
    }
}
