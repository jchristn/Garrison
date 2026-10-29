namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A studio draft's apps drawn as a graph: a node per app and per agent, each app's call edges, and canvas positions.
    /// Not thread-safe.
    /// </summary>
    public class StudioGraph
    {
        #region Public-Members

        /// <summary>
        /// Draft identifier. Never null.
        /// </summary>
        public string DraftId
        {
            get
            {
                return _DraftId;
            }
            set
            {
                _DraftId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// The draft version drawn. Pass it with the next change.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// Nodes, apps first, then by name. Never null.
        /// </summary>
        public List<StudioGraphNode> Nodes
        {
            get
            {
                return _Nodes;
            }
            set
            {
                _Nodes = value ?? new List<StudioGraphNode>();
            }
        }

        /// <summary>
        /// Call edges of every app. Never null.
        /// </summary>
        public List<StudioGraphEdge> Edges
        {
            get
            {
                return _Edges;
            }
            set
            {
                _Edges = value ?? new List<StudioGraphEdge>();
            }
        }

        #endregion

        #region Private-Members

        private string _DraftId = String.Empty;
        private List<StudioGraphNode> _Nodes = new List<StudioGraphNode>();
        private List<StudioGraphEdge> _Edges = new List<StudioGraphEdge>();

        #endregion
    }
}
