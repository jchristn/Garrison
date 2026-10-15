namespace Garrison.Core.Notifications
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// JSON body of an outbound notification (P12.14). Exactly one of run, pipelineRun, approval, or review is set,
    /// except for test notifications, which set none. It never carries secrets, run input, or run output; a run's result
    /// text is included only when the endpoint sets includeResultText, cut to its resultTextMaxChars.
    /// </summary>
    public class NotificationPayload
    {
        #region Public-Members

        /// <summary>
        /// Delivery identifier (prefix ndl_), the same as the X-Garrison-Delivery header and the same on every retry.
        /// Receivers use it to ignore repeated deliveries.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Event.
        /// </summary>
        public NotificationEventEnum Event { get; set; } = NotificationEventEnum.Test;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Notification endpoint identifier.
        /// </summary>
        public string EndpointId { get; set; } = String.Empty;

        /// <summary>
        /// When the event happened (UTC): the completion time of a run or pipeline run, or the request time of an
        /// approval or review.
        /// </summary>
        public DateTime OccurredUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// API URL of the subject (built from Rest.ExternalBaseUrl), or null for test notifications.
        /// </summary>
        public string? Link { get; set; } = null;

        /// <summary>
        /// Run summary for run events.
        /// </summary>
        public NotificationRunSummary? Run { get; set; } = null;

        /// <summary>
        /// Pipeline run summary for pipeline events.
        /// </summary>
        public NotificationPipelineRunSummary? PipelineRun { get; set; } = null;

        /// <summary>
        /// Approval or stage review summary for ApprovalRequested.
        /// </summary>
        public NotificationApprovalSummary? Approval { get; set; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public NotificationPayload()
        {
        }

        #endregion
    }
}
