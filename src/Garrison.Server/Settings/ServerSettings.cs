namespace Garrison.Server.Settings
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;
    using Garrison.Core.Settings;
    using Garrison.Server.Backplane;

    /// <summary>
    /// Control-plane node settings loaded from the settings file and overridden by environment variables.
    /// These are node-local bootstrap settings; cluster runtime settings live in the database (D-014).
    /// </summary>
    public class ServerSettings
    {
        #region Public-Members

        /// <summary>
        /// Creation timestamp of the settings file (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Node identifier. Null derives it from HOSTNAME. Override with GARRISON_NODE_ID.
        /// </summary>
        public string? NodeId { get; set; } = null;

        /// <summary>
        /// REST settings.
        /// </summary>
        public RestSettings Rest { get; set; } = new RestSettings();

        /// <summary>
        /// MCP settings.
        /// </summary>
        public McpSettings Mcp { get; set; } = new McpSettings();

        /// <summary>
        /// Database settings.
        /// </summary>
        public DatabaseSettings Database { get; set; } = new DatabaseSettings();

        /// <summary>
        /// Logging settings.
        /// </summary>
        public LoggingSettings Logging { get; set; } = new LoggingSettings();

        /// <summary>
        /// Authentication settings.
        /// </summary>
        public AuthSettings Auth { get; set; } = new AuthSettings();

        /// <summary>
        /// Security settings.
        /// </summary>
        public SecuritySettings Security { get; set; } = new SecuritySettings();

        /// <summary>
        /// Request history settings.
        /// </summary>
        public RequestHistorySettings RequestHistory { get; set; } = new RequestHistorySettings();

        /// <summary>
        /// Telemetry settings.
        /// </summary>
        public TelemetrySettings Telemetry { get; set; } = new TelemetrySettings();

        /// <summary>
        /// Cluster topology settings.
        /// </summary>
        public ClusterSettingsBootstrap Cluster { get; set; } = new ClusterSettingsBootstrap();

        /// <summary>
        /// Archival of runs and events removed by retention.
        /// </summary>
        public ArchiveSettings Archive { get; set; } = new ArchiveSettings();

        /// <summary>Coordination backend, defaulting to database leases without an external dependency.</summary>
        public LeaseSettings Leases
        {
            get { return _Leases; }
            set { _Leases = value ?? new LeaseSettings(); }
        }

        /// <summary>Node-local artifact storage and collection configuration.</summary>
        public ArtifactSettings Artifacts
        {
            get { return _Artifacts; }
            set { _Artifacts = value ?? new ArtifactSettings(); }
        }

        /// <summary>
        /// Control-plane refresh of ChatGPT logins stored in CodexAuthJson secrets (G-22).
        /// </summary>
        public CodexSettings Codex
        {
            get
            {
                return _Codex;
            }
            set
            {
                _Codex = value ?? new CodexSettings();
            }
        }

        /// <summary>
        /// Path the settings were loaded from.
        /// </summary>
        [JsonIgnore]
        public string? SourceFile { get; set; } = null;

        /// <summary>
        /// Dotted setting paths whose values came from environment variables (read-only in the Settings page).
        /// </summary>
        [JsonIgnore]
        public HashSet<string> EnvironmentOverrides { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Effective node identifier.
        /// </summary>
        [JsonIgnore]
        public string EffectiveNodeId
        {
            get
            {
                if (!String.IsNullOrEmpty(NodeId)) return NodeId;
                string? host = Environment.GetEnvironmentVariable("HOSTNAME");
                return String.IsNullOrEmpty(host) ? Environment.MachineName : host;
            }
        }

        #endregion

        #region Private-Members

        private LeaseSettings _Leases = new LeaseSettings();
        private ArtifactSettings _Artifacts = new ArtifactSettings();

        private CodexSettings _Codex = new CodexSettings();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Load settings from a file, writing defaults when the file is missing.
        /// </summary>
        /// <param name="path">Settings file path.</param>
        /// <returns>Settings.</returns>
        /// <exception cref="ArgumentNullException">Thrown when path is null or empty.</exception>
        /// <exception cref="InvalidDataException">Thrown when the file is not valid JSON.</exception>
        public static ServerSettings FromFile(string path)
        {
            if (String.IsNullOrEmpty(path)) throw new ArgumentNullException(nameof(path));

            ServerSettings settings;
            if (File.Exists(path))
            {
                try
                {
                    settings = JsonSerializer.Deserialize<ServerSettings>(File.ReadAllText(path), Serializer.FileOptions) ?? new ServerSettings();
                }
                catch (JsonException e)
                {
                    throw new InvalidDataException("Settings file '" + path + "' is not valid JSON: " + e.Message, e);
                }
            }
            else
            {
                settings = new ServerSettings();
            }

            settings.SourceFile = path;
            return settings;
        }

        /// <summary>
        /// Write settings to a file. Values that came from environment variables are written from the file's view, not the environment.
        /// </summary>
        /// <param name="path">Settings file path.</param>
        /// <exception cref="ArgumentNullException">Thrown when path is null or empty.</exception>
        public void ToFile(string path)
        {
            if (String.IsNullOrEmpty(path)) throw new ArgumentNullException(nameof(path));
            string? directory = Path.GetDirectoryName(Path.GetFullPath(path));
            if (!String.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
            File.WriteAllText(path, JsonSerializer.Serialize(this, Serializer.FileOptions));
        }

        /// <summary>
        /// Apply environment variable overrides and record which settings they replaced.
        /// </summary>
        public void ApplyEnvironment()
        {
            Str("GARRISON_NODE_ID", "NodeId", v => NodeId = v);
            Str("GARRISON_LEASE_PROVIDER", "Leases.Provider", v => Leases.Provider = System.Enum.Parse<LeaseProviderKindEnum>(v, true));
            Str("GARRISON_CLUTCH_ENDPOINT", "Leases.ClutchEndpoint", v => Leases.ClutchEndpoint = v);
            Str("GARRISON_CLUTCH_ACCESS_KEY", "Leases.ClutchAccessKey", v => Leases.ClutchAccessKey = v);
            Str("GARRISON_CLUTCH_KEY_PREFIX", "Leases.KeyPrefix", v => Leases.KeyPrefix = v);
            Int("GARRISON_CLUTCH_REQUEST_TIMEOUT_MS", "Leases.RequestTimeoutMs", v => Leases.RequestTimeoutMs = v);
            Int("GARRISON_CLUTCH_SWEEP_INTERVAL_MS", "Leases.SweepIntervalMs", v => Leases.SweepIntervalMs = v);
            Int("GARRISON_CLUTCH_MAX_LEASE_MS", "Leases.MaxLeaseMs", v => Leases.MaxLeaseMs = v);
            Int("GARRISON_CLUTCH_MAX_HOLD_MS", "Leases.MaxHoldMs", v => Leases.MaxHoldMs = v);
            Enum("GARRISON_DB_TYPE", "Database.Type", v => Database.Type = v);
            Str("GARRISON_DB_FILENAME", "Database.Filename", v => Database.Filename = v);
            Str("GARRISON_DB_HOST", "Database.Host", v => Database.Host = v);
            Int("GARRISON_DB_PORT", "Database.Port", v => Database.Port = v);
            Str("GARRISON_DB_DATABASE", "Database.DatabaseName", v => Database.DatabaseName = v);
            Str("GARRISON_DB_USERNAME", "Database.Username", v => Database.Username = v);
            Str("GARRISON_DB_PASSWORD", "Database.Password", v => Database.Password = v);
            Str("GARRISON_DB_SCHEMA", "Database.Schema", v => Database.Schema = v);
            Int("GARRISON_DB_MAX_POOL_SIZE", "Database.MaxPoolSize", v => Database.MaxPoolSize = v);
            Int("GARRISON_DB_MIN_POOL_SIZE", "Database.MinPoolSize", v => Database.MinPoolSize = v);
            Int("GARRISON_DB_CONNECTION_TIMEOUT", "Database.ConnectionTimeoutSeconds", v => Database.ConnectionTimeoutSeconds = v);
            Int("GARRISON_DB_COMMAND_TIMEOUT", "Database.CommandTimeoutSeconds", v => Database.CommandTimeoutSeconds = v);
            Str("GARRISON_AUTH_SIGNING_KEY", "Auth.SigningKey", v => Auth.SigningKey = v);
            Str("GARRISON_ADMIN_API_KEY", "Auth.AdminApiKey", v => Auth.AdminApiKey = v);
            Str("GARRISON_MASTER_KEY", "Security.MasterKey", v => Security.MasterKey = v);
            Str("GARRISON_ADMIN_EMAIL", "Security.AdminEmail", v => Security.AdminEmail = v);
            Str("GARRISON_ADMIN_PASSWORD", "Security.AdminPassword", v => Security.AdminPassword = v);
            Str("GARRISON_DEFAULT_ACCESS_KEY", "Security.DefaultAccessKey", v => Security.DefaultAccessKey = v);
            Str("GARRISON_DEFAULT_SECRET_KEY", "Security.DefaultSecretKey", v => Security.DefaultSecretKey = v);
            Str("GARRISON_NODE_ACCESS_KEY", "Security.NodeAccessKey", v => Security.NodeAccessKey = v);
            Str("GARRISON_NODE_SECRET_KEY", "Security.NodeSecretKey", v => Security.NodeSecretKey = v);
            Bool("GARRISON_ALLOW_INSECURE_DEFAULTS", "Security.AllowInsecureDefaults", v => Security.AllowInsecureDefaults = v);
            Int("GARRISON_REST_PORT", "Rest.Port", v => Rest.Port = v);
            Int("GARRISON_LIVENESS_PORT", "Rest.LivenessPort", v => Rest.LivenessPort = v);
            Int("GARRISON_REST_MAX_REQUEST_BODY_BYTES", "Rest.MaxRequestBodyBytes", v => Rest.MaxRequestBodyBytes = v);
            Str("GARRISON_PUBLIC_BASE_URL", "Rest.PublicBaseUrl", v => Rest.PublicBaseUrl = v);
            Str("GARRISON_EXTERNAL_BASE_URL", "Rest.ExternalBaseUrl", v => Rest.ExternalBaseUrl = v);
            Int("GARRISON_MCP_PORT", "Mcp.Port", v => Mcp.Port = v);
            Str("GARRISON_MCP_PUBLIC_URL", "Mcp.PublicUrl", v => Mcp.PublicUrl = v);
            Int("GARRISON_EXPECTED_REPLICAS", "Cluster.ExpectedReplicas", v => Cluster.ExpectedReplicas = v);
            Backplane("GARRISON_BACKPLANE", "Cluster.Backplane", v => Cluster.Backplane = v);
            Str("GARRISON_ARTIFACT_ROOT_DIRECTORY", "Artifacts.RootDirectory", v => Artifacts.RootDirectory = v);
            Int("GARRISON_ARTIFACT_MAX_FILE_BYTES", "Artifacts.MaxFileBytes", v => Artifacts.MaxFileBytes = v);
            Int("GARRISON_ARTIFACT_MAX_TOTAL_BYTES", "Artifacts.MaxTotalBytes", v => Artifacts.MaxTotalBytes = v);
            Int("GARRISON_ARTIFACT_MAX_FILES", "Artifacts.MaxFiles", v => Artifacts.MaxFiles = v);
            Int("GARRISON_ARTIFACT_MAX_SCAN_ENTRIES", "Artifacts.MaxScanEntries", v => Artifacts.MaxScanEntries = v);
            Int("GARRISON_ARTIFACT_COLLECTION_TIMEOUT_SECONDS", "Artifacts.CollectionTimeoutSeconds", v => Artifacts.CollectionTimeoutSeconds = v);
            Int("GARRISON_ARTIFACT_DOWNLOAD_LIFETIME_SECONDS", "Artifacts.DownloadLifetimeSeconds", v => Artifacts.DownloadLifetimeSeconds = v);
            Bool("GARRISON_ARTIFACT_ALLOW_AMBIENT_CUSTOM_ENDPOINT", "Artifacts.AllowAmbientCredentialsWithCustomEndpoint", v => Artifacts.AllowAmbientCredentialsWithCustomEndpoint = v);
            Str("GARRISON_ARCHIVE_DIRECTORY", "Archive.Directory", v => Archive.Directory = v);
            Str("GARRISON_CODEX_TOKEN_ENDPOINT", "Codex.TokenEndpoint", v => Codex.TokenEndpoint = v);
            Str("GARRISON_CODEX_CLIENT_ID", "Codex.ClientId", v => Codex.ClientId = v);
            Int("GARRISON_CODEX_REFRESH_BEFORE_EXPIRY_SECONDS", "Codex.RefreshBeforeExpirySeconds", v => Codex.RefreshBeforeExpirySeconds = v);
            Bool("GARRISON_SETTINGS_READONLY", "Cluster.SettingsFileReadOnly", v => Cluster.SettingsFileReadOnly = v);
            Bool("GARRISON_TELEMETRY_ENABLE", "Telemetry.Enabled", v => Telemetry.Enabled = v);
            Str("GARRISON_PROMETHEUS_HOSTNAME", "Telemetry.PrometheusHostname", v => Telemetry.PrometheusHostname = v);
            Bool("GARRISON_OTLP_ENABLE", "Telemetry.OtlpEnable", v => Telemetry.OtlpEnable = v);
            Str("GARRISON_OTLP_ENDPOINT", "Telemetry.OtlpEndpoint", v => Telemetry.OtlpEndpoint = v);
            Int("GARRISON_TELEMETRY_MAX_LABEL_VALUES", "Telemetry.MaxLabelValues", v => Telemetry.MaxLabelValues = v);
        }

        /// <summary>
        /// Validate the settings for startup.
        /// </summary>
        /// <exception cref="InvalidOperationException">Thrown when the configuration cannot run safely.</exception>
        public void Validate()
        {
            Database.Validate();
            if (Database.Type == DatabaseTypeEnum.Sqlite && Cluster.ExpectedReplicas > 1)
            {
                throw new InvalidOperationException("Sqlite supports a single control-plane replica. Set Database.Type to Postgresql when Cluster.ExpectedReplicas is greater than 1.");
            }
            if (Rest.Port == Mcp.Port && Mcp.Enable)
            {
                throw new InvalidOperationException("Rest.Port and Mcp.Port must differ (Voltaic hosts MCP on its own listener).");
            }
            if (Rest.LivenessPort != 0 && (Rest.LivenessPort == Rest.Port || (Mcp.Enable && Rest.LivenessPort == Mcp.Port)))
            {
                throw new InvalidOperationException("Rest.LivenessPort must differ from Rest.Port and Mcp.Port, or be 0 to turn the liveness listener off.");
            }
            if (Mcp.Enable && Mcp.InternalPort != 0 && (Mcp.InternalPort == Mcp.Port || Mcp.InternalPort == Rest.Port))
            {
                throw new InvalidOperationException("Mcp.InternalPort must differ from Mcp.Port and Rest.Port, or be 0 to pick a free port.");
            }
            if (Database.Type == DatabaseTypeEnum.Sqlite && Cluster.Backplane == BackplaneModeEnum.PostgresNotify)
            {
                throw new InvalidOperationException("Cluster.Backplane PostgresNotify requires Postgresql. Use Auto, Local, or Polling with Sqlite.");
            }
            List<string> insecure = InsecureDefaults();
            if (insecure.Count > 0 && !Security.AllowInsecureDefaults)
            {
                throw new InvalidOperationException("Refusing to start: " + String.Join(", ", insecure) + (insecure.Count == 1 ? " is" : " are") + " empty or set to the public built-in default, which gives anyone administrator access. Set real values (Docker Compose and Kubernetes generate them), or set GARRISON_ALLOW_INSECURE_DEFAULTS=true for local development only.");
            }
        }

        /// <summary>
        /// The keys and credentials that are empty or equal to their public built-in defaults, each named with its setting
        /// path and environment variable. With <see cref="SecuritySettings.AllowInsecureDefaults"/> false, startup refuses
        /// when this list is not empty.
        /// </summary>
        /// <returns>Setting descriptions, empty when every value is set.</returns>
        public List<string> InsecureDefaults()
        {
            SecuritySettings securityDefaults = new SecuritySettings();
            AuthSettings authDefaults = new AuthSettings();
            List<string> found = new List<string>();
            AddIfDefault(found, Security.MasterKey, securityDefaults.MasterKey, "Security.MasterKey (GARRISON_MASTER_KEY)");
            AddIfDefault(found, Auth.SigningKey, authDefaults.SigningKey, "Auth.SigningKey (GARRISON_AUTH_SIGNING_KEY)");
            AddIfDefault(found, Auth.AdminApiKey, authDefaults.AdminApiKey, "Auth.AdminApiKey (GARRISON_ADMIN_API_KEY)");
            AddIfDefault(found, Security.AdminPassword, securityDefaults.AdminPassword, "Security.AdminPassword (GARRISON_ADMIN_PASSWORD)");
            AddIfDefault(found, Security.DefaultSecretKey, securityDefaults.DefaultSecretKey, "Security.DefaultSecretKey (GARRISON_DEFAULT_SECRET_KEY)");
            AddIfDefault(found, Security.NodeSecretKey, securityDefaults.NodeSecretKey, "Security.NodeSecretKey (GARRISON_NODE_SECRET_KEY)");
            return found;
        }

        #endregion

        #region Private-Methods

        private static void AddIfDefault(List<string> found, string? value, string builtIn, string description)
        {
            if (String.IsNullOrWhiteSpace(value) || String.Equals(value, builtIn, StringComparison.Ordinal)) found.Add(description);
        }

        private void Str(string variable, string path, Action<string> apply)
        {
            string? value = Environment.GetEnvironmentVariable(variable);
            if (String.IsNullOrEmpty(value)) return;
            apply(value);
            EnvironmentOverrides.Add(path);
        }

        private void Int(string variable, string path, Action<int> apply)
        {
            string? value = Environment.GetEnvironmentVariable(variable);
            if (String.IsNullOrEmpty(value) || !Int32.TryParse(value, out int parsed)) return;
            apply(parsed);
            EnvironmentOverrides.Add(path);
        }

        private void Bool(string variable, string path, Action<bool> apply)
        {
            string? value = Environment.GetEnvironmentVariable(variable);
            if (String.IsNullOrEmpty(value) || !Boolean.TryParse(value, out bool parsed)) return;
            apply(parsed);
            EnvironmentOverrides.Add(path);
        }

        private void Backplane(string variable, string path, Action<BackplaneModeEnum> apply)
        {
            string? value = Environment.GetEnvironmentVariable(variable);
            if (String.IsNullOrEmpty(value) || !System.Enum.TryParse<BackplaneModeEnum>(value, true, out BackplaneModeEnum parsed)) return;
            apply(parsed);
            EnvironmentOverrides.Add(path);
        }

        private void Enum(string variable, string path, Action<DatabaseTypeEnum> apply)
        {
            string? value = Environment.GetEnvironmentVariable(variable);
            if (String.IsNullOrEmpty(value) || !System.Enum.TryParse<DatabaseTypeEnum>(value, true, out DatabaseTypeEnum parsed)) return;
            apply(parsed);
            EnvironmentOverrides.Add(path);
        }

        #endregion
    }
}
