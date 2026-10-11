namespace Garrison.Worker.Settings
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;
    using Garrison.Core.Settings;

    /// <summary>
    /// Worker node settings: the settings file (GARRISON_WORKER_SETTINGS_FILE, default garrison-worker.json) overridden
    /// by GARRISON_WORKER_* environment variables.
    /// </summary>
    public class WorkerSettings
    {
        #region Public-Members

        /// <summary>
        /// Control-plane REST base URL. Use 127.0.0.1, never localhost. Default http://127.0.0.1:8700.
        /// </summary>
        public string ServerUrl
        {
            get
            {
                return _ServerUrl;
            }
            set
            {
                _ServerUrl = String.IsNullOrWhiteSpace(value) ? "http://127.0.0.1:8700" : value;
            }
        }

        /// <summary>
        /// Node name; null uses HOSTNAME, then the machine name. Must be unique (Kubernetes pod name).
        /// </summary>
        public string? NodeName { get; set; } = null;

        /// <summary>
        /// Node credential access key. Override with GARRISON_WORKER_ACCESS_KEY.
        /// </summary>
        public string AccessKey
        {
            get
            {
                return _AccessKey;
            }
            set
            {
                _AccessKey = String.IsNullOrWhiteSpace(value) ? "access_garrison_node" : value;
            }
        }

        /// <summary>
        /// Node credential secret key. Override with GARRISON_WORKER_SECRET_KEY.
        /// </summary>
        public string SecretKey
        {
            get
            {
                return _SecretKey;
            }
            set
            {
                _SecretKey = String.IsNullOrWhiteSpace(value) ? "secret_garrison_node_change_me" : value;
            }
        }

        /// <summary>
        /// Node labels matched against deployment node selectors.
        /// </summary>
        public Dictionary<string, string> Labels
        {
            get
            {
                return _Labels;
            }
            set
            {
                _Labels = value ?? new Dictionary<string, string> { { "garrison.io/pool", "default" } };
            }
        }

        /// <summary>
        /// Node pool name, or null for the default pool.
        /// </summary>
        public string? NodePool { get; set; } = null;

        /// <summary>
        /// Maximum concurrent runs. Minimum 1, maximum 256, default 4.
        /// </summary>
        public int MaxConcurrentRuns
        {
            get
            {
                return _MaxConcurrentRuns;
            }
            set
            {
                _MaxConcurrentRuns = Math.Clamp(value, 1, 256);
            }
        }

        /// <summary>
        /// Root directory for per-run work, home, and config directories. Default workspaces (Kubernetes: /workspaces).
        /// </summary>
        public string WorkRoot
        {
            get
            {
                return _WorkRoot;
            }
            set
            {
                _WorkRoot = String.IsNullOrWhiteSpace(value) ? "workspaces" : value;
            }
        }

        /// <summary>
        /// Health listener hostname. Default * (all interfaces).
        /// </summary>
        public string HealthHostname
        {
            get
            {
                return _HealthHostname;
            }
            set
            {
                _HealthHostname = String.IsNullOrWhiteSpace(value) ? "*" : value;
            }
        }

        /// <summary>
        /// Health listener port. Minimum 1, maximum 65535, default 8710.
        /// </summary>
        public int HealthPort
        {
            get
            {
                return _HealthPort;
            }
            set
            {
                _HealthPort = Math.Clamp(value, 1, 65535);
            }
        }

        /// <summary>
        /// Heartbeat interval in milliseconds; the registration response may override it. Minimum 500, maximum 60000, default 5000.
        /// </summary>
        public int HeartbeatIntervalMs
        {
            get
            {
                return _HeartbeatIntervalMs;
            }
            set
            {
                _HeartbeatIntervalMs = Math.Clamp(value, 500, 60000);
            }
        }

        /// <summary>
        /// Pause tolerance in milliseconds (P3.16). When the heartbeat loop finds that more than its sleep plus this value
        /// passed (the host slept, the container or VM was frozen, or the clock jumped), it logs the pause and heartbeats,
        /// renewing every lease it holds, at once instead of waiting for the next beat. Minimum 1000, maximum 600000,
        /// default 5000.
        /// </summary>
        public int PauseGraceMs
        {
            get
            {
                return _PauseGraceMs;
            }
            set
            {
                _PauseGraceMs = Math.Clamp(value, 1000, 600000);
            }
        }

        /// <summary>
        /// Lease long-poll wait in milliseconds; the registration response may override it. Minimum 0, maximum 60000, default 20000.
        /// </summary>
        public int LeaseWaitMs
        {
            get
            {
                return _LeaseWaitMs;
            }
            set
            {
                _LeaseWaitMs = Math.Clamp(value, 0, 60000);
            }
        }

        /// <summary>
        /// Event flush interval in milliseconds. Minimum 20, maximum 10000, default 250.
        /// </summary>
        public int EventFlushIntervalMs
        {
            get
            {
                return _EventFlushIntervalMs;
            }
            set
            {
                _EventFlushIntervalMs = Math.Clamp(value, 20, 10000);
            }
        }

        /// <summary>
        /// Maximum events per batch. Minimum 1, maximum 1000, default 100.
        /// </summary>
        public int EventBatchSize
        {
            get
            {
                return _EventBatchSize;
            }
            set
            {
                _EventBatchSize = Math.Clamp(value, 1, 1000);
            }
        }

        /// <summary>
        /// Maximum events buffered per run while the control plane is unreachable; the oldest text events are dropped beyond this. Minimum 100, maximum 1000000, default 20000.
        /// </summary>
        public int MaxBufferedEvents
        {
            get
            {
                return _MaxBufferedEvents;
            }
            set
            {
                _MaxBufferedEvents = Math.Clamp(value, 100, 1000000);
            }
        }

        /// <summary>
        /// Seconds to wait for running runs during shutdown before cancelling them. Minimum 0, maximum 86400, default 900.
        /// </summary>
        public int DrainTimeoutSeconds
        {
            get
            {
                return _DrainTimeoutSeconds;
            }
            set
            {
                _DrainTimeoutSeconds = Math.Clamp(value, 0, 86400);
            }
        }

        /// <summary>
        /// Seconds to keep retrying a completion report while the control plane is unreachable. Minimum 10, maximum 86400, default 600.
        /// </summary>
        public int CompletionRetrySeconds
        {
            get
            {
                return _CompletionRetrySeconds;
            }
            set
            {
                _CompletionRetrySeconds = Math.Clamp(value, 10, 86400);
            }
        }

        /// <summary>
        /// Seconds between capability re-probes; 0 disables re-probing. Minimum 0, maximum 86400, default 600.
        /// </summary>
        public int ProbeIntervalSeconds
        {
            get
            {
                return _ProbeIntervalSeconds;
            }
            set
            {
                _ProbeIntervalSeconds = Math.Clamp(value, 0, 86400);
            }
        }

        /// <summary>
        /// MCP pre-flight timeout per server in milliseconds. Minimum 1000, maximum 300000, default 20000.
        /// </summary>
        public int McpPreflightTimeoutMs
        {
            get
            {
                return _McpPreflightTimeoutMs;
            }
            set
            {
                _McpPreflightTimeoutMs = Math.Clamp(value, 1000, 300000);
            }
        }

        /// <summary>
        /// Variables copied from the worker's environment into every harness process. Everything else starts empty.
        /// </summary>
        public List<string> EnvironmentAllowlist
        {
            get
            {
                return _EnvironmentAllowlist;
            }
            set
            {
                _EnvironmentAllowlist = value ?? new List<string> { "PATH", "LANG", "LC_ALL", "TZ", "USER", "TMPDIR", "TEMP", "TMP", "DOTNET_ROOT", "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_EXTRA_CA_CERTS", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "no_proxy", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT" };
            }
        }

        /// <summary>
        /// Harness probes run at startup.
        /// </summary>
        public List<HarnessProbeSettings> Probes
        {
            get
            {
                return _Probes;
            }
            set
            {
                _Probes = value ?? DefaultProbes();
            }
        }

        /// <summary>
        /// Logging settings.
        /// </summary>
        public WorkerLoggingSettings Logging
        {
            get
            {
                return _Logging;
            }
            set
            {
                _Logging = value ?? new WorkerLoggingSettings();
            }
        }

        /// <summary>
        /// Telemetry settings (Radiant). Defaults: service name garrison-worker, Prometheus on port 9465 at /metrics,
        /// OTLP export disabled. Override with GARRISON_WORKER_TELEMETRY_ENABLE, GARRISON_WORKER_PROMETHEUS_PORT,
        /// GARRISON_WORKER_OTLP_ENABLE, and GARRISON_WORKER_OTLP_ENDPOINT.
        /// </summary>
        public TelemetrySettings Telemetry
        {
            get
            {
                return _Telemetry;
            }
            set
            {
                _Telemetry = value ?? DefaultTelemetry();
            }
        }

        /// <summary>
        /// Settings file the values were loaded from.
        /// </summary>
        [JsonIgnore]
        public string? SourceFile { get; set; } = null;

        /// <summary>
        /// Effective node name.
        /// </summary>
        [JsonIgnore]
        public string EffectiveNodeName
        {
            get
            {
                if (!String.IsNullOrEmpty(NodeName)) return NodeName;
                string? host = Environment.GetEnvironmentVariable("HOSTNAME");
                return String.IsNullOrEmpty(host) ? Environment.MachineName : host;
            }
        }

        #endregion

        #region Private-Members

        private string _ServerUrl = "http://127.0.0.1:8700";
        private string _AccessKey = "access_garrison_node";
        private string _SecretKey = "secret_garrison_node_change_me";
        private Dictionary<string, string> _Labels = new Dictionary<string, string> { { "garrison.io/pool", "default" } };
        private int _MaxConcurrentRuns = 4;
        private string _WorkRoot = "workspaces";
        private string _HealthHostname = "*";
        private int _HealthPort = 8710;
        private TelemetrySettings _Telemetry = DefaultTelemetry();
        private int _HeartbeatIntervalMs = 5000;
        private int _PauseGraceMs = 5000;
        private int _LeaseWaitMs = 20000;
        private int _EventFlushIntervalMs = 250;
        private int _EventBatchSize = 100;
        private int _MaxBufferedEvents = 20000;
        private int _DrainTimeoutSeconds = 900;
        private int _CompletionRetrySeconds = 600;
        private int _ProbeIntervalSeconds = 600;
        private int _McpPreflightTimeoutMs = 20000;
        private List<string> _EnvironmentAllowlist = new List<string> { "PATH", "LANG", "LC_ALL", "TZ", "USER", "TMPDIR", "TEMP", "TMP", "DOTNET_ROOT", "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_EXTRA_CA_CERTS", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "no_proxy", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT" };
        private List<HarnessProbeSettings> _Probes = DefaultProbes();
        private WorkerLoggingSettings _Logging = new WorkerLoggingSettings();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Load settings from a file, writing defaults when it is missing and writable.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <returns>Settings.</returns>
        /// <exception cref="ArgumentNullException">Thrown when path is null or empty.</exception>
        /// <exception cref="InvalidDataException">Thrown when the file is not valid JSON.</exception>
        public static WorkerSettings FromFile(string path)
        {
            if (String.IsNullOrEmpty(path)) throw new ArgumentNullException(nameof(path));
            WorkerSettings settings;
            if (File.Exists(path))
            {
                try
                {
                    settings = JsonSerializer.Deserialize<WorkerSettings>(File.ReadAllText(path), Serializer.FileOptions) ?? new WorkerSettings();
                }
                catch (JsonException e)
                {
                    throw new InvalidDataException("Worker settings file '" + path + "' is not valid JSON: " + e.Message, e);
                }
            }
            else
            {
                settings = new WorkerSettings();
                try
                {
                    File.WriteAllText(path, JsonSerializer.Serialize(settings, Serializer.FileOptions));
                }
                catch (Exception e) when (e is UnauthorizedAccessException || e is IOException)
                {
                }
            }
            settings.SourceFile = path;
            return settings;
        }

        /// <summary>
        /// Apply GARRISON_WORKER_* environment overrides.
        /// </summary>
        public void ApplyEnvironment()
        {
            string? value = Env("GARRISON_WORKER_SERVER_URL");
            if (value != null) ServerUrl = value;
            value = Env("GARRISON_WORKER_NODE_NAME");
            if (value != null) NodeName = value;
            value = Env("GARRISON_WORKER_ACCESS_KEY");
            if (value != null) AccessKey = value;
            value = Env("GARRISON_WORKER_SECRET_KEY");
            if (value != null) SecretKey = value;
            value = Env("GARRISON_WORKER_MAX_CONCURRENT_RUNS");
            if (value != null && Int32.TryParse(value, out int max)) MaxConcurrentRuns = max;
            value = Env("GARRISON_WORKER_WORK_ROOT");
            if (value != null) WorkRoot = value;
            value = Env("GARRISON_WORKER_HEALTH_PORT");
            if (value != null && Int32.TryParse(value, out int port)) HealthPort = port;
            value = Env("GARRISON_WORKER_NODE_POOL");
            if (value != null) NodePool = value;
            value = Env("GARRISON_WORKER_TELEMETRY_ENABLE");
            if (value != null && Boolean.TryParse(value, out bool telemetryEnabled)) Telemetry.Enabled = telemetryEnabled;
            value = Env("GARRISON_WORKER_PROMETHEUS_PORT");
            if (value != null && Int32.TryParse(value, out int prometheusPort)) Telemetry.PrometheusPort = prometheusPort;
            value = Env("GARRISON_WORKER_OTLP_ENABLE");
            if (value != null && Boolean.TryParse(value, out bool otlpEnabled)) Telemetry.OtlpEnable = otlpEnabled;
            value = Env("GARRISON_WORKER_OTLP_ENDPOINT");
            if (value != null) Telemetry.OtlpEndpoint = value;
            value = Env("GARRISON_WORKER_LABELS");
            if (value != null)
            {
                foreach (string pair in value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    int index = pair.IndexOf('=');
                    if (index <= 0) continue;
                    Labels[pair.Substring(0, index).Trim()] = pair.Substring(index + 1).Trim();
                }
            }
        }

        /// <summary>
        /// Default harness probes.
        /// </summary>
        /// <returns>Probes.</returns>
        public static List<HarnessProbeSettings> DefaultProbes()
        {
            return new List<HarnessProbeSettings>
            {
                Probe(HarnessTypeEnum.ClaudeCode, "claude", "claude"),
                Probe(HarnessTypeEnum.Codex, "codex", "codex"),
                Probe(HarnessTypeEnum.Mux, "mux", "mux"),
                Probe(HarnessTypeEnum.GeminiCli, "gemini", "gemini"),
                Probe(HarnessTypeEnum.Generic, "garrison-fake-harness", "fake")
            };
        }

        #endregion

        #region Private-Methods

        private static TelemetrySettings DefaultTelemetry()
        {
            TelemetrySettings telemetry = new TelemetrySettings();
            telemetry.ServiceName = "garrison-worker";
            telemetry.PrometheusPort = 9465;
            return telemetry;
        }

        private static string? Env(string name)
        {
            string? value = Environment.GetEnvironmentVariable(name);
            return String.IsNullOrEmpty(value) ? null : value;
        }

        private static HarnessProbeSettings Probe(HarnessTypeEnum type, string executable, string label)
        {
            HarnessProbeSettings probe = new HarnessProbeSettings();
            probe.HarnessType = type;
            probe.Executable = executable;
            probe.Label = label;
            return probe;
        }

        #endregion
    }
}
