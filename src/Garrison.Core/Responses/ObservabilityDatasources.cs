namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// Grafana datasource UIDs used to build deep links (Phase 13 contract).
    /// </summary>
    public class ObservabilityDatasources
    {
        /// <summary>
        /// Prometheus datasource UID. Default garrison-prometheus.
        /// </summary>
        public string Prometheus { get; set; } = "garrison-prometheus";

        /// <summary>
        /// Loki datasource UID. Default garrison-loki.
        /// </summary>
        public string Loki { get; set; } = "garrison-loki";

        /// <summary>
        /// Tempo datasource UID. Default garrison-tempo.
        /// </summary>
        public string Tempo { get; set; } = "garrison-tempo";
    }
}
