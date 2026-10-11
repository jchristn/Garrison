namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.IO;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Typed client for Garrison's public REST surface. It is the only place in the harness that knows routes and
    /// payload shapes. Authenticates as a system administrator with the x-api-key header (the bench stack's admin key
    /// is obviously fake). One pooled <see cref="HttpClient"/> is created per instance with the connection limit and
    /// timeouts set explicitly; <see cref="Describe"/> reports them so they land in every report.
    /// Thread-safe for concurrent calls after construction.
    /// </summary>
    public class GarrisonClient : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Base URL, for example http://127.0.0.1:37870 (no trailing slash).
        /// </summary>
        public string BaseUrl
        {
            get
            {
                return _BaseUrl;
            }
        }

        /// <summary>
        /// Maximum concurrent connections to the server. Default 1024, minimum 1, maximum 65535.
        /// </summary>
        public int MaxConnectionsPerServer
        {
            get
            {
                return _MaxConnectionsPerServer;
            }
        }

        /// <summary>
        /// Client-side request timeout in seconds. Default 660 (longer than the longest server-side wait of 600).
        /// </summary>
        public int RequestTimeoutSeconds
        {
            get
            {
                return _RequestTimeoutSeconds;
            }
        }

        /// <summary>
        /// Pooled connection lifetime in seconds, so new connections spread over replicas behind a Service. Default 30.
        /// </summary>
        public int PooledConnectionLifetimeSeconds
        {
            get
            {
                return _PooledConnectionLifetimeSeconds;
            }
        }

        #endregion

        #region Private-Members

        private readonly string _BaseUrl;
        private readonly string _AdminApiKey;
        private readonly int _MaxConnectionsPerServer;
        private readonly int _RequestTimeoutSeconds;
        private readonly int _PooledConnectionLifetimeSeconds;
        private readonly HttpClient _Http;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="baseUrl">Base URL of the REST port.</param>
        /// <param name="adminApiKey">System administrator API key.</param>
        /// <param name="maxConnectionsPerServer">Connection limit, 1 to 65535.</param>
        /// <param name="requestTimeoutSeconds">Request timeout in seconds, 1 to 3600.</param>
        /// <param name="pooledConnectionLifetimeSeconds">Pooled connection lifetime in seconds, 1 to 3600.</param>
        /// <exception cref="ArgumentNullException">Thrown when baseUrl or adminApiKey is null or empty.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when a limit is out of range.</exception>
        public GarrisonClient(string baseUrl, string adminApiKey, int maxConnectionsPerServer, int requestTimeoutSeconds, int pooledConnectionLifetimeSeconds)
        {
            if (String.IsNullOrEmpty(baseUrl)) throw new ArgumentNullException(nameof(baseUrl));
            if (String.IsNullOrEmpty(adminApiKey)) throw new ArgumentNullException(nameof(adminApiKey));
            if (maxConnectionsPerServer < 1 || maxConnectionsPerServer > 65535) throw new ArgumentOutOfRangeException(nameof(maxConnectionsPerServer));
            if (requestTimeoutSeconds < 1 || requestTimeoutSeconds > 3600) throw new ArgumentOutOfRangeException(nameof(requestTimeoutSeconds));
            if (pooledConnectionLifetimeSeconds < 1 || pooledConnectionLifetimeSeconds > 3600) throw new ArgumentOutOfRangeException(nameof(pooledConnectionLifetimeSeconds));

            _BaseUrl = baseUrl.TrimEnd('/');
            _AdminApiKey = adminApiKey;
            _MaxConnectionsPerServer = maxConnectionsPerServer;
            _RequestTimeoutSeconds = requestTimeoutSeconds;
            _PooledConnectionLifetimeSeconds = pooledConnectionLifetimeSeconds;

            SocketsHttpHandler handler = new SocketsHttpHandler();
            handler.MaxConnectionsPerServer = maxConnectionsPerServer;
            handler.PooledConnectionLifetime = TimeSpan.FromSeconds(pooledConnectionLifetimeSeconds);
            handler.PooledConnectionIdleTimeout = TimeSpan.FromSeconds(Math.Min(15, pooledConnectionLifetimeSeconds));
            handler.ConnectTimeout = TimeSpan.FromSeconds(10);
            _Http = new HttpClient(handler);
            _Http.Timeout = TimeSpan.FromSeconds(requestTimeoutSeconds);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Describe the client settings for the report.
        /// </summary>
        /// <returns>Description.</returns>
        public string Describe()
        {
            return "SocketsHttpHandler, MaxConnectionsPerServer " + _MaxConnectionsPerServer.ToString(CultureInfo.InvariantCulture)
                + ", timeout " + _RequestTimeoutSeconds.ToString(CultureInfo.InvariantCulture) + " s"
                + ", pooled connection lifetime " + _PooledConnectionLifetimeSeconds.ToString(CultureInfo.InvariantCulture) + " s"
                + ", connect timeout 10 s";
        }

        /// <summary>
        /// GET /v1.0/api/health/ready.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<object>> ReadyAsync(CancellationToken token)
        {
            return SendAsync<object>(HttpMethod.Get, "/v1.0/api/health/ready", null, null, null, token);
        }

        /// <summary>
        /// GET /v1.0/api/server-info.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<ServerInfo>> ServerInfoAsync(CancellationToken token)
        {
            return SendAsync<ServerInfo>(HttpMethod.Get, "/v1.0/api/server-info", null, null, null, token);
        }

        /// <summary>
        /// List tenants whose name contains the search text.
        /// </summary>
        /// <param name="search">Search text.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<EnumerationResult<Tenant>>> SearchTenantsAsync(string search, CancellationToken token)
        {
            return SendAsync<EnumerationResult<Tenant>>(HttpMethod.Get, "/v1.0/api/tenants?maxResults=1000&search=" + Uri.EscapeDataString(search), null, null, null, token);
        }

        /// <summary>
        /// POST /v1.0/api/tenants.
        /// </summary>
        /// <param name="request">Tenant request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<Tenant>> CreateTenantAsync(TenantRequest request, CancellationToken token)
        {
            return SendAsync<Tenant>(HttpMethod.Post, "/v1.0/api/tenants", Serialize(request), "application/json", null, token);
        }

        /// <summary>
        /// Apply a YAML manifest to a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="yaml">Manifest text.</param>
        /// <param name="dryRun">Dry run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response; a validation failure answers 400 with the same body.</returns>
        public async Task<ApiResponse<ManifestApply>> ApplyManifestAsync(string tenantId, string yaml, bool dryRun, CancellationToken token)
        {
            ApiResponse<ManifestApply> response = await SendAsync<ManifestApply>(HttpMethod.Post, TenantPath(tenantId) + "/manifests/apply?dryRun=" + (dryRun ? "true" : "false"), yaml, "application/yaml", null, token).ConfigureAwait(false);
            if (response.Body == null && response.StatusCode == 400 && response.RawBody.Length > 0)
            {
                // A failed apply answers 400 with the ManifestApply body, so every document's problem is visible.
                response.Body = TryDeserialize<ManifestApply>(response.RawBody);
            }
            return response;
        }

        /// <summary>
        /// Read an agent by identifier or name.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="idOrName">Identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<Agent>> GetAgentAsync(string tenantId, string idOrName, CancellationToken token)
        {
            return SendAsync<Agent>(HttpMethod.Get, TenantPath(tenantId) + "/agents/" + Uri.EscapeDataString(idOrName), null, null, null, token);
        }

        /// <summary>
        /// POST .../runs.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="request">Request.</param>
        /// <param name="idempotencyKey">Optional Idempotency-Key header.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<Run>> CreateRunAsync(string tenantId, RunCreateRequest request, string? idempotencyKey, CancellationToken token)
        {
            Dictionary<string, string>? headers = null;
            if (!String.IsNullOrEmpty(idempotencyKey)) headers = new Dictionary<string, string> { { "Idempotency-Key", idempotencyKey } };
            return SendAsync<Run>(HttpMethod.Post, TenantPath(tenantId) + "/runs", Serialize(request), "application/json", headers, token);
        }

        /// <summary>
        /// POST .../agents/{agent}/invoke.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="agent">Agent identifier or name.</param>
        /// <param name="request">Request (AgentName is ignored).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<Run>> InvokeAsync(string tenantId, string agent, RunCreateRequest request, CancellationToken token)
        {
            RunCreateRequest body = new RunCreateRequest();
            body.Input = request.Input;
            body.DeploymentId = request.DeploymentId;
            body.Parameters = request.Parameters;
            body.Priority = request.Priority;
            body.Wait = request.Wait;
            body.WaitSeconds = request.WaitSeconds;
            body.CancelOnDisconnect = request.CancelOnDisconnect;
            return SendAsync<Run>(HttpMethod.Post, TenantPath(tenantId) + "/agents/" + Uri.EscapeDataString(agent) + "/invoke", Serialize(body), "application/json", null, token);
        }

        /// <summary>
        /// GET .../runs/{id}.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="runId">Run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<Run>> GetRunAsync(string tenantId, string runId, CancellationToken token)
        {
            return SendAsync<Run>(HttpMethod.Get, TenantPath(tenantId) + "/runs/" + Uri.EscapeDataString(runId), null, null, null, token);
        }

        /// <summary>
        /// List runs of an agent created at or after a time, oldest first.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="fromUtc">Lower bound on creation time.</param>
        /// <param name="skip">Records to skip.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<EnumerationResult<Run>>> ListRunsAsync(string tenantId, string agentId, DateTime fromUtc, int skip, CancellationToken token)
        {
            string query = "?maxResults=1000&ordering=CreatedAscending&skip=" + skip.ToString(CultureInfo.InvariantCulture)
                + "&agentId=" + Uri.EscapeDataString(agentId)
                + "&fromUtc=" + Uri.EscapeDataString(fromUtc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture));
            return SendAsync<EnumerationResult<Run>>(HttpMethod.Get, TenantPath(tenantId) + "/runs" + query, null, null, null, token);
        }

        /// <summary>
        /// POST .../runs/{id}/cancel.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="runId">Run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<Run>> CancelRunAsync(string tenantId, string runId, CancellationToken token)
        {
            return SendAsync<Run>(HttpMethod.Post, TenantPath(tenantId) + "/runs/" + Uri.EscapeDataString(runId) + "/cancel", null, null, null, token);
        }

        /// <summary>
        /// GET .../runs/{id}/events after a sequence.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="runId">Run.</param>
        /// <param name="afterSequence">Return events after this sequence.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<RunEventsResponse>> GetRunEventsAsync(string tenantId, string runId, long afterSequence, CancellationToken token)
        {
            string path = TenantPath(tenantId) + "/runs/" + Uri.EscapeDataString(runId) + "/events?limit=5000&afterSequence=" + afterSequence.ToString(CultureInfo.InvariantCulture);
            return SendAsync<RunEventsResponse>(HttpMethod.Get, path, null, null, null, token);
        }

        /// <summary>
        /// Read every event of a run, following hasMore.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="runId">Run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Events in sequence order, or null when a page could not be read.</returns>
        public async Task<List<RunEvent>?> GetAllRunEventsAsync(string tenantId, string runId, CancellationToken token)
        {
            List<RunEvent> all = new List<RunEvent>();
            long after = 0;
            for (int page = 0; page < 1000; page++)
            {
                token.ThrowIfCancellationRequested();
                ApiResponse<RunEventsResponse> response = await GetRunEventsAsync(tenantId, runId, after, token).ConfigureAwait(false);
                if (!response.IsSuccess || response.Body == null) return null;
                all.AddRange(response.Body.Events);
                if (!response.Body.HasMore || response.Body.Events.Count == 0) break;
                after = response.Body.LastSequence;
            }
            return all;
        }

        /// <summary>
        /// Follow a run's server-sent event stream until run.completed, the stream closes, or the token is cancelled.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="runId">Run.</param>
        /// <param name="token">Cancellation token; cancel it to stop following.</param>
        /// <returns>Messages in arrival order, each stamped with its arrival time.</returns>
        public async Task<List<SseMessage>> StreamRunEventsAsync(string tenantId, string runId, CancellationToken token)
        {
            List<SseMessage> messages = new List<SseMessage>();
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, _BaseUrl + TenantPath(tenantId) + "/runs/" + Uri.EscapeDataString(runId) + "/events/stream"))
            {
                request.Headers.Add("x-api-key", _AdminApiKey);
                request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));
                try
                {
                    using (HttpResponseMessage response = await _Http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, token).ConfigureAwait(false))
                    {
                        if (!response.IsSuccessStatusCode) return messages;
                        using (Stream stream = await response.Content.ReadAsStreamAsync(token).ConfigureAwait(false))
                        using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
                        {
                            SseMessage current = new SseMessage();
                            StringBuilder data = new StringBuilder();
                            while (!token.IsCancellationRequested)
                            {
                                string? line = await reader.ReadLineAsync(token).ConfigureAwait(false);
                                if (line == null) break;
                                if (line.Length == 0)
                                {
                                    if (data.Length > 0 || current.Event.Length > 0)
                                    {
                                        current.Data = data.ToString();
                                        current.ReceivedUtc = DateTime.UtcNow;
                                        messages.Add(current);
                                        if (current.Event == "run.completed") break;
                                    }
                                    current = new SseMessage();
                                    data.Clear();
                                    continue;
                                }
                                if (line.StartsWith(':')) continue;
                                if (line.StartsWith("id:", StringComparison.Ordinal)) current.Id = line.Substring(3).Trim();
                                else if (line.StartsWith("event:", StringComparison.Ordinal)) current.Event = line.Substring(6).Trim();
                                else if (line.StartsWith("data:", StringComparison.Ordinal))
                                {
                                    if (data.Length > 0) data.Append('\n');
                                    data.Append(line.Substring(5).TrimStart());
                                }
                            }
                        }
                    }
                }
                catch (OperationCanceledException) when (token.IsCancellationRequested)
                {
                }
                catch (Exception e) when (e is HttpRequestException || e is IOException)
                {
                }
            }
            return messages;
        }

        /// <summary>
        /// GET /v1.0/api/nodes (up to 1000).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<ApiResponse<EnumerationResult<Node>>> ListNodesAsync(CancellationToken token)
        {
            return SendAsync<EnumerationResult<Node>>(HttpMethod.Get, "/v1.0/api/nodes?maxResults=1000", null, null, null, token);
        }

        /// <summary>
        /// GET /metrics as text. Returns null when the server does not serve metrics.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Prometheus text exposition, or null.</returns>
        public async Task<string?> GetMetricsTextAsync(CancellationToken token)
        {
            ApiResponse<object> response = await SendAsync<object>(HttpMethod.Get, "/metrics", null, null, null, token, false).ConfigureAwait(false);
            return response.IsSuccess ? response.RawBody : null;
        }

        /// <summary>
        /// Send a request and return its outcome. Only cancellation through the token throws.
        /// </summary>
        /// <typeparam name="T">Success body type.</typeparam>
        /// <param name="method">Method.</param>
        /// <param name="pathAndQuery">Path and query, starting with a slash.</param>
        /// <param name="body">Body text, or null.</param>
        /// <param name="contentType">Body content type, or null.</param>
        /// <param name="headers">Extra headers, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <param name="parseJson">Whether to deserialize the body.</param>
        /// <returns>Response.</returns>
        /// <exception cref="OperationCanceledException">Thrown when the token is cancelled.</exception>
        public async Task<ApiResponse<T>> SendAsync<T>(HttpMethod method, string pathAndQuery, string? body, string? contentType, Dictionary<string, string>? headers, CancellationToken token, bool parseJson = true)
        {
            ApiResponse<T> result = new ApiResponse<T>();
            Stopwatch watch = Stopwatch.StartNew();
            using (HttpRequestMessage request = new HttpRequestMessage(method, _BaseUrl + pathAndQuery))
            {
                request.Headers.Add("x-api-key", _AdminApiKey);
                if (headers != null)
                {
                    foreach (KeyValuePair<string, string> header in headers) request.Headers.TryAddWithoutValidation(header.Key, header.Value);
                }
                if (body != null)
                {
                    request.Content = new StringContent(body, Encoding.UTF8);
                    request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType ?? "application/json");
                }
                try
                {
                    using (HttpResponseMessage response = await _Http.SendAsync(request, HttpCompletionOption.ResponseContentRead, token).ConfigureAwait(false))
                    {
                        result.StatusCode = (int)response.StatusCode;
                        result.ContentType = response.Content.Headers.ContentType?.MediaType;
                        result.RawBody = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    }
                }
                catch (OperationCanceledException) when (token.IsCancellationRequested)
                {
                    throw;
                }
                catch (TaskCanceledException e)
                {
                    result.StatusCode = 0;
                    result.TransportError = "client timeout after " + _RequestTimeoutSeconds.ToString(CultureInfo.InvariantCulture) + " s: " + e.Message;
                }
                catch (HttpRequestException e)
                {
                    result.StatusCode = 0;
                    result.TransportError = e.Message;
                }
                catch (IOException e)
                {
                    result.StatusCode = 0;
                    result.TransportError = e.Message;
                }
            }
            watch.Stop();
            result.ElapsedMs = watch.Elapsed.TotalMilliseconds;

            if (parseJson && result.StatusCode != 0 && result.RawBody.Length > 0 && LooksLikeJson(result.RawBody))
            {
                if (result.IsSuccess) result.Body = TryDeserialize<T>(result.RawBody);
                else result.Error = TryDeserialize<ApiError>(result.RawBody);
            }
            return result;
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
        /// Dispose.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing) _Http.Dispose();
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private static string TenantPath(string tenantId)
        {
            return "/v1.0/api/tenants/" + Uri.EscapeDataString(tenantId);
        }

        private static string Serialize(object value)
        {
            return JsonSerializer.Serialize(value, value.GetType(), JsonDefaults.Compact);
        }

        private static bool LooksLikeJson(string text)
        {
            for (int i = 0; i < text.Length; i++)
            {
                char c = text[i];
                if (Char.IsWhiteSpace(c)) continue;
                return c == '{' || c == '[';
            }
            return false;
        }

        private static TValue? TryDeserialize<TValue>(string text)
        {
            try
            {
                return JsonSerializer.Deserialize<TValue>(text, JsonDefaults.Compact);
            }
            catch (JsonException)
            {
                return default(TValue);
            }
        }

        #endregion
    }
}
