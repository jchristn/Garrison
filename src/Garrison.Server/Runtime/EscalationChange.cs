namespace Garrison.Server.Runtime
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// One change to an escalation (AA2), raised by <see cref="EscalationService"/> for the escalations WebSocket channel
    /// and notifications.
    /// </summary>
    public class EscalationChange
    {
        /// <summary>
        /// The escalation after the change.
        /// </summary>
        public Escalation Escalation { get; set; } = new Escalation();

        /// <summary>
        /// What happened: escalation.raised, escalation.answered, escalation.cancelled, escalation.withdrawn,
        /// escalation.expired, or escalation.escalated.
        /// </summary>
        public string Type { get; set; } = String.Empty;
    }
}
