namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Collections.Specialized;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Backplane;
    using WatsonWebserver;
    using WatsonWebserver.Core;

    /// <summary>
    /// The public MCP endpoint (G-1). Voltaic keeps MCP sessions in process memory and rejects session identifiers it did
    /// not issue, so Garrison serves the public MCP port itself and forwards each request to Voltaic on a loopback port.
    /// Clients receive cluster session identifiers backed by rows in mcp_sessions. When a request names a cluster
    /// session this replica has not served yet (it was opened on another replica, or this replica restarted), the proxy
    /// replays the initialize handshake against its own Voltaic endpoint for the same principal and maps the cluster
    /// identifier to the new local session. No sticky routing is needed. The proxy authenticates each request once and
    /// hands the principal to Voltaic in headers protected by a per-process secret, so signed-request nonces are used
    /// once. Thread-safe.
    /// </summary>
    public class McpClusterProxy : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Header carrying the per-process secret that marks a request to the internal endpoint as coming from this proxy.
        /// </summary>
        public static readonly string ProxySecretHeader = "x-garrison-proxy-secret";

        /// <summary>
        /// Header carrying the authenticated principal of a proxied request.
        /// </summary>
        public static readonly string ProxyPrincipalHeader = "x-garrison-proxy-principal";

        /// <summary>
        /// Header carrying the base64 JSON claims of a proxied request.
        /// </summary>
        public static readonly string ProxyClaimsHeader = "x-garrison-proxy-claims";

        /// <summary>
        /// Header carrying the client address of a proxied request.
        /// </summary>
        public static readonly string ProxyClientHeader = "x-garrison-proxy-client";

        /// <summary>
        /// Seconds between database updates of a session's last use from this replica. Minimum 1, maximum 3600,
        /// default 30. A session deleted or expired elsewhere is noticed within this interval at the latest; the
        /// McpSessionClosed backplane message usually makes it immediate.
        /// </summary>
        public int TouchIntervalSeconds
        {
            get
            {
                return _TouchIntervalSeconds;
            }
            set
            {
                _TouchIntervalSeconds = Math.Clamp(value, 1, 3600);
            }
        }

        /// <summary>
        /// Called with the authenticated caller and the body of every POST before it is relayed to the internal
        /// endpoint, so the MCP server can prepare for it (it registers agent tools named in tools/call). Null to skip.
        /// Exceptions are logged and the request is relayed anyway.
        /// </summary>
        public Func<RequestContext, byte[], CancellationToken, Task>? BeforeForward { get; set; } = null;

        /// <summary>
        /// Sessions this replica currently maps to local sessions.
        /// </summary>
        public int LocalSessions
        {
            get
            {
                return _Sessions.Count;
            }
        }

        /// <summary>
        /// Handshakes replayed on this replica for sessions opened elsewhere (or before a restart).
        /// </summary>
        public long Rehydrations
        {
            get
            {
                return Interlocked.Read(ref _Rehydrations);
            }
        }

        #endregion

        #region Private-Members

        private static readonly HashSet<string> _HopHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Host", "Connection", "Keep-Alive", "Transfer-Encoding", "Content-Length", "Expect", "Proxy-Connection", "TE", "Trailer", "Upgrade", "Date", "Server"
        };

        private readonly ServerContext _Context;
        private readonly string _InternalBaseUrl;
        private readonly string _Secret;
        private readonly Action<string> _RemoveLocalSession;
        private readonly HttpClient _Http;
        private readonly ConcurrentDictionary<string, McpLocalSession> _Sessions = new ConcurrentDictionary<string, McpLocalSession>(StringComparer.Ordinal);
        private readonly SemaphoreSlim _RehydrateLock = new SemaphoreSlim(1, 1);
        private readonly string _Header = "[McpProxy] ";
        private Webserver? _Server = null;
        private IEventBackplane? _Backplane = null;
        private int _TouchIntervalSeconds = 30;
        private long _Rehydrations = 0;
        private readonly GaugeRegistration _SessionGauge;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <param name="internalPort">Loopback port of the internal Voltaic endpoint.</param>
        /// <param name="secret">Per-process secret shared with the internal endpoint's authentication handler.</param>
        /// <param name="removeLocalSession">Ends a session on the internal endpoint.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public McpClusterProxy(ServerContext context, int internalPort, string secret, Action<string> removeLocalSession)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            if (String.IsNullOrEmpty(secret)) throw new ArgumentNullException(nameof(secret));
            _Secret = secret;
            _RemoveLocalSession = removeLocalSession ?? throw new ArgumentNullException(nameof(removeLocalSession));
            _InternalBaseUrl = "http://127.0.0.1:" + internalPort;

            SocketsHttpHandler handler = new SocketsHttpHandler();
            handler.AllowAutoRedirect = false;
            handler.UseCookies = false;
            handler.UseProxy = false;
            handler.AutomaticDecompression = DecompressionMethods.None;
            handler.PooledConnectionIdleTimeout = TimeSpan.FromMinutes(1);
            _Http = new HttpClient(new TelemetryHttpHandler("mcp_internal", handler));
            _Http.Timeout = Timeout.InfiniteTimeSpan;
            _SessionGauge = GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.McpSessionsActive, () => _Sessions.Count);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start listening on the public MCP port and follow session closures from other replicas.
        /// </summary>
        public void Start()
        {
            WebserverSettings settings = new WebserverSettings();
            settings.Hostname = _Context.Settings.Mcp.Hostname;
            settings.Port = _Context.Settings.Mcp.Port;
            settings.Headers.DefaultHeaders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            settings.IO.MaxRequestBodySize = _Context.Settings.Mcp.MaxMessageSize;
            _Server = new Webserver(settings, HandleAsync);
            _Server.Routes.Preflight = HandleAsync;
            _Server.Start();

            _Backplane = _Context.TryGet<IEventBackplane>();
            if (_Backplane != null) _Backplane.MessageReceived += OnBackplaneMessage;
        }

        /// <summary>
        /// Stop listening.
        /// </summary>
        public void Stop()
        {
            if (_Backplane != null) _Backplane.MessageReceived -= OnBackplaneMessage;
            _Backplane = null;
            try
            {
                _Server?.Stop();
            }
            catch (Exception e)
            {
                _Context.Logging.Warn(_Header + "error stopping: " + e.Message);
            }
        }

        /// <summary>
        /// Forget a cluster session on this replica and end its local session (another replica closed it).
        /// </summary>
        /// <param name="clusterId">Cluster session identifier.</param>
        public void Forget(string clusterId)
        {
            if (String.IsNullOrEmpty(clusterId)) return;
            if (_Sessions.TryRemove(clusterId, out McpLocalSession? local)) _RemoveLocalSession(local.LocalId);
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
                Stop();
                if (_Server is IDisposable disposable) disposable.Dispose();
                _Http.Dispose();
                _RehydrateLock.Dispose();
                _SessionGauge.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private void OnBackplaneMessage(object? sender, BackplaneMessage message)
        {
            if (message.Kind == BackplaneMessageKindEnum.McpSessionClosed && !String.IsNullOrEmpty(message.Subject)) Forget(message.Subject!);
            if (message.Kind == BackplaneMessageKindEnum.McpRequestCancelled && !String.IsNullOrEmpty(message.Subject)) _ = RelayCancelAsync(message.Subject!);
        }

        private async Task RelayCancelAsync(string subject)
        {
            int separator = subject.IndexOf('\n');
            if (separator <= 0 || separator == subject.Length - 1) return;
            string clusterId = subject.Substring(0, separator);
            string requestId = subject.Substring(separator + 1);
            if (!_Sessions.TryGetValue(clusterId, out McpLocalSession? local) || local.Caller == null) return;
            try
            {
                byte[] body = Encoding.UTF8.GetBytes("{\"jsonrpc\":\"2.0\",\"method\":\"notifications/cancelled\",\"params\":{\"requestId\":" + requestId + ",\"reason\":\"cancelled on another replica\"}}");
                using (HttpRequestMessage request = BuildInternalRequest("POST", _Context.Settings.Mcp.Path, body, local.Caller, null))
                {
                    request.Headers.TryAddWithoutValidation(Voltaic.Mcp.McpProtocol.SessionIdHeader, local.LocalId);
                    using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10)))
                    using (HttpResponseMessage response = await _Http.SendAsync(request, timeout.Token).ConfigureAwait(false))
                    {
                        _Context.Logging.Debug(_Header + "relayed a cancellation for session " + clusterId + ": " + (int)response.StatusCode);
                    }
                }
            }
            catch (Exception e) when (e is HttpRequestException || e is IOException || e is OperationCanceledException)
            {
                _Context.Logging.Debug(_Header + "could not relay a cancellation for session " + clusterId + ": " + e.Message);
            }
        }

        private void PublishCancellation(string clusterId, byte[]? body)
        {
            if (_Backplane == null || body == null || body.Length == 0 || body.Length > 4096) return;
            McpCancelledEnvelope? envelope;
            try
            {
                envelope = Serializer.Deserialize<McpCancelledEnvelope>(Encoding.UTF8.GetString(body));
            }
            catch (Exception e) when (e is JsonException || e is NotSupportedException || e is ArgumentException)
            {
                return;
            }
            if (envelope == null || !String.Equals(envelope.Method, "notifications/cancelled", StringComparison.Ordinal)) return;
            JsonElement? requestId = envelope.Params?.RequestId;
            if (!requestId.HasValue || (requestId.Value.ValueKind != JsonValueKind.String && requestId.Value.ValueKind != JsonValueKind.Number)) return;
            string raw = requestId.Value.GetRawText();
            if (clusterId.Length + raw.Length + 1 > 256) return;
            _Backplane.Publish(new BackplaneMessage(BackplaneMessageKindEnum.McpRequestCancelled, clusterId + "\n" + raw));
        }

        private async Task HandleAsync(HttpContextBase context)
        {
            try
            {
                await ProxyAsync(context).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                // The client went away.
            }
            catch (Exception e) when (e is HttpRequestException || e is IOException)
            {
                _Context.Logging.Warn(_Header + "internal MCP endpoint failed: " + e.Message);
                if (!context.Response.ResponseStarted) await SendJsonErrorAsync(context, 502, null, -32603, "The MCP endpoint is not available.").ConfigureAwait(false);
            }
            catch (Exception e) when (DatabaseFailures.Classify(e) != DatabaseFailureEnum.None)
            {
                // Authentication and session lookups read the database; an outage answers a retryable JSON-RPC error.
                DatabaseFailureEnum failure = DatabaseFailures.Classify(e);
                _Context.Logging.Warn(_Header + "database " + failure.ToString().ToLowerInvariant() + " while relaying an MCP request: " + e.Message);
                if (!context.Response.ResponseStarted)
                {
                    context.Response.Headers["Retry-After"] = Math.Max(1, _Context.Settings.Rest.DatabaseRetryAfterSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture);
                    await SendJsonErrorAsync(context, 503, null, -32603, failure == DatabaseFailureEnum.Busy ? "DatabaseBusy: the database has no free connections right now; retry later." : "DatabaseUnavailable: the database cannot be reached right now; retry later.").ConfigureAwait(false);
                }
            }
        }

        private async Task ProxyAsync(HttpContextBase context)
        {
            CancellationToken token = context.Token;
            string method = context.Request.MethodRaw ?? context.Request.Method.ToString();
            string pathAndQuery = context.Request.Url.RawWithQuery;
            string path = context.Request.Url.RawWithoutQuery;
            byte[]? body = context.Request.DataAsBytes;
            NameValueCollection headers = context.Request.Headers;
            string? clientAddress = context.Request.Source.IpAddress;

            RequestContext? caller = null;
            if (!String.Equals(method, "OPTIONS", StringComparison.OrdinalIgnoreCase))
            {
                int queryIndex = pathAndQuery.IndexOf('?');
                string? query = queryIndex >= 0 ? pathAndQuery.Substring(queryIndex + 1) : null;
                caller = await _Context.Authentication.ResolveAsync(headers, method, path, query, body, clientAddress, token).ConfigureAwait(false);
                if (!caller.IsAuthenticated) caller = null;
            }

            if (caller != null && body != null && body.Length > 0 && BeforeForward != null && String.Equals(method, "POST", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    await BeforeForward(caller, body, token).ConfigureAwait(false);
                }
                catch (Exception e) when (!(e is OperationCanceledException))
                {
                    _Context.Logging.Warn(_Header + "preparing a request failed: " + e.Message);
                }
            }

            string? clusterId = headers[Voltaic.Mcp.McpProtocol.SessionIdHeader];
            if (String.IsNullOrEmpty(clusterId) || caller == null)
            {
                // No session yet (initialize, a stateless request, CORS), or an unauthenticated request that the
                // internal endpoint answers with its challenge.
                using (HttpResponseMessage response = await ForwardAsync(method, pathAndQuery, headers, body, null, caller, clientAddress, token).ConfigureAwait(false))
                {
                    string? issued = HeaderValue(response, Voltaic.Mcp.McpProtocol.SessionIdHeader);
                    string? publicId = null;
                    if (caller != null && String.IsNullOrEmpty(clusterId) && !String.IsNullOrEmpty(issued) && response.IsSuccessStatusCode)
                    {
                        publicId = await RegisterAsync(caller, issued!, body, token).ConfigureAwait(false);
                    }
                    await RelayAsync(context, response, publicId, token).ConfigureAwait(false);
                }
                return;
            }

            string principal = PrincipalClaims.Principal(caller);
            McpLocalSession? local = await ResolveAsync(clusterId!, principal, caller, clientAddress, token).ConfigureAwait(false);
            if (local == null)
            {
                await SendSessionNotFoundAsync(context, body).ConfigureAwait(false);
                return;
            }

            if (String.Equals(method, "DELETE", StringComparison.OrdinalIgnoreCase))
            {
                await CloseAsync(context, local, method, pathAndQuery, headers, body, caller, clientAddress, token).ConfigureAwait(false);
                return;
            }

            local.Caller = caller;
            if (String.Equals(method, "POST", StringComparison.OrdinalIgnoreCase)) PublishCancellation(clusterId!, body);
            HttpResponseMessage first = await ForwardAsync(method, pathAndQuery, headers, body, local.LocalId, caller, clientAddress, token).ConfigureAwait(false);
            if (await IsSessionNotFoundAsync(first, token).ConfigureAwait(false))
            {
                // The local session expired on the internal endpoint while the cluster session lives on: replay the
                // handshake and try once more.
                first.Dispose();
                Forget(clusterId!);
                local = await ResolveAsync(clusterId!, principal, caller, clientAddress, token).ConfigureAwait(false);
                if (local == null)
                {
                    await SendSessionNotFoundAsync(context, body).ConfigureAwait(false);
                    return;
                }
                first = await ForwardAsync(method, pathAndQuery, headers, body, local.LocalId, caller, clientAddress, token).ConfigureAwait(false);
            }

            using (first)
            {
                await RelayAsync(context, first, clusterId, token).ConfigureAwait(false);
            }
        }

        private async Task<McpLocalSession?> ResolveAsync(string clusterId, string principal, RequestContext caller, string? clientAddress, CancellationToken token)
        {
            DateTime now = DateTime.UtcNow;
            if (_Sessions.TryGetValue(clusterId, out McpLocalSession? known))
            {
                if (!String.Equals(known.Principal, principal, StringComparison.Ordinal)) return null;
                if ((now - known.LastTouchUtc).TotalSeconds < _TouchIntervalSeconds) return known;
                if (await _Context.Database.McpSessions.TouchAsync(clusterId, now, now.AddSeconds(_Context.Settings.Mcp.SessionIdleTimeoutSeconds), token).ConfigureAwait(false))
                {
                    known.LastTouchUtc = now;
                    return known;
                }
                Forget(clusterId);
                return null;
            }

            await _RehydrateLock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                if (_Sessions.TryGetValue(clusterId, out McpLocalSession? raced)) return String.Equals(raced.Principal, principal, StringComparison.Ordinal) ? raced : null;

                McpSession? stored = await _Context.Database.McpSessions.ReadActiveAsync(clusterId, now, token).ConfigureAwait(false);
                if (stored == null || !String.Equals(stored.Principal, principal, StringComparison.Ordinal)) return null;

                string? localId = await ReplayHandshakeAsync(stored, caller, clientAddress, token).ConfigureAwait(false);
                if (localId == null) return null;
                await _Context.Database.McpSessions.TouchAsync(clusterId, now, now.AddSeconds(_Context.Settings.Mcp.SessionIdleTimeoutSeconds), token).ConfigureAwait(false);

                McpLocalSession created = new McpLocalSession();
                created.ClusterId = clusterId;
                created.LocalId = localId;
                created.Principal = principal;
                created.LastTouchUtc = now;
                _Sessions[clusterId] = created;
                Interlocked.Increment(ref _Rehydrations);
                GarrisonMetrics.Count(GarrisonMetricCatalog.McpSessions, "event", "restored");
                _Context.Logging.Debug(_Header + "session " + clusterId + " served here as local session " + localId);
                return created;
            }
            finally
            {
                _RehydrateLock.Release();
            }
        }

        private async Task<string?> ReplayHandshakeAsync(McpSession stored, RequestContext caller, string? clientAddress, CancellationToken token)
        {
            McpInitializeEnvelope initialize = new McpInitializeEnvelope();
            initialize.Id = "garrison-session-replay";
            initialize.Method = "initialize";
            initialize.Params = new McpInitializeParams();
            initialize.Params.ProtocolVersion = stored.ProtocolVersion;
            initialize.Params.ClientInfo = new McpClientInfoRecord();
            initialize.Params.ClientInfo.Name = stored.ClientName ?? "garrison-replayed-client";
            initialize.Params.ClientInfo.Version = stored.ClientVersion ?? "0";

            string? localId;
            using (HttpRequestMessage request = BuildInternalRequest("POST", _Context.Settings.Mcp.Path, Encoding.UTF8.GetBytes(Serializer.Serialize(initialize)), caller, clientAddress))
            {
                using (HttpResponseMessage response = await _Http.SendAsync(request, HttpCompletionOption.ResponseContentRead, token).ConfigureAwait(false))
                {
                    localId = HeaderValue(response, Voltaic.Mcp.McpProtocol.SessionIdHeader);
                    if (!response.IsSuccessStatusCode || String.IsNullOrEmpty(localId))
                    {
                        _Context.Logging.Warn(_Header + "could not replay the handshake of session " + stored.Id + ": HTTP " + (int)response.StatusCode);
                        return null;
                    }
                }
            }

            using (HttpRequestMessage initialized = BuildInternalRequest("POST", _Context.Settings.Mcp.Path, Encoding.UTF8.GetBytes(Serializer.Serialize(new McpNotificationEnvelope())), caller, clientAddress))
            {
                initialized.Headers.TryAddWithoutValidation(Voltaic.Mcp.McpProtocol.SessionIdHeader, localId);
                using (HttpResponseMessage response = await _Http.SendAsync(initialized, HttpCompletionOption.ResponseContentRead, token).ConfigureAwait(false))
                {
                    if (!response.IsSuccessStatusCode) _Context.Logging.Debug(_Header + "notifications/initialized on a replayed session returned HTTP " + (int)response.StatusCode);
                }
            }
            return localId;
        }

        private async Task<string?> RegisterAsync(RequestContext caller, string localId, byte[]? body, CancellationToken token)
        {
            McpInitializeEnvelope? initialize = null;
            if (body != null && body.Length > 0)
            {
                try
                {
                    initialize = Serializer.Deserialize<McpInitializeEnvelope>(Encoding.UTF8.GetString(body));
                }
                catch (Exception e) when (e is JsonException || e is NotSupportedException)
                {
                    initialize = null;
                }
            }

            DateTime now = DateTime.UtcNow;
            McpSession session = new McpSession();
            session.Principal = PrincipalClaims.Principal(caller);
            session.ProtocolVersion = initialize?.Params?.ProtocolVersion ?? String.Empty;
            session.ClientName = initialize?.Params?.ClientInfo?.Name;
            session.ClientVersion = initialize?.Params?.ClientInfo?.Version;
            session.CreatedUtc = now;
            session.LastSeenUtc = now;
            session.ExpiresUtc = now.AddSeconds(_Context.Settings.Mcp.SessionIdleTimeoutSeconds);
            await _Context.Database.McpSessions.CreateAsync(session, token).ConfigureAwait(false);

            McpLocalSession local = new McpLocalSession();
            local.ClusterId = session.Id;
            local.LocalId = localId;
            local.Principal = session.Principal;
            local.LastTouchUtc = now;
            _Sessions[session.Id] = local;
            GarrisonMetrics.Count(GarrisonMetricCatalog.McpSessions, "event", "created");
            return session.Id;
        }

        private async Task CloseAsync(HttpContextBase context, McpLocalSession local, string method, string pathAndQuery, NameValueCollection headers, byte[]? body, RequestContext caller, string? clientAddress, CancellationToken token)
        {
            await _Context.Database.McpSessions.DeleteAsync(local.ClusterId, token).ConfigureAwait(false);
            _Sessions.TryRemove(local.ClusterId, out McpLocalSession? _);
            GarrisonMetrics.Count(GarrisonMetricCatalog.McpSessions, "event", "closed");
            _Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.McpSessionClosed, local.ClusterId));
            using (HttpResponseMessage response = await ForwardAsync(method, pathAndQuery, headers, body, local.LocalId, caller, clientAddress, token).ConfigureAwait(false))
            {
                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    // The local stand-in had already expired; the cluster session is closed all the same.
                    context.Response.StatusCode = 200;
                    await context.Response.Send(token).ConfigureAwait(false);
                    return;
                }
                await RelayAsync(context, response, local.ClusterId, token).ConfigureAwait(false);
            }
        }

        private async Task<HttpResponseMessage> ForwardAsync(string method, string pathAndQuery, NameValueCollection headers, byte[]? body, string? localSessionId, RequestContext? caller, string? clientAddress, CancellationToken token)
        {
            HttpRequestMessage request = new HttpRequestMessage(new System.Net.Http.HttpMethod(method), _InternalBaseUrl + pathAndQuery);
            if (body != null && body.Length > 0) request.Content = new ByteArrayContent(body);

            foreach (string? name in headers.AllKeys)
            {
                if (String.IsNullOrEmpty(name) || _HopHeaders.Contains(name)) continue;
                if (name.StartsWith("x-garrison-proxy-", StringComparison.OrdinalIgnoreCase)) continue;
                if (String.Equals(name, Voltaic.Mcp.McpProtocol.SessionIdHeader, StringComparison.OrdinalIgnoreCase)) continue;
                string? value = headers[name];
                if (value == null) continue;
                if (name.StartsWith("Content-", StringComparison.OrdinalIgnoreCase))
                {
                    if (request.Content == null) request.Content = new ByteArrayContent(Array.Empty<byte>());
                    request.Content.Headers.TryAddWithoutValidation(name, value);
                }
                else
                {
                    request.Headers.TryAddWithoutValidation(name, value);
                }
            }
            if (!String.IsNullOrEmpty(localSessionId)) request.Headers.TryAddWithoutValidation(Voltaic.Mcp.McpProtocol.SessionIdHeader, localSessionId);
            AddInternalAuthentication(request, caller, clientAddress);

            try
            {
                return await _Http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, token).ConfigureAwait(false);
            }
            finally
            {
                request.Dispose();
            }
        }

        private HttpRequestMessage BuildInternalRequest(string method, string path, byte[] body, RequestContext caller, string? clientAddress)
        {
            HttpRequestMessage request = new HttpRequestMessage(new System.Net.Http.HttpMethod(method), _InternalBaseUrl + path);
            request.Content = new ByteArrayContent(body);
            request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));
            AddInternalAuthentication(request, caller, clientAddress);
            return request;
        }

        private void AddInternalAuthentication(HttpRequestMessage request, RequestContext? caller, string? clientAddress)
        {
            request.Headers.TryAddWithoutValidation(ProxySecretHeader, _Secret);
            if (!String.IsNullOrEmpty(clientAddress)) request.Headers.TryAddWithoutValidation(ProxyClientHeader, clientAddress);
            if (caller == null) return;
            request.Headers.TryAddWithoutValidation(ProxyPrincipalHeader, PrincipalClaims.Principal(caller));
            request.Headers.TryAddWithoutValidation(ProxyClaimsHeader, Convert.ToBase64String(Encoding.UTF8.GetBytes(Serializer.Serialize(PrincipalClaims.Encode(caller)))));
        }

        private async Task<bool> IsSessionNotFoundAsync(HttpResponseMessage response, CancellationToken token)
        {
            if (response.StatusCode != HttpStatusCode.NotFound) return false;
            string? mediaType = response.Content.Headers.ContentType?.MediaType;
            if (!String.Equals(mediaType, "application/json", StringComparison.OrdinalIgnoreCase)) return false;
            string text = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
            try
            {
                McpErrorEnvelope? error = Serializer.Deserialize<McpErrorEnvelope>(text);
                return error?.Error != null && error.Error.Code == -32001;
            }
            catch (Exception e) when (e is JsonException || e is NotSupportedException)
            {
                return false;
            }
        }

        private async Task RelayAsync(HttpContextBase context, HttpResponseMessage response, string? publicSessionId, CancellationToken token)
        {
            context.Response.StatusCode = (int)response.StatusCode;
            foreach (KeyValuePair<string, IEnumerable<string>> header in response.Headers.Concat(response.Content.Headers))
            {
                if (_HopHeaders.Contains(header.Key)) continue;
                if (String.Equals(header.Key, "Content-Type", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.ContentType = String.Join(", ", header.Value);
                    continue;
                }
                if (String.Equals(header.Key, Voltaic.Mcp.McpProtocol.SessionIdHeader, StringComparison.OrdinalIgnoreCase))
                {
                    if (!String.IsNullOrEmpty(publicSessionId)) context.Response.Headers.Add(Voltaic.Mcp.McpProtocol.SessionIdHeader, publicSessionId);
                    continue;
                }
                foreach (string value in header.Value) context.Response.Headers.Add(header.Key, value);
            }

            // Only event streams are relayed chunk by chunk. Everything else, including bodyless 202 answers that the
            // internal listener sends chunked, is buffered and sent with a length: Watson's SendChunk writes the
            // terminating chunk twice when the final chunk is empty, and clients reject the trailing bytes (Node's HTTP
            // parser fails with "Expected HTTP/") or read them as the next response on a reused connection. Event
            // streams are marked Connection: close, so a client stops reading at the end of the stream.
            bool streaming = String.Equals(response.Content.Headers.ContentType?.MediaType, "text/event-stream", StringComparison.OrdinalIgnoreCase);
            if (!streaming)
            {
                byte[] bytes = await response.Content.ReadAsByteArrayAsync(token).ConfigureAwait(false);
                if (bytes.Length == 0) await context.Response.Send(token).ConfigureAwait(false);
                else await context.Response.Send(bytes, token).ConfigureAwait(false);
                return;
            }

            context.Response.Headers.Add("Connection", "close");
            context.Response.ChunkedTransfer = true;
            using (Stream stream = await response.Content.ReadAsStreamAsync(token).ConfigureAwait(false))
            {
                byte[] buffer = new byte[16384];
                while (true)
                {
                    int read = await stream.ReadAsync(buffer, 0, buffer.Length, token).ConfigureAwait(false);
                    if (read <= 0) break;
                    byte[] chunk = new byte[read];
                    Buffer.BlockCopy(buffer, 0, chunk, 0, read);
                    await context.Response.SendChunk(chunk, false, token).ConfigureAwait(false);
                }
            }
            await context.Response.SendChunk(Array.Empty<byte>(), true, token).ConfigureAwait(false);
        }

        private async Task SendSessionNotFoundAsync(HttpContextBase context, byte[]? body)
        {
            JsonElement? id = null;
            if (body != null && body.Length > 0 && body[0] == (byte)'{')
            {
                try
                {
                    id = Serializer.Deserialize<McpRequestIdEnvelope>(Encoding.UTF8.GetString(body))?.Id;
                }
                catch (Exception e) when (e is JsonException || e is NotSupportedException)
                {
                    id = null;
                }
            }
            await SendJsonErrorAsync(context, 404, id, -32001, "Session not found. Send an initialize request without an MCP-Session-Id header to start a new session.").ConfigureAwait(false);
        }

        private static async Task SendJsonErrorAsync(HttpContextBase context, int status, JsonElement? id, int code, string message)
        {
            McpErrorEnvelope error = new McpErrorEnvelope();
            error.Id = id;
            error.Error = new McpErrorDetail();
            error.Error.Code = code;
            error.Error.Message = message;
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            await context.Response.Send(Serializer.Serialize(error)).ConfigureAwait(false);
        }

        private static string? HeaderValue(HttpResponseMessage response, string name)
        {
            if (response.Headers.TryGetValues(name, out IEnumerable<string>? values)) return values.FirstOrDefault();
            return null;
        }

        #endregion
    }
}
