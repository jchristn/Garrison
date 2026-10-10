namespace Garrison.Sdk.Clients
{
    using System;
    using Garrison.Sdk.Models;

    /// <summary>
    /// One item from a run's event stream: a run event, a status heartbeat, or the final run.
    /// </summary>
    public class RunStreamEvent
    {
        /// <summary>
        /// SSE event name: run.event, run.status, or run.completed.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Run event for run.event items.
        /// </summary>
        public RunEvent? Event { get; set; } = null;

        /// <summary>
        /// Final run for run.completed items.
        /// </summary>
        public Run? Run { get; set; } = null;

        /// <summary>
        /// Raw data.
        /// </summary>
        public string Data { get; set; } = String.Empty;
    }
}
