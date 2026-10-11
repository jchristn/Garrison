namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Server.Backplane;
    using Garrison.Server.Settings;
    using SyslogLogging;

    /// <summary>
    /// Settings API backend (plan D-014). Settings-file fields are read from the live settings, validated, written to
    /// the settings file (never writing environment-overridden values), and applied live when safe. Cluster runtime
    /// fields are stored through <see cref="ClusterSettingsService"/>. Thread-safe for concurrent reads; updates are
    /// serialized.
    /// </summary>
    public class SettingsService : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Mask returned in place of secret values; submitting it leaves the secret unchanged.
        /// </summary>
        public static readonly string SecretMask = "********";

        /// <summary>
        /// Whether a restart-required change has been saved since this process started.
        /// </summary>
        public bool RestartPending
        {
            get
            {
                return _RestartPending;
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerSettings _Settings;
        private readonly ClusterSettingsService _Cluster;
        private readonly LoggingModule _Logging;
        private readonly List<FileSettingDescriptor> _Fields;
        private readonly SemaphoreSlim _UpdateLock = new SemaphoreSlim(1, 1);
        private bool _RestartPending = false;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="settings">Live settings.</param>
        /// <param name="cluster">Cluster settings service.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public SettingsService(ServerSettings settings, ClusterSettingsService cluster, LoggingModule logging)
        {
            _Settings = settings ?? throw new ArgumentNullException(nameof(settings));
            _Cluster = cluster ?? throw new ArgumentNullException(nameof(cluster));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            _Fields = BuildFields();
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether the settings file can be written.
        /// </summary>
        /// <returns>True when writable.</returns>
        public bool FileWritable()
        {
            return !_Settings.Cluster.SettingsFileReadOnly && !String.IsNullOrEmpty(_Settings.SourceFile);
        }

        /// <summary>
        /// Build the settings view.
        /// </summary>
        /// <returns>View.</returns>
        public SettingsView View()
        {
            SettingsView view = new SettingsView();
            view.SettingsFile = _Settings.SourceFile;
            view.SettingsFileWritable = FileWritable();
            view.RestartPending = _RestartPending;

            foreach (FileSettingDescriptor field in _Fields)
            {
                SettingField f = new SettingField();
                f.Path = field.Path;
                f.Group = field.Path.Split('.')[0];
                f.Description = field.Description;
                f.Type = field.Type;
                f.IsSecret = field.IsSecret;
                string? value = field.Get(_Settings);
                if (field.IsSecret)
                {
                    f.IsSet = !String.IsNullOrEmpty(value);
                    f.Value = f.IsSet ? SecretMask : null;
                }
                else
                {
                    f.Value = value;
                    f.IsSet = value != null;
                }
                if (_Settings.EnvironmentOverrides.Contains(field.Path)) f.Source = "Environment";
                else if (!FileWritable()) f.Source = "ConfigMap";
                else f.Source = "File";
                f.Editable = f.Source == "File";
                f.ApplyMode = field.Live ? "Live" : "RestartRequired";
                f.Minimum = field.Minimum;
                f.Maximum = field.Maximum;
                f.AllowedValues = field.AllowedValues;
                view.Fields.Add(f);
            }

            foreach (ClusterSettingDefinition definition in _Cluster.Definitions)
            {
                SettingField f = new SettingField();
                f.Path = definition.Key;
                f.Group = definition.Key.Split('.')[0];
                f.Description = definition.Description;
                f.Type = definition.Type;
                f.Value = _Cluster.GetString(definition.Key);
                f.IsSet = definition.Type != "string" || !String.IsNullOrEmpty(f.Value);
                f.Source = _Cluster.IsOverridden(definition.Key) ? "Environment" : "Database";
                f.ApplyMode = "Live";
                f.Editable = f.Source == "Database";
                if (definition.Type == "int")
                {
                    f.Minimum = definition.Minimum;
                    f.Maximum = definition.Maximum;
                }
                view.Fields.Add(f);
            }

            return view;
        }

        /// <summary>
        /// Validate and apply an update.
        /// </summary>
        /// <param name="request">Update request.</param>
        /// <param name="principal">Principal making the change.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Save result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="ValidationException">Thrown with per-field errors when any value is invalid.</exception>
        public async Task<SettingsSaveResponse> UpdateAsync(SettingsUpdateRequest request, string? principal, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));

            await _UpdateLock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                Dictionary<string, string> errors = new Dictionary<string, string>();
                Dictionary<string, string> codes = new Dictionary<string, string>();
                List<FileSettingDescriptor> fileChanges = new List<FileSettingDescriptor>();
                List<SettingValue> fileValues = new List<SettingValue>();
                List<SettingValue> clusterValues = new List<SettingValue>();

                foreach (SettingValue item in request.Values)
                {
                    if (item == null || String.IsNullOrWhiteSpace(item.Path))
                    {
                        errors["values"] = "Every value needs a setting path.";
                        codes["values"] = "PathRequired";
                        continue;
                    }
                    FileSettingDescriptor? field = _Fields.FirstOrDefault(f => String.Equals(f.Path, item.Path, StringComparison.OrdinalIgnoreCase));
                    if (field != null)
                    {
                        if (field.IsSecret && (String.IsNullOrEmpty(item.Value) || item.Value == SecretMask)) continue;
                        if (_Settings.EnvironmentOverrides.Contains(field.Path))
                        {
                            errors[item.Path] = "Overridden by an environment variable; change the environment instead.";
                            codes[item.Path] = "OverriddenByEnvironment";
                            continue;
                        }
                        if (!FileWritable())
                        {
                            errors[item.Path] = "The settings file is managed externally (for example a ConfigMap) and is read-only.";
                            codes[item.Path] = "SettingsFileReadOnly";
                            continue;
                        }
                        string? error = Validate(field, item.Value, out string code);
                        if (error != null)
                        {
                            errors[item.Path] = error;
                            codes[item.Path] = code;
                        }
                        else
                        {
                            fileChanges.Add(field);
                            fileValues.Add(item);
                        }
                        continue;
                    }

                    if (_Cluster.Find(item.Path) != null)
                    {
                        if (_Cluster.IsOverridden(item.Path))
                        {
                            errors[item.Path] = "Overridden by an environment variable; change the environment instead.";
                            codes[item.Path] = "OverriddenByEnvironment";
                        }
                        else if (_Cluster.Normalize(item.Path, item.Value, out string? clusterError, out string clusterCode) == null)
                        {
                            errors[item.Path] = clusterError ?? "Invalid value.";
                            codes[item.Path] = clusterCode;
                        }
                        else clusterValues.Add(item);
                        continue;
                    }

                    errors[item.Path] = "Unknown setting.";
                    codes[item.Path] = "UnknownSetting";
                }

                // Nothing is saved, and nothing is clamped, when any value is invalid.
                if (errors.Count > 0) throw new ValidationException("One or more settings are invalid. Nothing was saved.", errors, codes);

                SettingsSaveResponse response = new SettingsSaveResponse();

                if (fileChanges.Count > 0)
                {
                    ServerSettings fileCopy = File.Exists(_Settings.SourceFile!) ? ServerSettings.FromFile(_Settings.SourceFile!) : new ServerSettings();
                    for (int i = 0; i < fileChanges.Count; i++) fileChanges[i].Set(fileCopy, fileValues[i].Value);
                    fileCopy.ToFile(_Settings.SourceFile!);

                    for (int i = 0; i < fileChanges.Count; i++)
                    {
                        if (fileChanges[i].Live)
                        {
                            fileChanges[i].Set(_Settings, fileValues[i].Value);
                            response.AppliedLive.Add(fileChanges[i].Path);
                            if (fileChanges[i].Path == "Logging.MinimumSeverity") _Logging.Settings.MinimumSeverity = (Severity)_Settings.Logging.MinimumSeverity;
                        }
                        else
                        {
                            response.PendingRestart.Add(fileChanges[i].Path);
                            _RestartPending = true;
                        }
                    }
                }

                foreach (SettingValue item in clusterValues)
                {
                    await _Cluster.SetAsync(item.Path, item.Value, principal, token).ConfigureAwait(false);
                    response.AppliedLive.Add(item.Path);
                }

                _Logging.Info("[Settings] " + (principal ?? "unknown") + " changed " + String.Join(", ", response.AppliedLive.Concat(response.PendingRestart)));
                response.Saved = true;
                response.RestartRequired = response.PendingRestart.Count > 0;
                response.Settings = View();
                return response;
            }
            finally
            {
                _UpdateLock.Release();
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
            if (disposing) _UpdateLock.Dispose();
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private static string? Validate(FileSettingDescriptor field, string? value, out string code)
        {
            code = String.Empty;
            switch (field.Type)
            {
                case "int":
                    if (!Int64.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out long n))
                    {
                        code = "NotAnInteger";
                        return "Must be an integer.";
                    }
                    if ((field.Minimum.HasValue && n < field.Minimum.Value) || (field.Maximum.HasValue && n > field.Maximum.Value))
                    {
                        code = "OutOfRange";
                        return RangeMessage(field.Minimum, field.Maximum);
                    }
                    return null;
                case "bool":
                    if (Boolean.TryParse(value, out bool _)) return null;
                    code = "NotABoolean";
                    return "Must be true or false.";
                case "enum":
                    if (field.AllowedValues != null && field.AllowedValues.Any(a => String.Equals(a, value, StringComparison.OrdinalIgnoreCase))) return null;
                    code = "NotAllowedValue";
                    return "Must be one of " + String.Join(", ", field.AllowedValues ?? new List<string>()) + ".";
                default:
                    if (value == null || value.Length <= 4096) return null;
                    code = "TooLong";
                    return "Must be at most 4096 characters.";
            }
        }

        private static string RangeMessage(long? minimum, long? maximum)
        {
            if (minimum.HasValue && maximum.HasValue) return "Must be between " + minimum.Value + " and " + maximum.Value + ".";
            if (minimum.HasValue) return "Must be at least " + minimum.Value + ".";
            return "Must be at most " + maximum!.Value + ".";
        }

        private static int ParseInt(string? value)
        {
            return Int32.Parse(value ?? "0", NumberStyles.Integer, CultureInfo.InvariantCulture);
        }

        private static bool ParseBool(string? value)
        {
            return Boolean.Parse(value ?? "false");
        }

        private static string Bool(bool value)
        {
            return value ? "true" : "false";
        }

        private static string? Empty(string? value)
        {
            return String.IsNullOrWhiteSpace(value) ? null : value;
        }

        private static FileSettingDescriptor Field(string path, string type, bool live, string description, Func<ServerSettings, string?> get, Action<ServerSettings, string?> set, long? min, long? max, List<string>? allowed)
        {
            FileSettingDescriptor d = new FileSettingDescriptor();
            d.Path = path;
            d.Type = type;
            d.IsSecret = type == "secret";
            d.Live = live;
            d.Description = description;
            d.Get = get;
            d.Set = set;
            d.Minimum = min;
            d.Maximum = max;
            d.AllowedValues = allowed;
            return d;
        }

        private static List<FileSettingDescriptor> BuildFields()
        {
            List<FileSettingDescriptor> list = new List<FileSettingDescriptor>();
            list.Add(Field("Rest.Hostname", "string", false, "REST bind hostname (* for all interfaces).", s => s.Rest.Hostname, (s, v) => s.Rest.Hostname = v ?? "*", null, null, null));
            list.Add(Field("Rest.Port", "int", false, "REST port.", s => s.Rest.Port.ToString(CultureInfo.InvariantCulture), (s, v) => s.Rest.Port = ParseInt(v), 1L, 65535L, null));
            list.Add(Field("Rest.Ssl", "bool", false, "Whether TLS is enabled on the REST listener.", s => Bool(s.Rest.Ssl), (s, v) => s.Rest.Ssl = ParseBool(v), null, null, null));
            list.Add(Field("Rest.PublicBaseUrl", "string", false, "Internal REST base URL handed to runs for delegation (garrison.apiUrl), for example http://garrison-server:8700. Not shown in A2A cards. Empty derives it from the bind address.", s => s.Rest.PublicBaseUrl, (s, v) => s.Rest.PublicBaseUrl = Empty(v), null, null, null));
            list.Add(Field("Rest.ExternalBaseUrl", "string", true, "External REST base URL used in A2A agent cards and server info, for example https://garrison.example.com. Empty uses each request's scheme and Host header.", s => s.Rest.ExternalBaseUrl, (s, v) => s.Rest.ExternalBaseUrl = Empty(v), null, null, null));
            list.Add(Field("Mcp.Enable", "bool", false, "Whether the MCP server is enabled.", s => Bool(s.Mcp.Enable), (s, v) => s.Mcp.Enable = ParseBool(v), null, null, null));
            list.Add(Field("Mcp.Hostname", "string", false, "MCP bind hostname.", s => s.Mcp.Hostname, (s, v) => s.Mcp.Hostname = v ?? "*", null, null, null));
            list.Add(Field("Mcp.Port", "int", false, "MCP port.", s => s.Mcp.Port.ToString(CultureInfo.InvariantCulture), (s, v) => s.Mcp.Port = ParseInt(v), 1L, 65535L, null));
            list.Add(Field("Mcp.Path", "string", false, "MCP path.", s => s.Mcp.Path, (s, v) => s.Mcp.Path = v ?? "/mcp", null, null, null));
            list.Add(Field("Mcp.PublicUrl", "string", false, "Internal MCP base URL (no path) handed to harnesses on workers for delegation, for example http://garrison-server:8701.", s => s.Mcp.PublicUrl, (s, v) => s.Mcp.PublicUrl = Empty(v), null, null, null));
            list.Add(Field("Mcp.InternalPort", "int", false, "Loopback port of the internal MCP endpoint behind the public MCP port. 0 picks a free port at startup.", s => s.Mcp.InternalPort.ToString(CultureInfo.InvariantCulture), (s, v) => s.Mcp.InternalPort = ParseInt(v), 0L, 65535L, null));
            list.Add(Field("Mcp.SessionIdleTimeoutSeconds", "int", true, "Seconds an MCP session may stay idle before it expires on every replica.", s => s.Mcp.SessionIdleTimeoutSeconds.ToString(CultureInfo.InvariantCulture), (s, v) => s.Mcp.SessionIdleTimeoutSeconds = ParseInt(v), 60L, 604800L, null));
            list.Add(Field("Mcp.MaxToolWaitSeconds", "int", true, "Maximum seconds a synchronous invoke tool waits.", s => s.Mcp.MaxToolWaitSeconds.ToString(CultureInfo.InvariantCulture), (s, v) => s.Mcp.MaxToolWaitSeconds = ParseInt(v), 1L, 600L, null));
            list.Add(Field("Database.Type", "enum", false, "Database provider.", s => s.Database.Type.ToString(), (s, v) => s.Database.Type = Enum.Parse<DatabaseTypeEnum>(v ?? "Sqlite", true), null, null, new List<string>(Enum.GetNames(typeof(DatabaseTypeEnum)))));
            list.Add(Field("Database.Filename", "string", false, "Sqlite database file.", s => s.Database.Filename, (s, v) => s.Database.Filename = v ?? String.Empty, null, null, null));
            list.Add(Field("Database.Host", "string", false, "Postgresql host.", s => s.Database.Host, (s, v) => s.Database.Host = v ?? String.Empty, null, null, null));
            list.Add(Field("Database.Port", "int", false, "Postgresql port.", s => s.Database.Port.ToString(CultureInfo.InvariantCulture), (s, v) => s.Database.Port = ParseInt(v), 1L, 65535L, null));
            list.Add(Field("Database.DatabaseName", "string", false, "Database name.", s => s.Database.DatabaseName, (s, v) => s.Database.DatabaseName = v ?? String.Empty, null, null, null));
            list.Add(Field("Database.Username", "string", false, "Database username.", s => s.Database.Username, (s, v) => s.Database.Username = v ?? String.Empty, null, null, null));
            list.Add(Field("Database.Password", "secret", false, "Database password.", s => s.Database.Password, (s, v) => s.Database.Password = v, null, null, null));
            list.Add(Field("Database.Schema", "string", false, "Postgresql schema.", s => s.Database.Schema, (s, v) => s.Database.Schema = Empty(v), null, null, null));
            list.Add(Field("Database.MaxPoolSize", "int", false, "Maximum pooled connections per replica. Replicas times this must stay below the Postgresql max_connections.", s => s.Database.MaxPoolSize.ToString(CultureInfo.InvariantCulture), (s, v) => s.Database.MaxPoolSize = ParseInt(v), 1L, 1000L, null));
            list.Add(Field("Database.MinPoolSize", "int", false, "Connections each replica keeps open while idle (Postgresql).", s => s.Database.MinPoolSize.ToString(CultureInfo.InvariantCulture), (s, v) => s.Database.MinPoolSize = ParseInt(v), 0L, 1000L, null));
            list.Add(Field("Database.ConnectionTimeoutSeconds", "int", false, "Seconds to wait for a pooled connection before failing (Postgresql).", s => s.Database.ConnectionTimeoutSeconds.ToString(CultureInfo.InvariantCulture), (s, v) => s.Database.ConnectionTimeoutSeconds = ParseInt(v), 1L, 600L, null));
            list.Add(Field("Database.CommandTimeoutSeconds", "int", false, "Seconds one database command may run, 0 for no limit (Postgresql).", s => s.Database.CommandTimeoutSeconds.ToString(CultureInfo.InvariantCulture), (s, v) => s.Database.CommandTimeoutSeconds = ParseInt(v), 0L, 3600L, null));
            list.Add(Field("Database.ConnectionIdleLifetimeSeconds", "int", false, "Seconds an idle pooled connection is kept before it is closed (Postgresql).", s => s.Database.ConnectionIdleLifetimeSeconds.ToString(CultureInfo.InvariantCulture), (s, v) => s.Database.ConnectionIdleLifetimeSeconds = ParseInt(v), 1L, 3600L, null));
            list.Add(Field("Logging.ConsoleLogging", "bool", false, "Log to the console.", s => Bool(s.Logging.ConsoleLogging), (s, v) => s.Logging.ConsoleLogging = ParseBool(v), null, null, null));
            list.Add(Field("Logging.FileLogging", "bool", false, "Log to a file.", s => Bool(s.Logging.FileLogging), (s, v) => s.Logging.FileLogging = ParseBool(v), null, null, null));
            list.Add(Field("Logging.LogDirectory", "string", false, "Log directory.", s => s.Logging.LogDirectory, (s, v) => s.Logging.LogDirectory = v ?? "logs/", null, null, null));
            list.Add(Field("Logging.LogFilename", "string", false, "Log file name.", s => s.Logging.LogFilename, (s, v) => s.Logging.LogFilename = v ?? "garrison.log", null, null, null));
            list.Add(Field("Logging.MinimumSeverity", "int", true, "Minimum severity, 0 (debug) to 7 (emergency).", s => s.Logging.MinimumSeverity.ToString(CultureInfo.InvariantCulture), (s, v) => s.Logging.MinimumSeverity = ParseInt(v), 0L, 7L, null));
            list.Add(Field("Auth.Issuer", "string", false, "Token issuer.", s => s.Auth.Issuer, (s, v) => s.Auth.Issuer = v ?? "garrison", null, null, null));
            list.Add(Field("Auth.SigningKey", "secret", false, "Token signing key.", s => s.Auth.SigningKey, (s, v) => s.Auth.SigningKey = v ?? String.Empty, null, null, null));
            list.Add(Field("Auth.TokenLifetimeMinutes", "int", false, "Session token lifetime in minutes.", s => s.Auth.TokenLifetimeMinutes.ToString(CultureInfo.InvariantCulture), (s, v) => s.Auth.TokenLifetimeMinutes = ParseInt(v), 1L, 10080L, null));
            list.Add(Field("Auth.AdminApiKey", "secret", true, "System administrator API key.", s => s.Auth.AdminApiKey, (s, v) => s.Auth.AdminApiKey = v ?? String.Empty, null, null, null));
            list.Add(Field("Auth.SignedRequestSkewSeconds", "int", true, "Allowed clock skew for signed requests.", s => s.Auth.SignedRequestSkewSeconds.ToString(CultureInfo.InvariantCulture), (s, v) => s.Auth.SignedRequestSkewSeconds = ParseInt(v), 10L, 3600L, null));
            list.Add(Field("Auth.RateLimitPerMinute", "int", true, "Authentication attempts per source IP per minute, counted across all replicas.", s => s.Auth.RateLimitPerMinute.ToString(CultureInfo.InvariantCulture), (s, v) => s.Auth.RateLimitPerMinute = ParseInt(v), 1L, 100000L, null));
            list.Add(Field("Auth.PasswordHashIterations", "int", true, "PBKDF2-HMAC-SHA256 iterations for new password hashes; older hashes are upgraded at sign-in.", s => s.Auth.PasswordHashIterations.ToString(CultureInfo.InvariantCulture), (s, v) => s.Auth.PasswordHashIterations = ParseInt(v), 10000L, 10000000L, null));
            list.Add(Field("Security.MasterKey", "secret", false, "Master key for secret encryption.", s => s.Security.MasterKey, (s, v) => s.Security.MasterKey = v ?? String.Empty, null, null, null));
            list.Add(Field("Security.AdminEmail", "string", false, "Seeded administrator email (first boot only).", s => s.Security.AdminEmail, (s, v) => s.Security.AdminEmail = v ?? String.Empty, null, null, null));
            list.Add(Field("Security.AdminPassword", "secret", false, "Seeded administrator password (first boot only).", s => s.Security.AdminPassword, (s, v) => s.Security.AdminPassword = v ?? String.Empty, null, null, null));
            list.Add(Field("Security.DefaultAccessKey", "string", false, "Default administrator credential access key.", s => s.Security.DefaultAccessKey, (s, v) => s.Security.DefaultAccessKey = v ?? String.Empty, null, null, null));
            list.Add(Field("Security.DefaultSecretKey", "secret", false, "Default administrator credential secret key.", s => s.Security.DefaultSecretKey, (s, v) => s.Security.DefaultSecretKey = v ?? String.Empty, null, null, null));
            list.Add(Field("Security.NodeAccessKey", "string", false, "Worker node credential access key.", s => s.Security.NodeAccessKey, (s, v) => s.Security.NodeAccessKey = v ?? String.Empty, null, null, null));
            list.Add(Field("Security.NodeSecretKey", "secret", false, "Worker node credential secret key.", s => s.Security.NodeSecretKey, (s, v) => s.Security.NodeSecretKey = v ?? String.Empty, null, null, null));
            list.Add(Field("RequestHistory.MaxRequestBodyBytes", "int", true, "Maximum captured request body bytes.", s => s.RequestHistory.MaxRequestBodyBytes.ToString(CultureInfo.InvariantCulture), (s, v) => s.RequestHistory.MaxRequestBodyBytes = ParseInt(v), 0L, 1048576L, null));
            list.Add(Field("RequestHistory.MaxResponseBodyBytes", "int", true, "Maximum captured response body bytes.", s => s.RequestHistory.MaxResponseBodyBytes.ToString(CultureInfo.InvariantCulture), (s, v) => s.RequestHistory.MaxResponseBodyBytes = ParseInt(v), 0L, 1048576L, null));
            list.Add(Field("Telemetry.Enabled", "bool", false, "Whether telemetry is enabled.", s => Bool(s.Telemetry.Enabled), (s, v) => s.Telemetry.Enabled = ParseBool(v), null, null, null));
            list.Add(Field("Telemetry.ServiceName", "string", false, "Telemetry service name.", s => s.Telemetry.ServiceName, (s, v) => s.Telemetry.ServiceName = v ?? "garrison-server", null, null, null));
            list.Add(Field("Telemetry.PrometheusEnable", "bool", false, "Whether the Prometheus listener is enabled.", s => Bool(s.Telemetry.PrometheusEnable), (s, v) => s.Telemetry.PrometheusEnable = ParseBool(v), null, null, null));
            list.Add(Field("Telemetry.PrometheusPort", "int", false, "Prometheus listener port.", s => s.Telemetry.PrometheusPort.ToString(CultureInfo.InvariantCulture), (s, v) => s.Telemetry.PrometheusPort = ParseInt(v), 1L, 65535L, null));
            list.Add(Field("Telemetry.OtlpEnable", "bool", false, "Whether OTLP export is enabled.", s => Bool(s.Telemetry.OtlpEnable), (s, v) => s.Telemetry.OtlpEnable = ParseBool(v), null, null, null));
            list.Add(Field("Telemetry.OtlpEndpoint", "string", false, "OTLP endpoint.", s => s.Telemetry.OtlpEndpoint, (s, v) => s.Telemetry.OtlpEndpoint = v ?? String.Empty, null, null, null));
            list.Add(Field("Telemetry.ServeMetricsOnServicePort", "bool", true, "Whether GET /metrics is also served on the REST port without authentication, relayed from the Prometheus listener, so kubectl port-forward and in-pod 127.0.0.1 scrapes work.", s => Bool(s.Telemetry.ServeMetricsOnServicePort), (s, v) => s.Telemetry.ServeMetricsOnServicePort = ParseBool(v), null, null, null));
            list.Add(Field("Cluster.ExpectedReplicas", "int", false, "Expected control-plane replicas (above 1 requires Postgresql).", s => s.Cluster.ExpectedReplicas.ToString(CultureInfo.InvariantCulture), (s, v) => s.Cluster.ExpectedReplicas = ParseInt(v), 1L, 1000L, null));
            list.Add(Field("Cluster.Backplane", "enum", false, "Event backplane between replicas: Auto (PostgresNotify on Postgresql, Local on Sqlite), Local, Polling, or PostgresNotify.", s => s.Cluster.Backplane.ToString(), (s, v) => s.Cluster.Backplane = Enum.Parse<BackplaneModeEnum>(v ?? "Auto", true), null, null, new List<string>(Enum.GetNames(typeof(BackplaneModeEnum)))));
            list.Add(Field("Cluster.BackplanePollMs", "int", false, "Poll interval of the Polling backplane in milliseconds.", s => s.Cluster.BackplanePollMs.ToString(CultureInfo.InvariantCulture), (s, v) => s.Cluster.BackplanePollMs = ParseInt(v), 50L, 10000L, null));
            list.Add(Field("Archive.Directory", "string", false, "Directory that receives JSON Lines archives of runs and events before retention deletes them. Empty deletes without archiving.", s => s.Archive.Directory, (s, v) => s.Archive.Directory = Empty(v), null, null, null));
            return list;
        }

        #endregion
    }
}
