namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Outcome of a delegation wait handshake (P12.38): the wait was recorded, or the limit that refused it.
    /// </summary>
    public class ChildWaitAdmission
    {
        #region Public-Members

        /// <summary>
        /// Identifier of the recorded wait, or null when the wait was refused.
        /// </summary>
        public string? WaitId { get; set; } = null;

        /// <summary>
        /// The limit that refused the wait, or None when it was admitted.
        /// </summary>
        public DelegationCapacityLimitEnum Limit { get; set; } = DelegationCapacityLimitEnum.None;

        /// <summary>
        /// The parent's node, or null when the parent is not leased to a registered node (no node limit applies then).
        /// </summary>
        public string? NodeId { get; set; } = null;

        /// <summary>
        /// Usage of the refusing limit when the wait was decided: runs waiting on the node, or queued waited children.
        /// </summary>
        public long Used { get; set; } = 0;

        /// <summary>
        /// Value of the refusing limit, or of the node's waiter cap when admitted.
        /// </summary>
        public long Maximum { get; set; } = 0;

        /// <summary>
        /// Whether the wait was recorded.
        /// </summary>
        public bool Admitted
        {
            get
            {
                return !String.IsNullOrEmpty(WaitId);
            }
        }

        #endregion
    }
}
