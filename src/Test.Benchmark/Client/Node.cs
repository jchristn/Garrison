namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A worker node (REST_API.md, Node).
    /// </summary>
    public class Node
    {
        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Node name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Node pool.
        /// </summary>
        public string? NodePoolId { get; set; }

        /// <summary>
        /// Status, for example Ready.
        /// </summary>
        public string? Status { get; set; }

        /// <summary>
        /// Run capacity.
        /// </summary>
        public int MaxConcurrentRuns { get; set; }

        /// <summary>
        /// Runs currently held.
        /// </summary>
        public int ActiveRuns { get; set; }

        /// <summary>
        /// Labels.
        /// </summary>
        public List<NodeLabel> Labels { get; set; } = new List<NodeLabel>();
    }
}
