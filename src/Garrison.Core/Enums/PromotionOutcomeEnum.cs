namespace Garrison.Core.Enums
{
    /// <summary>
    /// Outcome of a promotion record (AD1.4).
    /// </summary>
    public enum PromotionOutcomeEnum
    {
        /// <summary>
        /// The target deployments were repinned.
        /// </summary>
        Applied,

        /// <summary>
        /// A later rollback restored the pins this promotion replaced.
        /// </summary>
        RolledBack
    }
}
