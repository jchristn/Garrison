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
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Backplane;

    /// <summary>
    /// Cluster runtime settings stored in the cluster_settings table (plan D-014). Values are cached and refreshed
    /// on an interval so every replica applies changes within a few seconds; a change also publishes SettingsChanged on
    /// the backplane so other replicas reload at once. Thread-safe.
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
        /// Backplane used to tell other replicas to reload after <see cref="SetAsync"/>. Null (the default) relies on the
        /// refresh interval alone.
        /// </summary>
        public IEventBackplane? Backplane { get; set; } = null;

        /// <summary>
        /// Raised after the cached values change (a local set or a refresh that saw a change).
        /// </summary>
        public event EventHandler? Changed;

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
        private readonly Dictionary<string, string> _Overrides = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
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
            : this(database, requestHistoryEnabledDefault, requestHistoryRetentionDefault, Environment.GetEnvironmentVariable)
        {
        }

        /// <summary>
        /// Instantiate with an explicit environment lookup (used by tests).
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="requestHistoryEnabledDefault">Default for RequestHistory.Enabled (from the settings file).</param>
        /// <param name="requestHistoryRetentionDefault">Default for RequestHistory.RetentionDays (from the settings file).</param>
        /// <param name="environment">Returns the value of an environment variable, or null when it is not set.</param>
        /// <exception cref="ArgumentNullException">Thrown when database or environment is null.</exception>
        public ClusterSettingsService(DatabaseDriverBase database, bool requestHistoryEnabledDefault, int requestHistoryRetentionDefault, Func<string, string?> environment)
        {
            if (environment == null) throw new ArgumentNullException(nameof(environment));
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Definitions = new List<ClusterSettingDefinition>
            {
                Int("Scheduling.LeaseDurationMs", 30000, 5000, 600000, "Run lease duration; heartbeats extend it."),
                Int("Scheduling.LeaseWaitMs", 20000, 0, 60000, "Maximum lease long-poll wait."),
                Int("Scheduling.NodeHeartbeatTimeoutMs", 20000, 5000, 600000, "Time without a heartbeat before a node is marked lost."),
                Int("Scheduling.EventPollMs", 250, 50, 10000, "Event tail polling interval for streaming subscribers."),
                Int("Scheduling.InvocationWaitPollMs", 5000, 250, 60000, "Fallback re-read interval for synchronous invocation waiters. They wake when their run finishes on any replica; this only covers a missed completion signal."),
                Int("Scheduling.QueueWakeFanout", 1, 0, 64, "Waiting lease long polls each replica wakes for a queued run, chosen among the polls whose node could take it (harness, node pool, child reserve). A poll that cannot take the run hands it to the next one. 0 wakes every matching poll on every replica at once."),
                Int("Scheduling.RemoteWakeDelayMs", 250, 0, 10000, "Milliseconds other replicas hold their wakeup for a run whose replica already woke one of its own polls. The hold ends early when the run is claimed (nothing is woken) or when that replica runs out of polls that could take it (one poll is woken at once). 0 wakes one poll on every replica at once."),
                Int("Scheduling.PauseGraceMs", 5000, 1000, 600000, "Pause tolerance: a maintenance tick that comes more than the maintenance interval plus this long after the previous one (host sleep, frozen VM, clock jump) skips lease expiry, Lost and Offline marking, and deadline enforcement until one heartbeat window plus this grace has passed since the resume."),
                Int("Runs.DefaultTimeoutSeconds", 1800, 5, 86400, "Default run deadline when neither the deployment nor the profile sets one."),
                Int("Runs.MaxDelegationDepth", 3, 0, 10, "Maximum agent-to-agent delegation depth."),
                Int("Runs.DelegationChildQueueDepth", 100, 1, 100000, "Most queued delegated runs whose parent waits on them, across the cluster. A run that starts waiting on another delegated run beyond it fails at once with DelegationCapacityExhausted."),
                Int("Runs.DelegationRetryAfterSeconds", 5, 1, 300, "Seconds suggested in Retry-After when a synchronous delegation fails with DelegationCapacityExhausted."),
                Int("Runs.RetentionDays", 30, 1, 3650, "Days finished runs are retained."),
                Int("Runs.EventRetentionDays", 14, 1, 3650, "Days run events are retained."),
                Int("Runtime.MaxRunSeconds", 3600, 60, 604800, "Cluster cap on any run's execution in seconds. Every run's timeout (deployment, per-run timeoutSeconds override, or harness profile default) is reduced to this cap when it is larger, and the leader times out runs that run longer."),
                Bool("Runtime.RepetitionGuard", true, "Default for deployments that do not set repetitionGuard: the worker stops a run (outcome RepetitionDetected) when its last 2,000 characters of assistant text are one unit of 1 to 64 characters repeated at least 30 times, or its last 1,000 characters contain no letters or digits."),
                Int("Runtime.MaxAssistantChars", 200000, 0, 100000000, "Default for deployments that do not set maxAssistantChars: characters of assistant text after which the worker stops a run with outcome OutputLimitExceeded. 0 is unlimited."),
                Int("Runtime.NoProgressSeconds", 300, 0, 86400, "Default for deployments that do not set noProgressSeconds: seconds without assistant text, thinking, tool call, or tool result (while no tool call is open) after which the worker stops a run with outcome NoProgress. 0 turns the guard off."),
                Int("Runtime.FailBlockedAfterSeconds", 0, 0, 604800, "Seconds a queued run may wait with no Ready worker able to run it before it fails with outcome NoCapableWorker. 0 waits forever."),
                Int("Runtime.ConversationAffinityWaitMs", 30000, 0, 600000, "Milliseconds a conversation turn waits for the node that holds the conversation's harness session before another node may take it and start a fresh session from the transcript. Other nodes take it at once when that node is not Ready. 0 never waits."),
                Int("Runtime.ConversationTranscriptTurns", 20, 1, 200, "Most earlier turns repeated to a conversation turn that starts a fresh harness session (a fallback); the newest are kept."),
                Int("Runtime.ConversationTranscriptChars", 4000, 200, 200000, "Most characters of each earlier input and answer repeated to a fallback conversation turn; longer ones are truncated."),
                Int("Runtime.PipelineSweepIntervalMs", 5000, 500, 600000, "Interval of the leader's pipeline sweep: advances pipeline runs whose stage finished without a completion hook, links claimed stage executions, retries blocked stage starts, and applies review timeouts and pipeline deadlines."),
                Int("Runtime.PipelineMaxStages", 20, 1, 100, "Most stages a pipeline definition may have."),
                Int("Triggers.WebhookMaxBodyBytes", 262144, 1024, 1048576, "Largest trigger webhook request body in bytes; larger deliveries answer 413 before the signature is checked."),
                Int("Triggers.WebhookToleranceSeconds", 300, 30, 3600, "Largest difference in seconds between a trigger webhook's signature timestamp and the server clock, in either direction. Older or newer deliveries answer 401, so a captured delivery cannot be replayed later."),
                Int("Triggers.CronMaxLatenessSeconds", 3600, 0, 604800, "Cron catch-up bound: when the leader finds a schedule that came due while no replica could fire it, missed occurrences collapse into one fire for the latest one, unless that occurrence is older than this many seconds, in which case it is recorded as Skipped and nothing runs. 0 always fires once."),
                Int("Triggers.FireRetentionDays", 30, 1, 3650, "Days trigger fire history is retained."),
                Bool("Notifications.AllowPrivateDestinations", false, "Whether notification endpoints may deliver to loopback and private addresses (127.0.0.0/8, 10/8, 172.16/12, 192.168/16, 100.64/10, ::1, fc00::/7). Off by default to prevent server-side request forgery. Link-local addresses (169.254.0.0/16, including cloud metadata services, and fe80::/10), multicast, and reserved addresses are always refused."),
                Int("Notifications.MaxAttempts", 8, 1, 20, "Most delivery attempts for one notification before it is marked Failed."),
                Int("Notifications.InitialBackoffSeconds", 10, 1, 3600, "Delay before the second attempt of a notification; each later delay doubles, up to Notifications.MaxBackoffSeconds."),
                Int("Notifications.MaxBackoffSeconds", 3600, 1, 86400, "Longest delay between two attempts of a notification."),
                Int("Notifications.TimeoutSeconds", 10, 1, 60, "Seconds one notification attempt may take, connection included."),
                Int("Notifications.DispatchIntervalMs", 1000, 100, 60000, "How often each replica looks for notifications due to be sent."),
                Int("Notifications.SweepOverlapSeconds", 30, 0, 600, "Seconds of already-scanned history the leader's notification sweep reads again on every pass, so an event written late by a slow replica or a skewed clock is not missed. Events already queued are not queued twice."),
                Int("Notifications.DeliveryRetentionDays", 14, 1, 3650, "Days finished notification deliveries (Succeeded or Failed) are kept in the delivery log."),
                Int("Transcripts.MaxBytes", 4194304, 65536, 67108864, "Largest run or conversation transcript export in bytes of text. Events past the limit are left out and the transcript says where to read the rest."),
                Int("Transcripts.ToolTextMaxChars", 2000, 100, 100000, "Longest tool call argument or tool result text kept per event in a transcript export, in characters; longer text is cut and marked."),
                Int("Transcripts.MaxTurns", 200, 1, 1000, "Most turns in a conversation transcript export; the oldest turns are kept and the transcript says the rest were left out."),
                Int("ControlPlane.HeartbeatIntervalMs", 5000, 1000, 60000, "Interval at which each control-plane replica heartbeats its control node row."),
                Int("ControlPlane.OfflineAfterMs", 30000, 5000, 600000, "Time without a heartbeat before the leader marks a control-plane replica Offline."),
                Int("ControlPlane.OfflineRetentionHours", 24, 1, 8760, "Hours an Offline control-plane replica stays listed before the leader deletes its row."),
                Int("Audit.RetentionDays", 365, 1, 3650, "Days audit records are retained."),
                Int("Auth.CacheSeconds", 5, 0, 60, "Seconds each replica caches the sessions, tenants, users, and credentials it reads to authenticate requests. A change made through the API (revoking a token, deactivating or deleting a user, credential, or tenant, changing a user's roles) drops the cached entry on every replica at once through the backplane; this is the longest a change made any other way, or a missed backplane message, can go unnoticed. 0 turns the cache off."),
                Bool("RequestHistory.Enabled", requestHistoryEnabledDefault, "Whether HTTP requests are captured."),
                Bool("RequestHistory.CaptureNodeProtocol", false, "Whether successful worker node protocol requests (/v1.0/api/node/...: lease, watch, heartbeat, events, started, complete) are captured. Off by default because each run makes dozens of them; failed node requests (status 400 and above) are always captured while request history is enabled."),
                Int("RequestHistory.RetentionDays", requestHistoryRetentionDefault, 1, 3650, "Days captured requests are retained."),
                Url("Observability.GrafanaUrl", "GARRISON_GRAFANA_URL", "Grafana URL as reached from a browser, for example https://grafana.example.com. Used for the Home card and deep links. Empty means Grafana is not configured."),
                Url("Observability.PrometheusUrl", "GARRISON_PROMETHEUS_URL", "Prometheus URL as reached from a browser. Empty means Prometheus is not configured."),
                Url("Observability.LokiUrl", "GARRISON_LOKI_URL", "Loki URL as reached from a browser. Empty means Loki is not configured."),
                Url("Observability.TempoUrl", "GARRISON_TEMPO_URL", "Tempo URL as reached from a browser. Empty means Tempo is not configured."),
                Url("Observability.GrafanaInternalUrl", "GARRISON_GRAFANA_INTERNAL_URL", "Grafana URL the server probes for reachability, for example http://garrison-grafana:3000. Empty uses Observability.GrafanaUrl."),
                Url("Observability.PrometheusInternalUrl", "GARRISON_PROMETHEUS_INTERNAL_URL", "Prometheus URL the server probes for reachability. Empty uses Observability.PrometheusUrl."),
                Url("Observability.LokiInternalUrl", "GARRISON_LOKI_INTERNAL_URL", "Loki URL the server probes for reachability. Empty uses Observability.LokiUrl."),
                Url("Observability.TempoInternalUrl", "GARRISON_TEMPO_INTERNAL_URL", "Tempo URL the server probes for reachability. Empty uses Observability.TempoUrl.")
            };

            foreach (ClusterSettingDefinition definition in _Definitions)
            {
                if (String.IsNullOrEmpty(definition.EnvironmentVariable)) continue;
                string? raw = environment(definition.EnvironmentVariable);
                if (String.IsNullOrWhiteSpace(raw)) continue;
                string? normalized = Normalize(definition.Key, raw, out string? _);
                if (normalized != null) _Overrides[definition.Key] = normalized;
            }
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
            if (_Overrides.TryGetValue(definition.Key, out string? overridden)) return overridden;
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
        /// Whether the effective value comes from the setting's environment variable.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>True when overridden by the environment.</returns>
        public bool IsOverridden(string key)
        {
            return _Overrides.ContainsKey(key);
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
            return Normalize(key, value, out error, out string _);
        }

        /// <summary>
        /// Validate a candidate value. Out-of-range values are rejected, never clamped.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <param name="value">Value.</param>
        /// <param name="error">Validation error, or null when the value is valid.</param>
        /// <param name="code">Machine code for the error (UnknownSetting, NotABoolean, NotAnInteger, OutOfRange, TooLong, NotAUrl), or empty when valid.</param>
        /// <returns>Normalized value, or null with an error.</returns>
        public string? Normalize(string key, string? value, out string? error, out string code)
        {
            error = null;
            code = String.Empty;
            ClusterSettingDefinition? definition = Find(key);
            if (definition == null)
            {
                error = "Unknown cluster setting.";
                code = "UnknownSetting";
                return null;
            }
            if (definition.Type == "string")
            {
                string text = (value ?? String.Empty).Trim();
                if (text.Length > 2048)
                {
                    error = "Must be at most 2048 characters.";
                    code = "TooLong";
                    return null;
                }
                if (definition.IsUrl && text.Length > 0)
                {
                    if (!Uri.TryCreate(text, UriKind.Absolute, out Uri? uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                    {
                        error = "Must be empty or an absolute http or https URL.";
                        code = "NotAUrl";
                        return null;
                    }
                    text = text.TrimEnd('/');
                }
                return text;
            }
            if (definition.Type == "bool")
            {
                if (Boolean.TryParse(value, out bool b)) return b ? "true" : "false";
                error = "Must be true or false.";
                code = "NotABoolean";
                return null;
            }
            if (!Int64.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out long n))
            {
                error = "Must be an integer.";
                code = "NotAnInteger";
                return null;
            }
            if (n < definition.Minimum || n > definition.Maximum)
            {
                error = "Must be between " + definition.Minimum + " and " + definition.Maximum + ".";
                code = "OutOfRange";
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
        /// <exception cref="ValidationException">Thrown when the value is invalid or the setting is overridden by the environment.</exception>
        public async Task SetAsync(string key, string? value, string? updatedBy, CancellationToken token = default)
        {
            if (IsOverridden(key))
            {
                string message = "Overridden by an environment variable; change the environment instead.";
                throw new ValidationException(message, new Dictionary<string, string> { { key, message } }, new Dictionary<string, string> { { key, "OverriddenByEnvironment" } });
            }
            string? normalized = Normalize(key, value, out string? error, out string code);
            if (normalized == null) throw new ValidationException(error ?? "Invalid value.", new Dictionary<string, string> { { key, error ?? "Invalid value." } }, new Dictionary<string, string> { { key, code } });
            ClusterSettingDefinition definition = Find(key)!;
            await _Database.ClusterSettings.UpsertAsync(definition.Key, normalized, updatedBy, token).ConfigureAwait(false);
            _Values[definition.Key] = normalized;
            Interlocked.Increment(ref _Version);
            RaiseChanged();
            Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.SettingsChanged, definition.Key));
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
                RaiseChanged();
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
                    await GarrisonTracing.BackgroundAsync("cluster_settings", "refresh", RefreshAsync, token).ConfigureAwait(false);
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

        private void RaiseChanged()
        {
            EventHandler? handler = Changed;
            if (handler == null) return;
            try
            {
                handler(this, EventArgs.Empty);
            }
            catch (Exception)
            {
                // A subscriber's failure must not fail the settings change itself.
            }
        }

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

        private static ClusterSettingDefinition Url(string key, string environmentVariable, string description)
        {
            ClusterSettingDefinition d = new ClusterSettingDefinition();
            d.Key = key;
            d.Type = "string";
            d.DefaultValue = String.Empty;
            d.Minimum = 0;
            d.Maximum = 2048;
            d.Description = description + " Environment variable " + environmentVariable + " overrides it.";
            d.IsUrl = true;
            d.EnvironmentVariable = environmentVariable;
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
