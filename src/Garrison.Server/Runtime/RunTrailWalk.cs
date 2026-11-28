namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// The state of one activity trail while <see cref="RunTrailService"/> builds it (LP1.5): nodes deduplicated by record
    /// identifier, edges deduplicated by their ends and kind, the message hop depth of every run, and the truncation reason
    /// of the first cap reached. One instance serves one request. Not thread-safe.
    /// </summary>
    public class RunTrailWalk
    {
        #region Public-Members

        /// <summary>
        /// Nodes in the order they were added. Never null.
        /// </summary>
        public List<RunTrailNode> Nodes
        {
            get
            {
                return _Nodes;
            }
        }

        /// <summary>
        /// Edges in the order they were added; each names two nodes of <see cref="Nodes"/>. Never null.
        /// </summary>
        public List<RunTrailEdge> Edges
        {
            get
            {
                return _Edges;
            }
        }

        /// <summary>
        /// Runs read so far, by identifier. Never null.
        /// </summary>
        public Dictionary<string, Run> Runs
        {
            get
            {
                return _Runs;
            }
        }

        /// <summary>
        /// Why the trail stopped short. NodeCap outranks HopCap, which outranks SpanCap. Default None.
        /// </summary>
        public RunTrailTruncationEnum Truncation
        {
            get
            {
                return _Truncation;
            }
        }

        /// <summary>
        /// True once the node cap is reached; the walk stops adding nodes.
        /// </summary>
        public bool Full
        {
            get
            {
                return _Nodes.Count >= _MaxNodes;
            }
        }

        /// <summary>
        /// Rows still to read before the node cap is reached, plus one so a query can show the cap was passed. Minimum 1.
        /// </summary>
        public int Remaining
        {
            get
            {
                return Math.Max(1, _MaxNodes - _Nodes.Count + 1);
            }
        }

        /// <summary>
        /// The most message hops of any run in the trail. Minimum 0.
        /// </summary>
        public int MaxDepth
        {
            get
            {
                return _Depths.Count == 0 ? 0 : Math.Max(0, _Depths.Values.Max());
            }
        }

        #endregion

        #region Private-Members

        private readonly int _MaxNodes;
        private readonly DateTime? _SpanEndUtc;
        private readonly List<RunTrailNode> _Nodes = new List<RunTrailNode>();
        private readonly Dictionary<string, RunTrailNode> _ById = new Dictionary<string, RunTrailNode>(StringComparer.Ordinal);
        private readonly List<RunTrailEdge> _Edges = new List<RunTrailEdge>();
        private readonly HashSet<string> _EdgeKeys = new HashSet<string>(StringComparer.Ordinal);
        private readonly Dictionary<string, Run> _Runs = new Dictionary<string, Run>(StringComparer.Ordinal);
        private readonly Dictionary<string, int> _Depths = new Dictionary<string, int>(StringComparer.Ordinal);
        private RunTrailTruncationEnum _Truncation = RunTrailTruncationEnum.None;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Start a walk.
        /// </summary>
        /// <param name="maxNodes">Most nodes; at least 1.</param>
        /// <param name="spanEndUtc">Latest start time a node may have, or null for no limit.</param>
        public RunTrailWalk(int maxNodes, DateTime? spanEndUtc)
        {
            _MaxNodes = Math.Max(1, maxNodes);
            _SpanEndUtc = spanEndUtc;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether a node with the identifier is in the trail.
        /// </summary>
        /// <param name="id">Node identifier.</param>
        /// <returns>True when present.</returns>
        public bool Has(string? id)
        {
            return !String.IsNullOrEmpty(id) && _ById.ContainsKey(id);
        }

        /// <summary>
        /// The node with the identifier, or null.
        /// </summary>
        /// <param name="id">Node identifier.</param>
        /// <returns>Node or null.</returns>
        public RunTrailNode? Find(string? id)
        {
            if (String.IsNullOrEmpty(id)) return null;
            return _ById.TryGetValue(id, out RunTrailNode? node) ? node : null;
        }

        /// <summary>
        /// Add a node unless it is already there, the node cap is reached (NodeCap), or it starts after the span end
        /// (SpanCap).
        /// </summary>
        /// <param name="node">Node.</param>
        /// <param name="force">True to add it even past the caps (the focus run is always shown).</param>
        /// <returns>True when the node is in the trail afterwards.</returns>
        /// <exception cref="ArgumentNullException">Thrown when node is null.</exception>
        public bool Add(RunTrailNode node, bool force = false)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (_ById.ContainsKey(node.Id)) return true;
            if (!force)
            {
                if (_SpanEndUtc.HasValue && node.StartedUtc.HasValue && node.StartedUtc.Value > _SpanEndUtc.Value)
                {
                    Truncate(RunTrailTruncationEnum.SpanCap);
                    return false;
                }
                if (Full)
                {
                    Truncate(RunTrailTruncationEnum.NodeCap);
                    return false;
                }
            }
            _Nodes.Add(node);
            _ById[node.Id] = node;
            return true;
        }

        /// <summary>
        /// Add an edge between two nodes already in the trail; an edge to a missing node or a repeated edge is ignored.
        /// </summary>
        /// <param name="fromId">Source node identifier.</param>
        /// <param name="toId">Target node identifier.</param>
        /// <param name="kind">Edge kind.</param>
        /// <param name="atUtc">When the link happened, or null to use the target's start time.</param>
        /// <returns>True when the edge is in the trail afterwards.</returns>
        public bool Link(string? fromId, string? toId, RunTrailEdgeKindEnum kind, DateTime? atUtc)
        {
            if (String.IsNullOrEmpty(fromId) || String.IsNullOrEmpty(toId)) return false;
            if (!_ById.ContainsKey(fromId) || !_ById.TryGetValue(toId, out RunTrailNode? target)) return false;
            string key = fromId + "|" + toId + "|" + kind.ToString();
            if (!_EdgeKeys.Add(key)) return true;
            RunTrailEdge edge = new RunTrailEdge();
            edge.FromId = fromId;
            edge.ToId = toId;
            edge.Kind = kind;
            edge.AtUtc = atUtc ?? target.StartedUtc ?? _ById[fromId].StartedUtc ?? DateTime.UtcNow;
            _Edges.Add(edge);
            return true;
        }

        /// <summary>
        /// Record that the trail stopped short. A more serious reason replaces a lesser one: NodeCap, then HopCap, then
        /// SpanCap.
        /// </summary>
        /// <param name="reason">Reason.</param>
        public void Truncate(RunTrailTruncationEnum reason)
        {
            if (Rank(reason) > Rank(_Truncation)) _Truncation = reason;
        }

        /// <summary>
        /// The message hop depth of a run, or 0 when it has none.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <returns>Depth.</returns>
        public int DepthOf(string? runId)
        {
            if (String.IsNullOrEmpty(runId)) return 0;
            return _Depths.TryGetValue(runId, out int depth) ? depth : 0;
        }

        /// <summary>
        /// Set the message hop depth of a run, keeping the smaller one when it is reached twice.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="depth">Depth; negative values count as 0.</param>
        public void SetDepth(string runId, int depth)
        {
            if (String.IsNullOrEmpty(runId)) return;
            int value = Math.Max(0, depth);
            if (_Depths.TryGetValue(runId, out int existing) && existing <= value) return;
            _Depths[runId] = value;
        }

        /// <summary>
        /// Replace a node's identifier everywhere (redaction), in the node list and in every edge.
        /// </summary>
        /// <param name="oldId">Current identifier.</param>
        /// <param name="replacement">The node that takes its place.</param>
        /// <exception cref="ArgumentNullException">Thrown when replacement is null.</exception>
        public void Replace(string oldId, RunTrailNode replacement)
        {
            if (replacement == null) throw new ArgumentNullException(nameof(replacement));
            int index = _Nodes.FindIndex(n => String.Equals(n.Id, oldId, StringComparison.Ordinal));
            if (index < 0) return;
            _Nodes[index] = replacement;
            _ById.Remove(oldId);
            _ById[replacement.Id] = replacement;
            foreach (RunTrailEdge edge in _Edges)
            {
                if (String.Equals(edge.FromId, oldId, StringComparison.Ordinal)) edge.FromId = replacement.Id;
                if (String.Equals(edge.ToId, oldId, StringComparison.Ordinal)) edge.ToId = replacement.Id;
            }
        }

        #endregion

        #region Private-Methods

        private static int Rank(RunTrailTruncationEnum reason)
        {
            switch (reason)
            {
                case RunTrailTruncationEnum.NodeCap:
                    return 3;
                case RunTrailTruncationEnum.HopCap:
                    return 2;
                case RunTrailTruncationEnum.SpanCap:
                    return 1;
                default:
                    return 0;
            }
        }

        #endregion
    }
}
