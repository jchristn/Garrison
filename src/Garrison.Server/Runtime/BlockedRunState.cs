namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// What the maintenance loop remembers about one blocked queued run: which reasons it already explained with a run
    /// event and since when the run has been blocked. Owned by the maintenance loop; not thread-safe on its own.
    /// </summary>
    public class BlockedRunState
    {
        #region Public-Members

        /// <summary>
        /// Reasons already explained with a Warning run event.
        /// </summary>
        public HashSet<RunBlockedReasonEnum> Notified
        {
            get
            {
                return _Notified;
            }
            set
            {
                _Notified = value ?? new HashSet<RunBlockedReasonEnum>();
            }
        }

        /// <summary>
        /// When the run was first seen blocked in its current blocked stretch (UTC), or null while it is not blocked.
        /// </summary>
        public DateTime? BlockedSinceUtc { get; set; } = null;

        #endregion

        #region Private-Members

        private HashSet<RunBlockedReasonEnum> _Notified = new HashSet<RunBlockedReasonEnum>();

        #endregion
    }
}
