namespace Garrison.Core.Enums
{
    /// <summary>
    /// Kind of promotion record (AD1.4).
    /// </summary>
    public enum PromotionKindEnum
    {
        /// <summary>
        /// A revision moved from one environment's deployments to the next environment's deployments.
        /// </summary>
        Promote,

        /// <summary>
        /// The pins a promotion replaced were restored.
        /// </summary>
        Rollback
    }
}
