namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Client;

    /// <summary>
    /// One logical run of a resilience scenario: an idempotency key, the run it produced, and its last state.
    /// </summary>
    public class ScenarioRun
    {
        /// <summary>
        /// Idempotency key.
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Run created, or null when creation never succeeded.
        /// </summary>
        public string? RunId { get; set; }

        /// <summary>
        /// Last state read.
        /// </summary>
        public Run? Final { get; set; }
    }
}
