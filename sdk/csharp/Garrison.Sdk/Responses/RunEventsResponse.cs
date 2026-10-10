namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Page of run events.
    /// </summary>
    public class RunEventsResponse
    {
        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Current run status.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Queued;

        /// <summary>
        /// Events in sequence order.
        /// </summary>
        public List<Garrison.Sdk.Models.RunEvent> Events { get; set; } = new List<Garrison.Sdk.Models.RunEvent>();

        /// <summary>
        /// Highest sequence returned, or the requested afterSequence when empty.
        /// </summary>
        public long LastSequence { get; set; } = 0;

        /// <summary>
        /// Whether more events are immediately available.
        /// </summary>
        public bool HasMore { get; set; } = false;
    }
}
