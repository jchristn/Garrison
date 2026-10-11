namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// The fields of GET /v1.0/api/server-info the harness records.
    /// </summary>
    public class ServerInfo
    {
        /// <summary>
        /// Server version.
        /// </summary>
        public string? Version { get; set; }

        /// <summary>
        /// Replica that answered.
        /// </summary>
        public string? NodeId { get; set; }
    }
}
