namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Cluster runtime settings stored in the cluster_settings table (plan D-014). Values are cached and refreshed
    /// on an interval so every replica applies changes within a few seconds. Thread-safe.
    /// </summary>
    public class ClusterSettingsService
    {
        #region Public-Members

        /// <summary>
        /// Refresh interval in milliseconds. Minimum 500, maximum 600000, default 3000.
        /// </summary>
        public int RefreshIntervalMs
        {
            get
            {
                return _RefreshIntervalMs;
            }
            set
            {
                _RefreshIntervalMs = Math.Clamp(value, 500, 600000);
            }
        }

        /// <summary>
        /// Monotonic version, incremented whenever a refresh observes a change.
        /// </summary>
        public long Version
        {
            get
            {
                return Interlocked.Read(ref _Version);
            }
        }

        /// <summary>
        /// Setting definitions.
        /// </summary>
        public IReadOnlyList<ClusterSettingDefinition> Definitions
        {
            get
            {
                return _Definitions;
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly List<ClusterSettingDefinition> _Definitions;
        private readonly ConcurrentDictionary<string, string> _Values = new ConcurrentDictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        private int _RefreshIntervalMs = 3000;
        private long _Version = 0;
        private string _Fingerprint = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="requestHistoryEnabledDefault">Default for RequestHistory.Enabled (from the settings file).</param>
        /// <param name="requestHistoryRetentionDefault">Default for RequestHistory.RetentionDays (from the settings file).</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public ClusterSettingsService(DatabaseDriverBase database, bool requestHistoryEnabledDefault, int requestHistoryRetentionDefault)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Definitions = new List<ClusterSettingDefinition>
            {
                Int("Scheduling.LeaseDurationMs", 30000, 5000, 600000, "Run lease duration; heartbeats extend it."),
                Int("Scheduling.LeaseWaitMs", 20000, 0, 60000, "Maximum lease long-poll wait."),
                Int("Scheduling.NodeHeartbeatTimeoutMs", 20000, 5000, 600000, "Time without a heartbeat before a node is marked lost."),
                Int("Scheduling.EventPollMs", 250, 50, 10000, "Event tail polling interval for streaming subscribers."),
                Int("Runs.DefaultTimeoutSeconds", 1800, 5, 86400, "Default run deadline when neither the deployment nor the profile sets one."),
                Int("Runs.MaxDelegationDepth", 3, 0, 10, "Maximum agent-to-agent delegation depth."),
                Int("Runs.RetentionDays", 30, 1, 3650, "Days finished runs are retained."),
                Int("Runs.EventRetentionDays", 14, 1, 3650, "Days run events are retained."),
                Int("Audit.RetentionDays", 365, 1, 3650, "Days audit records are retained."),
                Bool("RequestHistory.Enabled", requestHistoryEnabledDefault, "Whether HTTP requests are captured."),
                Int("RequestHistory.RetentionDays", requestHistoryRetentionDefault, 1, 3650, "Days captured requests are retained.")
            };
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Find a definition.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>Definition or null.</returns>
        public ClusterSettingDefinition? Find(string key)
        {
            return _Definitions.FirstOrDefault(d => String.Equals(d.Key, key, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Effective value as text (stored value or default).
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>Value.</returns>
        /// <exception cref="ArgumentException">Thrown when the key is unknown.</exception>
        public string GetString(string key)
        {
            ClusterSettingDefinition definition = Find(key) ?? throw new ArgumentException("Unknown cluster setting '" + key + "'.", nameof(key));
            if (_Values.TryGetValue(definition.Key, out string? value) && value != null) return value;
            return definition.DefaultValue;
        }

        /// <summary>
        /// Effective integer value, clamped to the definition range.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>Value.</returns>
        public int GetInt(string key)
        {
            ClusterSettingDefinition definition = Find(key) ?? throw new ArgumentException("Unknown cluster setting '" + key + "'.", nameof(key));
            if (!Int64.TryParse(GetString(key), NumberStyles.Integer, CultureInfo.InvariantCulture, out long parsed)) parsed = Int64.Parse(definition.DefaultValue, CultureInfo.InvariantCulture);
            return (int)Math.Clamp(parsed, definition.Minimum, definition.Maximum);
        }

        /// <summary>
        /// Effective boolean value.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>Value.</returns>
        public bool GetBool(string key)
        {
            return Boolean.TryParse(GetString(key), out bool parsed) && parsed;
        }

        /// <summary>
        /// Whether a value has been stored in the database (as opposed to the default).
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>True when stored.</returns>
        public bool IsStored(string key)
        {
            return _Values.ContainsKey(key);
        }

        /// <summary>
        /// Validate a candidate value.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <param name="value">Value.</param>
        /// <param name="error">Validation error, or null when the value is valid.</param>
        /// <returns>Normalized value, or null with an error.</returns>
        public string? Normalize(string key, string? value, out string? error)
        {
            error = null;
            ClusterSettingDefinition? definition = Find(key);
            if (definition == null)
            {
                error = "Unknown cluster setting.";
                return null;
            }
            if (definition.Type == "bool")
            {
                if (Boolean.TryParse(value, out bool b)) return b ? "true" : "false";
                error = "Must be true or false.";
                return null;
            }
            if (!Int64.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out long n))
            {
                error = "Must be an integer.";
                return null;
            }
            if (n < definition.Minimum || n > definition.Maximum)
            {
                error = "Must be between " + definition.Minimum + " and " + definition.Maximum + ".";
                return null;
            }
            return n.ToString(CultureInfo.InvariantCulture);
        }

        /// <summary>
        /// Store a value and update the local cache immediately.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <param name="value">Value.</param>
        /// <param name="updatedBy">Principal.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ValidationException">Thrown when the value is invalid.</exception>
        public async Task SetAsync(string key, string? value, string? updatedBy, CancellationToken token = default)
        {
            string? normalized = Normalize(key, value, out string? error);
            if (normalized == null) throw new ValidationException(error ?? "Invalid value.", new Dictionary<string, string> { { key, error ?? "Invalid value." } });
            ClusterSettingDefinition definition = Find(key)!;
            await _Database.ClusterSettings.UpsertAsync(definition.Key, normalized, updatedBy, token).ConfigureAwait(false);
            _Values[definition.Key] = normalized;
            Interlocked.Increment(ref _Version);
        }

        /// <summary>
        /// Reload all values from the database.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task RefreshAsync(CancellationToken token = default)
        {
            List<ClusterSetting> rows = await _Database.ClusterSettings.ListAllAsync(token).ConfigureAwait(false);
            string fingerprint = String.Join("|", rows.Select(r => r.SettingKey + "=" + r.SettingValue));
            foreach (ClusterSetting row in rows)
            {
                if (row.SettingValue != null) _Values[row.SettingKey] = row.SettingValue;
            }
            if (fingerprint != _Fingerprint)
            {
                _Fingerprint = fingerprint;
                Interlocked.Increment(ref _Version);
            }
        }

        /// <summary>
        /// Refresh on an interval until cancelled. Failures are reported and retried.
        /// </summary>
        /// <param name="diagnostic">Diagnostic callback.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task RunAsync(Action<string>? diagnostic, CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(_RefreshIntervalMs, token).ConfigureAwait(false);
                    await RefreshAsync(token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    return;
                }
                catch (Exception e)
                {
                    diagnostic?.Invoke("cluster settings refresh failed: " + e.Message);
                }
            }
        }

        #endregion

        #region Private-Methods

        private static ClusterSettingDefinition Int(string key, int defaultValue, long min, long max, string description)
        {
            ClusterSettingDefinition d = new ClusterSettingDefinition();
            d.Key = key;
            d.Type = "int";
            d.DefaultValue = defaultValue.ToString(CultureInfo.InvariantCulture);
            d.Minimum = min;
            d.Maximum = max;
            d.Description = description;
            return d;
        }

        private static ClusterSettingDefinition Bool(string key, bool defaultValue, string description)
        {
            ClusterSettingDefinition d = new ClusterSettingDefinition();
            d.Key = key;
            d.Type = "bool";
            d.DefaultValue = defaultValue ? "true" : "false";
            d.Minimum = 0;
            d.Maximum = 1;
            d.Description = description;
            return d;
        }

        #endregion
    }
}
