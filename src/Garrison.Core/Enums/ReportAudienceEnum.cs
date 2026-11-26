namespace Garrison.Core.Enums
{
    /// <summary>
    /// Who above the author a report is addressed to (AA5). People with Read on Report see every report whatever its
    /// audience. In a live organization (AA7.5), Manager reaches the author's manager, and Chain and Board reach every lead
    /// above the author. Outside organizations, every audience reaches the entry agents of the apps the author is a member
    /// of (AA-056).
    /// </summary>
    public enum ReportAudienceEnum
    {
        /// <summary>
        /// The author's manager. Default.
        /// </summary>
        Manager,

        /// <summary>
        /// Every manager in the author's chain of command, up to the board.
        /// </summary>
        Chain,

        /// <summary>
        /// The people at the top of the organization (the board), along with the chain.
        /// </summary>
        Board
    }
}
