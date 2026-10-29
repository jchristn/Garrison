namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A tool probe the control plane asks a worker to run (AD4.4). The worker re-checks it against the
    /// <see cref="Garrison.Core.Models.HarnessToolProbe"/> rules before running it and skips one that does not pass.
    /// </summary>
    public class NodeToolProbe
    {
        /// <summary>
        /// Tool name; reported as the node label garrison.io/tool-{name}=true when the probe succeeds.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Executable to find on the worker's PATH.
        /// </summary>
        public string Executable { get; set; } = String.Empty;

        /// <summary>
        /// Arguments: at most one version or help flag.
        /// </summary>
        public List<string> Arguments { get; set; } = new List<string>();
    }
}
