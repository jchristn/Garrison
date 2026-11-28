namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// Caps on an activity trail (LP-001, LP1.3), set from the cluster settings RunTrail.MaxNodes, RunTrail.MaxMessageHops,
    /// RunTrail.MaxSpanHours, and RunTrail.IncludeEffects. Setters clamp to the documented bounds. Reads and writes of
    /// single properties are safe across threads; a trail reads each value once when it starts.
    /// </summary>
    public class RunTrailSettings
    {
        #region Public-Members

        /// <summary>
        /// Most steps in one trail. Default 500, minimum 10, maximum 5000. A trail that reaches it stops with truncation
        /// NodeCap.
        /// </summary>
        public int MaxNodes
        {
            get
            {
                return _MaxNodes;
            }
            set
            {
                _MaxNodes = Math.Clamp(value, 10, 5000);
            }
        }

        /// <summary>
        /// Most message hops the trail follows, back to the origin and forward from it. Default 12, minimum 0, maximum 50.
        /// 0 follows no message at all. Reaching it sets truncation HopCap.
        /// </summary>
        public int MaxMessageHops
        {
            get
            {
                return _MaxMessageHops;
            }
            set
            {
                _MaxMessageHops = Math.Clamp(value, 0, 50);
            }
        }

        /// <summary>
        /// Most hours after the origin a step may start and still be shown. Default 72, minimum 1, maximum 720. Later
        /// steps are left out with truncation SpanCap.
        /// </summary>
        public int MaxSpanHours
        {
            get
            {
                return _MaxSpanHours;
            }
            set
            {
                _MaxSpanHours = Math.Clamp(value, 1, 720);
            }
        }

        /// <summary>
        /// Whether trails show effect journal entries (Effect nodes) unless the request says otherwise. Default true.
        /// </summary>
        public bool IncludeEffects { get; set; } = true;

        #endregion

        #region Private-Members

        private int _MaxNodes = 500;
        private int _MaxMessageHops = 12;
        private int _MaxSpanHours = 72;

        #endregion
    }
}
