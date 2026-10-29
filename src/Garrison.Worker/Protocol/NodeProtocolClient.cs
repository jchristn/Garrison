namespace Garrison.Worker.Protocol
{
    using System;
    using System.Net.Http;
    using System.Collections.Generic;
    using System.Globalization;
    using Garrison.Core.Models;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Protocol;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Core.Telemetry;
    using Garrison.Sdk;
    using Garrison.Sdk.Http;

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
        private readonly GarrisonTransport _Transport;
        private readonly GarrisonTransport _AuthTransport;
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
            // Every protocol call is an outbound call to the control plane (service control_plane, operation register,
            // heartbeat, lease, watch, drain, started, events, complete, token) with a client span (P13.24, P13.25).
            _Http = new HttpClient(new NodeProtocolOperationHandler(new TelemetryHttpHandler("control_plane", handler)));
            _Http.Timeout = Timeout.InfiniteTimeSpan;
            _Transport = new GarrisonTransport(_BaseUrl, _Http) { AuthMode = AuthModeEnum.Token };
            _AuthTransport = new GarrisonTransport(_BaseUrl, _Http);
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
        /// Watch runs for cancellation (long poll). Returns as soon as the control plane cancels any watched run, or
        /// empty when the wait ends.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token; cancelling it abandons the call (for example to watch a new run).</param>
        /// <returns>Response.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="NodeProtocolException">Thrown when the call fails; status 404 means the control plane does not
        /// offer the watch (an older release) or the node is not registered.</exception>
        public Task<NodeWatchResponse> WatchAsync(NodeWatchRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return PostAsync<NodeWatchResponse>("/v1.0/api/node/watch", request, null, request.WaitMs + _CallTimeoutMs, token);
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
        /// <returns>Response; carries a structured output repair spec when the control plane wants one.</returns>
        public Task<RunCompleteResponse> CompleteAsync(string runId, RunCompleteRequest request, CancellationToken token = default)
        {
            return PostAsync<RunCompleteResponse>("/v1.0/api/node/runs/" + Uri.EscapeDataString(runId) + "/complete", request, runId, _CallTimeoutMs, token);
        }

        /// <summary>Upload private checkpoint or cache bytes using node credentials held outside the harness specification.</summary>
        /// <param name="nodeId">Registered node.</param><param name="assignment">Current assignment.</param><param name="name">Reserved archive name.</param><param name="content">Bounded archive.</param><param name="token">Cancellation.</param><returns>Artifact metadata.</returns>
        public async Task<Artifact> UploadInternalArtifactAsync(string nodeId, RunAssignment assignment, string name, byte[] content, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>
            {
                ["nodeId"] = nodeId, ["tenantId"] = assignment.Spec.TenantId, ["storeId"] = assignment.Spec.Artifacts?.StoreId,
                ["name"] = name, ["epoch"] = assignment.Epoch.ToString(CultureInfo.InvariantCulture),
                ["repairAttempt"] = assignment.Spec.RepairAttempt.ToString(CultureInfo.InvariantCulture)
            };
            string path = "/v1.0/api/node/runs/" + Uri.EscapeDataString(assignment.RunId) + "/artifacts";
            for (int attempt = 0; attempt < 2; attempt++)
            {
                await EnsureTokenAsync(attempt > 0, token).ConfigureAwait(false);
                using CancellationTokenSource timeout = new CancellationTokenSource(_CallTimeoutMs);
                using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, timeout.Token);
                try
                {
                    return await _Transport.SendBinaryAsync<Artifact>(HttpMethod.Post, path, content, query, token: linked.Token).ConfigureAwait(false)
                        ?? throw new NodeProtocolException(0, "Internal archive upload returned no metadata.");
                }
                catch (GarrisonException e) when (e.StatusCode == 401 && attempt == 0) { }
                catch (GarrisonException e) when (e.StatusCode == 409) { throw new StaleLeaseException(assignment.RunId, "Internal archive upload lost its execution lease."); }
                catch (GarrisonException e) { throw new NodeProtocolException(e.StatusCode, "Internal archive upload was rejected.", e); }
            }
            throw new NodeProtocolException(401, "Internal archive upload authentication failed.");
        }

        /// <summary>Write one file back to the run's conversation file space using node credentials, fenced by the lease epoch (AD3.3).</summary>
        /// <param name="nodeId">Registered node.</param><param name="assignment">Current assignment.</param><param name="path">Path inside the space.</param><param name="baseVersion">Version the run started from, 0 for a new file.</param><param name="content">File bytes.</param><param name="token">Cancellation.</param><returns>Commit result.</returns>
        /// <exception cref="StaleLeaseException">Thrown when the node no longer holds the run lease.</exception>
        /// <exception cref="NodeProtocolException">Thrown when the server refuses the upload.</exception>
        public async Task<FileSpaceUploadResult> UploadFileSpaceFileAsync(string nodeId, RunAssignment assignment, string path, int baseVersion, byte[] content, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>
            {
                ["nodeId"] = nodeId, ["tenantId"] = assignment.Spec.TenantId, ["path"] = path,
                ["baseVersion"] = baseVersion.ToString(CultureInfo.InvariantCulture), ["epoch"] = assignment.Epoch.ToString(CultureInfo.InvariantCulture),
                ["repairAttempt"] = assignment.Spec.RepairAttempt.ToString(CultureInfo.InvariantCulture)
            };
            string route = "/v1.0/api/node/runs/" + Uri.EscapeDataString(assignment.RunId) + "/files";
            for (int attempt = 0; attempt < 2; attempt++)
            {
                await EnsureTokenAsync(attempt > 0, token).ConfigureAwait(false);
                using CancellationTokenSource timeout = new CancellationTokenSource(_CallTimeoutMs);
                using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, timeout.Token);
                try
                {
                    return await _Transport.SendBinaryAsync<FileSpaceUploadResult>(HttpMethod.Post, route, content, query, token: linked.Token).ConfigureAwait(false)
                        ?? throw new NodeProtocolException(0, "File space upload returned no result.");
                }
                catch (GarrisonException e) when (e.StatusCode == 401 && attempt == 0) { }
                catch (GarrisonException e) when (e.StatusCode == 409 && e.Message.Contains("StaleFileUpload", StringComparison.Ordinal)) { throw new StaleLeaseException(assignment.RunId, "File space upload lost its execution lease."); }
                catch (GarrisonException e) { throw new NodeProtocolException(e.StatusCode, "File space upload was rejected: " + e.Message, e); }
            }
            throw new NodeProtocolException(401, "File space upload authentication failed.");
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
                _Transport.Dispose();
                _AuthTransport.Dispose();
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
                await EnsureTokenAsync(attempt > 0, token).ConfigureAwait(false);
                using CancellationTokenSource timeout = new CancellationTokenSource(timeoutMs);
                using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, timeout.Token);
                try
                {
                    // Keep the Core protocol serializer's wire contract while sharing SDK HTTP/auth/error transport.
                    string text = await _Transport.SendTextAsync(HttpMethod.Post, path, Serializer.Serialize(body), token: linked.Token).ConfigureAwait(false);
                    return String.IsNullOrWhiteSpace(text) ? new T() : Serializer.Deserialize<T>(text) ?? new T();
                }
                catch (GarrisonException e) when (e.StatusCode == 401 && attempt == 0)
                {
                    // Reauthenticate once with the node credential, then retry the same request.
                }
                catch (GarrisonException e) when (e.StatusCode == 409 && runId != null)
                {
                    throw new StaleLeaseException(runId, "Lease for run " + runId + " is stale: " + Truncate(e.ResponseBody ?? String.Empty));
                }
                catch (GarrisonException e)
                {
                    throw new NodeProtocolException(e.StatusCode, "POST " + path + " returned " + e.StatusCode + ": " + Truncate(e.ResponseBody ?? e.Message), e);
                }
                catch (OperationCanceledException) when (!token.IsCancellationRequested)
                {
                    throw new NodeProtocolException(0, "POST " + path + " timed out after " + timeoutMs + " ms.");
                }
                catch (HttpRequestException e)
                {
                    throw new NodeProtocolException(0, "POST " + path + " failed: " + e.Message, e);
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
                using CancellationTokenSource timeout = new CancellationTokenSource(_CallTimeoutMs);
                using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, timeout.Token);
                try
                {
                    // Separate auth transport never changes the bearer mode of concurrent node calls.
                    Garrison.Sdk.Requests.TokenRequest request = new Garrison.Sdk.Requests.TokenRequest { AccessKey = _AccessKey, SecretKey = _SecretKey };
                    Garrison.Sdk.Responses.TokenResponse? issued = await _AuthTransport.SendAsync<Garrison.Sdk.Responses.TokenResponse>(HttpMethod.Post, "/v1.0/token", request, token: linked.Token).ConfigureAwait(false);
                    if (issued == null || String.IsNullOrEmpty(issued.Token)) throw new NodeProtocolException(200, "Node authentication returned no token.");
                    _Transport.Token = issued.Token;
                    _Token = issued.Token;
                    return _Token;
                }
                catch (GarrisonException e)
                {
                    throw new NodeProtocolException(e.StatusCode, "Node authentication returned " + e.StatusCode + ": " + Truncate(e.ResponseBody ?? e.Message), e);
                }
                catch (OperationCanceledException) when (!token.IsCancellationRequested)
                {
                    throw new NodeProtocolException(0, "Authentication timed out.");
                }
                catch (HttpRequestException e)
                {
                    throw new NodeProtocolException(0, "Authentication failed: " + e.Message, e);
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
