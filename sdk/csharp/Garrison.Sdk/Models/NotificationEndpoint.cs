namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// An outbound webhook subscription (P12.14): Garrison POSTs signed JSON notifications to the URL for subscribed events.
    /// </summary>
    public class NotificationEndpoint
    {
        #region Public-Members

        /// <summary>
        /// Identifier (nep_). Empty on create.
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
        /// Name, unique per tenant: 1 to 64 lowercase letters, digits, and hyphens.
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
        /// Optional description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Destination URL (http or https). Loopback and private addresses need the cluster setting Notifications.AllowPrivateDestinations; link-local addresses are always refused.
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
        /// Subscribed events (at least one; Test cannot be subscribed to).
        /// </summary>
        public List<NotificationEventEnum> Events { get; set; } = new List<NotificationEventEnum>();

        /// <summary>
        /// Optional agent filter.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Optional deployment filter.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Whether run notifications carry the result text. Default false.
        /// </summary>
        public bool IncludeResultText { get; set; } = false;

        /// <summary>
        /// Most characters of result text, 1 to 16000. Default 1000.
        /// </summary>
        public int ResultTextMaxChars { get; set; } = 1000;

        /// <summary>
        /// Whether events are delivered. Default true.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Signing secret: returned only by create and rotate-secret, null otherwise.
        /// </summary>
        public string? SigningSecret { get; set; } = null;

        /// <summary>
        /// Last four characters of the signing secret.
        /// </summary>
        public string? SigningSecretLast4 { get; set; } = null;

        /// <summary>
        /// When the signing secret was last set (UTC).
        /// </summary>
        public DateTime? SigningSecretRotatedUtc { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
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
        private string _Name = String.Empty;
        private string _Url = String.Empty;

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
