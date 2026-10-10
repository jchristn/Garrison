namespace Garrison.Core.Telemetry
{
    using System;
    using System.Collections.Generic;
    using System.Net;
    using Garrison.Core.Settings;
    using Radiant;

    /// <summary>
    /// Application telemetry over Radiant: Prometheus listener, optional OTLP export, subscriptions to the Garrison,
    /// Garrison.Worker, Watson, Voltaic, and Padlock sources. Recording is best-effort and never throws. Thread-safe.
    /// </summary>
    public class GarrisonTelemetry : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Whether telemetry started successfully.
        /// </summary>
        public bool Active
        {
            get
            {
                return _Client != null;
            }
        }

        /// <summary>
        /// Host the Prometheus listener actually bound to, or null when telemetry or the listener is off.
        /// A configured wildcard (<c>*</c>, <c>+</c>, <c>0.0.0.0</c>) binds to the machine host name, which resolves to
        /// the pod IP in Kubernetes, and falls back to <c>127.0.0.1</c> if that fails.
        /// </summary>
        public string? PrometheusHostname { get; private set; } = null;

        #endregion

        #region Private-Members

        private readonly RadiantHost? _Host;
        private readonly RadiantClient? _Client;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate and start telemetry. Failures disable telemetry and are reported to the diagnostic callback.
        /// </summary>
        /// <param name="settings">Telemetry settings.</param>
        /// <param name="nodeId">Node identifier.</param>
        /// <param name="diagnostic">Diagnostic callback.</param>
        /// <exception cref="ArgumentNullException">Thrown when settings is null.</exception>
        public GarrisonTelemetry(TelemetrySettings settings, string nodeId, Action<string>? diagnostic)
        {
            if (settings == null) throw new ArgumentNullException(nameof(settings));
            if (!settings.Enabled) return;

            List<string> hosts = PrometheusHosts(settings);
            for (int i = 0; i < hosts.Count; i++)
            {
                try
                {
                    _Host = RadiantHost.Start(Build(settings, nodeId, hosts[i], diagnostic));
                    _Client = _Host.Client;
                    PrometheusHostname = settings.PrometheusEnable ? hosts[i] : null;
                    if (i > 0) diagnostic?.Invoke("telemetry: Prometheus listener bound to " + hosts[i] + " after " + hosts[i - 1] + " failed");
                    return;
                }
                catch (Exception e)
                {
                    _Host = null;
                    _Client = null;
                    if (i < hosts.Count - 1) continue;
                    string detail = e.Message;
                    for (Exception? inner = e.InnerException; inner != null; inner = inner.InnerException) detail += " (" + inner.GetType().Name + ": " + inner.Message + ")";
                    diagnostic?.Invoke("telemetry disabled: " + detail);
                }
            }
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Increment a counter.
        /// </summary>
        /// <param name="name">Metric name (garrison. prefix recommended).</param>
        /// <param name="tags">Low-cardinality tags.</param>
        public void Increment(string name, params RadiantTag[] tags)
        {
            if (_Client == null) return;
            try
            {
                _Client.Increment(name, 1.0, tags);
            }
            catch (Exception)
            {
            }
        }

        /// <summary>
        /// Add an amount to a counter.
        /// </summary>
        /// <param name="name">Metric name.</param>
        /// <param name="amount">Non-negative amount.</param>
        /// <param name="tags">Low-cardinality tags.</param>
        public void Add(string name, double amount, params RadiantTag[] tags)
        {
            if (_Client == null) return;
            try
            {
                _Client.Increment(name, amount, tags);
            }
            catch (Exception)
            {
            }
        }

        /// <summary>
        /// Record a histogram value.
        /// </summary>
        /// <param name="name">Metric name.</param>
        /// <param name="value">Value.</param>
        /// <param name="tags">Low-cardinality tags.</param>
        public void Record(string name, double value, params RadiantTag[] tags)
        {
            if (_Client == null) return;
            try
            {
                _Client.Record(name, value, tags);
            }
            catch (Exception)
            {
            }
        }

        /// <summary>
        /// Register an observable gauge.
        /// </summary>
        /// <param name="name">Metric name.</param>
        /// <param name="observe">Value callback.</param>
        /// <param name="unit">Unit.</param>
        public void Gauge(string name, Func<double> observe, string unit)
        {
            if (_Client == null) return;
            try
            {
                _Client.RegisterGauge(name, observe, unit);
            }
            catch (Exception)
            {
            }
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose pattern implementation.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing) _Host?.Dispose();
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private static List<string> PrometheusHosts(TelemetrySettings settings)
        {
            List<string> hosts = new List<string>();
            string configured = settings.PrometheusHostname;
            if (configured == "*" || configured == "+" || configured == "0.0.0.0" || String.IsNullOrWhiteSpace(configured))
            {
                string machine = Dns.GetHostName();
                if (!String.IsNullOrEmpty(machine)) hosts.Add(machine);
                hosts.Add("127.0.0.1");
            }
            else
            {
                hosts.Add(configured);
            }
            return hosts;
        }

        private static RadiantSettings Build(TelemetrySettings settings, string nodeId, string host, Action<string>? diagnostic)
        {
            RadiantSettings radiant = new RadiantSettings();
            radiant.Enable = true;
            radiant.ServiceName = String.IsNullOrEmpty(settings.ServiceName) ? "garrison" : settings.ServiceName;
            radiant.ServiceInstanceId = String.IsNullOrEmpty(nodeId) ? null : nodeId;
            radiant.DiagnosticCallback = diagnostic;
            radiant.Metrics.IncludeRuntime = true;
            radiant.Metrics.IncludeProcess = true;
            radiant.Prometheus.Enable = settings.PrometheusEnable;
            radiant.Prometheus.Hostname = host;
            radiant.Prometheus.Port = settings.PrometheusPort;
            radiant.Prometheus.Path = settings.PrometheusPath;
            radiant.Otlp.Enable = settings.OtlpEnable;
            if (!String.IsNullOrEmpty(settings.OtlpEndpoint)) radiant.Otlp.Endpoint = settings.OtlpEndpoint;
            radiant.Sources.AddActivitySource("Garrison");
            radiant.Sources.AddActivitySource("Garrison.Worker");
            radiant.Sources.AddMeter("Watson");
            radiant.Sources.AddActivitySource("Watson");
            radiant.Sources.AddMeter("Voltaic");
            radiant.Sources.AddActivitySource("Voltaic");
            radiant.Sources.AddMeter("Padlock");
            radiant.Sources.AddActivitySource("Padlock");
            return radiant;
        }

        #endregion
    }
}
