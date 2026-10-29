namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// One change to a studio draft's app graph.
    /// </summary>
    public enum StudioGraphOperationEnum
    {
        /// <summary>
        /// Add a member (Agent, optional Role). The first member becomes the entry agent.
        /// </summary>
        AddMember,

        /// <summary>
        /// Remove a member (Agent) and every edge touching it.
        /// </summary>
        RemoveMember,

        /// <summary>
        /// Add or update an edge (From, To, optional FanOut).
        /// </summary>
        Connect,

        /// <summary>
        /// Remove an edge (From, To).
        /// </summary>
        Disconnect,

        /// <summary>
        /// Make a member (Agent) the entry agent.
        /// </summary>
        SetEntry,

        /// <summary>
        /// Place a node (NodeKey, X, Y) on the canvas. Changes only the layout.
        /// </summary>
        MoveNode
    }
}
