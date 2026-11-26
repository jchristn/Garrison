namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Window over which an org unit budget caps its subtree's spend (AA7.6).
    /// </summary>
    public enum BudgetPeriodEnum
    {
        /// <summary>
        /// The UTC day. Default.
        /// </summary>
        Day,

        /// <summary>
        /// The UTC calendar month.
        /// </summary>
        Month
    }
}
