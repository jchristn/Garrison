namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// Position of the leader's notification event sweep in one event source (P12.14): the timestamp and identifier of
    /// the last row it queued events for. Cluster-wide, not tenant-scoped. Internal to the control plane.
    /// </summary>
    public class NotificationCursor
    {
        #region Public-Members

        /// <summary>
        /// Event source: runs, pipeline_runs, approvals, or pipeline_reviews.
        /// </summary>
        public string Source
        {
            get
            {
                return _Source;
            }
            set
            {
                _Source = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Timestamp of the last row processed (UTC).
        /// </summary>
        public DateTime CursorUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Identifier of the last row processed at <see cref="CursorUtc"/>; empty when none.
        /// </summary>
        public string CursorId
        {
            get
            {
                return _CursorId;
            }
            set
            {
                _CursorId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Source = String.Empty;
        private string _CursorId = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public NotificationCursor()
        {
        }

        #endregion
    }
}
