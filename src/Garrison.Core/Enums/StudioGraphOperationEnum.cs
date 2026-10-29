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
        MoveNode
    }
}
