namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Where an activity trail starts (LP-003), as <see cref="RunTrailService"/> resolved it by walking back from the
    /// focus run. Not thread-safe.
    /// </summary>
    public class RunTrailOrigin
    {
        #region Public-Members

        /// <summary>
        /// The origin node (Caller, Trigger, KeeperTick, or PipelineRun), or null when the walk back stopped at the hop
        /// cap and the oldest run reached is the origin.
        /// </summary>
        public RunTrailNode? Node { get; set; } = null;

        /// <summary>
        /// The runs the origin started directly: one run, or every stage run of a pipeline run. Never null.
        /// </summary>
        public List<Run> Roots
        {
            get
            {
                return _Roots;
            }
            set
            {
                _Roots = value ?? new List<Run>();
            }
        }

        /// <summary>
        /// The message a person sent that woke the first run, when the origin is that person; otherwise null.
        /// </summary>
        public AgentMessage? Message { get; set; } = null;

        /// <summary>
        /// Message hops walked back from the focus run to the origin. Minimum 0.
        /// </summary>
        public int HopsBack
        {
            get
            {
                return _HopsBack;
            }
            set
            {
                _HopsBack = Math.Max(0, value);
            }
        }

        #endregion

        #region Private-Members

        private List<Run> _Roots = new List<Run>();
        private int _HopsBack = 0;

        #endregion
    }
}
