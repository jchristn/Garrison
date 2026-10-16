namespace Garrison.Core.Requests
{
    /// <summary>Queued-run admission limits. Zero disables a limit. Counts and insert are serialized together across replicas.</summary>
    public class QueueDepthLimits
    {
        /// <summary>Maximum queued runs in the cluster; default 0 (unlimited).</summary>
        public int Cluster { get; set; }
        /// <summary>Maximum queued runs in a tenant; default 0 (unlimited).</summary>
        public int Tenant { get; set; }
        /// <summary>Maximum queued runs for an agent within its tenant; default 0 (unlimited).</summary>
        public int Agent { get; set; }
        /// <summary>Retry hint in seconds; default 5, minimum 1.</summary>
        public int RetryAfterSeconds { get; set; } = 5;
    }
}
