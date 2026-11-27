namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// MCP client name and version sent on initialize.
    /// </summary>
    public class McpClientInfo
    {
        /// <summary>
        /// Client name.
        /// </summary>
        public string Name { get; set; } = "Garrison.Benchmark";

        /// <summary>
        /// Client version.
        /// </summary>
        public string Version { get; set; } = BenchmarkContext.HarnessVersion;
    }
}
