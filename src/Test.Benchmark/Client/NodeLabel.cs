namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A worker node label.
    /// </summary>
    public class NodeLabel
    {
        /// <summary>
        /// Label key.
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Label value.
        /// </summary>
        public string Value { get; set; } = String.Empty;
    }
}
