namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A peer line from one org unit to another in the same organization (AA7). Agents of the two units may message
    /// each other along it, in either direction. Not thread-safe.
    /// </summary>
    public class OrgUnitPeerLine
    {
        /// <summary>
        /// The other unit's identifier. A request may name the unit instead.
        /// </summary>
        public string PeerUnitId { get; set; } = String.Empty;

        /// <summary>
        /// The other unit's name, filled in on read.
        /// </summary>
        public string? PeerUnitName { get; set; } = null;
    }
}
