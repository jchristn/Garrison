namespace Garrison.Core.Enums
{
    /// <summary>
    /// One change to a draft's app graph (AD7.5, AD8). Each one rewrites the draft's AgenticApp item, except MoveNode,
    /// which changes only the layout.
    /// </summary>
    public enum StudioGraphOperationEnum
    {
        /// <summary>
        /// Add an agent to the app as a member (the first member becomes the entry agent).
        /// </summary>
        AddMember,

        /// <summary>
        /// Remove a member and every edge touching it.
        /// </summary>
        RemoveMember,

        /// <summary>
        /// Add an edge: the caller member may call the callee member.
        /// </summary>
        Connect,

        /// <summary>
        /// Remove an edge.
        /// </summary>
        Disconnect,

        /// <summary>
        /// Make a member the entry agent.
        /// </summary>
        SetEntry,

        /// <summary>
        /// Place a node on the canvas.
        /// </summary>
        MoveNode,

        /// <summary>
        /// Add a unit to an organization (AA7.10): organization, unit, optional parent (none for the root), optional agent as
        /// its lead, and optional role as the lead's title.
        /// </summary>
        AddUnit,

        /// <summary>
        /// Remove a unit without child units from an organization: organization and unit. Peer lines to it go too.
        /// </summary>
        RemoveUnit,

        /// <summary>
        /// Add an agent to a unit as a member: organization, unit, agent, and optional role as its title.
        /// </summary>
        AddUnitMember,

        /// <summary>
        /// Remove a member from a unit: organization, unit, and agent.
        /// </summary>
        RemoveUnitMember,

        /// <summary>
        /// Join two units of an organization with a peer line: organization, from, and to (unit names).
        /// </summary>
        ConnectUnits,

        /// <summary>
        /// Remove the peer line between two units: organization, from, and to.
        /// </summary>
        DisconnectUnits
    }
}
