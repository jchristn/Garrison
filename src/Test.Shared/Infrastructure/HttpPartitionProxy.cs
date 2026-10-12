namespace Test.Shared.Infrastructure
{
    using System;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Protocol;
    using Garrison.Core.Serialization;
    using WatsonWebserver;
    using WatsonWebserver.Core;

    /// <summary>
    /// HTTP reverse proxy between a worker and the control plane that can cut the worker off (every request answers
    /// 503 while partitioned), either on demand or automatically right after the control plane hands the worker an
    /// assignment, or right after it acknowledges a run start. Used to partition a worker at exact points of the lease
    /// protocol (P10.20). Thread-safe.
    /// </summary>
    public sealed class HttpPartitionProxy : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Proxy base URL, http://127.0.0.1:port.
        /// </summary>
        public string BaseUrl { get; }

        /// <summary>
        /// Whether requests are currently cut off.
        /// </summary>
        public bool Partitioned
        {
            get
            {
                return Volatile.Read(ref _Partitioned) == 1;
            }
        }

        /// <summary>
        /// Partition right after forwarding a lease response that carries at least one assignment.
        /// </summary>
        public bool PartitionAfterAssignment { get; set; } = false;

        /// <summary>
        /// Partition right after forwarding a successful run start acknowledgement.
        /// </summary>
        public bool PartitionAfterStartAcknowledged { get; set; } = false;

        /// <summary>
        /// Requests refused while partitioned.
        /// </summary>
        public int Refused
        {
            get
            {
                return Volatile.Read(ref _Refused);
            }
        }

        #endregion

        #region Private-Members

        private readonly string _Target;
        private readonly Webserver _Server;
        private readonly HttpClient _Client = new HttpClient();
        private int _Partitioned = 0;
        private int _Refused = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Start proxying to a target base URL on a free 127.0.0.1 port.
        /// </summary>
        /// <param name="targetBaseUrl">Control plane base URL.</param>
        /// <exception cref="ArgumentNullException">Thrown when the target is null or empty.</exception>
        public HttpPartitionProxy(string targetBaseUrl)
        {
            if (String.IsNullOrEmpty(targetBaseUrl)) throw new ArgumentNullException(nameof(targetBaseUrl));
            _Target = targetBaseUrl.TrimEnd('/');
            _Client.Timeout = TimeSpan.FromSeconds(120);
            int port = TestServerHost.FreePort();
            BaseUrl = "http://127.0.0.1:" + port;
            WebserverSettings settings = new WebserverSettings();
            settings.Hostname = "127.0.0.1";
            settings.Port = port;
            _Server = new Webserver(settings, ForwardAsync);
            _Server.Start();
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Cut the worker off.
        /// </summary>
        public void Partition()
        {
            Interlocked.Exchange(ref _Partitioned, 1);
        }

        /// <summary>
        /// Reconnect the worker.
        /// </summary>
        public void Heal()
        {
            Interlocked.Exchange(ref _Partitioned, 0);
        }

        /// <summary>
        /// Stop the proxy.
        /// </summary>
        public void Dispose()
        {
            _Server.Stop();
            if (_Server is IDisposable disposable) disposable.Dispose();
            _Client.Dispose();
        }

        #endregion

        #region Private-Methods

        private async Task ForwardAsync(HttpContextBase context)
        {
            if (Partitioned)
            {
                Interlocked.Increment(ref _Refused);
                await SendAsync(context, 503, "application/json", "{\"error\":\"ServiceUnavailable\",\"code\":\"Partitioned\",\"message\":\"Test partition.\"}").ConfigureAwait(false);
                return;
            }

            string path = context.Request.Url.RawWithQuery;
            using (HttpRequestMessage request = new HttpRequestMessage(new System.Net.Http.HttpMethod(context.Request.Method.ToString()), _Target + path))
            {
                byte[]? body = context.Request.DataAsBytes;
                if (body != null && body.Length > 0)
                {
                    request.Content = new ByteArrayContent(body);
                    string? contentType = context.Request.ContentType;
                    if (!String.IsNullOrEmpty(contentType)) request.Content.Headers.TryAddWithoutValidation("Content-Type", contentType);
                }
                foreach (string? key in context.Request.Headers.AllKeys)
                {
                    if (key == null) continue;
                    if (String.Equals(key, "Host", StringComparison.OrdinalIgnoreCase) || String.Equals(key, "Content-Length", StringComparison.OrdinalIgnoreCase) || String.Equals(key, "Content-Type", StringComparison.OrdinalIgnoreCase)) continue;
                    request.Headers.TryAddWithoutValidation(key, context.Request.Headers[key]);
                }

                HttpResponseMessage response;
                try
                {
                    response = await _Client.SendAsync(request, context.Token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is HttpRequestException || e is TaskCanceledException)
                {
                    await SendAsync(context, 502, "application/json", "{\"error\":\"BadGateway\",\"code\":\"ProxyFailed\",\"message\":\"Upstream failed.\"}").ConfigureAwait(false);
                    return;
                }

                using (response)
                {
                    string text = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                    string contentType = response.Content.Headers.ContentType?.ToString() ?? "application/json";

                    // Decide before relaying, so the worker's next call already meets the partition.
                    if (response.IsSuccessStatusCode)
                    {
                        string raw = context.Request.Url.RawWithoutQuery;
                        if (PartitionAfterAssignment && raw.EndsWith("/v1.0/api/node/lease", StringComparison.Ordinal))
                        {
                            NodeLeaseResponse? lease = Serializer.Deserialize<NodeLeaseResponse>(text);
                            if (lease != null && lease.Assignments.Any()) Partition();
                        }
                        if (PartitionAfterStartAcknowledged && raw.EndsWith("/started", StringComparison.Ordinal)) Partition();
                    }
                    await SendAsync(context, (int)response.StatusCode, contentType, text).ConfigureAwait(false);
                }
            }
        }

        private static async Task SendAsync(HttpContextBase context, int status, string contentType, string body)
        {
            context.Response.StatusCode = status;
            context.Response.ContentType = contentType;
            await context.Response.Send(body).ConfigureAwait(false);
        }

        #endregion
    }
}
