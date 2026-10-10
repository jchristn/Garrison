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

        #endregion

        #region Private-Members

        private int _PrometheusPort = 9464;

        #endregion
    }
}
