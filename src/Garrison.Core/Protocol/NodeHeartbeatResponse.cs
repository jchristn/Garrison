namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Heartbeat result.
    /// </summary>
    public class NodeHeartbeatResponse
    {
        /// <summary>Single stdio test for this registration, or null when none is queued.</summary>
        public McpWorkerTest? McpTest { get; set; } = null;

        /// <summary>Runs the worker must cancel.</summary>
        public List<string> CancelRunIds { get; set; } = new List<string>();

        /// <summary>
        /// Runs whose lease the worker no longer holds; kill immediately.
        /// </summary>
        public List<string> LostRunIds { get; set; } = new List<string>();

        /// <summary>
        /// Whether the control plane asks the worker to drain.
        /// </summary>
        public bool Drain { get; set; } = false;

        /// <summary>
        /// Lease duration in milliseconds.
        /// </summary>
        public int LeaseDurationMs { get; set; } = 30000;

        /// <summary>
        /// Hash of the current tool probe list (AD4.4). A worker whose registration carried another hash re-registers to
        /// fetch the new probes. Empty when the control plane does not send probes.
        /// </summary>
        public string ToolProbeHash { get; set; } = String.Empty;
    }
}
