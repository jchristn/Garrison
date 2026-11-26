namespace Garrison.Core.Enums
{
    /// <summary>
    /// How one agent stands to another in an organization's chain of command (AA7.5).
    /// </summary>
    public enum OrgRelationEnum
    {
        /// <summary>
        /// No line joins them.
        /// </summary>
        None,

        /// <summary>
        /// The second agent is the first agent's manager.
        /// </summary>
        Manager,

        /// <summary>
        /// The second agent reports directly to the first.
        /// </summary>
        DirectReport,

        /// <summary>
        /// Their units are joined by a peer line.
        /// </summary>
        Peer
    }
}
