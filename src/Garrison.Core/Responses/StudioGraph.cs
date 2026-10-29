namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A draft's apps drawn as a graph (AD7.5, AD8): agent and app nodes with their positions, and the call edges of every
    /// app in the draft.
    /// </summary>
    public class StudioGraph
    {
        /// <summary>
        /// Draft identifier.
        /// </summary>
        public string DraftId { get; set; } = String.Empty;

        /// <summary>
        /// Draft version the graph was read at.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// Nodes.
        /// </summary>
        public List<StudioGraphNode> Nodes { get; set; } = new List<StudioGraphNode>();

        /// <summary>
        /// Call edges.
        /// </summary>
        public List<StudioGraphEdge> Edges { get; set; } = new List<StudioGraphEdge>();
    }
}
