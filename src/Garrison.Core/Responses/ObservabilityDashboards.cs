namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// Grafana dashboard UIDs used to build deep links (Phase 13 contract).
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
    }
}
