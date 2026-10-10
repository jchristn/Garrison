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
            Enum("GARRISON_DB_TYPE", "Database.Type", v => Database.Type = v);
            Str("GARRISON_DB_FILENAME", "Database.Filename", v => Database.Filename = v);
            Str("GARRISON_DB_HOST", "Database.Host", v => Database.Host = v);
            Int("GARRISON_DB_PORT", "Database.Port", v => Database.Port = v);
            Str("GARRISON_DB_DATABASE", "Database.DatabaseName", v => Database.DatabaseName = v);
            Str("GARRISON_DB_USERNAME", "Database.Username", v => Database.Username = v);
            Str("GARRISON_DB_PASSWORD", "Database.Password", v => Database.Password = v);
            Str("GARRISON_DB_SCHEMA", "Database.Schema", v => Database.Schema = v);
            Str("GARRISON_AUTH_SIGNING_KEY", "Auth.SigningKey", v => Auth.SigningKey = v);
            Str("GARRISON_ADMIN_API_KEY", "Auth.AdminApiKey", v => Auth.AdminApiKey = v);
            Str("GARRISON_MASTER_KEY", "Security.MasterKey", v => Security.MasterKey = v);
            Str("GARRISON_ADMIN_PASSWORD", "Security.AdminPassword", v => Security.AdminPassword = v);
            Str("GARRISON_DEFAULT_ACCESS_KEY", "Security.DefaultAccessKey", v => Security.DefaultAccessKey = v);
            Str("GARRISON_DEFAULT_SECRET_KEY", "Security.DefaultSecretKey", v => Security.DefaultSecretKey = v);
            Str("GARRISON_NODE_ACCESS_KEY", "Security.NodeAccessKey", v => Security.NodeAccessKey = v);
            Str("GARRISON_NODE_SECRET_KEY", "Security.NodeSecretKey", v => Security.NodeSecretKey = v);
            Int("GARRISON_REST_PORT", "Rest.Port", v => Rest.Port = v);
            Str("GARRISON_PUBLIC_BASE_URL", "Rest.PublicBaseUrl", v => Rest.PublicBaseUrl = v);
            Int("GARRISON_MCP_PORT", "Mcp.Port", v => Mcp.Port = v);
            Str("GARRISON_MCP_PUBLIC_URL", "Mcp.PublicUrl", v => Mcp.PublicUrl = v);
            Int("GARRISON_EXPECTED_REPLICAS", "Cluster.ExpectedReplicas", v => Cluster.ExpectedReplicas = v);
            Bool("GARRISON_SETTINGS_READONLY", "Cluster.SettingsFileReadOnly", v => Cluster.SettingsFileReadOnly = v);
            Bool("GARRISON_TELEMETRY_ENABLE", "Telemetry.Enabled", v => Telemetry.Enabled = v);
            Bool("GARRISON_OTLP_ENABLE", "Telemetry.OtlpEnable", v => Telemetry.OtlpEnable = v);
            Str("GARRISON_OTLP_ENDPOINT", "Telemetry.OtlpEndpoint", v => Telemetry.OtlpEndpoint = v);
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
        }

        #endregion

        #region Private-Methods

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
