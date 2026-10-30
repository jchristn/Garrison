namespace Garrison.Sdk.Models
{
    using System;
    using System.Text.Json;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One notification to one endpoint (P12.14): the outbox entry and its delivery log record.
    /// </summary>
    public class NotificationDelivery
    {
        #region Public-Members

        /// <summary>
        /// Identifier (ndl_), sent as X-Garrison-Delivery and the same on every retry.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Notification endpoint identifier.
        /// </summary>
        public string EndpointId
        {
            get
            {
                return _EndpointId;
            }
            set
            {
                _EndpointId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Event.
        /// </summary>
        public NotificationEventEnum Event { get; set; } = NotificationEventEnum.Test;

        /// <summary>
        /// Run, PipelineRun, Approval, PipelineReview, or Test.
        /// </summary>
        public string SubjectType
        {
            get
            {
                return _SubjectType;
            }
            set
            {
                _SubjectType = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Subject identifier, or null for a test notification.
        /// </summary>
        public string? SubjectId { get; set; } = null;

        /// <summary>
        /// Delivery status.
        /// </summary>
        public NotificationDeliveryStatusEnum Status { get; set; } = NotificationDeliveryStatusEnum.Pending;

        /// <summary>
        /// Attempts made so far.
        /// </summary>
        public int Attempts { get; set; } = 0;

        /// <summary>
        /// Most attempts for this delivery.
        /// </summary>
        public int MaxAttempts { get; set; } = 1;

        /// <summary>
        /// When the next attempt is due (UTC), or null once final.
        /// </summary>
        public DateTime? NextAttemptUtc { get; set; } = null;

        /// <summary>
        /// HTTP status of the last attempt, or null.
        /// </summary>
        public int? LastStatusCode { get; set; } = null;

        /// <summary>
        /// Error of the last attempt, or null.
        /// </summary>
        public string? LastError { get; set; } = null;

        /// <summary>
        /// Time of the last attempt (UTC).
        /// </summary>
        public DateTime? LastAttemptUtc { get; set; } = null;

        /// <summary>
        /// Duration of the last attempt in milliseconds.
        /// </summary>
        public long LastDurationMs { get; set; } = 0;

        /// <summary>
        /// When the endpoint accepted the notification (UTC).
        /// </summary>
        public DateTime? DeliveredUtc { get; set; } = null;

        /// <summary>
        /// The JSON body sent on every attempt, as a JSON object, or null.
        /// </summary>
        public JsonElement? Payload { get; set; } = null;

        /// <summary>
        /// When the event was queued (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _EndpointId = String.Empty;
        private string _SubjectType = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public NotificationDelivery()
        {
        }

        #endregion
    }
}
