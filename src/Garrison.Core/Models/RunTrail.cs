namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// The activity trail of a run (LP-001, LP1.3): every step from where the work started (the origin) to everything it
    /// caused, with the requested run marked as the focus. It carries no text an agent wrote (LP-002); the detail routes
    /// of each record hold that. Not thread-safe.
    /// </summary>
    public class RunTrail
    {
        #region Public-Members

        /// <summary>
        /// Identifier of the origin node: a Caller, Trigger, KeeperTick, or PipelineRun node, or the oldest run reached
        /// when the walk back stopped at the hop cap. Never null.
        /// </summary>
        public string OriginId
        {
            get
            {
                return _OriginId;
            }
            set
            {
                _OriginId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Identifier of the run the trail was requested for. Never null.
        /// </summary>
        public string FocusRunId
        {
            get
            {
                return _FocusRunId;
            }
            set
            {
                _FocusRunId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Steps, in the order the walk found them: the origin first. Never null.
        /// </summary>
        public List<RunTrailNode> Nodes
        {
            get
            {
                return _Nodes;
            }
            set
            {
                _Nodes = value ?? new List<RunTrailNode>();
            }
        }

        /// <summary>
        /// Links between steps. Every edge names two nodes of <see cref="Nodes"/>. Never null.
        /// </summary>
        public List<RunTrailEdge> Edges
        {
            get
            {
                return _Edges;
            }
            set
            {
                _Edges = value ?? new List<RunTrailEdge>();
            }
        }

        /// <summary>
        /// Why the trail stopped short, or None when it is complete. Default None.
        /// </summary>
        public RunTrailTruncationEnum Truncation { get; set; } = RunTrailTruncationEnum.None;

        /// <summary>
        /// Number of nodes. Minimum 0.
        /// </summary>
        public int NodeCount
        {
            get
            {
                return _NodeCount;
            }
            set
            {
                _NodeCount = Math.Max(0, value);
            }
        }

        /// <summary>
        /// The most message hops between the origin and any run in the trail (a message that woke a run is one hop).
        /// Minimum 0.
        /// </summary>
        public int HopCount
        {
            get
            {
                return _HopCount;
            }
            set
            {
                _HopCount = Math.Max(0, value);
            }
        }

        /// <summary>
        /// When the server built the trail (UTC).
        /// </summary>
        public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _OriginId = String.Empty;
        private string _FocusRunId = String.Empty;
        private List<RunTrailNode> _Nodes = new List<RunTrailNode>();
        private List<RunTrailEdge> _Edges = new List<RunTrailEdge>();
        private int _NodeCount = 0;
        private int _HopCount = 0;

        #endregion
    }
}
