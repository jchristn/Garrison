namespace Garrison.Core.Notifications
{
    using System;

    /// <summary>
    /// Fields carried by MandateCapReached notifications (AA3.6).
    /// </summary>
    public class NotificationMandateCapSummary
    {
        #region Public-Members

        /// <summary>
        /// Mandate identifier (mdt_).
        /// </summary>
        public string MandateId { get; set; } = String.Empty;

        /// <summary>
        /// Mandate name, or null when the mandate no longer exists.
        /// </summary>
        public string? MandateName { get; set; } = null;

        /// <summary>
        /// The keeper's agent, or null when the mandate no longer exists.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// The keeper's deployment, or null when the mandate no longer exists.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// The skipped tick that recorded the cap (mtk_).
        /// </summary>
        public string TickId { get; set; } = String.Empty;

        /// <summary>
        /// The daily budget in USD of the revision in force, or null when it is no longer known.
        /// </summary>
        public double? BudgetPerDayUsd { get; set; } = null;

        /// <summary>
        /// When the cap was reached (UTC).
        /// </summary>
        public DateTime ReachedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the daily window resets and the keeper ticks again (UTC): the start of the next UTC day.
        /// </summary>
        public DateTime ResetsUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public NotificationMandateCapSummary()
        {
        }

        #endregion
    }
}
