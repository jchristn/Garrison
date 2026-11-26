namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Who above the author a report is addressed to (AA5).
    /// </summary>
    public enum ReportAudienceEnum
    {
        /// <summary>
        /// The author's manager.
        /// </summary>
        Manager,

        /// <summary>
        /// Every manager up to the board.
        /// </summary>
        Chain,

        /// <summary>
        /// The people at the top of the organization, along with the chain.
        /// </summary>
        Board
    }
}
