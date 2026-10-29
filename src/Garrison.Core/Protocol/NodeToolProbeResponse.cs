namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// The tool probes a worker runs (AD4.4), fetched before it registers so its first registration already carries the
    /// tools it found as node labels garrison.io/tool-{name}=true.
    /// </summary>
    public class NodeToolProbeResponse
    {
        /// <summary>
        /// Tool probes from every active harness profile, one per tool name.
        /// </summary>
        public List<NodeToolProbe> ToolProbes { get; set; } = new List<NodeToolProbe>();

        /// <summary>
        /// Hash of <see cref="ToolProbes"/>. Heartbeats carry the current hash; a worker fetches the probes again when it
        /// changes and registers again only when the tools it finds change.
        /// </summary>
        public string ToolProbeHash { get; set; } = String.Empty;
    }
}
