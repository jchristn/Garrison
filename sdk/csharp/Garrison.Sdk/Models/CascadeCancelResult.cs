namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// What a cascade cancel of an org unit stopped (AA11.4). Not thread-safe.
    /// </summary>
    public class CascadeCancelResult
    {
        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; set; } = String.Empty;

        /// <summary>
        /// Unit identifier.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// Unit name.
        /// </summary>
        public string UnitName { get; set; } = String.Empty;

        /// <summary>
        /// Queued and running runs cancelled. Running runs move to Cancelling.
        /// </summary>
        public int RunsCancelled { get; set; } = 0;

        /// <summary>
        /// In-flight mandate ticks cancelled.
        /// </summary>
        public int TicksCancelled { get; set; } = 0;

        /// <summary>
        /// Open escalations raised in the subtree that were withdrawn.
        /// </summary>
        public int EscalationsWithdrawn { get; set; } = 0;

        /// <summary>
        /// Queued or undelivered messages addressed to the subtree that were expired.
        /// </summary>
        public int MessagesExpired { get; set; } = 0;

        /// <summary>
        /// Identifiers of the cancelled runs.
        /// </summary>
        public List<string> RunIds { get; set; } = new List<string>();

        /// <summary>
        /// When the cancel finished (UTC).
        /// </summary>
        public DateTime CompletedUtc { get; set; } = DateTime.UtcNow;
    }
}
