namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// One line of a run archive file: a run removed by retention, with its child rows and its events (P10.12).
    /// </summary>
    public class ArchivedRun
    {
        /// <summary>
        /// When the run was archived (UTC).
        /// </summary>
        public DateTime ArchivedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// The run, with parameters, requirements, and template versions.
        /// </summary>
        public Run Run { get; set; } = new Run();

        /// <summary>
        /// The run's events in sequence order.
        /// </summary>
        public List<RunEvent> Events { get; set; } = new List<RunEvent>();
    }
}
