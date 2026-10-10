namespace Garrison.Worker.Protocol
{
    using System;
    using System.Net;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Protocol;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;

    /// <summary>
    /// HTTP client for the node protocol. Authenticates with the node credential (POST /v1.0/token), uses the bearer
    /// token afterwards, and re-authenticates once on 401. A 409 on a run-scoped call raises
    /// <see cref="StaleLeaseException"/>. Thread-safe.
    /// </summary>
    public class NodeProtocolClient : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Default per-call timeout in milliseconds for non long-poll calls. Minimum 1000, maximum 600000, default 30000.
        /// </summary>
        public int CallTimeoutMs
        {
            get
            {
                return _CallTimeoutMs;
            }
            set
            {
                _CallTimeoutMs = Math.Clamp(value, 1000, 600000);
            }
        }

        #endregion

        #region Private-Members

        private readonly HttpClient _Http;
        private readonly string _BaseUrl;
        private readonly string _AccessKey;
        private readonly string _SecretKey;
        private readonly SemaphoreSlim _AuthLock = new SemaphoreSlim(1, 1);
        private string? _Token = null;
        private int _CallTimeoutMs = 30000;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="baseUrl">Control-plane base URL.</param>
        /// <param name="accessKey">Node access key.</param>
        /// <param name="secretKey">Node secret key.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        public NodeProtocolClient(string baseUrl, string accessKey, string secretKey)
        {
            if (String.IsNullOrEmpty(baseUrl)) throw new ArgumentNullException(nameof(baseUrl));
            if (String.IsNullOrEmpty(accessKey)) throw new ArgumentNullException(nameof(accessKey));
            if (String.IsNullOrEmpty(secretKey)) throw new ArgumentNullException(nameof(secretKey));
            _BaseUrl = baseUrl.TrimEnd('/').Replace("://localhost", "://127.0.0.1", StringComparison.OrdinalIgnoreCase);
            _AccessKey = accessKey;
            _SecretKey = secretKey;

            SocketsHttpHandler handler = new SocketsHttpHandler();
            handler.PooledConnectionLifetime = TimeSpan.FromMinutes(5);
            handler.MaxConnectionsPerServer = 64;
            _Http = new HttpClient(handler);
            _Http.Timeout = Timeout.InfiniteTimeSpan;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register the node.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<NodeRegisterResponse> RegisterAsync(NodeRegisterRequest request, CancellationToken token = default)
        {
            return PostAsync<NodeRegisterResponse>("/v1.0/api/node/register", request, null, _CallTimeoutMs, token);
        }

        /// <summary>
        /// Send a heartbeat.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<NodeHeartbeatResponse> HeartbeatAsync(NodeHeartbeatRequest request, CancellationToken token = default)
        {
            return PostAsync<NodeHeartbeatResponse>("/v1.0/api/node/heartbeat", request, null, _CallTimeoutMs, token);
        }

        /// <summary>
        /// Lease runs (long poll).
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response.</returns>
        public Task<NodeLeaseResponse> LeaseAsync(NodeLeaseRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return PostAsync<NodeLeaseResponse>("/v1.0/api/node/lease", request, null, request.WaitMs + _CallTimeoutMs, token);
        }

        /// <summary>
        /// Tell the control plane the node is draining.
        /// </summary>
        /// <param name="nodeId">Node identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Acknowledgement.</returns>
        public Task<NodeAckResponse> DrainAsync(string nodeId, CancellationToken token = default)
        {
            NodeHeartbeatRequest request = new NodeHeartbeatRequest();
            request.NodeId = nodeId;
            request.Draining = true;
            return PostAsync<NodeAckResponse>("/v1.0/api/node/drain", request, null, _CallTimeoutMs, token);
        }

        /// <summary>
        /// Report that a run started.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Acknowledgement.</returns>
        public Task<NodeAckResponse> StartedAsync(string runId, RunStartedRequest request, CancellationToken token = default)
        {
            return PostAsync<NodeAckResponse>("/v1.0/api/node/runs/" + Uri.EscapeDataString(runId) + "/started", request, runId, _CallTimeoutMs, token);
        }

        /// <summary>
        /// Send a batch of run events.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Acknowledgement.</returns>
        public Task<NodeAckResponse> EventsAsync(string runId, RunEventsRequest request, CancellationToken token = default)
        {
            return PostAsync<NodeAckResponse>("/v1.0/api/node/runs/" + Uri.EscapeDataString(runId) + "/events", request, runId, _CallTimeoutMs, token);
        }

        /// <summary>
        /// Report run completion.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Acknowledgement.</returns>
        public Task<NodeAckResponse> CompleteAsync(string runId, RunCompleteRequest request, CancellationToken token = default)
        {
            return PostAsync<NodeAckResponse>("/v1.0/api/node/runs/" + Uri.EscapeDataString(runId) + "/complete", request, runId, _CallTimeoutMs, token);
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
            if (disposing)
            {
                _Http.Dispose();
                _AuthLock.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task<T> PostAsync<T>(string path, object body, string? runId, int timeoutMs, CancellationToken token) where T : class, new()
        {
            for (int attempt = 0; attempt < 2; attempt++)
            {
                string bearer = await EnsureTokenAsync(attempt > 0, token).ConfigureAwait(false);
                using (CancellationTokenSource timeout = new CancellationTokenSource(timeoutMs))
                using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, timeout.Token))
                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, _BaseUrl + path))
                {
                    request.Headers.TryAddWithoutValidation("Authorization", "Bearer " + bearer);
                    request.Content = new StringContent(Serializer.Serialize(body), Encoding.UTF8, "application/json");
                    HttpResponseMessage response;
                    try
                    {
                        response = await _Http.SendAsync(request, linked.Token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException) when (!token.IsCancellationRequested)
                    {
                        throw new NodeProtocolException(0, "POST " + path + " timed out after " + timeoutMs + " ms.");
                    }
                    catch (HttpRequestException e)
                    {
                        throw new NodeProtocolException(0, "POST " + path + " failed: " + e.Message, e);
                    }

                    using (response)
                    {
                        string text = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        if (response.StatusCode == HttpStatusCode.Unauthorized && attempt == 0) continue;
                        if (response.StatusCode == HttpStatusCode.Conflict && runId != null) throw new StaleLeaseException(runId, "Lease for run " + runId + " is stale: " + text);
                        if (!response.IsSuccessStatusCode) throw new NodeProtocolException((int)response.StatusCode, "POST " + path + " returned " + (int)response.StatusCode + ": " + Truncate(text));
                        if (String.IsNullOrWhiteSpace(text)) return new T();
                        return Serializer.Deserialize<T>(text) ?? new T();
                    }
                }
            }
            throw new NodeProtocolException(401, "Node credential was rejected.");
        }

        private async Task<string> EnsureTokenAsync(bool force, CancellationToken token)
        {
            string? current = _Token;
            if (!force && current != null) return current;

            await _AuthLock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                if (!force && _Token != null) return _Token;
                using (CancellationTokenSource timeout = new CancellationTokenSource(_CallTimeoutMs))
                using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, timeout.Token))
                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, _BaseUrl + "/v1.0/token"))
                {
                    request.Content = new StringContent(Serializer.Serialize(new { accessKey = _AccessKey, secretKey = _SecretKey }), Encoding.UTF8, "application/json");
                    HttpResponseMessage response;
                    try
                    {
                        response = await _Http.SendAsync(request, linked.Token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException) when (!token.IsCancellationRequested)
                    {
                        throw new NodeProtocolException(0, "Authentication timed out.");
                    }
                    catch (HttpRequestException e)
                    {
                        throw new NodeProtocolException(0, "Authentication failed: " + e.Message, e);
                    }
                    using (response)
                    {
                        string text = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        if (!response.IsSuccessStatusCode) throw new NodeProtocolException((int)response.StatusCode, "Node authentication returned " + (int)response.StatusCode + ": " + Truncate(text));
                        TokenResponse? issued = Serializer.Deserialize<TokenResponse>(text);
                        if (issued == null || String.IsNullOrEmpty(issued.Token)) throw new NodeProtocolException((int)response.StatusCode, "Node authentication returned no token.");
                        _Token = issued.Token;
                        return _Token;
                    }
                }
            }
            finally
            {
                _AuthLock.Release();
            }
        }

        private static string Truncate(string text)
        {
            return text.Length <= 500 ? text : text.Substring(0, 500);
        }

        #endregion
    }
}
