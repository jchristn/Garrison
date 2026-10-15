namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// An outbound webhook subscription (P12.14): Garrison POSTs a signed JSON notification to the URL when a subscribed
    /// event happens in the tenant. Delivery is asynchronous and at least once, through a durable outbox with retries and
    /// exponential backoff. The URL is checked against the SSRF rules when it is saved and again, after DNS resolution,
    /// when each delivery connects; redirects are never followed. Payloads carry identifiers, status, outcome, agent,
    /// deployment, timestamps, and a link; never secrets, and never run output unless includeResultText is set.
    /// </summary>
    public class NotificationEndpoint
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix nep_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewNotificationEndpointId() : value;
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
        /// Name, unique per tenant: 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or
        /// digit.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Optional description (at most 4000 characters).
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Destination URL: absolute http or https, at most 2048 characters, without user information. Loopback and
        /// private destinations are refused unless the cluster setting Notifications.AllowPrivateDestinations is true;
        /// link-local (169.254.169.254 included), multicast, and reserved addresses are always refused.
        /// </summary>
        public string Url
        {
            get
            {
                return _Url;
            }
            set
            {
                _Url = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Subscribed events, at least one, each at most once. Test cannot be subscribed to.
        /// </summary>
        public List<NotificationEventEnum> Events
        {
            get
            {
                return _Events;
            }
            set
            {
                _Events = value ?? new List<NotificationEventEnum>();
            }
        }

        /// <summary>
        /// Optional agent filter: only run events, permission approvals, and stage reviews whose run belongs to this agent
        /// are sent. Pipeline events have no agent and are not sent while a filter is set.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Optional deployment filter: only run events, permission approvals, and stage reviews whose run used this
        /// deployment are sent. Pipeline events are not sent while a filter is set.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Whether run notifications include the run's result text, cut to resultTextMaxChars. Default false: payloads
        /// carry no run output.
        /// </summary>
        public bool IncludeResultText { get; set; } = false;

        /// <summary>
        /// Most characters of result text included when includeResultText is true. Default 1000, minimum 1, maximum
        /// 16000. Values outside the range are clamped.
        /// </summary>
        public int ResultTextMaxChars
        {
            get
            {
                return _ResultTextMaxChars;
            }
            set
            {
                _ResultTextMaxChars = Math.Clamp(value, 1, 16000);
            }
        }

        /// <summary>
        /// Whether events are delivered. Default true. Events that happen while inactive are not queued.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// The signing secret. Returned only in the response to create and rotate-secret; never stored in plaintext and
        /// never returned again. Null otherwise.
        /// </summary>
        public string? SigningSecret { get; set; } = null;

        /// <summary>
        /// Last four characters of the signing secret, for recognizing it.
        /// </summary>
        public string? SigningSecretLast4 { get; set; } = null;

        /// <summary>
        /// When the signing secret was last set (UTC).
        /// </summary>
        public DateTime? SigningSecretRotatedUtc { get; set; } = null;

        /// <summary>
        /// Creation time (UTC). Events that happened before it are never sent to this endpoint.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Encrypted signing secret. Never serialized.
        /// </summary>
        [JsonIgnore]
        public string? SecretEncrypted { get; set; } = null;

        /// <summary>
        /// Key version the signing secret was encrypted with. Never serialized.
        /// </summary>
        [JsonIgnore]
        public int SecretKeyVersion { get; set; } = 1;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewNotificationEndpointId();
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _Url = String.Empty;
        private List<NotificationEventEnum> _Events = new List<NotificationEventEnum>();
        private int _ResultTextMaxChars = 1000;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public NotificationEndpoint()
        {
        }

        #endregion
    }
}
