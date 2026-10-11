namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// Grafana dashboard UIDs used to build deep links (Phase 13 contract): one dashboard per section in the Garrison
    /// folder (P13.27).
    /// </summary>
    public class ObservabilityDashboards
    {
        /// <summary>
        /// Overview dashboard UID. Default garrison-overview.
        /// </summary>
        public string Overview { get; set; } = "garrison-overview";

        /// <summary>
        /// HTTP dashboard UID. Default garrison-http.
        /// </summary>
        public string Http { get; set; } = "garrison-http";

        /// <summary>
        /// Runs and scheduling dashboard UID. Default garrison-runs.
        /// </summary>
        public string Runs { get; set; } = "garrison-runs";

        /// <summary>
        /// Workers and harnesses dashboard UID. Default garrison-workers.
        /// </summary>
        public string Workers { get; set; } = "garrison-workers";

        /// <summary>
        /// Protocols dashboard UID. Default garrison-protocols.
        /// </summary>
        public string Protocols { get; set; } = "garrison-protocols";

        /// <summary>
        /// Integrations dashboard UID. Default garrison-integrations.
        /// </summary>
        public string Integrations { get; set; } = "garrison-integrations";

        /// <summary>
        /// Agents dashboard UID (per-agent invocations, run time percentiles, TTFT, streaming, queue time, guard trips). Default garrison-agents.
        /// </summary>
        public string Agents { get; set; } = "garrison-agents";

        /// <summary>
        /// Models and tokens dashboard UID (token breakdowns, cost, throughput by model). Default garrison-models.
        /// </summary>
        public string Models { get; set; } = "garrison-models";

        /// <summary>
        /// Kubernetes executor dashboard UID (run Jobs, pod start latency, pod failures). Default garrison-kubernetes.
        /// </summary>
        public string Kubernetes { get; set; } = "garrison-kubernetes";

        /// <summary>
        /// Scheduler and queue dashboard UID (queue depth, claims, leases, blocked runs). Default garrison-scheduler.
        /// </summary>
        public string Scheduler { get; set; } = "garrison-scheduler";

        /// <summary>
        /// Database dashboard UID (statement latency, errors, connections). Default garrison-database.
        /// </summary>
        public string Database { get; set; } = "garrison-database";

        /// <summary>
        /// Control plane dashboard UID (replicas, leader, backplane, background services). Default garrison-control-plane.
        /// </summary>
        public string ControlPlane { get; set; } = "garrison-control-plane";

        /// <summary>
        /// Security and auth dashboard UID (authentication failures, denials, rate limits, secrets). Default garrison-security.
        /// </summary>
        public string Security { get; set; } = "garrison-security";

        /// <summary>
        /// Logs and traces dashboard UID (log volume, errors and warnings, trace search). Default garrison-logs.
        /// </summary>
        public string Logs { get; set; } = "garrison-logs";
    }
}
