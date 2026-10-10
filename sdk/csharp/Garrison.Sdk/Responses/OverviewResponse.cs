namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Home page summary for a tenant.
    /// </summary>
    public class OverviewResponse
    {
        /// <summary>
        /// Agents.
        /// </summary>
        public long Agents { get; set; } = 0;

        /// <summary>
        /// Deployments.
        /// </summary>
        public long Deployments { get; set; } = 0;

        /// <summary>
        /// Runs created in the last 24 hours.
        /// </summary>
        public long RunsLast24Hours { get; set; } = 0;

        /// <summary>
        /// Runs in the last 24 hours by status.
        /// </summary>
        public List<StatusCount> RunsByStatus { get; set; } = new List<StatusCount>();

        /// <summary>
        /// Nodes by status.
        /// </summary>
        public List<StatusCount> NodesByStatus { get; set; } = new List<StatusCount>();

        /// <summary>
        /// Runs waiting for a node.
        /// </summary>
        public long Queued { get; set; } = 0;

        /// <summary>
        /// Queued runs that no Ready worker can run right now (runs whose blockedReason is not null).
        /// </summary>
        public long BlockedRuns { get; set; } = 0;

        /// <summary>
        /// Runs leased or running.
        /// </summary>
        public long Active { get; set; } = 0;

        /// <summary>
        /// Most recent failed or timed-out runs.
        /// </summary>
        public List<Garrison.Sdk.Models.Run> RecentFailures { get; set; } = new List<Garrison.Sdk.Models.Run>();

        /// <summary>
        /// When the summary was generated (UTC).
        /// </summary>
        public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;
    }
}
