namespace Garrison.Core.Settings
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Telemetry settings (Radiant).
    /// </summary>
    public class TelemetrySettings
    {
        #region Public-Members

        /// <summary>
        /// Whether telemetry is enabled. Default true.
        /// </summary>
        public bool Enabled { get; set; } = true;

        /// <summary>
        /// Service name. Default garrison-server.
        /// </summary>
        public string ServiceName { get; set; } = "garrison-server";

        /// <summary>
        /// Whether the Prometheus scrape listener is enabled. Default true.
        /// </summary>
        public bool PrometheusEnable { get; set; } = true;

        /// <summary>
        /// Prometheus listener hostname. Default *.
        /// </summary>
        public string PrometheusHostname { get; set; } = "*";

        /// <summary>
        /// Prometheus listener port. Minimum 1, maximum 65535, default 9464.
        /// </summary>
        public int PrometheusPort
        {
            get
            {
                return _PrometheusPort;
            }
            set
            {
                _PrometheusPort = Math.Clamp(value, 1, 65535);
            }
        }

        /// <summary>
        /// Prometheus path. Default /metrics.
        /// </summary>
        public string PrometheusPath { get; set; } = "/metrics";

        /// <summary>
        /// Whether OTLP export is enabled. Default false.
        /// </summary>
        public bool OtlpEnable { get; set; } = false;

        /// <summary>
        /// OTLP endpoint. Default http://127.0.0.1:4317.
        /// </summary>
        public string OtlpEndpoint { get; set; } = "http://127.0.0.1:4317";

        /// <summary>
        /// Whether GET /metrics is also served from the process's main listener (the server's REST port 8700, or the
        /// worker's health port 8710), relayed from the Prometheus listener. The Prometheus listener binds the pod
        /// host name, so kubectl port-forward and in-pod 127.0.0.1 requests cannot reach it; the main listener binds all
        /// interfaces. The relayed endpoint needs no authentication. Default true.
        /// </summary>
        public bool ServeMetricsOnServicePort { get; set; } = true;

        #endregion

        #region Private-Members

        private int _PrometheusPort = 9464;

        #endregion
    }
}
