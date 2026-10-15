namespace Garrison.Core.Database.Ado
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One row of notification_endpoint_events as read in bulk (P12.14). Internal to the data layer.
    /// </summary>
    public class EndpointEventRow
    {
        #region Public-Members

        /// <summary>
        /// Notification endpoint identifier.
        /// </summary>
        public string EndpointId { get; }

        /// <summary>
        /// Subscribed event.
        /// </summary>
        public NotificationEventEnum Event { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="endpointId">Endpoint identifier; null becomes empty.</param>
        /// <param name="value">Event.</param>
        public EndpointEventRow(string endpointId, NotificationEventEnum value)
        {
            EndpointId = endpointId ?? String.Empty;
            Event = value;
        }

        #endregion
    }
}
