namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// What a cascade cancel of an organization unit's subtree stopped (AA11.4). Computed; never stored. Not thread-safe.
    /// </summary>
    public class CascadeCancelResult
    {
        #region Public-Members

        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; set; } = String.Empty;

        /// <summary>
        /// Unit identifier: the root of the cancelled subtree.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// Unit name.
        /// </summary>
        public string UnitName { get; set; } = String.Empty;

        /// <summary>
        /// Queued and running runs of the subtree's agents whose cancellation was requested. Queued runs end Cancelled at
        /// once; leased and running runs move to Cancelling and end when their worker stops.
        /// </summary>
        public int RunsCancelled { get; set; } = 0;

        /// <summary>
        /// Keeper ticks in flight whose run was cancelled.
        /// </summary>
        public int TicksCancelled { get; set; } = 0;

        /// <summary>
        /// Open escalations raised by the subtree's agents that were withdrawn.
        /// </summary>
        public int EscalationsWithdrawn { get; set; } = 0;

        /// <summary>
        /// Queued messages addressed to the subtree's agents that were expired undelivered.
        /// </summary>
        public int MessagesExpired { get; set; } = 0;

        /// <summary>
        /// Identifiers of the cancelled runs. Never null.
        /// </summary>
        public List<string> RunIds
        {
            get
            {
                return _RunIds;
            }
            set
            {
                _RunIds = value ?? new List<string>();
            }
        }

        /// <summary>
        /// When the cascade finished (UTC).
        /// </summary>
        public DateTime CompletedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private List<string> _RunIds = new List<string>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public CascadeCancelResult()
        {
        }

        #endregion
    }
}
