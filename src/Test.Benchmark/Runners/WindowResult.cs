namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Concurrent;

    /// <summary>
    /// Operations of one timed window. Thread-safe: operations are added from many tasks.
    /// </summary>
    public class WindowResult
    {
        /// <summary>
        /// Operations.
        /// </summary>
        public ConcurrentBag<LoadOperation> Operations { get; } = new ConcurrentBag<LoadOperation>();

        /// <summary>
        /// Window length including the drain (ms).
        /// </summary>
        public double ElapsedMs { get; set; }
    }
}
