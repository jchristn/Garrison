namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Protocol;

    /// <summary>
    /// The tool probes workers run, with a short hash that changes when the list changes (AD4.4).
    /// </summary>
    public class ToolProbeSet
    {
        /// <summary>
        /// One probe per tool name.
        /// </summary>
        public List<NodeToolProbe> Probes { get; set; } = new List<NodeToolProbe>();

        /// <summary>
        /// Hash of the list: 16 lowercase hex characters.
        /// </summary>
        public string Hash { get; set; } = String.Empty;
    }
}
