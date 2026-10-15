namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Notification endpoint manifest spec (kind: NotificationEndpoint, P12.14). The agent and deployment filters are
    /// referenced by name. The signing secret is never exported; a document may set signingSecret only when the apply
    /// allows secret values, and a new endpoint without one gets a generated secret that is read by rotating it.
    /// </summary>
    public class NotificationEndpointSpec
    {
        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Destination URL (http or https; checked against the SSRF rules).
        /// </summary>
        public string? Url { get; set; } = null;

        /// <summary>
        /// Subscribed events.
        /// </summary>
        public List<NotificationEventEnum> Events { get; set; } = new List<NotificationEventEnum>();

        /// <summary>
        /// Optional agent filter (name).
        /// </summary>
        public string? Agent { get; set; } = null;

        /// <summary>
        /// Optional deployment filter (name).
        /// </summary>
        public string? Deployment { get; set; } = null;

        /// <summary>
        /// Whether run notifications include result text; null means false.
        /// </summary>
        public bool? IncludeResultText { get; set; } = null;

        /// <summary>
        /// Most characters of result text (1 to 16000); null means 1000.
        /// </summary>
        public int? ResultTextMaxChars { get; set; } = null;

        /// <summary>
        /// Whether events are delivered; null means true.
        /// </summary>
        public bool? Active { get; set; } = null;

        /// <summary>
        /// Signing secret, accepted only when the apply allows secret values.
        /// </summary>
        public string? SigningSecret { get; set; } = null;
    }
}
