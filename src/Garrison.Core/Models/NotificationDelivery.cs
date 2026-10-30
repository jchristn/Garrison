namespace Garrison.Core.Models
{
    using System;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Serialization;

    /// <summary>
    /// One notification to one endpoint (P12.14): the durable outbox row, retried with exponential backoff until it
    /// succeeds or gives up, and afterwards its entry in the delivery log. The body is fixed when the event is queued so
    /// every attempt sends the same bytes; each attempt is signed with the endpoint's current secret and a fresh timestamp.
    /// Deliveries are pruned after Notifications.DeliveryRetentionDays.
    /// </summary>
    public class NotificationDelivery
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix ndl_). Sent as the X-Garrison-Delivery header and the payload id, the same on every retry.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewNotificationDeliveryId() : value;
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
        /// Kind of the subject: Run, PipelineRun, Approval, PipelineReview, or Test.
        /// </summary>
        public string SubjectType { get; set; } = "Test";

        /// <summary>
        /// Identifier of the subject (run, pipeline run, approval, or review), or null for a test notification.
        /// </summary>
        public string? SubjectId { get; set; } = null;

        /// <summary>
        /// Delivery status.
        /// </summary>
        public NotificationDeliveryStatusEnum Status { get; set; } = NotificationDeliveryStatusEnum.Pending;

        /// <summary>
        /// Attempts made so far. Minimum 0.
        /// </summary>
        public int Attempts
        {
            get
            {
                return _Attempts;
            }
            set
            {
                _Attempts = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Most attempts for this delivery, from Notifications.MaxAttempts when it was queued. Minimum 1.
        /// </summary>
        public int MaxAttempts
        {
            get
            {
                return _MaxAttempts;
            }
            set
            {
                _MaxAttempts = Math.Max(1, value);
            }
        }

        /// <summary>
        /// When the next attempt is due (UTC), or null once the delivery succeeded or gave up.
        /// </summary>
        public DateTime? NextAttemptUtc { get; set; } = null;

        /// <summary>
        /// HTTP status of the last attempt, or null when it did not get a response.
        /// </summary>
        public int? LastStatusCode { get; set; } = null;

        /// <summary>
        /// Error of the last attempt (connection failure, timeout, blocked destination, or unexpected status), or null.
        /// </summary>
        public string? LastError { get; set; } = null;

        /// <summary>
        /// Time of the last attempt (UTC), or null before the first attempt.
        /// </summary>
        public DateTime? LastAttemptUtc { get; set; } = null;

        /// <summary>
        /// Duration of the last attempt in milliseconds. Minimum 0.
        /// </summary>
        public long LastDurationMs
        {
            get
            {
                return _LastDurationMs;
            }
            set
            {
                _LastDurationMs = Math.Max(0, value);
            }
        }

        /// <summary>
        /// When the endpoint accepted the notification (UTC), or null.
        /// </summary>
        public DateTime? DeliveredUtc { get; set; } = null;

        /// <summary>
        /// The JSON body sent on every attempt, kept byte for byte because its signature covers it. Not serialized; the
        /// API returns it as the JSON object <see cref="PayloadValue"/>.
        /// </summary>
        [JsonIgnore]
        public string Payload
        {
            get
            {
                return _Payload;
            }
            set
            {
                _Payload = value ?? String.Empty;
            }
        }

        /// <summary>
        /// The body sent on every attempt, as the JSON object it is; null when it is empty.
        /// </summary>
        [JsonPropertyName("payload")]
        public JsonElement? PayloadValue
        {
            get
            {
                return JsonText.Value(_Payload);
            }
            set
            {
                _Payload = JsonText.Text(value) ?? String.Empty;
            }
        }

        /// <summary>
        /// Creation time (UTC): when the event was queued.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Uniqueness key within the endpoint, so a re-queued event is not sent twice. Never serialized.
        /// </summary>
        [JsonIgnore]
        public string EventKey { get; set; } = String.Empty;

        /// <summary>
        /// Control-plane replica holding the claim while Delivering. Never serialized.
        /// </summary>
        [JsonIgnore]
        public string? ClaimedBy { get; set; } = null;

        /// <summary>
        /// When the current claim expires (UTC). Never serialized.
        /// </summary>
        [JsonIgnore]
        public DateTime? ClaimUntilUtc { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewNotificationDeliveryId();
        private string _TenantId = String.Empty;
        private string _EndpointId = String.Empty;
        private int _Attempts = 0;
        private int _MaxAttempts = 8;
        private long _LastDurationMs = 0;
        private string _Payload = String.Empty;

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
