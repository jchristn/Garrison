namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Collections.Specialized;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using System.Threading.Channels;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Settings;
    using SyslogLogging;
    using WatsonWebserver.Core;

    /// <summary>
    /// Captures every completed HTTP request into request history. Entries are built synchronously from the
    /// context, queued on a bounded channel (dropped when full, never blocking the response), and written by a
    /// background loop. Secret headers and bodies on secret-bearing routes are redacted. Thread-safe.
    /// </summary>
    public class RequestHistoryCaptureService : IRequestObserver, IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Value written in place of redacted headers and bodies.
        /// </summary>
        public static readonly string Redacted = "[redacted]";

        /// <summary>
        /// Entries dropped because the queue was full.
        /// </summary>
        public long Dropped
        {
            get
            {
                return Interlocked.Read(ref _Dropped);
            }
        }

        #endregion

        #region Private-Members

        private static readonly HashSet<string> _RedactedHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "authorization", "proxy-authorization", "cookie", "set-cookie", "x-token", "x-secret-key", "x-api-key", "x-signature", "x-password"
        };

        private const string NodeProtocolPrefix = "/v1.0/api/node/";
        private static readonly string[] _SecretPathFragments = new string[] { "/secrets", "/token", "/credentials", "/node/heartbeat", "/node/lease", "/users", "/manifests/apply", "/v1.0/api/settings" };
        private static readonly string[] _SecretQueryFragments = new string[] { "token", "secret", "password", "ticket", "key", "signature" };

        private readonly DatabaseDriverBase _Database;
        private readonly RequestHistorySettings _Settings;
        private readonly ClusterSettingsService _Cluster;
        private readonly LoggingModule _Logging;
        private readonly Channel<RequestHistoryEntry> _Queue;
        private readonly CancellationTokenSource _Stopping = new CancellationTokenSource();
        private Task? _Writer = null;
        private long _Dropped = 0;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="settings">Request history settings (body limits, read live).</param>
        /// <param name="cluster">Cluster settings (RequestHistory.Enabled, read live).</param>
        /// <param name="logging">Logging.</param>
        /// <param name="capacity">Queue capacity. Minimum 100, maximum 1000000, default 10000.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public RequestHistoryCaptureService(DatabaseDriverBase database, RequestHistorySettings settings, ClusterSettingsService cluster, LoggingModule logging, int capacity = 10000)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Settings = settings ?? throw new ArgumentNullException(nameof(settings));
            _Cluster = cluster ?? throw new ArgumentNullException(nameof(cluster));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            BoundedChannelOptions options = new BoundedChannelOptions(Math.Clamp(capacity, 100, 1000000));
            options.FullMode = BoundedChannelFullMode.DropWrite;
            options.SingleReader = true;
            _Queue = Channel.CreateBounded<RequestHistoryEntry>(options);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether capture is currently enabled.
        /// </summary>
        /// <returns>True when enabled.</returns>
        public bool Enabled()
        {
            return _Cluster.GetBool("RequestHistory.Enabled");
        }

        /// <summary>
        /// Start the background writer.
        /// </summary>
        public void Start()
        {
            if (_Writer != null) return;
            _Writer = Task.Run(() => WriteLoopAsync(_Stopping.Token));
        }

        /// <summary>
        /// Stop the writer after draining queued entries (bounded wait).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task StopAsync(CancellationToken token = default)
        {
            _Queue.Writer.TryComplete();
            if (_Writer == null) return;
            try
            {
                await _Writer.WaitAsync(TimeSpan.FromSeconds(5), token).ConfigureAwait(false);
            }
            catch (TimeoutException)
            {
                _Stopping.Cancel();
            }
            catch (OperationCanceledException)
            {
                _Stopping.Cancel();
            }
        }

        /// <summary>
        /// Whether a completed request should be captured: capture is enabled, and the request is not a successful worker
        /// node protocol call while RequestHistory.CaptureNodeProtocol is off. A node call that failed is captured; one the
        /// worker abandoned (it drops its cancellation watch whenever its set of runs changes) is not a failure.
        /// </summary>
        /// <param name="path">Request path without the query.</param>
        /// <param name="statusCode">Response status code.</param>
        /// <param name="aborted">True when the client hung up before the answer.</param>
        /// <returns>True to capture.</returns>
        public bool ShouldCapture(string? path, int statusCode, bool aborted)
        {
            if (!Enabled()) return false;
            if (path == null || !path.StartsWith(NodeProtocolPrefix, StringComparison.OrdinalIgnoreCase)) return true;
            if (_Cluster.GetBool("RequestHistory.CaptureNodeProtocol")) return true;
            return !aborted && statusCode >= 400;
        }

        /// <inheritdoc />
        public void Observe(HttpContextBase context)
        {
            if (context == null || !ShouldCapture(context.Request.Url.RawWithoutQuery, context.Response.StatusCode, context.RequestAborted)) return;
            try
            {
                RequestHistoryEntry entry = Build(context);
                if (!_Queue.Writer.TryWrite(entry))
                {
                    Interlocked.Increment(ref _Dropped);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.RequestHistoryCaptured, "result", "dropped");
                }
            }
            catch (Exception e)
            {
                _Logging.Debug("[RequestHistory] capture failed: " + e.Message);
            }
        }

        /// <summary>
        /// Build an entry from a completed request.
        /// </summary>
        /// <param name="context">HTTP context.</param>
        /// <returns>Entry.</returns>
        public RequestHistoryEntry Build(HttpContextBase context)
        {
            RequestHistoryEntry entry = new RequestHistoryEntry();
            entry.Method = context.Request.Method.ToString();
            entry.Path = Truncate(context.Request.Url.RawWithoutQuery ?? String.Empty, 1024);
            entry.Url = RedactQuery(context.Request.Url.RawWithQuery ?? entry.Path);
            entry.StatusCode = context.Response.StatusCode;
            entry.DurationMs = Math.Round(context.Timestamp.TotalMs ?? 0, 3);
            entry.CreatedUtc = context.Timestamp.Start;
            entry.CompletedUtc = context.Timestamp.End ?? DateTime.UtcNow;
            entry.SourceIp = context.Request.Source.IpAddress;

            if (context.Metadata is RequestContext ctx && ctx.IsAuthenticated)
            {
                entry.TenantId = ctx.TenantId;
                entry.UserId = ctx.UserId;
                entry.PrincipalName = ctx.PrincipalName;
            }

            AddHeaders(entry, context.Request.Headers, HeaderDirectionEnum.Request);
            AddHeaders(entry, context.Response.Headers, HeaderDirectionEnum.Response);

            bool secretRoute = IsSecretRoute(entry.Path) || entry.Path.Contains("/artifact-download/", StringComparison.Ordinal)
                || (entry.Path.Contains("/artifacts", StringComparison.Ordinal) && (entry.Method == "POST" || entry.Path.EndsWith("/content", StringComparison.Ordinal)));
            string requestBody = SafeRequestBody(context);
            string responseBody = SafeResponseBody(context);
            long requestBytes = Encoding.UTF8.GetByteCount(requestBody);
            long responseBytes = Encoding.UTF8.GetByteCount(responseBody);

            entry.RequestBodyBytes = requestBytes;
            entry.ResponseBodyBytes = responseBytes;
            if (secretRoute)
            {
                entry.RequestBody = requestBytes > 0 ? Redacted : null;
                entry.ResponseBody = responseBytes > 0 ? Redacted : null;
            }
            else
            {
                entry.RequestBody = Clip(requestBody, _Settings.MaxRequestBodyBytes, out bool requestTruncated);
                entry.RequestBodyTruncated = requestTruncated;
                entry.ResponseBody = Clip(responseBody, _Settings.MaxResponseBodyBytes, out bool responseTruncated);
                entry.ResponseBodyTruncated = responseTruncated;
            }
            return entry;
        }

        /// <summary>
        /// Whether a path carries secrets in its bodies.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <returns>True when bodies must be redacted.</returns>
        public static bool IsSecretRoute(string? path)
        {
            if (String.IsNullOrEmpty(path)) return false;
            foreach (string fragment in _SecretPathFragments)
            {
                if (path.IndexOf(fragment, StringComparison.OrdinalIgnoreCase) >= 0) return true;
            }
            return false;
        }

        /// <summary>
        /// Replace the value of every query parameter whose name suggests a credential (token, secret, password, ticket,
        /// key, signature), for example the WebSocket <c>token</c> and the artifact download <c>ticket</c>.
        /// </summary>
        /// <param name="url">Path with an optional query string.</param>
        /// <returns>The URL with sensitive query values replaced by <see cref="Redacted"/>.</returns>
        public static string RedactQuery(string? url)
        {
            if (String.IsNullOrEmpty(url)) return String.Empty;
            int question = url.IndexOf('?');
            if (question < 0 || question == url.Length - 1) return url;
            string[] pairs = url.Substring(question + 1).Split('&');
            for (int i = 0; i < pairs.Length; i++)
            {
                int equals = pairs[i].IndexOf('=');
                string name = equals < 0 ? pairs[i] : pairs[i].Substring(0, equals);
                string lower = Uri.UnescapeDataString(name).ToLowerInvariant();
                if (_SecretQueryFragments.Any(f => lower.Contains(f, StringComparison.Ordinal))) pairs[i] = name + "=" + Redacted;
            }
            return url.Substring(0, question + 1) + String.Join("&", pairs);
        }

        /// <summary>
        /// Whether a header must be redacted.
        /// </summary>
        /// <param name="name">Header name.</param>
        /// <returns>True when redacted.</returns>
        public static bool IsSecretHeader(string name)
        {
            if (String.IsNullOrEmpty(name)) return false;
            if (_RedactedHeaders.Contains(name)) return true;
            string lower = name.ToLowerInvariant();
            return lower.Contains("token") || lower.Contains("secret") || lower.Contains("api-key") || lower.Contains("password");
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
                _Stopping.Cancel();
                _Stopping.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task WriteLoopAsync(CancellationToken token)
        {
            try
            {
                while (await _Queue.Reader.WaitToReadAsync(token).ConfigureAwait(false))
                {
                    while (_Queue.Reader.TryRead(out RequestHistoryEntry? entry))
                    {
                        try
                        {
                            await _Database.RequestHistory.CreateAsync(entry, token).ConfigureAwait(false);
                            GarrisonMetrics.Count(GarrisonMetricCatalog.RequestHistoryCaptured, "result", "written");
                        }
                        catch (OperationCanceledException)
                        {
                            return;
                        }
                        catch (Exception e)
                        {
                            GarrisonMetrics.Count(GarrisonMetricCatalog.RequestHistoryCaptured, "result", "error");
                            _Logging.Warn("[RequestHistory] persist failed: " + e.Message);
                        }
                    }
                }
            }
            catch (OperationCanceledException)
            {
            }
        }

        private static void AddHeaders(RequestHistoryEntry entry, NameValueCollection? headers, HeaderDirectionEnum direction)
        {
            if (headers == null) return;
            foreach (string? key in headers.AllKeys)
            {
                if (String.IsNullOrEmpty(key)) continue;
                RequestHistoryHeader header = new RequestHistoryHeader();
                header.Direction = direction;
                header.Name = Truncate(key, 256);
                header.Value = IsSecretHeader(key) ? Redacted : (headers[key] ?? String.Empty);
                entry.Headers.Add(header);
            }
        }

        private static string? Clip(string body, int maxBytes, out bool truncated)
        {
            truncated = false;
            if (String.IsNullOrEmpty(body)) return null;
            byte[] bytes = Encoding.UTF8.GetBytes(body);
            if (bytes.Length <= maxBytes) return body;
            truncated = true;
            if (maxBytes <= 0) return String.Empty;
            return Encoding.UTF8.GetString(bytes, 0, maxBytes);
        }

        private static string Truncate(string value, int max)
        {
            return value.Length <= max ? value : value.Substring(0, max);
        }

        private static string SafeRequestBody(HttpContextBase context)
        {
            try
            {
                return context.Request.DataAsString ?? String.Empty;
            }
            catch (Exception)
            {
                return String.Empty;
            }
        }

        private static string SafeResponseBody(HttpContextBase context)
        {
            try
            {
                return context.Response.DataAsString ?? String.Empty;
            }
            catch (Exception)
            {
                return String.Empty;
            }
        }

        #endregion
    }
}
