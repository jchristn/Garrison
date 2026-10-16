namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// A parent run's request to wait synchronously on a child run (the delegation wait handshake, P12.38). The wait is
    /// recorded before the child is created, so the scheduler and the next admission already count the parent as waiting.
    /// </summary>
    public class ChildWaitRequest
    {
        #region Public-Members

        /// <summary>The parent will checkpoint and release its slot immediately, so resident-waiter admission does not apply.</summary>
        public bool Durable { get; set; } = false;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// The waiting parent run.
        /// </summary>
        public string ParentRunId { get; set; } = String.Empty;

        /// <summary>
        /// The child run the parent waits on. The child may not exist yet: the wait is recorded first.
        /// </summary>
        public string ChildRunId { get; set; } = String.Empty;

        /// <summary>
        /// Most queued children with a waiting parent across the cluster before a new wait is refused. Minimum 1,
        /// maximum 100000, default 100.
        /// </summary>
        public int ChildQueueDepth
        {
            get
            {
                return _ChildQueueDepth;
            }
            set
            {
                _ChildQueueDepth = Math.Clamp(value, 1, 100000);
            }
        }

        #endregion

        #region Private-Members

        private int _ChildQueueDepth = 100;

        #endregion
    }
}
