namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Messages claimed for one run's input (AA6.5): the claim, the messages oldest first, and their rendering through
    /// inbox-delivery. The caller completes the delivery once the run exists, or releases it when the run could not start.
    /// Not thread-safe.
    /// </summary>
    public class MessageDelivery
    {
        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Claim identifier held on the messages.
        /// </summary>
        public string Claim { get; set; } = String.Empty;

        /// <summary>
        /// Claimed messages, oldest first.
        /// </summary>
        public List<AgentMessage> Messages { get; set; } = new List<AgentMessage>();

        /// <summary>
        /// True when more messages are queued than this delivery holds.
        /// </summary>
        public bool More { get; set; } = false;

        /// <summary>
        /// The messages rendered through inbox-delivery, or empty when not rendered.
        /// </summary>
        public string Text { get; set; } = String.Empty;
    }
}
