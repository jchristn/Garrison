namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// The autonomy kill switch of a tenant (AA3). When it is on, no keeper ticks start and keeper runs are refused;
    /// ordinary invocations keep working. It is stored as a freeze with target kind TenantAutonomy.
    /// </summary>
    public class KillSwitchState
    {
        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// True while the switch is on.
        /// </summary>
        public bool Enabled { get; set; } = false;

        /// <summary>
        /// The TenantAutonomy freeze that holds the switch on, or null when it is off.
        /// </summary>
        public string? FreezeId { get; set; } = null;

        /// <summary>
        /// Why it was turned on, or null.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// Who turned it on, or null when it is off.
        /// </summary>
        public string? ChangedByName { get; set; } = null;

        /// <summary>
        /// When it was turned on (UTC), or null when it is off.
        /// </summary>
        public DateTime? ChangedUtc { get; set; } = null;
    }
}
