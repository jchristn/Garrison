namespace Garrison.Core.Responses
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Count of unfinished runs for one tenant, agent, harness, and status, used by the queue depth gauge.
    /// </summary>
    public class RunGaugeRow
    {
        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name.
        /// </summary>
        public string AgentName { get; set; } = String.Empty;

        /// <summary>
        /// Harness type.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Run status (Pending, Queued, Leased, Running, Cancelling).
        /// </summary>
        public string Status { get; set; } = String.Empty;

        /// <summary>
        /// Number of runs.
        /// </summary>
        public long Count { get; set; } = 0;
    }
}
